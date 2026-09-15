import { INTERROGATIVE_ADJ, INTERROGATIVE_CORE, INTERROGATIVE_ALL } from "../data/interrogativePronouns";
import { INTERROGATIVE_ADVERBS } from "../data/interrogativeAdverbs";
import { INTERROGATIVE_MISC } from "../data/interrogativeMisc";

// "Питальні слова" — розділ-хаб (InterrogativesScreen), одне спільне сховище
// прогресу PROGRESS_KEYS.interrogatives на ВЕСЬ розділ, але ТРИ різні форми
// запису за групами:
//   • jaky-int/ktery-int/ci-int — PronounEntry (адʼєктивне відмінювання,
//     рендериться AdjPronounCard)
//   • kdo-int/co-int — PersonalPronounEntry (одна форма на відмінок, без
//     роду, рендериться PersonalPronounCard)
//   • int-kde/int-kam/int-odkud/int-kudy (прислівникова) + int-kdy/int-jak/
//     int-proc/int-kolik (інша) — обидві InvariantWordEntry (без парадигми,
//     4 приклади, рендериться SimpleWordCard). Дві окремі групи, той самий
//     cardType "invariant" — розрізняються лише датасетом-джерелом для
//     browse/пошуку (кожна має власний entryIds sibling-набір), не рендером.
// Той самий принцип "id → тип+запис", що вже є в pronounEntries.ts/
// numeralEntries.ts для змішаних груп.

export type InterrogativeCardType = "adjective" | "core" | "invariant";

export function interrogativeCardType(id: string): InterrogativeCardType | null {
  if (INTERROGATIVE_CORE.some((p) => p.id === id)) return "core";
  if (INTERROGATIVE_ADJ.some((p) => p.id === id)) return "adjective";
  if (INTERROGATIVE_ADVERBS.some((p) => p.id === id)) return "invariant";
  if (INTERROGATIVE_MISC.some((p) => p.id === id)) return "invariant";
  return null;
}

export function resolveInterrogative(id: string) {
  const cardType = interrogativeCardType(id);
  if (!cardType) return null;
  const entry =
    cardType === "core"
      ? INTERROGATIVE_CORE.find((p) => p.id === id)
      : cardType === "invariant"
      ? INTERROGATIVE_ADVERBS.find((p) => p.id === id) || INTERROGATIVE_MISC.find((p) => p.id === id)
      : INTERROGATIVE_ADJ.find((p) => p.id === id);
  if (!entry) return null;
  return { id, cardType, entry };
}

// Весь розділ "Питальні слова" — усі три групи разом (одне сховище прогресу,
// один комбінований лічильник "Повторити помилки").
export const ALL_INTERROGATIVE_IDS: string[] = [
  ...INTERROGATIVE_ALL.map((p) => p.id),
  ...INTERROGATIVE_ADVERBS.map((p) => p.id),
  ...INTERROGATIVE_MISC.map((p) => p.id),
];
