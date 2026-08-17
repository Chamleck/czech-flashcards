import AsyncStorage from "@react-native-async-storage/async-storage";

// Вага помилок на рівні АТОМАРНОЇ одиниці питання.
// Для іменників атомарна одиниця — комбінація "слово + відмінок + число".
// Для майбутніх категорій (дієслово+час, займенник+число тощо) — той самий механізм,
// інша атомарна одиниця; comboId лишається просто рядком-ключем.
const KEY = "czech_flashcard_weights_v1";

// Ключ сховища РОЗДІЛЕНО за категорією (іменники/дієслова/adj-pron/майбутні):
// помилки однієї категорії не впливають на інші. Нова категорія автоматично
// отримує власне сховище за своїм categoryId — без додаткового коду.
function storeKey(categoryId: string): string {
  return `${KEY}:${categoryId}`;
}

// Максимум зарезервованих слотів під помилки в одному раунді (з 12). Гарантує,
// що помилкові комбінації реально повертаються (вага ×3 у величезному пулі майже
// непомітна). Решта раунду — звичайний зважений пул.
export const MAX_MISTAKE_SLOTS = 5;

// Базова вага звичайної комбінації. Після помилки — множимо на BOOST.
export const BASE_WEIGHT = 1;
export const BOOST_WEIGHT = 3; // помилкова комбінація випадає ~втричі частіше (не гарантовано)
// Скільки правильних відповідей поспіль повертають вагу до норми (затухання).
const DECAY_AFTER = 2;

// У сховищі тримаємо ЛИШЕ активні "помилкові" комбінації. Значення — скільки правильних
// відповідей поспіль уже дано на цю комбінацію після останньої помилки. Коли лічильник
// сягає DECAY_AFTER, запис видаляється (вага повертається до базової).
export type MistakeStore = Record<string, number>;

// Універсальний ключ комбінації. Роздільник "::" не трапляється в id/відмінках.
export function comboId(entryId: string, part1: string, part2: string): string {
  return `${entryId}::${part1}::${part2}`;
}

