import { AdjectiveCategory } from "../types";
import { theme } from "../utils/theme";
import { PosEmojiName } from "../components/icons/posEmoji";

export interface AdjCategoryMeta {
  key: AdjectiveCategory;
  icon: PosEmojiName;
  title: string; // українською
  hint: string; // підказка про зразок/зміст
  color: string;
  // true → категорія НЕ показується на екрані "Прикметники", лише через розділ
  // "Числівники" (порядкові технічно лежать серед прикметників, але для учня це
  // числівники). Дані все одно в ADJECTIVES.
  hiddenFromPartOfSpeech?: boolean;
}

// Порядок відображення категорій прикметників.
// "soft" — окрема група для м'яких (jarní), щоб зразок був видимий учневі.
export const ADJ_CATEGORIES: AdjCategoryMeta[] = [
  { key: "size", icon: "ruler", title: "Розмір", hint: "твердий зразок mladý", color: theme.colors.honey },
  { key: "quality", icon: "star", title: "Якість і вік", hint: "твердий зразок mladý", color: theme.colors.mint },
  { key: "measure", icon: "thermometer", title: "Ціна, темп, температура", hint: "твердий зразок mladý", color: theme.colors.coral },
  { key: "colors", icon: "palette", title: "Кольори", hint: "твердий зразок mladý", color: theme.colors.lilac },
  { key: "soft", icon: "seedling", title: "М'які (на -í)", hint: "м'який зразок jarní", color: "#8ed081" },
  { key: "ordinal", icon: "numbers", title: "Порядкові числівники", hint: "перший, другий… (зразок mladý/jarní)", color: "#e0a458", hiddenFromPartOfSpeech: true },
];

export const ADJ_CATEGORY_BY_KEY: Record<AdjectiveCategory, AdjCategoryMeta> = ADJ_CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<AdjectiveCategory, AdjCategoryMeta>
);

// Категорії прикметників, виключені з загального квіза (тестування + партнер).
// Порядкові живуть лише в розділі "Числівники", тож у квізі прикметників/
// займенників вони не тестуються і не стають випадковим партнером.
export const ADJ_CATS_EXCLUDED_FROM_QUIZ = new Set<AdjectiveCategory>(
  ADJ_CATEGORIES.filter((c) => c.hiddenFromPartOfSpeech).map((c) => c.key)
);

export function adjQuizUsable(category: AdjectiveCategory): boolean {
  return !ADJ_CATS_EXCLUDED_FROM_QUIZ.has(category);
}
