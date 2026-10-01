import { VerbEntry, VerbPerson, PERSON_ORDER, PERSON_LABELS } from "../types";
import { VERBS } from "../data/verbs";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Візуальне згортання довготи голосної — той самий принцип, що й у іменників:
// форми, що різняться лише і/í, u/ů тощо, на екрані виглядають однаково.
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
  return !!d && d !== correct && collapseVowelLength(d) !== collapseVowelLength(correct);
}

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

// Дистрактор = РЕАЛЬНА форма того ж дієслова, відмінна від правильної
// (і візуально, не лише як рядок). Спершу інша особа того ж часу,
// потім — будь-яка форма з інших часів.
function buildDistractor(v: VerbEntry, tense: VerbQuestion["tense"], correct: string): string | null {
  const sameTense = shuffle(allFormsInTense(v, tense));
  for (const f of sameTense) {
    if (isUsableDistractor(correct, f)) return f;
  }
  const allForms = shuffle(allFormsAllTenses(v));
  for (const f of allForms) {
    if (isUsableDistractor(correct, f)) return f;
  }
  return null;
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
//    пар питання лишається, бо вид визначає підказка (taskText);
//  - "terminative": "za + час" (час до досягнення результату) — природний
//    вибір доконаного; недоконаний змінює значення. Для делімітативних пар
//    (delimitativePartner) вимкнено: "Poseděl jsem za hodinu" неприродно;
//  - "other": контекст завершеності/послідовності — доконаний природніший,
//    недоконаний неприродний, але не заборонений (критерій Macurová: вибір
//    носія).
type FrameKind = "durative" | "terminative" | "other";

// Підмет типізований за часом: неіснуюче значення не скомпілюється (раніше
// `subject: string` + касти пропустили "ja_m", і форма мовчки ставала undefined).
type AspectFrame =
  | {
      text: string; // {V} — місце дієслова
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

// Недоконаний вид — лише обставини тривалості: доконаний із ними неграматичний.
export const IMPERF_FRAMES: AspectFrame[] = [
  { text: "{V} celý večer.", tense: "past", subjects: ALL_PAST, position: "initial", kind: "durative" },
  { text: "{V} celou noc.", tense: "past", subjects: ALL_PAST, position: "initial", kind: "durative" },
  { text: "{V} dvě hodiny.", tense: "past", subjects: ALL_PAST, position: "initial", kind: "durative" },
  { text: "{V} celé odpoledne.", tense: "future", subjects: ALL_FUTURE, position: "initial", kind: "durative" },
  { text: "{V} celý týden.", tense: "future", subjects: ALL_FUTURE, position: "initial", kind: "durative" },
];

// Доконаний вид — «za + час» (результат за певний час) та контексти
// завершеності.
export const PERF_FRAMES: AspectFrame[] = [
  { text: "{V} za hodinu.", tense: "past", subjects: ALL_PAST, position: "initial", kind: "terminative" },
  { text: "{V} za tři dny.", tense: "past", subjects: ALL_PAST, position: "initial", kind: "terminative" },
  { text: "Konečně {V}.", tense: "past", subjects: ALL_PAST, position: "afterAdverb", kind: "other" },
  { text: "Zítra {V} a bude hotovo.", tense: "future", subjects: ALL_FUTURE, position: "afterAdverb", kind: "other" },
];

// Форма дієслова для i-го підмета фрейму. Індекс (а не сам підмет) — щоб
// TypeScript звужував тип підмета за frame.tense без кастів.
// Минулий: pastForm/pastFormAfterAdverb дають дублет лише для ty+зворотне
// ("ses / jsi se"); half обирає ОДНУ половину, спільну для обох варіантів
// питання (інакше кнопки різнились би стилем, а не лише видом).
// Майбутній: дублети даних ("a / b") показуються цілком — як у питаннях на
// дієвідміну.
function renderAspectForm(v: VerbEntry, frame: AspectFrame, i: number, half: number): string {
  if (frame.tense === "past") {
    const s = frame.subjects[i];
    return nthForm(frame.position === "initial" ? pastForm(v, s) : pastFormAfterAdverb(v, s), half);
  }
  const p = frame.subjects[i];
  return frame.position === "initial" ? futureForm(v, p) : futureFormAfterAdverb(v, p);
}

// aspectId → сам entry (для швидкого пошуку партнера).
const VERB_BY_ID: Record<string, VerbEntry> = Object.fromEntries(VERBS.map((v) => [v.id, v]));

// Фрейми, придатні для пари. Для делімітативних пар (прапорець delimitativePartner
// на недоконаному) відпадають лише "terminative".
function availableAspectFrames(testVerb: VerbEntry, partner: VerbEntry): AspectFrame[] {
  const frames = testVerb.aspect === "imperfective" ? IMPERF_FRAMES : PERF_FRAMES;
  const delimitative = !!(testVerb.delimitativePartner || partner.delimitativePartner);
  return frames.filter((f) => !(delimitative && f.kind === "terminative"));
}

// Усі придатні (фрейм × підмет × половина дублета) для дієслова — для скрипту
// перевірки словника (scripts/check-verb-quiz.ts). Друга половина — лише там, де
// дублет справді є (ty+зворотне).
interface AspectCandidate {
  frame: AspectFrame;
  subject: string;
  half: number;
  correct: string;
  distractor: string;
}
export function aspectCandidates(testVerb: VerbEntry): AspectCandidate[] {
  const partner = testVerb.aspectPairId ? VERB_BY_ID[testVerb.aspectPairId] : undefined;
  if (!partner) return [];
  const out: AspectCandidate[] = [];
  for (const frame of availableAspectFrames(testVerb, partner)) {
    for (let i = 0; i < frame.subjects.length; i++) {
      const c0 = renderAspectForm(testVerb, frame, i, 0);
      const d0 = renderAspectForm(partner, frame, i, 0);
      const c1 = renderAspectForm(testVerb, frame, i, 1);
      const d1 = renderAspectForm(partner, frame, i, 1);
      out.push({ frame, subject: frame.subjects[i], half: 0, correct: c0, distractor: d0 });
      if (c1 !== c0 || d1 !== d0) out.push({ frame, subject: frame.subjects[i], half: 1, correct: c1, distractor: d1 });
    }
  }
  return out;
}

// Побудова одного aspect-питання. testVerb — те, чий вид правильний за
// контекстом; frame диктує час/позицію; дистрактор — партнер у ТІЙ САМІЙ формі.
function buildAspectQuestion(testVerb: VerbEntry): VerbQuestion | null {
  const partner = testVerb.aspectPairId ? VERB_BY_ID[testVerb.aspectPairId] : undefined;
  if (!partner) return null;

  // Половина дублета (ses / jsi se) — одна на питання: обидві кнопки в одному
  // стилі, а тренуються обидві форми (кодифікована і повна) з часом.
  const half = Math.random() < 0.5 ? 0 : 1;

  // Рівномірно за ФРЕЙМАМИ (а не за парами фрейм×підмет — інакше фрейми з
  // меншим набором підметів майже не випадали б), потім випадковий підмет.
  // Беремо ПЕРШУ валідну пару: так floor у kindQuota реально добирається.
  for (const frame of shuffle(availableAspectFrames(testVerb, partner))) {
    for (const i of shuffle(frame.subjects.map((_, idx) => idx))) {
      const correctForm = renderAspectForm(testVerb, frame, i, half);
      const distractorForm = renderAspectForm(partner, frame, i, half);
      if (!correctForm || !distractorForm) continue;
      if (!isUsableDistractor(correctForm, distractorForm)) continue;

      return {
        entry: testVerb,
        tense: frame.tense,
        personKey: `aspect:${frame.subjects[i]}`,
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
        contextPhrase: frame.text.replace("{V}", "___"),
        correct: correctForm,
        options: shuffle([correctForm, distractorForm]),
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
  if (!buildDistractor(v, tense, correct)) return null; // немає придатного дистрактора — пропускаємо
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
    // Лише для пар, у яких є хоч один придатний фрейм (делімітативні недоконані
    // їх не мають — питання не вийшло б, а резерв слоту «згорав» би).
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
  const combos = enumerateCombos(pool);
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
