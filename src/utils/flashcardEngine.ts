import {
  NounEntry,
  CzechCase,
  CASE_ORDER,
  CASE_LABELS,
  GrammaticalNumber,
} from "../types";
import { NOUNS } from "../data/nouns";
import { nounQuizTestable } from "../data/categories";
import { NOUN_FRAMES, NOUN_SKIP_RULES, NounFrame } from "../data/nounFrames";
import { matchesNeeds, acceptedForms, freshWeightedOrder, hasNumber, pluralOnly, vocalizeSlot } from "./partnerSelection";
import { MistakeStore, comboId, selectRoundCombos } from "./flashcardWeights";
import { NUMBER_LABEL, formsOf, isUsableDistractor, once, shuffle, skipReason, splitForms, topUpRound } from "./quizCommon";

// ─────────────────── Квіз «Іменники»: форма іменника за відмінком і числом ───────────────────
// Атомарна одиниця — «слово + відмінок + число» (comboId). Питання — речення з data/nounFrames.ts, де пропуск —
// сам іменник («Bojím se ___» → psa); фразу рушій бере за смисловими тегами слова. Якщо під теги не підійшла
// жодна фраза — питання без речення (форма + підпис), щоб жодна форма парадигми не випадала з квізу.
// Не питаємо: словникову форму (заголовок картки — називний однини, у слів лише з множиною — називний множини)
// і кличний речей (звертаються лише до осіб і тварин).
// Відповідь завжди одна: на кнопці одна форма (з дублета «a / b» — перша, як на картці), дистрактор — справжня форма того самого
// слова, що НЕ входить у прийнятні форми клітинки (усі дублети + variants).

export interface Question {
  comboId: string; // атомарна одиниця "слово+відмінок+число" для трекінгу помилок
  promptWord: string; // словникова форма (заголовок)
  promptUk: string; // українською
  promptLabel: string; // заголовок-підпис: частина мови основного слова ("іменник")
  taskText: string; // що зробити
  contextPhrase?: string; // речення з пропуском; немає — питання без речення
  correct: string; // правильна форма
  options: string[]; // [правильна, дистрактор] — вже перемішані
}

const NUMBERS: GrammaticalNumber[] = ["sg", "pl"];

const other = (n: GrammaticalNumber): GrammaticalNumber => (n === "sg" ? "pl" : "sg");

// ─────────────────── Які клітинки питаємо ───────────────────
// Заголовок картки: називний однини, а для слів лише з множиною (peníze) — називний множини.
function headlineNumber(n: NounEntry): GrammaticalNumber {
  return hasNumber(n, "sg") ? "sg" : "pl";
}

function asked(n: NounEntry, c: CzechCase, num: GrammaticalNumber): boolean {
  const cell = n.declension[c][num];
  if (!cell || cell === "—") return false; // форма не існує (однина peníze)
  if (c === "nominativ" && num === headlineNumber(n)) return false; // відповідь стояла б у заголовку
  if (skipReason(NOUN_SKIP_RULES, { noun: n, c, n: num })) return false; // свідомі винятки (data/nounFrames.ts)
  return true;
}

// ─────────────────── Фрази ───────────────────
// Множина у фразі: не для незлічуваних (vody, masa) і збірних (rodiny), крім слів лише з множиною; збірним її
// відкриває сама фраза полем plOk (правило 7 у шапці data/nounFrames.ts).
function pluralFits(n: NounEntry, f: NounFrame): boolean {
  if (pluralOnly(n)) return true;
  if (n.uncountable) return false;
  return !n.sem.includes("collective") || !!f.plOk?.some((t) => n.sem.includes(t));
}

// Чи годиться фраза для слова в цьому числі (правило 1 у шапці data/nounFrames.ts).
function frameFits(f: NounFrame, n: NounEntry, num: GrammaticalNumber): boolean {
  if (!matchesNeeds(n, f)) return false;
  const policy = f.num ?? "sg";
  if (num === "sg") return policy !== "pl";
  if (!pluralFits(n, f)) return false;
  return policy !== "sg" || pluralOnly(n) || n.sem.includes("paired");
}

