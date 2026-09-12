import { PronounEntry, PersonalPronounEntry, PersonalDeclension } from "../types";

// Питальні займенники (zájmena tázací) — закрите множина з 5 слів за
// czechency.org: kdo, co, jaký, který, čí (+ конструкція "co za", не карткою).
// jaký/který — тверде прикметникове відмінювання (зразок mladý), čí — м'яке
// (зразок jarní). kdo/co — власна нерегулярна парадигма (без роду, без
// множини — "bezrodá"), школярський стандарт пядежів: kdo→koho/komu/koho/—/
// kom/kým, co→čeho/čemu/co/—/čem/čím (5. відмінок не використовується).
// Джерело: czechency.org "TÁZACÍ ZÁJMENO", ucirna.cz "Skloňování zájmen".
//
// jaký/který/čí згенеровано програмно (Python, restem) з уже звірених
// velký (jaký, чергування k→c: jaký→jací), starý (který, чергування r→ř:
// který→kteří) і її (čí, без чергування) — вокатив виправлено на "—"
// (займенники, на відміну від прикметників, не мають вокатива).

export const INTERROGATIVE_ADJ: PronounEntry[] = [
  {
    id: "jaky-int",
    uk: "який",
    cz: "jaký",
    subtype: "interrogative",
    declinable: true,
    vzorLabel: "як mladý",
    declension: {
      masc_anim: {
        nominativ: { sg: "jaký", pl: "jací" },
        genitiv: { sg: "jakého", pl: "jakých" },
        dativ: { sg: "jakému", pl: "jakým" },
        akuzativ: { sg: "jakého", pl: "jaké" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "jakém", pl: "jakých" },
        instrumental: { sg: "jakým", pl: "jakými" },
      },
      masc_inan: {
        nominativ: { sg: "jaký", pl: "jaké" },
        genitiv: { sg: "jakého", pl: "jakých" },
        dativ: { sg: "jakému", pl: "jakým" },
        akuzativ: { sg: "jaký", pl: "jaké" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "jakém", pl: "jakých" },
        instrumental: { sg: "jakým", pl: "jakými" },
      },
      fem: {
        nominativ: { sg: "jaká", pl: "jaké" },
        genitiv: { sg: "jaké", pl: "jakých" },
        dativ: { sg: "jaké", pl: "jakým" },
        akuzativ: { sg: "jakou", pl: "jaké" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "jaké", pl: "jakých" },
        instrumental: { sg: "jakou", pl: "jakými" },
      },
      neut: {
        nominativ: { sg: "jaké", pl: "jaká" },
        genitiv: { sg: "jakého", pl: "jakých" },
        dativ: { sg: "jakému", pl: "jakým" },
        akuzativ: { sg: "jaké", pl: "jaká" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "jakém", pl: "jakých" },
        instrumental: { sg: "jakým", pl: "jakými" },
      },    },
    examples: {
      masc_anim: { cz: "Jaký je ten muž?", uk: "Який той чоловік?" },
      masc_inan: { cz: "Jaký je ten dům?", uk: "Який той дім?" },
      fem: { cz: "Jaká je ta žena?", uk: "Яка та жінка?" },
      neut: { cz: "Jaké je to auto?", uk: "Яке те авто?" },
    },
  },
  {
    id: "ktery-int",
    uk: "котрий",
    cz: "který",
    subtype: "interrogative",
    declinable: true,
    vzorLabel: "як mladý",
    declension: {
      masc_anim: {
        nominativ: { sg: "který", pl: "kteří" },
        genitiv: { sg: "kterého", pl: "kterých" },
        dativ: { sg: "kterému", pl: "kterým" },
        akuzativ: { sg: "kterého", pl: "které" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "kterém", pl: "kterých" },
        instrumental: { sg: "kterým", pl: "kterými" },
      },
      masc_inan: {
        nominativ: { sg: "který", pl: "které" },
        genitiv: { sg: "kterého", pl: "kterých" },
        dativ: { sg: "kterému", pl: "kterým" },
        akuzativ: { sg: "který", pl: "které" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "kterém", pl: "kterých" },
        instrumental: { sg: "kterým", pl: "kterými" },
      },
      fem: {
        nominativ: { sg: "která", pl: "které" },
        genitiv: { sg: "které", pl: "kterých" },
        dativ: { sg: "které", pl: "kterým" },
        akuzativ: { sg: "kterou", pl: "které" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "které", pl: "kterých" },
        instrumental: { sg: "kterou", pl: "kterými" },
      },
      neut: {
        nominativ: { sg: "které", pl: "která" },
        genitiv: { sg: "kterého", pl: "kterých" },
        dativ: { sg: "kterému", pl: "kterým" },
        akuzativ: { sg: "které", pl: "která" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "kterém", pl: "kterých" },
        instrumental: { sg: "kterým", pl: "kterými" },
      },    },
    examples: {
      masc_anim: { cz: "Který muž je tvůj bratr?", uk: "Котрий чоловік твій брат?" },
      masc_inan: { cz: "Který dům je nový?", uk: "Котрий дім новий?" },
      fem: { cz: "Která žena to řekla?", uk: "Котра жінка це сказала?" },
      neut: { cz: "Které auto je tvoje?", uk: "Котре авто твоє?" },
    },
  },
  {
    id: "ci-int",
    uk: "чий",
    cz: "čí",
    subtype: "interrogative",
    declinable: true,
    vzorLabel: "як jarní",
    declension: {
      masc_anim: {
        nominativ: { sg: "čí", pl: "čí" },
        genitiv: { sg: "čího", pl: "čích" },
        dativ: { sg: "čímu", pl: "čím" },
        akuzativ: { sg: "čího", pl: "čí" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "čím", pl: "čích" },
        instrumental: { sg: "čím", pl: "čími" },
      },
      masc_inan: {
        nominativ: { sg: "čí", pl: "čí" },
        genitiv: { sg: "čího", pl: "čích" },
        dativ: { sg: "čímu", pl: "čím" },
        akuzativ: { sg: "čí", pl: "čí" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "čím", pl: "čích" },
        instrumental: { sg: "čím", pl: "čími" },
      },
      fem: {
        nominativ: { sg: "čí", pl: "čí" },
        genitiv: { sg: "čí", pl: "čích" },
        dativ: { sg: "čí", pl: "čím" },
        akuzativ: { sg: "čí", pl: "čí" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "čí", pl: "čích" },
        instrumental: { sg: "čí", pl: "čími" },
      },
      neut: {
        nominativ: { sg: "čí", pl: "čí" },
        genitiv: { sg: "čího", pl: "čích" },
        dativ: { sg: "čímu", pl: "čím" },
        akuzativ: { sg: "čí", pl: "čí" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "čím", pl: "čích" },
        instrumental: { sg: "čím", pl: "čími" },
      },    },
    examples: {
      masc_anim: { cz: "Čí je to bratr?", uk: "Чий це брат?" },
      masc_inan: { cz: "Čí je to dům?", uk: "Чий це дім?" },
      fem: { cz: "Čí je to sestra?", uk: "Чия це сестра?" },
      neut: { cz: "Čí je to auto?", uk: "Чиє це авто?" },
    },
  },
];

