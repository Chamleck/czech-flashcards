import {
  AdjectiveEntry,
  PronounEntry,
  PersonalPronounEntry,
  PersonalDeclension,
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
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { NOUNS } from "../data/nouns";
import { adjQuizUsable } from "../data/adjectiveCategories";
import { nounUsableAsPartner } from "../data/categories";
import { MistakeStore, comboId, selectRoundCombos } from "./flashcardWeights";

// Пул прикметників, придатних як випадковий партнер/носій у чужому реченні
// (без порядкових числівників — вони не мають з'являтись у квізі прикметників).
const ADJECTIVE_PARTNER_POOL = ADJECTIVES.filter((a) => adjQuizUsable(a.category));

// Питання квізу прикметників/займенників. Той самий контракт полів, що й у
// іменників/дієслів (щоб екран працював без змін), + необов'язкове contextPhrase:
// фраза-контекст із партнером і пропуском (напр. "jeho ___" або "___ nového").
export interface DeclQuestion {
  kind: "adjective" | "pronoun" | "personal";
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
  // Для записів-ступенів — базове слово (напр. vysoký/високий), яке показуємо
  // як підказку. Учень має сам утворити й відмінити ступінь, а не бачити його
  // готовим у промпті. У звичайного ступеня й займенників відсутнє.
  baseCz?: string;
  baseUk?: string;
}

function buildTestedPool(): Tested[] {
  // Прикметники: звичайний ступінь + (для градуйованих) вищий і найвищий —
  // кожен окремим тестованим записом з унікальним id (окремий трекінг помилок).
  // Порядкові числівники (category "ordinal") виключено — вони тестуються лише
  // у власному розділі "Числівники", не в загальному квізі прикметників.
  const adj: Tested[] = ADJECTIVES.filter((a) => adjQuizUsable(a.category)).flatMap((a) => {
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
        baseCz: a.cz,
        baseUk: a.uk,
      });
      out.push({
        id: `${a.id}__super`,
        kind: "adjective",
        cz: a.degrees.superlative.cz,
        uk: a.degrees.superlative.uk,
        decl: a.degrees.superlative.declension,
        degree: "superlative",
        baseCz: a.cz,
        baseUk: a.uk,
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
// Виключаємо категорії, непридатні як носій (дні/місяці/сотні): "jeho ___ únoru"
// граматично коректне, але семантично абсурдне.
function nounCarrierForm(g: Gender, c: CzechCase, n: GrammaticalNumber): string {
  const pool = NOUNS.filter((noun) => noun.gender === g && nounUsableAsPartner(noun.category));
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
  const a = ADJECTIVE_PARTNER_POOL[Math.floor(Math.random() * ADJECTIVE_PARTNER_POOL.length)];
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
    // Для ступенів показуємо базове слово (vysoký), а не готову форму ступеня.
    promptWord: tested.baseCz ?? tested.cz,
    promptUk: tested.baseUk ?? tested.uk,
    taskText: taskTextFor(tested, gender, targetCase, targetNumber),
    contextPhrase: buildContextPhrase(tested, gender, targetCase, targetNumber),
    correct,
    options: shuffle([correct, distractor]),
  };
}

// ════════════════════ ОСОБОВІ ЗАЙМЕННИКИ У КВІЗІ ════════════════════
// Особові не вкладаються у FullDeclension (нерегулярні; вісь «варіант» замість
// числа), тому мають власний генератор комбо, але видають ТОЙ САМИЙ DeclQuestion
// і підмішуються в ту саму сесію (спільні ваги/раунд). Правила (звірено з ÚJČ):
//  • Дистрактор — форма того ж займенника з ІНШОГО відмінка, яка при цьому НЕ є
//    водночас формою цільового відмінка (синкретизм 2=4 відм.: mě/mne — і родовий,
//    і знахідний, тому mne не дистрактор до родового mě). Це + фільтр довготи
//    (collapseVowelLength) прибирають вільні дублети й пару ji/jí.
//  • Регістр 0 = без прийм./короткий, 1 = після прийм./довгий.
//  • Підмет фрейму ≠ тестований займенник (інакше кореференція «Vidím mě»).
//  • Приклонка не стоїть першою в реченні (Вакернагель) — пропуск не на 1-й позиції.
//  • Прийменник вокалізується (ke mně, se mnou, ode mě). 3-тя особа без прийменника
//    — ненаголошена енклітика (ho, mu, je), не jeho/jemu.
type Reg = 0 | 1;
const PP_QUIZ_CASES: CzechCase[] = ["genitiv", "dativ", "akuzativ", "lokal", "instrumental"];
const PP_PERSON: Record<string, 1 | 2 | 3> = {
  "pp-ja": 1, "pp-ty": 2, "pp-my": 1, "pp-vy": 2, "pp-on": 3, "pp-oni": 3, "pp-se": 3,
};
const REG_LABEL_3: Record<Reg, string> = { 0: "без прийм.", 1: "після прийм." };
const REG_LABEL_12: Record<Reg, string> = { 0: "короткий", 1: "довгий" };

type RegPair = [string, string]; // [рег.0, рег.1]
// Канонічні quiz-форми 3-ї особи (у рег.0 — ненаголошена енклітика).
// masc_inan == masc_anim (не дублюємо); neut відрізняється від masc лише в акузативі.
const PP_ON_FORMS: Record<"masc_anim" | "fem" | "neut", Partial<Record<CzechCase, RegPair>>> = {
  masc_anim: { genitiv: ["ho", "něho"], dativ: ["mu", "němu"], akuzativ: ["ho", "něho"], lokal: ["—", "něm"], instrumental: ["jím", "ním"] },
  fem: { genitiv: ["jí", "ní"], dativ: ["jí", "ní"], akuzativ: ["ji", "ni"], lokal: ["—", "ní"], instrumental: ["jí", "ní"] },
  neut: { genitiv: ["ho", "něho"], dativ: ["mu", "němu"], akuzativ: ["ho", "ně"], lokal: ["—", "něm"], instrumental: ["jím", "ním"] },
};
const PP_ONI_FORMS: Partial<Record<CzechCase, RegPair>> = {
  genitiv: ["jich", "nich"], dativ: ["jim", "nim"], akuzativ: ["je", "ně"], lokal: ["—", "nich"], instrumental: ["jimi", "nimi"],
};

interface Frame { pre: string; post: string; prep?: string }
interface CaseFrame { s1: Frame; s2: Frame } // s1 підмет «я» (цілі 2/3 ос.); s2 підмет «ти» (ціль 1 ос.)
const PP_FRAMES: Partial<Record<CzechCase, Partial<Record<Reg, CaseFrame>>>> = {
  genitiv: {
    0: { s1: { pre: "Bojím se ", post: "." }, s2: { pre: "Bojíš se ", post: "?" } },
    1: { s1: { pre: "Dostal jsem dárek ", post: ".", prep: "od" }, s2: { pre: "Dostal jsi dárek ", post: "?", prep: "od" } },
  },
  dativ: {
    0: { s1: { pre: "Věřím ", post: "." }, s2: { pre: "Věříš ", post: "?" } },
    1: { s1: { pre: "Jdu ", post: ".", prep: "k" }, s2: { pre: "Jdeš ", post: "?", prep: "k" } },
  },
  akuzativ: {
    0: { s1: { pre: "Vidím ", post: "." }, s2: { pre: "Vidíš ", post: "?" } },
    1: { s1: { pre: "Ten dárek je ", post: ".", prep: "pro" }, s2: { pre: "Ten dárek je ", post: ".", prep: "pro" } },
  },
  lokal: {
    1: { s1: { pre: "Mluví se ", post: ".", prep: "o" }, s2: { pre: "Mluví se ", post: ".", prep: "o" } },
  },
  instrumental: {
    1: { s1: { pre: "Pojedu ", post: ".", prep: "s" }, s2: { pre: "Pojedeš ", post: "?", prep: "s" } },
  },
};

// Зворотний se: власні фрейми (справжні зворотні аргументи; reflexivum tantum
// типу «díval se» виключено — там se зрощене з дієсловом, не відмінкова форма).
interface SeFrame { reg: Reg; frame: Frame; form: string }
const SE_FRAMES: Partial<Record<CzechCase, SeFrame[]>> = {
  genitiv: [{ reg: 1, frame: { pre: "Nemám peníze ", post: ".", prep: "u" }, form: "sebe" }],
  dativ: [
    { reg: 0, frame: { pre: "Koupil jsem ", post: " novou knihu." }, form: "si" },
    { reg: 1, frame: { pre: "Byl jsem ", post: " přísný.", prep: "k" }, form: "sobě" },
  ],
  akuzativ: [
    { reg: 0, frame: { pre: "Vidím ", post: " v zrcadle." }, form: "se" },
    { reg: 1, frame: { pre: "Udělal jsem to ", post: ".", prep: "pro" }, form: "sebe" },
  ],
  lokal: [{ reg: 1, frame: { pre: "Mluvím ", post: ".", prep: "o" }, form: "sobě" }],
  instrumental: [{ reg: 1, frame: { pre: "Vezmi si to ", post: ".", prep: "s" }, form: "sebou" }],
};

// Вокалізація прийменника перед формою (покриває já/ty/se/3-тю особу).
function vocalizePrep(prep: string, ans: string): string {
  if (prep === "k" && /^mn/.test(ans)) return "ke"; // ke mně / ke mne
  if (prep === "s" && /^mnou/.test(ans)) return "se"; // se mnou (s sebou лишається s)
  if (prep === "od" && /^mn?[ěe]/.test(ans)) return "ode"; // ode mě / ode mne
  return prep;
}
function fillFrame(fr: Frame, ans: string, antecedent?: string): string {
  const prep = fr.prep ? vocalizePrep(fr.prep, ans) + " " : "";
  const core = `${fr.pre}${prep}___${fr.post}`;
  return antecedent ? `${antecedent} ${core}` : core;
}

// Антецедент для 3-ї особи: узгоджена НС (присвійний/вказівний + прикметник +
// іменник) у знахідному, щоб задати референт і рід. Іменник — переважно істота
// (people/animals), щоб фрейми на кшталт «věřím mu» звучали природно.
function buildAntecedent(g: Gender, n: GrammaticalNumber): string {
  // dítě нерегулярне у множині (děti — жіноче узгодження), тому не беремо його
  // в антецедент множини, щоб «svá bílá děti» не траплялось. Дні/місяці/сотні
  // також виключаємо як носій (nounUsableAsPartner).
  const ok = (x: (typeof NOUNS)[number]) =>
    x.gender === g && nounUsableAsPartner(x.category) && !(n === "pl" && x.cz === "dítě");
  const animate = NOUNS.filter((x) => ok(x) && (x.category === "people" || x.category === "animals"));
  const genderPool = NOUNS.filter(ok);
  const pool = animate.length > 0 ? animate : genderPool;
  if (pool.length === 0) return "";
  const noun = pool[Math.floor(Math.random() * pool.length)];
  const decl = PRONOUNS.filter((p) => p.declinable) as Extract<PronounEntry, { declinable: true }>[];
  const pr = decl[Math.floor(Math.random() * decl.length)];
  const adj = ADJECTIVE_PARTNER_POOL[Math.floor(Math.random() * ADJECTIVE_PARTNER_POOL.length)];
  const prF = firstForm(pr.declension[g].akuzativ[n]);
  const adjF = firstForm(adj.declension[g].akuzativ[n]);
  const nounF = firstForm(noun.declension.akuzativ[n]);
  return `Znáš ${prF} ${adjF} ${nounF}?`;
}

// Форми того ж займенника з ІНШИХ відмінків (кандидати в дистрактори).
function ppOtherForms(getForm: (c: CzechCase, r: Reg) => string, exceptCase: CzechCase): string[] {
  const out: string[] = [];
  for (const c of PP_QUIZ_CASES) {
    if (c === exceptCase) continue;
    out.push(getForm(c, 0), getForm(c, 1));
  }
  return out;
}

function ppTaskText(g: Gender | null, c: CzechCase, reg: Reg, is3rdPerson: boolean): string {
  const l = CASE_LABELS[c];
  const regLbl = is3rdPerson ? REG_LABEL_3[reg] : REG_LABEL_12[reg];
  const genPart = g ? `${GENDER_SHORT[g]}, ` : "";
  return `Оберіть займенник: ${genPart}${l.uk} (${l.cz}) — ${l.question}, ${regLbl}`;
}

interface PPCombo {
  id: string;
  wordId: string;
  correct: string;
  forms: string[]; // кандидати в дистрактори (інші відмінки)
  avoid: string[]; // форми цільового відмінка (обидва регістри) — не дистрактори (синкретизм)
  taskText: string;
  contextFactory: () => string;
  promptWord: string;
  promptUk: string;
  gender: Gender;
  targetCase: CzechCase;
  reg: Reg;
}

function ppUsableDistractor(correct: string, avoidCollapsed: Set<string>, d: string): boolean {
  return isUsableDistractor(correct, d) && !avoidCollapsed.has(collapseVowelLength(d));
}

function enumeratePersonalCombos(): UnitCombo[] {
  const units: UnitCombo[] = [];
  const push = (c: PPCombo) => {
    const avoidCollapsed = new Set(c.avoid.filter((f) => f && f !== "—").map(collapseVowelLength));
    if (!c.forms.some((f) => ppUsableDistractor(c.correct, avoidCollapsed, f))) return;
    units.push({
      id: c.id,
      wordId: c.wordId,
      make: () => {
        const distractor = shuffle(c.forms).find((f) => ppUsableDistractor(c.correct, avoidCollapsed, f));
        if (!distractor) return null;
        return {
          kind: "personal",
          gender: c.gender,
          targetCase: c.targetCase,
          targetNumber: c.reg === 0 ? "sg" : "pl", // (регістр у слот числа; екран не показує)
          comboId: c.id,
          promptWord: c.promptWord,
          promptUk: c.promptUk,
          taskText: c.taskText,
          contextPhrase: c.contextFactory(),
          correct: c.correct,
          options: shuffle([c.correct, distractor]),
        };
      },
    });
  };

  for (const entry of PERSONAL_PRONOUNS) {
    const person = PP_PERSON[entry.id];

    if (entry.id === "pp-se") {
      const getForm = (c: CzechCase, r: Reg): string =>
        SE_FRAMES[c]?.find((x) => x.reg === r)?.form ?? "—";
      for (const c of PP_QUIZ_CASES) {
        for (const sf of SE_FRAMES[c] ?? []) {
          push({
            id: comboId(entry.id, `x_${c}`, `${sf.reg}`),
            wordId: entry.id,
            correct: sf.form,
            forms: ppOtherForms(getForm, c),
            avoid: [getForm(c, 0), getForm(c, 1)],
            taskText: ppTaskText(null, c, sf.reg, false),
            contextFactory: () => fillFrame(sf.frame, sf.form),
            promptWord: entry.cz,
            promptUk: entry.uk,
            gender: "masc_anim",
            targetCase: c,
            reg: sf.reg,
          });
        }
      }
      continue;
    }

    if (!entry.gendered) {
      const decl: PersonalDeclension = entry.declension;
      const getForm = (c: CzechCase, r: Reg): string => firstForm(r === 0 ? decl[c].a : decl[c].b);
      for (const c of PP_QUIZ_CASES) {
        for (const r of [0, 1] as Reg[]) {
          const cf = PP_FRAMES[c]?.[r];
          if (!cf) continue;
          const form = getForm(c, r);
          if (!form || form === "—") continue;
          const frame = person === 1 ? cf.s2 : cf.s1;
          push({
            id: comboId(entry.id, `x_${c}`, `${r}`),
            wordId: entry.id,
            correct: form,
            forms: ppOtherForms(getForm, c),
            avoid: [getForm(c, 0), getForm(c, 1)],
            taskText: ppTaskText(null, c, r, false),
            contextFactory: () => fillFrame(frame, form),
            promptWord: entry.cz,
            promptUk: entry.uk,
            gender: "masc_anim",
            targetCase: c,
            reg: r,
          });
        }
      }
      continue;
    }

    if (entry.id === "pp-on") {
      const genders: ("masc_anim" | "fem" | "neut")[] = ["masc_anim", "fem", "neut"];
      for (const g of genders) {
        const table = PP_ON_FORMS[g];
        const getForm = (c: CzechCase, r: Reg): string => table[c]?.[r] ?? "—";
        for (const c of PP_QUIZ_CASES) {
          for (const r of [0, 1] as Reg[]) {
            const cf = PP_FRAMES[c]?.[r];
            if (!cf) continue;
            const form = getForm(c, r);
            if (!form || form === "—") continue;
            push({
              id: comboId(entry.id, `${g}_${c}`, `${r}`),
              wordId: entry.id,
              correct: form,
              forms: ppOtherForms(getForm, c),
              avoid: [getForm(c, 0), getForm(c, 1)],
              taskText: ppTaskText(g, c, r, true),
              contextFactory: () => fillFrame(cf.s1, form, buildAntecedent(g, "sg")),
              promptWord: entry.cz,
              promptUk: entry.uk,
              gender: g,
              targetCase: c,
              reg: r,
            });
          }
        }
      }
      continue;
    }

    if (entry.id === "pp-oni") {
      const getForm = (c: CzechCase, r: Reg): string => PP_ONI_FORMS[c]?.[r] ?? "—";
      for (const c of PP_QUIZ_CASES) {
        for (const r of [0, 1] as Reg[]) {
          const cf = PP_FRAMES[c]?.[r];
          if (!cf) continue;
          const form = getForm(c, r);
          if (!form || form === "—") continue;
          push({
            id: comboId(entry.id, `pl_${c}`, `${r}`),
            wordId: entry.id,
            correct: form,
            forms: ppOtherForms(getForm, c),
            avoid: [getForm(c, 0), getForm(c, 1)],
            taskText: ppTaskText(null, c, r, true),
            // рід лише декорує антецедент (непрямі форми множини спільні для всіх родів)
            contextFactory: () => {
              const ag = shuffle(["masc_anim", "masc_inan", "fem", "neut"] as Gender[])[0];
              return fillFrame(cf.s1, form, buildAntecedent(ag, "pl"));
            },
            promptWord: entry.cz,
            promptUk: entry.uk,
            gender: "masc_anim",
            targetCase: c,
            reg: r,
          });
        }
      }
      continue;
    }
  }
  return units;
}

// Уніфікована одиниця сесії: adj/pron і особові зводяться до цього інтерфейсу,
// щоб крутитись в одному зваженому циклі (спільні ваги помилок, раунд, «не поспіль»).
interface UnitCombo {
  id: string; // comboId (ваги)
  wordId: string; // «не те саме слово поспіль»
  make: () => DeclQuestion | null;
}

function adjPronUnits(pool: Tested[]): UnitCombo[] {
  return enumerateCombos(pool).map((c) => ({
    id: c.id,
    wordId: c.tested.id,
    make: () => makeQuestion(c),
  }));
}

// Сесія: вибір комбінацій — спільний selectRoundCombos (ваги + зарезервовані
// слоти помилок + «не те саме слово поспіль»).
export function generateDeclensionSession(
  count: number,
  pool: Tested[] = buildTestedPool(),
  mistakes: MistakeStore = {}
): DeclQuestion[] {
  // Один пул: прикметники + присвійні/вказівні + особові (усе крутиться разом).
  // Вибір (ваги + зарезервовані слоти помилок + «не те саме слово поспіль») —
  // спільний selectRoundCombos.
  const combos: UnitCombo[] = [...adjPronUnits(pool), ...enumeratePersonalCombos()];
  const chosen = selectRoundCombos(combos, mistakes, count, (c) => c.wordId);
  const questions: DeclQuestion[] = [];
  for (const c of chosen) {
    const q = c.make();
    if (q) questions.push(q);
  }
  return questions;
}
