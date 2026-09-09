import { NOUNS } from "../data/nouns";
import { VERBS } from "../data/verbs";
import { ADJECTIVES } from "../data/adjectives";
import { PRONOUNS } from "../data/pronouns";
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { CARDINALS } from "../data/cardinals";
import { PREPOSITIONS } from "../data/prepositions";
import { ADVERBS } from "../data/adverbs";
import { CATEGORY_BY_KEY } from "../data/categories";
import { ADJ_CATEGORY_BY_KEY } from "../data/adjectiveCategories";
import { VERB_CLASS_BY_KEY } from "../data/verbCategories";
import { BrowseKind, CASE_LABELS, CzechCase } from "../types";
// Заголовки груп — ІМПОРТУЄМО з чистого data-файлу (без React Native
// залежностей), який теж імпортують самі екрани. Єдине джерело істини: якщо
// хтось поміняє текст, і екран, і пошук підхоплять зміну автоматично.
// НЕ імпортуємо напряму з *Screen.tsx — це протягнуло б React Native
// транзитивно в utils-шар і зламало б тестованість searchIndex у Node/esbuild
// (реальна пастка, спіймана на аудиті цього ж патчу).
import {
  PRONOUN_GROUP_TITLE,
  PERSONAL_GROUP_TITLE,
  NUMERAL_CARDINAL_TITLE,
  NUMERAL_ORDINAL_TITLE,
  NUMERAL_HUNDREDS_TITLE,
  PREP_DUAL_TITLE,
  ADVERBS_GROUP_TITLE,
  KIND_LABEL_NOUNS,
  KIND_LABEL_VERBS,
  KIND_LABEL_ADJECTIVES,
  KIND_LABEL_PRONOUNS,
  KIND_LABEL_NUMERALS,
  KIND_LABEL_PREPOSITIONS,
  KIND_LABEL_ADVERBS,
} from "../data/groupTitles";

// ─────────────────────────── Індекс пошуку слів ───────────────────────────
// Ключовий принцип: НЕ вигадуємо нове групування — переюзаємо ТЕ САМЕ, що
// вже дає кожен *CategoriesScreen/*GroupsScreen (category/verbClass/govCase/
// суцільний список — 5 різних схем по частинах мови, звірено з реального
// коду екранів вибору). Так "сусідні слова" при свайпі після пошуку — точно
// ті самі, що й при звичайному вході через категорію, без розбіжностей.

export interface SearchEntry {
  id: string;
  kind: BrowseKind;
  cz: string; // headline-форма для рядка результату
  uk: string; // headline-переклад для рядка результату
  emoji: string;
  searchTextsNorm: string[]; // усі форми (у т.ч. усі сенси), вже нормалізовані
  entryIds: string[]; // сусідня група — той самий масив, що дав би тап по категорії
  title: string; // заголовок групи для BrowseList (навігаційний, може бути вузьким — "Родовий (Genitiv)")
  // Широка категорія для РЯДКА РЕЗУЛЬТАТУ пошуку ("Прийменники", не "Родовий
  // (Genitiv)") — навігаційний title занадто вузький і неінформативний як
  // ярлик у списку результатів (реальна знахідка користувача: "місто" за
  // прийменником показувало відмінок, не зрозуміло взагалі яка частина мови).
  kindLabel: string;
  // Проміжний екран вибору категорії, куди реально веде тап (враховує приховані
  // маршрути: "numbers"/"ordinal" ведуть на Numerals, не на WordCategories/
  // AdjectiveCategories). Всі ці екрани не приймають параметрів — "пуш" перед
  // BrowseList коштує майже нічого, тож "назад" відтворює СПРАВЖНЮ глибину
  // навігації, а не скорочену версію.
  parentScreen: "WordCategories" | "VerbCategories" | "AdjectiveCategories" | "PronounGroups" | "Numerals" | "Prepositions" | "Adverbs";
}

// Діакритично-нечутлива нормалізація (á→a, č→c, ř→r…) — NFD-декомпозиція +
// видалення комбінувальних діакритичних знаків. Стандартний прийом,
// коректно розкладає й ů (кільце), і háček, і čárka.
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const KIND_EMOJI: Record<BrowseKind, string> = {
  nouns: "🔤",
  verbs: "🏃",
  adjectives: "🎨",
  pronouns: "👉",
  personal: "🙋",
  cardinals: "🔢",
  prepositions: "🧭",
  adverbs: "🗺️",
};

