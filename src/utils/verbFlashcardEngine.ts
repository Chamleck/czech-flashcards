import { VerbEntry, VerbPerson, PERSON_ORDER, PERSON_LABELS } from "../types";
import { VERBS } from "../data/verbs";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";
import { isUsableDistractor, once, shuffle } from "./quizCommon";
import {
  presentForm,
  futureForm,
  pastForm,
  pastFormAfterAdverb,
  futureFormAfterAdverb,
  imperativeForm,
  PastSubject,
  PAST_SUBJECT_ORDER,
  PAST_SUBJECT_LABELS,
  PAST_BASE_SHARE,
  ImperativePerson,
  IMPERATIVE_ORDER,
  IMPERATIVE_LABELS,
  firstForm,
  nthForm,
  participleFor,
  infinitiveAfterPastPhase,
  infinitiveAfterFuturePhase,
} from "./verbForms";

// Питання квізу дієслів. Той самий контракт полів, що й у Question іменників,
// щоб екран квізу (FlashcardsQuizScreen) працював без змін.
export interface VerbQuestion {
  entry: VerbEntry;
  tense: "present" | "past" | "future" | "imperative";
  personKey: string; // особа/підмет (VerbPerson | PastSubject | ImperativePerson)
  comboId: string;
  promptWord: string; // інфінітив (cz), напр. "dělat" / "učit se"
  promptUk: string; // українською
  promptLabel: string; // заголовок-підпис: частина мови ("дієслово")
  taskText: string; // "Минулий час — ona (вона)"
  contextPhrase?: string; // речення з пропуском (лише для aspect-питань)
  correct: string;
  options: string[]; // [правильна, дистрактор] — перемішані
}

const TENSE_LABEL: Record<VerbQuestion["tense"], string> = {
  present: "Теперішній час",
  past: "Минулий час",
  future: "Майбутній час",
  imperative: "Наказовий спосіб",
};

// Інфінітив для показу (зі зворотною часткою, якщо є).
function infinitiveOf(v: VerbEntry): string {
  return v.reflexive ? `${v.cz} ${v.reflexive}` : v.cz;
}

// Усі форми дієслова в певному часі — для підбору дистракторів (інша особа того ж часу).
function allFormsInTense(v: VerbEntry, tense: VerbQuestion["tense"]): string[] {
  if (tense === "present") {
    if (!v.present) return [];
    return PERSON_ORDER.map((p) => presentForm(v, p)!).filter(Boolean);
  }
  if (tense === "future") {
    return PERSON_ORDER.map((p) => futureForm(v, p));
  }
  if (tense === "imperative") {
    if (!v.imperative) return [];
    return IMPERATIVE_ORDER.map((p) => imperativeForm(v, p)!).filter(Boolean);
  }
  return PAST_SUBJECT_ORDER.map((s) => firstForm(pastForm(v, s)));
}

// Усі форми дієслова у всіх доступних часах — остаточний fallback для дистрактора.
function allFormsAllTenses(v: VerbEntry): string[] {
  const tenses: VerbQuestion["tense"][] = v.present ? ["present", "past", "future"] : ["past", "future"];
  if (v.imperative) tenses.push("imperative");
  return tenses.flatMap((t) => allFormsInTense(v, t));
}

// Дистрактор = РЕАЛЬНА форма того ж дієслова з ІНШОЇ клітинки: спершу інша особа того ж часу, потім — будь-яка
// форма з інших часів. Форми, що різняться лише довготою голосної (kupuji / kupují — я / вони), дозволені: це
// реальна граматична різниця двох клітинок (рішення 2026-10-06, як ji / jí у займенниках). Пул форм бере лише
// першу половину дублета (firstForm), тож друга половина клітинки-дублета (jsi se) дистрактором не стає.
function usableConjugationDistractor(correct: string, d: string | null | undefined): d is string {
  return !!d && d !== "—" && d !== correct;
}

function buildDistractor(v: VerbEntry, tense: VerbQuestion["tense"], correct: string): string | null {
  const sameTense = shuffle(allFormsInTense(v, tense));
  for (const f of sameTense) {
    if (usableConjugationDistractor(correct, f)) return f;
  }
  const allForms = shuffle(allFormsAllTenses(v));
  for (const f of allForms) {
    if (usableConjugationDistractor(correct, f)) return f;
  }
  return null;
}

