import type { Needs } from "./prepositionPartners";
import type { DeclFrame, QuizCase } from "./declensionFrames";

// ─────────────────────── ФРАЗИ КВІЗУ «ЧИСЛІВНИКИ» ───────────────────────
// ДАНІ, а не логіка. Кожна фраза задає відмінок усієї групи «числівник + іменник» через дієслово чи прийменник
// («Volám ___» — давальний, «Mluvili jsme o ___» — місцевий). Рушій (utils/numeralAgreementEngine.ts) підставляє в
// «___» групу, де пропуск — числівник або іменник:  «Volám [dvěma] kamarádům» / «Volám dvěma [kamarádům]».
// Іменник береться за смисловими тегами (data/nounTags.ts), як у квізах «Прийменники» та «Прикметники та
// займенники»; списків слів тут немає — нове слово з тегами потрапляє в усі підхожі фрази саме.
//
// ПРАВИЛА ДОДАВАННЯ ФРАЗ
//  1. Фраза природна для КОЖНОГО іменника, що підпадає під її теги (any / all / none), і для будь-якої кількості:
//     jeden, dva, pět, dvacet tři, а без max — і sto, tisíc, milion. Незлічувані іменники (uncountable) квіз
//     не бере взагалі.
//  2. {V} — дієслово, що узгоджується з групою в називному: verb = [однина, множина]. Однина — після jeden, pět+,
//     sto…, dvacet jeden; множина — після dva / tři / čtyři, dvacet dva…, dvoje (IJP id=792: «pět mužů přišlo»,
//     «dva muži přišli»). Тому окремих фраз для однини й множини не треба.
//  3. {v} {k} {s} {z} — прийменник перед групою; ve / ke / se / ze вирішує перше слово групи (числівник) за
//     CLUSTER_RULES (data/prepositionPartners.ts). Невідома група приголосних (dv-, čt- з k / s / z; з v вони
//     класифіковані: ve dvou, ve čtyřech) — ця фраза для такого числівника не береться (не вгадуємо «s dvěma» / «se dvěma»).
//     Тому для кожного відмінку й кожного роду, який мають числівники, потрібна й фраза без {v}{k}{s}{z} (před, mezi,
//     bez, do…) — інакше dva / čtyři в цьому відмінку з таким іменником не питаються.
//  4. many: true — лише для кількості від двох (mezi: «mezi dvěma domy», не «mezi jedním domem»).
//     max — найбільша кількість, за якої фраза ще природна (sto, tisíc… мають numeralValue у nouns.ts; прості й
//     складені числівники — до 99). max: 99 — фраза про звичайний досвід однієї людини, де sto / tisíc безглузді
//     («Volám tisíci kamarádům», «Před milionem let jsem tam byl»); max: 1000 — люди й тварини: «Na fotce je sto
//     psů», але не «Znám milion hostů». Без max — і milion / miliarda («Ve městě je milion domů»).
//  5. Після додавання фрази прочитай усі пари «фраза × іменник», що в неї потрапили; тег, що дає безглузду пару,
//     прибери з вимоги. dev-збірка попереджає про фразу, в яку потрапляє менше 3 іменників.

export interface NumeralFrame extends Needs {
  text: string; // «___» — місце групи «числівник + іменник»
  verb?: [string, string]; // для {V}: [однина, множина]
  many?: true;
  max?: number;
}

const BE: [string, string] = ["je", "jsou"];