// Широка категорія за замовчуванням — та сама, що назви тайлів на корені
// "Слова" (переюзано з groupTitles.ts, не задубльовано текстом ще раз).
// Для прихованих маршрутів (numbers/ordinal → Числівники) push() приймає
// явний override, бо дефолт за kind тут був би оманливим.
const KIND_LABEL: Record<BrowseKind, string> = {
  nouns: KIND_LABEL_NOUNS,
  verbs: KIND_LABEL_VERBS,
  adjectives: KIND_LABEL_ADJECTIVES,
  pronouns: KIND_LABEL_PRONOUNS,
  personal: KIND_LABEL_PRONOUNS,
  cardinals: KIND_LABEL_NUMERALS,
  prepositions: KIND_LABEL_PREPOSITIONS,
  adverbs: KIND_LABEL_ADVERBS,
};

function push(
  arr: SearchEntry[],
  id: string,
  kind: BrowseKind,
  cz: string,
  uk: string,
  extraTexts: string[],
  entryIds: string[],
  title: string,
  parentScreen: SearchEntry["parentScreen"],
  kindLabelOverride?: string
) {
  const texts = [cz, uk, ...extraTexts].map(normalize);
  arr.push({
    id,
    kind,
    cz,
    uk,
    emoji: KIND_EMOJI[kind],
    searchTextsNorm: texts,
    entryIds,
    title,
    parentScreen,
    kindLabel: kindLabelOverride ?? KIND_LABEL[kind],
  });
}