// Чи знайде buildDistractor хоч щось — ті самі два кроки, без перемішування (для переліку комбінацій).
function hasDistractor(v: VerbEntry, tense: VerbQuestion["tense"], correct: string): boolean {
  const ok = (f: string) => usableConjugationDistractor(correct, f);
  return allFormsInTense(v, tense).some(ok) || allFormsAllTenses(v).some(ok);
}

// ═══════════════════ ВИБІР ВИДУ ЗА КОНТЕКСТОМ (aspect) ═══════════════════
// Окрема навичка від дієвідміни: не «постав у форму», а «обери доконаний чи
// недоконаний за контекстом». Обидва варіанти-відповіді стоять в ОДНАКОВІЙ
// формі (та сама особа/час/рід підмета) — єдина різниця вид, тому дистрактор
// однозначно ізолює саме цей вимір (той самий принцип, що скрізь у проєкті).
// Партнер знаходиться структурно через aspectPairId (не парсинг тексту).
//
// Підмет кожного питання вибирається ВИПАДКОВО з усього набору осіб/родів
// фрейму (у минулому — усі клітинки PAST_SUBJECT_ORDER, включно з жіночим родом
// 1–2 особи та ввічливим «Ви»), тож допоміжне jsem/jsi/jsme/jste і ses/sis
// тренуються і тут. Усе виводиться з полів даних дієслова (pastParticiple,
// reflexive, future, aspectPairId) — для нових слів змінювати код не треба.

// Де в реченні пропуск:
//  - "initial": дієслово відкриває речення ("___ celou noc."). Таблична форма
//    ("učil jsem se", "naučím se", "budu se učit") тут вже правильна: допоміжне
//    і se/si стоять на 2-му місці, після першого слова;
//  - "afterAdverb": перед пропуском прислівник ("Konečně ___."). Клітики мають
//    стати між прислівником і дієсловом: "Konečně jsem se naučil",
//    "Zítra se budu učit" (pastFormAfterAdverb / futureFormAfterAdverb).
type FramePosition = "initial" | "afterAdverb";

// Що фрейм вимагає від виду (джерела: Dočekal 2007, Linguistica Brunensia 55;
// Macurová 2023, CASALC Review 2023-2):
//  - "durative": обставина тривалості ("celou noc", "dvě hodiny") — з доконаним
//    неможлива, КРІМ делімітативних (poseděl, proplakala celou noc); для таких
//    пар питання лишається, бо вид визначає підказка (taskText). Лише для
//    недоконаних з durative: true (див. VerbEntry.durative);
//  - "terminative": "za + час" (час до досягнення результату) — природний
//    вибір доконаного; недоконаний змінює значення. Для делімітативних пар
//    (delimitativePartner) вимкнено: "Poseděl jsem za minutu" неприродно;
//  - "resultative": "Zítra ___ a bude hotovo" — навмисна дія з результатом; лише
//    для доконаних з resultative: true ("Zítra přijdu a bude hotovo" неприродно);
//  - "other": контекст завершеності — доконаний природніший, недоконаний
//    неприродний, але не заборонений (критерій Macurová: вибір носія).
// Фазові фрейми ("Přestal jsem ___") — окремий тип нижче (PhasalFrame).
type FrameKind = "durative" | "terminative" | "resultative" | "other";

// Підмет типізований за часом: неіснуюче значення не скомпілюється (раніше
// `subject: string` + касти пропустили "ja_m", і форма мовчки ставала undefined).
// {V} — місце дієслова (пропуск), {O} — додаток пари (VerbEntry.complement) або нічого.
type TextFrame =
  | {
      text: string;
      tense: "future";
      subjects: readonly VerbPerson[];
      position: FramePosition;
      kind: FrameKind;
    }
  | {
      text: string;
      tense: "past";
      subjects: readonly PastSubject[];
      position: FramePosition;
      kind: FrameKind;
    };

// Теперішній і наказовий тут не використовуються свідомо: доконаний не має
// теперішнього, а підміна його майбутнім дала б іншу часову форму.
const ALL_PAST: readonly PastSubject[] = PAST_SUBJECT_ORDER;
const ALL_FUTURE: readonly VerbPerson[] = PERSON_ORDER;

// Недоконаний вид — обставини тривалості: доконаний із ними неграматичний.
export const IMPERF_FRAMES: TextFrame[] = [
  { text: "{V}{O} celý večer.", tense: "past", subjects: ALL_PAST, position: "initial", kind: "durative" },
  { text: "{V}{O} celou noc.", tense: "past", subjects: ALL_PAST, position: "initial", kind: "durative" },
  { text: "{V}{O} dvě hodiny.", tense: "past", subjects: ALL_PAST, position: "initial", kind: "durative" },
  { text: "{V}{O} celé odpoledne.", tense: "future", subjects: ALL_FUTURE, position: "initial", kind: "durative" },
  { text: "{V}{O} celý týden.", tense: "future", subjects: ALL_FUTURE, position: "initial", kind: "durative" },
];

