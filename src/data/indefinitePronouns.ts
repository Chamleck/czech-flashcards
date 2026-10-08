import { PersonalPronounEntry, PronounEntry, duo } from "../types";

// Неозначені, заперечні й означальні займенники — окрема група в розділі «Займенники».
// Форми звірено: en.wiktionary (таблиці відмінювання) + dl1.cuni.cz / ÚJČ (подвійне заперечення);
// nějaký/žádný/každý — повна парадигма за зразком mladý (множина чол. істот.: nějací, žádní, každí);
// všechen — власна парадигма (cs.wiktionary + en.wiktionary + dl1.cuni.cz/CJV MUNI, усі збігаються).
// Вокатива в займенників немає — "—".
//
// КВІЗ «Прикметники та займенники»: nějaký/žádný/každý/všechen — через фрейми з іменною групою (data/declensionFrames.ts):
// nějaký — лише у фразах, де «якийсь» природний (some), žádný — у фразах із запереченням (neg), každý і všechen — у
// фразах-узагальненнях (every: «Každý student to ví», «Cvičím každý den», «Koupil jsem všechen chléb»);
// їхні лексичні обмеження — у полі quiz (звірено: žádný — лише із запереченим дієсловом, подвійне заперечення;
// každý — однина, множина лише з числівником «každé dva dny» (elon.io, «Each and every: každý»); všechen в однині —
// лише з незлічуваними «všechen chléb, všechna voda», злічувані — у множині, «celý den» (SSJČ: «zprav. jen v mn. č.»;
// elon.io, «All and whole»). někdo/nikdo/něco/nic — власні речення у quizFrames (як kdo/co).
//
// Дві форми запису, як у питальних слів: někdo/nikdo/něco/nic — PersonalPronounEntry (без роду,
// одна колонка); nějaký/žádný/každý — PronounEntry (таби роду). Картку вибирає резолвер
// pronounEntries.ts за id.
//
// ПРАВИЛА для квізу «Прикметники та займенники» — у шапці data/pronouns.ts (поле quiz) і в коментарі до quizFrames
// (types/index.ts): слова з родом беруть фрази з data/declensionFrames.ts, слова без роду — власні речення quizFrames.
// Перед здачею — оракул scripts/check-quiz-coverage.ts --only=decl: «Помилок: 0».

const COLS_ONE = { a: "форма", b: "—" };

export const INDEFINITE_CORE: PersonalPronounEntry[] = [
  {
    id: "nekdo-ind",
    uk: "хтось",
    cz: "někdo",
    patternLabel: "неозначений займенник · відмінюється як kdo",
    quizFrames: {
      genitiv: ["Bojíš se ___?", "Ptal ses ___?"],
      dativ: ["Věříš ___?", "Zavolal jsi ___?"],
      akuzativ: ["Hledáš ___?", "Vidíš tam ___?"],
      lokal: ["Mluvili jste o ___?", "Přemýšlíš o ___?"],
      instrumental: ["Mluvil jsi s ___?", "Jdeš tam s ___?"],
    },
    columns: COLS_ONE,
    gendered: false,
    declension: {
      nominativ: duo("někdo", "—"),
      genitiv: duo("někoho", "—"),
      dativ: duo("někomu", "—"),
      akuzativ: duo("někoho", "—"),
      vokativ: duo("—", "—"),
      lokal: duo("někom", "—"),
      instrumental: duo("někým", "—"),
    },
    exampleCz: "Někdo klepe na dveře.",
    exampleUk: "Хтось стукає у двері.",
  },
  {
    id: "nikdo-ind",
    uk: "ніхто",
    cz: "nikdo",
    patternLabel: "заперечний займенник · відмінюється як kdo",
    quizFrames: {
      // nikdo — лише із запереченим дієсловом (подвійне заперечення)
      genitiv: ["Nebojím se ___.", "Neptal jsem se ___."],
      dativ: ["Nevěřím ___.", "Nezavolal jsem ___."],
      akuzativ: ["Nevidím ___.", "Nehledám ___."],
      lokal: ["Nemluvili jsme o ___.", "Nepřemýšlím o ___."],
      instrumental: ["Nemluvil jsem s ___.", "Nejdu tam s ___."],
    },
    columns: COLS_ONE,
    gendered: false,
    declension: {
      nominativ: duo("nikdo", "—"),
      genitiv: duo("nikoho", "—"),
      dativ: duo("nikomu", "—"),
      akuzativ: duo("nikoho", "—"),
      vokativ: duo("—", "—"),
      lokal: duo("nikom", "—"),
      instrumental: duo("nikým", "—"),
    },
    exampleCz: "Nikdo nepřišel.",
    exampleUk: "Ніхто не прийшов.",
  },
  {
    id: "neco-ind",
    uk: "щось",
    cz: "něco",
    patternLabel: "неозначений займенник · відмінюється як co",
    quizFrames: {
      genitiv: ["Bojíš se ___?", "Napiješ se ___?"],
      dativ: ["Věříš ___?", "Rozumíš ___?"],
      akuzativ: ["Hledáš ___?", "Chceš ___?"],
      lokal: ["Mluvili jste o ___?", "Přemýšlíš o ___?"],
      instrumental: ["Píšeš ___?", "Můžu ti pomoct s ___?"],
    },
    columns: COLS_ONE,
    gendered: false,
    declension: {
      nominativ: duo("něco", "—"),
      genitiv: duo("něčeho", "—"),
      dativ: duo("něčemu", "—"),
      akuzativ: duo("něco", "—"),
      vokativ: duo("—", "—"),
      lokal: duo("něčem", "—"),
      instrumental: duo("něčím", "—"),
    },
    exampleCz: "Něco jsem zapomněl.",
    exampleUk: "Я щось забув.",
  },
  {
    id: "nic-ind",
    uk: "ніщо (нічого)",
    cz: "nic",
    patternLabel: "заперечний займенник · відмінюється як co",
    quizFrames: {
      // nic — лише із запереченим дієсловом (подвійне заперечення)
      genitiv: ["Nebojím se ___.", "Nenapiju se ___."],
      dativ: ["Nevěřím ___.", "Nerozumím ___."],
      akuzativ: ["Nehledám ___.", "Nechci ___."],
      lokal: ["Nemluvili jsme o ___.", "Nepřemýšlím o ___."],
      instrumental: ["Nemůžu ti pomoct s ___.", "Nejsem spokojený s ___."],
    },
    columns: COLS_ONE,
    gendered: false,
    declension: {
      nominativ: duo("nic", "—"),
      genitiv: duo("ničeho", "—"),
      dativ: duo("ničemu", "—"),
      akuzativ: duo("nic", "—"),
      vokativ: duo("—", "—"),
      lokal: duo("ničem", "—"),
      instrumental: duo("ničím", "—"),
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
    quiz: { role: "some", fits: { none: ["air"] } }, // не «Tady je nějaký vzduch»
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
    quiz: { role: "neg", partner: false },
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
    quiz: { role: "every", num: "sg", fits: { countable: true, none: ["food", "weather", "abstract"] } },
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
    quiz: { role: "every", massSg: true },
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
