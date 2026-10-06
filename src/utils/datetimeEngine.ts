import { DateOrdinal, CASE_LABELS, NounEntry } from "../types";
import { DATE_ORDINALS, CALENDAR_MONTHS } from "../data/dates";
import { NOUNS } from "../data/nouns";
import { DATE_FRAMES, WEEKDAY_FRAMES, AT_TIME_FRAMES } from "../data/datetimeFrames";
import { colloquial12, colloquialAt, DAY_PARTS, dayPartOf, nonAdjacentParts, timeSentence, TimePoint } from "../data/timeforms";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";
import { firstForm, isUsableDistractor, once, randomOf, shuffle, splitForms, topUpRound } from "./quizCommon";
import { vocalizedGroup } from "./partnerSelection";

// ─────────────── Квіз «Час і дата» ───────────────
// Підкатегорії в одному пулі: «Дати» (форма порядкового), «Час» (читання години: розмовне, офіційне, з частиною
// доби, «v kolik?»), «Дні тижня». Контракт питання спільний з рештою рушіїв: рівно [correct, distractor], промпт
// лише про тестоване, comboId для ваг помилок. Дані: data/dates.ts, data/timeforms.ts, місяці й дні — іменники
// словника (data/nouns.ts), фрази — data/datetimeFrames.ts.

export interface DateTimeQuestion {
  comboId: string;
  promptWord: string; // заголовок картки: дата/час цифрами або базове слово
  promptUk: string; // переклад лише тестованого (для часу — порожній)
  promptLabel: string; // підпис над заголовком (не «слово», бо це дата/час)
  taskText: string;
  contextPhrase?: string; // фраза з пропуском
  correct: string;
  options: string[];
}

const pick = <T>(arr: readonly T[]): T => randomOf(arr)!;

// Місяці, де такий день календарно можливий (інакше «31. února»).
const monthsFor = (day: number) => CALENDAR_MONTHS.filter((m) => m.month.maxDay >= day);

// Дні тижня — іменники словника категорії days (повне відмінювання).
const WEEKDAYS: NounEntry[] = NOUNS.filter((n) => n.category === "days");
const weekdayAkuz = (d: NounEntry) => firstForm(d.declension.akuzativ.sg);

// «pátého května» — дата в родовому для фраз зі слотом {D}: будь-який день, будь-який дублет.
function randomDateGen(): string {
  const d = pick(DATE_ORDINALS);
  return `${pick(splitForms(d.gen))} ${firstForm(pick(monthsFor(d.day)).declension.genitiv.sg)}`;
}

function fillSlots(frame: string, month: NounEntry | null, monthCase: "nominativ" | "genitiv"): string {
  return frame.replace("{M}", month ? firstForm(month.declension[monthCase].sg) : "").replace("{D}", randomDateGen());
}

// ─────────────── Підкатегорія «Дати» ───────────────
// Тестуємо порядковий-день. Два режими:
//   • gen (звичайний, «коли»): правильно родовий, дистрактор — називний того ж дня.
//   • nom (рідкісний, «дата-підмет»): правильно називний, дистрактор — родовий.
// Складені дні мають два варіанти (аналітичний / злитий): правильним буває кожен, дистрактор — у ТОМУ Ж варіанті,
// інакше стиль («pětadvacátého / dvacátý pátý») підказав би відповідь.
type DateMode = "gen" | "nom";

function buildDateQuestion(d: DateOrdinal, mode: DateMode): DateTimeQuestion | null {
  const month = pick(monthsFor(d.day));
  const rightForms = splitForms(mode === "gen" ? d.gen : d.nom);
  const otherForms = splitForms(mode === "gen" ? d.nom : d.gen);
  const idx = Math.floor(Math.random() * rightForms.length);
  const correct = rightForms[idx];
  const distractor = otherForms[Math.min(idx, otherForms.length - 1)];
  if (!isUsableDistractor(correct, distractor, rightForms)) return null;

  const lbl = mode === "gen" ? CASE_LABELS.genitiv : CASE_LABELS.nominativ;
  const taskText =
    mode === "gen"
      ? `Оберіть форму дати: ${lbl.uk} (${lbl.cz}) — ${lbl.question}`
      : `Дата як підмет речення: ${lbl.uk} (${lbl.cz}) — ${lbl.question}`;

  return {
    comboId: comboId(`date-${d.day}`, mode, "x"),
    promptWord: `${d.day}. ${firstForm(month.declension.nominativ.sg)}`,
    promptUk: `${d.uk} ${month.month.ukGen}`, // «п'яте травня»
    promptLabel: "дата",
    taskText,
    contextPhrase: fillSlots(pick(DATE_FRAMES[mode]), month, mode === "gen" ? "genitiv" : "nominativ"),
    correct,
    options: shuffle([correct, distractor]),
  };
}

