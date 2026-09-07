import { VerbEntry, VerbPerson, PERSON_ORDER, PERSON_LABELS } from "../types";
import { VERBS } from "../data/verbs";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";
import {
  presentForm,
  futureForm,
  pastForm,
  imperativeForm,
  PastSubject,
  PAST_SUBJECT_ORDER,
  PAST_SUBJECT_LABELS,
  ImperativePerson,
  IMPERATIVE_ORDER,
  IMPERATIVE_LABELS,
  firstForm,
  randomForm,
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
  promptLabel?: string; // необов'язковий підпис (aspect: "українською 🇺🇦")
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
// Варіативність по РЕАЛЬНИХ осях дієслова: час (теперішній/минулий/майбутній)
// і рід підмета в минулому. Відмінків/родів іменника в дієслові немає.

interface AspectFrame {
  // {V} — місце дієслова у правильній формі. Кожен фрейм прив'язаний до
  // часу+підмета, щоб обидва види стали в ту саму форму.
  text: string;
  tense: "present" | "past" | "future";
  // підмет: для present/future — VerbPerson; для past — PastSubject (несе рід).
  subject: string;
}

// Фрейми недоконаного виду — маркери повторюваності / процесу / тривалості.
const IMPERF_FRAMES: AspectFrame[] = [
  { text: "Každý den {V}.", tense: "present", subject: "ja" },
  { text: "Obvykle {V} ráno.", tense: "present", subject: "ja" },
  { text: "Často {V}.", tense: "present", subject: "on" },
  { text: "Dřív jsem to {V} pravidelně.", tense: "past", subject: "ja_m" },
  { text: "Vždycky {V}, když měla čas.", tense: "past", subject: "ona" },
  { text: "Každý týden {V}.", tense: "future", subject: "ja" },
];

// Фрейми доконаного виду — маркери завершеності / одноразовості / результату.
const PERF_FRAMES: AspectFrame[] = [
  { text: "Včera {V}.", tense: "past", subject: "ja_m" },
  { text: "Právě {V} a jdu domů.", tense: "past", subject: "ja_m" },
  { text: "Konečně to {V}.", tense: "past", subject: "ona" },
  { text: "Za hodinu to {V}.", tense: "future", subject: "ja" },
  { text: "Zítra {V} a bude hotovo.", tense: "future", subject: "ja" },
  { text: "Hned {V} a přijdu.", tense: "future", subject: "ja" },
];

// Форма дієслова для aspect-фрейму. present/future приймають VerbPerson,
// past — PastSubject. Повертає null, якщо форми нема (напр. present у
// доконаного — тоді фрейм із present для доконаного просто не будується).
function aspectFormFor(v: VerbEntry, frame: AspectFrame): string | null {
  if (frame.tense === "present") {
    if (!v.present) return null;
    return presentForm(v, frame.subject as VerbPerson);
  }
  if (frame.tense === "future") {
    // futureForm вже коректно розрізняє: доконані/нерегулярні з власним future
    // (v.future) vs складене недоконаних (budu + інфінітив, se ОДРАЗУ ПІСЛЯ
    // budu — задокументовано в verbForms.ts). Не дублюємо цю логіку тут:
    // раніше було власне "budu + infinitiveOf(v)", де infinitiveOf ставить se
    // ПІСЛЯ інфінітива ("budu učit se") — граматично невірно для рефлексивів,
    // мало бути "budu se učit". Реальний баг, пійманий аудитом.
    return futureForm(v, frame.subject as VerbPerson);
  }
  // past
  // randomForm безпечний тут (не як у buildDistractor вище): дистрактор
  // aspect-питання завжди від ІНШОГО дієслова (видового партнера), тому
  // колізія "друга половина того самого дублета як дистрактор" неможлива —
  // форми correct і distractor походять від різних лем.
  return randomForm(pastForm(v, frame.subject as PastSubject));
}

// aspectId → сам entry (для швидкого пошуку партнера).
const VERB_BY_ID: Record<string, VerbEntry> = Object.fromEntries(VERBS.map((v) => [v.id, v]));

// Побудова одного aspect-питання. testVerb — те, чий вид правильний за
// контекстом; frame диктує час/підмет; дистрактор — партнер у ТІЙ САМІЙ формі.
function buildAspectQuestion(testVerb: VerbEntry): VerbQuestion | null {
  const partner = testVerb.aspectPairId ? VERB_BY_ID[testVerb.aspectPairId] : undefined;
  if (!partner) return null;

  // Фрейм відповідає виду testVerb: недоконане → IMPERF-контекст і навпаки.
  // Перебираємо фрейми у випадковому порядку і беремо ПЕРШИЙ, що дає валідне
  // питання (деякі фрейм×дієслово нежиттєздатні: напр. present-фрейм не існує
  // для форм, яких нема). Так floor у kindQuota реально добирається, а не
  // «згорає» на випадковому нежиттєздатному фреймі.
  const frames = shuffle(testVerb.aspect === "imperfective" ? IMPERF_FRAMES : PERF_FRAMES);
  for (const frame of frames) {
    const correctForm = aspectFormFor(testVerb, frame);
    const distractorForm = aspectFormFor(partner, frame);
    if (!correctForm || !distractorForm) continue;
    if (!isUsableDistractor(correctForm, distractorForm)) continue;

    return {
      entry: testVerb,
      tense: frame.tense,
      personKey: `aspect:${frame.subject}`,
      // comboId МУСИТЬ збігатися з id у пулі enumerateCombos (третій сегмент
      // "x", НЕ frame.tense) — інакше mistake-стор пише один id, а
      // selectRoundCombos шукає інший, і резервація помилок не працює (реальна
      // пастка проєкту, ловлена на numeral). Вага aspect трекається per-
      // дієслово+aspect, незалежно від випадкового фрейму.
      comboId: comboId(testVerb.id, "aspect", "x"),
      // promptWord — КОРОТКИЙ (укр. переклад-орієнтир), не саме речення:
      // giant-заголовок (34px) призначений для одного слова, а речення з
      // пропуском має свій окремий стильований блок — contextPhrase (той
      // самий патерн, що в числівниках/датах/прийменниках). Реальна помилка
      // інтеграції, знайдена аудитом: раніше ціле речення йшло в promptWord.
      promptWord: testVerb.uk,
      promptUk: "",
      promptLabel: "українською 🇺🇦",
      taskText:
        testVerb.aspect === "imperfective"
          ? "Оберіть ВИД: дія повторювана / у процесі → недоконаний"
          : "Оберіть ВИД: дія завершена / одноразова → доконаний",
      contextPhrase: frame.text.replace("{V}", "___"),
      correct: correctForm,
      options: shuffle([correctForm, distractorForm]),
    };
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
    // past — 9 підметів (з розбивкою за родом/числом)
    for (const s of PAST_SUBJECT_ORDER) {
      // firstForm (НЕ randomForm) — навмисно детерміновано, той самий вибір,
      // що й у пулі дистракторів (allFormsInTense). Якби тут randomForm міг
      // випадково обрати ІНШУ половину дублета за correct, а пул дистракторів
      // (завжди firstForm) підсунув би ПЕРШУ половину як "неправильний" варіант
      // — хоча обидві половини дублета насправді правильні. Реальний ризик
      // колізії, спійманий до того, як став багом.
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
    if (v.aspectPairId && VERB_BY_ID[v.aspectPairId]) {
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
function taskTextFor(tense: VerbQuestion["tense"], personKey: string): string {
  if (tense === "past") {
    const l = PAST_SUBJECT_LABELS[personKey as PastSubject];
    return `${TENSE_LABEL[tense]} — ${l.cz} (${l.uk})`;
  }
  if (tense === "imperative") {
    const l = IMPERATIVE_LABELS[personKey as ImperativePerson];
    return `${TENSE_LABEL[tense]} — ${l.cz} (${l.uk})`;
  }
  const l = PERSON_LABELS[personKey as VerbPerson];
  return `${TENSE_LABEL[tense]} — ${l.cz} (${l.uk})`;
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
    taskText: taskTextFor(combo.tense, combo.personKey),
    correct: combo.correct,
    options: shuffle([combo.correct, distractor]),
  };
}

// Баланс: aspect (вибір виду) — новіша навичка, але дієвідміна лишається
// основою квізу. floor=2 гарантує ~2 aspect-питання на раунд із 12 (~17%),
// не даючи їм витіснити дієвідміну. Число підібране емпірично harness'ом.
const VERB_KIND_QUOTA: KindQuota<string> = {
  kindOf: (c) => (c as Combo).kind,
  minSlots: { aspect: 2 },
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
  return questions;
}
