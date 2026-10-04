import type { NounTag } from "./nounTags";

// ─────────────────────────── ФРЕЙМИ Й ПАРТНЕРИ КВІЗУ «ПРИЙМЕННИКИ» ───────────────────────────
// ДАНІ, а не логіка: які фрази є і які іменники в них годяться. Годяться ті, чиї смислові теги (`sem` у
// nouns.ts, словник — data/nounTags.ts) збігаються з вимогою фрейму, тож нове слово з правильними тегами
// потрапляє в усі підхожі фрази САМЕ. Логіка добору — utils/partnerSelection.ts, сам квіз —
// utils/prepositionQuizEngine.ts.
//
// Вимога фрейму (Needs):
//   any: [...] — слово має ХОЧА Б ОДИН з тегів;      all: [...] — слово має ВСІ теги;
//   обидва поля порожні — без обмежень (будь-який іменник з пулу).

export interface Needs {
  any?: NounTag[];
  all?: NounTag[];
}

// Яке число: "sg" — однина (слово лише з множиною — peníze, brýle — береться в множині); "pl" — лише множина
// (mezi, «po kolena»); "any" — однина або множина навмання, але множина лише там, де вона природна.
export type NumberPolicy = "sg" | "pl" | "any";

export interface DualFrame extends Needs {
  text: string; // «{p}» — місце прийменника (з вокалізацією), «___» — пропуск для форми іменника
  num?: NumberPolicy; // за замовчуванням "sg"
}

type Frames = { motion: DualFrame[]; location: DualFrame[] };

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
      { text: "Zakopl {p} ___", any: ["surface", "item"], num: "any" },
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
      { text: "Přijdu {p} ___", any: ["meal", "activity", "timeUnit"] },
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
export const EXCHANGE_FRAMES: DualFrame[] = [{ text: "Zaplatil jsem {p} ___", any: ["food", "meal", "item", "vehicle"], num: "any" }];

// ─────────── Фіксовані прийменники ───────────
// «Вузькі» (значення залежить від типу іменника): партнер — лише зі слів з потрібними тегами.
export const FIXED_NEEDS: Record<string, Needs> = {
  "prep-do": { any: ["placeV", "container", "time", "meal", "activity"] }, // do školy, do tašky, do večera
  "prep-z": { any: ["placeV", "container"] }, // ze školy, z tašky
  "prep-u": { any: ["building", "person", "surface", "opening", "outdoor", "support"] }, // u nádraží, u lékaře, u okna
  "prep-vedle": { any: ["building", "person", "surface", "opening", "outdoor", "support"] },
  "prep-kolem": { any: ["building", "outdoor", "support"] },
  "prep-k": { any: ["person", "building", "placeV", "placeNa", "outdoor", "meal"] }, // k lékaři, k nádraží, k obědu
  "prep-mimo": { any: ["placeV", "placeNa", "building", "outdoor"] }, // mimo město
  "prep-pres": { any: ["path", "outdoor", "furniture", "opening", "timeUnit"] }, // přes most, přes týden
  "prep-skrz": { any: ["opening", "outdoor", "weather", "timeUnit", "building"] }, // skrz okno, skrz noc
  "prep-pri": { any: ["activity", "meal", "weather"] }, // při práci, při obědě, při dešti
};
// «Широкі» (bez, od, kromě, místo, podle, proti, kvůli, díky, pro, s): будь-який іменник з пулу, крім класів,
// після яких вони безглузді.
export const FIXED_EXCLUDE: Record<string, NounTag[]> = {
  "prep-podle": ["time", "body"],
  "prep-proti": ["time"],
  "prep-kvuli": ["time"],
  "prep-diky": ["time"],
  "prep-s": ["time"],
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
export const CLUSTER_RULES: Record<string, Partial<Record<VocalPrep, VocalDecision>>> = {
  // ніколи не вокалізуються
  br: ALL_PLAIN, bř: ALL_PLAIN, bl: ALL_PLAIN, dr: ALL_PLAIN, hl: ALL_PLAIN, hr: ALL_PLAIN, hrn: ALL_PLAIN,
  hv: ALL_PLAIN, chl: ALL_PLAIN, chr: ALL_PLAIN, lž: ALL_PLAIN, pl: ALL_PLAIN, pr: ALL_PLAIN, př: ALL_PLAIN, tr: ALL_PLAIN,
  // k + k-подібні: ke knize, ke květině; v/s/z — без вокалізації (v knize, s knihou)
  kn: K_VOCAL, kl: K_VOCAL, kr: K_VOCAL, kv: K_VOCAL,
  // v + v-: ve vlaku
  vl: { v: "vocal", k: "plain", s: "plain", z: "plain" },
  // s-/š-/z-/ž- + приголосний: ve škole, ke stolu, se sněhem, ze sklenice
  st: ALL_VOCAL, str: ALL_VOCAL, stř: ALL_VOCAL, sv: ALL_VOCAL, sl: ALL_VOCAL, sn: ALL_VOCAL,
  skl: ALL_VOCAL, skř: ALL_VOCAL, šk: ALL_VOCAL, zrc: ALL_VOCAL, zv: ALL_VOCAL,
  // v srdci (без вокалізації), але ke srdci, se srdcem, ze srdce
  srdc: { v: "plain", k: "vocal", s: "vocal", z: "vocal" },
  sprch: { k: "vocal", s: "vocal", z: "vocal" }, // «ve sprše» не класифіковано → у фразі з v слово пропускається
  sprš: { k: "vocal", s: "vocal", z: "vocal" },
  // den: ve dni, ke dni, se dnem, ze dne
  dn: ALL_VOCAL,
  // dcera: v dceři, s dcerou, z dcery (ke dceři/k dceři коливається → пропуск)
  dc: { v: "plain", s: "plain", z: "plain" },
  // pes: ke psu, se psem, ze psa (ve psu/v psu коливається → пропуск)
  ps: { k: "vocal", s: "vocal", z: "vocal" },
  // tř-: ve třídě, ke třem, se třemi, ze třídy
  tř: ALL_VOCAL,
};
// Слова на měst- (město): ve městě, ke městu, z města; «se městem» не класифіковано.
export const MEST_RULE: Partial<Record<VocalPrep, VocalDecision>> = { v: "vocal", k: "vocal", z: "plain" };

// ─────────── Пари прийменників, що не можуть бути дистракторами одне одному ───────────
// У питанні «обери прийменник за значенням» видно лише переклад і форму слова, без речення. Коли значення двох
// прийменників практично збігаються (через ↔ крізь; причина «kvůli» ↔ «díky»), обидві відповіді підходять — такі
// пари не ставимо поруч. Збіг за СЛОВАМИ перекладу (u/vedle — «біля») відсіюється автоматично в рушії.
export const CONFUSABLE_PREP_PAIRS: [string, string][] = [
  ["prep-pres", "prep-skrz"],
  ["prep-kvuli", "prep-diky"],
];
