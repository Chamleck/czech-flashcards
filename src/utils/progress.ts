import AsyncStorage from "@react-native-async-storage/async-storage";
import { CardProgress } from "../types";

// Ключі сховища прогресу. Кожна частина мови має власну колоду
// (і власну колоду "Повторити помилки"), тому ключі різні.
const NOUN_KEY = "czech_flashcards_progress_v1"; // історичний ключ — іменники
const VERB_KEY = "czech_verbs_progress_v1"; // дієслова
const ADJ_KEY = "czech_adjectives_progress_v1"; // прикметники
const PRON_KEY = "czech_pronouns_progress_v1"; // особові + присвійні + вказівні
const NUMERALS_KEY = "czech_numerals_progress_v1"; // кількісні + порядкові + сотні/тисячі/мільйони — один спільний розділ "Числівники"
const PREPOSITIONS_KEY = "czech_prepositions_progress_v1"; // прийменники (фіксовані + дуальні — один спільний розділ)
const ADVERBS_KEY = "czech_adverbs_progress_v1"; // прислівники місця (де/куди/звідки)
const INTERROGATIVES_KEY = "czech_interrogatives_progress_v1"; // питальні слова — окремий розділ (займенники kdo/co/jaký/… + прислівники kde/kam/… + kolik)
const SERVICE_WORDS_KEY = "czech_service_words_progress_v1"; // службові слова — окремий розділ (сполучники + загальні прислівники)

export const PROGRESS_KEYS = {
  nouns: NOUN_KEY,
  verbs: VERB_KEY,
  adjectives: ADJ_KEY,
  pronouns: PRON_KEY, // розділ "Займенники": особові + присвійні + вказівні (питальні винесено в окремий розділ)
  numerals: NUMERALS_KEY,
  prepositions: PREPOSITIONS_KEY,
  adverbs: ADVERBS_KEY,
  interrogatives: INTERROGATIVES_KEY, // розділ "Питальні слова" — усі питальні вирази разом
  serviceWords: SERVICE_WORDS_KEY, // розділ "Службові слова" — сполучники + загальні прислівники разом
};

// Базові варіанти з явним ключем сховища.
export async function loadProgressFrom(
  storageKey: string
): Promise<Record<string, CardProgress>> {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveProgressTo(
  storageKey: string,
  all: Record<string, CardProgress>
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(all));
  } catch {
    // тихо ігноруємо — прогрес не критичний для роботи
  }
}

export function updateCard(
  prev: CardProgress | undefined,
  entryId: string,
  knewIt: boolean
): CardProgress {
  return {
    entryId,
    incorrectCount: (prev?.incorrectCount ?? 0) + (knewIt ? 0 : 1),
    knewLastTime: knewIt,
    lastSeenAt: Date.now(),
  };
}

// Слово вважається "помилкою" (потрапляє в "Повторити помилки"), якщо
// останню відповідь на нього було "Ще повторити". Наступне "Знаю" одразу
// прибирає його з цієї колоди.
export function isMistake(p: CardProgress | undefined): boolean {
  return !!p && !p.knewLastTime;
}

// Множина id слів, які зараз у колоді "Повторити помилки".
export function getMistakeIds(progress: Record<string, CardProgress>): Set<string> {
  const ids = new Set<string>();
  for (const id of Object.keys(progress)) {
    if (isMistake(progress[id])) ids.add(id);
  }
  return ids;
}
