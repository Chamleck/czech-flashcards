import {
  CardinalEntry,
  CzechCase,
  CASE_LABELS,
  NUMERAL_CASE_ORDER,
  Gender,
  NounEntry,
  GrammaticalNumber,
} from "../types";
import { CARDINALS } from "../data/cardinals";
import { NOUNS } from "../data/nouns";
import { nounUsableAsPartner } from "../data/categories";
import { MistakeStore, comboId, selectRoundCombos } from "./flashcardWeights";

// ─────────────────── Узгодження числівник + іменник ───────────────────
// Тестує ОДНЕ з двох взаємоузгоджених слів (числівник або іменник) у випадково
// обраному відмінку; друге показане готовою правильною формою (декорація).
// Правило (звірено з ÚJЧ/czechency.org):
//  • jeden       → іменник в ОДНИНІ, узгоджений рід+відмінок
//  • dva/oba/3/4 → іменник у МНОЖИНІ, ЗАВЖДИ узгоджений відмінок (без винятків)
//  • pět+        → іменник у МНОЖИНІ; РОДОВИЙ лише в наз./знах., інакше узгоджений
// Дублети (форми з " / ") зводяться до першого варіанта — у квизі потрібна
// ОДНА правильна відповідь.

export interface AgreementQuestion {
  comboId: string;
  blank: "numeral" | "noun";
  promptWord: string; // called-form пара в називному — стабільний заголовок незалежно від тестованого відмінка
  promptUk: string; // напр. "п'ять хлопців"
  taskText: string; // "Оберіть іменник: чол. іст., Родовий (Genitiv) — Koho? Čeho?, множина"
  contextPhrase: string; // "bez ___ chlapců" / "bez pěti ___"
  correct: string;
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

function isUsable(correct: string, d: string | null | undefined): d is string {
  return !!d && d !== correct && collapseVowelLength(d) !== collapseVowelLength(correct);
}

// Прийменники по відмінку. Родовий/місцевий БЕЗ вокалізації (bez не має єдиного
// стабільного правила — джерела фіксують саме bez як приклад нестабільності;
// безпечніше лишати незмінним). Давальний/орудний ВОКАЛІЗУЮТЬСЯ, але лише за
// єдиним підтвердженим безвинятковим правилом: той самий/парний приголосний.
const CASE_FRAME: Partial<Record<CzechCase, { pre: string; prep?: string }>> = {
  genitiv: { pre: "bez " },
  dativ: { pre: "", prep: "k" },
  lokal: { pre: "o " },
  instrumental: { pre: "", prep: "s" },
};

function vocalize(prep: string, next: string): string {
  if (prep === "k" && /^[kg]/i.test(next)) return "ke";
  if (prep === "s" && /^[szšž]/i.test(next)) return "se";
  return prep;
}

// ─────────────────── Форма числівника в заданому відмінку ───────────────────
// Повертає форму ЦЬОГО числівника для іменника заданого роду в заданому
// відмінку. Для kind="gendered"/"twoForm" рід іменника визначає колонку.
function numeralForm(card: CardinalEntry, c: CzechCase, nounGender: Gender): string {
  if (card.kind === "gendered") {
    return firstForm(card.declension[nounGender][c].sg);
  }
  if (card.kind === "twoForm") {
    const col = nounGender === "masc_anim" || nounGender === "masc_inan" ? "masc" : "femNeut";
    return firstForm(card.forms[c][col]);
  }
  if (card.kind === "invariantDecl") {
    return firstForm(card.forms[c]);
  }
  // oblique (pět+): пряма форма лише в наз./знах., інакше спільна непряма.
  return c === "nominativ" || c === "akuzativ" ? card.direct : firstForm(card.oblique);
}

// Дистрактор числівника — інша форма ЦЬОГО Ж числівника (інший відмінок,
// за потреби інший рід/колонка для gendered/twoForm).
function numeralDistractor(card: CardinalEntry, c: CzechCase, nounGender: Gender, correct: string): string | null {
  const otherCases = shuffle(NUMERAL_CASE_ORDER.filter((cc) => cc !== c));
  for (const cc of otherCases) {
    const f = numeralForm(card, cc, nounGender);
    if (isUsable(correct, f)) return f;
  }
  // gendered/twoForm: спробувати інший рід/колонку в ТОМУ Ж відмінку.
  if (card.kind === "gendered") {
    for (const g of ["masc_anim", "masc_inan", "fem", "neut"] as Gender[]) {
      const f = firstForm(card.declension[g][c].sg);
      if (isUsable(correct, f)) return f;
    }
  }
  if (card.kind === "twoForm") {
    const otherCol = nounGender === "masc_anim" || nounGender === "masc_inan" ? "femNeut" : "masc";
    const f = firstForm(card.forms[c][otherCol]);
    if (isUsable(correct, f)) return f;
  }
  return null;
}

// ─────────────────── Форма іменника (з узгодженням числа+відмінка за правилом) ───────────────────
type NounForm = { c: CzechCase; n: GrammaticalNumber };

// Яка клітинка іменника відповідає числівнику card у синтаксичному відмінку phraseCase.
function nounTargetCell(card: CardinalEntry, phraseCase: CzechCase): NounForm {
  if (card.kind === "gendered") return { c: phraseCase, n: "sg" };
  const isDirect = phraseCase === "nominativ" || phraseCase === "akuzativ";
  if (card.kind === "oblique" && isDirect) return { c: "genitiv", n: "pl" }; // 5+ у наз./знах. → родовий множини
  return { c: phraseCase, n: "pl" }; // 2-4 завжди; 5+ у непрямих — узгоджений відмінок
}

function nounForm(entry: NounEntry, cell: NounForm): string {
  return firstForm(entry.declension[cell.c][cell.n]);
}

function nounDistractor(entry: NounEntry, cell: NounForm, correct: string): string | null {
  // Спершу інше число тим самим відмінком, потім інший відмінок тим самим числом.
  const otherN: GrammaticalNumber = cell.n === "sg" ? "pl" : "sg";
  let f = firstForm(entry.declension[cell.c][otherN]);
  if (isUsable(correct, f)) return f;
  const otherCases = shuffle(NUMERAL_CASE_ORDER.filter((cc) => cc !== cell.c));
  for (const cc of otherCases) {
    f = firstForm(entry.declension[cc][cell.n]);
    if (isUsable(correct, f)) return f;
  }
  return null;
}

// ─────────────────── Побудова одного питання ───────────────────
function buildQuestion(card: CardinalEntry, phraseCase: CzechCase, noun: NounEntry): AgreementQuestion | null {
  // Рід іменника визначає колонку числівника (gendered/twoForm).
  const numCorrect = numeralForm(card, phraseCase, noun.gender);
  const cell = nounTargetCell(card, phraseCase);
  const nounCorrect = nounForm(noun, cell);
  if (!numCorrect || numCorrect === "—" || !nounCorrect || nounCorrect === "—") return null;

  const blank: "numeral" | "noun" = Math.random() < 0.5 ? "numeral" : "noun";
  const correct = blank === "numeral" ? numCorrect : nounCorrect;
  const distractor =
    blank === "numeral"
      ? numeralDistractor(card, phraseCase, noun.gender, numCorrect)
      : nounDistractor(noun, cell, nounCorrect);
  if (!distractor) return null;

  // Контекстна фраза: показуємо готове слово (не бланк) у правильній формі.
  const frame = CASE_FRAME[phraseCase];
  const shownNum = blank === "numeral" ? "___" : numCorrect;
  const shownNoun = blank === "noun" ? "___" : nounCorrect;
  let contextPhrase: string;
  if (frame?.prep) {
    // Вокалізація прийменника залежить від слова ОДРАЗУ після нього — це завжди
    // числівник (носій іде першим): якщо числівник — бланк, беремо його ГОТОВУ
    // (правильну) форму лише для перевірки вокалізації, у фразі показуємо "___".
    const p = vocalize(frame.prep, numCorrect);
    contextPhrase = `${p} ${shownNum} ${shownNoun}`;
  } else if (frame?.pre) {
    contextPhrase = `${frame.pre}${shownNum} ${shownNoun}`;
  } else if (phraseCase === "akuzativ") {
    contextPhrase = `Mám ${shownNum} ${shownNoun}`;
  } else {
    contextPhrase = `${shownNum} ${shownNoun}`;
  }

  const lbl = CASE_LABELS[phraseCase];
  const genderUk: Record<Gender, string> = {
    masc_anim: "чол. іст.",
    masc_inan: "чол. неіст.",
    fem: "жін.",
    neut: "сер.",
  };
  const taskText =
    blank === "numeral"
      ? `Оберіть числівник: ${lbl.number} ${lbl.uk} (${lbl.cz}) — ${lbl.question}`
      : `Оберіть іменник: ${genderUk[noun.gender]}, ${lbl.number} ${lbl.uk} (${lbl.cz}) — ${lbl.question}, ${
          cell.n === "sg" ? "однина" : "множина"
        }`;

  // Prompt стосується ЛИШЕ тестованого слова (того, що в пропуску) — базова форма
  // + її переклад. Декоратор (друге слово) не перекладається, він лише у фразі.
  const promptWord = blank === "numeral" ? card.cz : noun.cz;
  const promptUk = blank === "numeral" ? card.uk : noun.uk;

  return {
    comboId: comboId(card.id, phraseCase, blank),
    blank,
    promptWord,
    promptUk,
    taskText,
    contextPhrase,
    correct,
    options: shuffle([correct, distractor]),
  };
}

// ─────────────────── Сесія ───────────────────
// Пул лічених іменників: виключаємо непридатні як партнер (дні/місяці/сотні —
// nounUsableAsPartner) І незлічувані (maso/voda/rýže/káva — «osm mas» безглузде).
const PARTNER_POOL = NOUNS.filter((n) => nounUsableAsPartner(n.category) && !n.uncountable);

interface Combo {
  id: string;
  wordId: string;
  make: () => AgreementQuestion | null;
}

// ─────────────────── sto/tisíc/milion/miliarda як лічильне слово ───────────────────
// Ці чотири — NounEntry (не CardinalEntry), але в ролі числівника. Правило
// узгодження (звірено з Elon.io + акад. праця dspace.cuni.cz): іменник-предмет
// ЗАВЖДИ в родовому множини (sto korun, tisíc korun, k tisíci korun, o milionu
// lidí). Для tisíc/milion/miliarda це безвиняткове правило в усіх відмінках; для
// sto існує варіативність у непрямих, але беремо єдиний найпоширеніший варіант
// (родовий) — щоб у квизі була одна правильна відповідь.
const HUNDRED_IDS = ["num-sto", "num-tisic", "num-milion", "num-miliarda"];
const HUNDRED_NOUNS = NOUNS.filter((n) => HUNDRED_IDS.includes(n.id));

function nounGenPlDistractor(entry: NounEntry, correct: string): string | null {
  // Інша форма ТОГО Ж числа-слова (sto/tisíc…) в іншому відмінку.
  const otherCases = shuffle(NUMERAL_CASE_ORDER.filter((cc) => cc !== "genitiv"));
  for (const cc of otherCases) {
    for (const n of ["sg", "pl"] as GrammaticalNumber[]) {
      const f = firstForm(entry.declension[cc][n]);
      if (isUsable(correct, f)) return f;
    }
  }
  return null;
}

function buildHundredQuestion(hundred: NounEntry, phraseCase: CzechCase, partner: NounEntry): AgreementQuestion | null {
  // Форма числа-слова (sto/tisíc…) — за його власною парадигмою у відмінку фрази,
  // число: sg для "один" сенсу (sto/tisíc), але тут завжди однина самого слова.
  const numCorrect = firstForm(hundred.declension[phraseCase].sg);
  // Партнер завжди в родовому множини.
  const nounCorrect = firstForm(partner.declension.genitiv.pl);
  if (!numCorrect || numCorrect === "—" || !nounCorrect || nounCorrect === "—") return null;

  const blank: "numeral" | "noun" = Math.random() < 0.5 ? "numeral" : "noun";
  const correct = blank === "numeral" ? numCorrect : nounCorrect;
  const distractor =
    blank === "numeral"
      ? nounGenPlDistractor(hundred, numCorrect)
      : nounDistractor(partner, { c: "genitiv", n: "pl" }, nounCorrect);
  if (!distractor) return null;

  const frame = CASE_FRAME[phraseCase];
  const shownNum = blank === "numeral" ? "___" : numCorrect;
  const shownNoun = blank === "noun" ? "___" : nounCorrect;
  let contextPhrase: string;
  if (frame?.prep) {
    const p = vocalize(frame.prep, numCorrect);
    contextPhrase = `${p} ${shownNum} ${shownNoun}`;
  } else if (frame?.pre) {
    contextPhrase = `${frame.pre}${shownNum} ${shownNoun}`;
  } else if (phraseCase === "akuzativ") {
    contextPhrase = `Mám ${shownNum} ${shownNoun}`;
  } else {
    contextPhrase = `${shownNum} ${shownNoun}`;
  }

  const lbl = CASE_LABELS[phraseCase];
  const genderUk: Record<Gender, string> = {
    masc_anim: "чол. іст.",
    masc_inan: "чол. неіст.",
    fem: "жін.",
    neut: "сер.",
  };
  const taskText =
    blank === "numeral"
      ? `Оберіть числівник: ${lbl.number} ${lbl.uk} (${lbl.cz}) — ${lbl.question}`
      : `Оберіть іменник: ${genderUk[partner.gender]}, Родовий (Genitiv) — Koho? Čeho?, множина`;

  const promptWord = blank === "numeral" ? hundred.cz : partner.cz;
  const promptUk = blank === "numeral" ? hundred.uk : partner.uk;

  return {
    comboId: comboId(hundred.id, phraseCase, blank),
    blank,
    promptWord,
    promptUk,
    taskText,
    contextPhrase,
    correct,
    options: shuffle([correct, distractor]),
  };
}

function enumerateAgreementCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const card of CARDINALS) {
    for (const c of NUMERAL_CASE_ORDER) {
      combos.push({
        id: comboId(card.id, c, "x"), // ваги рахуємо на рівні числівник+відмінок, незалежно від випадкового партнера/бланку
        wordId: card.id,
        make: () => {
          const noun = PARTNER_POOL[Math.floor(Math.random() * PARTNER_POOL.length)];
          return buildQuestion(card, c, noun);
        },
      });
    }
  }
  // sto/tisíc/milion/miliarda — той самий механізм, окрема гілка побудови.
  for (const hundred of HUNDRED_NOUNS) {
    for (const c of NUMERAL_CASE_ORDER) {
      combos.push({
        id: comboId(hundred.id, c, "x"),
        wordId: hundred.id,
        make: () => {
          const noun = PARTNER_POOL[Math.floor(Math.random() * PARTNER_POOL.length)];
          return buildHundredQuestion(hundred, c, noun);
        },
      });
    }
  }
  return combos;
}

export function generateNumeralAgreementSession(
  count: number,
  pool: Combo[] = enumerateAgreementCombos(),
  mistakes: MistakeStore = {}
): AgreementQuestion[] {
  const chosen = selectRoundCombos(pool, mistakes, count, (c) => c.wordId);
  const questions: AgreementQuestion[] = [];
  for (const c of chosen) {
    const q = c.make();
    if (q) questions.push(q);
  }
  return questions;
}
