// Архітектурний гейт: автоматично перевіряє правила з docs/ENGINEERING_PRINCIPLES.md, які можна перевірити механічно.
// Запуск:  npm run check:arch   (або: npx esbuild scripts/check-architecture.ts --bundle --platform=node --format=cjs
//          --outfile=node_modules/.check-architecture.cjs && node node_modules/.check-architecture.cjs)
//   --update-baseline   записати поточні знахідки як відомий борг (лише з рішення Ніка; список лише скорочується)
//   --verbose           друкувати також відомий борг
//
// ЯК ПРАЦЮЄ «ХРАЩ» (ratchet): нове порушення — ПОМИЛКА (код виходу 1); порушення з scripts/architecture-baseline.json —
// відомий борг, його видно в зведенні, але він не валить перевірку. Видалив борг — рядок із baseline зникає
// (скрипт повідомляє «baseline застарів» і просить оновити), тож борг може лише зменшуватись.
// Правила (ID) — у docs/ENGINEERING_PRINCIPLES.md; тут кожна перевірка підписана тим самим ID.
//
// ЩО ПЕРЕВІРЯЄ:
//  A1  один факт — один дім: однакове тіло функції / ініціалізатор константи / літерал-список у 2+ файлах
//  A2  дані, а не код: фрази з «___» лише в src/data; id слів і леми в рушіях — ні
//  A4  легкість: експорт без жодного споживача (мертвий код)
//  A5  без милиць: @ts-ignore / as any / eslint-disable; однакове число-літерал max: N ≥ 3 разів у банку фраз
//  A6  правила додавання: кожен data-файл зі словами / фразами / тегами має шапку «ПРАВИЛА»
//  A8  шари: utils і data не імпортують components / screens / react-native (виняток — список нижче)
//  A10 мова: російські літери в src (мають бути українська / чеська)
//  A11 один дім для рядків інтерфейсу: той самий UA-літерал у 3+ файлах components / screens
// Те, чого скрипт НЕ бачить (лишається огляду й чек-листу): природність фраз, сенс тегів, вибір патерну сусіда.

/// <reference types="node" />
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
// у зібраному бандлі __dirname — node_modules; перестраховка: шукаємо корінь за package.json
function findRoot(): string {
  let d = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(d, "package.json")) && fs.existsSync(path.join(d, "src"))) return d;
    d = path.dirname(d);
  }
  return ROOT;
}
const REPO = findRoot();
const BASELINE_FILE = path.join(REPO, "scripts", "architecture-baseline.json");
const args = new Set(process.argv.slice(2));

// ───────────────────────── Файли ─────────────────────────
function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}
const rel = (p: string) => path.relative(REPO, p).split(path.sep).join("/");
const read = (p: string) => fs.readFileSync(p, "utf8");

const SRC = walk(path.join(REPO, "src")).map(rel).sort();
const SCRIPTS = fs.readdirSync(path.join(REPO, "scripts")).filter((f) => f.endsWith(".ts")).map((f) => `scripts/${f}`);
const isUtil = (f: string) => f.startsWith("src/utils/");
const isData = (f: string) => f.startsWith("src/data/");
const isUI = (f: string) => f.startsWith("src/components/") || f.startsWith("src/screens/");

// ───────────────────────── Знахідки ─────────────────────────
interface Finding {
  rule: string;
  key: string; // стабільний ключ для baseline (без номерів рядків)
  msg: string;
}
const findings: Finding[] = [];
const add = (rule: string, key: string, msg: string) => findings.push({ rule, key: `${rule}|${key}`, msg: `${rule}: ${msg}` });

// ───────────────────────── Розбір верхнього рівня ─────────────────────────
// Без повного парсера TS: верхньорівневі declaration шукаємо за початком рядка, кінець — за балансом дужок
// (рядки й коментарі відкидаємо, щоб дужки в них не збивали баланс).
function stripNoise(src: string, keepStrings = false): string {
  // коментарі → пробіли тієї ж довжини (позиції не зсуваються); рядкові літерали теж, якщо не keepStrings
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === "/" && n === "/") {
      while (i < src.length && src[i] !== "\n") (out += " "), i++;
    } else if (c === "/" && n === "*") {
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) (out += src[i] === "\n" ? "\n" : " "), i++;
      out += "  ";
      i += 2;
    } else if (c === '"' || c === "'" || c === "`") {
      const q = c;
      out += q;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === "\\") (out += keepStrings ? src.slice(i, i + 2) : "  "), (i += 2);
        else (out += keepStrings || src[i] === "\n" ? src[i] : " "), i++;
      }
      out += q;
      i++;
    } else (out += c), i++;
  }
  return out;
}

