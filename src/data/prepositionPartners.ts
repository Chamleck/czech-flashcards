import type { CzechCase } from "../types";
import type { NounTag } from "./nounTags";

// ─────────────────────────── ФРЕЙМИ Й ПАРТНЕРИ КВІЗУ «ПРИЙМЕННИКИ» ───────────────────────────
// ДАНІ, а не логіка: які фрази є і які іменники в них годяться. Годяться ті, чиї смислові теги (`sem` у
// nouns.ts, словник — data/nounTags.ts) збігаються з вимогою фрейму, тож нове слово з правильними тегами
// потрапляє в усі підхожі фрази САМЕ. Логіка добору — utils/partnerSelection.ts, сам квіз —
// utils/prepositionQuizEngine.ts.
//
// Вимога фрейму (Needs):
//   any: [...] — слово має ХОЧА Б ОДИН з тегів;      all: [...] — слово має ВСІ теги;
//   none: [...] — слово НЕ має жодного з тегів (od rána, але не «od hodiny»);
//   усі поля порожні — без обмежень (будь-який іменник з пулу).
//
// ПРАВИЛА ДОДАВАННЯ ФРАЗ
//  1. Фраза природна для КОЖНОГО іменника під її тегами, у кожному числі, яке дозволяє num; після додавання прочитай
//     усі пари «фраза × слово».
//  2. Прийменник у цьому значенні керує РІВНО одним відмінком, інакше дистрактор теж правильний (рух / спокій —
//     окремо: «Jdu na ___» — знахідний, «Jsem na ___» — місцевий).
//  3. Лише теги, без id слів. Коли жоден тег не відділяє погані пари від добрих — новий тег у data/nounTags.ts.
//  4. Вокалізація {p}: невідома група приголосних — рядок у CLUSTER_RULES за IJP; де IJP фіксує коливання, прийменник
//     у рядку не пишемо — фраза для такого слова свідомо не ставиться.
//  5. Перед здачею — оракул scripts/check-quiz-coverage.ts --only=preps: «Помилок: 0».

export interface Needs {
  any?: NounTag[];
  all?: NounTag[];
  none?: NounTag[];
}

// Яке число: "sg" — однина (слово лише з множиною — peníze, brýle — береться в множині); "pl" — лише множина
// (mezi, «po kolena»); "any" — однина або множина навмання, але множина лише там, де вона природна.
export type NumberPolicy = "sg" | "pl" | "any";

// Фрейм — фраза квізу. Один тип для ВСІХ прийменників (двоїстих, фіксованих, «za» обміну): рушій бере слово
// з тегами, що підходять, і підставляє його форму в «___».
export interface Frame extends Needs {
  text: string; // «{p}» — місце прийменника (з вокалізацією), «___» — пропуск для форми іменника
  num?: NumberPolicy; // за замовчуванням "sg"
}

type Frames = { motion: Frame[]; location: Frame[] };

