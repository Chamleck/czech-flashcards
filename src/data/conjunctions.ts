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
    note: "Не плутати з proto — protože вказує на ПРИЧИНУ («тому що»), а proto — на НАСЛІДОК («тому»).",
    noteLinks: [{ word: "proto", wordId: "conj-proto", kind: "service-word" }],
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
    note: "Не плутати з питальним kdy («коли?») — když це сполучник умови/часу, не запитання.",
    noteLinks: [{ word: "kdy", wordId: "int-kdy", kind: "interrogative", crossKind: true }],
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
    note: "Не плутати з kdyby — aby виражає мету («щоб»), kdyby — умову («якби»).",
    noteLinks: [{ word: "kdyby", wordId: "conj-kdyby", kind: "service-word" }],
    examples: [{ cz: "Přišel jsem, abych ti pomohl.", uk: "Я прийшов, щоб тобі допомогти." }],
  },
  {
    // kdyby = kdy + by: та сама модель, що aby (парадигма зрощена з
    // кондиціоналом), але значення інше — гіпотетична умова, не мета.
    id: "conj-kdyby",
    cz: "kdyby",
    uk: "якби",
    paradigm: { ja: "kdybych", ty: "kdybys", on: "kdyby", my: "kdybychom", vy: "kdybyste", oni: "kdyby" },
    note: "Не плутати з aby — kdyby виражає умову («якби»), aby — мету («щоб»).",
    noteLinks: [{ word: "aby", wordId: "conj-aby", kind: "service-word" }],
    examples: [{ cz: "Kdybych měl čas, pomohl bych ti.", uk: "Якби я мав час, я б тобі допоміг." }],
  },
  {
    id: "conj-prestoze",
    cz: "přestože",
    uk: "хоча",
    note: "Не плутати з přesto — přestože вводить підрядне речення («хоча»), přesto самостійне слово в головному.",
    noteLinks: [{ word: "přesto", wordId: "adv-presto", kind: "service-word" }],
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
    note: "Орфографічні варіанти одного слова, вживаються однаково.",
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
    note: "На відміну від avšak, však ніколи не стоїть першим словом речення: «On však má pravdu», не «Však on má pravdu». Той самий порядок слів — і в totiž.",
    noteLinks: [
      { word: "avšak", wordId: "conj-avsak", kind: "service-word" },
      { word: "totiž", wordId: "conj-totiz", kind: "service-word" },
    ],
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
    note: "На відміну від však, avšak можна ставити на початку речення (як ale).",
    noteLinks: [{ word: "však", wordId: "conj-vsak", kind: "service-word" }],
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
    note: "Розмовний варіант — tudíž те саме значення, стилістично офіційніше.",
    noteLinks: [{ word: "tudíž", wordId: "conj-tudiz", kind: "service-word" }],
    examples: [
      { cz: "Nemám peníze, takže nemůžu jet.", uk: "У мене нема грошей, тож я не можу поїхати." },
      { cz: "Bylo pozdě, takže jsme šli spát.", uk: "Було пізно, тож ми пішли спати." },
      { cz: "Prší, takže vezmi deštník.", uk: "Йде дощ, тож візьми парасольку." },
      { cz: "Takže co budeme dělat?", uk: "Отже, що ми будемо робити?" },
    ],
  },
  {
    id: "conj-az",
    cz: "až",
    uk: "коли / поки",
    examples: [
      { cz: "Počkám, až přijdeš.", uk: "Я почекаю, поки ти прийдеш." },
      { cz: "Zavolám ti, až budu doma.", uk: "Я подзвоню тобі, коли буду вдома." },
      { cz: "Až skončím, půjdeme ven.", uk: "Коли я закінчу, ми підемо на вулицю." },
      { cz: "Řekni mi, až budeš připravený.", uk: "Скажи мені, коли будеш готовий." },
    ],
  },
  {
    id: "conj-nez",
    cz: "než",
    uk: "ніж / перш ніж",
    note: "Два вживання: порівняльне «ніж» і часове «перш ніж» — не плутати.",
    examples: [
      { cz: "Je vyšší než já.", uk: "Він вищий за мене." },
      { cz: "Radši čaj než kávu.", uk: "Краще чай, ніж каву." },
      { cz: "Než odejdeš, zavolej mi.", uk: "Перш ніж підеш, подзвони мені." },
      { cz: "Umyj si ruce, než budeš jíst.", uk: "Помий руки, перш ніж їстимеш." },
    ],
  },
  {
    id: "conj-proto",
    cz: "proto",
    uk: "тому / тому-то",
    note: "Не плутати з protože — proto це наслідок («тому»), protože причина («тому що»). Книжний синонім: tudíž.",
    noteLinks: [
      { word: "protože", wordId: "conj-protoze", kind: "service-word" },
      { word: "tudíž", wordId: "conj-tudiz", kind: "service-word" },
    ],
    examples: [
      { cz: "Bylo pozdě, proto jsem šel domů.", uk: "Було пізно, тому я пішов додому." },
      { cz: "Nemám peníze, proto nemůžu jet.", uk: "У мене нема грошей, тому я не можу поїхати." },
      { cz: "Byl nemocný, a proto nepřišel.", uk: "Він був хворий, і тому не прийшов." },
      { cz: "Proto ti to říkám.", uk: "Тому я тобі це кажу." },
    ],
  },
  {
    id: "conj-zatimco",
    cz: "zatímco",
    uk: "тоді як / у той час як",
    examples: [
      { cz: "Zatímco on vařil, ona uklízela.", uk: "Поки він готував, вона прибирала." },
      { cz: "Já mám rád léto, zatímco ona miluje zimu.", uk: "Я люблю літо, тоді як вона любить зиму." },
      { cz: "Zatímco spal, přišla zpráva.", uk: "Поки він спав, прийшло повідомлення." },
      { cz: "On je tichý, zatímco jeho bratr je hlučný.", uk: "Він тихий, тоді як його брат гучний." },
    ],
  },
  {
    id: "conj-jakmile",
    cz: "jakmile",
    uk: "щойно / як тільки",
    examples: [
      { cz: "Zavolám, jakmile přijedu.", uk: "Я подзвоню, щойно приїду." },
      { cz: "Jakmile skončíš, dej mi vědět.", uk: "Щойно закінчиш, дай мені знати." },
      { cz: "Odešel, jakmile to uslyšel.", uk: "Він пішов, щойно це почув." },
      { cz: "Jakmile bude hotovo, řeknu ti.", uk: "Щойно буде готово, я тобі скажу." },
    ],
  },
  {
    id: "conj-totiz",
    cz: "totiž",
    uk: "річ у тім що / бо",
    note: "Як і však, стоїть не першим словом речення, а після дієслова: «Nepřijdu, jsem totiž nemocný».",
    noteLinks: [{ word: "však", wordId: "conj-vsak", kind: "service-word" }],
    examples: [
      { cz: "Nepřijdu, jsem totiž nemocný.", uk: "Я не прийду, річ у тім що я хворий." },
      { cz: "Musím jít, mám totiž schůzku.", uk: "Мені треба йти, у мене, бачте, зустріч." },
      { cz: "On to neví, nikdo mu to totiž neřekl.", uk: "Він цього не знає, йому ж бо ніхто не сказав." },
      { cz: "Je unavená, spala totiž málo.", uk: "Вона втомлена, спала-бо мало." },
    ],
  },
  {
    id: "conj-tudiz",
    cz: "tudíž",
    uk: "отже / таким чином",
    note: "Книжний синонім proto/takže, та сама наслідкова функція.",
    noteLinks: [
      { word: "proto", wordId: "conj-proto", kind: "service-word" },
      { word: "takže", wordId: "conj-takze", kind: "service-word" },
    ],
    examples: [
      { cz: "Nemám čas, tudíž nemůžu přijít.", uk: "У мене нема часу, отже я не можу прийти." },
      { cz: "Je nemocný, tudíž zůstane doma.", uk: "Він хворий, отже залишиться вдома." },
      { cz: "Prší, tudíž si vezmu deštník.", uk: "Йде дощ, отже я візьму парасольку." },
      { cz: "Nezaplatil, tudíž mu to nedáme.", uk: "Він не заплатив, отже ми йому це не дамо." },
    ],
  },
  {
    id: "conj-ani",
    cz: "ani",
    uk: "навіть не / ні...ні",
    note: "Одиничне «навіть не» або парне «ani...ani» = «ні...ні».",
    examples: [
      { cz: "Nemám ani korunu.", uk: "У мене нема навіть жодної крони." },
      { cz: "Nemám ani čas, ani peníze.", uk: "У мене нема ні часу, ні грошей." },
      { cz: "Ani se nezeptal.", uk: "Він навіть не спитав." },
      { cz: "Ani ona, ani on to nevěděli.", uk: "Ні вона, ні він цього не знали." },
    ],
  },
];
