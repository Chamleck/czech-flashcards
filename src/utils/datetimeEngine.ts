import { DateOrdinal, MonthName, CASE_LABELS, NounEntry } from "../types";
import { DATE_ORDINALS, MONTHS } from "../data/dates";
import { NOUNS } from "../data/nouns";
import { formal24, colloquial12, dayPart, TimePoint } from "../data/timeforms";
import { MistakeStore, comboId, selectRoundCombos, KindQuota } from "./flashcardWeights";

// ─────────────── Квіз «Час і дата» ───────────────
// Дві підкатегорії в одному пулі (як розділ «Числівники» об'єднує різнотипні
// датасети): «Дати» (обери правильну форму порядкового) і «Час» (обери правильне
// читання години). Контракт питання спільний з рештою рушіїв: рівно
// [correct, distractor], промпт лише про тестоване, comboId для ваг помилок.

export interface DateTimeQuestion {
  comboId: string;
  promptWord: string; // заголовок картки: дата/час цифрами або базове слово
  promptUk: string; // переклад лише тестованого (для часу — порожній)
  promptLabel: string; // підпис над заголовком (не «слово», бо це дата/час)
  taskText: string;
  contextPhrase?: string; // фраза з пропуском (для дат)
  correct: string;
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function firstForm(s: string): string {
  return s.split(" / ")[0];
}

// На відміну від firstForm() — випадково обирає ОДИН із дублетних варіантів
// (для складених дат: аналітичний "dvacátého pátého" АБО злитий "pětadvacátého").
// Раніше квіз тестував лише перший (аналітичний), другий ніколи не з'являвся
// як правильна відповідь — реальний баг, знайдений при перевірці покриття.
function randomForm(s: string): string {
  const forms = s.split(" / ");
  return forms[Math.floor(Math.random() * forms.length)];
}

function collapseVowelLength(s: string): string {
  return s
    .replace(/á/g, "a")
    .replace(/í/g, "i")
    .replace(/é/g, "e")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ů/g, "u")
    .replace(/ý/g, "y")
    .toLowerCase();
}

function usable(correct: string, d: string | null | undefined): d is string {
  return !!d && d !== correct && collapseVowelLength(d) !== collapseVowelLength(correct);
}

// ─────────────── Підкатегорія «Дати» ───────────────
// Тестуємо порядковий-день. Два режими:
//   • gen (звичайний, «коли»): правильно родовий, дистрактор — називний того ж дня.
//   • nom (рідкісний, «дата-підмет»): правильно називний, дистрактор — родовий.
// firstForm() → canonical (аналітичний варіант для складених).
type DateMode = "gen" | "nom";

function buildDateQuestion(d: DateOrdinal, month: MonthName, mode: DateMode): DateTimeQuestion | null {
  // correct — випадковий дублет (аналітичний/злитий, коли є); distractor — канонічна
  // форма ІНШОГО відмінка (не дублет, просто "неправильний відмінок", тому
  // firstForm() тут ще доречний — варіативність потрібна лише для correct).
  const correct = randomForm(mode === "gen" ? d.gen : d.nom);
  const distractor = firstForm(mode === "gen" ? d.nom : d.gen);
  if (!usable(correct, distractor)) return null;

  const monthGen = firstForm(month.gen);
  const monthNom = firstForm(month.nom);
  const lblGen = CASE_LABELS.genitiv;
  const lblNom = CASE_LABELS.nominativ;

  let contextPhrase: string;
  let taskText: string;
  if (mode === "gen") {
    // «___ května» — коли (родовий). Місяць уже в родовому.
    contextPhrase = `___ ${monthGen}`;
    taskText = `Оберіть форму дати: ${lblGen.uk} (${lblGen.cz}) — ${lblGen.question}`;
  } else {
    // «___ je státní svátek» — дата як підмет (називний). Місяць у називному.
    contextPhrase = `___ ${monthNom} je den v kalendáři`;
    taskText = `Дата як підмет речення: ${lblNom.uk} (${lblNom.cz}) — ${lblNom.question}`;
  }

  return {
    comboId: comboId(`date-${d.day}`, mode, "x"),
    promptWord: `${d.day}. ${monthNom}`,
    promptUk: `${d.uk} ${month.uk}`,
    promptLabel: "дата",
    taskText,
    contextPhrase,
    correct,
    options: shuffle([correct, distractor]),
  };
}

