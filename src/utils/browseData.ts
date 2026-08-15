import { BrowseKind } from "../types";
import { NOUNS } from "../data/nouns";
import { VERBS } from "../data/verbs";
import { ADJECTIVES } from "../data/adjectives";
import { PRONOUNS } from "../data/pronouns";
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { CARDINALS } from "../data/cardinals";

// Мінімальний спільний тип запису для СПИСКУ перегляду (усі датасети його мають).
export interface BrowseListItem {
  id: string;
  uk: string;
  cz: string;
}

// Єдина точка відповідності "kind → датасет". Нова частина мови додається одним
// рядком тут (+ гілка рендера картки в BrowseCardScreen) — решта коду не змінюється.
export function browseSource(kind: BrowseKind): readonly { id: string; uk: string; cz: string }[] {
  switch (kind) {
    case "nouns":
      return NOUNS;
    case "verbs":
      return VERBS;
    case "adjectives":
      return ADJECTIVES;
    case "personal":
      return PERSONAL_PRONOUNS;
    case "cardinals":
      return CARDINALS;
    case "pronouns":
    default:
      return PRONOUNS;
  }
}

// Повертає записи у ПОРЯДКУ entryIds (щоб свайп збігався з порядком списку).
export function browseEntries<T extends { id: string }>(
  source: readonly T[],
  entryIds: string[]
): T[] {
  const byId = new Map(source.map((e) => [e.id, e]));
  const out: T[] = [];
  for (const id of entryIds) {
    const e = byId.get(id);
    if (e) out.push(e);
  }
  return out;
}
