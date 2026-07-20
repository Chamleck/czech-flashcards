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
  | "nature";

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

// Параметри навігації (React Navigation, native stack)
export type RootStackParamList = {
  Home: undefined;
  WordCategories: undefined;
  WordSelection: { category: WordCategory };
  WordSession: { title: string; entryIds: string[] };
  GrammarCategories: undefined;
  GrammarTopic: { topicId: string };
  FlashcardsCategories: undefined;
  FlashcardsQuiz: { categoryId: string; title: string };
};
