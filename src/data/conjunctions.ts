import { InvariantWordEntry } from "../types";

// Сполучники (spojky) — незмінна частина мови, як прийменники/незмінні
// питальні слова, тому той самий тип InvariantWordEntry і та сама
// компенсація відсутньої парадигми: 4 приклади природної мови на слово.
//
// БЕЗ КВІЗУ (той самий принцип, що INTERROGATIVE_MISC): сполучники не
// відмінюються, тестувати multiple-choice форму нема що. Лише словник +
// приклади (+ майбутня граматика окремим патчем — розбір синонімічних пар
// pokud/jestli, nicméně/přesto).
export const CONJUNCTIONS: InvariantWordEntry[] = [
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
    // Вимагає окремої конструкції (aby + минулий час / умовний спосіб) —
    // приклади нижче лише показують вживання, саму конструкцію розбирати
    // в майбутній граматиці розділу.
    id: "conj-aby",
    cz: "aby",
    uk: "щоб",
    examples: [
      { cz: "Chci, abys mi pomohl.", uk: "Я хочу, щоб ти мені допоміг." },
      { cz: "Přišel jsem, abych to vyřešil.", uk: "Я прийшов, щоб це вирішити." },
      { cz: "Udělej to tak, aby to fungovalo.", uk: "Зроби це так, щоб воно працювало." },
      { cz: "Zavolala, aby mi to řekla.", uk: "Вона подзвонила, щоб сказати мені це." },
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
