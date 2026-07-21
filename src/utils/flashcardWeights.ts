import AsyncStorage from "@react-native-async-storage/async-storage";

// Вага помилок на рівні АТОМАРНОЇ одиниці питання.
// Для іменників атомарна одиниця — комбінація "слово + відмінок + число".
// Для майбутніх категорій (дієслово+час, займенник+число тощо) — той самий механізм,
// інша атомарна одиниця; comboId лишається просто рядком-ключем.
const KEY = "czech_flashcard_weights_v1";

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

export async function loadMistakes(): Promise<MistakeStore> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveMistakes(store: MistakeStore): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(store));
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
