import { WordCategory } from "../types";
import { theme } from "../utils/theme";

export interface CategoryMeta {
  key: WordCategory;
  emoji: string;
  title: string; // українською
  color: string;
}

// Порядок відображення категорій на екрані вибору
export const CATEGORIES: CategoryMeta[] = [
  { key: "people", emoji: "🧑", title: "Люди", color: theme.colors.mint },
  { key: "home", emoji: "🏠", title: "Дім і побут", color: theme.colors.honey },
  { key: "food", emoji: "🍽️", title: "Їжа та напої", color: theme.colors.coral },
  { key: "city", emoji: "🏙️", title: "Місто", color: theme.colors.lilac },
  { key: "transport", emoji: "🚗", title: "Транспорт", color: "#5a9fd4" },
  { key: "nature", emoji: "🌿", title: "Природа", color: "#8ed081" },
];

export const CATEGORY_BY_KEY: Record<WordCategory, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<WordCategory, CategoryMeta>
);