// ─────────────── Підкатегорія «Час» ───────────────
type TimeSystem = "formal" | "colloquial";

function fmtDigital(tp: TimePoint): string {
  return `${tp.h24}:${tp.m.toString().padStart(2, "0")}`;
}

const shiftHours = (tp: TimePoint, dh: number): TimePoint => ({ h24: (tp.h24 + dh + 24) % 24, m: tp.m });

// Дистрактор — читання ІНШОГО часу тією самою системою (перше, що існує):
//  • розмовна — опора на поточну годину замість наступної (типова помилка: «čtvrt na jednu» для 1:15 — це 0:15);
//  • офіційна — сусідня точка: +1 година для цілих / чвертей / пів, −5 хв для решти; якщо в сусідньої точки немає
//    читання (timeforms: 0:xx, 1:05), — наступна з запасних.
function timeDistractor(tp: TimePoint, sys: TimeSystem, correct: string): string | null {
  const near =
    sys === "colloquial"
      ? [shiftHours(tp, -1)]
      : tp.m % 15 === 0
        ? [shiftHours(tp, 1), shiftHours(tp, -1)]
        : [{ h24: tp.h24, m: tp.m - 5 }, { h24: tp.h24, m: tp.m + 5 }, shiftHours(tp, 1)];
  for (const t of near) {
    const d = timeSentence(t, sys);
    if (isUsableDistractor(correct, d)) return d;
  }
  return null;
}

function buildTimeQuestion(tp: TimePoint, sys: TimeSystem): DateTimeQuestion | null {
  const correct = timeSentence(tp, sys);
  const distractor = correct ? timeDistractor(tp, sys, correct) : null;
  if (!correct || !distractor) return null;
  const sysLabel = sys === "formal" ? "офіційний стиль (24-год)" : "розмовний стиль";
  return {
    comboId: comboId(`time-${sys}-${tp.h24}-${tp.m}`, sys, "x"),
    promptWord: fmtDigital(tp),
    promptUk: "", // час не має «перекладу» — поле лишається порожнім
    promptLabel: "час",
    taskText: `Оберіть правильне читання — ${sysLabel}`,
    correct,
    options: shuffle([correct, distractor]),
  };
}

// «Частина доби»: дано час → обери правильно уточнену фразу (v půl druhé ODPOLEDNE, не RÁNO). Дистрактор — та сама
// фраза з НЕсуміжною частиною доби (суміжну носії інколи вживають, data/timeforms.ts, правило 2).
function buildDayPartQuestion(tp: TimePoint): DateTimeQuestion | null {
  const bare = timeSentence(tp, "colloquial");
  const part = dayPartOf(tp.h24);
  const wrong = randomOf(nonAdjacentParts(part));
  if (!bare || !wrong) return null;
  const correct = `${bare} ${part.phrase}`;
  const distractor = `${bare} ${wrong.phrase}`;
  return {
    comboId: comboId(`time-daypart-${tp.h24}-${tp.m}`, "daypart", "x"),
    promptWord: fmtDigital(tp),
    promptUk: "",
    promptLabel: "час",
    taskText: "Оберіть правильне читання — з уточненням частини доби",
    correct,
    options: shuffle([correct, distractor]),
  };
}

// «V kolik?» — v / ve + час: «ve tři hodiny», «v jednu hodinu», «v půl druhé», «ve čtvrt na pět». Дистрактор —
// реальна помилка: опора на поточну годину («ve čtvrt na jednu» для 1:15), хибна вокалізація («v čtvrt na dvě»,
// «ve pět hodin») або називний замість знахідного («v jedna hodina» — лише там, де вони різні).
function atTimeDistractors(tp: TimePoint): string[] {
  const group = colloquialAt(tp);
  const g = group ? vocalizedGroup("v", group) : null;
  if (!g) return [];
  const out = [g.wrong];
  if (tp.m !== 0) {
    const anchor = colloquialAt(shiftHours(tp, -1));
    const a = anchor ? vocalizedGroup("v", anchor) : null;
    if (a) out.push(a.right);
  }
  const nom = colloquial12(tp);
  if (nom && nom !== group) {
    const n = vocalizedGroup("v", nom);
    if (n) out.push(n.right);
  }
  return out.filter((d) => isUsableDistractor(g.right, d));
}

