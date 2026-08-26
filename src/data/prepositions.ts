import { PrepositionEntry } from "../types";

// ─────────────────────────── ПРИЙМЕННИКИ (фіксований відмінок) ───────────────────────────
// Прийменники, що керують ЗАВЖДИ одним відмінком (на відміну від дуальних
// na/v/o/po/pod/nad/před/za/mezi — ті в окремій наступній фазі).
//
// Джерело таблиці «прийменник → відмінок»: czechstepbystep.cz (plakát prepozice-pády),
// підтверджено cs.wikipedia (České skloňování) та cesky-jazyk.cz. Приклади звірені
// на природність; переклади українською — лише прийменника як такого + цілої фрази.
//
// Вокалізація (k→ke, s→se, z→ze, v→ve): додаємо ТІЛЬКИ де правило безвиняткове —
// перед збігом того самого/парного приголосного. Багатобуквені (bez, od, kromě…)
// не вокалізуємо (нестабільні за джерелами). v/ve тут не буде — v дуальний, у наст. фазі.

export const PREPOSITIONS: PrepositionEntry[] = [
  // ─────────── Родовий (2. pád) ───────────
  {
    id: "prep-bez",
    cz: "bez",
    uk: "без",
    govCase: "genitiv",
    type: "fixed",
    examples: [
      { cz: "Káva bez cukru.", uk: "Кава без цукру." },
      { cz: "Přišel bez peněz.", uk: "Він прийшов без грошей." },
    ],
  },
  {
    id: "prep-do",
    cz: "do",
    uk: "до (всередину / до якогось часу)",
    govCase: "genitiv",
    type: "fixed",
    examples: [
      { cz: "Jdu do školy.", uk: "Я йду до школи." },
      { cz: "Počkám do večera.", uk: "Почекаю до вечора." },
    ],
  },
  {
    id: "prep-od",
    cz: "od",
    uk: "від",
    govCase: "genitiv",
    type: "fixed",
    vocalized: "ode",
    vocalNote: "ode — перед збігом приголосних: ode mě, ode dveří.",
    examples: [
      { cz: "Dostal jsem dopis od kamaráda.", uk: "Я отримав лист від друга." },
      { cz: "Bydlím kousek od centra.", uk: "Я живу неподалік від центру." },
    ],
  },
  {
    id: "prep-z",
    cz: "z",
    uk: "з (звідкись)",
    govCase: "genitiv",
    type: "fixed",
    vocalized: "ze",
    vocalNote: "ze — перед s/z/š/ž та збігом приголосних: ze školy, ze zahrady.",
    examples: [
      { cz: "Vracím se z práce.", uk: "Я повертаюся з роботи." },
      { cz: "Vyndal knihu z tašky.", uk: "Він дістав книгу з сумки." },
    ],
  },
  {
    id: "prep-u",
    cz: "u",
    uk: "біля / у (когось)",
    govCase: "genitiv",
    type: "fixed",
    examples: [
      { cz: "Bydlím u nádraží.", uk: "Я живу біля вокзалу." },
      { cz: "Byli jsme u babičky.", uk: "Ми були у бабусі." },
    ],
  },
  {
    id: "prep-vedle",
    cz: "vedle",
    uk: "поряд із / біля",
    govCase: "genitiv",
    type: "fixed",
    examples: [
      { cz: "Stůl stojí vedle okna.", uk: "Стіл стоїть біля вікна." },
      { cz: "Seděla vedle mě.", uk: "Вона сиділа поряд зі мною." },
    ],
  },
  {
    id: "prep-kolem",
    cz: "kolem",
    uk: "навколо / повз",
    govCase: "genitiv",
    type: "fixed",
    examples: [
      { cz: "Prošli jsme kolem kostela.", uk: "Ми пройшли повз церкву." },
      { cz: "Kolem domu je zahrada.", uk: "Навколо будинку сад." },
    ],
  },
  {
    id: "prep-kromě",
    cz: "kromě",
    uk: "крім",
    govCase: "genitiv",
    type: "fixed",
    examples: [
      { cz: "Přišli všichni kromě Petra.", uk: "Прийшли всі, крім Петра." },
      { cz: "Kromě práce nic nedělá.", uk: "Крім роботи, він нічого не робить." },
    ],
  },
  {
    id: "prep-misto",
    cz: "místo",
    uk: "замість",
    govCase: "genitiv",
    type: "fixed",
    examples: [
      { cz: "Půjdu tam místo tebe.", uk: "Я піду туди замість тебе." },
      { cz: "Dej si čaj místo kávy.", uk: "Візьми чай замість кави." },
    ],
  },
  {
    id: "prep-podle",
    cz: "podle",
    uk: "згідно з / за (думкою)",
    govCase: "genitiv",
    type: "fixed",
    examples: [
      { cz: "Podle mého názoru to stačí.", uk: "На мою думку, цього досить." },
      { cz: "Udělal to podle návodu.", uk: "Він зробив це за інструкцією." },
    ],
  },

  // ─────────── Давальний (3. pád) ───────────
  {
    id: "prep-k",
    cz: "k",
    uk: "до (у напрямку) / к",
    govCase: "dativ",
    type: "fixed",
    vocalized: "ke",
    vocalNote: "ke — перед k/g та збігом приголосних: ke kamarádovi, ke stolu.",
    examples: [
      { cz: "Jdu k lékaři.", uk: "Я йду до лікаря." },
      { cz: "Přisedl si ke mně.", uk: "Він підсів до мене." },
    ],
  },
  {
    id: "prep-kvuli",
    cz: "kvůli",
    uk: "через (причина) / заради",
    govCase: "dativ",
    type: "fixed",
    examples: [
      { cz: "Nepřišel kvůli nemoci.", uk: "Він не прийшов через хворобу." },
      { cz: "Udělal to kvůli tobě.", uk: "Він зробив це заради тебе." },
    ],
  },
  {
    id: "prep-diky",
    cz: "díky",
    uk: "завдяки",
    govCase: "dativ",
    type: "fixed",
    examples: [
      { cz: "Díky tobě jsem to zvládl.", uk: "Завдяки тобі я впорався." },
      { cz: "Uspěl díky píli.", uk: "Він досяг успіху завдяки старанності." },
    ],
  },
  {
    id: "prep-proti",
    cz: "proti",
    uk: "проти / навпроти",
    govCase: "dativ",
    type: "fixed",
    examples: [
      { cz: "Jsem proti tomu návrhu.", uk: "Я проти цієї пропозиції." },
      { cz: "Seděl proti mně.", uk: "Він сидів навпроти мене." },
    ],
  },

  // ─────────── Знахідний (4. pád) ───────────
  {
    id: "prep-pro",
    cz: "pro",
    uk: "для / за (кимось піти)",
    govCase: "akuzativ",
    type: "fixed",
    examples: [
      { cz: "Koupil jsem to pro tebe.", uk: "Я купив це для тебе." },
      { cz: "Přišel pro syna.", uk: "Він прийшов за сином." },
    ],
  },
  {
    id: "prep-pres",
    cz: "přes",
    uk: "через (поперек) / понад",
    govCase: "akuzativ",
    type: "fixed",
    examples: [
      { cz: "Přešli jsme přes most.", uk: "Ми перейшли через міст." },
      { cz: "Přišlo přes sto lidí.", uk: "Прийшло понад сто людей." },
    ],
  },
  {
    id: "prep-skrz",
    cz: "skrz",
    uk: "крізь / наскрізь",
    govCase: "akuzativ",
    type: "fixed",
    examples: [
      { cz: "Prošel skrz dav.", uk: "Він пройшов крізь натовп." },
      { cz: "Světlo prochází skrz sklo.", uk: "Світло проходить крізь скло." },
    ],
  },
  {
    id: "prep-mimo",
    cz: "mimo",
    uk: "поза / окрім",
    govCase: "akuzativ",
    type: "fixed",
    examples: [
      { cz: "Bydlí mimo město.", uk: "Він живе поза містом." },
      { cz: "Je to mimo provoz.", uk: "Це поза роботою (не працює)." },
    ],
  },

  // ─────────── Місцевий (6. pád) ───────────
  {
    id: "prep-pri",
    cz: "při",
    uk: "при / під час",
    govCase: "lokal",
    type: "fixed",
    examples: [
      { cz: "Buď opatrný při práci.", uk: "Будь обережний при роботі." },
      { cz: "Při obědě si povídali.", uk: "Під час обіду вони розмовляли." },
    ],
  },

  // ─────────── Орудний (7. pád) ───────────
  {
    id: "prep-s",
    cz: "s",
    uk: "з (разом із)",
    govCase: "instrumental",
    type: "fixed",
    vocalized: "se",
    vocalNote: "se — перед s/z/š/ž та збігом приголосних: se sestrou, se mnou.",
    examples: [
      { cz: "Jdu do kina s kamarádem.", uk: "Я йду в кіно з другом." },
      { cz: "Mluvil se mnou.", uk: "Він розмовляв зі мною." },
    ],
  },
];