export const NUMERAL_FRAMES: Record<QuizCase, NumeralFrame[]> = {
  nominativ: [
    { text: "Na fotce {V} ___.", verb: BE, any: ["person", "animal"], max: 1000 },
    { text: "Na stole {V} ___.", verb: BE, any: ["item", "carried"], none: ["furniture", "support", "seat", "clothes"], max: 99 },
    { text: "Ve skříni {V} ___.", verb: BE, any: ["clothes"], max: 99 },
    { text: "Ve městě {V} ___.", verb: BE, any: ["building"] },
    { text: "V pokoji {V} ___.", verb: BE, any: ["furniture"], max: 99 },
    { text: "{V} ještě ___.", verb: ["Zbývá", "Zbývají"], any: ["timeUnit"], max: 99 },
  ],
  akuzativ: [
    { text: "Znám ___.", any: ["person"], max: 1000 },
    { text: "Mám ___.", any: ["animal"], max: 1000 },
    { text: "Mám ___.", any: ["carried", "money"] },
    { text: "Koupil jsem ___.", any: ["item", "food", "clothes"], none: ["support"] },
    // metro (vehicle + placeV) у множині неприродне: «dvě metra»
    { text: "Vidím ___.", any: ["animal", "vehicle"], none: ["placeV"], max: 1000 },
    { text: "Z okna vidím ___.", any: ["building"] },
    { text: "Čekám už ___.", any: ["timeUnit"], max: 99 },
  ],
  genitiv: [
    { text: "Mám dopis od ___.", any: ["person"], max: 99 },
    { text: "Mám fotku ___.", any: ["animal"], max: 1000 },
    { text: "Vrátím se do ___.", any: ["timeUnit"], max: 99 },
    { text: "Cena ___ je vysoká.", any: ["item", "clothes"], none: ["support"] },
    { text: "Vedle ___ je park.", any: ["building"], max: 99 },
  ],
  dativ: [
    { text: "Volám ___.", any: ["person"], max: 99 },
    { text: "Díky ___ jsme to zvládli.", any: ["person"], max: 1000 },
    { text: "Dávám jídlo ___.", any: ["animal"], max: 99 },
    { text: "Naproti ___ je park.", any: ["building"], max: 99 },
    { text: "Přišel jsem pozdě kvůli ___.", any: ["vehicle"], none: ["placeV"], max: 99 },
    { text: "Kvůli ___ jsem se vrátil domů.", any: ["carried"], max: 99 },
    { text: "Kvůli ___ je tu hluk.", any: ["vehicle"], none: ["placeV"] },
  ],
  lokal: [
    { text: "Mluvili jsme o ___.", any: ["person", "animal"], max: 1000 },
    { text: "Psal jsem o ___.", any: ["vehicle", "building"], none: ["placeV"] },
    { text: "Na ___ je skvrna.", any: ["item", "clothes", "carried"], none: ["support", "furniture"], max: 99 },
    { text: "Odešel po ___.", any: ["timeUnit"], max: 99 },
    // metro, práce, škola-діяльність — «byl jsem ve dvou metrech» неприродне
    { text: "Byl jsem {v} ___.", all: ["placeV"], none: ["vehicle", "activity"], max: 99 },
  ],
  instrumental: [
    { text: "Šel jsem tam {s} ___.", any: ["person", "animal"], max: 99 },
    // před / mezi не вокалізуються — люди й тварини в орудному і для dva / čtyři (s + dv-, čt- не класифіковано)
    { text: "Stál jsem před ___.", any: ["person", "animal"], max: 1000 },
    { text: "Seděl jsem mezi ___.", any: ["person"], many: true, max: 1000 },
    { text: "Mezi ___ je park.", any: ["building"], many: true, max: 99 },
    { text: "Je to město {s} ___.", any: ["building"] },
    { text: "Je to farma {s} ___.", any: ["animal"], max: 1000 },
    { text: "Za ___ je les.", any: ["building"], max: 99 },
    { text: "Před ___ jsem tam byl.", any: ["timeUnit"], max: 99 },
    { text: "Přišel {s} ___.", any: ["carried"], none: ["document"], max: 99 },
    // mezi — без вокалізації, тож годиться й для dvěma / čtyřmi / dvojími (група dv-, čt- з s не класифікована)
    { text: "Mezi ___ leží dopis.", any: ["item", "carried", "clothes"], none: ["support", "furniture"], many: true, max: 99 },
  ],
};

