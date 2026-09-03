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
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";

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
  promptLabel?: string; // необов'язковий підпис над заголовком (складені: «українською»)
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
      ? `Оберіть числівник: ${lbl.uk} (${lbl.cz}) — ${lbl.question}`
      : `Оберіть іменник: ${genderUk[noun.gender]}, ${lbl.uk} (${lbl.cz}) — ${lbl.question}, ${
          cell.n === "sg" ? "однина" : "множина"
        }`;

  // Prompt стосується ЛИШЕ тестованого слова (того, що в пропуску) — базова форма
  // + її переклад. Декоратор (друге слово) не перекладається, він лише у фразі.
  const promptWord = blank === "numeral" ? card.cz : noun.cz;
  const promptUk = blank === "numeral" ? card.uk : noun.uk;

  return {
    // Вага рахується на рівні числівник+відмінок, НЕЗАЛЕЖНО від випадкового
    // blank (numeral/noun) — тому фіксуємо "x", щоб цей id збігався з id у пулі
    // (enumerateAgreementCombos). Інакше mistake-стор пише один id, а
    // selectRoundCombos шукає інший — і резервація помилок не спрацьовує.
    comboId: comboId(card.id, phraseCase, "x"),
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

function nounGenPlDistractor(entry: NounEntry, correct: string, phraseCase: CzechCase): string | null {
  // Інша форма ТОГО Ж числа-слова (sto/tisíc…) в ІНШОМУ відмінку, завжди в
  // однині (бо correct теж завжди береться з .sg — див. buildHundredQuestion).
  // Виключаємо і genitiv, і сам phraseCase: якщо не виключити phraseCase,
  // цикл може дійти до pl-форми ТОГО Ж відмінка (напр. lokal.sg="tisíci" /
  // lokal.pl="tisících") — а це вже не дистрактор, а другий граматично
  // коректний варіант («o tisíci domů» і «o tisících domů» обидва правильні,
  // партнер завжди в родовому множини незалежно від числа самого числівника).
  const otherCases = shuffle(NUMERAL_CASE_ORDER.filter((cc) => cc !== "genitiv" && cc !== phraseCase));
  for (const cc of otherCases) {
    const f = firstForm(entry.declension[cc].sg);
    if (isUsable(correct, f)) return f;
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
      ? nounGenPlDistractor(hundred, numCorrect, phraseCase)
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
      ? `Оберіть числівник: ${lbl.uk} (${lbl.cz}) — ${lbl.question}`
      : `Оберіть іменник: ${genderUk[partner.gender]}, Родовий (Genitiv) — Koho? Čeho?, множина`;

  const promptWord = blank === "numeral" ? hundred.cz : partner.cz;
  const promptUk = blank === "numeral" ? hundred.uk : partner.uk;

  return {
    // Див. коментар у buildQuestion: фіксуємо "x", щоб id збігався з пулом.
    comboId: comboId(hundred.id, phraseCase, "x"),
    blank,
    promptWord,
    promptUk,
    taskText,
    contextPhrase,
    correct,
    options: shuffle([correct, distractor]),
  };
}

// ═══════════════════ СКЛАДЕНІ ЧИСЛА 21–99 (композиційно) ═══════════════════
// Складені числа не мають окремих записів у cardinals.ts — генеруються на льоту
// з десятки (dvacet…devadesát) + одиниці (jeden…devět). Узгодження іменника
// визначає ОСТАННЯ цифра (одиниця): це та сама навичка, що для простих 1–9,
// але вимагає спершу впізнати, яке правило застосувати. Тому:
//  • форма числівника = «<форма десятки> <форма одиниці>» (обидві в phraseCase);
//  • узгодження іменника = за unit-карткою (перевикористовуємо nounTargetCell);
//  • вага помилок трекається за ГРУПОЮ останньої цифри (1/2/3/4/5), не за
//    конкретним числом — навичка саме в розпізнаванні групи.
// Відмінки: одиниця 5–9 → всі 6 (усталена норма); одиниця 1–4 → лише прямі
// (naz/akuz) — непрямі відмінки складених на -1..-4 у реальному вжитку хиткі,
// носії часто лишають їх невідмінюваними (Naše řeč / ÚJЧ: nase-rec.ujc.cas.cz),
// тож єдиної правильної відповіді для квізу там нема.

const DECADE_IDS = [
  "card-dvacet", "card-tricet", "card-ctyricet", "card-padesat",
  "card-sedesat", "card-sedmdesat", "card-osmdesat", "card-devadesat",
];
// Одиниці 1–9 за групами останньої цифри. Група 5 = «5–9» (усі oblique).
const UNIT_IDS_BY_GROUP: Record<number, string[]> = {
  1: ["card-jeden"],
  2: ["card-dva"],
  3: ["card-tri"],
  4: ["card-ctyri"],
  5: ["card-pet", "card-sest", "card-sedm", "card-osm", "card-devet"],
};
// Прямі відмінки для всіх; групи 1–4 обмежені саме ними.
const DIRECT_CASES: CzechCase[] = ["nominativ", "akuzativ"];

const DECADE_CARDS = DECADE_IDS.map((id) => CARDINALS.find((c) => c.id === id)!);
function unitCardsForGroup(group: number): CardinalEntry[] {
  return UNIT_IDS_BY_GROUP[group].map((id) => CARDINALS.find((c) => c.id === id)!);
}

// Форма складеного числівника у відмінку: обидві частини відмінюються.
// Одиниця враховує рід іменника (jeden/jedna, dva/dvě).
function compoundNumeralForm(decade: CardinalEntry, unit: CardinalEntry, c: CzechCase, nounGender: Gender): string {
  const d = numeralForm(decade, c, nounGender);
  const u = numeralForm(unit, c, nounGender);
  return `${d} ${u}`;
}

// Дистрактор складеного числівника: та сама десятка, але одиниця (і за потреби
// десятка) в ІНШОМУ відмінку — типова помилка «не відмінив другу частину».
// ВАЖЛИВО: шукаємо ЛИШЕ серед відмінків, дозволених для ЦІЄЇ групи (те саме
// allowedCases, що й у enumerateCompoundCombos) — інакше для груп 1-4 сюди
// просочилися б непрямі форми (jednomu/dvou/třech…), яких ми свідомо не
// тестуємо через спірність норми. Дистрактор — теж контент, а не лише
// правильна відповідь, тож обмеження стосується його так само.
function compoundNumeralDistractor(
  decade: CardinalEntry, unit: CardinalEntry, c: CzechCase, nounGender: Gender, correct: string, allowedCases: CzechCase[]
): string | null {
  const otherCases = shuffle(allowedCases.filter((cc) => cc !== c));
  for (const cc of otherCases) {
    const f = `${numeralForm(decade, cc, nounGender)} ${numeralForm(unit, cc, nounGender)}`;
    if (isUsable(correct, f)) return f;
  }
  // запасний: лише одиниця в іншому відмінку (десятка правильна) — теж у межах allowedCases.
  for (const cc of otherCases) {
    const f = `${numeralForm(decade, c, nounGender)} ${numeralForm(unit, cc, nounGender)}`;
    if (isUsable(correct, f)) return f;
  }
  // Останній рівень: tři/čtyři не відрізняють naz./znah. (обидва "tři"), а
  // allowedCases для груп 1-4 має лише ці два відмінки — тож жоден з циклів
  // вище не знайде відмінності. Беремо ІНШУ десятку з тим самим відмінком:
  // «sedmdesát tři» vs «osmdesát tři» — тестує впізнавання самої десятки.
  const otherDecades = shuffle(DECADE_CARDS.filter((d) => d.id !== decade.id));
  for (const d of otherDecades) {
    const f = `${numeralForm(d, c, nounGender)} ${numeralForm(unit, c, nounGender)}`;
    if (isUsable(correct, f)) return f;
  }
  return null;
}

function buildCompoundQuestion(group: number, phraseCase: CzechCase, noun: NounEntry): AgreementQuestion | null {
  // Випадкова десятка + випадкова одиниця з групи. Узгодження веде ОДИНИЦЯ.
  const decade = DECADE_CARDS[Math.floor(Math.random() * DECADE_CARDS.length)];
  const units = unitCardsForGroup(group);
  const unit = units[Math.floor(Math.random() * units.length)];
  const allowedCases = group === 5 ? NUMERAL_CASE_ORDER : DIRECT_CASES;

  const numCorrect = compoundNumeralForm(decade, unit, phraseCase, noun.gender);
  // Клітинка іменника — за правилом ОДИНИЦІ (остання цифра диктує узгодження).
  const cell = nounTargetCell(unit, phraseCase);
  const nounCorrect = nounForm(noun, cell);
  if (!numCorrect || numCorrect.includes("—") || !nounCorrect || nounCorrect === "—") return null;

  const blank: "numeral" | "noun" = Math.random() < 0.5 ? "numeral" : "noun";
  const correct = blank === "numeral" ? numCorrect : nounCorrect;
  const distractor =
    blank === "numeral"
      ? compoundNumeralDistractor(decade, unit, phraseCase, noun.gender, numCorrect, allowedCases)
      : nounDistractor(noun, cell, nounCorrect);
  if (!distractor) return null;

  const frame = CASE_FRAME[phraseCase];
  const shownNum = blank === "numeral" ? "___" : numCorrect;
  const shownNoun = blank === "noun" ? "___" : nounCorrect;
  let contextPhrase: string;
  if (frame?.prep) {
    // Слово одразу після прийменника — десятка; вокалізацію рахуємо за її формою.
    const decadeForm = numeralForm(decade, phraseCase, noun.gender);
    const p = vocalize(frame.prep, decadeForm);
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
    masc_anim: "чол. іст.", masc_inan: "чол. неіст.", fem: "жін.", neut: "сер.",
  };
  const taskText =
    blank === "numeral"
      ? `Оберіть числівник: ${lbl.uk} (${lbl.cz}) — ${lbl.question}`
      : `Оберіть іменник: ${genderUk[noun.gender]}, ${lbl.uk} (${lbl.cz}) — ${lbl.question}, ${
          cell.n === "sg" ? "однина" : "множина"
        }`;

  // Промпт: складене число. Для blank=numeral показуємо УКРАЇНСЬКЕ число як
  // орієнтир (готова чеська форма була б спойлером відповіді). Для blank=noun —
  // чеський іменник + укр. переклад (як у простих числах).
  const compoundUk = `${decade.uk} ${unit.uk}`;
  const promptWord = blank === "numeral" ? compoundUk : noun.cz;
  const promptUk = blank === "numeral" ? "" : noun.uk;
  const promptLabel = blank === "numeral" ? "українською 🇺🇦" : undefined;

  return {
    // Вага — за групою останньої цифри (compound-N), НЕ за конкретним
    // відмінком — саме так, як вирішили. Відмінок обирається випадково в
    // enumerateCompoundCombos(), тому тут лише group, без case.
    comboId: `compound-${group}`,
    blank,
    promptWord,
    promptUk,
    promptLabel,
    taskText,
    contextPhrase,
    correct,
    options: shuffle([correct, distractor]),
  };
}

function enumerateCompoundCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const group of [1, 2, 3, 4, 5]) {
    const cases = group === 5 ? NUMERAL_CASE_ORDER : DIRECT_CASES;
    // ОДНА запис на групу (не на кожен відмінок) — інакше група 5 (6 відмінків)
    // мала б у 3 рази більше записів у пулі за групи 1-4 (2 відмінки), і
    // пропорційна вибірка перекосила б усе на користь групи 5. Відмінок
    // обираємо ВИПАДКОВО всередині make() — вага помилок лишається на рівні
    // групи, як і вирішили (compound-N, без відмінка в id).
    combos.push({
      id: `compound-${group}`,
      wordId: `compound-${group}`,
      make: () => {
        const c = cases[Math.floor(Math.random() * cases.length)];
        const noun = PARTNER_POOL[Math.floor(Math.random() * PARTNER_POOL.length)];
        return buildCompoundQuestion(group, c, noun);
      },
    });
  }
  return combos;
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
  // Складені 21–99 (композиційно, 5 груп за останньою цифрою).
  combos.push(...enumerateCompoundCombos());
  return combos;
}

// Баланс base/compound: складені (compound) — новіша навичка, але їх лише 5
// груп проти 32+4 простих слів; без квоти вони б випадали рідко. Floor
// підібрано емпірично harness'ом (див. коментар нижче): compound стабільно
// присутній, але не давить прості числа. Точне число — константа, звірена
// прогоном тисяч раундів.
const NUM_KIND_QUOTA: KindQuota<string> = {
  kindOf: (c) => (c.id.startsWith("compound-") ? "compound" : "base"),
  minSlots: { compound: 2 },
};

export function generateNumeralAgreementSession(
  count: number,
  pool: Combo[] = enumerateAgreementCombos(),
  mistakes: MistakeStore = {}
): AgreementQuestion[] {
  const chosen = selectRoundCombos(pool, mistakes, count, (c) => c.wordId, undefined, NUM_KIND_QUOTA);
  const questions: AgreementQuestion[] = [];
  for (const c of chosen) {
    const q = c.make();
    if (q) questions.push(q);
  }
  return questions;
}
