import type { GrammaticalNumber } from "../types";

// ─────────────── Спільні допоміжні функції квізів (усі 7 движків) ───────────────
// Чисті функції без стану, крім кешів-запам'ятовувань нижче (лише прискорення, результат той самий).

// ─────────────── Свідомі винятки: що квіз НЕ питає ───────────────
// Кожне рішення «цю клітинку (чи це слово) квіз свідомо не питає» — одне правило в data-файлі свого квізу, з причиною.
// Рушій питає лише те, для чого skipReason дає null; оракул (scripts/check-quiz-coverage.ts) бере ТІ САМІ правила й
// друкує причину як виняток. Тож рішення записане один раз: ні в коді рушія, ні в оракулі його не повторюють.
// Правило перевіряє лише дані (теги, поля слова), без id слів. Структурне — форми немає («—»), заголовок картки,
// дистрактора немає — не рішення, а відсутність питання; його перевіряє сам рушій.
export interface SkipRule<C> {
  reason: string; // що й чому не питаємо (друкує оракул)
  applies: (cell: C) => boolean;
}
export function skipReason<C>(rules: readonly SkipRule<C>[], cell: C): string | null {
  for (const r of rules) if (r.applies(cell)) return r.reason;
  return null;
}

// Перемішування Фішера–Єйтса (нова копія масиву).
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Випадковий елемент масиву; порожній масив → null.
export function randomOf<T>(arr: readonly T[]): T | null {
  return arr.length === 0 ? null : arr[Math.floor(Math.random() * arr.length)];
}

// Дві форми, що різняться ЛИШЕ довготою голосної (i/í, u/ů, e/é, a/á, o/ó, y/ý), на малому екрані виглядають майже
// однаково (růži / růží): як варіанти квізу вони сприймаються як «два однакових», тож дистрактор має відрізнятися
// від правильної відповіді й візуально. Результат запам'ятовується: функцію викликають десятки тисяч разів на тих
// самих формах словника.
const collapsed = new Map<string, string>();
export function collapseVowelLength(s: string): string {
  let r = collapsed.get(s);
  if (r === undefined) {
    r = s
      .replace(/á/g, "a")
      .replace(/í/g, "i")
      .replace(/é/g, "e")
      .replace(/ó/g, "o")
      .replace(/ú/g, "u")
      .replace(/ů/g, "u")
      .replace(/ý/g, "y")
      .toLowerCase();
    collapsed.set(s, r);
  }
  return r;
}

// Форми клітинки-дублета «a / b» → ["a", "b"].
export function splitForms(cell: string): string[] {
  return cell.split(" / ").map((x) => x.trim());
}

// Перша (показувана) форма клітинки-дублета: «stole / stolu» → «stole».
export function firstForm(cell: string): string {
  return splitForms(cell)[0];
}

// Те саме для клітинки, якої може не бути: порожня або «—» (форма не існує) → [].
export function formsOf(cell: string | undefined): string[] {
  return !cell || cell === "—" ? [] : splitForms(cell);
}

// Обчислити один раз — при першому зверненні (пул комбінацій квізу: з даних, раз за запуск застосунку).
export function once<T>(build: () => T): () => T {
  let done = false;
  let value: T;
  return () => {
    if (!done) {
      value = build();
      done = true;
    }
    return value;
  };
}

// Реальна форма ІНШОЇ клітинки: існує (не «—»), не збігається з правильною формою і не є жодною з інших прийнятних форм
// клітинки (accepted: дублети, variants). Відмінність лише довготою голосної дозволена — там, де це граматика двох
// клітинок (ji / jí, mladý / mladí, kupuji / kupují): adj-pron і дієвідміна дієслів.
export function isRealOtherForm(correct: string, d: string | null | undefined, accepted: readonly string[] = []): d is string {
  return !!d && d !== "—" && d !== correct && !accepted.includes(d);
}

// Дистрактор придатний: реальна форма іншої клітинки (isRealOtherForm), що відрізняється від правильної не лише
// довготою голосної.
export function isUsableDistractor(correct: string, d: string | null | undefined, accepted: readonly string[] = []): d is string {
  return isRealOtherForm(correct, d, accepted) && collapseVowelLength(d) !== collapseVowelLength(correct);
}

// Підпис числа в тексті завдання.
export const NUMBER_LABEL: Record<GrammaticalNumber, string> = { sg: "однина", pl: "множина" };

// Велика перша літера речення; фраза, що починається пропуском («___ celou noc»), лишається як є.
export function capitalize(s: string): string {
  return s.length > 0 && s[0] !== "_" ? s[0].toUpperCase() + s.slice(1) : s;
}

// Добір раунду: якщо якісь комбо не дали питання (make → null), доповнює раунд іншими комбо пулу у випадковому
// порядку, без повтору вже поставлених (за comboId). Інакше зарезервоване під помилку комбо мовчки випало б, а раунд
// став би коротшим. take(c) сам будує питання й додає його в questions (або нічого не робить).
export function topUpRound<C extends { id: string }>(
  questions: readonly { comboId: string }[],
  count: number,
  pool: readonly C[],
  take: (c: C) => void
): void {
  if (questions.length >= count) return;
  for (const c of shuffle(pool)) {
    if (questions.length >= count) break;
    if (!questions.some((x) => x.comboId === c.id)) take(c);
  }
}
