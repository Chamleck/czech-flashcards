import { theme } from "../utils/theme";
import { PosEmojiName } from "../components/icons/posEmoji";

// Категорії режиму "Флеш-картки" відповідають розділам граматики,
// для яких формат "обери правильну форму" логічно доречний.
export interface FlashcardCategory {
  id: string;
  icon: PosEmojiName;
  title: string;
  subtitle: string;
  color: string;
  ready: boolean; // false → немає даних (заблоковано 🔒)
}

export const FLASHCARD_CATEGORIES: FlashcardCategory[] = [
  {
    id: "cases",
    icon: "bullseye",
    title: "Відмінки",
    subtitle: "Однина / множина, усі 7 відмінків",
    color: theme.colors.honey,
    ready: true,
  },
  {
    id: "verbs",
    icon: "running",
    title: "Дієслова",
    subtitle: "Часи: теперішній, минулий, майбутній",
    color: theme.colors.mint,
    ready: true,
  },
  {
    id: "adj-pron",
    icon: "palette",
    title: "Прикметники та займенники",
    subtitle: "Рід, відмінок, число та ступінь порівняння",
    color: theme.colors.lilac,
    ready: true,
  },
  {
    id: "numerals",
    icon: "numbers",
    title: "Числівники",
    subtitle: "Узгодження з іменником (1, 2-4, 5+)",
    color: theme.colors.honey,
    ready: true,
  },
  {
    id: "datetime",
    icon: "clock",
    title: "Час і дата",
    subtitle: "Дати (родовий), час і дні тижня (v/ve)",
    color: theme.colors.lilac,
    ready: true,
  },
  {
    id: "prepositions",
    icon: "compass",
    title: "Прийменники",
    subtitle: "Відмінок після прийменника, рух / спокій",
    color: "#7fb8e0",
    ready: true,
  },
  {
    id: "adverbs",
    icon: "map",
    title: "Прислівники місця",
    subtitle: "Де? Куди? Звідки? Кудою? — форма або питання за реченням",
    color: "#8ed081",
    ready: true,
  },
];
