import type { NounTag } from "../data/nounTags";
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

// Тематичні категорії слів
export type WordCategory =
  | "people"
  | "home"
  | "food"
  | "city"
  | "transport"
  | "nature"
  | "animals"
  | "days"
  | "months"
  | "numbers"
  | "time"
  | "body"
  | "work"
  | "education";

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
  // ОБОВ'ЯЗКОВЕ рішення: true → незлічуване (maso, voda, rýže, peníze…): у квізі «Числівники» не рахується
  // («osm mas»), у множинних фразах квізів не стоїть («vody», «masa») — крім фраз, чиє поле plOk містить тег цього
  // слова («minerální vody», «silné větry»); його множину, якої мова не вживає, не бере жоден квіз (NOUN_USAGE_RULES,
  // utils/partnerSelection.ts). false → звичайний злічуваний іменник (káva — порції: «dvě kávy»).
  uncountable: boolean;
  // Смислові теги (data/nounTags.ts): за ними квіз «Прийменники» підбирає слово у фрази, де воно природне
  // («Jsem v ___» — placeV, «Polož to na ___» — surface). ОБОВ'язкове поле: без нього новий іменник
  // не збереться, а нічим не позначене слово не потрапляло б у змістовні фрази.
  sem: NounTag[];
  // Прийнятні (розмовні чи рідкісні) форми клітинки, які НЕ показуємо на картці, але які квіз не має права
  // подавати як ПОМИЛКОВУ відповідь (напр. родовий kostel — kostela, але й kostelu вживають). Лише там, де
  // така форма збігається з формою іншого відмінка того ж слова.
  variants?: Partial<Record<CzechCase, Partial<Record<GrammaticalNumber, string[]>>>>;
  // Рід, за яким із цим словом узгоджуються прикметники й займенники В МНОЖИНІ, коли він інший, ніж в однині:
  // děti, oči, uši узгоджуються як жіночий рід («ty malé děti», «modré oči»), хоча dítě / oko / ucho — середній.
  // Квіз «Прикметники та займенники» інакше склав би «ta malá děti». Для решти слів поле відсутнє.
  plGender?: Gender;
  // Лише sto: у спілці з іменником може лишатися невідмінюваним (bez sto korun, ke sto korunám, se sto korunami —
  // IJP id=792, поряд із bez sta korun, ke stu korunám). Квіз «Числівники» не подає «sto» як помилку в жодному відмінку.
  uninflectedAsNumeral?: true;
  // Лише лічильні іменники sto, tisíc, milion, miliarda (категорія «numbers»): яке число вони означають. Квіз
  // «Числівники» за ним не ставить мільйон у фразу, де така кількість безглузда («Znám milion hostů») —
  // поле max фрази в data/numeralFrames.ts.
  numeralValue?: number;
  // Лише 12 місяців (leden … prosinec): номер і найбільший день. Квіз «Дата й час» бере місяці саме за цим полем.
  month?: CalendarMonth;
}

// Вимога до іменника-партнера (квіз «Прикметники та займенники»): ті самі смислові теги, що у фреймах квізу
// «Прийменники» (any — хоча б один тег, all — усі, none — жодного), плюс countable: true — лише злічувані
// іменники (не voda, rýže, sníh: «velká rýže» безглузде). Порожня вимога — будь-який іменник.
export interface NounFilter {
  any?: NounTag[];
  all?: NounTag[];
  none?: NounTag[];
  countable?: boolean;
}

