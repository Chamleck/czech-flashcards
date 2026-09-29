import { SpatialAdverbEntry } from "../types";

// Незмінні прислівники місця: де? / куди? / звідки? Форми звірено з ÚJЧ
// (prirucka.ujc.cas.cz), Naše řeč (nase-rec.ujc.cas.cz — зокрема архівна
// стаття про "prostřed", що прямо підтверджує трійку uprostřed/doprostřed/
// zprostřed), czechency.org, rodicka.cz, cesky-jazyk.cz.
//
// Модель "стільки сенсів, скільки реально є" (як CardinalEntry/DateOrdinal):
// 10 слів мають повну трійку (де/куди/звідки), 2 — задокументовані винятки
// з неповним набором (tam, doma), 1 — самостійне, без пари (rovně).
//
// UPDATE: стара політика "1 приклад на сенс у трійках, 2 — у виключень"
// СКАСОВАНА (Нік знайшов уже наявні картки, де вона сама не витримувалась —
// tam мав по 2 для де?/куди?/звідки?, але 1 для кудою? в тій самій картці).
// Тепер РІВНО 2 приклади на КОЖЕН сенс, без винятків і без оглядки на
// загальний обсяг картки — простіше й послідовніше правило.
//
// 4-й вимір — "кудою?" (шлях, tudy/tamtudy): за czechency.org (ZÁJMENNÉ
// PŘÍSLOVCE) форми шляху — самостійний дейктичний ряд, парний лише до
// tady/tam (tudy/tamtudy), а НЕ до напрямкових слів на кшталт vlevo/vpravo
// (для них форми шляху в чеській мові просто немає). Тому лише adv-tady й
// adv-tam отримують додатковий сенс "кудою?" — решта дев'яти трійок
// лишаються рівно трійками. Лейбл "кудою?" НАВМИСНЕ не мапиться у
// forward-мапу adverbQuizEngine.ts (той самий принцип виключення, що й
// "напрямок" rovně) — сенс живе в картці/словнику, а тестується лише
// reverse-квізом (окрема мапа там).