// Доконаний вид — «za + час» (результат за певний час; «Nakonec» додає ознаку
// завершення і прибирає двозначність «за хвилину» = «через хвилину») та контексти
// завершеності.
export const PERF_FRAMES: TextFrame[] = [
  { text: "{V}{O} za minutu.", tense: "past", subjects: ALL_PAST, position: "initial", kind: "terminative" },
  { text: "{V}{O} za pět minut.", tense: "past", subjects: ALL_PAST, position: "initial", kind: "terminative" },
  { text: "Nakonec {V}{O} za minutu.", tense: "past", subjects: ALL_PAST, position: "afterAdverb", kind: "terminative" },
  { text: "Nakonec {V}{O} za pět minut.", tense: "past", subjects: ALL_PAST, position: "afterAdverb", kind: "terminative" },
  { text: "Konečně {V}{O}.", tense: "past", subjects: ALL_PAST, position: "afterAdverb", kind: "other" },
  { text: "Zítra {V}{O} a bude hotovo.", tense: "future", subjects: ALL_FUTURE, position: "afterAdverb", kind: "resultative" },
];

// Фазовий фрейм: «Přestal jsem ___», «Začnu ___». Після фазового дієслова (začít, přestat) інфінітив лише
// недоконаний (CzechEncy «Fázové sloveso»: «začne psát / *napsat», «začal blednout / *zblednout»), тож це
// граматичне, а не лише смислове обмеження. Для недоконаних з durative: false (миттєві, стани) замість фреймів
// тривалості. Фазові дієслова — з даних (VerbEntry.phasal), кожне в минулому і майбутньому; своєї пари фазове
// дієслово не питає («Přestal jsem přestávat»). У пропуск іде вся група клітик + інфінітив («jsem se učit»), бо
// se/si інфінітива стоїть на 2-му місці разом із допоміжним (і стягується: «Přestala ses učit»).
type PhasalFrame =
  | { phase: VerbEntry; tense: "past"; subjects: readonly PastSubject[] }
  | { phase: VerbEntry; tense: "future"; subjects: readonly VerbPerson[] };

type AspectFrame = { type: "text"; frame: TextFrame } | { type: "phasal"; frame: PhasalFrame };

const PHASE_VERBS: VerbEntry[] = VERBS.filter((v) => v.phasal);

function phasalFrames(testVerb: VerbEntry, partner: VerbEntry): PhasalFrame[] {
  return PHASE_VERBS.filter((ph) => ph.id !== testVerb.id && ph.id !== partner.id).flatMap((phase): PhasalFrame[] => [
    { phase, tense: "past", subjects: ALL_PAST },
    { phase, tense: "future", subjects: ALL_FUTURE },
  ]);
}

const capitalize = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const withSpace = (x: string | undefined) => (x ? ` ${x}` : "");

// Недоконаний член пари — носій complement / phasalComplement / durative.
function imperfectiveOf(testVerb: VerbEntry, partner: VerbEntry): VerbEntry {
  return testVerb.aspect === "imperfective" ? testVerb : partner;
}

// Речення з пропуском + форма дієслова для i-го підмета фрейму. Індекс (а не сам підмет) — щоб TypeScript звужував
// тип підмета за tense без кастів. Минулий: дублет лише для ty+зворотне ("ses / jsi se"); half обирає ОДНУ
// половину, спільну для обох варіантів питання (інакше кнопки різнились би стилем, а не лише видом).
function renderAspect(f: AspectFrame, v: VerbEntry, imp: VerbEntry, i: number, half: number): { phrase: string; form: string } {
  if (f.type === "phasal") {
    const fr = f.frame;
    const tail = withSpace(imp.phasalComplement ?? imp.complement);
    if (fr.tense === "past") {
      const s = fr.subjects[i];
      return { phrase: `${capitalize(participleFor(fr.phase, s))} ___${tail}.`, form: nthForm(infinitiveAfterPastPhase(v, s), half) };
    }
    const p = fr.subjects[i];
    return { phrase: `${capitalize(futureForm(fr.phase, p))} ___${tail}.`, form: infinitiveAfterFuturePhase(v) };
  }
  const fr = f.frame;
  const phrase = fr.text.replace("{V}", "___").replace("{O}", withSpace(imp.complement));
  if (fr.tense === "past") {
    const s = fr.subjects[i];
    return { phrase, form: nthForm(fr.position === "initial" ? pastForm(v, s) : pastFormAfterAdverb(v, s), half) };
  }
  const p = fr.subjects[i];
  return { phrase, form: fr.position === "initial" ? futureForm(v, p) : futureFormAfterAdverb(v, p) };
}

