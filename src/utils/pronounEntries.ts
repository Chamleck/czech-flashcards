import { PRONOUNS } from "../data/pronouns";
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { PROGRESS_KEYS } from "./progress";

// Розділ "Займенники" (PronounGroupsScreen) показує ДВІ групи на одному екрані —
// "Особові" (PERSONAL_PRONOUNS, id з префіксом "pp-") і "Присвійні та вказівні"
// (PRONOUNS, звичайні id без префікса) — але це ДВА ОКРЕМІ сховища прогресу
// (PROGRESS_KEYS.personal / PROGRESS_KEYS.pronouns), на відміну від "Числівників",
// де три підтипи свідомо ділять ОДНЕ сховище. Тут навмисно лишаємо два сховища
// без міграції (не чіпаємо вже записаний прогрес користувача), але даємо єдину
// точку "id → тип+запис+сховище", щоб "Повторити помилки" могло зібрати обидві
// групи в одну чергу і правильно писати відповідь назад у СВОЄ сховище кожної.

export type PronounCardType = "pronoun" | "personal";

export interface ResolvedPronoun {
  id: string;
  cardType: PronounCardType;
  entry: unknown;
  storageKey: string;
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
  return {
    id,
    cardType,
    entry,
    storageKey: cardType === "personal" ? PROGRESS_KEYS.personal : PROGRESS_KEYS.pronouns,
  };
}