export interface CardProgress {
  entryId: string;
  incorrectCount: number;
  // true — останню відповідь було "Знаю", false — "Ще повторити".
  // Єдине, що визначає, чи слово зараз у колоді "Повторити помилки"
  // (див. isMistake у progress.ts) — жодного інтервального відкладання
  // немає: тренування завжди проходить весь обраний список, порядок і
  // включення не залежать від часу останньої відповіді.
  knewLastTime: boolean;
  lastSeenAt: number; // timestamp
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

export type AdjectiveCategory = "size" | "quality" | "measure" | "colors" | "soft" | "ordinal";

interface AdjectiveBase {
  id: string;
  uk: string;
  cz: string; // називний чол. роду однини (базова форма, напр. mladý)
  pattern: AdjectivePattern;
  category: AdjectiveCategory;
  // true → у чол. істот. Npl/Vpl чергується приголосний (velký→velcí, starý→staří)
  hasConsonantAlternation: boolean;
  // З якими іменниками прикметник природний (за смисловими тегами іменників, data/nounTags.ts). ОБОВ'ЯЗКОВЕ:
  // квіз «Прикметники та займенники» бере партнера лише з цього кола («hladový pes», а не «hladový stůl»).
  // Ступені порівняння беруть ту саму вимогу. Правила — у шапці data/adjectives.ts.
  fits: NounFilter;
  declension: FullDeclension;
  // Приклади для кожного роду — показуються під відповідним табом.
  examples: GenderExamples;
  // Другий сенс багатозначного слова (наразі лише těžký/lehký: вага vs
  // переносне значення складно/легко) — картка показує ОБИДВА приклади під
  // активним табом роду, з короткою міткою сенсу над кожним. senseLabel —
  // підпис над основним `examples`, задається лише разом із secondSense.
  senseLabel?: string;
  secondSense?: { label: string; examples: GenderExamples };
  // Лише порядкові (category "ordinal"): яке число слово називає (druhý — 2). Квіз «Дата й час» за ним читає
  // «půl druhé» (родовий жін. роду наступної години); квіз «Числівники» — фрази з max (data/numeralFrames.ts).
  value?: number;
}

// Ступені порівняння (вищий/найвищий); обидва відмінюються за зразком jarní (м'який).
export interface AdjectiveDegrees {
  comparative: { cz: string; uk: string; declension: FullDeclension };
  superlative: { cz: string; uk: string; declension: FullDeclension };
}

// Смисловий клас прикметника — ОБОВ'ЯЗКОВЕ рішення для кожного слова (без нього проєкт не збереться), бо від
// нього залежить, у які фрази квізу слово може потрапити. З класу випливає решта, тож кожне рішення записане раз:
//  • "quality"    — постійна якість (velký, mladý, chytrý): має degrees; quizDegrees — чи питати ступені у квізі
//                   (false, коли вищий ступінь у мовленні рідкісний чи дивний: кольори «červenější vlak»,
//                   otevřený/zavřený, plný/prázdný, volný, ubohý — на картці ступені є);
//  • "state"      — тимчасовий стан істоти, «який зараз», а не «який є» (hladový, unavený, nemocný, naštvaný…):
//                   має degrees (на картці), але у квізі ступенів не питаємо («nejhladovější kamarád»), і слова
//                   немає у фразах-оцінках (DeclFrame.evaluative: «Mám rád nemocné koně» безглузде);
//  • "relational" — відносний, без ступенів (poslední, stejný, cizí, celý, hlavní, jarní, порядкові): не стає
//                   словом-партнером («nějaké poslední divadlo») і не йде у фрази qualitative.
export type AdjectiveEntry = AdjectiveBase &
  (
    | { semClass: "quality"; degrees: AdjectiveDegrees; quizDegrees: boolean }
    | { semClass: "state"; degrees: AdjectiveDegrees; quizDegrees?: never }
    | { semClass: "relational"; degrees?: never; quizDegrees?: never }
  );

// ── Займенники (присвійні + вказівні) ──
export type PronounSubtype = "possessive" | "demonstrative" | "interrogative" | "indefinite";

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
  // Лексичні властивості для квізу «Прикметники та займенники» (див. PronounQuiz). Відсутнє поле = звичайний
  // займенник: годиться до будь-якого іменника, у будь-якому числі й відмінку, може бути словом-партнером.
  quiz?: PronounQuiz;
  declension: FullDeclension;
  examples: GenderExamples; // приклад на кожен рід (як у прикметників)
}

