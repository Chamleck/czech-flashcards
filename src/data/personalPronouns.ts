import { PersonalPronounEntry, PersonalDeclension, Gender } from "../types";

// Особові займенники: já, ty, on/ona/ono, my, vy, oni/ony/ona, se.
// Парадигма нерегулярна — виверено за джерелами: czechonline.org (таблиця
// коротких форм + форм після прийменника), ucitel.net, ÚJČ/Wikipedie,
// santoska.cz (правопис ji/jí, mě/mně). Пара форм у клітинці:
//   • já / ty / se — короткий (приклонка) / довгий (наголош., після прийм.);
//   • on / ona / oni — без прийменника (j-) / після прийменника (n-).
// "—" = форма відсутня (напр. немає короткої, або клітинка невживана).
// Вокатив в особових відсутній → скрізь "—".
//
// ПРАВИЛА (закритий клас; квізи «Прикметники та займенники» і «Прийменники»)
//  • person — ОБОВ'ЯЗКОВЕ (тип PersonalQuizPronoun нижче): 1 — фрази квізу з підметом «ти» («Bojíš se mě?»), 2 і 3 —
//    з підметом «я» («Bojím se tě»), reflexive (se) — власні фрази REFLEXIVE_FRAMES (data/declensionFrames.ts).
//  • number — у займенників з родом (тип GenderedPersonalPronoun): on — sg, oni — pl; вибирає таблицю
//    PERSONAL_QUIZ_FORMS. Кожна форма в ній мусить бути й у таблиці картки.
//  • Колонки COLS_NP (без прийм. / після прийм.) вмикають займенник у квізі «Прийменники» (k němu, s ní).
//  • Перед здачею — оракул scripts/check-quiz-coverage.ts --only=decl,preps: «Помилок: 0».

const COLS_SL = { a: "короткий", b: "довгий" };
// Експортовано для квізу «Прийменники»: займенники з цими колонками (on/ona/ono, oni) мають окрему форму
// ПІСЛЯ прийменника (k němu, s ní), і квіз перевіряє саме її (utils/prepositionQuizEngine.ts).
export const COLS_NP = { a: "без прийм.", b: "після прийм." };
const COLS_ONE = { a: "форма", b: "—" };

// Форми 3-ї особи для квізу «Прикметники та займенники»: [без прийменника, після прийменника, наголошена] на відмінок. У реченнях
// квізу займенник стоїть після дієслова без наголосу («Vidím ho», «Věřím mu»), тож без прийменника потрібна
// ненаголошена форма (ho, mu), а не перша форма дублету картки (jeho / ho, jemu / mu). Кожна форма тут є і в таблиці
// картки нижче — це лише вибір однієї з дублету. masc_inan = masc_anim (не дублюємо); «—» — форми немає (місцевий
// без прийменника не вживається).
// Наголошена (третя, необов'язкова) — лише там, де вона відрізняється від ненаголошеної: jeho / jemu проти ho / mu
// (IJP, heslo «on»: «Dej to jemu, ne mně»; ho, jej, mu — «v příklonné pozici»). У ji, jí, jich, jim такої різниці немає.
type PersonalQuizPair = [string, string, string?];
export const PERSONAL_QUIZ_FORMS: {
  sg: Record<"masc_anim" | "fem" | "neut", Partial<Record<"genitiv" | "dativ" | "akuzativ" | "lokal" | "instrumental", PersonalQuizPair>>>;
  pl: Partial<Record<"genitiv" | "dativ" | "akuzativ" | "lokal" | "instrumental", PersonalQuizPair>>;
} = {
  sg: {
    masc_anim: { genitiv: ["ho", "něho", "jeho"], dativ: ["mu", "němu", "jemu"], akuzativ: ["ho", "něho", "jeho"], lokal: ["—", "něm"], instrumental: ["jím", "ním"] },
    fem: { genitiv: ["jí", "ní"], dativ: ["jí", "ní"], akuzativ: ["ji", "ni"], lokal: ["—", "ní"], instrumental: ["jí", "ní"] },
    neut: { genitiv: ["ho", "něho", "jeho"], dativ: ["mu", "němu", "jemu"], akuzativ: ["ho", "ně"], lokal: ["—", "něm"], instrumental: ["jím", "ním"] },
  },
  pl: { genitiv: ["jich", "nich"], dativ: ["jim", "nim"], akuzativ: ["je", "ně"], lokal: ["—", "nich"], instrumental: ["jimi", "nimi"] },
};

