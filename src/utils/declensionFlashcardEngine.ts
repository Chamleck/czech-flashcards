import {
  AdjectiveEntry,
  PronounEntry,
  FullDeclension,
  Gender,
  GENDER_ORDER,
  GENDER_SHORT,
  CzechCase,
  CASE_ORDER,
  CASE_LABELS,
  GrammaticalNumber,
} from "../types";
import { ADJECTIVES } from "../data/adjectives";
import { PRONOUNS } from "../data/pronouns";
import { NOUNS } from "../data/nouns";
import { MistakeStore, weightFor, comboId } from "./flashcardWeights";

// Питання квізу прикметників/займенників. Той самий контракт полів, що й у
// іменників/дієслів (щоб екран працював без змін), + необов'язкове contextPhrase:
// фраза-контекст із партнером і пропуском (напр. "jeho ___" або "___ nového").
export interface DeclQuestion {
  kind: "adjective" | "pronoun";
  gender: Gender;
  targetCase: CzechCase;
  targetNumber: GrammaticalNumber;
  comboId: string;
  promptWord: string; // словникова форма тестованого слова (starý, můj, ten)
  promptUk: string;
  taskText: string;
  contextPhrase: string; // партнер + пропуск
  correct: string;
  options: string[];
}

// Вокатив у квізі не тестуємо: у займенників це "—", а в прикметників він
// дублює називний. Тому працюємо з 6 відмінками.
const QUIZ_CASES: CzechCase[] = CASE_ORDER.filter((c) => c !== "vokativ");

const NUMBER_LABEL: Record<GrammaticalNumber, string> = { sg: "однина", pl: "множина" };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Дублет ("má / moje") для показу партнера скорочуємо до першої форми.
function firstForm(s: string): string {
  return s.split(" / ")[0];
}

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

function isUsableDistractor(correct: string, d: string | null | undefined): d is string {
  return (
    !!d && d !== "—" && d !== correct && collapseVowelLength(d) !== collapseVowelLength(correct)
  );
}

// ── Нормалізований тестований запис (спільний для прикметника й займенника) ──
interface Tested {
  id: string;
  kind: "adjective" | "pronoun";
  cz: string;
  uk: string;
  decl: FullDeclension;
  degree?: "comparative" | "superlative"; // для підпису завдання (ступінь порівняння)
}

function buildTestedPool(): Tested[] {
  // Прикметники: звичайний ступінь + (для градуйованих) вищий і найвищий —
  // кожен окремим тестованим записом з унікальним id (окремий трекінг помилок).
  const adj: Tested[] = ADJECTIVES.flatMap((a) => {
    const out: Tested[] = [
      { id: a.id, kind: "adjective", cz: a.cz, uk: a.uk, decl: a.declension },
    ];
    if (a.degrees) {
      out.push({
        id: `${a.id}__comp`,
        kind: "adjective",
        cz: a.degrees.comparative.cz,
        uk: a.degrees.comparative.uk,
        decl: a.degrees.comparative.declension,
        degree: "comparative",
      });
      out.push({
        id: `${a.id}__super`,
        kind: "adjective",
        cz: a.degrees.superlative.cz,
        uk: a.degrees.superlative.uk,
        decl: a.degrees.superlative.declension,
        degree: "superlative",
      });
    }
    return out;
  });
  // Займенники: лише відмінювані. jeho/jejich не тестуємо (одна форма — нема вибору).
  const pron: Tested[] = PRONOUNS.filter((p) => p.declinable).map((p) => ({
    id: p.id,
    kind: "pronoun",
    cz: p.cz,
    uk: p.uk,
    decl: (p as Extract<PronounEntry, { declinable: true }>).declension,
  }));
  return [...adj, ...pron];
}

// Форма партнера у тій самій клітинці (рід×відмінок×число), завжди коректна.
function pronounPartnerForm(
  p: PronounEntry,
  g: Gender,
  c: CzechCase,
  n: GrammaticalNumber
): string {
  if (p.declinable) return firstForm(p.declension[g][c][n]);
  return p.invariantForm; // jeho / jejich — незмінні, підходять як контекст
}

function adjectivePartnerForm(
  a: AdjectiveEntry,
  g: Gender,
  c: CzechCase,
  n: GrammaticalNumber
): string {
  return firstForm(a.declension[g][c][n]);
}

// Іменник-якір для фрази: випадковий іменник потрібного роду з бази Фази 1.
// Уся парадигма вже вивірена; беремо форму цієї ж клітинки (відмінок×число).
function nounCarrierForm(g: Gender, c: CzechCase, n: GrammaticalNumber): string {
  const pool = NOUNS.filter((noun) => noun.gender === g);
  if (pool.length === 0) return "";
  const noun = pool[Math.floor(Math.random() * pool.length)];
  return firstForm(noun.declension[c][n]);
}

// Партнер для тестованого прикметника — випадковий займенник (у т.ч. незмінний),
// показаний ПЕРЕД пропуском: "jeho ___".
// Партнер для тестованого займенника — випадковий прикметник, показаний ПІСЛЯ
// пропуску: "___ nového". (У чеській присвійний/вказівний стоїть перед прикметником.)
function buildContextPhrase(
  tested: Tested,
  g: Gender,
  c: CzechCase,
  n: GrammaticalNumber
): string {
  const noun = nounCarrierForm(g, c, n);
  if (tested.kind === "adjective") {
    const p = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)];
    return `${pronounPartnerForm(p, g, c, n)} ___ ${noun}`;
  }
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  return `___ ${adjectivePartnerForm(a, g, c, n)} ${noun}`;
}