// Лексичні властивості займенника, які квіз «Прикметники та займенники» мусить знати, щоб фраза була правильною.
// Кожне поле — факт про слово (звірений за джерелами), а не команда рушію. Правила — у шапці data/pronouns.ts.
export interface PronounQuiz {
  fits?: NounFilter; // з якими іменниками слово природне (čí — лише з тим, що можна мати; kolikátý — з одиницями часу)
  partner?: false; // не підставляти як слово-партнер у чуже питання (sám, tentýž, žádný, питальні)
  nominative?: false; // не ставити в називний (sám: «Tady je sám učitel» неприродне)
  needsOwner?: true; // лише у фразі з підметом-особою, якому річ належить (svůj: «Hledám svůj klíč»); не в називному і не
  // у фразах без такого підмета («Je tu hodně…», «Za … je zahrada» — DeclFrame.ownerless)
  num?: GrammaticalNumber; // лише це число (každý — однина: «každé dva dny» лише з числівником)
  massSg?: true; // однина лише з незлічуваним іменником: všechen chléb, všechna voda, але всі злічувані — у множині
  role?: "neg" | "question" | "order" | "some" | "every"; // neg — лише у фразах із запереченням (žádný); question —
  // питальний (jaký, který, čí: фрейми-питання); order — питання про порядок (kolikátý: питання + власні фрейми
  // «Kolikátý den už čekáš?»); some — неозначений «якийсь» (nějaký: лише фрази, де він природний, — «Hledám nějaký
  // hotel», але не «Mám rád nějaké studenty»); every — узагальнення «кожен / усі» (každý, všechen: власні фрази
  // «Každý student to ví», «Cvičím každý den», «Koupil jsem všechen chléb»). Слово з role не буває словом-партнером.
  skip?: true; // у квізі не питаємо (sám: його непрямі форми в ролі означення — «samého bratra» — у мовленні заступає
  // samotný, а природні речення з sám предикативні: «Jsem sám»)
  owner?: "m" | "f" | "pl"; // присвійний займенник 3-ї особи за власником: jeho — він / воно, její — вона, jejich — вони.
  // Квіз питає «чий?»: «Znáš tu ženu? Bydlím v ___ domě» → jejím (дистрактор — те саме місце в інших власників)
}

// Незмінний займенник: jeho, jejich — одна форма на всі відмінки,
// тому й приклад один (табів роду немає).
export interface IndeclinablePronoun extends PronounBase {
  declinable: false;
  invariantForm: string;
  quiz?: PronounQuiz; // лише fits: з якими іменниками природний як слово-партнер (jeho / jejich — не з погодою й часом)
  exampleSentenceCz?: string;
  exampleSentenceUk?: string;
}

export type PronounEntry = DeclinablePronoun | IndeclinablePronoun;

// ── Особові займенники (já, ty, on, my, vy, oni, se) ──
// Особові НЕ вкладаються у FullDeclension: парадигма нерегулярна, а замість
// пари «однина/множина» кожна клітинка несе пару ВАРІАНТНИХ форм. Зміст пари
// залежить від слова, тому колонки підписуються індивідуально (columns):
//   • já / ty / se — «короткий» (приклонка: mě, mi, tě, se…) vs
//     «довгий / після прийменника» (наголошений: mně, tebe, sebe…; у já в 2. і 4. відмінку — mě / mne, mne книжне);
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
  // Підпис під заголовком картки (PersonalPronounCard). ОБОВ'ЯЗКОВЕ: у карток цього типу різні
  // слова (особові, питальні kdo/co, неозначені někdo…) — тихий дефолт підписував би «особовий»
  // кожне нове слово, а компілятор тепер не дає його пропустити.
  patternLabel: string;
  // Фрази квізу «Прикметники та займенники» для слів без роду й числа (kdo, co, někdo, nikdo, něco, nic): на кожен
  // відмінок 2+ речення з пропуском «___». Слово з цим полем потрапляє у квіз саме; без нього — лише картка.
  // Питальне слово (kdo, co) стоїть на ПОЧАТКУ питання, перед ним може бути лише прийменник: «Komu věříš?»,
  // «S kým jedeš?»; «Věříš komu?» — лише перепитування. Неозначені (někdo, něco) — на звичайному місці: «Věříš někomu?».
  quizFrames?: Partial<Record<CzechCase, string[]>>;
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
  number: GrammaticalNumber; // on/ona/ono — sg, oni/ony/ona — pl (квіз бере форми з PERSONAL_QUIZ_FORMS[number])
  declension: Record<Gender, PersonalDeclension>;
  examples: GenderExamples;
}

export type PersonalPronounEntry = PlainPersonalPronoun | GenderedPersonalPronoun;

// ─────────────────── КІЛЬКІСНІ ЧИСЛІВНИКИ ───────────────────
// Кількісні числівники НЕ вкладаються у FullDeclension: механіка різна для
// кожної групи, тому чотири окремі "kind" в одному discriminated union
// (за тим самим принципом, що PronounEntry). Вокатив числівники не мають —
// у таблицях його не показуємо (нижче — власний порядок відмінків без нього).
// Множина/однина тут не застосовна (число саме є кількістю), тому клітинки
// зберігають ОДНУ форму на відмінок, не пару sg/pl.

// Порядок відмінків для числівникових таблиць (без вокатива).
export const NUMERAL_CASE_ORDER: CzechCase[] = [
  "nominativ",
  "genitiv",
  "dativ",
  "akuzativ",
  "lokal",
  "instrumental",
];

