// Чеські відмінки (7 відмінків)
export type CzechCase =
  | "nominativ" // 1. Kdo? Co?
  | "genitiv" // 2. Koho? Čeho?
  | "dativ" // 3. Komu? Čemu?
  | "akuzativ" // 4. Koho? Co?
  | "vokativ" // 5. Oslovení
  | "lokal" // 6. O kom? O čem?
  | "instrumental"; // 7. Kým? Čím?

export const CASE_ORDER: CzechCase[] = [
  "nominativ",
  "genitiv",
  "dativ",
  "akuzativ",
  "vokativ",
  "lokal",
  "instrumental",
];

export const CASE_LABELS: Record<CzechCase, { number: string; uk: string; cz: string; question: string }> = {
  nominativ: { number: "1.", uk: "Називний", cz: "Nominativ", question: "Kdo? Co?" },
  genitiv: { number: "2.", uk: "Родовий", cz: "Genitiv", question: "Koho? Čeho?" },
  dativ: { number: "3.", uk: "Давальний", cz: "Dativ", question: "Komu? Čemu?" },
  akuzativ: { number: "4.", uk: "Знахідний", cz: "Akuzativ", question: "Koho? Co?" },
  vokativ: { number: "5.", uk: "Кличний", cz: "Vokativ", question: "Oslovení!" },
  lokal: { number: "6.", uk: "Місцевий", cz: "Lokál", question: "O kom? O čem?" },
  instrumental: { number: "7.", uk: "Орудний", cz: "Instrumentál", question: "Kým? Čím?" },
};

export type Gender = "masc_anim" | "masc_inan" | "fem" | "neut";

export type GrammaticalNumber = "sg" | "pl";

// Тип відмінювання (взір) — 11 базових зразків чеської мови
export type DeclensionPattern =
  | "pan" // masc anim hard (pán)
  | "muz" // masc anim soft (muž)
  | "hrad" // masc inan hard (hrad)
  | "stroj" // masc inan soft (stroj)
  | "zena" // fem hard (žena)
  | "ruze" // fem soft (růže)
  | "kost" // fem consonant/i-decl (kost)
  | "mesto" // neut hard (město)
  | "more" // neut soft (moře)
  | "kure" // neut soft irregular (kuře)
  | "stavani"; // neut soft -í (stavení)

export const PATTERN_LABELS: Record<DeclensionPattern, string> = {
  pan: "pán (чол. істот., твердий)",
  muz: "muž (чол. істот., м'який)",
  hrad: "hrad (чол. неістот., твердий)",
  stroj: "stroj (чол. неістот., м'який)",
  zena: "žena (жін., твердий)",
  ruze: "růže (жін., м'який)",
  kost: "kost (жін., приголосний/i-відміна)",
  mesto: "město (сер., твердий)",
  more: "moře (сер., м'який)",
  kure: "kuře (сер., нерегулярний -ete)",
  stavani: "stavení (сер., -í незмінний)",
};

// Тематичні категорії слів
export type WordCategory =
  | "people"
  | "home"
  | "food"
  | "city"
  | "transport"
  | "nature"
  | "animals";

// Повна парадигма відмінювання: 7 відмінків x 2 числа
export type DeclensionTable = Record<CzechCase, { sg: string; pl: string }>;

export interface NounEntry {
  id: string;
  uk: string; // українською
  cz: string; // чеською, називний однини (базова форма)
  gender: Gender;
  pattern: DeclensionPattern;
  category: WordCategory;
  declension: DeclensionTable;
  exampleSentenceCz?: string;
  exampleSentenceUk?: string;
}

export interface CardProgress {
  entryId: string;
  correctStreak: number;
  incorrectCount: number;
  lastSeenAt: number; // timestamp
  dueAt: number; // timestamp, для інтервального повторення
}

// ─────────────────────────── ДІЄСЛОВА ───────────────────────────

// Особи дієвідміни (однина 1/2/3 + множина 1/2/3)
export type VerbPerson = "ja" | "ty" | "on" | "my" | "vy" | "oni";

export const PERSON_ORDER: VerbPerson[] = ["ja", "ty", "on", "my", "vy", "oni"];

// Підписи осіб (займенник + українською), для таблиці дієвідміни
export const PERSON_LABELS: Record<VerbPerson, { cz: string; uk: string }> = {
  ja: { cz: "já", uk: "я" },
  ty: { cz: "ty", uk: "ти" },
  on: { cz: "on/ona/ono", uk: "він/вона/воно" },
  my: { cz: "my", uk: "ми" },
  vy: { cz: "vy", uk: "ви" },
  oni: { cz: "oni/ony", uk: "вони" },
};

// Форми дієслова для однієї особи (усі 6 осіб)
export type PersonForms = Record<VerbPerson, string>;

// Вид дієслова
export type VerbAspect = "imperfective" | "perfective";

// Дієслівний клас (5 традиційних класів + нерегулярні/модальні)
export type VerbClass = "I" | "II" | "III" | "IV" | "V" | "irregular";

export const VERB_ASPECT_LABEL: Record<VerbAspect, string> = {
  imperfective: "недоконаний вид",
  perfective: "доконаний вид",
};

// Форми дієприкметника минулого часу (l-форма).
// Рід узгоджується з підметом у ВСІХ особах, тому зберігаємо 5 унікальних форм.
export interface PastParticiple {
  m: string; // чол. рід однини: dělal
  f: string; // жін. рід однини: dělala
  n: string; // сер. рід однини: dělalo
  manim_pl: string; // чол. істот. множини: dělali
  other_pl: string; // решта множини: dělaly
}

export interface VerbEntry {
  id: string;
  uk: string; // українською (інфінітив-переклад)
  cz: string; // чеський інфінітив (напр. "dělat")
  aspect: VerbAspect;
  verbClass: VerbClass;
  reflexive?: "se" | "si"; // зворотне дієслово (dívat se)

  // Текстова примітка про видову пару (без повної парадигми партнера)
  aspectPairNote?: string;

  // Теперішній час — ТІЛЬКИ для недоконаного виду (доконаний не має теперішнього).
  present?: PersonForms;

  // Майбутній час:
  //  - недоконаний зазвичай: складена конструкція budu/budeš... + інфінітив
  //    (тоді future НЕ задаємо, компонент будує його з інфінітива та BYT_FUTURE);
  //  - доконаний: власна дієвідміна (за формою = "теперішня", але значення майбутнє);
  //  - винятки (jít→půjdu, jet→pojedu): задаємо явні форми тут.
  future?: PersonForms;

  // Минулий час — 5 форм l-дієприкметника.
  pastParticiple: PastParticiple;

  exampleSentenceCz?: string;
  exampleSentenceUk?: string;
}

// Параметри навігації (React Navigation, native stack)
export type RootStackParamList = {
  Home: undefined;
  // Проміжний екран вибору частини мови (Іменники / Дієслова / …)
  WordsPartOfSpeech: undefined;
  // Іменники
  WordCategories: undefined;
  WordSelection: { category: WordCategory };
  WordSession: { title: string; entryIds: string[] };
  // Дієслова
  VerbCategories: undefined;
  VerbSelection: { verbClass: VerbClass };
  VerbSession: { title: string; entryIds: string[] };
  // Граматика
  GrammarCategories: undefined;
  GrammarTopic: { topicId: string };
  // Флеш-картки (квіз)
  FlashcardsCategories: { justFinishedRound?: boolean } | undefined;
  FlashcardsQuiz: { categoryId: string; title: string };
};
