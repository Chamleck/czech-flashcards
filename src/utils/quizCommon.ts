// ─────────────── Спільні допоміжні функції квізів (усі 7 движків) ───────────────
// Чисті функції без стану, крім кешів-запам'ятовувань нижче (лише прискорення, результат той самий).

// Перемішування Фішера–Єйтса (нова копія масиву).
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

// Дистрактор придатний: існує (не «—»), не збігається з правильною формою, не є жодною з інших прийнятних форм
// клітинки (accepted: дублети, variants) і відрізняється від правильної не лише довготою голосної.
export function isUsableDistractor(correct: string, d: string | null | undefined, accepted: readonly string[] = []): d is string {
  return !!d && d !== "—" && d !== correct && !accepted.includes(d) && collapseVowelLength(d) !== collapseVowelLength(correct);
}
