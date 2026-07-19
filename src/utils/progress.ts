import AsyncStorage from "@react-native-async-storage/async-storage";
import { CardProgress } from "../types";

const KEY = "czech_flashcards_progress_v1";

// Прості інтервали повторення (мс). Індекс = поточний streak правильних відповідей.
const INTERVALS = [
  0, // 0 — одразу
  1000 * 60 * 10, // 1 — 10 хв
  1000 * 60 * 60 * 4, // 2 — 4 год
  1000 * 60 * 60 * 24, // 3 — 1 день
  1000 * 60 * 60 * 24 * 3, // 4 — 3 дні
  1000 * 60 * 60 * 24 * 7, // 5 — тиждень
  1000 * 60 * 60 * 24 * 21, // 6 — 3 тижні
];

export async function loadProgress(): Promise<Record<string, CardProgress>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveProgress(all: Record<string, CardProgress>): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // тихо ігноруємо — прогрес не критичний для роботи
  }
}

export function updateCard(
  prev: CardProgress | undefined,
  entryId: string,
  knewIt: boolean
): CardProgress {
  const now = Date.now();
  if (knewIt) {
    const streak = Math.min((prev?.correctStreak ?? 0) + 1, INTERVALS.length - 1);
    return {
      entryId,
      correctStreak: streak,
      incorrectCount: prev?.incorrectCount ?? 0,
      lastSeenAt: now,
      dueAt: now + INTERVALS[streak],
    };
  }
  return {
    entryId,
    correctStreak: 0,
    incorrectCount: (prev?.incorrectCount ?? 0) + 1,
    lastSeenAt: now,
    dueAt: now + INTERVALS[1],
  };
}

// Черга: спершу прострочені/нові (dueAt <= now), відсортовані за терміном.
export function buildQueue<T extends { id: string }>(
  items: T[],
  progress: Record<string, CardProgress>
): T[] {
  const now = Date.now();
  const due = items.filter((i) => (progress[i.id]?.dueAt ?? 0) <= now);
  const pool = due.length > 0 ? due : items;
  return [...pool].sort(
    (a, b) => (progress[a.id]?.dueAt ?? 0) - (progress[b.id]?.dueAt ?? 0)
  );
}

// Слово вважається "помилкою", якщо його хоч раз позначили "не знаю"
// і відтоді ще не відповіли правильно (correctStreak скинуто в 0).
export function isMistake(p: CardProgress | undefined): boolean {
  return !!p && p.incorrectCount > 0 && p.correctStreak === 0;
}

// Множина id слів, які зараз у колоді "Повторити помилки".
export function getMistakeIds(progress: Record<string, CardProgress>): Set<string> {
  const ids = new Set<string>();
  for (const id of Object.keys(progress)) {
    if (isMistake(progress[id])) ids.add(id);
  }
  return ids;
}