// Форми для іменників, що мають ЛИШЕ множину (kalhoty, brýle): з ними замість jeden / dva / oba / tři / čtyři
// кажуть jedny / dvoje / oboje / troje / čtvery (IJP: «u pomnožných jmen význam číslovky základní»; dvoje kalhoty =
// двоє штанів). Від п'яти — звичайне pět kalhot, тому в pět+ цього поля немає. Картка показує ці форми на окремій
// вкладці, квіз «Числівники» тренує їх із такими іменниками (слово без форм однини в nouns.ts).
export interface PluralOnlyForms {
  cz: string; // заголовок вкладки й форма називного: "dvoje"
  // Форма для чоловічого неістотового й жіночого роду (і для середнього, якщо neut не задано).
  forms: Record<CzechCase, string>;
  // Лише відмінки, де середній рід має іншу форму: jedna (ústa) проти jedny (kalhoty) у називному й знахідному.
  neut?: Partial<Record<CzechCase, string>>;
  example: { cz: string; uk: string };
  note: string; // текст банера «Важливо» на цій вкладці
  noteLinks?: NoteLink[]; // клікабельні слова в банері (kalhoty, brýle)
}

// Спільне для кількісних числівників. value — число, яке слово називає (1 … 90); немає в oba (не число, а «обидва»).
// З value квіз «Числівники» складає 21–99 (десяток + одиниця) — без списків id у коді.
interface CardinalBase {
  id: string;
  uk: string;
  cz: string;
  value?: number;
}

// 1) jeden — повна парадигма рід×відмінок (як ten). Лише однина.
//    Використовує наявний FullDeclension, але значущі лише поля sg
//    (pl не застосовне до "один"); заповнюємо sg=pl однаково для типобезпеки.
export interface GenderedNumeral extends CardinalBase {
  kind: "gendered"; // jeden/jedna/jedno
  declension: FullDeclension;
  examples: GenderExamples;
  pluralOnly?: PluralOnlyForms; // jedny
}

// 2) dva — дві колонки за родом: masc vs fem/neut. Одна форма на відмінок.
//    (oba/obě відмінюється ідентично — окремий запис із тією ж структурою.)
export interface TwoFormNumeral extends CardinalBase {
  kind: "twoForm"; // dva/dvě, oba/obě
  // Кожен відмінок → { masc, femNeut }.
  forms: Record<CzechCase, { masc: string; femNeut: string }>;
  examples: GenderExamples; // приклад на кожен рід
  pluralOnly?: PluralOnlyForms; // dvoje, oboje
}

// 3) tři, čtyři — без роду, одна колонка × відмінки (зразок kost із винятками).
export interface InvariantDeclNumeral extends CardinalBase {
  kind: "invariantDecl"; // tři, čtyři
  forms: Record<CzechCase, string>;
  exampleCz: string;
  exampleUk: string;
  pluralOnly?: PluralOnlyForms; // troje, čtvery
}

// 4) pět…dvanáct — лише дві форми: пряма (N/A) + спільна на решту відмінків (-i).
export interface ObliqueNumeral extends CardinalBase {
  kind: "oblique"; // pět, šest…
  direct: string; // N/A: pět
  oblique: string; // G/D/L/I: pěti
  exampleCz: string;
  exampleUk: string;
}

export type CardinalEntry =
  | GenderedNumeral
  | TwoFormNumeral
  | InvariantDeclNumeral
  | ObliqueNumeral;


// ─────────────────────────── ДАТИ Й ЧАС ───────────────────────────
// Порядковий-день для дати: лише дві потрібні форми (не повна парадигма).
// nom — «дата як підмет» (První leden je svátek); gen — «коли» (prvního ledna).
// Дублети складених 21–31 («dvacátého pátého / pětadvacátého») — рядком через " / ".
export interface DateOrdinal {
  day: number; // 1..31
  uk: string; // середній рід, як у даті: «двадцять п'яте» (травня)
  nom: string; // називний: «dvacátý pátý / pětadvacátý»
  gen: string; // родовий (у даті): «dvacátého pátého / pětadvacátého»
}

// Місяць як іменник (leden … prosinec, data/nouns.ts): номер у році й найбільший день — за ним квіз «Дата й час»
// не складе «31. února». Лише 12 місяців; пори року (léto, zima…) поля не мають.
export interface CalendarMonth {
  num: number; // 1..12
  maxDay: number; // 28–31 (лютий — 29: рідкісне, але реальне 29. února)
  ukGen: string; // українською в родовому — для перекладу дати: «п'яте травня»
}