export async function loadMistakes(categoryId: string): Promise<MistakeStore> {
  try {
    const raw = await AsyncStorage.getItem(storeKey(categoryId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveMistakes(categoryId: string, store: MistakeStore): Promise<void> {
  try {
    await AsyncStorage.setItem(storeKey(categoryId), JSON.stringify(store));
  } catch {
    // не критично — підмішка помилок просто не збережеться між сесіями
  }
}

// Вага комбінації: підвищена, якщо вона в активному списку помилок, інакше базова.
export function weightFor(store: MistakeStore, id: string): number {
  return id in store ? BOOST_WEIGHT : BASE_WEIGHT;
}

// Оновлює сховище після відповіді на комбінацію (чиста функція, повертає нове сховище).
// Помилка → комбінація стає "помилковою" (лічильник правильних = 0).
// Правильно → якщо комбінація в списку, збільшуємо лічильник; після DECAY_AFTER — прибираємо.
export function recordAnswer(
  store: MistakeStore,
  id: string,
  correct: boolean
): MistakeStore {
  const next = { ...store };
  if (!correct) {
    next[id] = 0; // (пере)активуємо помилку, скидаємо затухання
    return next;
  }
  if (id in next) {
    const streak = next[id] + 1;
    if (streak >= DECAY_AFTER) {
      delete next[id]; // затухло — вага повертається до норми
    } else {
      next[id] = streak;
    }
  }
  return next;
}

// ─────────────── Спільний вибір комбінацій на раунд ───────────────
// Один generic-механізм для ВСІХ движків (іменники/дієслова/adj-pron/майбутні).
// Гарантує показ помилок через зарезервовані слоти (до MAX_MISTAKE_SLOTS), решту
// добирає зі звичайного зваженого пулу; впорядковує так, щоб те саме слово не
// йшло поспіль (помилки природно розсіяні, не купою на початку).
//
// Повертає ВПОРЯДКОВАНІ вибрані комбо (не питання) — кожен движок будує питання
// сам (напр. іменники чергують тип питання за позицією). Комбо будь-якого типу
// підходить, поки має поле `id`; `wordIdOf` дає ідентифікатор слова для правила
// «не поспіль».
function pickWeighted<C extends { id: string }>(
  source: C[],
  usedIds: Set<string>,
  store: MistakeStore
): C | null {
  const cand = source.filter((c) => !usedIds.has(c.id));
  if (cand.length === 0) return null;
  let total = 0;
  for (const c of cand) total += weightFor(store, c.id);
  let r = Math.random() * total;
  for (const c of cand) {
    r -= weightFor(store, c.id);
    if (r <= 0) return c;
  }
  return cand[cand.length - 1];
}

function orderNoConsecutiveWord<C>(items: C[], wordIdOf: (c: C) => string): C[] {
  const remaining = [...items];
  const out: C[] = [];
  let lastWord = "";
  while (remaining.length > 0) {
    let idxs = remaining.map((_, i) => i).filter((i) => wordIdOf(remaining[i]) !== lastWord);
    if (idxs.length === 0) idxs = remaining.map((_, i) => i);
    const idx = idxs[Math.floor(Math.random() * idxs.length)];
    const c = remaining.splice(idx, 1)[0];
    out.push(c);
    lastWord = wordIdOf(c);
  }
  return out;
}

// Опційний баланс за типом (kind): гарантує мінімальну кількість слотів раунду
// під «рідкісні» типи, щоб численніший тип (напр. прикметники) не витісняв їх.
// Використовується ЛИШЕ adj-pron квізом; nouns/verbs передають undefined і
// працюють як раніше (однорідний пул — балансувати нема що).
export interface KindQuota<K extends string> {
  kindOf: (c: { id: string }) => K;
  // Мінімум слотів на кожен вказаний тип. Порядок ключів = пріоритет віддачі
  // «зайвих» слотів: якщо типу не вистачає на його квоту, залишок переходить
  // наступному в цьому списку, а вже потім — у загальний пул.
  minSlots: Partial<Record<K, number>>;
}

export function selectRoundCombos<C extends { id: string }>(
  combos: C[],
  store: MistakeStore,
  roundSize: number,
  wordIdOf: (c: C) => string,
  maxMistakeSlots: number = MAX_MISTAKE_SLOTS,
  kindQuota?: KindQuota<string>
): C[] {
  const usedIds = new Set<string>();
  const chosen: C[] = [];

  // 1. Зарезервовані слоти під активні помилки (гарантований показ).
  const mistakePool = combos.filter((c) => c.id in store);
  const reserve = Math.min(maxMistakeSlots, mistakePool.length, roundSize);
  for (let i = 0; i < reserve; i++) {
    const c = pickWeighted(mistakePool, usedIds, store);
    if (!c) break;
    usedIds.add(c.id);
    chosen.push(c);
  }

  // 2. Баланс за типом (якщо заданий): гарантуємо мінімум слотів під рідкісні
  //    типи ДО заповнення загальним пулом. Уже вибрані помилки рахуються у квоту
  //    свого типу. Якщо рідкісного типу не вистачає — незаповнені слоти просто
  //    йдуть у загальний пул (крок 3), без хитрої передачі між типами.
  if (kindQuota) {
    const already: Record<string, number> = {};
    for (const c of chosen) {
      const k = kindQuota.kindOf(c);
      already[k] = (already[k] ?? 0) + 1;
    }
    for (const kind of Object.keys(kindQuota.minSlots)) {
      const want = kindQuota.minSlots[kind] ?? 0;
      let need = Math.min(want - (already[kind] ?? 0), roundSize - chosen.length);
      const kindPool = combos.filter((c) => kindQuota.kindOf(c) === kind);
      while (need > 0) {
        const c = pickWeighted(kindPool, usedIds, store);
        if (!c) break;
        usedIds.add(c.id);
        chosen.push(c);
        need--;
      }
    }
  }

  // 3. Решта раунду — звичайний зважений пул (помилки теж можуть випасти зверху).
  let guard = 0;
  while (chosen.length < roundSize && guard < roundSize * 40) {
    guard++;
    const c = pickWeighted(combos, usedIds, store);
    if (!c) break;
    usedIds.add(c.id);
    chosen.push(c);
  }

  // 4. Впорядкування: не те саме слово поспіль, помилки розсіяні.
  return orderNoConsecutiveWord(chosen, wordIdOf);
}