function buildAtTimeQuestion(tp: TimePoint): DateTimeQuestion | null {
  const group = colloquialAt(tp);
  const g = group ? vocalizedGroup("v", group) : null;
  const distractor = randomOf(atTimeDistractors(tp));
  if (!g || !distractor) return null;
  const lbl = CASE_LABELS.akuzativ;
  return {
    comboId: comboId(`time-at-${tp.h24}-${tp.m}`, "at", "x"),
    promptWord: fmtDigital(tp),
    promptUk: "",
    promptLabel: "час",
    taskText: `V kolik? Оберіть правильну форму (прийменник v/ve + час) — ${lbl.uk} (${lbl.cz})`,
    contextPhrase: pick(AT_TIME_FRAMES),
    correct: g.right,
    options: shuffle([g.right, distractor]),
  };
}

// ─────────────── Підкатегорія «Дні тижня» ───────────────
// Дві РІЗНІ конструкції, які виглядять схоже, а керуються по-різному
// (звірено джерелами: dspace.cuni.cz, dobryslovnik.cz, dictio.info,
// czechency.org — «Svatba je v sobotu, dnes je čtvrtek» — обидві поруч):
//   • weekday-NAME («Zítra bude čtvrtek») — НАЗИВАННЯ дня, називний, без
//     прийменника. Та сама навичка, що вже тестує загальний квиз «Відмінки» —
//     тут лише природніша подача, тому БЕЗ floor (органічно, як date-nom).
//   • weekday-WHEN («Schůzka je ve čtvrtek») — КОЛИ відбувається подія,
//     прийменник v/ve + знахідний. Нова навичка (вокалізація v/ve саме для днів),
//     тому з floor — гарантована поява щораунду. v / ve — за спільними правилами вокалізації (CLUSTER_RULES).
function buildWeekdayWhenQuestion(day: NounEntry): DateTimeQuestion | null {
  const g = vocalizedGroup("v", weekdayAkuz(day));
  if (!g) return null;
  // Два типи дистрактора впереміш: (a) той самий день, хибна вокалізація; (b) інший день з ЙОГО правильною
  // вокалізацією (сплутати переклад дня).
  const other = vocalizedGroup("v", weekdayAkuz(pick(WEEKDAYS.filter((d) => d !== day))));
  const distractor = Math.random() < 0.5 || !other ? g.wrong : other.right;
  if (!isUsableDistractor(g.right, distractor)) return null;
  const lbl = CASE_LABELS.akuzativ;
  return {
    comboId: comboId("weekday-when", day.id, "x"),
    promptWord: day.uk,
    promptUk: "",
    promptLabel: "день",
    taskText: `Яким днем? Оберіть правильну форму (день + прийменник v/ve) — ${lbl.uk} (${lbl.cz}) — ${lbl.question}`,
    contextPhrase: fillSlots(pick(WEEKDAY_FRAMES.when), null, "genitiv"),
    correct: g.right,
    options: shuffle([g.right, distractor]),
  };
}

function buildWeekdayNameQuestion(day: NounEntry): DateTimeQuestion | null {
  const correct = firstForm(day.cz);
  const distractor = firstForm(pick(WEEKDAYS.filter((d) => d !== day)).cz);
  if (!isUsableDistractor(correct, distractor)) return null;
  const lbl = CASE_LABELS.nominativ;
  return {
    comboId: comboId("weekday-name", day.id, "x"),
    promptWord: day.uk,
    promptUk: "",
    promptLabel: "день",
    taskText: `Який день? Оберіть слово — ${lbl.uk} (${lbl.cz}) — ${lbl.question}`,
    contextPhrase: pick(WEEKDAY_FRAMES.name),
    correct,
    options: shuffle([correct, distractor]),
  };
}

// ─────────────── Пул комбінацій ───────────────
type ComboKind =
  | "date-gen"
  | "date-gen-compound"
  | "date-nom"
  | "time-colloquial"
  | "time-formal"
  | "daypart"
  | "at"
  | "weekday-when"
  | "weekday-name";

interface Combo {
  id: string;
  wordId: string;
  kind: ComboKind;
  make: () => DateTimeQuestion | null;
}

const MINUTES_5 = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5 … 55
const QUARTERS = [0, 15, 30, 45];
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1 … 12
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i); // 0 … 23