const d = (a: string, b: string) => ({ a, b });

// ── 1-ша особа однини ──
// Родовий і знахідний: нейтральне mě правильне в будь-якій позиції (і після прийменника: pro mě, ode mě), книжне
// mne — стилістичний варіант (Naše řeč 44, 1961, «K tvarům mně, mě — mi, mne» і стан. редакції: «tvar mne jako knižní»).
// Тому в довгій колонці спершу mě: квіз питає mě, mne лише приймає (ніколи не дистрактор).
const JA: PersonalDeclension = {
  nominativ: d("já", "—"),
  genitiv: d("mě", "mě / mne"),
  dativ: d("mi", "mně"),
  akuzativ: d("mě", "mě / mne"),
  vokativ: d("—", "—"),
  lokal: d("—", "mně"),
  instrumental: d("—", "mnou"),
};

// ── 2-га особа однини ──
const TY: PersonalDeclension = {
  nominativ: d("ty", "—"),
  genitiv: d("tě", "tebe"),
  dativ: d("ti", "tobě"),
  akuzativ: d("tě", "tebe"),
  vokativ: d("—", "—"),
  lokal: d("—", "tobě"),
  instrumental: d("—", "tebou"),
};

// ── Зворотний (немає називного) ──
const SE: PersonalDeclension = {
  nominativ: d("—", "—"),
  genitiv: d("—", "sebe"),
  dativ: d("si", "sobě"),
  akuzativ: d("se", "sebe"),
  vokativ: d("—", "—"),
  lokal: d("—", "sobě"),
  instrumental: d("—", "sebou"),
};

// ── 1-ша / 2-га особа множини (одна форма на відмінок → колонка b скрізь "—") ──
const MY: PersonalDeclension = {
  nominativ: d("my", "—"),
  genitiv: d("nás", "—"),
  dativ: d("nám", "—"),
  akuzativ: d("nás", "—"),
  vokativ: d("—", "—"),
  lokal: d("nás", "—"),
  instrumental: d("námi", "—"),
};

const VY: PersonalDeclension = {
  nominativ: d("vy", "—"),
  genitiv: d("vás", "—"),
  dativ: d("vám", "—"),
  akuzativ: d("vás", "—"),
  vokativ: d("—", "—"),
  lokal: d("vás", "—"),
  instrumental: d("vámi", "—"),
};

// ── 3-тя особа однини (за родом) ──
// Чоловічий (on) — істот. і неістот. форми однакові.
const ON_MASC: PersonalDeclension = {
  nominativ: d("on", "—"),
  genitiv: d("jeho / ho", "něho / něj"),
  dativ: d("jemu / mu", "němu"),
  akuzativ: d("jeho / ho / jej", "něho / něj"),
  vokativ: d("—", "—"),
  lokal: d("—", "něm"),
  instrumental: d("jím", "ním"),
};

// Середній (ono) — як on, крім знахідного (je / ho → ně / něj).
const ONO_NEUT: PersonalDeclension = {
  nominativ: d("ono", "—"),
  genitiv: d("jeho / ho", "něho / něj"),
  dativ: d("jemu / mu", "němu"),
  akuzativ: d("je / ho", "ně / něj"),
  vokativ: d("—", "—"),
  lokal: d("—", "něm"),
  instrumental: d("jím", "ním"),
};

// Жіночий (ona одн.) — увага на правопис: акузатив ji/ni (короткий i),
// решта jí/ní (довгий í).
const ONA_FEM: PersonalDeclension = {
  nominativ: d("ona", "—"),
  genitiv: d("jí", "ní"),
  dativ: d("jí", "ní"),
  akuzativ: d("ji", "ni"),
  vokativ: d("—", "—"),
  lokal: d("—", "ní"),
  instrumental: d("jí", "ní"),
};

// ── 3-тя особа множини (за родом різниться ЛИШЕ називний) ──
const PL_BODY = {
  genitiv: d("jich", "nich"),
  dativ: d("jim", "nim"),
  akuzativ: d("je", "ně"),
  vokativ: d("—", "—"),
  lokal: d("—", "nich"),
  instrumental: d("jimi", "nimi"),
};
const oniPl = (nom: string): PersonalDeclension => ({
  nominativ: d(nom, "—"),
  ...PL_BODY,
});

