// Заголовки груп, що використовуються і екранами вибору (PronounGroupsScreen,
// NumeralsScreen, PrepositionsScreen, AdverbsScreen), і пошуковим індексом
// (searchIndex.ts). Єдине джерело істини — уникає розходження заголовка
// залежно від того, зайшов через категорію чи через результат пошуку.
//
// Навмисно БЕЗ жодних React Native залежностей (на відміну від імпорту
// напряму з екранів): searchIndex.ts має лишатись чистим — тестованим у
// Node/esbuild без RN-рантайму. Імпорт констант напряму з *Screen.tsx файлів
// підтягнув би React Native транзитивно і зламав би це.
export const PRONOUN_GROUP_TITLE = "Присвійні та вказівні";
export const PERSONAL_GROUP_TITLE = "Особові";
export const INTERROGATIVE_GROUP_TITLE = "Займенникові (хто? що? який?)"; // конкретна назва підгрупи, узгоджена зі стилем сусідів (ADVERBS/MISC нижче), а не родова назва хаба "Питальні слова" — ЛИШЕ для searchIndex.ts (групування результатів пошуку); заголовок екрана/рядка бере INTERROGATIVE_PRONOUNS_TITLE нижче
export const NUMERAL_CARDINAL_TITLE = "Кількісні";
export const NUMERAL_ORDINAL_TITLE = "Порядкові";
export const NUMERAL_HUNDREDS_TITLE = "Сотні, тисячі, мільйони";
export const PREP_DUAL_TITLE = "Дуальні (рух / спокій)";
export const ADVERBS_GROUP_TITLE = "Прислівники місця";

// Широкі назви частин мови — використовуються і тайлами на корені "Слова"
// (WordsPartOfSpeechScreen), і searchIndex.ts (kindLabel у результатах
// пошуку). Той самий принцип: одне джерело істини замість двох незалежних
// хардкоджених копій одного тексту.
export const KIND_LABEL_NOUNS = "Іменники";
export const KIND_LABEL_VERBS = "Дієслова";
export const KIND_LABEL_ADJECTIVES = "Прикметники";
export const KIND_LABEL_PRONOUNS = "Займенники";
export const KIND_LABEL_NUMERALS = "Числівники";
export const KIND_LABEL_PREPOSITIONS = "Прийменники";
export const KIND_LABEL_ADVERBS = "Прислівники";
export const KIND_LABEL_INTERROGATIVE = "Питальні"; // розділ "Питальні слова" — мітка тайла й рядка пошуку
export const KIND_LABEL_SERVICE_WORDS = "Службові"; // розділ "Службові слова" — мітка тайла й рядка пошуку
export const INTERROGATIVE_ADVERBS_GROUP_TITLE = "Прислівникові (де? куди? звідки? кудою?)"; // ряд "Прислівникові" у хабі "Питальні слова" — ЛИШЕ для searchIndex.ts; заголовок бере INTERROGATIVE_ADVERBS_TITLE нижче
export const INTERROGATIVE_MISC_GROUP_TITLE = "Інші (коли? як? чому? скільки?)"; // ряд "Інші" у хабі "Питальні слова" — ЛИШЕ для searchIndex.ts; заголовок бере INTERROGATIVE_MISC_TITLE нижче
export const CONJUNCTIONS_GROUP_TITLE = "Сполучники (a, ale, protože…)"; // ряд "Сполучники" у хабі "Службові слова" — ЛИШЕ для searchIndex.ts; заголовок бере CONJUNCTIONS_TITLE нижче
export const SERVICE_ADVERBS_GROUP_TITLE = "Загальні прислівники (opravdu, vlastně…)"; // ряд "Загальні прислівники" у хабі "Службові слова" — ЛИШЕ для searchIndex.ts; заголовок бере SERVICE_ADVERBS_TITLE нижче

// Короткі назви (без перекладу питальних слів у дужках) — те, що реально
// показує сам рядок на InterrogativesScreen (styles.title), і те, що має
// бути в хедері екрана після переходу — уніфіковано з усіма іншими
// підкатегоріями застосунку (там хедер завжди = чиста назва підкатегорії).
export const INTERROGATIVE_PRONOUNS_TITLE = "Займенники";
export const INTERROGATIVE_ADVERBS_TITLE = "Прислівники";
export const INTERROGATIVE_MISC_TITLE = "Інші";
export const CONJUNCTIONS_TITLE = "Сполучники";
export const SERVICE_ADVERBS_TITLE = "Загальні прислівники";
