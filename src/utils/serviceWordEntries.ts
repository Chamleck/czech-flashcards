import { CONJUNCTIONS } from "../data/conjunctions";
import { SERVICE_ADVERBS } from "../data/serviceAdverbs";

// "Службові слова" — один спільний kind ("service-word"), але, як і
// "interrogative" (interrogativeEntries.ts), тепер ДВІ форми запису за id:
//   • більшість — InvariantWordEntry (компенсація 4 приклади, SimpleWordCard)
//   • aby/kdyby — ConditionalConjunctionEntry (реальна парадигма 6 форм,
//     ConditionalParticleCard). Той самий принцип "id → тип+запис", що вже є
//     в pronounEntries.ts/numeralEntries.ts/interrogativeEntries.ts.
export type ServiceWordCardType = "invariant" | "conditional";

const CONDITIONAL_IDS = new Set(["conj-aby", "conj-kdyby"]);

export function serviceWordCardType(id: string): ServiceWordCardType | null {
  if (CONDITIONAL_IDS.has(id)) return "conditional";
  if (CONJUNCTIONS.some((c) => c.id === id) || SERVICE_ADVERBS.some((c) => c.id === id)) return "invariant";
  return null;
}

export function resolveServiceWord(id: string) {
  const cardType = serviceWordCardType(id);
  if (!cardType) return null;
  const entry = CONJUNCTIONS.find((c) => c.id === id) || SERVICE_ADVERBS.find((c) => c.id === id);
  if (!entry) return null;
  return { id, cardType, entry };
}
