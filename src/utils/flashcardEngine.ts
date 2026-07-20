import {
  NounEntry,
  CzechCase,
  CASE_ORDER,
  CASE_LABELS,
  GrammaticalNumber,
} from "../types";
import { NOUNS } from "../data/nouns";

export interface Question {
  entry: NounEntry;
  targetCase: CzechCase;
  targetNumber: GrammaticalNumber;
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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const other = (n: GrammaticalNumber): GrammaticalNumber => (n === "sg" ? "pl" : "sg");

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
  const tryNumber = () => entry.declension[targetCase][other(targetNumber)];
  const tryCase = () => {
    const cases = shuffle(CASE_ORDER.filter((c) => c !== targetCase));
    for (const c of cases) {
      const form = entry.declension[c][targetNumber];
      if (form && form !== correct) return form;
    }
    return null;
  };

  let d = kind === "number" ? tryNumber() : tryCase();
  if (d && d !== correct) return d;

  // fallback: інший тип
  d = kind === "number" ? tryCase() : tryNumber();
  if (d && d !== correct) return d;

  // остаточний fallback: будь-яка реальна форма з усієї парадигми != correct
  for (const c of CASE_ORDER) {
    for (const num of ["sg", "pl"] as GrammaticalNumber[]) {
      const form = entry.declension[c][num];
      if (form && form !== correct) return form;
    }
  }
  return null;
}

function makeQuestion(entry: NounEntry, kind: "number" | "case"): Question | null {
  const targetCase = pick(CASE_ORDER);
  const targetNumber = pick(["sg", "pl"] as GrammaticalNumber[]);
  const correct = entry.declension[targetCase][targetNumber];
  if (!correct) return null;

  const distractor = buildDistractor(entry, targetCase, targetNumber, correct, kind);
  if (!distractor) return null; // слово без варіативних форм (напр. nádraží) — пропускаємо

  const lbl = CASE_LABELS[targetCase];
  return {
    entry,
    targetCase,
    targetNumber,
    promptWord: entry.declension.nominativ.sg,
    promptUk: entry.uk,
    taskText: `Оберіть форму: ${lbl.uk} (${lbl.cz}), ${NUMBER_LABEL[targetNumber]}`,
    correct,
    options: shuffle([correct, distractor]),
    distractorKind: kind,
  };
}

// Сесія: count питань, тип дистрактора чергується (ротація), слова не повторюються підряд.
export function generateSession(count: number, pool: NounEntry[] = NOUNS): Question[] {
  const questions: Question[] = [];
  let bag: NounEntry[] = [];
  let lastId = "";
  let i = 0;
  let guard = 0;

  while (questions.length < count && guard < count * 20) {
    guard++;
    if (bag.length === 0) bag = shuffle(pool);
    const entry = bag.pop()!;
    if (entry.id === lastId && pool.length > 1) continue;
    const kind: "number" | "case" = i % 2 === 0 ? "number" : "case";
    const q = makeQuestion(entry, kind);
    if (!q) continue;
    questions.push(q);
    lastId = entry.id;
    i++;
  }
  return questions;
}
