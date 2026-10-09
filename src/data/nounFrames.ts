import type { CzechCase } from "../types";
import type { Needs, NumberPolicy } from "./prepositionPartners";
import type { NounTag } from "./nounTags";
import { NOUN_USAGE_RULES, NounCell, tagSkip } from "../utils/partnerSelection";
import type { SkipRule } from "../utils/quizCommon";

// ─────────────────────── ФРАЗИ КВІЗУ «ІМЕННИКИ» ───────────────────────
// ДАНІ, а не логіка. Кожна фраза задає відмінок іменника через дієслово чи прийменник («Bojím se ___» — родовий,
// «Mluvíme o ___» — місцевий), а пропуск — сам іменник: «Bojím se [psa]». Рушій (utils/flashcardEngine.ts) бере
// фразу за смисловими тегами іменника (data/nounTags.ts), як у квізах «Прийменники», «Прикметники та займенники»,
// «Числівники»; списків слів тут немає — нове слово з тегами потрапляє в усі підхожі фрази саме.
// Слово, під теги якого в цьому відмінку й числі не підійшла жодна фраза, квіз питає без речення (форма + підпис
// відмінка), тож покриття не губиться; dev-збірка друкує такі комбінації — це список фраз, яких бракує.
//
// Банк власний, не спільний з іншими квізами: тут фрази підібрані під рівне покриття відмінків самого іменника.
// Спільні лише механізм (теги, utils/partnerSelection.ts) і вокалізація.
//
// ПРАВИЛА ДОДАВАННЯ ФРАЗ
//  1. Фраза природна для КОЖНОГО іменника, що підпадає під її теги (any / all / none; у багатозначного слова — для
//     значення з цими тегами, підказка питання — переклад цього значення: «курча (їжа)»), у кожному числі, яке
//     дозволяє num: "sg" (за замовчуванням) — однина, а слова лише з множиною (peníze, brýle) і парні речі
//     (boty — тег paired) беруться в ній і в множині; "pl" — лише множина; "any" — обидва числа. Множину
//     незлічуваних слів (uncountable: voda, maso), збірних (collective: rodina) і metro (oneSystem — NO_PLURAL у
//     utils/partnerSelection.ts) рушій у фрази не ставить — крім фраз, чиє поле plOk містить тег слова (правило 7).
//  2. Дієслово чи прийменник фрази керує в цьому значенні РІВНО ОДНИМ відмінком, інакше дистрактор теж буде
//     правильним: не «volat» (volám kamaráda / kamarádovi), не «na / o / za / před» там, де можливий і знахідний
//     («Postav to před dům»), не «s» із родовим («s kopce»). Тому: «Jsem na ___» (спокій, місцевий), «Jdu na ___»
//     (рух, знахідний), «Stojím před ___» (спокій, орудний).
//  3. Число у фразі не перевіряється (підпис завдання каже «однина / множина»), але дієслово, що узгоджується з
//     іменником у називному, має відповідати num: «To jsou ___» — лише "pl".
//  4. {v} {k} {s} {z} — прийменник перед пропуском; ve / ke / se / ze за формою відповіді (CLUSTER_RULES у
//     data/prepositionPartners.ts). Обидві кнопки мусять мати однаковий прийменник; невідома група приголосних —
//     фраза для цієї форми не береться (не вгадуємо). Фраза не починається з {v}/{k}/{s}/{z}: рушій не робить
//     першу літеру великою («Mám volno ve středu», не «{v} ___ mám volno»; dev-збірка попереджає).
//  5. Кличний — лише для осіб і тварин (теги person / animal): звертання до речі («stole!») квіз не питає.
//  6. Після додавання фрази прочитай усі пари «фраза × іменник», що в неї потрапили; тег, що дає безглузду пару,
//     прибери з вимоги. dev-збірка попереджає про фразу, в яку потрапляє менше 3 іменників.
//  7. plOk — теги, для яких У ЦІЙ фразі природна множина, хоча за правилом 1 її немає: збірне rodina стоїть у
//     множині лише там, де «кілька родин» звучить природно («Mluvím s rodinami», «Přišlo hodně rodin»), а не в
//     «Mám dárek od ___» («od rodin» — ні). Фраза мусить дозволяти множину (num "any" чи "pl"). Тег із plOk — явне
//     рішення, тож відкриває множину й незлічуваному («Pijeme minerální vody», «silné větry»). Механізм і зміст той
//     самий, що в квізах «Прийменники» й «Прикметники та займенники» (поле plOk їхніх фраз, candidateNumbers).

