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
//
// По 4 приклади на прийменник — покривають побутові ситуації (дім, транспорт,
// робота, покупки, родина), не лише "підручникові" конструкції.

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
      { cz: "Nemůžu žít bez telefonu.", uk: "Я не можу жити без телефону." },
      { cz: "Odešla bez slova.", uk: "Вона пішла без жодного слова." },
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
      { cz: "Zajdu do obchodu.", uk: "Я зайду в магазин." },
      { cz: "Vlak jede do Prahy.", uk: "Потяг їде до Праги." },
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
      { cz: "Je to daleko od domova.", uk: "Це далеко від дому." },
      { cz: "Vzal jsem si volno od práce.", uk: "Я взяв відгул від роботи." },
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
      { cz: "Je z Ukrajiny.", uk: "Він з України." },
      { cz: "Vystoupil z autobusu.", uk: "Він вийшов з автобуса." },
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
      { cz: "Čekám u dveří.", uk: "Я чекаю біля дверей." },
      { cz: "Zastavil se u obchodu.", uk: "Він зупинився біля магазину." },
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
      { cz: "Parkuju vedle domu.", uk: "Я паркуюся біля будинку." },
      { cz: "Vedle školy je hřiště.", uk: "Біля школи є майданчик." },
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
      { cz: "Jezdím kolem parku do práce.", uk: "Я їжджу на роботу повз парк." },
      { cz: "Kolem oběda si dáme pauzu.", uk: "Близько обіду ми зробимо перерву." },
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
      { cz: "Kromě chleba potřebujeme i mléko.", uk: "Крім хліба нам потрібне ще й молоко." },
      { cz: "Bylo to dobré, kromě konce.", uk: "Це було добре, крім кінця." },
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
      { cz: "Vzal si taxi místo autobusu.", uk: "Він взяв таксі замість автобуса." },
      { cz: "Napiš mi místo volání.", uk: "Напиши мені замість дзвінка." },
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
      { cz: "Vařím podle receptu.", uk: "Я готую за рецептом." },
      { cz: "Podle plánu přijedeme večer.", uk: "Згідно з планом ми приїдемо ввечері." },
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
      { cz: "Zavolej mi, až dojdeš k domu.", uk: "Подзвони мені, коли дійдеш до будинку." },
      { cz: "Přidal cukr k čaji.", uk: "Він додав цукор до чаю." },
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
      { cz: "Zpozdil jsem se kvůli dopravě.", uk: "Я запізнився через затори." },
      { cz: "Hádali se kvůli penězům.", uk: "Вони сварилися через гроші." },
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
      { cz: "Díky slevě jsme ušetřili.", uk: "Завдяки знижці ми заощадили." },
      { cz: "Přežili díky rychlé pomoci.", uk: "Вони вижили завдяки швидкій допомозі." },
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
      { cz: "Vzal si lék proti bolesti.", uk: "Він прийняв ліки від болю." },
      { cz: "Dům stojí proti parku.", uk: "Будинок стоїть навпроти парку." },
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
      { cz: "Uvař oběd pro celou rodinu.", uk: "Приготуй обід на всю сім'ю." },
      { cz: "Je to důležité pro naši budoucnost.", uk: "Це важливо для нашого майбутнього." },
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
      { cz: "Jedu domů přes centrum.", uk: "Я їду додому через центр." },
      { cz: "Mluvili jsme přes telefon.", uk: "Ми розмовляли по телефону." },
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
      { cz: "Podíval se skrz okno.", uk: "Він подивився крізь вікно." },
      { cz: "Vítr fouká skrz díru v plotě.", uk: "Вітер дме крізь дірку в паркані." },
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
      { cz: "Odjeli mimo republiku.", uk: "Вони виїхали за межі республіки." },
      { cz: "To je mimo téma.", uk: "Це не по темі." },
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
      { cz: "Poslouchám hudbu při vaření.", uk: "Я слухаю музику під час готування." },
      { cz: "Při nehodě se nikdo nezranil.", uk: "Під час аварії ніхто не постраждав." },
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
      { cz: "Piju čaj s medem.", uk: "Я п'ю чай з медом." },
      { cz: "Přijela s dětmi na návštěvu.", uk: "Вона приїхала в гості з дітьми." },
    ],
  },
];
