import { theme } from "../utils/theme";

// Категорії режиму "Флеш-картки" відповідають розділам граматики,
// для яких формат "обери правильну форму" логічно доречний.
export interface FlashcardCategory {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  ready: boolean; // false → немає даних (заблоковано 🔒)
}

export const FLASHCARD_CATEGORIES: FlashcardCategory[] = [
  {
    id: "cases",
    emoji: "🎯",
    title: "Відмінки",
    subtitle: "Однина / множина, усі 7 відмінків",
    color: theme.colors.honey,
    ready: true,
  },
  {
    id: "verbs",
    emoji: "🏃",
    title: "Дієслова",
    subtitle: "Часи: теперішній, минулий, майбутній",
    color: theme.colors.mint,
    ready: true,
  },
  {
    id: "pronouns",
    emoji: "👤",
    title: "Займенники",
    subtitle: "Однина / множина (скоро)",
    color: theme.colors.lilac,
    ready: false,
  },
];
