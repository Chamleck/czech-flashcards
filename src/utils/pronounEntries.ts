import { PRONOUNS } from "../data/pronouns";
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { INTERROGATIVE_ALL } from "../data/interrogativePronouns";

// Розділ "Займенники" (PronounGroupsScreen) показує ТРИ групи на одному екрані —
// "Особові" (PERSONAL_PRONOUNS, id з префіксом "pp-"), "Присвійні та вказівні"
// (PRONOUNS, звичайні id без префікса) і "Питальні" (INTERROGATIVE_ALL, id з
// суфіксом "-int"). Усі три ділять ОДНЕ сховище прогресу PROGRESS_KEYS.pronouns
// (консолідовано міграцією migratePronounStores — раніше було три окремі ключі).
// Резолвер лишається потрібним НЕ через сховище (воно одне), а через різні
// СТРУКТУРИ ДАНИХ і РІЗНІ КАРТКИ: особові/питальні-core → PersonalPronounCard,
// присвійні/питальні-adj → AdjPronounCard. Той самий принцип, що numeralEntries.ts:
// id → тип+запис, щоб змішана черга "Повторити помилки" відрендерила правильну
// картку для кожного id. Поля storageKey тут НЕМАЄ — воно було б однакове для всіх.

export type PronounCardType = "pronoun" | "personal" | "interrogative";

export interface ResolvedPronoun {
  id: string;
  cardType: PronounCardType;
  entry: unknown;
}

export const ALL_PRONOUN_MIXED_IDS: string[] = [
  ...PRONOUNS.map((p) => p.id),
  ...PERSONAL_PRONOUNS.map((p) => p.id),
  ...INTERROGATIVE_ALL.map((p) => p.id),
];

export function pronounCardType(id: string): PronounCardType | null {
  if (id.startsWith("pp-")) return "personal";
  if (id.endsWith("-int")) return "interrogative";
  if (PRONOUNS.some((p) => p.id === id)) return "pronoun";
  return null;
}

export function resolvePronoun(id: string): ResolvedPronoun | null {
  const cardType = pronounCardType(id);
  if (!cardType) return null;
  const entry =
    cardType === "personal"
      ? PERSONAL_PRONOUNS.find((p) => p.id === id)
      : cardType === "interrogative"
      ? INTERROGATIVE_ALL.find((p) => p.id === id)
      : PRONOUNS.find((p) => p.id === id);
  if (!entry) return null;
  return { id, cardType, entry };
}