// kdo/co: без роду, одна форма на відмінок — переюзаємо PersonalDeclension
// (пара {a,b}, b завжди "—") і PersonalPronounCard, той самий патерн, що вже
// є для my/vy (columns.b === "—" → одна колонка в таблиці).
const d = (a: string, b: string) => ({ a, b });
const COLS_ONE = { a: "форма", b: "—" };

const KDO: PersonalDeclension = {
  nominativ: d("kdo", "—"),
  genitiv: d("koho", "—"),
  dativ: d("komu", "—"),
  akuzativ: d("koho", "—"),
  vokativ: d("—", "—"),
  lokal: d("kom", "—"),
  instrumental: d("kým", "—"),
};

const CO: PersonalDeclension = {
  nominativ: d("co", "—"),
  genitiv: d("čeho", "—"),
  dativ: d("čemu", "—"),
  akuzativ: d("co", "—"),
  vokativ: d("—", "—"),
  lokal: d("čem", "—"),
  instrumental: d("čím", "—"),
};

export const INTERROGATIVE_CORE: PersonalPronounEntry[] = [
  {
    id: "kdo-int",
    uk: "хто",
    cz: "kdo",
    columns: COLS_ONE,
    gendered: false,
    declension: KDO,
    exampleCz: "Kdo to je?",
    exampleUk: "Хто це?",
  },
  {
    id: "co-int",
    uk: "що",
    cz: "co",
    columns: COLS_ONE,
    gendered: false,
    declension: CO,
    exampleCz: "Co to je?",
    exampleUk: "Що це?",
  },
];

export const INTERROGATIVE_ALL: (PronounEntry | PersonalPronounEntry)[] = [
  ...INTERROGATIVE_ADJ,
  ...INTERROGATIVE_CORE,
];
