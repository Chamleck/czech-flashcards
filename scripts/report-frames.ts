// Звіт по фразах квізів: які іменники й якого роду бере кожна фраза і що виключає кожен її тег.
// Інформаційний (код виходу 0): допомагає людині побачити милиці, яких не бачить жоден автоматичний тест.
// Запуск:  npx esbuild scripts/report-frames.ts --bundle --platform=node --format=cjs --charset=utf8 --outfile=node_modules/.report-frames.cjs
//          && node node_modules/.report-frames.cjs [--bank=ordinals|numerals] [--filter=текст фрази]
//
// ЩО ДИВИТИСЬ (правило A5 у docs/ENGINEERING_PRINCIPLES.md):
//  • «роди» — якщо фраза стоїть у називному множини й у ній узгоджується присудок, а родів більше одного, фраза не
//    повинна залежати від роду (теперішній час, прикметник на -í);
//  • «тег X виключає: …» — тег має описувати фразу («Pod ___ je schránka» — space), а не відсівати конкретне слово.
//    Якщо виключене слово фразі цілком підходить — тег милиця; прибери його;
//  • фраза, що бере менше 3 слів, — нормально лише там, де слів із такою властивістю в мові справді мало.

/// <reference types="node" />
import { NOUNS } from "../src/data/nouns";
import { ORDINAL_FRAMES, NUMERAL_FRAMES } from "../src/data/numeralFrames";
import { agreementGender, matchesNeeds, nounSenses } from "../src/utils/partnerSelection";
import type { Needs } from "../src/data/prepositionPartners";
import type { QuizNoun } from "../src/types";

interface BankFrame extends Needs {
  text: string;
  num?: string;
  max?: number;
  standalone?: unknown;
}
const BANKS: Record<string, Record<string, BankFrame[]>> = {
  ordinals: ORDINAL_FRAMES as Record<string, BankFrame[]>,
  numerals: NUMERAL_FRAMES as Record<string, BankFrame[]>,
};

const arg = (name: string) => process.argv.find((a: string) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const bankName = arg("bank") ?? "ordinals";
const filter = arg("filter");
const bank = BANKS[bankName];
if (!bank) {
  console.log(`невідомий банк «${bankName}» (є: ${Object.keys(BANKS).join(", ")})`);
  process.exit(2);
}
// ordinals: іменник мусить мати ordered (правило 1 шапки numeralFrames.ts), тож пул — лише такі слова. Багатозначне слово —
// кожним значенням окремо (nounSenses): у звіті воно стоїть із перекладом значення.
const VIEWS: QuizNoun[] = NOUNS.flatMap(nounSenses);
const POOL: QuizNoun[] = bankName === "ordinals" ? VIEWS.filter((n) => n.sem.includes("ordered")) : VIEWS;
const MULTI_SENSE = new Set(NOUNS.filter((n) => n.senses).map((n) => n.id));
const name = (n: QuizNoun) => (MULTI_SENSE.has(n.id) ? `${n.cz} — ${n.uk}` : n.cz);

// Тег, що відсіює півсловника, — тег класу (person, seat…): його сенс очевидний; малий список — місце, де шукати милицю.
const show = (lost: QuizNoun[]) => (lost.length > 6 ? `${lost.length} слів (тег класу)` : `${lost.map(name).join(", ")}  ← перевір: описує тег фразу, чи відсіює слово?`);

let shown = 0;
for (const [c, frames] of Object.entries(bank)) {
  for (const f of frames) {
    if (filter && !f.text.includes(filter)) continue;
    if (f.standalone) {
      console.log(`${c.slice(0, 3)} | ${f.text} | без іменника`);
      shown++;
      continue;
    }
    const matched = POOL.filter((n) => matchesNeeds(n, f));
    const genders = [...new Set(matched.map((n) => agreementGender(n, f.num === "pl" ? "pl" : "sg")))];
    console.log(`${c.slice(0, 3)} | ${f.text}${f.num ? ` [${f.num}]` : ""}${f.max !== undefined ? ` max ${f.max}` : ""}`);
    console.log(`    слова (${matched.length}): ${matched.map(name).join(", ") || "—"}   роди: ${genders.join(", ") || "—"}`);
    // що виключає кожен тег обов'язкових вимог (all) і заборон (none): слова, що підійшли б без нього
    for (const t of f.all ?? []) {
      const without = { ...f, all: (f.all ?? []).filter((x) => x !== t) };
      const lost = POOL.filter((n) => matchesNeeds(n, without) && !matchesNeeds(n, f));
      if (lost.length) console.log(`    тег «${t}» виключає: ${show(lost)}`);
    }
    for (const t of f.none ?? []) {
      const without = { ...f, none: (f.none ?? []).filter((x) => x !== t) };
      const lost = POOL.filter((n) => matchesNeeds(n, without) && !matchesNeeds(n, f));
      if (lost.length) console.log(`    заборона «${t}» виключає: ${show(lost)}`);
    }
    shown++;
  }
}
console.log(`\nФраз показано: ${shown}`);
