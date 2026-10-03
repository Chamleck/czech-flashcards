import { PersonalPronounEntry, PronounEntry } from "../types";

// Неозначені, заперечні й означальні займенники — окрема група в розділі «Займенники».
// Форми звірено: en.wiktionary (таблиці відмінювання) + dl1.cuni.cz / ÚJČ (подвійне заперечення);
// nějaký/žádný/každý — повна парадигма за зразком mladý (множина чол. істот.: nějací, žádní, každí);
// všechen — власна парадигма (cs.wiktionary + en.wiktionary + dl1.cuni.cz/CJV MUNI, усі збігаються).
// Вокатива в займенників немає — "—".
//
// БЕЗ КВІЗУ: група лише для перегляду й карткового тренування. У квізи «Прикметники та займенники»
// ці слова не входять (рішення про квіз — окремий крок плану).
//
// Дві форми запису, як у питальних слів: někdo/nikdo/něco/nic — PersonalPronounEntry (без роду,
// одна колонка); nějaký/žádný/každý — PronounEntry (таби роду). Картку вибирає резолвер
// pronounEntries.ts за id.

const d = (a: string, b: string) => ({ a, b });
const COLS_ONE = { a: "форма", b: "—" };

export const INDEFINITE_CORE: PersonalPronounEntry[] = [
  {
    id: "nekdo-ind",
    uk: "хтось",
    cz: "někdo",
    patternLabel: "неозначений займенник · відмінюється як kdo",
    columns: COLS_ONE,
    gendered: false,
    declension: {
      nominativ: d("někdo", "—"),
      genitiv: d("někoho", "—"),
      dativ: d("někomu", "—"),
      akuzativ: d("někoho", "—"),
      vokativ: d("—", "—"),
      lokal: d("někom", "—"),
      instrumental: d("někým", "—"),
    },
    exampleCz: "Někdo klepe na dveře.",
    exampleUk: "Хтось стукає у двері.",
  },
  {
    id: "nikdo-ind",
    uk: "ніхто",
    cz: "nikdo",
    patternLabel: "заперечний займенник · відмінюється як kdo",
    columns: COLS_ONE,
    gendered: false,
    declension: {
      nominativ: d("nikdo", "—"),
      genitiv: d("nikoho", "—"),
      dativ: d("nikomu", "—"),
      akuzativ: d("nikoho", "—"),
      vokativ: d("—", "—"),
      lokal: d("nikom", "—"),
      instrumental: d("nikým", "—"),
    },
    exampleCz: "Nikdo nepřišel.",
    exampleUk: "Ніхто не прийшов.",
  },
  {
    id: "neco-ind",
    uk: "щось",
    cz: "něco",
    patternLabel: "неозначений займенник · відмінюється як co",
    columns: COLS_ONE,
    gendered: false,
    declension: {
      nominativ: d("něco", "—"),
      genitiv: d("něčeho", "—"),
      dativ: d("něčemu", "—"),
      akuzativ: d("něco", "—"),
      vokativ: d("—", "—"),
      lokal: d("něčem", "—"),
      instrumental: d("něčím", "—"),
    },
    exampleCz: "Něco jsem zapomněl.",
    exampleUk: "Я щось забув.",
  },
  {
    id: "nic-ind",
    uk: "ніщо (нічого)",
    cz: "nic",
    patternLabel: "заперечний займенник · відмінюється як co",
    columns: COLS_ONE,
    gendered: false,
    declension: {
      nominativ: d("nic", "—"),
      genitiv: d("ničeho", "—"),
      dativ: d("ničemu", "—"),
      akuzativ: d("nic", "—"),
      vokativ: d("—", "—"),
      lokal: d("ničem", "—"),
      instrumental: d("ničím", "—"),
    },
    exampleCz: "Nic nevidím.",
    exampleUk: "Я нічого не бачу.",
  },
];