// aspectId → сам entry (для швидкого пошуку партнера).
const VERB_BY_ID: Record<string, VerbEntry> = Object.fromEntries(VERBS.map((v) => [v.id, v]));

// Фрейми, придатні для пари (рішення — у даних, VerbEntry):
//  - недоконане: durative → фрейми тривалості, інакше фазові;
//  - доконане: делімітативна пара (delimitativePartner на недоконаному) — без "terminative";
//    resultative: false — без "resultative".
function availableAspectFrames(testVerb: VerbEntry, partner: VerbEntry): AspectFrame[] {
  const imp = imperfectiveOf(testVerb, partner);
  if (testVerb.aspect === "imperfective") {
    return imp.durative
      ? IMPERF_FRAMES.map((frame) => ({ type: "text", frame }))
      : phasalFrames(testVerb, partner).map((frame) => ({ type: "phasal", frame }));
  }
  const delimitative = !!imp.delimitativePartner;
  return PERF_FRAMES.filter(
    (f) => !(delimitative && f.kind === "terminative") && !(!testVerb.resultative && f.kind === "resultative")
  ).map((frame) => ({ type: "text", frame }));
}

// Усі придатні (фрейм × підмет × половина дублета) для дієслова — для скрипту
// перевірки словника (scripts/check-verb-quiz.ts). Друга половина — лише там, де
// дублет справді є (ty+зворотне).
interface AspectCandidate {
  phrase: string;
  kind: FrameKind | "phasal";
  tense: "past" | "future";
  subject: string;
  half: number;
  correct: string;
  distractor: string;
}
export function aspectCandidates(testVerb: VerbEntry): AspectCandidate[] {
  const partner = testVerb.aspectPairId ? VERB_BY_ID[testVerb.aspectPairId] : undefined;
  if (!partner) return [];
  const imp = imperfectiveOf(testVerb, partner);
  const out: AspectCandidate[] = [];
  for (const f of availableAspectFrames(testVerb, partner)) {
    const kind = f.type === "phasal" ? "phasal" : f.frame.kind;
    const tense = f.frame.tense;
    for (let i = 0; i < f.frame.subjects.length; i++) {
      const subject = f.frame.subjects[i];
      const c0 = renderAspect(f, testVerb, imp, i, 0);
      const d0 = renderAspect(f, partner, imp, i, 0);
      const c1 = renderAspect(f, testVerb, imp, i, 1);
      const d1 = renderAspect(f, partner, imp, i, 1);
      out.push({ phrase: c0.phrase, kind, tense, subject, half: 0, correct: c0.form, distractor: d0.form });
      if (c1.form !== c0.form || d1.form !== d0.form) out.push({ phrase: c1.phrase, kind, tense, subject, half: 1, correct: c1.form, distractor: d1.form });
    }
  }
  return out;
}

