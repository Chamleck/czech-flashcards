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

// ────────────────────── ПРИКМЕТНИКИ / ЗАЙМЕННИКИ ──────────────────────

// Повна парадигма для слів, що узгоджуються в роді (прикметники, займенники):
// рід × (7 відмінків × 2 числа). Перевикористовує форму DeclensionTable.
export type FullDeclension = Record<Gender, DeclensionTable>;

// Приклад речення для кожного роду (змінюється разом із табом роду в картці).
export type GenderExamples = Record<Gender, { cz: string; uk: string }>;

// Порядок родів для перемикача-табів у картці розкриття.
export const GENDER_ORDER: Gender[] = ["masc_anim", "masc_inan", "fem", "neut"];

// Короткі підписи родів для табів (повні — у GENDER_LABEL з theme).
export const GENDER_SHORT: Record<Gender, string> = {
  masc_anim: "чол. іст.",
  masc_inan: "чол. неіст.",
  fem: "жін.",
  neut: "сер.",
};

// ── Прикметники ──
export type AdjectivePattern = "tvrdy" | "mekky"; // mladý / jarní

export type AdjectiveCategory = "size" | "quality" | "measure" | "colors" | "soft";

export interface AdjectiveEntry {
  id: string;
  uk: string;
  cz: string; // називний чол. роду однини (базова форма, напр. mladý)
  pattern: AdjectivePattern;
  category: AdjectiveCategory;
  // true → у чол. істот. Npl/Vpl чергується приголосний (velký→velcí, starý→staří)
  hasConsonantAlternation: boolean;
  declension: FullDeclension;
  // Приклади для кожного роду — показуються під відповідним табом.
  examples: GenderExamples;
  // Ступені порівняння (вищий/найвищий) — лише в градуйованих прикметників.
  // Відносні (jarní, cizí, poslední, domácí) ступенів не мають → поле відсутнє.
  // Обидва ступені відмінюються за зразком jarní (м'який).
  degrees?: {
    comparative: { cz: string; uk: string; declension: FullDeclension };
    superlative: { cz: string; uk: string; declension: FullDeclension };
  };
}

// ── Займенники (присвійні + вказівні) ──
export type PronounSubtype = "possessive" | "demonstrative";

interface PronounBase {
  id: string;
  uk: string;
  cz: string; // базова форма (напр. můj, ten)
  subtype: PronounSubtype;
}

// Відмінюваний займенник: můj/tvůj/svůj (як mladý), náš/váš (vzor náš),
// ten (vzor ten), її (як jarní).
export interface DeclinablePronoun extends PronounBase {
  declinable: true;
  vzorLabel: string; // короткий підпис зразка для картки/граматики
  declension: FullDeclension;
  examples: GenderExamples; // приклад на кожен рід (як у прикметників)
}

// Незмінний займенник: jeho, jejich — одна форма на всі відмінки,
// тому й приклад один (табів роду немає).
export interface IndeclinablePronoun extends PronounBase {
  declinable: false;
  invariantForm: string;
  exampleSentenceCz?: string;
  exampleSentenceUk?: string;
}

export type PronounEntry = DeclinablePronoun | IndeclinablePronoun;

// ── Особові займенники (já, ty, on, my, vy, oni, se) ──
// Особові НЕ вкладаються у FullDeclension: парадигма нерегулярна, а замість
// пари «однина/множина» кожна клітинка несе пару ВАРІАНТНИХ форм. Зміст пари
// залежить від слова, тому колонки підписуються індивідуально (columns):
//   • já / ty / se — «короткий» (приклонка: mě, mi, tě, se…) vs
//     «довгий / після прийменника» (наголошений: mne, mně, tebe, sebe…);
//   • on / ona / oni — «без прийменника» (j-форма: jeho, jemu, jí…) vs
//     «після прийменника» (n-форма: něho, němu, ní…).
// Клітинка, де відповідної форми немає, позначається "—".
//
// Примітка: маркер reflexive: "se"|"si" у VerbEntry — це лише позначка зворотності
// дієслова, НЕ парадигма. Тут же (займенник se/sebe) зберігаємо повне відмінювання
// зворотного займенника. Перетину даних немає — це різні сутності.
export type PronounDuo = { a: string; b: string };
export type PersonalDeclension = Record<CzechCase, PronounDuo>;
export type PronounColumnLabels = { a: string; b: string };

interface PersonalPronounBase {
  id: string;
  uk: string;
  cz: string; // словникова форма (já, ty, on, my, vy, oni, se)
  columns: PronounColumnLabels;
}

// Без роду: já, ty, my, vy, se — одна парадигма, без табів.
// my / vy не мають варіантних форм: колонка b скрізь "—" (таблиця показує 1 стовпець).
export interface PlainPersonalPronoun extends PersonalPronounBase {
  gendered: false;
  declension: PersonalDeclension;
  exampleCz: string;
  exampleUk: string;
}

// За родом: on/ona/ono (3-тя одн.), oni/ony/ona (3-тя мн.) — таби роду.
// У множині за родом різниться лише називний; решта форм спільні.
export interface GenderedPersonalPronoun extends PersonalPronounBase {
  gendered: true;
  declension: Record<Gender, PersonalDeclension>;
  examples: GenderExamples;
}

export type PersonalPronounEntry = PlainPersonalPronoun | GenderedPersonalPronoun;

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

  // Наказовий спосіб (rozkazovací způsob) — лише 3 форми: ty/vy/my.
  // Опційне: модальні (moci/muset/smět) та деякі дієслова (růst) його не мають.
  imperative?: { ty: string; vy: string; my: string };

  // Приклади речень окремо для кожного часу (одне базове речення, що
  // змінює форму дієслова). Теперішній — тільки для недоконаних,
  // imperative — лише для дієслів із наказовим способом.
  examples: {
    present?: { cz: string; uk: string };
    past: { cz: string; uk: string };
    future: { cz: string; uk: string };
    imperative?: { cz: string; uk: string };
  };
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
  // Прикметники
  AdjectiveCategories: undefined;
  AdjectiveSelection: { category: AdjectiveCategory };
  // Займенники
  PronounGroups: undefined;
  PronounSelection: undefined; // присвійні + вказівні
  PersonalPronounSelection: undefined; // особові
  // Спільна сесія прикметників/займенників (картка з табами роду).
  // kind "personal" → особові займенники (окрема картка PersonalPronounCard).
  DeclSession: { title: string; kind: "adjective" | "pronoun" | "personal"; entryIds: string[] };
  // Граматика
  GrammarCategories: undefined;
  GrammarTopic: { topicId: string };
  // Флеш-картки (квіз)
  FlashcardsCategories: undefined;
  FlashcardsQuiz: { categoryId: string; title: string };
};