// Усі реальні форми тестованого слова (для дистракторів), крім "—".
function allForms(decl: FullDeclension): string[] {
  const out: string[] = [];
  for (const g of GENDER_ORDER) {
    for (const c of QUIZ_CASES) {
      out.push(decl[g][c].sg, decl[g][c].pl);
    }
  }
  return out;
}

// Дистрактор — РЕАЛЬНА форма того ж слова, відмінна від правильної (візуально теж).
// Пріоритет: інший відмінок (той самий рід/число) → інше число → інший рід → будь-яка.
function buildDistractor(
  decl: FullDeclension,
  g: Gender,
  c: CzechCase,
  n: GrammaticalNumber,
  correct: string
): string | null {
  const other = (x: GrammaticalNumber): GrammaticalNumber => (x === "sg" ? "pl" : "sg");

  const byCase = shuffle(QUIZ_CASES.filter((cc) => cc !== c)).map((cc) => decl[g][cc][n]);
  for (const f of byCase) if (isUsableDistractor(correct, f)) return f;

  const byNumber = decl[g][c][other(n)];
  if (isUsableDistractor(correct, byNumber)) return byNumber;

  const byGender = shuffle(GENDER_ORDER.filter((gg) => gg !== g)).map((gg) => decl[gg][c][n]);
  for (const f of byGender) if (isUsableDistractor(correct, f)) return f;

  for (const f of shuffle(allForms(decl))) if (isUsableDistractor(correct, f)) return f;
  return null;
}

interface Combo {
  tested: Tested;
  gender: Gender;
  targetCase: CzechCase;
  targetNumber: GrammaticalNumber;
  correct: string;
  id: string;
}

function enumerateCombos(pool: Tested[]): Combo[] {
  const combos: Combo[] = [];
  for (const t of pool) {
    for (const g of GENDER_ORDER) {
      for (const c of QUIZ_CASES) {
        for (const n of ["sg", "pl"] as GrammaticalNumber[]) {
          const correct = t.decl[g][c][n];
          if (!correct || correct === "—") continue;
          if (!buildDistractor(t.decl, g, c, n, correct)) continue; // нема придатного дистрактора
          combos.push({
            tested: t,
            gender: g,
            targetCase: c,
            targetNumber: n,
            correct,
            id: comboId(t.id, `${g}_${c}`, n),
          });
        }
      }
    }
  }
  return combos;
}

function taskTextFor(tested: Tested, g: Gender, c: CzechCase, n: GrammaticalNumber): string {
  const l = CASE_LABELS[c];
  const kindLabel =
    tested.kind === "pronoun"
      ? "займенник"
      : tested.degree === "comparative"
        ? "прикметник (вищий ст.)"
        : tested.degree === "superlative"
          ? "прикметник (найвищий ст.)"
          : "прикметник";
  return `Оберіть ${kindLabel}: ${GENDER_SHORT[g]}, ${l.uk} (${l.cz}) — ${l.question}, ${NUMBER_LABEL[n]}`;
}

function makeQuestion(combo: Combo): DeclQuestion | null {
  const { tested, gender, targetCase, targetNumber, correct } = combo;
  const distractor = buildDistractor(tested.decl, gender, targetCase, targetNumber, correct);
  if (!distractor) return null;
  return {
    kind: tested.kind,
    gender,
    targetCase,
    targetNumber,
    comboId: combo.id,
    promptWord: tested.cz,
    promptUk: tested.uk,
    taskText: taskTextFor(tested, gender, targetCase, targetNumber),
    contextPhrase: buildContextPhrase(tested, gender, targetCase, targetNumber),
    correct,
    options: shuffle([correct, distractor]),
  };
}

function weightedPick<T>(items: T[], weightOf: (t: T) => number): T {
  let total = 0;
  for (const it of items) total += weightOf(it);
  let r = Math.random() * total;
  for (const it of items) {
    r -= weightOf(it);
    if (r < 0) return it;
  }
  return items[items.length - 1];
}

// Сесія: та сама механіка, що в іменників/дієслів — зважений вибір за comboId
// (помилки важчі), без повтору комбінації в межах сесії, одне слово не поспіль.
export function generateDeclensionSession(
  count: number,
  pool: Tested[] = buildTestedPool(),
  mistakes: MistakeStore = {}
): DeclQuestion[] {
  const combos = enumerateCombos(pool);
  const questions: DeclQuestion[] = [];
  const used = new Set<string>();
  let lastId = "";
  let guard = 0;

  while (questions.length < count && guard < count * 40) {
    guard++;
    let candidates = combos.filter((c) => !used.has(c.id) && c.tested.id !== lastId);
    if (candidates.length === 0) candidates = combos.filter((c) => !used.has(c.id));
    if (candidates.length === 0) break;

    const chosen = weightedPick(candidates, (c) => weightFor(mistakes, c.id));
    used.add(chosen.id);
    const q = makeQuestion(chosen);
    if (!q) continue;

    questions.push(q);
    lastId = chosen.tested.id;
  }
  return questions;
}