// ─────────────────── Дистрактор ───────────────────
// Кандидати за пріоритетом: тип "number" — той самий відмінок, інше число; тип "case" — інший відмінок, те саме
// число; далі — інший тип і будь-яка форма парадигми. Кожна форма дублета — окремий кандидат.
function distractorCandidates(
  n: NounEntry,
  c: CzechCase,
  num: GrammaticalNumber,
  correct: string,
  accepted: string[],
  kind: "number" | "case"
): string[] {
  const numberCells: [CzechCase, GrammaticalNumber][] = [[c, other(num)]];
  const caseCells = shuffle(CASE_ORDER.filter((x) => x !== c)).map((x): [CzechCase, GrammaticalNumber] => [x, num]);
  const rest: [CzechCase, GrammaticalNumber][] = [];
  for (const x of CASE_ORDER) for (const y of NUMBERS) rest.push([x, y]);
  const ordered = kind === "number" ? [...numberCells, ...caseCells, ...rest] : [...caseCells, ...numberCells, ...rest];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const [x, y] of ordered) {
    for (const d of formsOf(n.declension[x][y])) {
      if (seen.has(d)) continue;
      seen.add(d);
      if (isUsableDistractor(correct, d, accepted)) out.push(d);
    }
  }
  return out;
}

// Чи дасть distractorCandidates хоч один варіант (без випадковості — для переліку комбінацій): та сама перевірка
// по всіх клітинках парадигми.
function hasDistractor(n: NounEntry, correct: string, accepted: string[]): boolean {
  return CASE_ORDER.some((x) => NUMBERS.some((y) => formsOf(n.declension[x][y]).some((d) => isUsableDistractor(correct, d, accepted))));
}

// ─────────────────── Питання ───────────────────
// Перебір повний: форма клітинки → фраза (ще не бачені в раунді першими) → дистрактор із тією самою вокалізацією.
// Без жодної придатної фрази — питання без речення. null — лише якщо в парадигмі немає жодного дистрактора
// (така комбінація відсіюється при переліченні).
interface Built {
  q: Question;
  frame: string | null; // текст фрази з data/nounFrames.ts; null — питання без речення
}

function makeQuestion(
  n: NounEntry,
  c: CzechCase,
  num: GrammaticalNumber,
  kind: "number" | "case",
  usedFrames: ReadonlySet<string>
): Built | null {
  const accepted = acceptedForms(n, c, num);
  // Правильною показуємо першу форму клітинки (як на картці); інші форми дублета — лише якщо з першою питання
  // не будується. Усі вони прийнятні й ніколи не стають дистрактором.
  const shown = splitForms(n.declension[c][num]);
  const frames = freshWeightedOrder(
    NOUN_FRAMES[c].filter((f) => frameFits(f, n, num)),
    (f) => usedFrames.has(f.text),
    () => 1
  );
  const ask = (correct: string, distractor: string, contextPhrase?: string): Question => {
    const lbl = CASE_LABELS[c];
    return {
      comboId: comboId(n.id, c, num),
      promptWord: splitForms(n.declension.nominativ[headlineNumber(n)])[0],
      promptUk: n.uk,
      promptLabel: "іменник",
      taskText: `Оберіть форму: ${lbl.uk} (${lbl.cz}) — ${lbl.question}, ${NUMBER_LABEL[num]}`,
      ...(contextPhrase ? { contextPhrase } : {}),
      correct,
      options: shuffle([correct, distractor]),
    };
  };

  let bare: Built | null = null;
  for (const correct of shown) {
    const ds = distractorCandidates(n, c, num, correct, accepted, kind);
    if (ds.length === 0) continue;
    bare = bare ?? { q: ask(correct, ds[0]), frame: null };
    for (const f of frames) {
      for (const d of ds) {
        // null — прийменник перед пропуском вокалізується по-різному для двох кнопок або вокалізацію не
        // класифіковано (правило 4 у шапці data/nounFrames.ts).
        const text = vocalizeSlot(f.text, [correct, d]);
        if (text) return { q: ask(correct, d, text), frame: f.text };
      }
    }
  }
  return bare;
}

