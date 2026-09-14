import { PRONOUNS } from "../data/pronouns";
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";

// Розділ "Займенники" (PronounGroupsScreen) показує ДВІ групи на одному екрані —
// "Особові" (PERSONAL_PRONOUNS, id з префіксом "pp-") і "Присвійні та вказівні"
// (PRONOUNS, звичайні id без префікса). Обидві ділять ОДНЕ сховище прогресу
// PROGRESS_KEYS.pronouns. Питальні винесено в окремий розділ "Питальні слова"
// (власне сховище PROGRESS_KEYS.interrogatives, резолвер interrogativeEntries.ts) —
// тут їх більше немає.
// Резолвер лишається потрібним НЕ через сховище (воно одне), а через різні
// СТРУКТУРИ ДАНИХ і РІЗНІ КАРТКИ: особові → PersonalPronounCard,
// присвійні/вказівні → AdjPronounCard. Той самий принцип, що numeralEntries.ts:
// id → тип+запис, щоб змішана черга "Повторити помилки" відрендерила правильну
// картку для кожного id.

export type PronounCardType = "pronoun" | "personal";

export interface ResolvedPronoun {
  id: string;
  cardType: PronounCardType;
  entry: unknown;
}

export const ALL_PRONOUN_MIXED_IDS: string[] = [
  ...PRONOUNS.map((p) => p.id),
  ...PERSONAL_PRONOUNS.map((p) => p.id),
];

export function pronounCardType(id: string): PronounCardType | null {
  if (id.startsWith("pp-")) return "personal";
  if (PRONOUNS.some((p) => p.id === id)) return "pronoun";
  return null;
}

export function resolvePronoun(id: string): ResolvedPronoun | null {
  const cardType = pronounCardType(id);
  if (!cardType) return null;
  const entry =
    cardType === "personal"
      ? PERSONAL_PRONOUNS.find((p) => p.id === id)
      : PRONOUNS.find((p) => p.id === id);
  if (!entry) return null;
  return { id, cardType, entry };
}
