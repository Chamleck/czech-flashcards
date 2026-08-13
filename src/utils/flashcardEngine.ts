import {
  NounEntry,
  CzechCase,
  CASE_ORDER,
  CASE_LABELS,
  GrammaticalNumber,
} from "../types";
import { NOUNS } from "../data/nouns";
import { MistakeStore, comboId, selectRoundCombos } from "./flashcardWeights";

export interface Question {
  entry: NounEntry;
  targetCase: CzechCase;
  targetNumber: GrammaticalNumber;
  comboId: string; // атомарна одиниця "слово+відмінок+число" для трекінгу помилок
  promptWord: string; // базова форма (називний однини)
  promptUk: string; // українською
  taskText: string; // що зробити
  correct: string; // правильна форма
  options: string[]; // [правильна, дистрактор] — вже перемішані
  distractorKind: "number" | "case";
}

const NUMBER_LABEL: Record<GrammaticalNumber, string> = {
  sg: "однина",
  pl: "множина",
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const other = (n: GrammaticalNumber): GrammaticalNumber => (n === "sg" ? "pl" : "sg");

// Дві форми, що різняться ЛИШЕ довготою голосної (i/í, u/ů, e/é, a/á, o/ó, y/ý),
// на малому екрані виглядають майже однаково (růži vs růží). Формально це різні
// форми, але як варіанти квізу вони сприймаються як "два однакових". Тому дистрактор
// має відрізнятися від правильної відповіді ще й ВІЗУАЛЬНО, а не тільки як рядок.
function collapseVowelLength(s: string): string {
  return s
    .replace(/á/g, "a")
    .replace(/í/g, "i")
    .replace(/é/g, "e")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ů/g, "u")
    .replace(/ý/g, "y")
    .toLowerCase();
}

// Дистрактор придатний, якщо він не збігається з правильною формою і не є візуально
// невідрізнюваним від неї (різниця лише в довготі голосної).
function isUsableDistractor(correct: string, d: string | null | undefined): d is string {
  return !!d && d !== correct && collapseVowelLength(d) !== collapseVowelLength(correct);
}

// Дистрактор = РЕАЛЬНА форма з парадигми того ж слова, але не та, що питають.
// Тип "number": той самий відмінок, інше число.
// Тип "case": інший відмінок, те саме число.
// Якщо форма збігається з правильною (у чеській частина форм тотожна) —
// шукаємо будь-яку іншу реальну форму, щоб варіанти ніколи не дублювалися.
function buildDistractor(
  entry: NounEntry,
  targetCase: CzechCase,
  targetNumber: GrammaticalNumber,
  correct: string,
  kind: "number" | "case"
): string | null {
  const tryNumber = () => {
    const form = entry.declension[targetCase][other(targetNumber)];
    return isUsableDistractor(correct, form) ? form : null;
  };
  const tryCase = () => {
    const cases = shuffle(CASE_ORDER.filter((c) => c !== targetCase));
    for (const c of cases) {
      const form = entry.declension[c][targetNumber];
      if (isUsableDistractor(correct, form)) return form;
    }
    return null;
  };

  let d = kind === "number" ? tryNumber() : tryCase();
  if (d) return d;

  // fallback: інший тип
  d = kind === "number" ? tryCase() : tryNumber();
  if (d) return d;

  // остаточний fallback: будь-яка реальна форма з усієї парадигми,
  // що відрізняється від правильної не лише як рядок, а й візуально
  for (const c of CASE_ORDER) {
    for (const num of ["sg", "pl"] as GrammaticalNumber[]) {
      const form = entry.declension[c][num];
      if (isUsableDistractor(correct, form)) return form;
    }
  }
  return null;
}

// Будує питання для КОНКРЕТНОЇ комбінації (слово+відмінок+число).
function makeQuestionForCombo(
  entry: NounEntry,
  targetCase: CzechCase,
  targetNumber: GrammaticalNumber,
  kind: "number" | "case"
): Question | null {
  const correct = entry.declension[targetCase][targetNumber];
  if (!correct) return null;

  const distractor = buildDistractor(entry, targetCase, targetNumber, correct, kind);
  if (!distractor) return null; // немає візуально-різного дистрактора — комбінацію пропускаємо

  const lbl = CASE_LABELS[targetCase];
  return {
    entry,
    targetCase,
    targetNumber,
    comboId: comboId(entry.id, targetCase, targetNumber),
    promptWord: entry.declension.nominativ.sg,
    promptUk: entry.uk,
    taskText: `Оберіть форму: ${lbl.uk} (${lbl.cz}) — ${lbl.question}, ${NUMBER_LABEL[targetNumber]}`,
    correct,
    options: shuffle([correct, distractor]),
    distractorKind: kind,
  };
}

// Усі валідні комбінації пулу (слово × відмінок × число), придатні для питання.
interface Combo {
  entry: NounEntry;
  targetCase: CzechCase;
  targetNumber: GrammaticalNumber;
  id: string;
}

function enumerateCombos(pool: NounEntry[]): Combo[] {
  const combos: Combo[] = [];
  for (const entry of pool) {
    for (const c of CASE_ORDER) {
      for (const n of ["sg", "pl"] as GrammaticalNumber[]) {
        // валідна, якщо існує дистрактор (перевіряємо через побудову з fallback)
        if (buildDistractor(entry, c, n, entry.declension[c][n], "case")) {
          combos.push({ entry, targetCase: c, targetNumber: n, id: comboId(entry.id, c, n) });
        }
      }
    }
  }
  return combos;
}

// Сесія: count питань. Вибір комбінацій (ваги помилок + зарезервовані слоти під
// помилки + «не те саме слово поспіль») — спільний selectRoundCombos. Тип питання
// (число/відмінок) чергується за позицією.
export function generateSession(
  count: number,
  pool: NounEntry[] = NOUNS,
  mistakes: MistakeStore = {}
): Question[] {
  const combos = enumerateCombos(pool);
  const chosen = selectRoundCombos(combos, mistakes, count, (c) => c.entry.id);
  const questions: Question[] = [];
  chosen.forEach((c, i) => {
    // тип питання чергується за позицією (число / відмінок)
    const kind: "number" | "case" = i % 2 === 0 ? "number" : "case";
    const q = makeQuestionForCombo(c.entry, c.targetCase, c.targetNumber, kind);
    if (q) questions.push(q);
  });
  return questions;
}
