import { PersonalPronounEntry, PersonalDeclension, Gender } from "../types";

// Особові займенники: já, ty, on/ona/ono, my, vy, oni/ony/ona, se.
// Парадигма нерегулярна — виверено за джерелами: czechonline.org (таблиця
// коротких форм + форм після прийменника), ucitel.net, ÚJČ/Wikipedie,
// santoska.cz (правопис ji/jí, mě/mně). Пара форм у клітинці:
//   • já / ty / se — короткий (приклонка) / довгий (наголош., після прийм.);
//   • on / ona / oni — без прийменника (j-) / після прийменника (n-).
// "—" = форма відсутня (напр. немає короткої, або клітинка невживана).
// Вокатив в особових відсутній → скрізь "—".

const COLS_SL = { a: "короткий", b: "довгий · після прийм." };
const COLS_NP = { a: "без прийм.", b: "після прийм." };
const COLS_ONE = { a: "форма", b: "—" };

const d = (a: string, b: string) => ({ a, b });

// ── 1-ша особа однини ──
const JA: PersonalDeclension = {
  nominativ: d("já", "—"),
  genitiv: d("mě", "mne"),
  dativ: d("mi", "mně"),
  akuzativ: d("mě", "mne"),
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

export const PERSONAL_PRONOUNS: PersonalPronounEntry[] = [
  {
    id: "pp-ja",
    uk: "я",
    cz: "já",
    columns: COLS_SL,
    gendered: false,
    declension: JA,
    exampleCz: "Znáš mě? Pojď se mnou.",
    exampleUk: "Знаєш мене? Ходімо зі мною.",
  },
  {
    id: "pp-ty",
    uk: "ти",
    cz: "ty",
    columns: COLS_SL,
    gendered: false,
    declension: TY,
    exampleCz: "Vidím tě. Mám pro tebe dárek.",
    exampleUk: "Я тебе бачу. Маю для тебе подарунок.",
  },
  {
    id: "pp-on",
    uk: "він / вона / воно",
    cz: "on / ona / ono",
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
    uk: "ми",
    cz: "my",
    columns: COLS_ONE,
    gendered: false,
    declension: MY,
    exampleCz: "Počkej na nás. Pojď s námi.",
    exampleUk: "Зачекай на нас. Ходімо з нами.",
  },
  {
    id: "pp-vy",
    uk: "ви",
    cz: "vy",
    columns: COLS_ONE,
    gendered: false,
    declension: VY,
    exampleCz: "Prosím vás, pojďte s námi.",
    exampleUk: "Прошу вас, ходімо з нами.",
  },
  {
    id: "pp-oni",
    uk: "вони",
    cz: "oni / ony / ona",
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
    uk: "себе (зворотний)",
    cz: "se / si",
    columns: COLS_SL,
    gendered: false,
    declension: SE,
    exampleCz: "Dívám se. Koupil jsem si to. Vezmi to s sebou.",
    exampleUk: "Я дивлюся. Я купив собі це. Візьми це з собою.",
  },
];