function enumerateCombos(): Combo[] {
  const combos: Combo[] = [];
  const add = (id: string, kind: ComboKind, make: () => DateTimeQuestion | null) =>
    combos.push({ id, wordId: id.split("::")[0], kind, make });

  // Дати: кожен із 31 дня в обох режимах. Складений день (є дублет аналітичний / злитий) — окремий kind у
  // gen-режимі, щоб питання про нього мало гарантований слот; nom — рідкісний за задумом, без floor.
  for (const d of DATE_ORDINALS) {
    const compound = splitForms(d.gen).length > 1;
    add(comboId(`date-${d.day}`, "gen", "x"), compound ? "date-gen-compound" : "date-gen", () => buildDateQuestion(d, "gen"));
    add(comboId(`date-${d.day}`, "nom", "x"), "date-nom", () => buildDateQuestion(d, "nom"));
  }

  // Час, розмовна система: години 1–12 × кожні 5 хвилин (цілі, чверті, пів, «za pět / deset minut…»).
  // Лише точки, де є читання й дистрактор (data/timeforms.ts вирішує, яке читання існує).
  const timeOk = (tp: TimePoint, sys: TimeSystem) => {
    const c = timeSentence(tp, sys);
    return !!c && timeDistractor(tp, sys, c) !== null;
  };
  for (const h of HOURS_12)
    for (const m of MINUTES_5) {
      const tp = { h24: h, m };
      if (!timeOk(tp, "colloquial")) continue;
      add(comboId(`time-colloquial-${h}-${m}`, "colloquial", "x"), "time-colloquial", () => buildTimeQuestion(tp, "colloquial"));
    }
  // Час, офіційна система: години 0–23 × кожні 5 хвилин, де читання є (без 0:xx і 1:05–4:05 — timeforms.ts).
  for (const h of HOURS_24)
    for (const m of MINUTES_5) {
      const tp = { h24: h, m };
      if (!timeOk(tp, "formal")) continue;
      add(comboId(`time-formal-${h}-${m}`, "formal", "x"), "time-formal", () => buildTimeQuestion(tp, "formal"));
    }
  // Частина доби: години з середини кожної частини (DAY_PARTS.quizHours) × чверті.
  for (const part of DAY_PARTS)
    for (const h of part.quizHours)
      for (const m of QUARTERS) {
        const tp = { h24: h, m };
        add(comboId(`time-daypart-${h}-${m}`, "daypart", "x"), "daypart", () => buildDayPartQuestion(tp));
      }
  // «V kolik?»: години 1–12 × чверті; лише де вокалізацію v / ve класифіковано і є дистрактор.
  for (const h of HOURS_12)
    for (const m of QUARTERS) {
      const tp = { h24: h, m };
      if (atTimeDistractors(tp).length === 0) continue;
      add(comboId(`time-at-${h}-${m}`, "at", "x"), "at", () => buildAtTimeQuestion(tp));
    }

  // Дні тижня — кожен день окремо (v / ve — сім окремих фактів для запам'ятовування, не одне правило).
  for (const day of WEEKDAYS) {
    if (vocalizedGroup("v", weekdayAkuz(day))) {
      combos.push({ id: comboId("weekday-when", day.id, "x"), wordId: `weekday-when-${day.id}`, kind: "weekday-when", make: () => buildWeekdayWhenQuestion(day) });
    }
    combos.push({ id: comboId("weekday-name", day.id, "x"), wordId: `weekday-name-${day.id}`, kind: "weekday-name", make: () => buildWeekdayNameQuestion(day) });
  }

  return combos;
}

// Пул комбінацій залежить лише від даних — будується раз за запуск застосунку.
const defaultCombos = once(enumerateCombos);

// Гарантована квота на раунд (12 карток): дати, частина доби, «v kolik?» і дні тижня — значно менші пули за читання
// часу, тому без квоти пропорційний зважений вибір їх майже витісняє. date-nom і weekday-name навмисно БЕЗ floor —
// рідкісні за задумом (іноді є, іноді немає). Вага пулу (kindWeight) тримає частку читання часу такою, як до
// розширення сітки хвилин (розмовне 72 → 144 комбо, офіційне 85 → 287).
const DATETIME_KIND_QUOTA: KindQuota<ComboKind> = {
  kindOf: (c) => (c as Combo).kind,
  minSlots: { "date-gen": 2, "date-gen-compound": 1, daypart: 2, at: 1, "weekday-when": 2 },
  kindWeight: { "time-colloquial": 0.7, "time-formal": 0.4 },
};

export function generateDateTimeSession(
  count: number,
  pool: Combo[] = defaultCombos(),
  mistakes: MistakeStore = {}
): DateTimeQuestion[] {
  const chosen = selectRoundCombos(pool, mistakes, count, (c) => c.wordId, undefined, DATETIME_KIND_QUOTA);
  const questions: DateTimeQuestion[] = [];
  const take = (c: Combo) => {
    const q = c.make();
    if (q) questions.push(q);
  };
  for (const c of chosen) take(c);
  topUpRound(questions, count, pool, take);
  return questions;
}
