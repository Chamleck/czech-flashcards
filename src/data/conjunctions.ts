import { InvariantWordEntry, ConditionalConjunctionEntry } from "../types";

// Сполучники (spojky) — переважно незмінна частина мови, як прийменники/
// незмінні питальні слова, тому той самий тип InvariantWordEntry і та сама
// компенсація відсутньої парадигми: 4 приклади природної мови на слово.
// ВИНЯТОК: aby/kdyby мають РЕАЛЬНУ 6-особову парадигму (ConditionalConjunctionEntry,
// resolveServiceWord диспетчеризує за id — те саме, що interrogativeEntries.ts).
//
// БЕЗ КВІЗУ (той самий принцип, що INTERROGATIVE_MISC): сполучники не
// відмінюються (крім aby/kdyby — але їхня парадигма тренується через саму
// картку, не multiple-choice). Лише словник + приклади + грамтема
// "Службові слова" (pokud/jestli, nicméně/přesto, ačkoli/přestože, aby+kdyby).
export const CONJUNCTIONS: (InvariantWordEntry | ConditionalConjunctionEntry)[] = [
  {
    id: "conj-a",
    cz: "a",
    uk: "і / та",
    examples: [
      { cz: "Mám psa a kočku.", uk: "У мене є собака і кіт." },
      { cz: "Šla domů a spala.", uk: "Вона пішла додому і спала." },
      { cz: "Je to levné, a přesto kvalitní.", uk: "Це дешево, і водночас якісно." },
      { cz: "Otevři dveře a pojď dál.", uk: "Відчини двері і заходь." },
    ],
  },
  {
    id: "conj-ale",
    cz: "ale",
    uk: "але",
    examples: [
      { cz: "Chtěl jsem jít, ale nemohl jsem.", uk: "Я хотів піти, але не міг." },
      { cz: "Je malý, ale silný.", uk: "Він маленький, але сильний." },
      { cz: "Mám hlad, ale nemám čas.", uk: "Я голодний, але в мене нема часу." },
      { cz: "Líbí se mi to, ale je to drahé.", uk: "Мені це подобається, але це дорого." },
    ],
  },
  {
    id: "conj-nebo",
    cz: "nebo",
    uk: "або / чи",
    examples: [
      { cz: "Chceš čaj, nebo kávu?", uk: "Хочеш чай чи каву?" },
      { cz: "Zavolej mi, nebo napiš.", uk: "Подзвони мені або напиши." },
      { cz: "Buď teď, nebo nikdy.", uk: "Або зараз, або ніколи." },
      { cz: "Můžeme jít pěšky, nebo jet autem.", uk: "Можемо піти пішки або поїхати машиною." },
    ],
  },
  {
    id: "conj-protoze",
    cz: "protože",
    uk: "тому що",
    examples: [
      { cz: "Nepřišel, protože byl nemocný.", uk: "Він не прийшов, тому що був хворий." },
      { cz: "Miluju Prahu, protože je krásná.", uk: "Я люблю Прагу, тому що вона гарна." },
      { cz: "Zůstal doma, protože pršelo.", uk: "Він залишився вдома, тому що йшов дощ." },
      { cz: "Nerozumím, protože mluvíš rychle.", uk: "Я не розумію, тому що ти говориш швидко." },
    ],
  },
  {
    id: "conj-ze",
    cz: "že",
    uk: "що",
    examples: [
      { cz: "Vím, že máš pravdu.", uk: "Я знаю, що ти маєш рацію." },
      { cz: "Řekl, že přijde.", uk: "Він сказав, що прийде." },
      { cz: "Myslím, že je to dobrý nápad.", uk: "Я думаю, що це гарна ідея." },
      { cz: "Je škoda, že jsi nepřišel.", uk: "Шкода, що ти не прийшов." },
    ],
  },
  {
    id: "conj-kdyz",
    cz: "když",
    uk: "коли / якщо",
    note: "Не плутати з питальним kdy (=коли?). Když — сполучник умови/часу в стверджувальному реченні, не запитання.",
    examples: [
      { cz: "Když prší, zůstávám doma.", uk: "Коли йде дощ, я залишаюсь удома." },
      { cz: "Zavolej, když budeš mít čas.", uk: "Подзвони, коли матимеш час." },
      { cz: "Když jsem byl malý, žil jsem v Brně.", uk: "Коли я був малим, я жив у Брно." },
      { cz: "Když chceš, můžeš jít se mnou.", uk: "Якщо хочеш, можеш піти зі мною." },
    ],
  },
  {
    // Синонім jestli — pokud частіше в умовних реченнях ("якщо X, то Y"),
    // jestli — у непрямих питаннях ("чи"). Детальніше — в граматиці розділу.
    id: "conj-pokud",
    cz: "pokud",
    uk: "якщо",
    examples: [
      { cz: "Pokud prší, zůstaneme doma.", uk: "Якщо йде дощ, ми залишимось вдома." },
      { cz: "Udělám to, pokud budu mít čas.", uk: "Я зроблю це, якщо матиму час." },
      { cz: "Pokud budeš chtít, zavolej mi.", uk: "Якщо захочеш, подзвони мені." },
      { cz: "Pokud vím, obchod je zavřený.", uk: "Наскільки я знаю, магазин закритий." },
    ],
  },
  {
    // Синонім pokud — jestli частіше в непрямих питаннях ("чи"), pokud — в
    // умовних реченнях ("якщо"). Детальніше — в граматиці розділу.
    id: "conj-jestli",
    cz: "jestli",
    uk: "чи / якщо",
    examples: [
      { cz: "Nevím, jestli přijde.", uk: "Я не знаю, чи він прийде." },
      { cz: "Zeptej se, jestli mají čas.", uk: "Запитай, чи в них є час." },
      { cz: "Podívej se, jestli je otevřeno.", uk: "Подивись, чи відчинено." },
      { cz: "Jestli chceš, můžeme jít spolu.", uk: "Якщо хочеш, можемо піти разом." },
    ],
  },
  {
    // aby = a + by: історично зрослося з особовими закінченнями кондиціоналу,
    // тому має РЕАЛЬНУ 6-особову парадигму abych/abys/aby/abychom/abyste/aby
    // (не просто незмінне слово) — ConditionalConjunctionEntry, не
    // InvariantWordEntry. Детальніше про конструкцію (дієслово після aby-форми
    // стоїть на -l, як у звичайному кондиціоналі) — грамтема "Службові слова".
    id: "conj-aby",
    cz: "aby",
    uk: "щоб",
    paradigm: { ja: "abych", ty: "abys", on: "aby", my: "abychom", vy: "abyste", oni: "aby" },
    note:
      "Не плутати з kdyby — та сама сітка особових закінчень (aby-/kdyby-), але aby виражає МЕТУ/бажання («щоб»), а kdyby — гіпотетичну УМОВУ («якби»).",
    examples: [{ cz: "Přišel jsem, abych ti pomohl.", uk: "Я прийшов, щоб тобі допомогти." }],
  },
  {
    // kdyby = kdy + by: та сама модель, що aby (парадигма зрощена з
    // кондиціоналом), але значення інше — гіпотетична умова, не мета.
    id: "conj-kdyby",
    cz: "kdyby",
    uk: "якби",
    paradigm: { ja: "kdybych", ty: "kdybys", on: "kdyby", my: "kdybychom", vy: "kdybyste", oni: "kdyby" },
    note:
      "Не плутати з aby — та сама сітка особових закінчень (kdyby-/aby-), але kdyby виражає гіпотетичну УМОВУ («якби»), а aby — МЕТУ/бажання («щоб»).",
    examples: [{ cz: "Kdybych měl čas, pomohl bych ti.", uk: "Якби я мав час, я б тобі допоміг." }],
  },
  {
    id: "conj-prestoze",
    cz: "přestože",
    uk: "хоча",
    note:
      "Не плутати з přesto («проте», прислівник у головному реченні) — přestože вводить ПІДРЯДНЕ речення («хоча...»).",
    examples: [
      { cz: "Přestože pršelo, šli jsme na procházku.", uk: "Хоча падав дощ, ми пішли на прогулянку." },
      { cz: "Přestože byl unavený, dokončil práci.", uk: "Хоча він втомився, закінчив роботу." },
      { cz: "Naučil se to, přestože neměl čas.", uk: "Він це вивчив, хоча не мав часу." },
      { cz: "Přestože jsem to nechtěl, souhlasil jsem.", uk: "Хоча я цього не хотів, я погодився." },
    ],
  },
  {
    // Дублет (той самий шейп, що InvariantWordEntry) — ačkoli/ačkoliv не різні
    // слова, а орфографічні варіанти ОДНОГО слова, тому одна картка через "/".
    id: "conj-ackoli",
    cz: "ačkoli / ačkoliv",
    uk: "хоча",
    note: "Обидві форми вживаються однаково — це просто орфографічні варіанти одного слова, взаємозамінні.",
    examples: [
      { cz: "Ačkoli pršelo, šli jsme ven.", uk: "Хоча йшов дощ, ми пішли на вулицю." },
      { cz: "Ačkoliv byl unavený, pracoval dál.", uk: "Хоча він був втомлений, продовжував працювати." },
      { cz: "Nesouhlasím, ačkoli chápu důvody.", uk: "Я не погоджуюсь, хоча розумію причини." },
      { cz: "Ačkoliv nemá čas, vždycky pomůže.", uk: "Хоча в нього нема часу, він завжди допомагає." },
    ],
  },
  {
    id: "conj-vsak",
    cz: "však",
    uk: "проте / однак",
    examples: [
      { cz: "Chtěl jsem to koupit, neměl jsem však peníze.", uk: "Я хотів це купити, проте не мав грошей." },
      { cz: "Slíbil, že přijde, nepřišel však.", uk: "Він обіцяв, що прийде, проте не прийшов." },
      { cz: "Je to drahé, je to však kvalitní.", uk: "Це дорого, проте це якісно." },
      { cz: "On však má pravdu.", uk: "Проте він має рацію." },
    ],
  },
  {
    id: "conj-avsak",
    cz: "avšak",
    uk: "однак / проте",
    examples: [
      { cz: "Chtěl jsem pomoci, avšak neměl jsem čas.", uk: "Я хотів допомогти, однак не мав часу." },
      { cz: "Je to riskantní, avšak výnosné.", uk: "Це ризиковано, однак прибутково." },
      { cz: "Avšak nesmíme zapomenout na detaily.", uk: "Однак ми не повинні забувати про деталі." },
      { cz: "Pracoval tvrdě, avšak neuspěl.", uk: "Він працював важко, однак не досяг успіху." },
    ],
  },
  {
    id: "conj-jelikoz",
    cz: "jelikož",
    uk: "оскільки",
    examples: [
      { cz: "Jelikož pršelo, zůstali jsme doma.", uk: "Оскільки йшов дощ, ми залишились удома." },
      { cz: "Nemohl přijít, jelikož byl nemocný.", uk: "Він не міг прийти, оскільки був хворий." },
      { cz: "Jelikož nemám čas, nemůžu ti pomoct.", uk: "Оскільки в мене нема часу, я не можу тобі допомогти." },
      { cz: "Zavřeli obchod, jelikož neměli zákazníky.", uk: "Вони закрили магазин, оскільки не мали клієнтів." },
    ],
  },
  {
    id: "conj-takze",
    cz: "takže",
    uk: "отже / тож",
    examples: [
      { cz: "Nemám peníze, takže nemůžu jet.", uk: "У мене нема грошей, тож я не можу поїхати." },
      { cz: "Bylo pozdě, takže jsme šli spát.", uk: "Було пізно, тож ми пішли спати." },
      { cz: "Prší, takže vezmi deštník.", uk: "Йде дощ, тож візьми парасольку." },
      { cz: "Takže co budeme dělat?", uk: "Отже, що ми будемо робити?" },
    ],
  },
];