// ─────────────── Підкатегорія «Час» ───────────────
// Дано час цифрами → обрати правильне читання. Дистрактор — читання СУМІЖНОГО
// часу (типова помилка: сплутати опорну годину або систему «на/пів»).
// Тестуємо і формальну (24-год), і розмовну (12-год) системи.
type TimeSystem = "formal" | "colloquial";

function fmtDigital(tp: TimePoint): string {
  const mm = tp.m.toString().padStart(2, "0");
  return `${tp.h24}:${mm}`;
}

// Сусідній час для дистрактора (та сама система, суміжна опорна точка).
function neighborTime(tp: TimePoint): TimePoint {
  // Зсув на +1 годину для цілих/чверті/пів (міняє опорну годину — типова плутанина),
  // або на -15 хв для проміжних (інша чверть).
  if (tp.m === 0 || tp.m === 15 || tp.m === 30 || tp.m === 45) {
    const h = (tp.h24 + 1) % 24;
    return { h24: h, m: tp.m };
  }
  return { h24: tp.h24, m: tp.m === 0 ? 0 : tp.m - 5 };
}

function readTime(tp: TimePoint, sys: TimeSystem): string | null {
  const raw = sys === "formal" ? formal24(tp) : colloquial12(tp);
  if (!raw) return null;
  // «Jsou» лише для цілих 2/3/4 годин (dvě/tři/čtyři hodiny); решта — «Je».
  // Стосується обох систем на рівних годинах.
  if (tp.m === 0) {
    const h12 = tp.h24 % 12 === 0 ? 12 : tp.h24 % 12;
    const wholeHour = sys === "colloquial" ? h12 : tp.h24 === 0 ? 24 : tp.h24;
    if (wholeHour >= 2 && wholeHour <= 4) return `Jsou ${raw}`;
  }
  return `Je ${raw}`;
}