interface Decl {
  name: string;
  kind: "function" | "const";
  exported: boolean;
  start: number;
  end: number;
  text: string; // оригінальний текст декларації
  body: string; // без коментарів, стиснуті пробіли — для порівняння
  init: string; // для const: вираз ініціалізатора (стиснутий)
}
function topLevelDecls(file: string): Decl[] {
  const src = read(path.join(REPO, file));
  const clean = stripNoise(src);
  const textual = stripNoise(src, true); // коментарі прибрано, рядки лишились: для порівняння тіл і ініціалізаторів
  const re = /^(export\s+)?(?:async\s+)?(function|const)\s+(\w+)/gm;
  const decls: Decl[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    const start = m.index;
    // кінець: перший «;» чи закриваюча «}» на нульовій глибині після початку
    let depth = 0;
    let end = start;
    let seenBody = false;
    for (let i = start + m[0].length; i < clean.length; i++) {
      const ch = clean[i];
      if (ch === "(" || ch === "{" || ch === "[") (depth++, (seenBody = true));
      else if (ch === ")" || ch === "}" || ch === "]") depth--;
      if (depth === 0) {
        if (ch === ";") {
          end = i + 1;
          break;
        }
        if (ch === "}" && m[2] === "function") {
          end = i + 1;
          break;
        }
        // const без «;» (кінець за порожнім рядком) — рідкість, обмежуємо розумно
        if (ch === "\n" && clean[i + 1] === "\n" && seenBody) {
          end = i;
          break;
        }
      }
      end = i + 1;
    }
    const text = src.slice(start, end);
    const body = textual.slice(start, end).replace(/\s+/g, " ").trim();
    const eq = body.indexOf("=");
    const init = m[2] === "const" && eq >= 0 ? body.slice(eq + 1).trim() : "";
    decls.push({ name: m[3], kind: m[2] as "function" | "const", exported: !!m[1], start, end, text, body, init });
  }
  return decls;
}