// Знахідний = напрямок/ціль (рух АБО об'єкт дії: «Jdu na poštu», «Čekám na autobus», «Věřím v tebe»);
// місцевий/орудний = спокій / дія без напрямку. Кожна фраза природна для ВСІХ слів, що підпадають під її теги.
export const DUAL_FRAMES: Record<string, Frames> = {
  "prep-na": {
    motion: [
      { text: "Jdu {p} ___", all: ["placeNa"] },
      { text: "Polož to {p} ___", any: ["surface"], num: "any" },
      { text: "Čekám {p} ___", any: ["person", "vehicle", "meal"], num: "any" },
    ],
    location: [
      { text: "Jsem {p} ___", all: ["placeNa"] },
      { text: "Kniha leží {p} ___", any: ["surface"], num: "any" },
      { text: "Sedím {p} ___", any: ["seat"], num: "any" },
      { text: "Pracuji {p} ___", all: ["workplace", "placeNa"] },
    ],
  },
  "prep-o": {
    motion: [
      { text: "Opřel to {p} ___", any: ["support"], num: "any" },
      { text: "Zakopl {p} ___", any: ["surface", "item"], none: ["opening"], num: "any" }, // не «o okno»
      { text: "Požádal {p} ___", any: ["food", "money", "document", "item"] },
    ],
    location: [
      { text: "Mluvíme {p} ___", num: "any" },
      { text: "Přemýšlím {p} ___", num: "any" },
      { text: "Vím {p} ___", any: ["placeV", "placeNa", "person"], num: "any" },
    ],
  },
  "prep-po": {
    // po + akuzativ = «до якої межі» (po kolena, po ramena): лише частини тіла, множина (idiomatická)
    motion: [
      { text: "Voda sahá {p} ___", any: ["bodyLevel"], num: "pl" },
      { text: "Zapadl až {p} ___", any: ["bodyLevel"], num: "pl" },
      { text: "Sníh mu sahá {p} ___", any: ["bodyLevel"], num: "pl" },
    ],
    location: [
      { text: "Chodím {p} ___", any: ["path", "building"], num: "any" },
      { text: "Odešel {p} ___", any: ["meal", "activity", "timeUnit"], none: ["dayPart"] }, // po obědě, po hodině; не «po dni / po noci»
      { text: "Šel {p} ___", any: ["path"], num: "any" },
    ],
  },
  "prep-v": {
    motion: [
      { text: "Věřím {p} ___", any: ["person"], num: "any" },
      { text: "Proměnil se {p} ___", any: ["animal"] },
      { text: "Doufám {p} ___", any: ["weather"] },
    ],
    location: [
      { text: "Jsem {p} ___", all: ["placeV"] },
      { text: "Bydlím {p} ___", all: ["residence", "placeV"] },
      { text: "Pracuji {p} ___", all: ["workplace", "placeV"] },
    ],
  },
  "prep-nad": {
    motion: [
      { text: "Pověsil to {p} ___", any: ["furniture", "opening"], num: "any" },
      { text: "Letadlo vzlétlo {p} ___", any: ["outdoor", "building"], num: "any" },
    ],
    location: [
      { text: "Obraz visí {p} ___", any: ["furniture", "opening"], num: "any" },
      { text: "Slunce je {p} ___", any: ["outdoor", "building"] },
      { text: "Bydlím {p} ___", any: ["workplace"] },
    ],
  },
  "prep-pod": {
    motion: [
      { text: "Dal to {p} ___", any: ["space"], num: "any" },
      { text: "Vlezl {p} ___", any: ["space"], num: "any" },
      { text: "Schoval se {p} ___", any: ["space"], num: "any" },
    ],
    location: [
      { text: "Boty jsou {p} ___", any: ["space"], num: "any" },
      { text: "Kočka spí {p} ___", any: ["space"], num: "any" },
      { text: "Najdeš to {p} ___", any: ["space"], num: "any" },
    ],
  },
  "prep-pred": {
    motion: [
      { text: "Postavil auto {p} ___", any: ["building"], num: "any" },
      { text: "Zastavil se {p} ___", any: ["building"], num: "any" },
      { text: "Předstoupil {p} ___", any: ["person"] },
    ],
    location: [
      { text: "Auto stojí {p} ___", any: ["building"], num: "any" },
      { text: "Čekám {p} ___", any: ["building"] },
      { text: "Stojí {p} ___", any: ["person", "building"], num: "any" },
    ],
  },
  "prep-za": {
    motion: [
      { text: "Schoval se {p} ___", any: ["building", "space"], num: "any" },
      { text: "Zašel {p} ___", any: ["building"], num: "any" },
      { text: "Dal to {p} ___", any: ["space"], num: "any" },
    ],
    location: [
      { text: "Stojí {p} ___", any: ["building", "space", "person"], num: "any" },
      { text: "Zahrada je {p} ___", any: ["building", "outdoor"] },
      { text: "Bydlí {p} ___", any: ["building"] },
    ],
  },
  "prep-mezi": {
    motion: [
      { text: "Sedl si {p} ___", any: ["person"], num: "pl" },
      { text: "Vložil to {p} ___", any: ["item"], num: "pl" },
      { text: "Vešel {p} ___", any: ["person"], num: "pl" },
    ],
    location: [
      { text: "Sedí {p} ___", any: ["person"], num: "pl" },
      { text: "Je to {p} ___", any: ["outdoor", "building"], num: "pl" },
      { text: "Papír je {p} ___", any: ["item"], num: "pl" },
      { text: "Bydlím {p} ___", any: ["building"], num: "pl" },
    ],
  },
};

// «za» = обмін / ціна (знахідний): те, за що реально платять.
export const EXCHANGE_FRAMES: Frame[] = [{ text: "Zaplatil jsem {p} ___", any: ["food", "meal", "item", "vehicle"], num: "any" }];

