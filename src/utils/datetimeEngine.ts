import { DateOrdinal, MonthName, CASE_LABELS } from "../types";
import { DATE_ORDINALS, MONTHS } from "../data/dates";
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
    promptLabel: "дата 🇨🇿",
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
    promptLabel: "котра година? 🕐",
    taskText: `Оберіть правильне читання — ${sysLabel}`,
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
    promptLabel: "котра година? 🕐",
    taskText: "Оберіть правильне читання — з уточненням частини доби",
    correct,
    options: shuffle([correct, distractor]),
  };
}


type ComboKind = "date-gen" | "date-nom" | "time" | "daypart";

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

function enumerateCombos(): Combo[] {
  const combos: Combo[] = [];

  // Дати. Обидва режими — gen («коли?», родовий) і nom (дата як підмет речення,
  // «První leden je svátek») — доступні для КОЖНОГО з 31 дня: обмеження на
  // кілька "репрезентативних" днів заважало б узагальненню правила (учень
  // запам'ятав би конкретні приклади, а не саму закономірність "дата-підмет →
  // називний"). Натомість рідкісність nom забезпечує kindQuota нижче (окремий,
  // менший ліміт слотів на раунд для "date-nom" відносно "date-gen") — так
  // зберігаються і повне охоплення днів, і низька частота.
  for (const d of DATE_ORDINALS) {
    for (const mode of ["gen", "nom"] as DateMode[]) {
      combos.push({
        id: comboId(`date-${d.day}`, mode, "x"),
        wordId: `date-${d.day}`,
        kind: mode === "gen" ? "date-gen" : "date-nom",
        make: () => {
          const month = MONTHS[Math.floor(Math.random() * MONTHS.length)];
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
  minSlots: { "date-gen": 3, daypart: 3 },
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