// ─────────────────────────── ПРИЙМЕННИКИ ───────────────────────────
// Прийменник — незмінна частина мови (немає власної парадигми), тому НЕ
// натягуємо на DeclEntry/NounEntry: окрема легка структура за принципом
// проєкту «моделюємо рівно те, що потрібно» (як CardinalEntry, DateOrdinal).
// type: "fixed" — керує ОДНИМ відмінком завжди (ця фаза).
//       "dual"  — керує ДВОМА відмінками (рух/спокій, наступна фаза). Поле
//                 закладаємо заздалегідь, щоб не переробляти тип удруге.
export type PrepositionType = "fixed" | "dual";

// Один "сенс" дуального прийменника: відмінок + приклади для нього.
export interface PrepositionSense {
  govCase: CzechCase;
  examples: { cz: string; uk: string }[];
}

export interface PrepositionEntry {
  id: string;
  cz: string; // канонічна форма: «od», «k», «s»
  uk: string; // «від», «до», «з»
  govCase: CzechCase; // ВІДМІНОК, ЯКИМ КЕРУЄ. Для fixed — єдиний і реальний.
  // Для dual це поле означає лише "основний/типовий" відмінок (використовується
  // там, де треба одне значення, напр. заголовок) — реальні два відмінки лежать
  // у полі dual нижче. Ставимо akuzativ, бо це спільний "рух" усіх дуальних.
  type: PrepositionType;
  vocalized?: string; // «ke»/«se»/«ze»/«ve»/«ze» — варіант перед збігом приголосних
  vocalNote?: string; // коли саме з'являється вокалізована форма (для картки)
  examples: { cz: string; uk: string }[]; // для fixed — приклади; для dual порожній (див. dual)
  // Тільки для type === "dual": контраст "куди?" (рух, akuzativ) vs "де?" (спокій,
  // lokál або instrumentál). exchange — лише для «za» (обмін/ціна, akuzativ), інший
  // сенс, показується окремою вкладкою.
  dual?: {
    motion: PrepositionSense; // куди? (akuzativ)
    location: PrepositionSense; // де? (lokál / instrumentál)
    exchange?: PrepositionSense; // тільки «za»: обмін/ціна (akuzativ)
  };
}


// ─────────────────────────── НЕЗМІННІ ПРИСЛІВНИКИ МІСЦЯ ───────────────────────────
// vlevo/doleva/zleva тощо — незмінна частина мови (як прийменники), тому
// власна структура + власна self-report сесія (не WordSession/DeclSession).
// Модель "стільки сенсів, скільки реально є" (як CardinalEntry/DateOrdinal):
// повні слова мають 3 сенси (де/куди/звідки), винятки (tam, doma) — 2, rovně — 1.
// Просторова роль форми = на яке питальне слово вона відповідає (kde / kam / odkud / kudy, data/interrogativeAdverbs.ts).
export type SpatialRole = "loc" | "dir" | "orig" | "path";

// asks — ОБОВ'ЯЗКОВЕ рішення: на які питання відповідає форма (tam — на kde і kam одразу). Підпис сенсу на картці
// («де?», «де? / куди?») і квіз «Прислівники місця» беруться з нього. Форма без питання (rovně — лише напрямок) має
// порожній asks і власний label.
export type AdverbSense = {
  cz: string;
  examples: { cz: string; uk: string }[];
} & ({ asks: [SpatialRole, ...SpatialRole[]]; label?: never } | { asks: []; label: string });

export interface SpatialAdverbEntry {
  id: string;
  uk: string; // орієнтир-переклад, напр. "ліворуч"
  senses: AdverbSense[];
  note?: string; // пояснення винятку (tam: одна форма на де+куди; doma: нема звідки)
}

