import { VerbEntry, VerbPerson, PERSON_ORDER, PERSON_LABELS } from "../types";
import { VERBS } from "../data/verbs";
import { MistakeStore, comboId, selectRoundCombos } from "./flashcardWeights";
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
  taskText: string; // "Минулий час — ona (вона)"
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
  return PAST_SUBJECT_ORDER.map((s) => pastForm(v, s));
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

// Атомарна комбінація питання.
interface Combo {
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
  return { entry: v, tense, personKey, correct, id: comboId(v.id, tense, personKey) };
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
      const c = makeCombo(v, "past", s, pastForm(v, s));
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

// Сесія квізу дієслів. Вибір комбінацій (ваги + зарезервовані слоти помилок +
// «не те саме слово поспіль») — спільний selectRoundCombos.
export function generateVerbSession(
  count: number,
  pool: VerbEntry[] = VERBS,
  mistakes: MistakeStore = {}
): VerbQuestion[] {
  const combos = enumerateCombos(pool);
  const chosen = selectRoundCombos(combos, mistakes, count, (c) => c.entry.id);
  const questions: VerbQuestion[] = [];
  for (const c of chosen) {
    const q = makeQuestion(c);
    if (q) questions.push(q);
  }
  return questions;
}