function buildTimeQuestion(tp: TimePoint, sys: TimeSystem): DateTimeQuestion | null {
  const correct = readTime(tp, sys);
  if (!correct) return null;
  // Дистрактор — читання сусіднього часу тією самою системою.
  let distractor: string | null = null;
  const cand = neighborTime(tp);
  distractor = readTime(cand, sys);
  if (!usable(correct, distractor)) {
    // запасний: спробувати іншу опорну точку
    const alt = { h24: (tp.h24 + 2) % 24, m: tp.m };
    distractor = readTime(alt, sys);
  }
  if (!usable(correct, distractor)) return null;

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

// ─────────────── Підкатегорія «Дні тижня» ───────────────
// Дні тижня вже існують як NOUNS (category "days", повне відмінювання) —
// перевикористовуємо ті самі записи (uk/cz/akuzativ), не дублюємо дані.
//
// Дві РІЗНІ конструкції, які виглядять схоже, а керуються по-різному
// (звірено джерелами: dspace.cuni.cz, dobryslovnik.cz, dictio.info,
// czechency.org — «Svatba je v sobotu, dnes je čtvrtek» — обидві поруч):
//   • weekday-NAME («Zítra bude čtvrtek») — НАЗИВАННЯ дня, називний, без
//     прийменника. Та сама навичка, що вже тестує загальний квиз «Відмінки» —
//     тут лише природніша подача, тому БЕЗ floor (органічно, як date-nom).
//   • weekday-WHEN («Schůzka je ve čtvrtek») — КОЛИ відбувається подія,
//     прийменник v/ve + знахідний. Це нова навичка (вокалізація v/ve саме
//     для днів), тому з floor — гарантована поява щораунду.
//
// v/ve — ЗАКРИТИЙ список рівно 7 днів, тому просто фіксуємо готову форму,
// а не пишемо загальне регекс-правило: наявний vocalize() в інших рушіях
// перевіряє лише "той самий/парний приголосний" (v перед v/f) — для днів це
// не підійшло б, бо "ve středu"/"ve čtvrtek" починаються на s-/č-, не на v/f.
// Ширше правило "перед збігом приголосних" тут просто зафіксоване як дані,
// а не виведене регексом — безпечніше для закритого списку з 7 елементів.
const WEEKDAY_IDS = ["pondeli", "utery", "streda", "ctvrtek", "patek", "sobota", "nedele"];
const WEEKDAY_PREP: Record<string, "v" | "ve"> = {
  pondeli: "v",
  utery: "v",
  streda: "ve",
  ctvrtek: "ve",
  patek: "v",
  sobota: "v",
  nedele: "v",
};
const WEEKDAYS: NounEntry[] = WEEKDAY_IDS.map((id) => NOUNS.find((n) => n.id === id)!);

// Декоратор — кілька видів речень для різноманіття (не те саме щоразу).
const WEEKDAY_WHEN_FRAMES: string[] = [
  "Schůzka je ___.",
  "Mám narozeniny ___.",
  "Vrátíme se domů ___.",
  "Obchod bude zavřený ___.",
  "Jedeme na výlet ___.",
];
// З датою в контексті — з'єднує вже наявну тему «дати» (родовий) з новою
// навичкою (v/ve). Дата — випадкова й календарно валідна (перевикористовуємо
// DATE_ORDINALS/MONTHS/MAX_DAY_IN_MONTH — той самий фікс, що для date-gen,
// інакше знову ризик «31. února»).
const WEEKDAY_WHEN_DATE_FRAMES: string[] = [
  "Sejdeme se {DATE}, ___.",
  "Přijedu {DATE}, ___.",
  "Narozeniny mám {DATE}, ___.",
];

function randomDateGenPhrase(): string {
  const d = DATE_ORDINALS[Math.floor(Math.random() * DATE_ORDINALS.length)];
  const validMonths = MONTHS.filter((m) => MAX_DAY_IN_MONTH[m.num] >= d.day);
  const month = validMonths[Math.floor(Math.random() * validMonths.length)];
  return `${randomForm(d.gen)} ${firstForm(month.gen)}`;
}

function buildWeekdayWhenQuestion(day: NounEntry): DateTimeQuestion | null {
  const prep = WEEKDAY_PREP[day.id];
  const akuz = firstForm(day.declension.akuzativ.sg);
  const correct = `${prep} ${akuz}`;

  // Два типи дистрактора впереміш: (a) той самий день, неправильна
  // вокалізація (типова помилка — забути ve саме для цього дня); (b) інший
  // день з ЙОГО правильною вокалізацією (типова помилка — переплутати
  // переклад дня). Той самий принцип, що чергування distractorKind
  // "case"/"number" у квизі «Відмінки».
  let distractor: string;
  if (Math.random() < 0.5) {
    const wrongPrep = prep === "v" ? "ve" : "v";
    distractor = `${wrongPrep} ${akuz}`;
  } else {
    const others = WEEKDAYS.filter((d) => d.id !== day.id);
    const other = others[Math.floor(Math.random() * others.length)];
    distractor = `${WEEKDAY_PREP[other.id]} ${firstForm(other.declension.akuzativ.sg)}`;
  }
  if (!usable(correct, distractor)) return null;

  const withDate = Math.random() < 0.5;
  const contextPhrase = withDate
    ? WEEKDAY_WHEN_DATE_FRAMES[Math.floor(Math.random() * WEEKDAY_WHEN_DATE_FRAMES.length)].replace(
        "{DATE}",
        randomDateGenPhrase()
      )
    : WEEKDAY_WHEN_FRAMES[Math.floor(Math.random() * WEEKDAY_WHEN_FRAMES.length)];

  return {
    comboId: comboId("weekday-when", day.id, "x"),
    promptWord: day.uk,
    promptUk: "",
    promptLabel: "день",
    taskText: `Яким днем? Оберіть правильну форму (день + прийменник v/ve) — ${CASE_LABELS.akuzativ.uk} (${CASE_LABELS.akuzativ.cz}) — ${CASE_LABELS.akuzativ.question}`,
    contextPhrase,
    correct,
    options: shuffle([correct, distractor]),
  };
}

const WEEKDAY_NAME_FRAMES: string[] = ["Dnes je ___.", "Zítra bude ___.", "Pozítří bude ___."];

function buildWeekdayNameQuestion(day: NounEntry): DateTimeQuestion | null {
  const correct = firstForm(day.cz);
  const others = WEEKDAYS.filter((d) => d.id !== day.id);
  const other = others[Math.floor(Math.random() * others.length)];
  const distractor = firstForm(other.cz);
  if (!usable(correct, distractor)) return null;

  return {
    comboId: comboId("weekday-name", day.id, "x"),
    promptWord: day.uk,
    promptUk: "",
    promptLabel: "день",
    taskText: `Яким днем? Оберіть форму — ${CASE_LABELS.nominativ.uk} (${CASE_LABELS.nominativ.cz}) — ${CASE_LABELS.nominativ.question}`,
    contextPhrase: WEEKDAY_NAME_FRAMES[Math.floor(Math.random() * WEEKDAY_NAME_FRAMES.length)],
    correct,
    options: shuffle([correct, distractor]),
  };
}

// ─────────────── Підкатегорія «Частина доби» ───────────────
// «Дано час → обери правильно уточнену фразу» (v půl druhé ODPOLEDNE, не RÁNO).
// Дистрактор — та сама фраза з ІНШОЮ частиною доби (реальна помилка: плутати
// ранок/день/вечір при уточненому розмовному часі). Використовуємо лише
// "безпечні" години з середини кожного проміжку (див. dayPart() у timeforms.ts) —
// не беремо години біля межі, де сама межа є предметом суперечки в джерелах.
const DAYPART_SAFE_HOURS = [7, 8, 10, 11, 13, 14, 15, 16, 19, 20, 21, 23, 1, 2, 3];
const DAYPART_ALL: string[] = ["ráno", "dopoledne", "odpoledne", "večer", "v noci"];

function buildDayPartQuestion(tp: TimePoint): DateTimeQuestion | null {
  const bare = readTime(tp, "colloquial");
  if (!bare) return null;
  const correctPart = dayPart(tp.h24);
  const otherParts = DAYPART_ALL.filter((p) => p !== correctPart);
  const wrongPart = otherParts[Math.floor(Math.random() * otherParts.length)];

  const correct = `${bare} ${correctPart}`;
  const distractor = `${bare} ${wrongPart}`;
  if (!usable(correct, distractor)) return null;

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


type ComboKind = "date-gen" | "date-gen-compound" | "date-nom" | "time" | "daypart" | "weekday-when" | "weekday-name";

interface Combo {
  id: string;
  wordId: string;
  kind: ComboKind;
  make: () => DateTimeQuestion | null;
}

// Часи для квіза: цілі, чверті, пів, три чверті + проміжні 5/10-хвилинки.
const TIME_POINTS: TimePoint[] = (() => {
  const pts: TimePoint[] = [];
  // Розмовна система: 12-год діапазон опорних точок. Беремо години 1..12 і
  // характерні хвилини. Формальна — ширший діапазон годин (0..23) з тими ж хв.
  const collMinutes = [0, 15, 30, 45, 25, 40]; // включно проміжні (за X хв пів/три чверті)
  for (let h = 1; h <= 12; h++) {
    for (const m of collMinutes) pts.push({ h24: h, m });
  }
  return pts;
})();

const FORMAL_POINTS: TimePoint[] = (() => {
  const pts: TimePoint[] = [];
  const mins = [0, 15, 20, 30, 45];
  for (let h = 6; h <= 22; h++) {
    for (const m of mins) pts.push({ h24: h, m });
  }
  return pts;
})();

// Точки для «частини доби» — лише безпечні години з середини кожного проміжку
// (DAYPART_SAFE_HOURS вище) × ті самі розмовні хвилини.
const DAYPART_POINTS: TimePoint[] = (() => {
  const pts: TimePoint[] = [];
  const mins = [0, 15, 30, 45];
  for (const h of DAYPART_SAFE_HOURS) {
    for (const m of mins) pts.push({ h24: h, m });
  }
  return pts;
})();

// Максимум днів у місяці (лютий — 29, щоб не виключати рідкісний, але реальний
// 29 лютого; для дня 29 це залишає лютий валідним, для 30/31 — ні).
const MAX_DAY_IN_MONTH: Record<number, number> = {
  1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
  7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
};

function enumerateCombos(): Combo[] {
  const combos: Combo[] = [];

  // Дати. Обидва режими — gen («коли?», родовий) і nom (дата як підмет речення,
  // «První leden je svátek») — доступні для КОЖНОГО з 31 дня: обмеження на
  // кілька "репрезентативних" днів заважало б узагальненню правила (учень
  // запам'ятав би конкретні приклади, а не саму закономірність "дата-підмет →
  // називний"). Натомість рідкісність nom забезпечує kindQuota нижче (окремий,
  // менший ліміт слотів на раунд для "date-nom" відносно "date-gen") — так
  // зберігаються і повне охоплення днів, і низька частота.
  // Складені дні (21–29, 31) мають дублет аналітична/злита форма (перевіряється
  // рандомно 50/50 всередині buildDateQuestion). Виділяємо їх в окремий kind
  // ЛИШЕ для gen-режиму (nom навмисно лишається без floor — рідкісний за
  // задумом), щоб garantувати регулярну появу самого питання про складений
  // день — floor не форсує ЯКИЙ саме варіант (аналітична/злита), лише сам факт
  // появи combo. Знайдено харнессом: без цього злита форма — лише ~51% раундів.
  const COMPOUND_DAYS = new Set([21, 22, 23, 24, 25, 26, 27, 28, 29, 31]);

  for (const d of DATE_ORDINALS) {
    // Місяць обираємо лише серед тих, де такий день календарно можливий —
    // інакше квіз генерував би «31. února» чи «31. dubna» (реальний баг,
    // знайдений на аудиті: місяць раніше обирався незалежно від дня).
    const validMonths = MONTHS.filter((m) => MAX_DAY_IN_MONTH[m.num] >= d.day);
    for (const mode of ["gen", "nom"] as DateMode[]) {
      const kind: ComboKind =
        mode === "nom" ? "date-nom" : COMPOUND_DAYS.has(d.day) ? "date-gen-compound" : "date-gen";
      combos.push({
        id: comboId(`date-${d.day}`, mode, "x"),
        wordId: `date-${d.day}`,
        kind,
        make: () => {
          const month = validMonths[Math.floor(Math.random() * validMonths.length)];
          return buildDateQuestion(d, month, mode);
        },
      });
    }
  }

  // Час — розмовна система.
  for (const tp of TIME_POINTS) {
    combos.push({
      id: comboId(`time-colloquial-${tp.h24}-${tp.m}`, "colloquial", "x"),
      wordId: `time-colloquial-${tp.h24}-${tp.m}`,
      kind: "time",
      make: () => buildTimeQuestion(tp, "colloquial"),
    });
  }
  // Час — формальна система.
  for (const tp of FORMAL_POINTS) {
    combos.push({
      id: comboId(`time-formal-${tp.h24}-${tp.m}`, "formal", "x"),
      wordId: `time-formal-${tp.h24}-${tp.m}`,
      kind: "time",
      make: () => buildTimeQuestion(tp, "formal"),
    });
  }
  // Час — з уточненням частини доби.
  for (const tp of DAYPART_POINTS) {
    combos.push({
      id: comboId(`time-daypart-${tp.h24}-${tp.m}`, "daypart", "x"),
      wordId: `time-daypart-${tp.h24}-${tp.m}`,
      kind: "daypart",
      make: () => buildDayPartQuestion(tp),
    });
  }

  // Дні тижня — weekday-when (нова навичка v/ve) і weekday-name (повторення
  // називного, красивіша подача). Кожен день — окремий combo (як date-${d.day}),
  // щоб вага помилок трекалась per-день: v/ve — 7 незалежних фактів для
  // запам'ятовування (лише středa/čtvrtek потребують ve), не одне правило.
  for (const day of WEEKDAYS) {
    combos.push({
      id: comboId("weekday-when", day.id, "x"),
      wordId: `weekday-when-${day.id}`,
      kind: "weekday-when",
      make: () => buildWeekdayWhenQuestion(day),
    });
    combos.push({
      id: comboId("weekday-name", day.id, "x"),
      wordId: `weekday-name-${day.id}`,
      kind: "weekday-name",
      make: () => buildWeekdayNameQuestion(day),
    });
  }

  return combos;
}

// Гарантована квота на раунд (12 карток): дати й уточнення частини доби —
// значно менші пули за розмовний+формальний час разом, тому без квоти
// пропорційний зважений вибір їх майже витісняє (реальний баг, знайдений на
// тестуванні — «майже всі питання про час, дати рідко»). Той самий механізм,
// що вже застосований для adj-pron квізу.
//
// "date-gen"/"date-nom" — окремі підтипи. Обидва мають ПОВНЕ охоплення (по 31
// дню кожен) — так узагальнюється правило "дата-підмет → називний" на будь-який
// день, а не завчання кількох "репрезентативних" прикладів. Але nom навмисно
// БЕЗ гарантованого мінімуму слотів (на відміну від date-gen і daypart): якщо
// дати квоту, він з'являвся б у 100% раундів, що суперечить самій ідеї
// "рідкісний" (рідкісний = іноді є, іноді немає, а не "завжди присутній, просто
// мало"). Без floor'а nom спирається лише на органічний зважений вибір із
// загального пулу — виміряно: ~53% раундів мають хоч 1 nom-питання, ~16% усіх
// дат — nom.
const DATETIME_KIND_QUOTA: KindQuota<ComboKind> = {
  kindOf: (c) => (c as Combo).kind,
  minSlots: { "date-gen": 2, "date-gen-compound": 1, daypart: 3, "weekday-when": 2 },
};

export function generateDateTimeSession(
  count: number,
  pool: Combo[] = enumerateCombos(),
  mistakes: MistakeStore = {}
): DateTimeQuestion[] {
  const chosen = selectRoundCombos(
    pool,
    mistakes,
    count,
    (c) => c.wordId,
    undefined,
    DATETIME_KIND_QUOTA
  );
  const questions: DateTimeQuestion[] = [];
  for (const c of chosen) {
    const q = c.make();
    if (q) questions.push(q);
  }
  // Якщо якісь make() повернули null (напр. дистрактор збігся) — добираємо з пулу,
  // щоб сесія завжди мала повний розмір, поки є з чого.
  if (questions.length < count) {
    const extra = shuffle(pool);
    for (const c of extra) {
      if (questions.length >= count) break;
      const q = c.make();
      if (q && !questions.some((x) => x.comboId === q.comboId)) questions.push(q);
    }
  }
  return questions;
}
