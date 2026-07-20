import AsyncStorage from "@react-native-async-storage/async-storage";

// Окрема статистика режиму "Флеш-картки" — не змішується з прогресом "Слів".
const KEY = "czech_flashcard_stats_v1";

export interface FlashcardStats {
  totalAnswered: number;
  totalCorrect: number;
  bestStreak: number;
}

const EMPTY: FlashcardStats = { totalAnswered: 0, totalCorrect: 0, bestStreak: 0 };

export async function loadFlashcardStats(): Promise<FlashcardStats> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

export async function saveFlashcardStats(s: FlashcardStats): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // прогрес не критичний — тихо ігноруємо
  }
}

// Додає результати завершеної сесії до накопиченої статистики.
export function mergeSession(
  prev: FlashcardStats,
  sessionAnswered: number,
  sessionCorrect: number,
  sessionBestStreak: number
): FlashcardStats {
  return {
    totalAnswered: prev.totalAnswered + sessionAnswered,
    totalCorrect: prev.totalCorrect + sessionCorrect,
    bestStreak: Math.max(prev.bestStreak, sessionBestStreak),
  };
}
