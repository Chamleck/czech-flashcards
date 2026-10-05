import {
  AdjectiveEntry,
  PronounEntry,
  PersonalPronounEntry,
  PersonalDeclension,
  PronounQuiz,
  FullDeclension,
  NounEntry,
  NounFilter,
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
import { PERSONAL_PRONOUNS, PERSONAL_QUIZ_FORMS } from "../data/personalPronouns";
import { INTERROGATIVE_ADJ, INTERROGATIVE_CORE } from "../data/interrogativePronouns";
import { INDEFINITE_ADJ, INDEFINITE_CORE } from "../data/indefinitePronouns";
import { NOUNS } from "../data/nouns";
import { adjQuizUsable } from "../data/adjectiveCategories";
import { nounUsableAsPartner } from "../data/categories";
import {
  ANTECEDENT_FRAME,
  DECL_FRAMES,
  DeclFrame,
  PERSONAL_FRAMES,
  PersonalFrame,
  QuizCase,
  REFLEXIVE_FRAMES,
} from "../data/declensionFrames";
import type { VocalPrep } from "../data/prepositionPartners";
import { agreementGender, candidateNumbers, freshWeightedOrder, matchesFilter, vocalDecision } from "./partnerSelection";
import { MistakeStore, comboId, selectRoundCombos } from "./flashcardWeights";

// ═══════════════════ КВІЗ «ПРИКМЕТНИКИ ТА ЗАЙМЕННИКИ» ═══════════════════
// Знання — у даних: смислові теги іменників (data/nounTags.ts), fits прикметників (data/adjectives.ts), лексичні
// властивості займенників (поле quiz), фрази (data/declensionFrames.ts), речення kdo/co/někdo… (quizFrames у записі
// слова). Рушій лише складає з них питання: фраза → іменник за тегами → (інколи) слово-партнер → пропуск на
// тестованому слові. Жодних id слів у коді.
//
// Питання: тестоване слово × рід × відмінок × число (comboId не змінився з попередньої версії, ваги помилок сумісні).
// Дистрактор — реальна форма того ж слова, жодна з прийнятних форм цільової клітинки (усі дублети).

type DeclKind =
  | "adjective"
  | "pronoun"
  | "personal"
  | "interrogative-adj"
  | "interrogative-core"
  | "indefinite"
  | "indefinite-core";

export interface DeclQuestion {
  kind: DeclKind;
  gender: Gender;
  targetCase: CzechCase;
  targetNumber: GrammaticalNumber;
  comboId: string;
  promptWord: string; // словникова форма тестованого слова (starý, můj, ten)
  promptUk: string;
  promptLabel: string; // заголовок-підпис: частина мови ("прикметник"/"займенник")
  taskText: string;
  contextPhrase: string; // речення з пропуском
  correct: string;
  options: string[];
}

// Вокатив не тестуємо: у займенників це "—", у прикметників він дублює називний.
const QUIZ_CASES = CASE_ORDER.filter((c) => c !== "vokativ") as QuizCase[];
const NUMBERS: GrammaticalNumber[] = ["sg", "pl"];
const NUMBER_LABEL: Record<GrammaticalNumber, string> = { sg: "однина", pl: "множина" };
const BLANK = "___";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomOf<T>(arr: T[]): T | null {
  return arr.length === 0 ? null : arr[Math.floor(Math.random() * arr.length)];
}

// Усі форми клітинки («mé / moje» → [mé, moje]); [] для відсутньої.
function formsOf(cell: string | undefined): string[] {
  if (!cell || cell === "—") return [];
  return cell.split(" / ").map((s) => s.trim());
}
function firstForm(cell: string): string {
  return cell.split(" / ")[0].trim();
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
  return !!d && d !== "—" && d !== correct && collapseVowelLength(d) !== collapseVowelLength(correct);
}

// Клітинка-дистрактор придатна, якщо ЖОДНА її форма не є прийнятною формою цілі (і не відрізняється лише довжиною
// голосного): «mou / mojí» не дистрактор до «mé / mojí» — mojí правильне в обох.
function cellUsable(target: string[], cell: string | undefined): boolean {
  const forms = formsOf(cell);
  if (forms.length === 0) return false;
  const tc = new Set(target.map(collapseVowelLength));
  return forms.every((f) => !target.includes(f) && !tc.has(collapseVowelLength(f)));
}

// Усі придатні клітинки-дистрактори в порядку пріоритету: інший відмінок (той самий рід/число) → інше число →
// інший рід → будь-яка клітинка; всередині рівня — навмання. Порожньо — дистрактора немає.
function distractorCells(decl: FullDeclension, g: Gender, c: QuizCase, n: GrammaticalNumber): string[] {
  const target = formsOf(decl[g][c][n]);
  const other: GrammaticalNumber = n === "sg" ? "pl" : "sg";
  const tiers: string[][] = [
    shuffle(QUIZ_CASES.filter((cc) => cc !== c)).map((cc) => decl[g][cc][n]),
    [decl[g][c][other]],
    shuffle(GENDER_ORDER.filter((gg) => gg !== g)).map((gg) => decl[gg][c][n]),
    shuffle(GENDER_ORDER.flatMap((gg) => QUIZ_CASES.flatMap((cc) => NUMBERS.map((nn) => decl[gg][cc][nn])))),
  ];
  const out: string[] = [];
  for (const tier of tiers) for (const cell of tier) if (cellUsable(target, cell) && !out.includes(cell)) out.push(cell);
  return out;
}

// Форма клітинки для показу за індексом дублету (один індекс на питання: обидві кнопки в одному стилі).
const pickForm = (forms: string[], idx: number) => forms[Math.min(idx, forms.length - 1)];

// ─────────────── Іменники-партнери ───────────────
// Дні, місяці, сотні (unsuitableAsPartner) — не носії чужих фраз.
const NOUN_POOL: NounEntry[] = NOUNS.filter((n) => nounUsableAsPartner(n.category));

function nounForm(noun: NounEntry, c: QuizCase, n: GrammaticalNumber): string | null {
  const cell = noun.declension[c][n];
  return !cell || cell === "—" ? null : firstForm(cell);
}

// Чи бере фрейм це слово в цьому числі (політика числа фрейму, множина лише де природна — candidateNumbers).
// У називному дієслово узгоджується з групою («To je» / «To jsou»), тож число фрейму там суворе: brýle — лише в «To jsou».
function frameTakes(f: DeclFrame, noun: NounEntry, n: GrammaticalNumber, c: QuizCase): boolean {
  if (c === "nominativ" && f.num !== "any" && (f.num ?? "sg") !== n) return false;
  return candidateNumbers(noun, f.num ?? "sg", () => 0).includes(n);
}

// Фраза без підмета-власника (називний — сама група і є підметом; ownerless — «Je tu hodně…»): svůj сюди не можна.
const ownerless = (f: DeclFrame, c: QuizCase) => c === "nominativ" || !!f.ownerless;

// fit — у скількох звичайних фразах (усі відмінки) є слово; вага 1 / fit вирівнює частку слів, що підходять до
// багатьох фраз (людина пасує майже всюди, «polštář» — у двох).
const FIT = new Map<string, number>();
for (const noun of NOUN_POOL) {
  let k = 0;
  for (const c of QUIZ_CASES) for (const f of DECL_FRAMES[c]) if (!f.role && matchesFilter(noun, f)) k++;
  FIT.set(noun.id, Math.max(1, k));
}
const fitOf = (noun: NounEntry) => FIT.get(noun.id) ?? 1;

// ─────────────── Тестовані слова з повною парадигмою ───────────────
type AdjLikeKind = "adjective" | "pronoun" | "interrogative-adj" | "indefinite";

interface Tested {
  id: string;
  kind: AdjLikeKind;
  cz: string;
  uk: string;
  decl: FullDeclension;
  fits: NounFilter;
  quiz: PronounQuiz;
  head: "adjective" | "determiner"; // прикметник стоїть після займенника-партнера, займенник — перед прикметником
  degree?: "comparative" | "superlative";
  baseCz?: string; // ступінь: показуємо базове слово, учень сам утворює ступінь
  baseUk?: string;
}

const declinable = (p: PronounEntry): p is Extract<PronounEntry, { declinable: true }> => p.declinable;

function buildTestedPool(): Tested[] {
  const adj: Tested[] = ADJECTIVES.filter((a) => adjQuizUsable(a.category)).flatMap((a) => {
    const base: Tested = { id: a.id, kind: "adjective", cz: a.cz, uk: a.uk, decl: a.declension, fits: a.fits, quiz: {}, head: "adjective" };
    if (!a.degrees || a.quizDegrees === false) return [base];
    const deg = (d: "comparative" | "superlative", suffix: string): Tested => ({
      ...base,
      id: `${a.id}${suffix}`,
      cz: a.degrees![d].cz,
      uk: a.degrees![d].uk,
      decl: a.degrees![d].declension,
      degree: d,
      baseCz: a.cz,
      baseUk: a.uk,
    });
    return [base, deg("comparative", "__comp"), deg("superlative", "__super")];
  });
  // jeho / jejich незмінні — не тестуються (одна форма), лише партнери.
  const pron = (list: PronounEntry[], kind: AdjLikeKind): Tested[] =>
    list.filter(declinable).filter((p) => !p.quiz?.skip).map((p) => ({
      id: p.id,
      kind,
      cz: p.cz,
      uk: p.uk,
      decl: p.declension,
      fits: p.quiz?.fits ?? {},
      quiz: p.quiz ?? {},
      head: "determiner",
    }));
  return [...adj, ...pron(PRONOUNS, "pronoun"), ...pron(INTERROGATIVE_ADJ, "interrogative-adj"), ...pron(INDEFINITE_ADJ, "indefinite")];
}

// Займенники, що можуть стояти партнером перед тестованим прикметником (без питальних, без quiz.partner = false).
const DETERMINER_PARTNERS: PronounEntry[] = [...PRONOUNS, ...INDEFINITE_ADJ].filter(
  (p) => !p.declinable || (p.quiz?.partner !== false && !p.quiz?.role && !p.quiz?.skip)
);
// Прикметники-партнери (лише звичайний ступінь) перед іменником у питанні про займенник.
const ADJECTIVE_PARTNERS: AdjectiveEntry[] = ADJECTIVES.filter((a) => adjQuizUsable(a.category));

// Обмеження слова-займенника на число й відмінок (дані: quiz.num, quiz.massSg, quiz.nominative).
function quizAllows(q: PronounQuiz, noun: NounEntry, c: QuizCase, n: GrammaticalNumber, f?: DeclFrame): boolean {
  if (q.num && q.num !== n) return false;
  if (q.needsOwner && (c === "nominativ" || (f && ownerless(f, c)))) return false;
  if (q.massSg && n === "sg" && !noun.uncountable) return false;
  if (c === "nominativ" && q.nominative === false) return false;
  return true;
}

function determinerForm(p: PronounEntry, noun: NounEntry, g: Gender, c: QuizCase, n: GrammaticalNumber, f?: DeclFrame): string | null {
  if (!matchesFilter(noun, p.quiz?.fits ?? {})) return null;
  if (!p.declinable) return p.invariantForm;
  if (!quizAllows(p.quiz ?? {}, noun, c, n, f)) return null;
  const cell = p.declension[g][c][n];
  return !cell || cell === "—" ? null : firstForm(cell);
}

function adjectiveForm(a: AdjectiveEntry, noun: NounEntry, g: Gender, c: QuizCase, n: GrammaticalNumber): string | null {
  if (!matchesFilter(noun, a.fits)) return null;
  const cell = a.declension[g][c][n];
  return !cell || cell === "—" ? null : firstForm(cell);
}

// Які фрейми годяться для слова (роль, ступінь, називний).
function frameFitsWord(f: DeclFrame, t: Tested, c: QuizCase): boolean {
  const role = t.quiz.role;
  if (role === "order") {
    if (f.role !== "question" && f.role !== "order") return false;
  } else if (role === "some") {
    if (f.role || !f.some) return false;
  } else if ((f.role ?? null) !== (role ?? null)) return false;
  if (t.degree && !f.degrees) return false;
  if (c === "nominativ" && t.quiz.nominative === false) return false;
  if (t.quiz.needsOwner && ownerless(f, c)) return false;
  return true;
}

// ─────────────── Складання фрази ───────────────
const PREP_TOKEN = /\{([vksz])\}/;

function capitalize(s: string): string {
  return s.length > 0 && s[0] !== "_" ? s[0].toUpperCase() + s.slice(1) : s;
}

// Підставляє групу у фрейм. lead — перше слово групи після «{v}/{k}/{s}/{z}» (за ним вокалізація); null — групу
// не можна поставити (вокалізацію для цієї групи приголосних не класифіковано, CLUSTER_RULES).
function renderFrame(f: DeclFrame, blankSide: string[], restSide: string[]): { text: string; lead: string } | null {
  const hasN = f.text.includes("{N}");
  let text = hasN
    ? f.text.replace(BLANK, blankSide.join(" ")).replace("{N}", restSide.join(" "))
    : f.text.replace(BLANK, [...blankSide, ...restSide].join(" "));
  const m = text.match(PREP_TOKEN);
  let lead = "";
  if (m) {
    const after = text.slice((m.index ?? 0) + m[0].length).trim().split(/\s+/)[0];
    lead = after;
    if (after === BLANK) return { text, lead: BLANK }; // вирішується за формою відповіді (див. vocalizeFor)
    const d = vocalDecision(m[1] as VocalPrep, after);
    if (d === null) return null;
    text = text.replace(m[0], d === "vocal" ? `${m[1]}e` : m[1]);
  }
  return { text: capitalize(text), lead };
}

// Прийменник перед самим пропуском: вокалізація за показаною формою відповіді; дистрактор мусить дати те саме
// рішення (інакше прийменник підказав би відповідь). null — не можна.
function vocalizeFor(text: string, shown: string[]): string | null {
  const m = text.match(PREP_TOKEN);
  if (!m) return text;
  const ds = shown.map((w) => vocalDecision(m[1] as VocalPrep, w));
  if (ds.some((d) => d === null) || ds.some((d) => d !== ds[0])) return null;
  return capitalize(text.replace(m[0], ds[0] === "vocal" ? `${m[1]}e` : m[1]));
}

// Прийменник, що в реченні стоїть просто перед пропуском («Bydlím {v} ___ domě», «{k} ___ {N} jdeš?») — тоді його
// вокалізація залежить від самої відповіді. null — такого прийменника немає.
const BLANK_LEAD = /\{([vksz])\}\s*___/;
function blankLeadPrep(f: DeclFrame): VocalPrep | null {
  const m = f.text.match(BLANK_LEAD);
  return m ? (m[1] as VocalPrep) : null;
}
// Обидві кнопки дають ОДНАКОВЕ класифіковане рішення (ve/v): інакше прийменник підказав би відповідь або був би вгаданий.
function samePrepDecision(prep: VocalPrep, a: string, b: string): boolean {
  const da = vocalDecision(prep, a);
  return da !== null && da === vocalDecision(prep, b);
}

// Чи можна поставити слово в цю фразу без партнера хоча б з одним стилем дублету й одним дистрактором. Фраза, де
// прийменник перед пропуском не вокалізується однозначно для цього слова (tvůj: «v/ve tvém» коливається), береться
// лише з займенником-партнером попереду («k té tvrdé…») або не береться зовсім — тож комбо або гарантовано будує
// питання, або його немає (до цієї перевірки 8 комбо мовчки не будувалися ніколи).
function frameRenderable(f: DeclFrame, target: string[], dCells: string[]): boolean {
  const prep = blankLeadPrep(f);
  if (!prep) return true;
  return [0, 1].some((idx) => dCells.some((cell) => samePrepDecision(prep, pickForm(target, idx), pickForm(formsOf(cell), idx))));
}

// ─────────────── Комбінації з повною парадигмою ───────────────
interface Candidate {
  noun: NounEntry;
  // needsPartner: фраза годиться лише з займенником-партнером перед пропуском («k [té] tvrdé židli»), бо прийменник
  // перед самою відповіддю не вокалізується однозначно («k/ke tvrdé» — група tv- коливається).
  frames: { f: DeclFrame; needsPartner: boolean }[];
}

// Займенники-партнери, з якими прийменник перед групою вокалізується однозначно (для фраз needsPartner).
function leadPartners(f: DeclFrame, noun: NounEntry, g: Gender, c: QuizCase, n: GrammaticalNumber): string[] {
  const prep = blankLeadPrep(f);
  return DETERMINER_PARTNERS.map((p) => determinerForm(p, noun, g, c, n, f)).filter(
    (x): x is string => !!x && (!prep || vocalDecision(prep, x) !== null)
  );
}

// Іменники й фрейми, у яких слово може стояти в цій клітинці (без партнерів). Порожньо — комбо немає.
function candidatesFor(t: Tested, g: Gender, c: QuizCase, n: GrammaticalNumber): Candidate[] {
  const target = formsOf(t.decl[g][c][n]);
  const dCells = distractorCells(t.decl, g, c, n);
  const frames = DECL_FRAMES[c].filter((f) => frameFitsWord(f, t, c));
  if (frames.length === 0) return [];
  const out: Candidate[] = [];
  for (const noun of NOUN_POOL) {
    if (agreementGender(noun, n) !== g || nounForm(noun, c, n) === null) continue;
    if (!matchesFilter(noun, t.fits) || !quizAllows(t.quiz, noun, c, n)) continue;
    const fs: Candidate["frames"] = [];
    for (const f of frames) {
      if (!matchesFilter(noun, f) || !frameTakes(f, noun, n, c)) continue;
      if (frameRenderable(f, target, dCells)) fs.push({ f, needsPartner: false });
      else if (t.head === "adjective" && t.quiz.role !== "order" && leadPartners(f, noun, g, c, n).length > 0) fs.push({ f, needsPartner: true });
    }
    if (fs.length > 0) out.push({ noun, frames: fs });
  }
  return out;
}

function taskTextFor(t: Tested, g: Gender, c: CzechCase, n: GrammaticalNumber): string {
  const l = CASE_LABELS[c];
  const kindLabel =
    t.kind === "interrogative-adj"
      ? "питальний займенник"
      : t.kind !== "adjective"
        ? "займенник"
        : t.degree === "comparative"
          ? "прикметник (вищий ст.)"
          : t.degree === "superlative"
            ? "прикметник (найвищий ст.)"
            : "прикметник";
  return `Оберіть ${kindLabel}: ${GENDER_SHORT[g]}, ${l.uk} (${l.cz}) — ${l.question}, ${NUMBER_LABEL[n]}`;
}

interface Built {
  q: DeclQuestion;
  nounIds: string[];
}

// Питання для комбо: іменник (свіжі першими, вага 1/fit) → фрейм → партнер (навпіл) → вокалізація.
// Перебір повний (стиль дублету → іменник → фрейм → з партнером / без), тож для комбо, що пройшло candidatesFor,
// питання будується завжди: варіант «без партнера» в придатній фразі гарантовано існує.
function makeAdjLike(t: Tested, g: Gender, c: QuizCase, n: GrammaticalNumber, cands: Candidate[], id: string, used: ReadonlySet<string>): Built | null {
  const targetForms = formsOf(t.decl[g][c][n]);
  const dCells = distractorCells(t.decl, g, c, n);
  if (targetForms.length === 0 || dCells.length === 0) return null;
  // Один індекс дублету на питання (як у квізі дієслів): обидві кнопки в одному стилі (mé / tvé або moje / tvoje).
  const first = Math.random() < 0.5 ? 0 : 1;
  for (const idx of [first, 1 - first]) {
    const built = makeWithStyle(t, g, c, n, cands, id, used, pickForm(targetForms, idx), dCells.map((cell) => pickForm(formsOf(cell), idx)));
    if (built) return built;
  }
  return null;
}

function makeWithStyle(
  t: Tested,
  g: Gender,
  c: QuizCase,
  n: GrammaticalNumber,
  cands: Candidate[],
  id: string,
  used: ReadonlySet<string>,
  correct: string,
  distractors: string[]
): Built | null {
  for (const { noun, frames } of freshWeightedOrder(cands, (x) => used.has(x.noun.id), (x) => fitOf(x.noun))) {
    const nf = nounForm(noun, c, n)!;
    for (const { f, needsPartner } of shuffle(frames)) {
      // Партнер: займенник перед тестованим прикметником / прикметник перед іменником після тестованого займенника.
      const partners: string[] = [];
      if (needsPartner) {
        const lead = randomOf(leadPartners(f, noun, g, c, n));
        if (!lead) continue;
        partners.push(lead);
      }
      // Питання про порядок — без прикметника: «Kolikátý den už čekáš?», не «Kolikátý dobrý den…».
      else if (Math.random() < 0.5 && t.quiz.role !== "order") {
        const pool =
          t.head === "adjective"
            ? DETERMINER_PARTNERS.map((p) => determinerForm(p, noun, g, c, n, f))
            : ADJECTIVE_PARTNERS.filter((a) => a.id !== t.id).map((a) => adjectiveForm(a, noun, g, c, n));
        const p = randomOf(shuffle(pool.filter((x): x is string => !!x)));
        if (p) partners.push(p);
      }
      for (const withPartner of needsPartner ? [true] : partners.length > 0 ? [true, false] : [false]) {
        const p = withPartner ? partners : [];
        const blankSide = t.head === "adjective" ? [...p, BLANK] : [BLANK];
        const restSide = t.head === "adjective" ? [nf] : [...p, nf];
        const r = renderFrame(f, blankSide, restSide);
        if (!r) continue;
        // Прийменник перед пропуском: дистрактор — перший за пріоритетом з тим самим рішенням ve/v.
        const prep = r.lead === BLANK ? blankLeadPrep(f) : null;
        const distractor = prep ? distractors.find((d) => samePrepDecision(prep, correct, d)) : distractors[0];
        if (!distractor) continue;
        const text = prep ? vocalizeFor(r.text, [correct, distractor]) : r.text;
        if (!text) continue;
        return {
          q: {
            kind: t.kind,
            gender: g,
            targetCase: c,
            targetNumber: n,
            comboId: id,
            promptWord: t.baseCz ?? t.cz,
            promptUk: t.baseUk ?? t.uk,
            promptLabel: t.kind === "adjective" ? "прикметник" : "займенник",
            taskText: taskTextFor(t, g, c, n),
            contextPhrase: text,
            correct,
            options: shuffle([correct, distractor]),
          },
          nounIds: [noun.id],
        };
      }
    }
  }
  return null;
}

interface UnitCombo {
  id: string; // comboId (ваги)
  wordId: string; // «не те саме слово поспіль»
  kind: DeclKind; // баланс слотів за типом
  make: (used: ReadonlySet<string>) => Built | null;
}

function adjLikeUnits(pool: Tested[]): UnitCombo[] {
  const units: UnitCombo[] = [];
  for (const t of pool) {
    for (const g of GENDER_ORDER) {
      for (const c of QUIZ_CASES) {
        for (const n of NUMBERS) {
          if (formsOf(t.decl[g][c][n]).length === 0 || distractorCells(t.decl, g, c, n).length === 0) continue;
          const cands = candidatesFor(t, g, c, n);
          if (cands.length === 0) continue; // немає природної фрази з іменником цього роду — клітинку не питаємо
          const id = comboId(t.id, `${g}_${c}`, n);
          units.push({ id, wordId: t.id, kind: t.kind, make: (used) => makeAdjLike(t, g, c, n, cands, id, used) });
        }
      }
    }
  }
  return units;
}

// ════════════════════ ОСОБОВІ ЗАЙМЕННИКИ ════════════════════
// Правила (звірено з ÚJČ): дистрактор — форма того ж займенника з ІНШОГО відмінка, яка не є водночас формою
// цільового відмінка (mě/mne — і родовий, і знахідний); фільтр довготи прибирає ji/jí. Підмет фрейму ≠ тестований
// займенник; приклонка не перша в реченні; 3-тя особа без прийменника — ненаголошена (ho, mu), див. PERSONAL_QUIZ_FORMS.
type Reg = 0 | 1;
const PP_QUIZ_CASES: QuizCase[] = ["genitiv", "dativ", "akuzativ", "lokal", "instrumental"];
const REG_LABEL_3: Record<Reg, string> = { 0: "без прийм.", 1: "після прийм." };
const REG_LABEL_12: Record<Reg, string> = { 0: "короткий", 1: "довгий" };
// 1-ша особа (já, my) — підмет «ти» у фреймі; решта — підмет «я».
const FIRST_PERSON = new Set(["pp-ja", "pp-my"]);

function vocalizePersonalPrep(prep: string, ans: string): string {
  if (prep === "k" && /^mn/.test(ans)) return "ke"; // ke mně
  if (prep === "s" && /^mnou/.test(ans)) return "se"; // se mnou (s sebou лишається s)
  if (prep === "od" && /^mn?[ěe]/.test(ans)) return "ode"; // ode mě
  return prep;
}
function fillPersonal(fr: PersonalFrame, ans: string, antecedent?: string): string {
  const prep = fr.prep ? vocalizePersonalPrep(fr.prep, ans) + " " : "";
  const core = `${fr.pre}${prep}${BLANK}${fr.post}`;
  return antecedent ? `${antecedent} ${core}` : core;
}

// Антецедент для 3-ї особи: «Znáš [займенник] [прикметник] іменник?» — іменник за тегами ANTECEDENT_FRAME (особа чи
// тварина), прикметник — з його fits, партнери навпіл. Рід узгодження — з урахуванням plGender (děti → жін.).
function antecedentPool(g: Gender, n: GrammaticalNumber): NounEntry[] {
  return NOUN_POOL.filter(
    (x) => agreementGender(x, n) === g && matchesFilter(x, ANTECEDENT_FRAME) && frameTakes(ANTECEDENT_FRAME, x, n, "akuzativ") && nounForm(x, "akuzativ", n)
  );
}
// oni: рід антецедента довільний (непрямі форми множини спільні), але лише з тих, де є особа чи тварина.
const ONI_GENDERS = GENDER_ORDER.filter((g) => antecedentPool(g, "pl").length > 0);

function buildAntecedent(g: Gender, n: GrammaticalNumber, used: Set<string>): string {
  const pool = antecedentPool(g, n);
  const noun = freshWeightedOrder(pool, (x) => used.has(x.id), fitOf)[0];
  if (!noun) return "";
  used.add(noun.id);
  const parts: string[] = [];
  if (Math.random() < 0.5) {
    const d = randomOf(DETERMINER_PARTNERS.map((p) => determinerForm(p, noun, g, "akuzativ", n)).filter((x): x is string => !!x));
    if (d) parts.push(d);
  }
  if (Math.random() < 0.5) {
    const a = randomOf(ADJECTIVE_PARTNERS.map((x) => adjectiveForm(x, noun, g, "akuzativ", n)).filter((x): x is string => !!x));
    if (a) parts.push(a);
  }
  parts.push(nounForm(noun, "akuzativ", n)!);
  return `Znáš ${parts.join(" ")}?`;
}

function ppTaskText(g: Gender | null, c: CzechCase, reg: Reg, is3rdPerson: boolean): string {
  const l = CASE_LABELS[c];
  const regLbl = is3rdPerson ? REG_LABEL_3[reg] : REG_LABEL_12[reg];
  const genPart = g ? `${GENDER_SHORT[g]}, ` : "";
  return `Оберіть займенник: ${genPart}${l.uk} (${l.cz}) — ${l.question}, ${regLbl}`;
}

interface PPSpec {
  id: string;
  wordId: string;
  correct: string;
  forms: string[]; // кандидати в дистрактори (інші відмінки)
  avoid: string[]; // форми цільового відмінка (обидва регістри) — не дистрактори (синкретизм)
  taskText: string;
  context: (used: Set<string>) => string;
  promptWord: string;
  promptUk: string;
  gender: Gender;
  targetCase: QuizCase;
  reg: Reg;
}

function personalUnits(): UnitCombo[] {
  const units: UnitCombo[] = [];
  const push = (c: PPSpec) => {
    const avoid = new Set(c.avoid.filter((f) => f && f !== "—").map(collapseVowelLength));
    const ok = (d: string) => isUsableDistractor(c.correct, d) && !avoid.has(collapseVowelLength(d));
    if (!c.forms.some(ok)) return;
    units.push({
      id: c.id,
      wordId: c.wordId,
      kind: "personal",
      make: (used) => {
        const distractor = shuffle(c.forms).find(ok);
        if (!distractor) return null;
        const scratch = new Set(used);
        const contextPhrase = c.context(scratch);
        return {
          q: {
            kind: "personal",
            gender: c.gender,
            targetCase: c.targetCase,
            targetNumber: c.reg === 0 ? "sg" : "pl", // регістр у слоті числа; екран не показує
            comboId: c.id,
            promptWord: c.promptWord,
            promptUk: c.promptUk,
            promptLabel: "займенник",
            taskText: c.taskText,
            contextPhrase,
            correct: c.correct,
            options: shuffle([c.correct, distractor]),
          },
          nounIds: [...scratch].filter((x) => !used.has(x)),
        };
      },
    });
  };
  const otherForms = (getForm: (c: QuizCase, r: Reg) => string, except: QuizCase) =>
    PP_QUIZ_CASES.filter((c) => c !== except).flatMap((c) => [getForm(c, 0), getForm(c, 1)]);

  for (const entry of PERSONAL_PRONOUNS) {
    if (entry.id === "pp-se") {
      const getForm = (c: QuizCase, r: Reg) => REFLEXIVE_FRAMES[c]?.find((x) => x.reg === r)?.form ?? "—";
      for (const c of PP_QUIZ_CASES) {
        for (const sf of REFLEXIVE_FRAMES[c] ?? []) {
          push({
            id: comboId(entry.id, `x_${c}`, `${sf.reg}`),
            wordId: entry.id,
            correct: sf.form,
            forms: otherForms(getForm, c),
            avoid: [getForm(c, 0), getForm(c, 1)],
            taskText: ppTaskText(null, c, sf.reg, false),
            context: () => fillPersonal(sf.frame, sf.form),
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
      const getForm = (c: QuizCase, r: Reg) => firstForm(r === 0 ? decl[c].a : decl[c].b);
      for (const c of PP_QUIZ_CASES) {
        for (const r of [0, 1] as Reg[]) {
          const cf = PERSONAL_FRAMES[c]?.[r];
          const form = getForm(c, r);
          if (!cf || !form || form === "—") continue;
          const frame = FIRST_PERSON.has(entry.id) ? cf.s2 : cf.s1;
          push({
            id: comboId(entry.id, `x_${c}`, `${r}`),
            wordId: entry.id,
            correct: form,
            forms: otherForms(getForm, c),
            avoid: [getForm(c, 0), getForm(c, 1)],
            taskText: ppTaskText(null, c, r, false),
            context: () => fillPersonal(frame, form),
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
    // 3-тя особа: форми з PERSONAL_QUIZ_FORMS (ненаголошені без прийменника).
    const isOni = entry.id === "pp-oni";
    const tables: { g: Gender; idPart: string; table: Partial<Record<QuizCase, [string, string]>> }[] = isOni
      ? [{ g: "masc_anim", idPart: "pl", table: PERSONAL_QUIZ_FORMS.oni }]
      : (["masc_anim", "fem", "neut"] as const).map((g) => ({ g, idPart: g, table: PERSONAL_QUIZ_FORMS.on[g] }));
    for (const { g, idPart, table } of tables) {
      const getForm = (c: QuizCase, r: Reg) => table[c]?.[r] ?? "—";
      for (const c of PP_QUIZ_CASES) {
        for (const r of [0, 1] as Reg[]) {
          const cf = PERSONAL_FRAMES[c]?.[r];
          const form = getForm(c, r);
          if (!cf || !form || form === "—") continue;
          push({
            id: comboId(entry.id, `${idPart}_${c}`, `${r}`),
            wordId: entry.id,
            correct: form,
            forms: otherForms(getForm, c),
            avoid: [getForm(c, 0), getForm(c, 1)],
            taskText: ppTaskText(isOni ? null : g, c, r, true),
            // oni: рід лише декорує антецедент (непрямі форми множини спільні для всіх родів)
            context: (used) =>
              fillPersonal(cf.s1, form, isOni ? buildAntecedent(randomOf(ONI_GENDERS)!, "pl", used) : buildAntecedent(g, "sg", used)),
            promptWord: entry.cz,
            promptUk: entry.uk,
            gender: isOni ? "masc_anim" : g,
            targetCase: c,
            reg: r,
          });
        }
      }
    }
  }
  return units;
}

// ═══════════ БЕЗ РОДУ Й ЧИСЛА: kdo/co, někdo/nikdo/něco/nic ═══════════
// Речення — у самому записі слова (quizFrames, 2+ на відмінок, вибір навмання). Називний не питаємо (словникова форма).
// Дистрактор — форма того ж слова з іншого відмінка (kdo: genitiv = akuzativ «koho» — синкретизм, відсіюється).
function coreUnits(list: PersonalPronounEntry[], kind: "interrogative-core" | "indefinite-core"): UnitCombo[] {
  const units: UnitCombo[] = [];
  for (const entry of list) {
    if (entry.gendered || !entry.quizFrames) continue;
    const decl: PersonalDeclension = entry.declension;
    for (const c of PP_QUIZ_CASES) {
      const frames = entry.quizFrames[c];
      const target = formsOf(decl[c].a);
      if (!frames || frames.length === 0 || target.length === 0) continue;
      const correct = target[0];
      const cands = PP_QUIZ_CASES.filter((cc) => cc !== c)
        .map((cc) => decl[cc].a)
        .filter((cell) => cellUsable(target, cell))
        .map(firstForm);
      if (cands.length === 0) continue;
      const id = comboId(entry.id, c, "0");
      const l = CASE_LABELS[c];
      // kdo/co — «питальний займенник», як jaký/který; рід і число не пишемо — у слова їх немає.
      const label = kind === "interrogative-core" ? "питальний займенник" : "займенник";
      units.push({
        id,
        wordId: entry.id,
        kind,
        make: () => {
          const distractor = randomOf(cands)!;
          return {
            q: {
              kind,
              gender: "masc_anim", // поле не рендериться, лише для типу
              targetCase: c,
              targetNumber: "sg",
              comboId: id,
              promptWord: entry.cz,
              promptUk: entry.uk,
              promptLabel: "займенник",
              taskText: `Оберіть ${label}: ${l.uk} (${l.cz}) — ${l.question}`,
              contextPhrase: randomOf(frames)!,
              correct,
              options: shuffle([correct, distractor]),
            },
            nounIds: [],
          };
        },
      });
    }
  }
  return units;
}

// ─────────────── Dev-перевірка даних (лише dev-збірка, нічого не блокує) ───────────────
function devCheckData(): void {
  const issues: string[] = [];
  for (const c of QUIZ_CASES) {
    for (const f of DECL_FRAMES[c]) {
      const k = NOUN_POOL.filter((n) => matchesFilter(n, f)).length;
      if (k < 3) issues.push(`фрейм «${f.text}» (${c}): лише ${k} іменників (потрібно ≥ 3)`);
    }
  }
  for (const a of ADJECTIVE_PARTNERS) {
    if (!NOUN_POOL.some((n) => matchesFilter(n, a.fits))) issues.push(`${a.id}: fits не відповідає жоден іменник`);
  }
  if (issues.length > 0) console.warn(`declensionQuiz: ${issues.length} зауваж.:\n  ` + issues.slice(0, 25).join("\n  "));
}
if (typeof __DEV__ !== "undefined" && __DEV__) devCheckData();

// ─────────────── Сесія ───────────────
let cachedUnits: UnitCombo[] | null = null;
function allDeclensionCombos(): UnitCombo[] {
  if (!cachedUnits) {
    cachedUnits = [
      ...adjLikeUnits(buildTestedPool()),
      ...personalUnits(),
      ...coreUnits(INTERROGATIVE_CORE, "interrogative-core"),
      ...coreUnits(INDEFINITE_CORE, "indefinite-core"),
    ];
  }
  return cachedUnits;
}

// Баланс за типом: численний відкритий клас прикметників не має витісняти закриті групи займенників. Кожен тип
// набирає свій мінімум зі свого пулу; недобір іде в спільний зважений пул. pronoun 3 → 2 звільнило місце для
// нових груп indefinite / indefinite-core (по 1).
const MIN_SLOTS: Partial<Record<DeclKind, number>> = {
  personal: 2,
  pronoun: 2,
  "interrogative-adj": 2,
  "interrogative-core": 1,
  indefinite: 1,
  "indefinite-core": 1,
};

export function generateDeclensionSession(
  count: number,
  combos: UnitCombo[] = allDeclensionCombos(),
  mistakes: MistakeStore = {}
): DeclQuestion[] {
  const chosen = selectRoundCombos(combos, mistakes, count, (c) => c.wordId, undefined, {
    kindOf: (c) => (c as UnitCombo).kind,
    minSlots: MIN_SLOTS,
  });
  const questions: DeclQuestion[] = [];
  const used = new Set<string>(); // іменники раунду: той самий іменник не повторюється, поки є інші
  const take = (c: UnitCombo) => {
    const b = c.make(used);
    if (!b) return;
    for (const id of b.nounIds) used.add(id);
    questions.push(b.q);
  };
  for (const c of chosen) take(c);
  // Добір, якщо якийсь make() повернув null — інакше зарезервоване під помилку комбо мовчки випало б.
  if (questions.length < count) {
    for (const c of shuffle(combos)) {
      if (questions.length >= count) break;
      if (!questions.some((x) => x.comboId === c.id)) take(c);
    }
  }
  return questions;
}