// ─────────────────────── ПОРЯДКОВІ ЧИСЛІВНИКИ (první … dvanáctý) ───────────────────────
// Свій банк фраз квізу «Числівники» для порядкових; механізм — той самий, що в квізі «Прикметники та займенники»
// (adjectiveTableUnits у utils/declensionFlashcardEngine.ts): у «___» стає група «порядковий + іменник», пропуск — на
// порядковому, дистрактор — інша форма того ж порядкового. Тип фрази — DeclFrame (правила 1–2 шапки
// data/declensionFrames.ts: число, {v}{k}{s}{z}). Фрази квізу «Прикметники та займенники» сюди не годяться: з
// порядковим вони граматичні, але безглузді («od jejího dvanáctého manžela», «tvé jedenácté oko»).
//
// ПРАВИЛА ДОДАВАННЯ ФРАЗ З ПОРЯДКОВИМИ
//  1. Іменник — лише з тегом ordered (рахується по порядку: den, vlak, patro, host; data/nounTags.ts), тож кожна фраза
//     має all: ["ordered", …]. Фраза природна для КОЖНОГО такого іменника під її тегами й для КОЖНОГО порядкового
//     první … dvanáctý.
//  2. max — найбільше value порядкового, з яким фраза ще природна. Множина порядкових природна майже лише з první
//     («V prvních dnech to bylo těžké», «první hosté»), тож множинні фрази мають max: 1; інші порядкові в множині
//     питаються без речення. Транспорт — max: 3 (první / druhý / třetí vlak дня; «jedenáctým autobusem» — ні:
//     номер лінії кажуть інакше, «autobusem číslo jedenáct»).
//  3. Множина одиниць часу — через plOk: ["timeUnit"] (загальне правило pluralNatural її не дає).
//  4. Клітинка без жодної фрази питається без речення (повне покриття), тож фраза потрібна не для покриття, а для
//     природного контексту. Після додавання прочитай усі пари «фраза × іменник × порядковий» і запусти оракул
//     scripts/check-quiz-coverage.ts --only=numerals: «Помилок: 0».
export const ORDINAL_FRAMES: Record<QuizCase, DeclFrame[]> = {
  nominativ: [
    // без «už»: «To je už první den» суперечить собі
    { text: "Tohle je ___.", num: "sg", all: ["ordered"], none: ["vehicle"] }, // tohle je třetí den / páté patro
    { text: "Tohle je ___.", num: "sg", max: 3, all: ["ordered", "vehicle"] }, // tohle je druhý vlak
    { text: "Kde je ___?", num: "sg", all: ["ordered"], none: ["time", "vehicle"] }, // kde je třetí patro / druhý host
    { text: "Tohle jsou ___.", num: "pl", max: 1, all: ["ordered"], none: ["residence", "building", "path"], plOk: ["timeUnit"] }, // první hosté, první dny
  ],
  genitiv: [
    { text: "Od ___ tu pracuji.", all: ["ordered", "timeUnit"] }, // od prvního dne, od druhého týdne
    { text: "Šel jsem do ___.", all: ["ordered", "placeV"] }, // do třetího patra, do druhého obchodu
    { text: "Vystoupil jsem {z} ___.", max: 3, all: ["ordered", "vehicle"] }, // z prvního vlaku, ze třetího autobusu
    { text: "Zahnul jsem do ___.", all: ["ordered", "path"] }, // do druhé ulice
    { text: "Mám dárek od ___.", all: ["ordered", "person"] }, // od prvního hosta
    { text: "Během ___ se toho hodně stalo.", num: "pl", max: 1, all: ["ordered", "timeUnit"], plOk: ["timeUnit"] }, // během prvních dnů
  ],
  dativ: [
    { text: "Dal jsem klíč ___.", all: ["ordered", "person"] }, // prvnímu hostovi
    { text: "Došel jsem {k} ___.", all: ["ordered"], any: ["building", "path"] }, // k druhému domu, ke třetí ulici
    { text: "Díky ___ jsem to stihl.", max: 3, all: ["ordered", "vehicle"] }, // díky prvnímu vlaku
  ],
  akuzativ: [
    { text: "Jsem tu teprve ___.", all: ["ordered", "timeUnit"] }, // teprve první den, teprve druhou hodinu
    { text: "Čekám na ___.", all: ["ordered", "person"] }, // na prvního hosta, na pátého žáka
    { text: "Čekám na ___.", max: 3, all: ["ordered", "vehicle"] }, // na druhý vlak
    { text: "Pamatuju si ___.", num: "pl", max: 1, all: ["ordered"], any: ["timeUnit", "person"], plOk: ["timeUnit"] }, // první dny, první hosty
  ],
  lokal: [
    { text: "Bydlím {v} ___.", all: ["ordered", "residence"] }, // ve třetím patře, v druhém domě
    { text: "{v} ___ se toho hodně stalo.", all: ["ordered", "timeUnit"], none: ["dayPart"] }, // v prvním týdnu, v druhém roce
    { text: "Mluvili jsme o ___.", all: ["ordered", "person"] }, // o prvním hostovi
    { text: "{v} ___ to bylo těžké.", num: "pl", max: 1, all: ["ordered", "timeUnit"], plOk: ["timeUnit"] }, // v prvních dnech
  ],
  instrumental: [
    { text: "Jedu ___.", max: 3, all: ["ordered", "vehicle"] }, // prvním vlakem, druhým autobusem
    { text: "Za ___ je park.", all: ["ordered"], any: ["building", "path"] }, // za třetím domem, za druhou ulicí
    { text: "Mluvil jsem {s} ___.", all: ["ordered", "person"] }, // s prvním hostem, se třetím studentem
    { text: "Mluvil jsem {s} ___.", num: "pl", max: 1, all: ["ordered", "person"] }, // s prvními hosty
  ],
};
