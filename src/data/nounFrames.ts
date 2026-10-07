import type { CzechCase } from "../types";
import type { Needs, NumberPolicy } from "./prepositionPartners";
import type { NounTag } from "./nounTags";

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
//  1. Фраза природна для КОЖНОГО іменника, що підпадає під її теги (any / all / none), у кожному числі, яке
//     дозволяє num: "sg" (за замовчуванням) — однина, а слова лише з множиною (peníze, brýle) і парні речі
//     (boty — тег paired) беруться в ній і в множині; "pl" — лише множина; "any" — обидва числа. Множину
//     незлічуваних слів (uncountable: voda, maso) і збірних (collective: rodina) рушій у фрази не ставить.
//  2. Дієслово чи прийменник фрази керує в цьому значенні РІВНО ОДНИМ відмінком, інакше дистрактор теж буде
//     правильним: не «volat» (volám kamaráda / kamarádovi), не «na / o / za / před» там, де можливий і знахідний
//     («Postav to před dům»), не «s» із родовим («s kopce»). Тому: «Jsem na ___» (спокій, місцевий), «Jdu na ___»
//     (рух, знахідний), «Stojím před ___» (спокій, орудний).
//  3. Число у фразі не перевіряється (підпис завдання каже «однина / множина»), але дієслово, що узгоджується з
//     іменником у називному, має відповідати num: «To jsou ___» — лише "pl".
//  4. {v} {k} {s} {z} — прийменник перед пропуском; ve / ke / se / ze за формою відповіді (CLUSTER_RULES у
//     data/prepositionPartners.ts). Обидві кнопки мусять мати однаковий прийменник; невідома група приголосних —
//     фраза для цієї форми не береться (не вгадуємо).
//  5. Кличний — лише для осіб і тварин (теги person / animal): звертання до речі («stole!») квіз не питає.
//  6. Після додавання фрази прочитай усі пари «фраза × іменник», що в неї потрапили; тег, що дає безглузду пару,
//     прибери з вимоги. dev-збірка попереджає про фразу, в яку потрапляє менше 3 іменників.
//  7. plOk — теги, для яких У ЦІЙ фразі природна множина, хоча за правилом 1 її немає: збірне rodina стоїть у
//     множині лише там, де «кілька родин» звучить природно («Mluvím s rodinami», «Přišlo hodně rodin»), а не в
//     «Mám dárek od ___» («od rodin» — ні). Фраза мусить дозволяти множину (num "any" чи "pl"); незлічувані
//     (uncountable) множини не отримують і тут. Механізм той самий, що в квізах «Прийменники» й «Прикметники та
//     займенники» (поле plOk їхніх фраз).

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
    { text: "Utíkají ___.", num: "pl", any: ["timeUnit"] }, // utíkají dny, roky, hodiny
  ],
  genitiv: [
    { text: "Bojím se ___.", num: "any", any: ["person", "animal"] },
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
    { text: "Během ___ jsme mluvili.", num: "any", any: ["meal"] }, // během oběda, během obědů (множина — у recurring)
    { text: "Přišlo hodně ___.", num: "pl", any: ["person"], plOk: ["collective"] }, // hodně lidí, dětí, rodin
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
  ],
  vokativ: [
    { text: "Děkuju, ___!", num: "any", any: ["person"] },
    { text: "Ahoj, ___!", num: "any", any: ["animal"] }, // ahoj, pse; ahoj, kočky
  ],
  lokal: [
    { text: "Mluvíme o ___.", num: "any", none: ["time", "weather"], plOk: ["collective"] }, // o rodinách
    { text: "Mluvíme o ___.", any: ["weather"] }, // o dešti; «o sluncích» — ні
    { text: "Čtu o ___.", num: "any", none: ["time", "weather"] },
    { text: "Jsem {v} ___.", any: ["placeV"] },
    { text: "Jsem na ___.", any: ["placeNa"] },
    { text: "Stojím {v} ___.", any: ["line"] }, // v řadě (у черзі)
    { text: "Po ___ se vrátím.", any: ["meal", "time"], none: ["dayPart"] }, // po obědě, po roce, po pondělí, po létě
    { text: "V posledních ___ se to změnilo.", num: "pl", any: ["timeUnit"] }, // v posledních týdnech
    { text: "Sedím na ___.", any: ["seat"] },
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
    { text: "Mám problém {s} ___.", any: ["body", "item", "vehicle", "money", "activity", "person"] }, // s autem, s prací
    { text: "Mám problém {s} ___.", num: "pl", any: ["bodyLevel", "bodyMany", "item", "person", "vehicle"], none: ["placeV", "singleLevel"] }, // s očima, se zuby, s klíči
    { text: "Jsem spokojený {s} ___.", any: ["abstract", "activity", "meal"] }, // s cenou, s prací
    { text: "Jsem spokojený {s} ___.", num: "pl", any: ["recurring", "abstract"], none: ["weather"] }, // s lekcemi, s obědy, s cenami
    { text: "Cestuju ___.", all: ["vehicle", "container"] }, // vlakem, autem (не «kolem» — читається як «навколо»)
    { text: "Co budeš dělat {s} ___?", num: "any", any: ["animal", "furniture", ...THINGS, "food"] },
    { text: "Byl jsem tam před ___.", num: "any", any: ["timeUnit"], none: ["dayPart"] }, // před hodinou, před lety
    { text: "Vrátím se před ___.", any: ["meal", "time"], none: ["timeUnit"] }, // před obědem, před pondělím
    { text: "Mezi ___ je chodba.", num: "pl", all: ["room", "ordered"] }, // mezi pokoji, třídami
    { text: "Je to pod ___.", num: "any", any: ["item"] }, // pod lžící, pod hrnky (s + lž- / hrn- коливається)
    { text: "Mezi ___ je ulička.", num: "pl", all: ["ordered"], any: ["seat", "line"], none: ["placeNa"] }, // mezi sedadly, řadami (SSČ)
    { text: "Mezi ___ je obrázek.", num: "pl", any: ["sequencePart"], none: ["line"] }, // mezi stránkami, kapitolami
    { text: "Mezi ___ je velký rozdíl.", num: "pl", any: ["grade"] }, // mezi ročníky, třídami
    { text: "Voní to ___.", any: ["flower"] }, // růží, květinou
    { text: "Stojím pod ___.", any: ["overhead"] }, // pod stromem, mostem, sprchou, deštníkem
    { text: "Nad ___ je půda.", any: ["floor"] }, // nad přízemím, nad patrem
    { text: "Výtah jezdí mezi ___.", num: "pl", all: ["floor", "ordered"] }, // mezi patry (SSČ «s více patry»)
  ],
};
