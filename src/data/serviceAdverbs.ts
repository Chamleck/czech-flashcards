import { InvariantWordEntry } from "../types";

// Загальні прислівники (не просторові — де/куди/звідки живуть окремо в
// ADVERBS/adverbs.ts з іншою моделлю картки, сенси-табі). Тут — модальні/
// підсилювальні/часові службові слова: opravdu, vlastně, tehdy тощо.
// InvariantWordEntry + 4 приклади, той самий принцип, що CONJUNCTIONS.
//
// БЕЗ КВІЗУ — та сама причина, що в CONJUNCTIONS/INTERROGATIVE_MISC:
// незмінні слова, нема форми для multiple-choice.
export const SERVICE_ADVERBS: InvariantWordEntry[] = [
  {
    id: "adv-opravdu",
    cz: "opravdu",
    uk: "справді",
    examples: [
      { cz: "To je opravdu krásné.", uk: "Це справді красиво." },
      { cz: "Opravdu tomu nerozumím.", uk: "Я справді цього не розумію." },
      { cz: "Je opravdu pozdě.", uk: "Справді вже пізно." },
      { cz: "Myslíš to opravdu vážně?", uk: "Ти справді маєш це на увазі?" },
    ],
  },
  {
    id: "adv-vlastne",
    cz: "vlastně",
    uk: "власне",
    examples: [
      { cz: "Vlastně máš pravdu.", uk: "Взагалі-то, ти маєш рацію." },
      { cz: "Co vlastně chceš?", uk: "Що ти власне хочеш?" },
      { cz: "Vlastně jsem to nevěděl.", uk: "Власне, я цього не знав." },
      { cz: "To je vlastně jednoduché.", uk: "Це, власне, просто." },
    ],
  },
  {
    id: "adv-proste",
    cz: "prostě",
    uk: "просто",
    examples: [
      { cz: "Prostě to udělej.", uk: "Просто зроби це." },
      { cz: "Je to prostě skvělé.", uk: "Це просто чудово." },
      { cz: "Nevím, prostě mě to nebaví.", uk: "Не знаю, мені просто не цікаво." },
      { cz: "Prostě odešel.", uk: "Він просто пішов." },
    ],
  },
  {
    id: "adv-uz",
    cz: "už",
    uk: "вже",
    examples: [
      { cz: "Už jsem to udělal.", uk: "Я вже це зробив." },
      { cz: "Je už pozdě.", uk: "Уже пізно." },
      { cz: "Už tam nechci jít.", uk: "Я вже не хочу туди йти." },
      { cz: "Už jsi tady?", uk: "Ти вже тут?" },
    ],
  },
  {
    id: "adv-tehdy",
    cz: "tehdy",
    uk: "тоді",
    note: "Не плутати з pak — tehdy це вже згаданий момент часу (переважно минулого), а pak наступна дія або розмовне «тоді, в такому разі».",
    noteLinks: [{ word: "pak", wordId: "adv-pak", kind: "service-word" }],
    examples: [
      { cz: "Tehdy jsem byl mladý.", uk: "Тоді я був молодим." },
      { cz: "Bydleli jsme tehdy v Praze.", uk: "Ми тоді жили в Празі." },
      { cz: "Poznali se v roce 2010. Tehdy jí bylo dvacet.", uk: "Вони познайомились у 2010 році. Тоді їй було двадцять." },
      { cz: "Od tehdy se nic nezměnilo.", uk: "Відтоді нічого не змінилось." },
    ],
  },
  {
    id: "adv-pak",
    cz: "pak",
    uk: "потім / тоді",
    note: "Два значення: наступна дія («потім») або розмовне «тоді» після умови. Не плутати з tehdy — те про вже згаданий момент минулого.",
    noteLinks: [{ word: "tehdy", wordId: "adv-tehdy", kind: "service-word" }],
    examples: [
      { cz: "Nejdřív se najíme, pak půjdeme.", uk: "Спочатку поїмо, потім підемо." },
      { cz: "Pokud nepřijdeš, pak to udělám sám.", uk: "Якщо не прийдеш, тоді я зроблю це сам." },
      { cz: "Jestli prší, pak zůstaneme doma.", uk: "Якщо йде дощ, тоді ми залишимось удома." },
      { cz: "Šel domů a pak spal.", uk: "Він пішов додому, а потім спав." },
    ],
  },
  {
    // Історично суплетивний вищий ступінь прислівника "rád" (охоче) — тому
    // саме "краще"/"волів би", не самостійне слово з нуля.
    id: "adv-radeji",
    cz: "raději",
    uk: "краще / волів би",
    examples: [
      { cz: "Raději bych zůstal doma.", uk: "Я б краще залишився вдома." },
      { cz: "Mám raději čaj než kávu.", uk: "Я віддаю перевагу чаю, а не каві." },
      { cz: "Raději mlč.", uk: "Краще мовчи." },
      { cz: "Šel bych tam raději sám.", uk: "Я б туди пішов краще сам." },
    ],
  },
  {
    id: "adv-vicemene",
    cz: "víceméně",
    uk: "більш-менш",
    examples: [
      { cz: "Je to víceméně hotové.", uk: "Це більш-менш готово." },
      { cz: "Rozumím tomu víceméně dobře.", uk: "Я розумію це більш-менш добре." },
      { cz: "Víceméně souhlasím.", uk: "Я більш-менш згоден." },
      { cz: "Bylo to víceméně stejné.", uk: "Це було більш-менш те саме." },
    ],
  },
  {
    // Синонім přesto — nicméně більш книжне/писемне. Детальніше — в
    // граматиці розділу.
    id: "adv-nicmene",
    cz: "nicméně",
    uk: "проте / тим не менш",
    examples: [
      { cz: "Bylo to těžké, nicméně jsme to zvládli.", uk: "Це було важко, проте ми впорались." },
      { cz: "Nicméně je třeba dodat, že...", uk: "Проте варто додати, що..." },
      { cz: "Výsledky jsou dobré, nicméně je co zlepšovat.", uk: "Результати добрі, проте є що покращувати." },
      { cz: "Nicméně situace se může změnit.", uk: "Проте ситуація може змінитись." },
    ],
  },
  {
    // Синонім nicméně — přesto більш розмовне/нейтральне. Детальніше — в
    // граматиці розділу.
    id: "adv-presto",
    cz: "přesto",
    uk: "і все ж / попри це",
    note: "Не плутати з přestože — přesto самостійне слово в головному реченні, přestože вводить підрядне («хоча»).",
    noteLinks: [{ word: "přestože", wordId: "conj-prestoze", kind: "service-word" }],
    examples: [
      { cz: "Pršelo, přesto jsme šli ven.", uk: "Йшов дощ, і все ж ми пішли гуляти." },
      { cz: "Byl unavený, přesto pokračoval.", uk: "Він був втомлений, і все ж продовжував." },
      { cz: "Nechutnalo mi to, přesto jsem to snědl.", uk: "Мені це не смакувало, і все ж я це з'їв." },
      { cz: "Přesto ti děkuji.", uk: "І все ж дякую тобі." },
    ],
  },
  {
    id: "adv-jeste",
    cz: "ještě",
    uk: "ще",
    examples: [
      { cz: "Mám ještě čas.", uk: "У мене ще є час." },
      { cz: "Chceš ještě kávu?", uk: "Хочеш ще кави?" },
      { cz: "Ještě nejsem hotový.", uk: "Я ще не готовий." },
      { cz: "Zůstaň ještě chvíli.", uk: "Залишись ще трохи." },
    ],
  },
  {
    // Дублет — taky/také не різні слова, а розмовний/нейтральний варіант
    // ОДНОГО слова, тому одна картка через "/" (той самий принцип, що
    // conj-ackoli в CONJUNCTIONS).
    id: "adv-take",
    cz: "také / taky",
    uk: "також",
    note: "Розмовний/нейтральний варіант одного слова, вживаються однаково.",
    examples: [
      { cz: "Mám to také.", uk: "У мене це теж є." },
      { cz: "Chci taky jet.", uk: "Я теж хочу поїхати." },
      { cz: "On je také učitel.", uk: "Він теж вчитель." },
      { cz: "Přijdu taky.", uk: "Я теж прийду." },
    ],
  },
  {
    // Дублет — jen/jenom так само один варіант одного слова.
    id: "adv-jen",
    cz: "jen / jenom",
    uk: "тільки / лише",
    note: "Розмовні варіанти (jenom трохи емфатичніше); pouze — книжний відповідник тих самих двох.",
    noteLinks: [{ word: "pouze", wordId: "adv-pouze", kind: "service-word" }],
    examples: [
      { cz: "Mám jen pět korun.", uk: "У мене лише п'ять крон." },
      { cz: "Chci jenom čaj.", uk: "Я хочу тільки чай." },
      { cz: "Je jen unavený.", uk: "Він просто втомлений." },
      { cz: "Zbylo jenom trochu.", uk: "Залишилось лише трохи." },
    ],
  },
  {
    id: "adv-asi",
    cz: "asi",
    uk: "напевно / мабуть",
    examples: [
      { cz: "Bude asi pršet.", uk: "Напевно, буде дощ." },
      { cz: "Je mu asi třicet let.", uk: "Йому, напевно, років тридцять." },
      { cz: "Asi máš pravdu.", uk: "Мабуть, ти маєш рацію." },
      { cz: "Přijde asi pozdě.", uk: "Він, напевно, прийде пізно." },
    ],
  },
  {
    id: "adv-mozna",
    cz: "možná",
    uk: "можливо",
    examples: [
      { cz: "Možná přijdu později.", uk: "Можливо, я прийду пізніше." },
      { cz: "To je možná pravda.", uk: "Можливо, це правда." },
      { cz: "Možná bude sněžit.", uk: "Можливо, буде сніг." },
      { cz: "Udělám to možná zítra.", uk: "Можливо, я зроблю це завтра." },
    ],
  },
  {
    id: "adv-urcite",
    cz: "určitě",
    uk: "напевно / точно",
    examples: [
      { cz: "Určitě přijdu.", uk: "Я точно прийду." },
      { cz: "To je určitě dobrý nápad.", uk: "Це точно гарна ідея." },
      { cz: "Určitě to zvládneš.", uk: "Ти точно впораєшся." },
      { cz: "On to určitě ví.", uk: "Він це точно знає." },
    ],
  },
  {
    id: "adv-bohuzel",
    cz: "bohužel",
    uk: "на жаль",
    examples: [
      { cz: "Bohužel nemůžu přijít.", uk: "На жаль, я не можу прийти." },
      { cz: "Bohužel to není pravda.", uk: "На жаль, це неправда." },
      { cz: "Lístky jsou bohužel vyprodané.", uk: "Квитки, на жаль, розпродані." },
      { cz: "Bohužel jsem to nestihl.", uk: "На жаль, я не встиг це зробити." },
    ],
  },
  {
    id: "adv-pouze",
    cz: "pouze",
    uk: "лише / тільки",
    note: "Книжний відповідник jen/jenom, те саме значення, формальніший стиль.",
    noteLinks: [{ word: "jen/jenom", wordId: "adv-jen", kind: "service-word" }],
    examples: [
      { cz: "Mám pouze pět minut.", uk: "У мене лише п'ять хвилин." },
      { cz: "To je pouze návrh.", uk: "Це лише пропозиція." },
      { cz: "Pouze on to ví.", uk: "Тільки він це знає." },
      { cz: "Vstup pouze pro zaměstnance.", uk: "Вхід лише для працівників." },
    ],
  },
];