// ─────────────── НЕЗМІННІ СЛОВА БЕЗ ПАРАДИГМИ (компенсація — 4 приклади) ───────────────
// Для слів без відмінювання/дієвідміни, де немає "сенсів" (на відміну від
// SpatialAdverbEntry, де kde/kam/odkud/kudy — РІЗНІ слова з різних сенсів
// одного концепту), кожне слово — окремий запис з фіксованою кількістю
// прикладів природної мови (4), що компенсує відсутність парадигми: показує
// слово в поширених конструкціях замість таблиці форм. Уперше — питальні
// прислівники місця (kde/kam/odkud/kudy); той самий тип переюзається для
// решти незмінюваних питальних слів (kdy/jak/proč/kolik).
export interface InvariantWordEntry {
  id: string;
  cz: string;
  uk: string;
  examples: { cz: string; uk: string }[];
  // Банер "Важливо" — лише для реального ризику помилки (напр. když
  // проти вже наявного питального kdy), не для стилістичних нюансів. Той
  // самий патерн, що PrepositionEntry.vocalNote.
  note?: string;
  // Слова всередині note, які стають клікабельними — СТРУКТУРНЕ поле (як
  // VerbEntry.aspectPairId), не регулярка на довільний текст note: кожен
  // елемент називає ТОЧНИЙ підрядок і його ціль. word шукається як перше
  // входження в note рядка renderNoteWithLinks (див. NoteLinks.tsx).
  noteLinks?: NoteLink[];
}

// Питальний прислівник місця (kde / kam / odkud / kudy): роль, на яку він питає, і підказка квізу «Прислівники місця»
// для прямого питання («Де? (стан, без руху)»). Ролі — по одному слову на роль.
export type SpatialQuestionEntry = InvariantWordEntry & { role: SpatialRole; quizHint: string };

// Один клікабельний підрядок усередині note. kind окремо на кожен лінк —
// ціль може бути з ІНШОГО розділу (напр. když → kdy в "Питальні слова").
// Чи ціль в іншому списку, дані НЕ кажуть: це визначає навігація за фактичним станом стека
// (utils/linkNavigation.ts), тож другого джерела істини немає.
export interface NoteLink {
  word: string;
  wordId: string;
  kind: BrowseKind;
}



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

// ─────────────── СПОЛУЧНИКИ З ОСОБОВОЮ ПАРАДИГМОЮ (aby, kdyby) ───────────────
// aby/kdyby історично зрослися зі особовими закінченнями кондиціоналу (a+by,
// kdy+by) — тому мають РЕАЛЬНУ парадигму з 6 форм (abych/abys/aby/abychom/
// abyste/aby), а не є незмінними. Це НЕ InvariantWordEntry (та компенсує
// ВІДСУТНІСТЬ парадигми 4 прикладами — тут парадигма Є), тому за принципом
// "повна парадигма → 1 приклад" (як NounEntry/AdjectiveEntry) — окремий,
// легкий тип. paradigm перевикористовує вже наявний PersonForms (той самий
// шейп, що VerbEntry.present/future) — рендериться тим самим PersonFormsTable,
// що дієвідміна дієслів.
export interface ConditionalConjunctionEntry {
  id: string;
  cz: string; // "aby" / "kdyby" — базова (3-тя особа) форма, як у словнику
  uk: string;
  paradigm: PersonForms;
  examples: { cz: string; uk: string }[];
  // Той самий банер-принцип, що InvariantWordEntry.note — тут: ризик плутанини
  // aby↔kdyby (однакова сітка закінчень, різне значення мета/умова).
  note?: string;
  noteLinks?: NoteLink[];
}

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
  other_pl: string; // множина жін. та чол. неістот.: dělaly (сер. множини — форма f: dělala)
}

interface VerbBase {
  id: string;
  uk: string; // українською (інфінітив-переклад)
  cz: string; // чеський інфінітив (напр. "dělat")
  verbClass: VerbClass;
  reflexive?: "se" | "si"; // зворотне дієслово (dívat se)

