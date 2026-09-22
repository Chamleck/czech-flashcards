import { WordCategory } from "../types";
import { PosEmojiName } from "../components/icons/posEmoji";

export interface CategoryMeta {
  key: WordCategory;
  icon: PosEmojiName;
  title: string; // українською
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
  { key: "people", icon: "womanAndManHoldingHands", title: "Люди" },
  { key: "home", icon: "house", title: "Дім і побут" },
  { key: "food", icon: "forkKnifeWithPlate", title: "Їжа та напої" },
  { key: "city", icon: "officeBuilding", title: "Місто" },
  { key: "transport", icon: "automobile", title: "Транспорт" },
  { key: "nature", icon: "deciduousTree", title: "Природа" },
  { key: "animals", icon: "dog", title: "Тварини" },
  { key: "days", icon: "calendar", title: "Дні тижня", unsuitableAsPartner: true },
  { key: "months", icon: "crescentMoon", title: "Місяці", unsuitableAsPartner: true },
  { key: "numbers", icon: "abacus", title: "Сотні і тисячі", hiddenFromPartOfSpeech: true },
  { key: "time", icon: "hourglassNotDone", title: "Час" },
  { key: "body", icon: "flexedBiceps", title: "Тіло" },
  { key: "work", icon: "briefcase", title: "Робота" },
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