// ─────────── Фіксовані прийменники ───────────
// Кожен фіксований прийменник має свої фрейми (той самий механізм, що й у двоїстих). «Вузькі» (do, z, u, k…)
// — коротка фраза «{p} ___»: значення задає тип іменника (do školy, z tašky, k lékaři). «Широкі» (bez, od,
// místo, podle, proti, kvůli, díky, pro, s) — речення, яке задає СМИСЛ («Mám dopis od ___», «Přišel pozdě
// kvůli ___»): гола фраза «kvůli ___» з будь-яким словом давала граматичні, але безглузді «kvůli lžíci».
// kromě — «{p} ___» без обмежень: «крім» природне з будь-яким словом.
// Нове слово з тегами потрапляє у фрази САМЕ; слово без жодного підхожого фрейму з прийменником просто не
// з'являється (безпечно). Новий фрейм — один рядок; dev-збірка попереджає, якщо в ньому < 3 слів.
export const FIXED_FRAMES: Record<string, Frame[]> = {
  // ── вузькі ──
  "prep-do": [{ text: "{p} ___", any: ["placeV", "container", "time", "meal", "activity"], num: "any" }], // do školy, do tašky, do večera
  "prep-z": [{ text: "{p} ___", any: ["placeV", "placeNa", "container"], num: "any" }], // ze školy, z pošty (na poštu → z pošty), z tašky
  "prep-u": [{ text: "{p} ___", any: ["building", "person", "furniture", "opening", "outdoor", "support"], num: "any" }], // u nádraží, u lékaře, u okna, u stolu (не «u polštáře»)
  "prep-vedle": [{ text: "{p} ___", any: ["building", "person", "surface", "opening", "outdoor", "support"], num: "any" }],
  "prep-kolem": [{ text: "{p} ___", any: ["building", "outdoor", "support"], num: "any" }],
  "prep-k": [{ text: "{p} ___", any: ["person", "building", "placeV", "placeNa", "outdoor", "meal"], num: "any" }], // k lékaři, k nádraží, k obědu
  "prep-mimo": [{ text: "{p} ___", any: ["building", "outdoor"] }], // mimo město, mimo školu (не кімнати: «mimo sprchu»)
  "prep-pres": [{ text: "{p} ___", any: ["path", "outdoor", "opening", "timeUnit"], num: "any" }], // přes most, přes týden (не «přes televizi»)
  "prep-skrz": [{ text: "{p} ___", any: ["opening", "outdoor", "weather", "building"], num: "any" }], // skrz okno, skrz déšť (НЕ час: «skrz minutu» — ні)
  "prep-pri": [{ text: "{p} ___", any: ["activity", "meal", "weather"], num: "any" }], // při práci, při obědě, při dešti
  // ── широкі ──
  "prep-bez": [
    { text: "Odešel {p} ___", any: ["carried", "clothes", "money"] }, // bez klíče, bez kabátu, bez peněz
    { text: "Jsem tady {p} ___", any: ["person"], num: "any" }, // bez kamaráda, bez dětí
  ],
  "prep-od": [
    { text: "Mám dopis {p} ___", any: ["person"], num: "any" }, // od mámy, od kamarádů
    { text: "Bydlím kousek {p} ___", any: ["building", "outdoor"] }, // od nádraží, od lesa
    { text: "Čekám tady {p} ___", any: ["time"], none: ["timeUnit"] }, // od rána, od poledne
  ],
  "prep-kromě": [{ text: "{p} ___", num: "any" }],
  "prep-misto": [
    { text: "Přišel {p} ___", any: ["person"] }, // místo otce
    { text: "Vezmi si tohle {p} ___", any: ["clothes", "carried"] }, // místo kabátu, místo tašky
  ],
  "prep-podle": [
    { text: "Řídím se {p} ___", any: ["person"] }, // podle lékaře
    { text: "Poznal jsem ho {p} ___", any: ["clothes"] }, // podle kabátu
  ],
  "prep-proti": [
    { text: "Hraje {p} ___", any: ["person"], num: "any" }, // proti bratrovi, proti klukům
    { text: "Nemám nic {p} ___", any: ["person"], num: "any" }, // proti sousedovi
  ],
  "prep-kvuli": [
    { text: "Přišel pozdě {p} ___", any: ["person", "vehicle"], num: "any" }, // kvůli kamarádovi, kvůli autobusu
    { text: "Zůstal doma {p} ___", any: ["weather", "person"], num: "any" }, // kvůli dešti, kvůli dítěti
  ],
  "prep-diky": [
    { text: "Všechno zvládl {p} ___", any: ["person"], num: "any" }, // díky kamarádovi
    { text: "Dorazil včas {p} ___", any: ["vehicle"] }, // díky metru
  ],
  "prep-pro": [
    { text: "Mám dárek {p} ___", any: ["person"], num: "any" }, // pro mámu, pro děti
    { text: "Jdu {p} ___", any: ["food", "carried"] }, // pro chléb, pro klíč (сходити по щось)
  ],
  "prep-s": [
    { text: "Jdu tam {p} ___", any: ["person"], num: "any" }, // s kamarádem, se ženou, s dětmi
    { text: "Přišel {p} ___", any: ["carried"] }, // s deštníkem, s taškou
  ],
};

