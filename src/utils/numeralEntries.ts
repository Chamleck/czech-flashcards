import { CARDINALS } from "../data/cardinals";
import { ADJECTIVES } from "../data/adjectives";
import { NOUNS } from "../data/nouns";

// Розділ "Числівники" містить ТРИ різнотипні датасети (кількісні — власна
// структура CardinalEntry; порядкові — AdjectiveEntry; сотні/тисячі — NounEntry),
// але всі ділять одне сховище прогресу PROGRESS_KEYS.numerals. Щоб змішана сесія
// "Повторити помилки" могла зібрати їх в одну чергу і відрендерити правильну
// картку для кожного, потрібна детермінована відповідність id → тип+запис.
//
// id вже несуть однозначні префікси ("card-" / "ord-" / "num-"), тож тип
// визначається без додаткових метаданих — це свідоме використання того, що ми
// дали записам промовисті id, а не окремий костильний реєстр.

export type NumeralCardType = "cardinal" | "ordinal" | "hundreds";

export interface ResolvedNumeral {
  id: string;
  cardType: NumeralCardType;
  entry: unknown; // конкретний тип звужується в місці рендера за cardType
}

// Усі id раздела "Числівники" (для збору помилок/черги).
export const ALL_NUMERAL_IDS: string[] = [
  ...CARDINALS.map((c) => c.id),
  ...ADJECTIVES.filter((a) => a.category === "ordinal").map((a) => a.id),
  ...NOUNS.filter((n) => n.category === "numbers").map((n) => n.id),
];

export function numeralCardType(id: string): NumeralCardType | null {
  if (id.startsWith("card-")) return "cardinal";
  if (id.startsWith("ord-")) return "ordinal";
  if (id.startsWith("num-")) return "hundreds";
  return null;
}

// Повертає тип + запис за id, або null якщо id не з розділу числівників чи
// запис не знайдено (напр. дані змінились, а прогрес лишився старий).
export function resolveNumeral(id: string): ResolvedNumeral | null {
  const cardType = numeralCardType(id);
  if (!cardType) return null;
  let entry: unknown;
  if (cardType === "cardinal") entry = CARDINALS.find((c) => c.id === id);
  else if (cardType === "ordinal") entry = ADJECTIVES.find((a) => a.id === id);
  else entry = NOUNS.find((n) => n.id === id);
  if (!entry) return null;
  return { id, cardType, entry };
}

export function resolveNumerals(ids: string[]): ResolvedNumeral[] {
  const out: ResolvedNumeral[] = [];
  for (const id of ids) {
    const r = resolveNumeral(id);
    if (r) out.push(r);
  }
  return out;
}