// ───────────────────────── A1: один факт — один дім ─────────────────────────
// Нормалізація: імена декларації відкидаємо, лишається тіло. Дублікат = те саме тіло / той самий ініціалізатор у 2+ ФАЙЛАХ.
// Дрібні вирази (< MIN) — не дублікати («const X = 0»). Один файл із двома однаковими — теж помилка, але рідкість.
const MIN_BODY = 70;
function checkDuplicates() {
  const bodies = new Map<string, { file: string; name: string }[]>();
  const inits = new Map<string, { file: string; name: string }[]>();
  const lists = new Map<string, { file: string; name: string }[]>();
  for (const f of SRC) {
    if (f === "src/types/index.ts") continue;
    for (const d of topLevelDecls(f)) {
      if (d.kind === "function") {
        const sig = d.body.replace(new RegExp(`\\b${d.name}\\b`, "g"), "§");
        if (sig.length >= MIN_BODY) (bodies.get(sig) ?? bodies.set(sig, []).get(sig)!).push({ file: f, name: d.name });
      } else if (d.init.length >= 30 && !d.init.startsWith("{") && !d.init.startsWith("[{")) {
        (inits.get(d.init) ?? inits.set(d.init, []).get(d.init)!).push({ file: f, name: d.name });
      }
      // літерал-список коротких рядків (["sg", "pl"], ["masc_anim", …]) — перелік, який має жити в одному місці
      const lm = /^(?:export\s+)?const\s+\w+\s*(?::\s*[^=]+)?=\s*(\[(?:\s*"[^"]{1,24}"\s*,?){2,}\])\s*(?:as\s+\w+(?:\[\])?\s*)?;?$/.exec(d.body.replace(/\s+/g, " "));
      if (lm) {
        const key = lm[1].replace(/\s+/g, "");
        (lists.get(key) ?? lists.set(key, []).get(key)!).push({ file: f, name: d.name });
      }
    }
  }
  const report = (map: Map<string, { file: string; name: string }[]>, what: string) => {
    for (const [sig, locs] of map) {
      const files = new Set(locs.map((l) => l.file));
      if (files.size < 2) continue;
      const names = locs.map((l) => `${l.file}:${l.name}`).sort();
      add("A1", `${what}|${names.join(",")}`, `${what} однаковий у ${files.size} файлах (${names.join(", ")}) — винести в один спільний експорт`);
      void sig;
    }
  };
  report(bodies, "функція");
  report(inits, "ініціалізатор константи");
  report(lists, "літерал-список");
}

// ───────────────────────── A2: дані, а не код ─────────────────────────
function checkDataNotCode() {
  for (const f of SRC.filter(isUtil)) {
    const raw = read(path.join(REPO, f));
    const clean = stripNoise(raw);
    const src = stripNoise(raw, true); // без коментарів: текст у коментарі не є літералом
    // фрази квізу (текст із пропуском «___») живуть у src/data/*Frames.ts, не в рушії
    // Фраза = літерал із «___» і словом (3+ літер) поза ${…}: «Volám ___.». Механічне складання («___» + пунктуація,
    // підстановка {V} / {p}) фразою не є.
    const phraseRe = /(["`])(?:(?!\1)[^\n])*___(?:(?!\1)[^\n])*\1/g;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = phraseRe.exec(src))) {
      const line = src.slice(0, m.index).split("\n").length;
      const lineText = src.split("\n")[line - 1];
      if (/^\s*\/\//.test(lineText)) continue;
      const literal = m[0].replace(/\$\{[^}]*\}/g, "").replace(/\{[A-Za-z]\}/g, "");
      if (/[A-Za-zÀ-ž]{3,}/.test(literal)) n++;
    }
    if (n > 0) add("A2", `phrases|${f}`, `${f}: ${n} рядк. літерал(ів) із «___» у рушії — фрази мають бути даними в src/data/*Frames.ts`);
    // id слів / леми в логіці рушія
    const idRe = /\b(?:id|cz|wordId|noun\.id|n\.id|a\.id|v\.id)\s*===?\s*"[^"]+"/g;
    const hits = clean.match(idRe) ?? [];
    const lits = src.match(/\b(?:id|cz|wordId)\s*===?\s*"[^"]+"/g) ?? [];
    if (lits.length > 0) add("A2", `ids|${f}`, `${f}: порівняння id / леми з літералом (${[...new Set(lits)].slice(0, 3).join("; ")}…) — лексичний факт має бути полем даних`);
    void hits;
  }
}

// ───────────────────────── A4: мертві експорти ─────────────────────────
function checkDeadExports() {
  const texts = new Map<string, string>();
  for (const f of [...SRC, ...SCRIPTS, "App.tsx"]) texts.set(f, read(path.join(REPO, f)));
  for (const f of SRC) {
    if (f === "src/types/index.ts") continue; // типи/enum-и читаються структурно; їх покриває tsc
    const src = texts.get(f)!;
    const re = /^export\s+(?:async\s+)?(?:function|const|class|let)\s+(\w+)/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const name = m[1];
      const word = new RegExp(`\\b${name}\\b`);
      let used = false;
      for (const [g, t] of texts) {
        if (g === f) continue;
        if (word.test(t)) {
          used = true;
          break;
        }
      }
      if (!used) add("A4", `${f}:${name}`, `${f}: експорт «${name}» не має жодного споживача поза файлом — прибрати експорт чи мертвий код`);
    }
  }
}

// ───────────────────────── A5: милиці й магічні числа ─────────────────────────
function checkCrutches() {
  for (const f of [...SRC, ...SCRIPTS]) {
    const src = read(path.join(REPO, f));
    const stripped = src.split("\n").map((l) => (/^\s*\/\//.test(l) ? "" : l)).join("\n");
    if (f.startsWith("scripts/")) continue; // скрипти — власний інструментарій; self-test-фікстури мають право на обхід типів
    const marks: [RegExp, string][] = [
      [/@ts-ignore|@ts-expect-error/g, "@ts-ignore / @ts-expect-error"],
      [/\bas any\b|:\s*any\b/g, "any"],
      [/eslint-disable/g, "eslint-disable"],
    ];
    for (const [re, label] of marks) {
      const n = (stripped.match(re) ?? []).length;
      if (n > 0) add("A5", `${label}|${f}`, `${f}: «${label}» ×${n} — обхід типів приховує крихкість; виправ тип`);
    }
  }
  // число-літерал max: N, що повторюється ≥ 3 разів у файлі банку фраз → іменована константа
  for (const f of SRC.filter((x) => isData(x) && /Frames\.ts$/.test(x))) {
    const src = read(path.join(REPO, f));
    const counts = new Map<string, number>();
    for (const m of src.matchAll(/\bmax:\s*(\d+)\b/g)) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
    for (const [v, n] of counts) if (n >= 3) add("A5", `max|${f}|${v}`, `${f}: «max: ${v}» ×${n} — повторюваний поріг має бути іменованою константою (одне джерело)`);
  }
}

// ───────────────────────── A6: шапки «ПРАВИЛА» ─────────────────────────
// data-файл «отримує» слова / фрази / теги, якщо експортує масив записів чи банк фраз. Перелік ознак — за типами.
function checkRuleHeaders() {
  const RECEIVES = /export const \w+\s*:\s*(?:Record<[^>]*>\s*)?(?:(?:Noun|Adjective|Verb|Pronoun|Adverb|Cardinal|Invariant|PersonalPronoun|ConditionalConjunction|Preposition)Entry\[\]|\w*Frame\w*(?:\[\])?|NounTag\b)/;
  for (const f of SRC.filter(isData)) {
    const src = read(path.join(REPO, f));
    if (!RECEIVES.test(src) && !/Frames\.ts$/.test(f) && !/(^|\/)(nouns|adjectives|verbs|nounTags)\.ts$/.test(f)) continue;
    if (!/ПРАВИЛ/.test(src)) add("A6", f, `${f}: файл приймає слова / фрази / теги, але не має шапки «ПРАВИЛА ДОДАВАННЯ»`);
  }
}

// ───────────────────────── A8: шари ─────────────────────────
// utils і data — чиста логіка й дані: їх можна прогнати в Node без React Native (харнес, оракул, searchIndex).
// Виняток — файли, що за призначенням торкаються платформи; список явний і короткий.
const PLATFORM_ALLOWED = new Set<string>(["src/utils/progress.ts", "src/utils/useSpeech.ts", "src/utils/flashcardWeights.ts", "src/utils/flashcardStats.ts"]);
function checkLayers() {
  for (const f of SRC.filter((x) => isUtil(x) || isData(x))) {
    if (PLATFORM_ALLOWED.has(f)) continue;
    const src = read(path.join(REPO, f));
    for (const m of src.matchAll(/^import[^;]*from\s+"([^"]+)"/gm)) {
      const spec = m[1];
      const bad = /^react-native|^expo|^@react-navigation|^react$/.test(spec) || /\/(components|screens)\//.test(spec) || /^\.\.\/(components|screens)\b/.test(spec);
      // data → components/icons/posEmoji (тільки типи/рядки) — відомий виняток із категорій
      if (bad && !/components\/icons\/(posEmoji|tileEmoji)/.test(spec)) add("A8", `${f}|${spec}`, `${f}: імпорт «${spec}» — utils / data мусять лишатись чистими (без React Native й UI)`);
    }
  }
}

// ───────────────────────── A10: мова ─────────────────────────
// Літери, яких немає ні в українській, ні в чеській (задані кодами нижче), означають витік російської мови: коментар, дані, UI.
const RU_WORDS = /(?<![\u0400-\u04FF])(?:\u043a\u043e\u0442\u043e\u0440\u044b\u0439|\u0435\u0441\u043b\u0438|\u0441\u0435\u0439\u0447\u0430\u0441|\u043d\u0443\u0436\u043d\u043e|\u0447\u0442\u043e\u0431\u044b|\u0441\u043a\u043e\u043b\u044c\u043a\u043e|\u043f\u043e\u0442\u043e\u043c\u0443|\u0442\u043e\u043b\u044c\u043a\u043e|\u043c\u043e\u0436\u043d\u043e|\u043d\u0435\u043b\u044c\u0437\u044f|\u043a\u043e\u0433\u0434\u0430|\u043e\u0447\u0435\u043d\u044c|\u043f\u043e\u044d\u0442\u043e\u043c\u0443)(?![\u0400-\u04FF])/i;
function checkLanguage() {
  for (const f of [...SRC, ...SCRIPTS, "App.tsx"]) {
    const lines = read(path.join(REPO, f)).split("\n");
    const hits: number[] = [];
    lines.forEach((l, i) => /[\u044b\u044d\u0451\u044a\u042b\u042d\u0401\u042a]/.test(l) && hits.push(i + 1));
    // російські слова, що в українській пишуться інакше (список із скіла; розширюється, коли знаходиться новий витік)
    if (f !== "scripts/check-architecture.ts") lines.forEach((l, i) => RU_WORDS.test(l) && !hits.includes(i + 1) && hits.push(i + 1));
    if (hits.length > 0) add("A10", f, `${f}: російські літери у рядках ${hits.slice(0, 5).join(", ")}${hits.length > 5 ? "…" : ""} — витік мови`);
  }
}

// ───────────────────────── A11: рядки інтерфейсу ─────────────────────────
function checkUiStrings() {
  const seen = new Map<string, Set<string>>();
  for (const f of SRC.filter(isUI)) {
    const src = read(path.join(REPO, f));
    for (const m of src.matchAll(/"([А-ЯЇІЄҐа-яїієґ][^"\n]{11,80})"/g)) {
      const line = src.slice(0, m.index).split("\n").pop() ?? "";
      if (/^\s*\/\//.test(line)) continue;
      (seen.get(m[1]) ?? seen.set(m[1], new Set()).get(m[1])!).add(f);
    }
  }
  for (const [s, files] of seen) if (files.size >= 3) add("A11", s, `рядок інтерфейсу «${s.slice(0, 40)}» у ${files.size} файлах (${[...files].map((x) => x.split("/").pop()).join(", ")}) — один дім (groupTitles / спільний компонент)`);
}

// ───────────────────────── Запуск ─────────────────────────
checkDuplicates();
checkDataNotCode();
checkDeadExports();
checkCrutches();
checkRuleHeaders();
checkLayers();
checkLanguage();
checkUiStrings();

const baseline: string[] = fs.existsSync(BASELINE_FILE) ? JSON.parse(read(BASELINE_FILE)).known : [];
const known = new Set(baseline);
const keys = new Set(findings.map((f) => f.key));

if (args.has("--update-baseline")) {
  const next = [...keys].sort();
  fs.writeFileSync(BASELINE_FILE, JSON.stringify({ about: "Відомий архітектурний борг (scripts/check-architecture.ts). Список лише скорочується; новий рядок — лише за рішенням Ніка.", known: next }, null, 2) + "\n");
  console.log(`baseline записано: ${next.length} рядків`);
  process.exit(0);
}

const fresh = findings.filter((f) => !known.has(f.key));
const debt = findings.filter((f) => known.has(f.key));
const stale = baseline.filter((k) => !keys.has(k));

const byRule = (list: Finding[]) => list.reduce<Record<string, number>>((a, f) => ((a[f.rule] = (a[f.rule] ?? 0) + 1), a), {});
console.log(`Проскановано файлів: src ${SRC.length}, scripts ${SCRIPTS.length}`);
if (args.has("--verbose") && debt.length) {
  console.log("\nВідомий борг:");
  for (const f of debt) console.log("  · " + f.msg);
}
if (debt.length) console.log(`\nВідомий борг (baseline): ${debt.length} — ${JSON.stringify(byRule(debt))}`);
if (stale.length) {
  console.log(`\nbaseline застарів (${stale.length} рядків уже виправлено) — онови: npm run check:arch -- --update-baseline`);
  for (const k of stale.slice(0, 10)) console.log("  ✓ " + k);
}
if (fresh.length) {
  console.log(`\nНОВІ порушення (${fresh.length}):`);
  for (const f of fresh) console.log("  ✗ " + f.msg);
  console.log(`\nПомилок: ${fresh.length}`);
  process.exit(1);
}
console.log(`\nПомилок: 0 (відомого боргу: ${debt.length})`);
