import AsyncStorage from "@react-native-async-storage/async-storage";

// Окрема статистика режиму "Флеш-картки" — не змішується з прогресом "Слів".
const KEY = "czech_flashcard_stats_v1";

// Підсумок однієї завершеної сесії (раунду).
export interface RoundResult {
  answered: number;
  correct: number;
  bestStreak: number;
}

export interface FlashcardStats {
  // Накопичено за весь час ("Загалом")
  totalAnswered: number;
  totalCorrect: number;
  bestStreak: number;
  // Остання завершена сесія ("Цей раунд"); null — ще жодного раунду не зіграно
  lastRound: RoundResult | null;
  // Особистий рекорд за один раунд (найвища точність, при рівній — більше відповідей)
  bestRound: RoundResult | null;
}

const EMPTY: FlashcardStats = {
  totalAnswered: 0,
  totalCorrect: 0,
  bestStreak: 0,
  lastRound: null,
  bestRound: null,
};

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

// Точність раунду (частка правильних). Захист від ділення на нуль.
function roundAccuracy(r: RoundResult): number {
  return r.answered > 0 ? r.correct / r.answered : 0;
}

// Чи новий раунд кращий за поточний рекорд:
// спершу за точністю, при рівній точності — за кількістю відповідей.
export function isBetterRound(candidate: RoundResult, best: RoundResult | null): boolean {
  if (!best) return candidate.answered > 0;
  const ca = roundAccuracy(candidate);
  const ba = roundAccuracy(best);
  if (ca !== ba) return ca > ba;
  return candidate.answered > best.answered;
}

// Додає результати завершеної сесії: оновлює накопичене, перезаписує "останній раунд"
// і, якщо раунд кращий, оновлює особистий рекорд. Повертає новий стан і прапорець
// побиття рекорду (для святкування на екрані підсумку сесії).
export function mergeSession(
  prev: FlashcardStats,
  round: RoundResult
): { stats: FlashcardStats; newRecord: boolean } {
  const newRecord = isBetterRound(round, prev.bestRound);
  const stats: FlashcardStats = {
    totalAnswered: prev.totalAnswered + round.answered,
    totalCorrect: prev.totalCorrect + round.correct,
    bestStreak: Math.max(prev.bestStreak, round.bestStreak),
    lastRound: round,
    bestRound: newRecord ? round : prev.bestRound,
  };
  return { stats, newRecord };
}