// ─────────── Прийменник + особовий займенник (k němu, s ní, bez nich) ───────────
// Після прийменника 3-тя особа бере форму на n- (jemu → k němu, jí → s ní, je → pro ně). Квіз показує фразу з
// прийменником і дає вибрати між формою «після прийм.» (правильна) і формою «без прийм.» того ж займенника —
// обидві з таблиці займенника (data/personalPronouns.ts), нічого не вигадується. Новий відмінок — новий рядок тут.
export interface PronounFrame {
  text: string; // «{p}» — прийменник (з вокалізацією), «___» — форма займенника
  prepId: string; // прийменник, що керує цим відмінком
}
export const PRONOUN_FRAMES: Partial<Record<CzechCase, PronounFrame[]>> = {
  genitiv: [
    { text: "Nepůjdu tam {p} ___", prepId: "prep-bez" }, // bez něho, bez ní, bez nich
    { text: "Mám dopis {p} ___", prepId: "prep-od" }, // od něj, od ní
  ],
  dativ: [{ text: "Jdu {p} ___", prepId: "prep-k" }], // k němu, k ní, k nim
  akuzativ: [
    { text: "Mám dárek {p} ___", prepId: "prep-pro" }, // pro něj, pro ni, pro ně
    { text: "Čekám {p} ___", prepId: "prep-na" }, // na něj, na ni, na ně
  ],
  instrumental: [{ text: "Jdu tam {p} ___", prepId: "prep-s" }], // s ním, s ní, s nimi
};