// Побудова одного aspect-питання. testVerb — те, чий вид правильний за
// контекстом; frame диктує час/позицію; дистрактор — партнер у ТІЙ САМІЙ формі.
function buildAspectQuestion(testVerb: VerbEntry): VerbQuestion | null {
  const partner = testVerb.aspectPairId ? VERB_BY_ID[testVerb.aspectPairId] : undefined;
  if (!partner) return null;
  const imp = imperfectiveOf(testVerb, partner);

  // Половина дублета (ses / jsi se) — одна на питання: обидві кнопки в одному
  // стилі, а тренуються обидві форми (кодифікована і повна) з часом.
  const half = Math.random() < 0.5 ? 0 : 1;

  // Рівномірно за ФРЕЙМАМИ (а не за парами фрейм×підмет — інакше фрейми з
  // меншим набором підметів майже не випадали б), потім випадковий підмет.
  // Беремо ПЕРШУ валідну пару: так floor у kindQuota реально добирається.
  for (const f of shuffle(availableAspectFrames(testVerb, partner))) {
    for (const i of shuffle(f.frame.subjects.map((_, idx) => idx))) {
      const correct = renderAspect(f, testVerb, imp, i, half);
      const distractorForm = renderAspect(f, partner, imp, i, half).form;
      if (!correct.form || !distractorForm) continue;
      if (!isUsableDistractor(correct.form, distractorForm)) continue;

      return {
        entry: testVerb,
        tense: f.frame.tense,
        personKey: `aspect:${f.frame.subjects[i]}`,
        // comboId МУСИТЬ збігатися з id у пулі enumerateCombos (третій сегмент
        // "x", НЕ frame.tense) — інакше mistake-стор пише один id, а
        // selectRoundCombos шукає інший, і резервація помилок не працює (реальна
        // пастка проєкту, ловлена на numeral). Вага aspect трекається per-
        // дієслово+aspect, незалежно від випадкового фрейму.
        comboId: comboId(testVerb.id, "aspect", "x"),
        // promptWord — КОРОТКИЙ (укр. переклад-орієнтир), не саме речення:
        // giant-заголовок (34px) призначений для одного слова, а речення з
        // пропуском має свій окремий стильований блок — contextPhrase (той
        // самий патерн, що в числівниках/датах/прийменниках).
        promptWord: testVerb.uk,
        promptUk: "",
        promptLabel: "дієслово",
        taskText:
          testVerb.aspect === "imperfective"
            ? "Оберіть ВИД: дія повторювана / у процесі → недоконаний"
            : "Оберіть ВИД: дія завершена / одноразова → доконаний",
        contextPhrase: correct.phrase,
        correct: correct.form,
        options: shuffle([correct.form, distractorForm]),
      };
    }
  }
  return null;
}

// Атомарна комбінація питання. kind розрізняє дієвідміну (conjug) і вибір виду
// (aspect) — для kindQuota. Для aspect entry несе testVerb; tense/personKey
// службові, саме питання будується через buildAspectQuestion.
interface Combo {
  kind: "conjug" | "aspect";
  entry: VerbEntry;
  tense: VerbQuestion["tense"];
  personKey: string; // VerbPerson (present/future) або PastSubject (past)
  correct: string;
  id: string;
}

// Побудова однієї комбінації → форма + перевірка існування дистрактора.
function makeCombo(
  v: VerbEntry,
  tense: VerbQuestion["tense"],
  personKey: string,
  correct: string
): Combo | null {
  if (!correct) return null;
  if (!hasDistractor(v, tense, correct)) return null; // немає придатного дистрактора — пропускаємо
  return { kind: "conjug", entry: v, tense, personKey, correct, id: comboId(v.id, tense, personKey) };
}

// Усі валідні комбінації пулу.
function enumerateCombos(pool: VerbEntry[]): Combo[] {
  const combos: Combo[] = [];
  for (const v of pool) {
    // present — лише недоконані
    if (v.present) {
      for (const p of PERSON_ORDER) {
        const c = makeCombo(v, "present", p, presentForm(v, p) ?? "");
        if (c) combos.push(c);
      }
    }
    // future — усі
    for (const p of PERSON_ORDER) {
      const c = makeCombo(v, "future", p, futureForm(v, p));
      if (c) combos.push(c);
    }
    // past — усі клітинки PAST_SUBJECT_ORDER (рід, число, ввічливе «Ви»)
    for (const s of PAST_SUBJECT_ORDER) {
      // firstForm (НЕ випадкова половина) — навмисно детерміновано, той самий
      // вибір, що й у пулі дистракторів (allFormsInTense). Якби тут випадково
      // обиралась ІНША половина дублета за correct, а пул дистракторів (завжди
      // firstForm) підсунув би ПЕРШУ половину як "неправильний" варіант — хоча
      // обидві половини дублета насправді правильні. Реальний ризик колізії,
      // спійманий до того, як став багом. Обидві половини тренуються у видових
      // питаннях (buildAspectQuestion), де дистрактор — інше дієслово.
      const c = makeCombo(v, "past", s, firstForm(pastForm(v, s)));
      if (c) combos.push(c);
    }
    // imperative — 3 форми (ty/vy/my), лише якщо дієслово має наказовий спосіб
    if (v.imperative) {
      for (const p of IMPERATIVE_ORDER) {
        const c = makeCombo(v, "imperative", p, imperativeForm(v, p) ?? "");
        if (c) combos.push(c);
      }
    }
  }
  // aspect-комбо: по одному на КОЖНЕ дієслово з видовою парою (і члени пари —
  // окремі комбо, бо тестують протилежні види). Вага помилок трекається per-
  // дієслово через id. tense/personKey службові — питання будує makeQuestion
  // через buildAspectQuestion (обирає фрейм випадково щоразу).
  for (const v of pool) {
    // Лише для пар, у яких є хоч один придатний фрейм (інакше питання не вийшло б, а резерв слоту «згорав» би).
    const partner = v.aspectPairId ? VERB_BY_ID[v.aspectPairId] : undefined;
    if (partner && availableAspectFrames(v, partner).length > 0) {
      combos.push({
        kind: "aspect",
        entry: v,
        tense: "present",
        personKey: "aspect",
        correct: "",
        id: comboId(v.id, "aspect", "x"),
      });
    }
  }
  return combos;
}

