import { WordCategory } from "../types";
import { theme } from "../utils/theme";
import { PosEmojiName } from "../components/icons/posEmoji";

export interface CategoryMeta {
  key: WordCategory;
  icon: PosEmojiName;
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
  { key: "people", icon: "womanAndManHoldingHands", title: "Люди", color: theme.colors.mint },
  { key: "home", icon: "house", title: "Дім і побут", color: theme.colors.honey },
  { key: "food", icon: "forkKnifeWithPlate", title: "Їжа та напої", color: theme.colors.coral },
  { key: "city", icon: "officeBuilding", title: "Місто", color: theme.colors.lilac },
  { key: "transport", icon: "automobile", title: "Транспорт", color: "#5a9fd4" },
  { key: "nature", icon: "deciduousTree", title: "Природа", color: "#8ed081" },
  { key: "animals", icon: "pawPrints", title: "Тварини", color: "#e0a458" },
  { key: "days", icon: "calendar", title: "Дні тижня", color: "#7fb8e0", unsuitableAsPartner: true },
  { key: "months", icon: "crescentMoon", title: "Місяці", color: "#c98ed0", unsuitableAsPartner: true },
  { key: "numbers", icon: "abacus", title: "Сотні і тисячі", color: "#e0a458", hiddenFromPartOfSpeech: true },
  { key: "time", icon: "hourglassNotDone", title: "Час", color: "#7fb8e0" },
  { key: "body", icon: "flexedBiceps", title: "Тіло", color: "#e0847a" },
  { key: "work", icon: "briefcase", title: "Робота", color: "#8a94a6" },
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