export interface NounFrame extends Needs {
  text: string; // «___» — пропуск для форми іменника
  num?: NumberPolicy; // за замовчуванням "sg"
  plOk?: NounTag[]; // теги, для яких у цій фразі природна множина всупереч правилу 1 (правило 7)
}

// Предмети й речі, які можна шукати чи взяти.
const THINGS: NounTag[] = ["item", "carried", "clothes", "document", "money"];
// Те, що не намалюєш і не сфотографуєш як річ.
const NOT_PICTURED: NounTag[] = ["time", "weather", "air", "abstract", "activity", "nonVisual"]; // не «Nakresli ročník / kapitolu»

export const NOUN_FRAMES: Record<CzechCase, NounFrame[]> = {
  // Називний однини — словникова форма (заголовок картки), квіз його не питає; тут лише множина.
  nominativ: [
    { text: "To jsou ___.", num: "pl", none: ["time", "weather"] },
    { text: "Kde jsou ___?", num: "pl", any: ["person", "animal", ...THINGS] },
    { text: "Tady jsou ___.", num: "pl", any: ["person", "animal", ...THINGS, "food", "furniture", "vehicle"], none: ["placeV"], plOk: ["collective"] }, // tady jsou rodiny
    { text: "Utíkají ___.", num: "pl", any: ["timeUnit", "yearsPlural"] }, // utíkají dny, roky, hodiny, léta
    { text: "Jaké tu bývají ___?", num: "pl", any: ["weekday", "season", "daySpan"] }, // neděle, zimy, večery
    { text: "Očekávají se silné ___.", num: "pl", any: ["strongPl"], plOk: ["strongPl"] }, // silné deště, větry
    { text: "Na stole jsou ___.", num: "pl", any: ["drink"] }, // kávy, čaje, piva (порції)
    { text: "Minerální ___ jsou zdravé.", num: "pl", any: ["mineral"], plOk: ["mineral"] }, // minerální vody
  ],
  genitiv: [
    { text: "Bojím se ___.", num: "any", any: ["person", "animal"], none: ["young"] }, // не «Bojím se štěněte» (дитинча)
    { text: "Mám dárek od ___.", num: "any", any: ["person"] },
    { text: "Mám fotku ___.", num: "any", none: [...NOT_PICTURED, "document"] },
    { text: "Bojím se ___.", any: ["weather"] }, // deště, sněhu, větru
    { text: "Jdu do ___.", any: ["placeV"] },
    { text: "Bydlím blízko ___.", any: ["building", "outdoor"] },
    { text: "Stojím vedle ___.", num: "any", any: ["person", "animal"] },
    { text: "Stojím vedle ___.", any: ["building", "vehicle", "furniture", "outdoor", "support", "opening"], none: ["placeV"] }, // vedle domu, vedle auta
    { text: "Dám si trochu ___.", any: ["food"] },
    { text: "Nemám dost ___.", num: "pl", any: ["money"] },
    { text: "Během ___ se to změnilo.", num: "any", any: ["timeUnit"] }, // během týdne / během let
    { text: "Do ___ to bude hotové.", any: ["time", "meal"], none: ["timeUnit"] }, // do pondělí, do léta, do půlnoci, do oběda
    { text: "Během ___ jsme mluvili.", num: "any", any: ["meal", "recurring"], none: ["weather"] }, // během oběda / obědů, cesty / cest, lekce / lekcí (не «během dešťů»)
    { text: "Přišlo hodně ___.", num: "pl", any: ["person"], plOk: ["collective"] }, // hodně lidí, dětí, rodin
    { text: "Kolik ___ jsi tu strávil?", num: "pl", any: ["weekday", "season", "daySpan"] }, // sobot, zim, večerů, nocí
    { text: "Kolik ti je ___?", num: "pl", any: ["yearsPlural"] }, // let
    { text: "Bojím se silných ___.", num: "pl", any: ["strongPl"], plOk: ["strongPl"] }, // silných dešťů, větrů
    { text: "Kolik ___ denně vypiješ?", num: "pl", any: ["drink"] }, // káv, čajů, piv
    { text: "Je tu hodně minerálních ___.", num: "pl", any: ["mineral"], plOk: ["mineral"] }, // vod
    { text: "Nemám dost ___.", any: ["air"] }, // vzduchu
    { text: "Bez ___ to nejde.", any: ["document"] }, // bez pasu, dokladu, adresy, účtu
    { text: "Tady je seznam ___.", num: "pl", any: ["document"] }, // seznam pasů, dokladů, adres, účtů
    { text: "Zaplatil jsem polovinu ___.", any: ["abstract"] }, // polovinu ceny
    { text: "Bojím se růstu ___.", num: "pl", any: ["abstract"] }, // růst cen
    { text: "Vystřídal jsem několik ___.", num: "pl", all: ["activity", "placeV"] }, // několik škol, prací
    { text: "Jsem na konci ___.", any: ["sequencePart"] }, // na konci kapitoly, stránky, řady
    { text: "Kolik ___ má ta kniha?", num: "pl", any: ["sequencePart"], none: ["line"] }, // kapitol, stránek
    { text: "Polovina ___ nepřišla.", any: ["grade"] }, // polovina třídy, ročníku
    { text: "Přišli studenti všech ___.", num: "pl", any: ["grade"] }, // všech tříd, ročníků
  ],
  dativ: [
    { text: "Telefonuju ___.", num: "any", any: ["person"] },
    { text: "Věřím ___.", num: "any", any: ["person"] },
    { text: "Dám to ___.", num: "any", any: ["person", "animal"], plOk: ["collective"] }, // dám to rodinám
    { text: "Díky ___ jsem to zvládl.", num: "any", any: ["person", "carried"] },
    { text: "Díky ___ jsem to zvládl.", any: ["vehicle"] }, // díky autu; «díky metrům» — ні
    { text: "Přišel jsem pozdě kvůli ___.", num: "any", any: ["person", "animal", "document", "carried"] },
    { text: "Přišel jsem pozdě kvůli ___.", any: ["vehicle", "activity", "weather"] }, // kvůli autobusu, práci, dešti
    { text: "Přišel jsem pozdě kvůli ___.", num: "pl", any: ["vehicle"], none: ["placeV"] }, // kvůli autobusům, vlakům
    { text: "Jdu {k} ___.", num: "any", any: ["person"] },
    { text: "Jdu {k} ___.", any: ["building", "furniture", "outdoor", "path", "support"] },
    { text: "Polož to {k} ___.", num: "any", any: ["item", "carried", "clothes", "furniture", "opening"] }, // k oknu, ke knihám
    { text: "Přilož si led {k} ___.", any: ["body"] },
    { text: "Přilož si led {k} ___.", num: "pl", any: ["bodyLevel"], none: ["singleLevel"] }, // k očím, ke kolenům
    { text: "Nemám nic proti ___.", num: "any", any: ["person", "animal"] },
    { text: "Nemám nic proti ___.", any: ["food", "meal", "weather", "vehicle", "activity", "abstract", "outdoor", "building", "time"], none: ["timeUnit"] }, // proti pivu, proti zimě
    { text: "Co si dáš {k} ___?", any: ["food", "meal"] },
    { text: "Kvůli ___ tu není místo.", num: "pl", any: ["vehicle", "furniture"], none: ["placeV"] }, // kvůli autům, skříním (metro — ні)
    { text: "Díky ___ je tu živo.", num: "pl", any: ["workplace"] }, // díky obchodům, kavárnám
    { text: "Chodba vede {k} ___.", any: ["room"] }, // k pokoji, ke kuchyni, ke koupelně, ke třídě
    { text: "Chodba vede {k} ___.", num: "pl", all: ["room", "ordered"] }, // k pokojům, ke třídám (кухня й ванна — одна)
    { text: "To škodí ___.", num: "pl", any: ["bodyMany"] }, // zubům, očím, kolenům, kostem
    { text: "Vrátil jsem se {k} ___.", all: ["seat", "ordered"] }, // k sedadlu, k místu
    { text: "Vrať se {k} ___.", any: ["sequencePart"], none: ["line"] }, // ke stránce, ke kapitole
    { text: "Dej vodu ___.", num: "any", any: ["plant"] }, // květině, růžím, stromům
    { text: "Turisté sem jezdí kvůli ___.", num: "pl", any: ["sight"] }, // kvůli hradům, horám, řekám
    { text: "Díky ___ jsem se hodně naučil.", num: "pl", all: ["activity", "recurring"] }, // díky lekcím, cestám
    { text: "Kvůli ___ nic nekupuju.", num: "pl", any: ["abstract"] }, // kvůli cenám
    { text: "Kvůli silným ___ jsme zůstali doma.", num: "pl", any: ["strongPl"], plOk: ["strongPl"] }, // dešťům, větrům
    { text: "Kvůli ___ jsme zůstali doma.", any: ["weatherCause"] }, // kvůli počasí, dešti, sněhu, větru
    { text: "Podíval se {k} ___.", any: ["sky"] }, // k nebi, ke slunci
    { text: "Dávám přednost domácím ___.", num: "pl", any: ["homemade"] }, // kuřatům, jablkům, sýrům, vejcím (незлічувані — правило 1)
    { text: "Díky společným ___ jsme se sblížili.", num: "pl", any: ["meal"] }, // snídaním, obědům, večeřím
    { text: "Tohle patří k nejkrásnějším ___ v Evropě.", num: "pl", any: ["outdoor"], none: ["landform"] }, // městům, náměstím, silnicím
    { text: "Tohle patří k nejkrásnějším ___ v Evropě.", num: "pl", all: ["landform"], none: ["path"] }, // mořím, řekám («polím» — ні)
    { text: "Cesta vede k ___.", num: "pl", all: ["landform", "path"] }, // lesům, horám, polím («k» — не перед відповіддю)
    { text: "Ke všem ___ vede cesta.", num: "pl", all: ["building", "residence"] }, // domům, stavením, hotelům
    { text: "Hotel je oblíbený díky moderním ___.", num: "pl", any: ["room"], none: ["grade"] }, // pokojům, kuchyním, koupelnám
    { text: "Byla tam dlouhá fronta {k} ___.", num: "pl", all: ["overhead", "placeV"] }, // ke sprchám (басейн, спортзал)
    { text: "Díky teplé ___ jsem se zahřál.", all: ["overhead", "placeV"] }, // sprše
    { text: "Kvůli ___ jsme se pohádali.", num: "pl", all: ["seat", "ordered"] }, // místům, sedadlům (у потязі, у кіно)
    { text: "Ke všem ___ vedou schody.", num: "pl", any: ["line"] }, // řadám (стадіон, амфітеатр)
    { text: "Jdi až k poslední ___.", all: ["line"] }, // řadě
    { text: "Díky ___ je tu tepleji.", num: "any", all: ["surface", "seat", "space"], none: ["item", "furniture"] }, // koberci / kobercům
    { text: "Myčka škodí ___.", num: "any", any: ["tableware"] }, // nožům, lžíci, hrnkům (k / s + lž-, hrn- коливається — тут без прийменника)
    { text: "Díky ___ jsme našli cestu.", num: "any", any: ["nature"], none: ["plant", "sky", "weatherCause"] }, // hvězdě / hvězdám
    { text: "Kurz dolaru {k} ___ roste.", any: ["currency"] }, // ke koruně, k euru
    { text: "Učitel poděkoval ___.", num: "any", any: ["grade"] }, // třídě / třídám, ročníku / ročníkům
    { text: "Přidej čísla ke všem ___.", num: "pl", any: ["sequencePart"], none: ["line"] }, // stránkám, kapitolám («ke» — за «všem», не за відповіддю)
    { text: "Kvůli všem těm ___ nemůžu spát.", num: "pl", any: ["drink"] }, // kávám, čajům, pivům
    { text: "Přidej ještě stovku k těm ___.", num: "pl", any: ["money"] }, // penězům, korunám, eurům
    { text: "Kvůli stavebním ___ je silnice zavřená.", num: "pl", any: ["worksPl"] }, // pracím
  ],
  akuzativ: [
    { text: "Nakresli ___!", num: "any", none: [...NOT_PICTURED, "document"] },
    { text: "Hledám ___.", any: ["activity"] }, // práci, cestu, školu
    { text: "Vidím ___.", num: "any", none: [...NOT_PICTURED, "document"] },
    { text: "Hledám ___.", num: "any", any: ["person", "animal", ...THINGS] },
    { text: "Hledám ___.", any: ["building", "path"] },
    { text: "Znám ___.", num: "any", any: ["person"] },
    { text: "Mám rád ___.", num: "any", any: ["food", "animal"] },
    { text: "Mám rád ___.", any: ["weather"] },
    { text: "Na ___ se těším.", any: ["time"], none: ["timeUnit"] }, // na pátek, na léto, na večer
    { text: "Zůstanu tam ___.", any: ["timeUnit"] }, // zůstanu tam týden, noc
    { text: "Čekám už dlouhé ___.", num: "pl", any: ["timeUnit"] }, // dlouhé hodiny, roky
    { text: "Mám ___.", num: "any", any: ["money"] },
    { text: "Vařím ___.", any: ["meal"] },
    { text: "Jdu na ___.", any: ["placeNa"] },
    { text: "Čekám na ___.", num: "any", any: ["person"] },
    { text: "Čekám na ___.", any: ["vehicle"] },
    { text: "Obleču si ___.", any: ["clothes"] },
    { text: "Zveme ___ na oslavu.", num: "any", any: ["person"], plOk: ["collective"] }, // kamaráda, sousedy, rodiny
    { text: "Mám rád ___.", num: "pl", any: ["weekday", "season", "daySpan"] }, // pátky, podzimy, večery
    { text: "Mám volno {v} ___.", any: ["weekday"] }, // v pondělí, ve středu, ve čtvrtek (знахідний; «ve středě» — ні)
    { text: "Známe se už ___.", num: "pl", any: ["yearsPlural"] }, // léta
    { text: "Zažili jsme silné ___.", num: "pl", any: ["strongPl"], plOk: ["strongPl"] }, // deště, větry
    { text: "Objednal jsem ___ pro všechny.", num: "pl", any: ["drink"] }, // kávy, čaje, piva
    { text: "Pijeme minerální ___.", num: "pl", any: ["mineral"], plOk: ["mineral"] }, // vody
    { text: "Půjdu na ___.", any: ["air"] }, // na vzduch (SSČ «jít na vzduch»)
    { text: "Zeptal jsem se na ___.", any: ["abstract"] }, // na cenu
    { text: "Porovnávám ___.", num: "pl", any: ["abstract"] }, // ceny
    { text: "Mám rád ___.", num: "pl", all: ["activity", "recurring"] }, // cesty, lekce
    { text: "Často jsem měnil ___.", num: "pl", all: ["activity", "placeV"] }, // školy, práce
    { text: "Musel opakovat ___.", any: ["grade"] }, // ročník, třídu
    { text: "Ve škole spojili ___.", num: "pl", any: ["grade"] }, // třídy, ročníky
    { text: "Na zítra si přečti ___.", num: "any", any: ["sequencePart"], none: ["line"] }, // kapitolu / kapitoly, stránku / stránky
  ],
  vokativ: [
    { text: "Děkuju, ___!", num: "any", any: ["person"] },
    { text: "Ahoj, ___!", num: "any", any: ["animal"] }, // ahoj, pse; ahoj, kočky
    { text: "Milé ___, vítáme vás!", num: "pl", all: ["collective"], plOk: ["collective"] }, // milé rodiny (звертання школи / садка)
  ],
  lokal: [
    { text: "Mluvíme o ___.", num: "any", none: ["time", "weather"], plOk: ["collective"] }, // o rodinách
    { text: "Mluvíme o ___.", any: ["weather"] }, // o dešti; «o sluncích» — ні
    { text: "Čtu o ___.", num: "any", none: ["time", "weather"] },
    { text: "Jsem {v} ___.", any: ["placeV"] },
    { text: "Jsem na ___.", any: ["placeNa"] },
    { text: "Stojím {v} ___.", any: ["line", "room"] }, // v řadě (у черзі), v kuchyni, ve třídě
    { text: "Po ___ se vrátím.", any: ["meal", "time"], none: ["dayPart"] }, // po obědě, po roce, po pondělí, po létě
    { text: "V posledních ___ se to změnilo.", num: "pl", any: ["timeUnit"] }, // v posledních týdnech
    { text: "Sedím na ___.", any: ["seat"] },
    { text: "O ___ chodím plavat.", num: "pl", any: ["weekday"] }, // o sobotách, o pátcích («v pátky» — теж правильно, тож не v)
    { text: "Po ___ čtu.", num: "pl", any: ["daySpan"] }, // po večerech, po ránech, po nocích
    { text: "Vrátil se o ___.", any: ["dayPoint"] }, // o půlnoci, o poledni
    { text: "Co děláš {v} ___?", any: ["timeV"] }, // v lednu, v létě, v zimě, v noci
    { text: "Po ___ jsme se zase viděli.", num: "pl", any: ["yearsPlural"] }, // po letech
    { text: "Mluví se o silných ___.", num: "pl", any: ["strongPl"], plOk: ["strongPl"] }, // dešťích, větrech
    { text: "Leží to na ___.", any: ["surface"] },
  ],
  instrumental: [
    { text: "Mluvím {s} ___.", num: "any", any: ["person"], plOk: ["collective"] }, // s rodinami
    { text: "Jsem rád mezi ___.", num: "pl", any: ["person"] },
    { text: "Stojím před ___.", num: "any", any: ["person", "animal"] }, // před učiteli, před ptáky
    { text: "Stojím před ___.", any: ["building", "vehicle", "furniture", "opening", "outdoor", "support", "room"], none: ["activity"] }, // не «před přízemím»; před třídou
    { text: "Je to mezi ___.", num: "pl", any: ["building", "outdoor", "furniture", "nature", "opening"], none: ["weather"] }, // mezi domy, mezi stromy, mezi okny
    { text: "Je to mezi ___.", num: "pl", any: ["vehicle"], none: ["placeV"] }, // mezi auty
    { text: "Leží to pod ___.", num: "any", any: ["space"] }, // pod stolem, pod stromem, pod sedadly
    { text: "Mám problém {s} ___.", any: ["body", "item", "vehicle", "money", "activity", "person", "weatherCause"] }, // s autem, s prací, s počasím
    { text: "Mám problém {s} ___.", num: "pl", any: ["bodyLevel", "bodyMany", "item", "person", "vehicle"], none: ["placeV", "singleLevel"] }, // s očima, se zuby, s klíči
    { text: "Jsem spokojený {s} ___.", any: ["abstract", "activity", "meal"] }, // s cenou, s prací
    { text: "Jsem spokojený {s} ___.", num: "pl", any: ["recurring", "abstract"], none: ["weather"] }, // s lekcemi, s obědy, s cenami
    { text: "Cestuju ___.", all: ["vehicle", "container"] }, // vlakem, autem (не «kolem» — читається як «навколо»)
    { text: "Co budeš dělat {s} ___?", num: "any", any: ["animal", "furniture", ...THINGS, "food"] },
    { text: "Byl jsem tam před ___.", num: "any", any: ["timeUnit"], none: ["dayPart"] }, // před hodinou, před lety
    { text: "Vrátím se před ___.", any: ["meal", "time"], none: ["timeUnit"] }, // před obědem, před pondělím
    { text: "Mezi ___ je chodba.", num: "pl", all: ["room", "ordered"] }, // mezi pokoji, třídami
    { text: "Je to pod ___.", num: "any", any: ["item"] }, // pod lžící, pod hrnky (s + lž- / hrn- коливається)
    { text: "Mezi ___ je málo místa.", num: "pl", all: ["ordered"], any: ["seat", "line"], none: ["placeNa"] }, // mezi sedadly, řadami (місце для ніг; «ulička mezi řadami» — ні)
    { text: "Mezi ___ je obrázek.", num: "pl", any: ["sequencePart"], none: ["line"] }, // mezi stránkami, kapitolami
    { text: "Mezi ___ je velký rozdíl.", num: "pl", any: ["grade"] }, // mezi ročníky, třídami
    { text: "Voní to ___.", any: ["flower"] }, // růží, květinou
    { text: "Stojím pod ___.", any: ["overhead"] }, // pod stromem, mostem, sprchou, deštníkem
    { text: "Nad ___ je půda.", any: ["floor"] }, // nad přízemím, nad patrem
    { text: "Výtah jezdí mezi ___.", num: "pl", all: ["floor", "ordered"] }, // mezi patry (SSČ «s více patry»)
    { text: "Byl jsem tam před pár ___.", num: "pl", any: ["timeUnit", "yearsPlural"] }, // před pár dny, týdny, lety
    { text: "Bojovali jsme se silnými ___.", num: "pl", any: ["strongPl"], plOk: ["strongPl"] }, // «se» — за «silnými», не за відповіддю
    { text: "Balon je naplněný ___.", any: ["air"] }, // vzduchem (SSČ «balon plněný vzduchem»)
    { text: "Spím pod širým ___.", all: ["sky"], none: ["weather"] }, // nebem (SSČ «spát pod širým nebem»)
    { text: "Jedeme na výlet {s} ___.", any: ["grade"] }, // se třídou, s ročníkem
    { text: "Jsem hotový {s} ___.", any: ["sequencePart"], none: ["line"] }, // s kapitolou, se stránkou
    { text: "Pokoj je zalitý ___.", all: ["sky", "weather"] }, // sluncem
    { text: "Hledám hotel s moderními ___.", num: "pl", any: ["room"], none: ["grade"] }, // pokoji, kuchyněmi, koupelnami
    { text: "Hledám hotel s moderními ___.", num: "pl", all: ["overhead", "placeV"] }, // sprchami
    { text: "Jsem spokojený {s} ___.", num: "any", all: ["seat", "ordered"] }, // s místem / místy, se sedadlem / sedadly
    { text: "Za poslední ___ je východ.", all: ["line"] }, // řadou
    { text: "Narodil se pod šťastnou ___.", any: ["nature"], none: ["plant", "sky", "weatherCause"] }, // hvězdou
    { text: "Pomáhám mámě s domácími ___.", num: "pl", any: ["worksPl"] }, // pracemi («s» — за «domácími», не за відповіддю)
  ],
};