function buildIndex(): SearchEntry[] {
  const out: SearchEntry[] = [];

  // Іменники — group за category, KРІМ "numbers" (сотні/тисячі, прихована з
  // тайлу іменників, реальний вхід — «Числівники»). "time" з 2026-09 більше не
  // прихована — індексується через загальну гілку нижче (той самий шлях, що
  // "months").
  const numberIds = NOUNS.filter((n) => n.category === "numbers").map((n) => n.id);
  for (const n of NOUNS) {
    if (n.category === "numbers") {
      push(out, n.id, "nouns", n.cz, n.uk, [], numberIds, NUMERAL_HUNDREDS_TITLE, "Numerals", KIND_LABEL.cardinals);
      continue;
    }
    const meta = CATEGORY_BY_KEY[n.category];
    if (!meta) continue;
    const ids = NOUNS.filter((x) => x.category === n.category).map((x) => x.id);
    push(out, n.id, "nouns", n.cz, n.uk, [], ids, meta.title, "WordCategories");
  }

  // Прикметники — те саме, "ordinal" прихована, реальний вхід — «Числівники».
  const ordinalIds = ADJECTIVES.filter((a) => a.category === "ordinal").map((a) => a.id);
  for (const a of ADJECTIVES) {
    if (a.category === "ordinal") {
      push(out, a.id, "adjectives", a.cz, a.uk, [], ordinalIds, NUMERAL_ORDINAL_TITLE, "Numerals", KIND_LABEL.cardinals);
      continue;
    }
    const meta = ADJ_CATEGORY_BY_KEY[a.category];
    if (!meta) continue;
    const ids = ADJECTIVES.filter((x) => x.category === a.category).map((x) => x.id);
    push(out, a.id, "adjectives", a.cz, a.uk, [], ids, meta.title, "AdjectiveCategories");
  }

  // Дієслова — group за verbClass.
  for (const v of VERBS) {
    const meta = VERB_CLASS_BY_KEY[v.verbClass];
    if (!meta) continue;
    const ids = VERBS.filter((x) => x.verbClass === v.verbClass).map((x) => x.id);
    const cz = v.reflexive ? `${v.cz} ${v.reflexive}` : v.cz;
    push(out, v.id, "verbs", cz, v.uk, [], ids, meta.title, "VerbCategories");
  }

  // Займенники — суцільний список, без підгруп (те саме, що PronounGroupsScreen).
  // Обидві групи (pronouns/personal) живуть на ОДНОМУ екрані вибору —
  // PronounGroups показує їх як дві плитки поруч.
  const pronounIds = PRONOUNS.map((p) => p.id);
  for (const p of PRONOUNS) {
    push(out, p.id, "pronouns", p.cz, p.uk, [], pronounIds, PRONOUN_GROUP_TITLE, "PronounGroups");
  }
  const personalIds = PERSONAL_PRONOUNS.map((p) => p.id);
  for (const p of PERSONAL_PRONOUNS) {
    push(out, p.id, "personal", p.cz, p.uk, [], personalIds, PERSONAL_GROUP_TITLE, "PronounGroups");
  }

  // Числівники (кількісні) — суцільний список (той самий CARDINAL_IDS, що в NumeralsScreen).
  const cardinalIds = CARDINALS.map((c) => c.id);
  for (const c of CARDINALS) {
    push(out, c.id, "cardinals", c.cz, c.uk, [], cardinalIds, NUMERAL_CARDINAL_TITLE, "Numerals");
  }

  // Прийменники — фіксовані group за govCase, дуальні — одна суцільна група.
  // Заголовки — ТОЧНО ті самі рядки, що PrepositionsScreen (перевірено по
  // коду): fixed = "Родовий (Genitiv)", dual = "Дуальні (рух / спокій)".
  // Дуальні сенси НЕ додають нових текстів пошуку: це те саме слово (prep.cz),
  // а не різні лексеми (на відміну від прислівників нижче).
  const dualIds = PREPOSITIONS.filter((p) => p.type === "dual").map((p) => p.id);
  for (const p of PREPOSITIONS) {
    if (p.type === "dual") {
      push(out, p.id, "prepositions", p.cz, p.uk, [], dualIds, PREP_DUAL_TITLE, "Prepositions");
      continue;
    }
    const c = p.govCase as CzechCase;
    const ids = PREPOSITIONS.filter((x) => x.type === "fixed" && x.govCase === c).map((x) => x.id);
    push(out, p.id, "prepositions", p.cz, p.uk, [], ids, `${CASE_LABELS[c].uk} (${CASE_LABELS[c].cz})`, "Prepositions");
  }

  // Прислівники — суцільний список, БЕЗ підгруп. Індексуємо УСІ сенси
  // (vlevo+doleva+zleva усі ведуть до однієї картки) — узгоджено з юзером.
  // headline cz — той самий композит "vlevo / doleva / zleva", що вже
  // показує browseData.ts у списку Перегляду (консистентність).
  const adverbIds = ADVERBS.map((a) => a.id);
  for (const a of ADVERBS) {
    const senseTexts = a.senses.map((s) => s.cz);
    const czHeadline = senseTexts.join(" / ");
    push(out, a.id, "adverbs", czHeadline, a.uk, senseTexts, adverbIds, ADVERBS_GROUP_TITLE, "Adverbs");
  }

  return out;
}

const INDEX: SearchEntry[] = buildIndex();

// Ранг збігу для одного слова: 0 = точний збіг, 1 = слово ПОЧИНАЄТЬСЯ з
// запиту, 2 = запит десь усередині. Менше = релевантніше. Беремо найкращий
// (найменший) ранг серед усіх форм запису.
function matchRank(entry: SearchEntry, q: string): number {
  let best = 99;
  for (const t of entry.searchTextsNorm) {
    if (t === q) return 0; // точний збіг — одразу найкращий
    if (t.startsWith(q)) best = Math.min(best, 1);
    else if (t.includes(q)) best = Math.min(best, 2);
  }
  return best;
}

// Мінімум 2 символи — інакше 1 літера дає забагато шуму.
export function searchWords(query: string): SearchEntry[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  // Обчислюємо ранг ОДИН раз на запис (map), а не багато разів усередині
  // компаратора sort. Точний збіг і початок слова — угорі, збіг усередині —
  // нижче. Без сортування точний збіг тонув унизу серед часткових (напр.
  // "pět" з'являвся б після десятків іменників, що містять "pet" усередині).
  return INDEX.map((e) => ({ e, r: matchRank(e, q) }))
    .filter((x) => x.r < 99)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.e);
}