// Пул комбінацій залежить лише від даних — будується раз за запуск застосунку.
const defaultCombos = once(() => enumerateCombos(VERBS));

// Текст завдання: "[Час/спосіб] — [займенник cz] ([займенник uk])".
// Підпис особи в завданні: «cz (uk)» — завжди ОДНА пара дужок. Вкладені дужки в
// uk (напр. «ми (закличне)») розплющуються в кому: «my (ми, закличне)». Тому
// будь-який майбутній підпис не поверне подвійних дужок.
function taskLabel(l: { cz: string; uk: string }): string {
  return `${l.cz} (${l.uk.replace(/\s*\(([^()]*)\)/g, ", $1")})`;
}

export function taskTextFor(tense: VerbQuestion["tense"], personKey: string): string {
  const label =
    tense === "past"
      ? PAST_SUBJECT_LABELS[personKey as PastSubject]
      : tense === "imperative"
      ? IMPERATIVE_LABELS[personKey as ImperativePerson]
      : PERSON_LABELS[personKey as VerbPerson];
  return `${TENSE_LABEL[tense]} — ${taskLabel(label)}`;
}

function makeQuestion(combo: Combo): VerbQuestion | null {
  if (combo.kind === "aspect") {
    return buildAspectQuestion(combo.entry);
  }
  const distractor = buildDistractor(combo.entry, combo.tense, combo.correct);
  if (!distractor) return null;
  return {
    entry: combo.entry,
    tense: combo.tense,
    personKey: combo.personKey,
    comboId: combo.id,
    promptWord: infinitiveOf(combo.entry),
    promptUk: combo.entry.uk,
    promptLabel: "дієслово",
    taskText: taskTextFor(combo.tense, combo.personKey),
    correct: combo.correct,
    options: shuffle([combo.correct, distractor]),
  };
}

// Баланс: aspect (вибір виду) — новіша навичка, але дієвідміна лишається
// основою квізу. floor=2 гарантує ~2 aspect-питання на раунд із 12 (~17%),
// не даючи їм витіснити дієвідміну. Число підібране емпірично harness'ом.
const VERB_KIND_QUOTA: KindQuota<string> = {
  // Тип = "aspect" або час питання. Нижня квота — лише для aspect. Вага пулу —
  // для минулого: його клітинок-варіантів (рід, ввічливе «Ви») побільшало, а
  // частка минулого в раунді має лишитись такою, як до їх появи (kindWeight).
  kindOf: (c) => ((c as Combo).kind === "aspect" ? "aspect" : (c as Combo).tense),
  minSlots: { aspect: 2 },
  kindWeight: { past: PAST_BASE_SHARE },
};

// Сесія квізу дієслів. Вибір комбінацій (ваги + зарезервовані слоти помилок +
// «не те саме слово поспіль» + kindQuota на aspect) — спільний selectRoundCombos.
export function generateVerbSession(
  count: number,
  pool: VerbEntry[] = VERBS,
  mistakes: MistakeStore = {}
): VerbQuestion[] {
  const combos = pool === VERBS ? defaultCombos() : enumerateCombos(pool);
  const chosen = selectRoundCombos(combos, mistakes, count, (c) => c.entry.id, undefined, VERB_KIND_QUOTA);
  const questions: VerbQuestion[] = [];
  for (const c of chosen) {
    const q = makeQuestion(c);
    if (q) questions.push(q);
  }
  // Добір, якщо якісь makeQuestion() повернули null (дистрактор збігся) —
  // інакше зарезервоване під помилку комбо може мовчки випасти без заміни.
  if (questions.length < count) {
    for (const c of shuffle(combos)) {
      if (questions.length >= count) break;
      const q = makeQuestion(c);
      if (q && !questions.some((x) => x.comboId === q.comboId)) questions.push(q);
    }
  }
  return questions;
}
