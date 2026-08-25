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
    id: "adj-pron",
    emoji: "🎨",
    title: "Прикметники та займенники",
    subtitle: "Рід, відмінок, число та ступінь порівняння",
    color: theme.colors.lilac,
    ready: true,
  },
  {
    id: "numerals",
    emoji: "🔢",
    title: "Числівники",
    subtitle: "Узгодження з іменником (1, 2-4, 5+)",
    color: theme.colors.honey,
    ready: true,
  },
];
