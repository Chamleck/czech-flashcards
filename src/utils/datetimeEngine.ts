import { DateOrdinal, MonthName, CASE_LABELS } from "../types";
import { DATE_ORDINALS, MONTHS } from "../data/dates";
import { formal24, colloquial12, TimePoint } from "../data/timeforms";
import { MistakeStore, comboId, selectRoundCombos } from "./flashcardWeights";

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
  const genForm = firstForm(d.gen);
  const nomForm = firstForm(d.nom);
  const correct = mode === "gen" ? genForm : nomForm;
  const distractor = mode === "gen" ? nomForm : genForm;
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

// ─────────────── Пул комбінацій ───────────────
interface Combo {
  id: string;
  wordId: string;
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

function enumerateCombos(): Combo[] {
  const combos: Combo[] = [];

  // Дати: кожен день × режим (gen переважає, nom рідкісний). Місяць — випадковий
  // при генерації (не впливає на ваги: вага рахується на день+режим).
  for (const d of DATE_ORDINALS) {
    for (const mode of ["gen", "nom"] as DateMode[]) {
      combos.push({
        id: comboId(`date-${d.day}`, mode, "x"),
        wordId: `date-${d.day}`,
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
      make: () => buildTimeQuestion(tp, "colloquial"),
    });
  }
  // Час — формальна система.
  for (const tp of FORMAL_POINTS) {
    combos.push({
      id: comboId(`time-formal-${tp.h24}-${tp.m}`, "formal", "x"),
      wordId: `time-formal-${tp.h24}-${tp.m}`,
      make: () => buildTimeQuestion(tp, "formal"),
    });
  }

  return combos;
}

export function generateDateTimeSession(
  count: number,
  pool: Combo[] = enumerateCombos(),
  mistakes: MistakeStore = {}
): DateTimeQuestion[] {
  const chosen = selectRoundCombos(pool, mistakes, count, (c) => c.wordId);
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
