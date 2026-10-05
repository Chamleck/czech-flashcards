import {
  CardinalEntry,
  CzechCase,
  CASE_LABELS,
  NUMERAL_CASE_ORDER,
  Gender,
  NounEntry,
  GrammaticalNumber,
  PluralOnlyForms,
} from "../types";
import { CARDINALS } from "../data/cardinals";
import { NOUNS } from "../data/nouns";
import { nounUsableAsPartner } from "../data/categories";
import { NUMERAL_FRAMES, NumeralFrame } from "../data/numeralFrames";
import type { QuizCase } from "../data/declensionFrames";
import type { VocalPrep } from "../data/prepositionPartners";
import { matchesNeeds, freshWeightedOrder, acceptedForms, formOf, vocalDecision } from "./partnerSelection";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";

// ─────────────────── Узгодження числівник + іменник ───────────────────
// Тестує ОДНЕ з двох слів групи (числівник або іменник) у реченні з data/numeralFrames.ts; друге слово показане
// готовою правильною формою. Правила (IJP id=792 «Počítaný předmět po číslovkách», Naše řeč 54/1971):
//  • jeden       → іменник в ОДНИНІ, узгоджений рід + відмінок;
//  • dva/oba/3/4 → іменник у МНОЖИНІ, той самий відмінок;
//  • pět+        → у називному/знахідному іменник у РОДОВОМУ множини, у непрямих — той самий відмінок;
//  • sto/tisíc/milion/miliarda → іменник у родовому множини; у непрямих відмінках можлива й відмінкова
//    shoda («s třemi tisíci diváků / diváky»), а sto буває невідмінюваним («ke sto korunám») — обидва варіанти
//    квіз приймає (ніколи не подає як помилку);
//  • складені 21–99 → правило ОСТАННЬОЇ цифри; на …2–…4 у називному/знахідному правильний і родовий множини
//    («dvacet dva žáci» і «dvacet dva žáků»), у непрямих відмінюються обидві частини («od dvaceti dvou žáků»);
//    на …1 — «dvacet jeden žák» / «dvacet jedna žáků», у непрямих «k dvaceti jedna žákům» (див. agreeing21Counter);
//  • іменники лише з множиною (kalhoty, brýle) → jedny / dvoje / oboje / troje / čtvery (поле pluralOnly картки),
//    від п'яти — звичайне pět kalhot.
// Відповідь завжди одна: дистрактор — справжня форма того самого слова, що НЕ входить у прийнятні форми клітинки
// (усі дублети, variants іменника, варіанти з IJP вище).