// ─────────────────────── ЩО КВІЗ «ВІДМІНКИ» СВІДОМО НЕ ПИТАЄ ───────────────────────
// Два джерела, обидва — правила за тегами (any / all / none, як у фразах) + відмінки + числа + причина, без id слів:
//  • NOUN_USAGE_RULES (utils/partnerSelection.ts) — форми, яких мова не вживає взагалі («ledny», «k patru»). Спільні для
//    ВСІХ квізів: інші квізи теж ніколи не ставлять у них слово-партнер. Факт про слово додається ТАМ.
//  • правила нижче — рішення саме цього квізу: клітинка в мові живе, але тут її не питаємо (кличний речей) або для неї
//    немає природної фрази цього квізу («ve dne», «k roku» — лише з числом). Інші квізи такі форми вживати можуть.
// Рушій (askingSenses у utils/flashcardEngine.ts) і оракул (scripts/check-quiz-coverage.ts) читають NOUN_SKIP_RULES — обидва
// джерела разом (skipReason, utils/quizCommon.ts). Правило читає теги ЗНАЧЕННЯ: у багатозначного слова (поле senses)
// клітинку питаємо, якщо її не прибирає хоч одне значення, і фраза береться саме з такого значення.
// ПРАВИЛА ДОДАВАННЯ
//  1. Новий рядок — лише за рішенням Ніка, з причиною, яку друкує оракул; не замість фрази, якої просто ще немає
//     (клітинку без природної фрази квіз питає без речення).
//  2. Спершу вирішити, куди: мова форму не вживає ніде — NOUN_USAGE_RULES; не вживає лише ця фраза / цей квіз — сюди.
//  3. Рядок не може виключати клітинку, під яку є фраза (dev-збірка попереджає).
//  4. Порожні cases / numbers — усі відмінки / обидва числа.
const NOUNS_QUIZ_SKIPS: SkipRule<NounCell>[] = [
  tagSkip({ none: ["person", "animal"], cases: ["vokativ"], reason: "кличний не-особи (свідоме рішення)" }), // «stole!» — не звертання
  // Слова часу (Нік 2026-10-07): форми живі в інших конструкціях («o večeru», «před jedním dnem», «k roku 2025»),
  // але природної фрази цього квізу для них немає.
  tagSkip({ any: ["daySpan"], none: ["timeUnit"], cases: ["lokal"], numbers: ["sg"], reason: "частини доби: місцевий однини (Нік: «k ránu» — давальний, «v ránu» — ні)" }),
  tagSkip({ any: ["timeUnit"], cases: ["dativ"], reason: "одиниці часу: давальний (Нік: живий лише з числом — «k roku 2025»)" }),
  tagSkip({ all: ["dayPart", "timeUnit"], cases: ["instrumental"], numbers: ["sg"], reason: "den, noc: орудний однини (Нік: лише «dnem i nocí»)" }),
  tagSkip({ all: ["dayPart", "timeUnit"], none: ["timeV"], cases: ["lokal"], numbers: ["sg"], reason: "den: місцевий однини (Нік: «ve dne» — застаріла форма)" }),
  tagSkip({ any: ["air"], cases: ["dativ"], numbers: ["sg"], reason: "vzduch: давальний (Нік: природної фрази немає)" }),
];
export const NOUN_SKIP_RULES: SkipRule<NounCell>[] = [...NOUN_USAGE_RULES, ...NOUNS_QUIZ_SKIPS];