// ─────────────────── Комбінації ───────────────────
interface Combo {
  entry: NounEntry;
  targetCase: CzechCase;
  targetNumber: GrammaticalNumber;
  id: string;
}

const NO_FRAMES = new Set<string>();

// Комбо існує, лише якщо для нього будується питання: makeQuestion повертає null тільки тоді, коли жодна показувана
// форма клітинки не має дистрактора (без фрази питання будується завжди), — це й перевіряється, без побудови питань.
function enumerateCombos(pool: NounEntry[]): Combo[] {
  const combos: Combo[] = [];
  for (const entry of pool) {
    for (const c of CASE_ORDER) {
      for (const n of NUMBERS) {
        if (!asked(entry, c, n)) continue;
        const accepted = acceptedForms(entry, c, n);
        if (splitForms(entry.declension[c][n]).some((correct) => hasDistractor(entry, correct, accepted))) {
          combos.push({ entry, targetCase: c, targetNumber: n, id: comboId(entry.id, c, n) });
        }
      }
    }
  }
  return combos;
}

// Пул за замовчуванням — усі іменники, КРІМ прихованих категорій (сотні/тисячі
// живуть лише в розділі "Числівники", не тестуються у загальному квізі).
const DEFAULT_NOUN_POOL = NOUNS.filter((n) => nounQuizTestable(n.category));

// Пул комбінацій залежить лише від даних — будується раз за запуск застосунку.
const defaultCombos = once(() => enumerateCombos(DEFAULT_NOUN_POOL));

// ─────────────── Dev-перевірка даних (лише dev-збірка, нічого не блокує) ───────────────
function devCheckData(): void {
  const issues: string[] = [];
  for (const c of CASE_ORDER)
    for (const f of NOUN_FRAMES[c]) {
      const k = DEFAULT_NOUN_POOL.filter((n) => matchesNeeds(n, f)).length;
      if (k < 3) issues.push(`фраза «${f.text}» (${c}): лише ${k} іменників (потрібно ≥ 3)`);
    }
  // Без речення: жодна фраза не підійшла за тегами або всі відпали через вокалізацію (перебір у makeQuestion повний).
  const bare = defaultCombos()
    .filter((x) => !makeQuestion(x.entry, x.targetCase, x.targetNumber, "case", NO_FRAMES)?.frame)
    .map((x) => x.id);
  if (bare.length > 0) issues.push(`${bare.length} комбінацій без фрази (питання без речення): ${bare.join(", ")}`);
  if (issues.length > 0) console.warn(`nounQuiz: ${issues.length} зауваж.:\n  ` + issues.join("\n  "));
}
if (typeof __DEV__ !== "undefined" && __DEV__) devCheckData();

// ─────────────────── Сесія ───────────────────
// Вибір комбінацій (ваги помилок + зарезервовані слоти під помилки + одне слово раз на раунд + «не те саме слово
// поспіль») — спільний selectRoundCombos. Тип дистрактора (число/відмінок) чергується за позицією; фраза
// не повторюється в раунді, поки є інші.
export function generateSession(
  count: number,
  pool: NounEntry[] = DEFAULT_NOUN_POOL,
  mistakes: MistakeStore = {}
): Question[] {
  const combos = pool === DEFAULT_NOUN_POOL ? defaultCombos() : enumerateCombos(pool);
  const chosen = selectRoundCombos(combos, mistakes, count, (c) => c.entry.id);
  const questions: Question[] = [];
  const usedFrames = new Set<string>();
  const take = (c: Combo, kind: "number" | "case") => {
    const b = makeQuestion(c.entry, c.targetCase, c.targetNumber, kind, usedFrames);
    if (!b) return;
    if (b.frame) usedFrames.add(b.frame);
    questions.push(b.q);
  };
  chosen.forEach((c, i) => take(c, i % 2 === 0 ? "number" : "case"));
  // Добір (не мало б статися: комбо без питань відсіяні при переліченні).
  topUpRound(questions, count, combos, (c) => take(c, questions.length % 2 === 0 ? "number" : "case"));
  return questions;
}