export const INDEFINITE_ADJ: PronounEntry[] = [
  {
    id: "nejaky-ind",
    uk: "якийсь",
    cz: "nějaký",
    subtype: "indefinite",
    declinable: true,
    vzorLabel: "як mladý",
    declension: {
      masc_anim: {
        nominativ: { sg: "nějaký", pl: "nějací" },
        genitiv: { sg: "nějakého", pl: "nějakých" },
        dativ: { sg: "nějakému", pl: "nějakým" },
        akuzativ: { sg: "nějakého", pl: "nějaké" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "nějakém", pl: "nějakých" },
        instrumental: { sg: "nějakým", pl: "nějakými" },
      },
      masc_inan: {
        nominativ: { sg: "nějaký", pl: "nějaké" },
        genitiv: { sg: "nějakého", pl: "nějakých" },
        dativ: { sg: "nějakému", pl: "nějakým" },
        akuzativ: { sg: "nějaký", pl: "nějaké" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "nějakém", pl: "nějakých" },
        instrumental: { sg: "nějakým", pl: "nějakými" },
      },
      fem: {
        nominativ: { sg: "nějaká", pl: "nějaké" },
        genitiv: { sg: "nějaké", pl: "nějakých" },
        dativ: { sg: "nějaké", pl: "nějakým" },
        akuzativ: { sg: "nějakou", pl: "nějaké" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "nějaké", pl: "nějakých" },
        instrumental: { sg: "nějakou", pl: "nějakými" },
      },
      neut: {
        nominativ: { sg: "nějaké", pl: "nějaká" },
        genitiv: { sg: "nějakého", pl: "nějakých" },
        dativ: { sg: "nějakému", pl: "nějakým" },
        akuzativ: { sg: "nějaké", pl: "nějaká" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "nějakém", pl: "nějakých" },
        instrumental: { sg: "nějakým", pl: "nějakými" },
      },
    },
    examples: {
      masc_anim: { cz: "Přišel nějaký muž.", uk: "Прийшов якийсь чоловік." },
      masc_inan: { cz: "Mám nějaký problém.", uk: "У мене якась проблема." },
      fem: { cz: "Ozvala se nějaká žena.", uk: "Озвалася якась жінка." },
      neut: { cz: "Je tu nějaké auto.", uk: "Тут є якесь авто." },
    },
  },
  {
    id: "zadny-ind",
    uk: "жодний",
    cz: "žádný",
    subtype: "indefinite",
    declinable: true,
    vzorLabel: "як mladý",
    declension: {
      masc_anim: {
        nominativ: { sg: "žádný", pl: "žádní" },
        genitiv: { sg: "žádného", pl: "žádných" },
        dativ: { sg: "žádnému", pl: "žádným" },
        akuzativ: { sg: "žádného", pl: "žádné" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "žádném", pl: "žádných" },
        instrumental: { sg: "žádným", pl: "žádnými" },
      },
      masc_inan: {
        nominativ: { sg: "žádný", pl: "žádné" },
        genitiv: { sg: "žádného", pl: "žádných" },
        dativ: { sg: "žádnému", pl: "žádným" },
        akuzativ: { sg: "žádný", pl: "žádné" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "žádném", pl: "žádných" },
        instrumental: { sg: "žádným", pl: "žádnými" },
      },
      fem: {
        nominativ: { sg: "žádná", pl: "žádné" },
        genitiv: { sg: "žádné", pl: "žádných" },
        dativ: { sg: "žádné", pl: "žádným" },
        akuzativ: { sg: "žádnou", pl: "žádné" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "žádné", pl: "žádných" },
        instrumental: { sg: "žádnou", pl: "žádnými" },
      },
      neut: {
        nominativ: { sg: "žádné", pl: "žádná" },
        genitiv: { sg: "žádného", pl: "žádných" },
        dativ: { sg: "žádnému", pl: "žádným" },
        akuzativ: { sg: "žádné", pl: "žádná" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "žádném", pl: "žádných" },
        instrumental: { sg: "žádným", pl: "žádnými" },
      },
    },
    examples: {
      masc_anim: { cz: "Žádný student nepřišel.", uk: "Жоден студент не прийшов." },
      masc_inan: { cz: "Nemám žádný problém.", uk: "У мене немає жодної проблеми." },
      fem: { cz: "Žádná žena tam nebyla.", uk: "Жодної жінки там не було." },
      neut: { cz: "Nemám žádné auto.", uk: "У мене немає жодного авто." },
    },
  },
  {
    id: "kazdy-ind",
    uk: "кожний",
    cz: "každý",
    subtype: "indefinite",
    declinable: true,
    vzorLabel: "як mladý",
    declension: {
      masc_anim: {
        nominativ: { sg: "každý", pl: "každí" },
        genitiv: { sg: "každého", pl: "každých" },
        dativ: { sg: "každému", pl: "každým" },
        akuzativ: { sg: "každého", pl: "každé" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "každém", pl: "každých" },
        instrumental: { sg: "každým", pl: "každými" },
      },
      masc_inan: {
        nominativ: { sg: "každý", pl: "každé" },
        genitiv: { sg: "každého", pl: "každých" },
        dativ: { sg: "každému", pl: "každým" },
        akuzativ: { sg: "každý", pl: "každé" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "každém", pl: "každých" },
        instrumental: { sg: "každým", pl: "každými" },
      },
      fem: {
        nominativ: { sg: "každá", pl: "každé" },
        genitiv: { sg: "každé", pl: "každých" },
        dativ: { sg: "každé", pl: "každým" },
        akuzativ: { sg: "každou", pl: "každé" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "každé", pl: "každých" },
        instrumental: { sg: "každou", pl: "každými" },
      },
      neut: {
        nominativ: { sg: "každé", pl: "každá" },
        genitiv: { sg: "každého", pl: "každých" },
        dativ: { sg: "každému", pl: "každým" },
        akuzativ: { sg: "každé", pl: "každá" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "každém", pl: "každých" },
        instrumental: { sg: "každým", pl: "každými" },
      },
    },
    examples: {
      masc_anim: { cz: "Každý student má knihu.", uk: "Кожен студент має книгу." },
      masc_inan: { cz: "Každý den cvičím.", uk: "Кожен день я займаюся." },
      fem: { cz: "Každá žena to ví.", uk: "Кожна жінка це знає." },
      neut: { cz: "Každé auto je jiné.", uk: "Кожне авто інше." },
    },
  },
  {
    id: "vsechen-ind",
    uk: "весь",
    cz: "všechen",
    subtype: "indefinite",
    declinable: true,
    vzorLabel: "власний зразок (м'який -e-: všeho, všemu)",
    declension: {
      masc_anim: {
        nominativ: { sg: "všechen", pl: "všichni" },
        genitiv: { sg: "všeho", pl: "všech" },
        dativ: { sg: "všemu", pl: "všem" },
        akuzativ: { sg: "všeho", pl: "všechny" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "všem", pl: "všech" },
        instrumental: { sg: "vším", pl: "všemi" },
      },
      masc_inan: {
        nominativ: { sg: "všechen", pl: "všechny" },
        genitiv: { sg: "všeho", pl: "všech" },
        dativ: { sg: "všemu", pl: "všem" },
        akuzativ: { sg: "všechen", pl: "všechny" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "všem", pl: "všech" },
        instrumental: { sg: "vším", pl: "všemi" },
      },
      fem: {
        nominativ: { sg: "všechna", pl: "všechny" },
        genitiv: { sg: "vší", pl: "všech" },
        dativ: { sg: "vší", pl: "všem" },
        akuzativ: { sg: "všechnu", pl: "všechny" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "vší", pl: "všech" },
        instrumental: { sg: "vší", pl: "všemi" },
      },
      neut: {
        nominativ: { sg: "všechno", pl: "všechna" },
        genitiv: { sg: "všeho", pl: "všech" },
        dativ: { sg: "všemu", pl: "všem" },
        akuzativ: { sg: "všechno", pl: "všechna" },
        vokativ: { sg: "—", pl: "—" },
        lokal: { sg: "všem", pl: "všech" },
        instrumental: { sg: "vším", pl: "všemi" },
      },
    },
    examples: {
      masc_anim: { cz: "Všichni lidé to vědí.", uk: "Усі люди це знають." },
      masc_inan: { cz: "Snědl jsem všechen chléb.", uk: "Я з'їв увесь хліб." },
      fem: { cz: "Vypil jsem všechnu vodu.", uk: "Я випив усю воду." },
      neut: { cz: "Všechno je v pořádku.", uk: "Усе гаразд." },
    },
  },
];

export const INDEFINITE_ALL: (PersonalPronounEntry | PronounEntry)[] = [...INDEFINITE_CORE, ...INDEFINITE_ADJ];

// Підпис підтипу в екрані вибору слів.
export const INDEFINITE_TAG: Record<string, string> = {
  "nekdo-ind": "неозначений",
  "neco-ind": "неозначений",
  "nejaky-ind": "неозначений",
  "nikdo-ind": "заперечний",
  "nic-ind": "заперечний",
  "zadny-ind": "заперечний",
  "kazdy-ind": "означальний",
  "vsechen-ind": "означальний",
};