  // Текстова примітка про видову пару (для показу на картці).
  aspectPairNote?: string;
  // Слова з aspectPairNote, що ведуть на ІНШІ картки (схожі за значенням: знати ↔ vědět, bydlet ↔ žít).
  // Той самий механізм, що noteLinks у службових слів (NoteLinks.tsx): явний список {word, wordId, kind},
  // ціль кліку — завжди wordId, текстовий пошук лише вирішує, де підкреслити. Партнер із aspectPairId сюди
  // НЕ входить (він клікабельний за шаблоном «(не)доконаний партнер: X»).
  noteLinks?: NoteLink[];
  // Пара дієслів руху «однократне ↔ багатократне» (jít–chodit, jet–jezdit, nést–nosit, letět–létat,
  // běžet–běhat). Це НЕ видова пара: обидва члени недоконані, тому aspectPairId тут не годиться
  // (його читає квіз видів). Окреме поле лише для картки: компонент сам будує пояснення й робить
  // партнера клікабельним (ціль — завжди partnerId). Двонапрямне, як aspectPairId.
  motion?: { kind: "single" | "multi"; partnerId: string };
  // Банер під перемикачем часів на ТАБІ, якого стосується: теперішній час у
  // недоконаних, майбутній у доконаних (VerbConjugation). Для форм "я / вони"
  // правильні обидва варіанти — нейтральний -uji/-ují і розмовний -uju/-ujou.
  // У таблиці показана нейтральна форма; назву часу в тексті не пишемо — її вже
  // показує активний таб.
  registerNote?: string;

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

// Вид і видова пара. Рішення для видових питань квізу ОБОВ'ЯЗКОВІ на кожному члені пари (без них проєкт не збереться),
// на дієсловах без пари їх поставити не можна. Правила й тести — у шапці verbs.ts.
//  • aspectPairId — структурне посилання на id видового партнера (для квізу «обери вид за контекстом»):
//    двонапрямне, обидва дієслова пари вказують одне на одного; немає лише в дієслів без чіткої пари
//    (модальні, нерегулярні без партнера).
//  • delimitativePartner (недоконане) — true, якщо доконаний партнер може бути ДЕЛІМІТАТИВНИМ (po-/pro-: poseděl,
//    poležel, počkal, promluvil — «певний час»): у видових питаннях пари не буде фрейму «za + час» («Poseděl jsem za
//    minutu» неприродно). Кандидатів підказує scripts/check-verb-quiz.ts.
//  • durative (недоконане) — true, якщо «Celou noc / dvě hodiny jsem ___ (+ complement)» звучить природно. false —
//    миттєва зміна стану (přicházet, začínat), стан/сприйняття (vidět, rozumět), інший масштаб (růst, snídat): тоді
//    недоконане питають у фазових фреймах («Přestal jsem ___» — лише недоконаний інфінітив), а не у фреймах тривалості.
//  • complement / phasalComplement (недоконане, необов'язкові) — додаток у видових фреймах, спільний для пари
//    («Psal jsem dopis…», «Konečně jsem napsal dopis»); phasalComplement замінює його у фазових фреймах
//    («Přestal jsem vstávat brzy»), "" — фазовий фрейм без додатка.
//  • resultative (доконане) — true, якщо «Zítra ___ a bude hotovo» звучить природно (навмисна дія з результатом);
//    false для přijít, zapomenout, uvidět, posedět…
//  • phasal (доконане) — фазове дієслово (začít, přestat), з якого будуються фазові фрейми.
export type VerbEntry = VerbBase &
  (
    | {
        aspect: "perfective";
        aspectPairId: string;
        resultative: boolean;
        phasal?: true;
        delimitativePartner?: never;
        durative?: never;
        complement?: never;
        phasalComplement?: never;
      }
    | {
        aspect: "perfective";
        aspectPairId?: undefined;
        resultative?: never;
        phasal?: never;
        delimitativePartner?: never;
        durative?: never;
        complement?: never;
        phasalComplement?: never;
      }
    | {
        aspect: "imperfective";
        aspectPairId?: undefined;
        resultative?: never;
        phasal?: never;
        delimitativePartner?: never;
        durative?: never;
        complement?: never;
        phasalComplement?: never;
      }
    | {
        aspect: "imperfective";
        aspectPairId: string;
        delimitativePartner: boolean;
        durative: boolean;
        complement?: string;
        phasalComplement?: string;
        resultative?: never;
        phasal?: never;
      }
  );

// Параметри навігації (React Navigation, native stack)
// Частина мови для режиму перегляду. Визначає джерело даних і компонент картки.
// "pronouns" покриває і присвійні/вказівні, і особові — розрізнення всередині
// за id через pronounCardType (той самий патерн, що "interrogative" з
// interrogativeCardType: один kind, кілька структур даних, диспетчер по id).
export type BrowseKind = "nouns" | "verbs" | "adjectives" | "pronouns" | "cardinals" | "prepositions" | "adverbs" | "interrogative" | "service-word";

export type RootStackParamList = {
  Home: undefined;
  // Проміжний екран вибору частини мови (Іменники / Дієслова / …)
  // focusSearch: true — тільки коли сюди ведуть іконкою пошуку з BrowseList/
  // BrowseCard (навмисний намір шукати); звичайне "назад" — БЕЗ автофокусу.
  WordsPartOfSpeech: { focusSearch?: boolean } | undefined;
  // Іменники
  WordCategories: undefined;
  WordSelection: { category: WordCategory };
  WordSession: { title: string; entryIds: string[]; storageKey?: string; isMistakeRepeat?: boolean };
  // Дієслова
  VerbCategories: undefined;
  VerbSelection: { verbClass: VerbClass };
  VerbSession: { title: string; entryIds: string[]; isMistakeRepeat?: boolean };
  // Прикметники
  AdjectiveCategories: undefined;
  AdjectiveSelection: { category: AdjectiveCategory };
  // Займенники
  PronounGroups: undefined;
  PronounSelection: undefined; // присвійні + вказівні
  PersonalPronounSelection: undefined; // особові
  IndefinitePronounSelection: undefined; // неозначені, заперечні й означальні (někdo/nikdo/něco/nic/nějaký/žádný/každý)
  InterrogativeSelection: undefined; // питальні (jaký/který/čí + kdo/co)
  InterrogativeAdverbSelection: undefined; // прислівникова група (kde/kam/odkud/kudy)
  InterrogativeMiscSelection: undefined; // інша група (kdy/jak/proč/kolik)
  // Питальні слова — окремий тематичний розділ (хаб усіх питальних виразів)
  Interrogatives: undefined;
  // Службові слова — окремий тематичний розділ (хаб: сполучники + загальні
  // прислівники). Та сама модель, що "Питальні слова", але простіша: усі
  // записи обох груп — InvariantWordEntry (без резолвера змішаних форм).
  ServiceWords: undefined;
  ConjunctionSelection: undefined; // сполучники (a/ale/nebo/protože/že/když/pokud/jestli/aby/takže)
  ServiceAdverbSelection: undefined; // загальні прислівники (opravdu/vlastně/prostě/už/tehdy/pak/raději/víceméně/nicméně/přesto)
  // Числівники (роутер: кількісні / порядкові / сотні-тисячі)
  Numerals: undefined;
  NumeralSelection: { numKind: "cardinal" | "ordinal" | "hundreds" };
  // Прийменники (роутер: групи за відмінком) + власна self-report сесія
  // (прийменник незмінний, тому не через WordSession/DeclSession).
  Prepositions: undefined;
  PrepositionSession: { title: string; entryIds: string[]; isMistakeRepeat?: boolean };
  // Вибір слів усередині групи прийменників — govCase для фіксованих груп,
  // "dual" для дуальних. Груп з РІВНО 1 прийменником (lokal, instrumental)
  // пікер НЕ отримує — вибирати підмножину з одного слова нема сенсу
  // (toggleAll на 1 елементі має лише 2 стани, ідентичні "Тренуванню"
  // напряму), тому маршрут не використовується для них.
  PrepositionSelection: { govCase: CzechCase | "dual" };
  // Прислівники місця (де/куди/звідки) — та сама логіка, що прийменники:
  // незмінна частина мови, власна self-report сесія.
  Adverbs: undefined;
  AdverbSession: { title: string; entryIds: string[]; isMistakeRepeat?: boolean };
  AdverbSelection: undefined;
  // Спільна сесія прикметників/займенників (картка з табами роду).
  // kind "personal" → особові займенники (окрема картка PersonalPronounCard).
  // kind "ordinal" → порядкові числівники: той самий рендер/датасет, що "adjective",
  // але окреме сховище прогресу (PROGRESS_KEYS.numerals, не змішується зі звичайними
  // прикметниками). kind "cardinal" → кількісні числівники (картка NumeralCard,
  // датасет CARDINALS), теж пише в PROGRESS_KEYS.numerals.
  DeclSession: {
    title: string;
    kind: "adjective" | "pronoun" | "personal" | "ordinal" | "cardinal" | "numeral-mixed" | "pronoun-mixed" | "interrogative" | "service-word";
    entryIds: string[];
    isMistakeRepeat?: boolean;
  };
  // Режим ПЕРЕГЛЯДУ слів (не тренування): список без чекбоксів → картка з горизонтальним
  // свайпом між сусідніми словами. Спільний для всіх частин мови через BrowseKind:
  // kind визначає і джерело даних, і компонент картки (як у DeclSession за "kind").
  BrowseList: { kind: BrowseKind; entryIds: string[]; title: string };
  BrowseCard: { kind: BrowseKind; entryIds: string[]; initialIndex: number; title: string };
  // Граматика
  GrammarCategories: undefined;
  GrammarTopic: { topicId: string };
  // Флеш-картки (квіз)
  FlashcardsCategories: undefined;
  FlashcardsQuiz: { categoryId: string; title: string };
};