export interface AgreementQuestion {
  comboId: string;
  blank: "numeral" | "noun";
  promptWord: string;
  promptUk: string;
  promptLabel: string; // частина мови тестованого слова ("числівник"/"іменник")
  taskText: string; // "Оберіть іменник: чол. іст., Давальний (Dativ) — Komu? Čemu?, множина"
  contextPhrase: string; // "Volám dvěma ___." / "Volám ___ kamarádům."
  correct: string;
  options: string[];
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const split = (s: string): string[] => s.split(" / ").map((x) => x.trim());
const isDirect = (c: CzechCase) => c === "nominativ" || c === "akuzativ";
const isMasc = (g: Gender) => g === "masc_anim" || g === "masc_inan";
const hasNumber = (n: NounEntry, num: GrammaticalNumber) => n.declension.nominativ[num] !== "—";
const QUIZ_CASES = NUMERAL_CASE_ORDER as QuizCase[];
const GENDERS: Gender[] = ["masc_anim", "masc_inan", "fem", "neut"];

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

// Дистрактор: справжня форма, не прийнятна для клітинки й не та сама форма з іншою довжиною голосного.
function usable(d: string | null | undefined, accepted: string[], correct: string): d is string {
  return !!d && d !== "—" && !accepted.includes(d) && collapseVowelLength(d) !== collapseVowelLength(correct);
}

// ─────────────────── Лічильне слово ───────────────────
// Усе, що квізу треба знати про числівник: його форми, які клітинки іменника він вимагає і з якими іменниками
// поєднується. Один інтерфейс для простих числівників, сотень, складених 21–99 і форм jedny / dvoje.
type Cell = { c: CzechCase; n: GrammaticalNumber };
// Прості й складені числівники в cardinals.ts — від 1 до 99.
const CARDINAL_MAX = 99;

interface Counter {
  key: string; // однаковий key — однаковий набір придатних іменників (кеш кандидатів)
  forms: (c: CzechCase, g: Gender) => string[]; // прийнятні форми; [0] показуємо
  // Питання з пропуском на числівнику: заголовок (саме слово й переклад) і кандидати-дистрактори за пріоритетом
  // (фільтр — usable). Немає — лише пропуск на іменнику.
  numeral?: { prompt: { word: string; uk: string }; distractors: (c: CzechCase, g: Gender) => string[] };
  cell: (c: CzechCase) => Cell; // клітинка іменника, яку показуємо як правильну
  altCells: (c: CzechCase) => Cell[]; // теж правильні клітинки (варіанти з IJP) — ніколи не дистрактор
  nounDistractorCells: (c: CzechCase) => Cell[]; // кандидати за пріоритетом
  taskCase: (c: CzechCase) => CzechCase; // відмінок у підписі завдання про іменник
  verbPl: boolean; // дієслово {V}: множина після 2–4
  many: boolean; // кількість від двох (фрази з mezi)
  value: number; // найбільша кількість, яку це слово означає (фрази з max: data/numeralFrames.ts)
  cases?: QuizCase[]; // лише ці відмінки (інакше всі)
  accepts: (n: NounEntry) => boolean;
}

const otherCases = (c: CzechCase) => shuffle(NUMERAL_CASE_ORDER.filter((x) => x !== c));
const firstOf = (s: string) => split(s)[0];

// Форма простого числівника для іменника роду g (усі дублети).
function cardinalForms(card: CardinalEntry, c: CzechCase, g: Gender): string[] {
  switch (card.kind) {
    case "gendered":
      return split(card.declension[g][c].sg);
    case "twoForm":
      return split(card.forms[c][isMasc(g) ? "masc" : "femNeut"]);
    case "invariantDecl":
      return split(card.forms[c]);
    case "oblique":
      return isDirect(c) ? [card.direct] : split(card.oblique);
  }
}

// Яку клітинку іменника вимагає простий числівник у відмінку c.
function cardinalCell(card: CardinalEntry, c: CzechCase): Cell {
  if (card.kind === "gendered") return { c, n: "sg" };
  if (card.kind === "oblique" && isDirect(c)) return { c: "genitiv", n: "pl" };
  return { c, n: "pl" };
}

// Кандидати-дистрактори іменника: спершу типова помилка правила (інше число / родовий після 5+), далі інші відмінки.
function cardinalNounDistractors(card: CardinalEntry, c: CzechCase): Cell[] {
  if (card.kind === "gendered") return [{ c, n: "pl" }, ...otherCases(c).map((x) => ({ c: x, n: "sg" as const }))];
  if (card.kind === "oblique") {
    if (isDirect(c)) return [{ c, n: "pl" }, { c: "genitiv", n: "sg" }, ...otherCases("genitiv").map((x) => ({ c: x, n: "pl" as const }))];
    return [{ c, n: "sg" }, { c: "genitiv", n: "pl" }, ...otherCases(c).map((x) => ({ c: x, n: "pl" as const }))];
  }
  return [{ c, n: "sg" }, ...otherCases(c).map((x) => ({ c: x, n: "pl" as const }))];
}

const countable = (n: NounEntry) => !n.uncountable;
const pluralOnly = (n: NounEntry) => !hasNumber(n, "sg") && hasNumber(n, "pl");
const bothNumbers = (n: NounEntry) => hasNumber(n, "sg") && hasNumber(n, "pl");

function simpleCounter(card: CardinalEntry): Counter {
  return {
    key: `card:${card.id}`,
    forms: (c, g) => cardinalForms(card, c, g),
    numeral: {
      prompt: { word: card.cz, uk: card.uk },
      distractors: (c, g) => {
        const out = otherCases(c).map((x) => cardinalForms(card, x, g)[0]);
        // інший рід у тому самому відмінку: jeden ↔ jednoho, dva ↔ dvě
        if (card.kind === "gendered" || card.kind === "twoForm") for (const og of GENDERS) out.push(cardinalForms(card, c, og)[0]);
        return out;
      },
    },
    cell: (c) => cardinalCell(card, c),
    altCells: () => [],
    nounDistractorCells: (c) => cardinalNounDistractors(card, c),
    taskCase: (c) => c,
    verbPl: card.kind === "twoForm" || card.kind === "invariantDecl",
    many: card.kind !== "gendered",
    value: CARDINAL_MAX,
    // jeden, 2–4 — лише слова з обома числами (kalhoty рахують jedny / dvoje); pět+ — і слова лише з множиною.
    accepts: card.kind === "oblique" ? (n) => countable(n) && hasNumber(n, "pl") : (n) => countable(n) && bothNumbers(n),
  };
}

function hundredCounter(h: NounEntry): Counter {
  const forms = (c: CzechCase) => [...split(h.declension[c].sg), ...(h.uninflectedAsNumeral ? [h.cz] : [])];
  return {
    key: `hundred:${h.id}`,
    forms: (c) => forms(c),
    numeral: { prompt: { word: h.cz, uk: h.uk }, distractors: (c) => otherCases(c).map((x) => firstOf(h.declension[x].sg)) },
    cell: () => ({ c: "genitiv", n: "pl" }),
    // «s třemi tisíci diváků / diváky» — у непрямих відмінках правильна й відмінкова shoda (IJP id=792)
    altCells: (c) => (isDirect(c) || c === "genitiv" ? [] : [{ c, n: "pl" }]),
    nounDistractorCells: () => [{ c: "genitiv", n: "sg" }, ...otherCases("genitiv").map((x) => ({ c: x, n: "pl" as const }))],
    taskCase: () => "genitiv",
    verbPl: false,
    many: true,
    value: h.numeralValue ?? Infinity, // без numeralValue — лише у фрази без max (dev-перевірка попереджає)
    accepts: (n) => countable(n) && hasNumber(n, "pl"),
  };
}

// Складене число «десяток + одиниця» на …2–…9. Узгодження веде одиниця (unit — картка dva…devět).
function compoundCounter(decade: CardinalEntry, unit: CardinalEntry, group: number): Counter {
  const lowGroup = group <= 4; // …2–…4: у називному/знахідному правильний і родовий множини
  const join = (dc: CzechCase, uc: CzechCase, g: Gender) => `${cardinalForms(decade, dc, g)[0]} ${cardinalForms(unit, uc, g)[0]}`;
  const allForms = (c: CzechCase, g: Gender): string[] => {
    const out: string[] = [];
    for (const d of cardinalForms(decade, c, g)) for (const u of cardinalForms(unit, c, g)) out.push(`${d} ${u}`);
    return out;
  };
  return {
    key: `compound:${group}`,
    forms: (c, g) => {
      const shown = allForms(c, g);
      if (!lowGroup || isDirect(c)) return shown;
      // У непрямих відмінках у мові трапляється й невідмінювана форма («s dvacet dva žáky» — Naše řeč 1971):
      // показуємо повністю відмінювану (вона переважає), решту не подаємо як помилку.
      const extra: string[] = [];
      for (const dc of NUMERAL_CASE_ORDER)
        for (const og of GENDERS) extra.push(`${cardinalForms(decade, dc, og)[0]} ${cardinalForms(unit, "nominativ", og)[0]}`);
      return [...shown, ...extra.filter((x) => !shown.includes(x))];
    },
    numeral: {
      // українське число як орієнтир: чеська форма була б підказкою відповіді
      prompt: { word: `${decade.uk} ${unit.uk}`, uk: "" },
      distractors: (c, g) => {
        const oc = otherCases(c);
        const out = [...oc.map((x) => join(x, x, g)), ...oc.map((x) => join(c, x, g))];
        if (unit.kind === "gendered" || unit.kind === "twoForm") for (const og of GENDERS) out.push(join(c, c, og));
        return out;
      },
    },
    cell: (c) => cardinalCell(unit, c),
    altCells: () => (lowGroup ? [{ c: "genitiv", n: "pl" }] : []),
    nounDistractorCells: (c) => cardinalNounDistractors(unit, c),
    taskCase: (c) => c,
    verbPl: unit.kind === "twoForm" || unit.kind === "invariantDecl",
    many: true,
    value: CARDINAL_MAX,
    accepts: lowGroup ? (n) => countable(n) && bothNumbers(n) : (n) => countable(n) && hasNumber(n, "pl"),
  };
}

// Складені на …1 (21, 31…). IJP (hesla jednadvacet, jeden; id=792) дає лише називний: «dvacet jeden žák» (однина,
// узгоджена з jeden) і «dvacet jedna žáků» (родовий множини, як після 5+); повного відмінювання «dvaceti jednomu»
// у ній немає. Тому дві конструкції:
//  • узгоджена — лише називний: «Na fotce je dvacet jeden ___» → dědeček;
//  • з «dvacet jedna» — усі відмінки: «Mám dvacet jedna ___» → bratrů; у непрямих число відмінюється частково,
//    іменник у тому самому відмінку множини: «k dvaceti jedna žákům», «od dvaceti jedna žáků» (Naše řeč 1971).
// Пропуск — лише іменник: форма самого числа «jeden / jedna / dvaceti jedna» в мові коливається, однієї правильної
// відповіді для кнопки немає.
function agreeing21Counter(decade: CardinalEntry, unit: CardinalEntry): Counter {
  return {
    key: "compound:1-agree",
    forms: (c, g) => [`${cardinalForms(decade, c, g)[0]} ${cardinalForms(unit, c, g)[0]}`],
    cell: (c) => ({ c, n: "sg" }),
    altCells: () => [{ c: "genitiv", n: "pl" }],
    nounDistractorCells: (c) => otherCases(c).map((x) => ({ c: x, n: "sg" as const })),
    taskCase: (c) => c,
    verbPl: false,
    many: true,
    value: CARDINAL_MAX,
    cases: ["nominativ"],
    accepts: (n) => countable(n) && bothNumbers(n),
  };
}

function invariant21Counter(decade: CardinalEntry, unit: CardinalEntry): Counter {
  const one = unit.kind === "gendered" ? firstOf(unit.declension.fem.nominativ.sg) : unit.cz; // «jedna»
  return {
    key: "compound:1-jedna",
    forms: (c, g) => [`${cardinalForms(decade, c, g)[0]} ${one}`],
    cell: (c) => (isDirect(c) ? { c: "genitiv", n: "pl" } : { c, n: "pl" }),
    // називний/знахідний: однина того самого відмінка (dvacet jedna žena) — теж правильна; непрямі: і родовий
    // множини («k dvaceti jedna žáků» — Naše řeč)
    altCells: (c) => (isDirect(c) ? [{ c, n: "sg" }] : [{ c: "genitiv", n: "pl" }]),
    nounDistractorCells: (c) =>
      isDirect(c)
        ? [{ c: "genitiv", n: "sg" }, ...otherCases(c).filter((x) => !isDirect(x) && x !== "genitiv").map((x) => ({ c: x, n: "pl" as const }))]
        : otherCases(c).filter((x) => x !== "genitiv").map((x) => ({ c: x, n: "pl" as const })),
    taskCase: (c) => c,
    verbPl: false,
    many: true,
    value: CARDINAL_MAX,
    accepts: (n) => countable(n) && bothNumbers(n),
  };
}

// jedny / dvoje / oboje / troje / čtvery з іменниками лише з множиною.
function pluralOnlyCounter(card: CardinalEntry, po: PluralOnlyForms): Counter {
  const form = (c: CzechCase, g: Gender) => (g === "neut" && po.neut?.[c]) || po.forms[c];
  return {
    key: `po:${card.id}`,
    forms: (c, g) => [form(c, g)],
    numeral: {
      prompt: { word: card.cz, uk: card.uk },
      distractors: (c, g) => [
        // типова помилка в називному/знахідному — звичайна форма: «dvě kalhoty», «jedna kalhoty»
        ...(isDirect(c) ? [cardinalForms(card, c, g)[0]] : []),
        ...otherCases(c).map((x) => form(x, g)),
      ],
    },
    cell: (c) => ({ c, n: "pl" }),
    altCells: () => [],
    nounDistractorCells: (c) => otherCases(c).map((x) => ({ c: x, n: "pl" as const })),
    taskCase: (c) => c,
    verbPl: true,
    many: card.kind !== "gendered",
    value: 4,
    accepts: (n) => countable(n) && pluralOnly(n),
  };
}

// ─────────────────── Іменники й фрази ───────────────────
// Партнери: не дні/місяці/сотні (nounUsableAsPartner); незлічувані відсіює Counter.accepts.
const NOUN_POOL = NOUNS.filter((n) => nounUsableAsPartner(n.category));
const HUNDRED_NOUNS = NOUNS.filter((n) => n.category === "numbers");

const frameFits = (f: NumeralFrame, k: Counter, n: NounEntry) =>
  matchesNeeds(n, f) && (!f.many || k.many) && (f.max === undefined || k.value <= f.max);

// fit — у скількох фразах слово може з'явитися (з даних): вага 1/fit вирівнює частоту слів.
const FIT = new Map<string, number>(
  NOUN_POOL.map((n) => [n.id, Math.max(1, QUIZ_CASES.reduce((s, c) => s + NUMERAL_FRAMES[c].filter((f) => matchesNeeds(n, f)).length, 0))])
);

interface Candidate {
  noun: NounEntry;
  frames: NumeralFrame[];
}
const candCache = new Map<string, Candidate[]>();
function candidatesFor(k: Counter, c: QuizCase): Candidate[] {
  const key = `${k.key}|${k.value}|${k.many}|${c}`;
  let out = candCache.get(key);
  if (!out) {
    out = [];
    for (const noun of NOUN_POOL) {
      if (!k.accepts(noun)) continue;
      const frames = NUMERAL_FRAMES[c].filter((f) => frameFits(f, k, noun));
      if (frames.length > 0) out.push({ noun, frames });
    }
    candCache.set(key, out);
  }
  return out;
}

const GENDER_UK: Record<Gender, string> = { masc_anim: "чол. іст.", masc_inan: "чол. неіст.", fem: "жін.", neut: "сер." };
const PREP_SLOT = /\{([vksz])\} ___/;

// Речення з групою. firstWord — перше слово групи (числівник), за ним вирішується ve/ke/se/ze; null — фраза не
// годиться (вокалізацію не класифіковано).
function render(f: NumeralFrame, k: Counter, group: string, firstWord: string): string | null {
  let text = f.text;
  if (f.verb) text = text.replace("{V}", f.verb[k.verbPl ? 1 : 0]);
  const m = PREP_SLOT.exec(text);
  if (m) {
    const prep = m[1] as VocalPrep;
    const d = vocalDecision(prep, firstWord);
    if (d === null) return null;
    text = text.replace(`{${prep}} `, d === "vocal" ? `${prep}e ` : `${prep} `);
  }
  return text.replace("___", group);
}

interface Built {
  q: AgreementQuestion;
  nounId: string;
}

// Питання для (лічильне слово, відмінок): пропуск → іменник (свіжі першими, вага 1/fit) → фраза. Перебір повний:
// якщо питання для цієї пари взагалі можливе, воно буде побудоване.
function build(k: Counter, c: QuizCase, id: string, used: ReadonlySet<string>): Built | null {
  if (k.cases && !k.cases.includes(c)) return null;
  const cands = candidatesFor(k, c);
  type Side = { blank: "numeral"; numeral: NonNullable<Counter["numeral"]> } | { blank: "noun" };
  const sides: Side[] = k.numeral ? [{ blank: "numeral", numeral: k.numeral }, { blank: "noun" }] : [{ blank: "noun" }];
  for (const side of shuffle(sides)) {
    const blank = side.blank;
    for (const { noun, frames } of freshWeightedOrder(cands, (x) => used.has(x.noun.id), (x) => FIT.get(x.noun.id) ?? 1)) {
      const g = noun.gender;
      const numAcc = k.forms(c, g);
      const numShown = numAcc[0];
      const cell = k.cell(c);
      const nounShown = formOf(noun, cell.c, cell.n);
      if (!numShown || numShown.includes("—") || !nounShown) continue;
      const nounAcc = [cell, ...k.altCells(c)].flatMap((x) => acceptedForms(noun, x.c, x.n));
      const firstWord = numShown.split(" ")[0];

      let correct: string;
      let distractors: string[];
      if (side.blank === "numeral") {
        correct = numShown;
        distractors = side.numeral.distractors(c, g).filter((d) => usable(d, numAcc, correct));
      } else {
        correct = nounShown;
        distractors = k
          .nounDistractorCells(c)
          .map((x) => formOf(noun, x.c, x.n))
          .filter((d): d is string => usable(d, nounAcc, correct));
      }
      for (const f of shuffle(frames)) {
        // Прийменник перед пропуском-числівником: обидві кнопки мусять мати те саме ve/v («se ___» — і stem, і sta).
        const m = PREP_SLOT.exec(f.text);
        const distractor =
          blank === "numeral" && m
            ? distractors.find((d) => vocalDecision(m[1] as VocalPrep, d.split(" ")[0]) === vocalDecision(m[1] as VocalPrep, firstWord))
            : distractors[0];
        if (!distractor) continue;
        const group = blank === "numeral" ? `___ ${nounShown}` : `${numShown} ___`;
        const text = render(f, k, group, firstWord);
        if (!text) continue;
        const lbl = CASE_LABELS[c];
        const tl = CASE_LABELS[k.taskCase(c)];
        return {
          q: {
            comboId: id,
            blank,
            promptWord: side.blank === "numeral" ? side.numeral.prompt.word : noun.cz,
            promptUk: side.blank === "numeral" ? side.numeral.prompt.uk : noun.uk,
            promptLabel: blank === "numeral" ? "числівник" : "іменник",
            taskText:
              blank === "numeral"
                ? `Оберіть числівник: ${lbl.uk} (${lbl.cz}) — ${lbl.question}`
                : `Оберіть іменник: ${GENDER_UK[g]}, ${tl.uk} (${tl.cz}) — ${tl.question}, ${cell.n === "sg" ? "однина" : "множина"}`,
            contextPhrase: text,
            correct,
            options: shuffle([correct, distractor]),
          },
          nounId: noun.id,
        };
      }
    }
  }
  return null;
}

// ─────────────────── Комбінації ───────────────────
type NumKind = "base" | "hundreds" | "compound" | "plural-only";

interface Combo {
  id: string;
  wordId: string;
  kind: NumKind;
  make: (used: ReadonlySet<string>) => Built | null;
}

// Один відмінок, одне лічильне слово (прості числівники, сотні, jedny / dvoje…).
function singleCombo(id: string, wordId: string, kind: NumKind, k: Counter, c: QuizCase): Combo {
  return { id, wordId, kind, make: (used) => build(k, c, id, used) };
}

// ═══════════════════ СКЛАДЕНІ ЧИСЛА 21–99 ═══════════════════
// Без окремих записів у cardinals.ts: десяток (dvacet…devadesát) + одиниця (jeden…devět). Вага помилок — за
// ГРУПОЮ останньої цифри (compound-1 … compound-5, де 5 = «5–9»): навичка в тому, щоб упізнати правило. Відмінок,
// десяток і одиниця обираються всередині make() випадково, перебір повний.
const DECADE_IDS = [
  "card-dvacet", "card-tricet", "card-ctyricet", "card-padesat",
  "card-sedesat", "card-sedmdesat", "card-osmdesat", "card-devadesat",
];
const UNIT_IDS_BY_GROUP: Record<number, string[]> = {
  1: ["card-jeden"],
  2: ["card-dva"],
  3: ["card-tri"],
  4: ["card-ctyri"],
  5: ["card-pet", "card-sest", "card-sedm", "card-osm", "card-devet"],
};
const card = (id: string) => CARDINALS.find((c) => c.id === id)!;

function compoundCombo(group: number): Combo {
  const id = `compound-${group}`;
  const counters = DECADE_IDS.flatMap((d) =>
    UNIT_IDS_BY_GROUP[group].flatMap((u) =>
      group === 1
        ? [agreeing21Counter(card(d), card(u)), invariant21Counter(card(d), card(u))]
        : [compoundCounter(card(d), card(u), group)]
    )
  );
  return {
    id,
    wordId: id,
    kind: "compound",
    make: (used) => {
      for (const c of shuffle(QUIZ_CASES))
        for (const k of shuffle(counters)) {
          const b = build(k, c, id, used);
          if (b) return b;
        }
      return null;
    },
  };
}

// Комбо існує, лише якщо для нього питання будується (перевірка один раз під час перелічення): інакше
// зарезервоване під помилку комбо мовчки не з'являлося б.
function enumerateAll(): { combos: Combo[]; dropped: string[] } {
  const all: Combo[] = [];
  for (const cd of CARDINALS) {
    for (const c of QUIZ_CASES) {
      // ваги — на рівні числівник + відмінок, незалежно від іменника й пропуску (id сумісні зі старими)
      all.push(singleCombo(comboId(cd.id, c, "x"), cd.id, "base", simpleCounter(cd), c));
      if ("pluralOnly" in cd && cd.pluralOnly)
        all.push(singleCombo(comboId(cd.id, c, "pt"), cd.id, "plural-only", pluralOnlyCounter(cd, cd.pluralOnly), c));
    }
  }
  for (const h of HUNDRED_NOUNS) for (const c of QUIZ_CASES) all.push(singleCombo(comboId(h.id, c, "x"), h.id, "hundreds", hundredCounter(h), c));
  for (const g of [1, 2, 3, 4, 5]) all.push(compoundCombo(g));
  const combos = all.filter((x) => x.make(new Set()) !== null);
  return { combos, dropped: all.filter((x) => !combos.includes(x)).map((x) => x.id) };
}

let cached: Combo[] | null = null;
function allNumeralCombos(): Combo[] {
  if (!cached) {
    const { combos, dropped } = enumerateAll();
    if (dropped.length > 0 && typeof __DEV__ !== "undefined" && __DEV__)
      console.warn(`numeralQuiz: ${dropped.length} комбінацій без жодного питання: ${dropped.join(", ")}`);
    cached = combos;
  }
  return cached;
}

// ─────────────── Dev-перевірка даних (лише dev-збірка, нічого не блокує) ───────────────
function devCheckData(): void {
  const issues: string[] = [];
  for (const c of QUIZ_CASES)
    for (const f of NUMERAL_FRAMES[c]) {
      const k = NOUN_POOL.filter((n) => countable(n) && matchesNeeds(n, f)).length;
      if (k < 3) issues.push(`фраза «${f.text}» (${c}): лише ${k} іменників (потрібно ≥ 3)`);
    }
  for (const h of HUNDRED_NOUNS) if (h.numeralValue === undefined) issues.push(`${h.id}: немає numeralValue`);
  if (issues.length > 0) console.warn(`numeralQuiz: ${issues.length} зауваж.:\n  ` + issues.join("\n  "));
}
if (typeof __DEV__ !== "undefined" && __DEV__) devCheckData();

// ─────────────────── Сесія ───────────────────
// Баланс: складених лише 5 груп проти десятків простих комбо — без мінімуму вони б випадали рідко. Форми для слів
// лише з множиною мають 30 комбо на 2–3 іменники (brýle, kalhoty): вага 0,25 тримає їх близько одного питання на
// два раунди, інакше ці кілька слів повторювалися б щораунду.
const NUM_KIND_QUOTA: KindQuota<string> = {
  kindOf: (c) => (c as Combo).kind,
  minSlots: { compound: 2 },
  kindWeight: { "plural-only": 0.25 },
};

export function generateNumeralAgreementSession(
  count: number,
  pool: Combo[] = allNumeralCombos(),
  mistakes: MistakeStore = {}
): AgreementQuestion[] {
  const chosen = selectRoundCombos(pool, mistakes, count, (c) => c.wordId, undefined, NUM_KIND_QUOTA);
  const questions: AgreementQuestion[] = [];
  const used = new Set<string>(); // іменники раунду: той самий іменник не повторюється, поки є інші
  const take = (c: Combo) => {
    const b = c.make(used);
    if (!b) return;
    used.add(b.nounId);
    questions.push(b.q);
  };
  for (const c of chosen) take(c);
  // Добір, якщо make() повернув null (не мало б статися: комбо без питань відсіяні при переліченні).
  if (questions.length < count) {
    for (const c of shuffle(pool)) {
      if (questions.length >= count) break;
      if (!questions.some((x) => x.comboId === c.id)) take(c);
    }
  }
  return questions;
}