export const ADVERBS: SpatialAdverbEntry[] = [
  {
    id: "adv-vlevo",
    uk: "ліворуч",
    senses: [
      { label: "де?", cz: "vlevo", examples: [{ cz: "Banka je vlevo.", uk: "Банк ліворуч." }, { cz: "Obchod je vlevo od nás.", uk: "Магазин ліворуч від нас." }] },
      { label: "куди?", cz: "doleva", examples: [{ cz: "Zahni doleva.", uk: "Поверни ліворуч." }, { cz: "Podívej se doleva.", uk: "Подивись ліворуч." }] },
      { label: "звідки?", cz: "zleva", examples: [{ cz: "Auto přijelo zleva.", uk: "Авто під'їхало зліва." }, { cz: "Slyšel hlas zleva.", uk: "Він почув голос зліва." }] },
    ],
  },
  {
    id: "adv-vpravo",
    uk: "праворуч",
    senses: [
      { label: "де?", cz: "vpravo", examples: [{ cz: "Škola je vpravo.", uk: "Школа праворуч." }, { cz: "Lékárna je vpravo.", uk: "Аптека праворуч." }] },
      { label: "куди?", cz: "doprava", examples: [{ cz: "Zahni doprava.", uk: "Поверни праворуч." }, { cz: "Otoč se doprava.", uk: "Повернись праворуч." }] },
      { label: "звідки?", cz: "zprava", examples: [{ cz: "Vítr fouká zprava.", uk: "Вітер дме справа." }, { cz: "Přišel zprava.", uk: "Він прийшов справа." }] },
    ],
  },
  {
    id: "adv-nahore",
    uk: "нагорі / вгорі",
    senses: [
      { label: "де?", cz: "nahoře", examples: [{ cz: "Kočka je nahoře.", uk: "Кіт нагорі." }, { cz: "Obraz visí nahoře.", uk: "Картина висить нагорі." }] },
      { label: "куди?", cz: "nahoru", examples: [{ cz: "Jdi nahoru.", uk: "Йди нагору." }, { cz: "Podívej se nahoru.", uk: "Подивись нагору." }] },
      { label: "звідки?", cz: "shora", examples: [{ cz: "Padalo to shora.", uk: "Це падало згори." }, { cz: "Slunce svítí shora.", uk: "Сонце світить згори." }] },
    ],
  },
  {
    id: "adv-dole",
    uk: "внизу",
    senses: [
      { label: "де?", cz: "dole", examples: [{ cz: "Klíče jsou dole.", uk: "Ключі внизу." }, { cz: "Obchod je dole.", uk: "Магазин внизу." }] },
      { label: "куди?", cz: "dolů", examples: [{ cz: "Podívej se dolů.", uk: "Подивись вниз." }, { cz: "Jdi dolů.", uk: "Йди вниз." }] },
      { label: "звідки?", cz: "zdola", examples: [{ cz: "Slyšel hluk zdola.", uk: "Він почув шум знизу." }, { cz: "Přišel zdola.", uk: "Він прийшов знизу." }] },
    ],
  },
  {
    id: "adv-vzadu",
    uk: "ззаду",
    senses: [
      { label: "де?", cz: "vzadu", examples: [{ cz: "Seděl vzadu.", uk: "Він сидів ззаду." }, { cz: "Zavazadla jsou vzadu.", uk: "Багаж ззаду." }] },
      { label: "куди?", cz: "dozadu", examples: [{ cz: "Posuň se dozadu.", uk: "Посунься назад." }, { cz: "Jdi dozadu.", uk: "Йди назад." }] },
      { label: "звідки?", cz: "zezadu", examples: [{ cz: "Někdo na něj zavolal zezadu.", uk: "Хтось гукнув його ззаду." }, { cz: "Přišel zezadu.", uk: "Він підійшов ззаду." }] },
    ],
  },
  {
    id: "adv-vpredu",
    uk: "спереду",
    senses: [
      { label: "де?", cz: "vpředu", examples: [{ cz: "Řidič sedí vpředu.", uk: "Водій сидить спереду." }, { cz: "Učitel stojí vpředu.", uk: "Вчитель стоїть спереду." }] },
      { label: "куди?", cz: "dopředu", examples: [{ cz: "Pojď dopředu.", uk: "Йди вперед." }, { cz: "Podívej se dopředu.", uk: "Подивись вперед." }] },
      { label: "звідки?", cz: "zepředu", examples: [{ cz: "Ta fotka je zepředu.", uk: "Це фото зроблене спереду." }, { cz: "Vítr fouká zepředu.", uk: "Вітер дме спереду." }] },
    ],
  },
  {
    id: "adv-venku",
    uk: "надворі",
    senses: [
      { label: "де?", cz: "venku", examples: [{ cz: "Děti jsou venku.", uk: "Діти надворі." }, { cz: "Je hezky venku.", uk: "Надворі гарно." }] },
      { label: "куди?", cz: "ven", examples: [{ cz: "Pojď ven.", uk: "Виходь надвір." }, { cz: "Jdeme ven.", uk: "Ми йдемо надвір." }] },
      { label: "звідки?", cz: "zvenku", examples: [{ cz: "Je slyšet hluk zvenku.", uk: "Чути шум ззовні." }, { cz: "Přišel zvenku.", uk: "Він прийшов ззовні." }] },
    ],
  },
  {
    id: "adv-vevnitr",
    uk: "всередині",
    senses: [
      { label: "де?", cz: "vevnitř", examples: [{ cz: "Vevnitř je teplo.", uk: "Всередині тепло." }, { cz: "Kniha je vevnitř.", uk: "Книга всередині." }] },
      { label: "куди?", cz: "dovnitř", examples: [{ cz: "Pojďme dovnitř.", uk: "Ходімо всередину." }, { cz: "Podívej se dovnitř.", uk: "Подивись всередину." }] },
      { label: "звідки?", cz: "zevnitř", examples: [{ cz: "Dveře se zamykají zevnitř.", uk: "Двері замикаються зсередини." }, { cz: "Slyšel hlas zevnitř.", uk: "Він почув голос зсередини." }] },
    ],
  },
  {
    id: "adv-uprostred",
    uk: "посередині",
    senses: [
      { label: "де?", cz: "uprostřed", examples: [{ cz: "Stůl je uprostřed pokoje.", uk: "Стіл посередині кімнати." }, { cz: "Sedí uprostřed.", uk: "Він сидить посередині." }] },
      { label: "куди?", cz: "doprostřed", examples: [{ cz: "Postav to doprostřed.", uk: "Постав це посередині." }, { cz: "Jdi doprostřed.", uk: "Йди в середину." }] },
      { label: "звідки?", cz: "zprostřed", examples: [{ cz: "Vyšel zprostřed davu.", uk: "Він вийшов із середини натовпу." }, { cz: "Slyšel hlas zprostřed davu.", uk: "Він почув голос з середини натовпу." }] },
    ],
  },
  {
    id: "adv-tady",
    uk: "тут",
    senses: [
      { label: "де?", cz: "tady", examples: [{ cz: "Bydlím tady.", uk: "Я живу тут." }, { cz: "Je tady hezky.", uk: "Тут гарно." }] },
      { label: "куди?", cz: "sem", examples: [{ cz: "Pojď sem.", uk: "Йди сюди." }, { cz: "Přines to sem.", uk: "Принеси це сюди." }] },
      { label: "звідки?", cz: "odtud", examples: [{ cz: "Je to daleko odtud.", uk: "Це далеко звідси." }, { cz: "Odešel odtud.", uk: "Він пішов звідси." }] },
      { label: "кудою?", cz: "tudy", examples: [{ cz: "Pojedeme tudy.", uk: "Ми поїдемо цим шляхом." }, { cz: "Utekl tudy.", uk: "Він утік цим шляхом." }] },
    ],
  },
  {
    id: "adv-tam",
    uk: "там",
    senses: [
      {
        label: "де? / куди?",
        cz: "tam",
        examples: [
          { cz: "Je tam hezky.", uk: "Там гарно." },
          { cz: "Jdu tam.", uk: "Я йду туди." },
        ],
      },
      {
        label: "звідки?",
        cz: "odtamtud",
        examples: [
          { cz: "Utekl odtamtud.", uk: "Він утік звідти." },
          { cz: "Je to daleko odtamtud.", uk: "Це далеко звідти." },
        ],
      },
      { label: "кудою?", cz: "tamtudy", examples: [{ cz: "Utekl tamtudy.", uk: "Він утік тим шляхом." }, { cz: "Pojedeme tamtudy.", uk: "Ми поїдемо тим шляхом." }] },
    ],
    note:
      "На відміну від «тут → сюди» (tady → sem), tam працює ОДНОЧАСНО і для «де?», і для «куди?» — Jsem tam і Jdu tam звучать однаково. Форма «звідки?» все ж є окремим словом — odtamtud. Історичне «onam» (напрямкова форма) — архаїзм, у сучасній мові не вживається. «Кудою?» (шлях) — теж окреме слово, tamtudy, той самий дейктичний ряд, що tudy для tady.",
  },
  {
    id: "adv-doma",
    uk: "вдома",
    senses: [
      {
        label: "де?",
        cz: "doma",
        examples: [
          { cz: "Jsem doma.", uk: "Я вдома." },
          { cz: "Zůstaň doma.", uk: "Залишся вдома." },
        ],
      },
      {
        label: "куди?",
        cz: "domů",
        examples: [
          { cz: "Jdu domů.", uk: "Я йду додому." },
          { cz: "Vrátil se domů pozdě.", uk: "Він повернувся додому пізно." },
        ],
      },
    ],
    note:
      "На відміну від інших пар, окремого слова для «звідки?» тут нема — вживається прийменникова конструкція «z domova» (родовий відмінок іменника domov: Přišel z domova), а не самостійний прислівник.",
  },
  {
    id: "adv-rovne",
    uk: "прямо",
    senses: [
      {
        label: "напрямок",
        cz: "rovně",
        examples: [
          { cz: "Jděte rovně.", uk: "Ідіть прямо." },
          { cz: "Pokračujte rovně až ke světlům.", uk: "Продовжуйте прямо до світлофора." },
        ],
      },
    ],
    note: "Без пари де/куди/звідки — це самостійне слово напрямку, найчастіше в дорожніх вказівках.",
  },
];
