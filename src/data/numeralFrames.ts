import type { Needs } from "./prepositionPartners";
import type { QuizCase } from "./declensionFrames";

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
