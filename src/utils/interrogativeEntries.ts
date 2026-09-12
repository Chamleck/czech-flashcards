import { INTERROGATIVE_ADJ, INTERROGATIVE_CORE, INTERROGATIVE_ALL } from "../data/interrogativePronouns";

// "Питальні" — ОДНА UI-плитка (PronounGroupsScreen), частина консолідованого
// сховища прогресу всього розділу "Займенники" (PROGRESS_KEYS.pronouns —
// спільне для особових+присвійних+питальних), але ДВІ різні форми запису:
//   • jaky-int/ktery-int/ci-int — PronounEntry (адʼєктивне відмінювання,
//     рендериться AdjPronounCard)
//   • kdo-int/co-int — PersonalPronounEntry (одна форма на відмінок, без
//     роду, рендериться PersonalPronounCard)
// Той самий принцип "id → тип+запис", що вже є в pronounEntries.ts/
// numeralEntries.ts для змішаних груп.

export type InterrogativeCardType = "adjective" | "core";

export function interrogativeCardType(id: string): InterrogativeCardType | null {
  if (INTERROGATIVE_CORE.some((p) => p.id === id)) return "core";
  if (INTERROGATIVE_ADJ.some((p) => p.id === id)) return "adjective";
  return null;
}

export function resolveInterrogative(id: string) {
  const cardType = interrogativeCardType(id);
  if (!cardType) return null;
  const entry =
    cardType === "core"
      ? INTERROGATIVE_CORE.find((p) => p.id === id)
      : INTERROGATIVE_ADJ.find((p) => p.id === id);
  if (!entry) return null;
  return { id, cardType, entry };
}

export const ALL_INTERROGATIVE_IDS: string[] = INTERROGATIVE_ALL.map((p) => p.id);
