import { WordCategory } from "../types";
import { theme } from "../utils/theme";

export interface CategoryMeta {
  key: WordCategory;
  emoji: string;
  title: string; // українською
  color: string;
  // true → категорія НЕ показується як плитка на екрані "Іменники" (загальний
  // перелік), а доступна лише через окремий розділ "Числівники". Дані все одно
  // в NOUNS — приховується тільки плитка на екрані частини мови. Такі категорії
  // також повністю виключені з квіза (і як тестоване слово, і як партнер).
  hiddenFromPartOfSpeech?: boolean;
  // true → слово легально тестується у своєму розділі, але НЕ годиться як
  // випадковий "носій"/партнер у чужому реченні квіза (напр. "jeho ___ únoru" —
  // граматично коректно, семантично абсурдно). Виключає лише з ролі партнера.
  unsuitableAsPartner?: boolean;
}

// Порядок відображення категорій на екрані вибору
export const CATEGORIES: CategoryMeta[] = [
  { key: "people", emoji: "🧑", title: "Люди", color: theme.colors.mint },
  { key: "home", emoji: "🏠", title: "Дім і побут", color: theme.colors.honey },
  { key: "food", emoji: "🍽️", title: "Їжа та напої", color: theme.colors.coral },
  { key: "city", emoji: "🏙️", title: "Місто", color: theme.colors.lilac },
  { key: "transport", emoji: "🚗", title: "Транспорт", color: "#5a9fd4" },
  { key: "nature", emoji: "🌿", title: "Природа", color: "#8ed081" },
  { key: "animals", emoji: "🐾", title: "Тварини", color: "#e0a458" },
  { key: "days", emoji: "📅", title: "Дні тижня", color: "#7fb8e0", unsuitableAsPartner: true },
  { key: "months", emoji: "🗓️", title: "Місяці", color: "#c98ed0", unsuitableAsPartner: true },
  { key: "numbers", emoji: "💯", title: "Сотні і тисячі", color: "#e0a458", hiddenFromPartOfSpeech: true },
  { key: "time", emoji: "🕐", title: "Час (година/хвилина)", color: "#7fb8e0", hiddenFromPartOfSpeech: true },
];

export const CATEGORY_BY_KEY: Record<WordCategory, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<WordCategory, CategoryMeta>
);

// Категорії іменників, повністю виключені з квіза (тестування + партнер).
export const NOUN_CATS_EXCLUDED_FROM_QUIZ = new Set<WordCategory>(
  CATEGORIES.filter((c) => c.hiddenFromPartOfSpeech).map((c) => c.key)
);

// Категорії іменників, непридатні лише як партнер/носій у чужому реченні
// (але легально тестуються у своєму розділі). Включає й повністю приховані.
export const NOUN_CATS_UNSUITABLE_AS_PARTNER = new Set<WordCategory>(
  CATEGORIES.filter((c) => c.hiddenFromPartOfSpeech || c.unsuitableAsPartner).map((c) => c.key)
);

// Чи можна тестувати цей іменник у загальному квізі "Флеш-картки".
export function nounQuizTestable(category: WordCategory): boolean {
  return !NOUN_CATS_EXCLUDED_FROM_QUIZ.has(category);
}

// Чи годиться цей іменник як випадковий партнер/носій у чужому реченні.
export function nounUsableAsPartner(category: WordCategory): boolean {
  return !NOUN_CATS_UNSUITABLE_AS_PARTNER.has(category);
}
