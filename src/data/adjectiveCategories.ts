import { AdjectiveCategory } from "../types";
import { theme } from "../utils/theme";

export interface AdjCategoryMeta {
  key: AdjectiveCategory;
  emoji: string;
  title: string; // українською
  hint: string; // підказка про зразок/зміст
  color: string;
}

// Порядок відображення категорій прикметників.
// "soft" — окрема група для м'яких (jarní), щоб зразок був видимий учневі.
export const ADJ_CATEGORIES: AdjCategoryMeta[] = [
  { key: "size", emoji: "📏", title: "Розмір", hint: "твердий зразок mladý", color: theme.colors.honey },
  { key: "quality", emoji: "⭐", title: "Якість і вік", hint: "твердий зразок mladý", color: theme.colors.mint },
  { key: "measure", emoji: "🌡️", title: "Ціна, темп, температура", hint: "твердий зразок mladý", color: theme.colors.coral },
  { key: "colors", emoji: "🎨", title: "Кольори", hint: "твердий зразок mladý", color: theme.colors.lilac },
  { key: "soft", emoji: "🌱", title: "М'які (на -í)", hint: "м'який зразок jarní", color: "#8ed081" },
];

export const ADJ_CATEGORY_BY_KEY: Record<AdjectiveCategory, AdjCategoryMeta> = ADJ_CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<AdjectiveCategory, AdjCategoryMeta>
);