// ─────────── Вокалізація v→ve, k→ke, s→se, z→ze ───────────
// Правило не механічне (ve škole, ve městě, ale v srdci, v hlavě; ke stolu, ale k mostu), тому кожна початкова
// ГРУПА приголосних явно класифікована; невідома група → слово НЕ береться у фразу з цим прийменником
// (краще пропустити слово, ніж показати «v škole» чи «ve hlavě»). Нова група — додай рядок у CLUSTER_RULES.
export type VocalPrep = "v" | "k" | "s" | "z";
export type VocalDecision = "plain" | "vocal";
const ALL_PLAIN: Partial<Record<VocalPrep, VocalDecision>> = { v: "plain", k: "plain", s: "plain", z: "plain" };
const ALL_VOCAL: Partial<Record<VocalPrep, VocalDecision>> = { v: "vocal", k: "vocal", s: "vocal", z: "vocal" };
const K_VOCAL: Partial<Record<VocalPrep, VocalDecision>> = { v: "plain", k: "vocal", s: "plain", z: "plain" }; // kn-, kl-, kr-, kv-
const S_Z_VOCAL: Partial<Record<VocalPrep, VocalDecision>> = { s: "vocal", z: "vocal" }; // šp-, sm-, zd-…: v/k коливаються
export const CLUSTER_RULES: Record<string, Partial<Record<VocalPrep, VocalDecision>>> = {
  // ніколи не вокалізуються
  br: ALL_PLAIN, bř: ALL_PLAIN, bl: ALL_PLAIN, dr: ALL_PLAIN, hl: ALL_PLAIN, hr: ALL_PLAIN,
  chl: ALL_PLAIN, chr: ALL_PLAIN, pl: ALL_PLAIN, pr: ALL_PLAIN, př: ALL_PLAIN, tr: ALL_PLAIN,
  // k + k-подібні: ke knize, ke květině; v/s/z — без вокалізації (v knize, s knihou)
  kn: K_VOCAL, kl: K_VOCAL, kr: K_VOCAL, // kn: «s knihou» (IJP, id=111)
  // v + v-: ve vlaku
  vl: { v: "vocal", k: "plain", s: "plain", z: "plain" },
  // s-/š-/z-/ž- + приголосний: ve škole, ke stolu, se sněhem, ze sklenice
  st: ALL_VOCAL, str: ALL_VOCAL, stř: ALL_VOCAL, sv: ALL_VOCAL, sl: ALL_VOCAL, sn: ALL_VOCAL,
  skl: ALL_VOCAL, skř: ALL_VOCAL, šk: ALL_VOCAL, zrc: ALL_VOCAL, zv: ALL_VOCAL,
  // v srdci (без вокалізації), але ke srdci, se srdcem, ze srdce
  srdc: { v: "plain", k: "vocal", s: "vocal", z: "vocal" },
  // група з трьох приголосних — вокалізація звичайна (IJP): ve sprše, ke sprše, se sprchou, ze sprchy
  sprch: ALL_VOCAL,
  sprš: ALL_VOCAL,
  // den: ve dni, ke dni, se dnem, ze dne
  dn: ALL_VOCAL,
  // КОЛИВАННЯ (IJP: вокалізація «není jev ustálený»): прийменник без запису в рядку = обидві форми вживані,
  // квіз таку фразу НЕ ставить (не можна перевіряти форму, де правильні обидві). Свідомо, не прогалина.
  // Друга приголосна не r/l — IJP: «ve prospěch vokalizace svědčí úzus», але вжиток коливається:
  dc: {}, // dcera: s dcerou / se dcerou, k dceři / ke dceři
  hv: {}, // hvězda: s hvězdou / se hvězdou
  lž: {}, // lžíce: s lžící / se lžící
  kv: { k: "vocal" }, // květina: ke květině (k + k — завжди); v/s/z коливаються
  hrn: {}, // hrnek: три приголосні — IJP «většinou vokalizujeme», у вжитку й v hrnku
  // pes: ke psu, se psem, ze psa; ve psu / v psu коливається
  ps: { k: "vocal", s: "vocal", z: "vocal" },
  // pták: v/ve, k/ke, s/se, z/ze ptákovi… коливаються всі чотири
  pt: {},
  // tř-: ve třídě, ke třem, se třemi, ze třídy
  tř: ALL_VOCAL,
  // ── Групи з прикметників і займенників (квіз «Прикметники та займенники»), за тими самими правилами IJP id=770 ──
  // друга приголосна l — «předložka se většinou nevokalizuje»: v mladém, k dlouhému, s tlustým, z mladého
  ml: ALL_PLAIN, dl: ALL_PLAIN, tl: ALL_PLAIN,
  // s/z перед š-, ž-, s-, z- — «silná tendence» / та сама приголосна: se špatným, ze žlutého, se smutným, ze zdravého;
  // v/k перед ними — лише тенденція, вжиток коливається → не тестуємо (рядок без v/k)
  šp: S_Z_VOCAL, št: S_Z_VOCAL, šť: S_Z_VOCAL, sm: S_Z_VOCAL, sp: S_Z_VOCAL, zd: S_Z_VOCAL, zk: S_Z_VOCAL,
  žl: { v: "plain", k: "plain", s: "vocal", z: "vocal" }, // ž + l: s/z — схожа приголосна, v/k — друга l
  // та сама приголосна — «vokalizujeme vždy»: ke kterému, ve všem; решта коливається («v/ve kterém», «se/s všemi»)
  kt: { k: "vocal" },
  vš: { v: "vocal" },
  vz: { v: "vocal" }, // vzduch: ve vzduchu (та сама приголосна — завжди); k/s/z коливаються
  // коливання: «v tváři» vedle «ve tváři» (Naše řeč, nase-rec.ujc.cas.cz, стаття 6494); hn- — друга не r/l, лише тенденція
  tv: {},
  hn: {},
};
// Слова на měst- (město): ve městě — усталений виняток; s městem, z města — за загальним правилом (один
// приголосний перед голосним — без вокалізації, IJP); k městu / ke městu коливається → не тестуємо.
export const MEST_RULE: Partial<Record<VocalPrep, VocalDecision>> = { v: "vocal", s: "plain", z: "plain" };

// ─────────── Пари прийменників, що не можуть бути дистракторами одне одному ───────────
// У питанні «обери прийменник за значенням» видно лише переклад і форму слова, без речення. Коли значення двох
// прийменників практично збігаються (через ↔ крізь; причина «kvůli» ↔ «díky»), обидві відповіді підходять — такі
// пари не ставимо поруч. Збіг за СЛОВАМИ перекладу (u/vedle — «біля») відсіюється автоматично в рушії.
export const CONFUSABLE_PREP_PAIRS: [string, string][] = [
  ["prep-pres", "prep-skrz"],
  ["prep-kvuli", "prep-diky"],
];
