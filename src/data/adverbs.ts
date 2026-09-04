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
// Кількість прикладів на сенс НЕ фіксована, а тримає приблизний ЗАГАЛЬНИЙ
// обсяг картки сталим: у трійках — 1 приклад на сенс (3 разом, без потреби
// скролити для порівняння), у винятків з 2 сенсами — по 2 приклади (4 разом,
// картка не порожня), у rovně — 2 приклади.

export const ADVERBS: SpatialAdverbEntry[] = [
  {
    id: "adv-vlevo",
    uk: "ліворуч",
    senses: [
      { label: "де?", cz: "vlevo", examples: [{ cz: "Banka je vlevo.", uk: "Банк ліворуч." }] },
      { label: "куди?", cz: "doleva", examples: [{ cz: "Zahni doleva.", uk: "Поверни ліворуч." }] },
      { label: "звідки?", cz: "zleva", examples: [{ cz: "Auto přijelo zleva.", uk: "Авто під'їхало зліва." }] },
    ],
  },
  {
    id: "adv-vpravo",
    uk: "праворуч",
    senses: [
      { label: "де?", cz: "vpravo", examples: [{ cz: "Škola je vpravo.", uk: "Школа праворуч." }] },
      { label: "куди?", cz: "doprava", examples: [{ cz: "Zahni doprava.", uk: "Поверни праворуч." }] },
      { label: "звідки?", cz: "zprava", examples: [{ cz: "Vítr fouká zprava.", uk: "Вітер дме справа." }] },
    ],
  },
  {
    id: "adv-nahore",
    uk: "нагорі / вгорі",
    senses: [
      { label: "де?", cz: "nahoře", examples: [{ cz: "Kočka je nahoře.", uk: "Кіт нагорі." }] },
      { label: "куди?", cz: "nahoru", examples: [{ cz: "Jdi nahoru.", uk: "Йди нагору." }] },
      { label: "звідки?", cz: "shora", examples: [{ cz: "Padalo to shora.", uk: "Це падало згори." }] },
    ],
  },
  {
    id: "adv-dole",
    uk: "внизу",
    senses: [
      { label: "де?", cz: "dole", examples: [{ cz: "Klíče jsou dole.", uk: "Ключі внизу." }] },
      { label: "куди?", cz: "dolů", examples: [{ cz: "Podívej se dolů.", uk: "Подивись вниз." }] },
      { label: "звідки?", cz: "zdola", examples: [{ cz: "Slyšel hluk zdola.", uk: "Він почув шум знизу." }] },
    ],
  },
  {
    id: "adv-vzadu",
    uk: "ззаду",
    senses: [
      { label: "де?", cz: "vzadu", examples: [{ cz: "Seděl vzadu.", uk: "Він сидів ззаду." }] },
      { label: "куди?", cz: "dozadu", examples: [{ cz: "Posuň se dozadu.", uk: "Посунься назад." }] },
      { label: "звідки?", cz: "zezadu", examples: [{ cz: "Někdo na něj zavolal zezadu.", uk: "Хтось гукнув його ззаду." }] },
    ],
  },
  {
    id: "adv-vpredu",
    uk: "спереду",
    senses: [
      { label: "де?", cz: "vpředu", examples: [{ cz: "Řidič sedí vpředu.", uk: "Водій сидить спереду." }] },
      { label: "куди?", cz: "dopředu", examples: [{ cz: "Pojď dopředu.", uk: "Йди вперед." }] },
      { label: "звідки?", cz: "zepředu", examples: [{ cz: "Ta fotka je zepředu.", uk: "Це фото зроблене спереду." }] },
    ],
  },
  {
    id: "adv-venku",
    uk: "надворі",
    senses: [
      { label: "де?", cz: "venku", examples: [{ cz: "Děti jsou venku.", uk: "Діти надворі." }] },
      { label: "куди?", cz: "ven", examples: [{ cz: "Pojď ven.", uk: "Виходь надвір." }] },
      { label: "звідки?", cz: "zvenku", examples: [{ cz: "Je slyšet hluk zvenku.", uk: "Чути шум ззовні." }] },
    ],
  },
  {
    id: "adv-vevnitr",
    uk: "всередині",
    senses: [
      { label: "де?", cz: "vevnitř", examples: [{ cz: "Vevnitř je teplo.", uk: "Всередині тепло." }] },
      { label: "куди?", cz: "dovnitř", examples: [{ cz: "Pojďme dovnitř.", uk: "Ходімо всередину." }] },
      { label: "звідки?", cz: "zevnitř", examples: [{ cz: "Dveře se zamykají zevnitř.", uk: "Двері замикаються зсередини." }] },
    ],
  },
  {
    id: "adv-uprostred",
    uk: "посередині",
    senses: [
      { label: "де?", cz: "uprostřed", examples: [{ cz: "Stůl je uprostřed pokoje.", uk: "Стіл посередині кімнати." }] },
      { label: "куди?", cz: "doprostřed", examples: [{ cz: "Postav to doprostřed.", uk: "Постав це посередині." }] },
      { label: "звідки?", cz: "zprostřed", examples: [{ cz: "Vyšel zprostřed davu.", uk: "Він вийшов із середини натовпу." }] },
    ],
  },
  {
    id: "adv-tady",
    uk: "тут",
    senses: [
      { label: "де?", cz: "tady", examples: [{ cz: "Bydlím tady.", uk: "Я живу тут." }] },
      { label: "куди?", cz: "sem", examples: [{ cz: "Pojď sem.", uk: "Йди сюди." }] },
      { label: "звідки?", cz: "odtud", examples: [{ cz: "Je to daleko odtud.", uk: "Це далеко звідси." }] },
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
    ],
    note:
      "На відміну від «тут → сюди» (tady → sem), tam працює ОДНОЧАСНО і для «де?», і для «куди?» — Jsem tam і Jdu tam звучать однаково. Форма «звідки?» все ж є окремим словом — odtamtud. Історичне «onam» (напрямкова форма) — архаїзм, у сучасній мові не вживається.",
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