// Особа — для квізу «Прикметники та займенники»: 1 — підмет фрази «ти» («Bojíš se mě?»), 2 і 3 — «я» («Bojím se tě»),
// reflexive (se) — власні фрази (REFLEXIVE_FRAMES). Обов'язкова: без неї «já» потрапило б у фразу з підметом «я».
export type PersonalQuizPronoun = PersonalPronounEntry & { person: 1 | 2 | 3 | "reflexive" };

export const PERSONAL_PRONOUNS: PersonalQuizPronoun[] = [
  {
    id: "pp-ja",
    person: 1,
    uk: "я",
    cz: "já",
    patternLabel: "особовий займенник · нерегулярне відмінювання",
    columns: COLS_SL,
    gendered: false,
    declension: JA,
    exampleCz: "Znáš mě? Pojď se mnou.",
    exampleUk: "Знаєш мене? Ходімо зі мною.",
  },
  {
    id: "pp-ty",
    person: 2,
    uk: "ти",
    cz: "ty",
    patternLabel: "особовий займенник · нерегулярне відмінювання",
    columns: COLS_SL,
    gendered: false,
    declension: TY,
    exampleCz: "Vidím tě. Mám pro tebe dárek.",
    exampleUk: "Я тебе бачу. Маю для тебе подарунок.",
  },
  {
    id: "pp-on",
    person: 3,
    number: "sg",
    uk: "він / вона / воно",
    cz: "on / ona / ono",
    patternLabel: "особовий займенник · нерегулярне відмінювання",
    columns: COLS_NP,
    gendered: true,
    declension: {
      masc_anim: ON_MASC,
      masc_inan: ON_MASC,
      fem: ONA_FEM,
      neut: ONO_NEUT,
    } as Record<Gender, PersonalDeclension>,
    examples: {
      masc_anim: { cz: "Znám ho. Jdu k němu.", uk: "Я його знаю. Іду до нього." },
      masc_inan: { cz: "Vidím ho (ten dům) a jdu do něj.", uk: "Я його (той будинок) бачу й заходжу в нього." },
      fem: { cz: "Vidím ji. Mluvím s ní.", uk: "Я її бачу. Розмовляю з нею." },
      neut: { cz: "Vidím je (to auto) a jedu v něm.", uk: "Я його (те авто) бачу й їду в ньому." },
    },
  },
  {
    id: "pp-my",
    person: 1,
    uk: "ми",
    cz: "my",
    patternLabel: "особовий займенник · нерегулярне відмінювання",
    columns: COLS_ONE,
    gendered: false,
    declension: MY,
    exampleCz: "Počkej na nás. Pojď s námi.",
    exampleUk: "Зачекай на нас. Ходімо з нами.",
  },
  {
    id: "pp-vy",
    person: 2,
    uk: "ви",
    cz: "vy",
    patternLabel: "особовий займенник · нерегулярне відмінювання",
    columns: COLS_ONE,
    gendered: false,
    declension: VY,
    exampleCz: "Prosím vás, pojďte s námi.",
    exampleUk: "Прошу вас, ходімо з нами.",
  },
  {
    id: "pp-oni",
    person: 3,
    number: "pl",
    uk: "вони",
    cz: "oni / ony / ona",
    patternLabel: "особовий займенник · нерегулярне відмінювання",
    columns: COLS_NP,
    gendered: true,
    declension: {
      masc_anim: oniPl("oni"),
      masc_inan: oniPl("ony"),
      fem: oniPl("ony"),
      neut: oniPl("ona"),
    } as Record<Gender, PersonalDeclension>,
    examples: {
      masc_anim: { cz: "Znám je. Jdu k nim.", uk: "Я їх знаю. Іду до них." },
      masc_inan: { cz: "Vidím je a dívám se na ně.", uk: "Я їх бачу й дивлюся на них." },
      fem: { cz: "Vidím je a mluvím o nich.", uk: "Я їх бачу й говорю про них." },
      neut: { cz: "Vidím je a starám se o ně.", uk: "Я їх бачу й дбаю про них." },
    },
  },
  {
    id: "pp-se",
    person: "reflexive",
    uk: "себе (зворотний)",
    cz: "se / si",
    patternLabel: "особовий займенник · нерегулярне відмінювання",
    columns: COLS_SL,
    gendered: false,
    declension: SE,
    exampleCz: "Dívám se. Koupil jsem si to. Vezmi to s sebou.",
    exampleUk: "Я дивлюся. Я купив собі це. Візьми це з собою.",
  },
];
