import { BrowseKind } from "../types";
import { NOUNS } from "../data/nouns";
import { VERBS } from "../data/verbs";
import { ADJECTIVES } from "../data/adjectives";
import { PRONOUNS } from "../data/pronouns";
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { INTERROGATIVE_ALL } from "../data/interrogativePronouns";
import { INTERROGATIVE_ADVERBS } from "../data/interrogativeAdverbs";
import { INTERROGATIVE_MISC } from "../data/interrogativeMisc";
import { CARDINALS } from "../data/cardinals";
import { PREPOSITIONS } from "../data/prepositions";
import { ADVERBS } from "../data/adverbs";
import { CONJUNCTIONS } from "../data/conjunctions";
import { SERVICE_ADVERBS } from "../data/serviceAdverbs";

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
    case "cardinals":
      return CARDINALS;
    case "prepositions":
      return PREPOSITIONS;
    case "adverbs":
      // SpatialAdverbEntry не має єдиного "cz" (кілька сенсів-слів) — для
      // списку показуємо композит "vlevo / doleva / zleva". ВАЖЛИВО: спред
      // (...a), не новий урізаний об'єкт — інакше BrowseCardScreen (той самий
      // browseSource) втратив би senses/note, потрібні для рендеру AdverbCard.
      return ADVERBS.map((a) => ({ ...a, cz: a.senses.map((s) => s.cz).join(" / ") }));
    case "interrogative":
      // Розділ "Питальні слова" — три групи (займенникова, прислівникова,
      // "інша") в ОДНОМУ пулі: entryIds, що приходять від конкретної групи/
      // пошуку, самі звужують, які записи реально показуються.
      return [...INTERROGATIVE_ALL, ...INTERROGATIVE_ADVERBS, ...INTERROGATIVE_MISC];
    case "service-word":
      // Розділ "Службові слова" — дві групи (сполучники, прислівники) в
      // ОДНОМУ пулі, той самий принцип, що "interrogative" вище. НА ВІДМІНУ
      // від попередньої версії: aby/kdyby тепер ConditionalConjunctionEntry
      // (парадигма), решта — InvariantWordEntry, тому картка вибирається
      // резолвером serviceWordCardType (BrowseCardScreen/DeclSessionScreen),
      // не завжди SimpleWordCard.
      return [...CONJUNCTIONS, ...SERVICE_ADVERBS];
    case "pronouns":
      // Присвійні/вказівні + особові в одному пулі (той самий принцип, що
      // "interrogative" вище) — entryIds, що приходять від конкретної
      // групи/пошуку, самі звужують, які записи реально показуються.
      return [...PRONOUNS, ...PERSONAL_PRONOUNS];
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
