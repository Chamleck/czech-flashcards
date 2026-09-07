// Заголовки груп, що використовуються і екранами вибору (PronounGroupsScreen,
// NumeralsScreen, PrepositionsScreen, AdverbsScreen), і пошуковим індексом
// (searchIndex.ts). Єдине джерело істини — уникає розходження заголовка
// залежно від того, зайшов через категорію чи через результат пошуку.
//
// Навмисно БЕЗ жодних React Native залежностей (на відміну від імпорту
// напряму з екранів): searchIndex.ts має лишатись чистим — тестованим у
// Node/esbuild без RN-рантайму. Імпорт констант напряму з *Screen.tsx файлів
// підтягнув би React Native транзитивно і зламав би це.
export const PRONOUN_GROUP_TITLE = "👉 Присвійні та вказівні";
export const PERSONAL_GROUP_TITLE = "🙋 Особові";
export const NUMERAL_CARDINAL_TITLE = "Кількісні";
export const NUMERAL_ORDINAL_TITLE = "Порядкові";
export const NUMERAL_HUNDREDS_TITLE = "Сотні, тисячі, мільйони";
export const PREP_DUAL_TITLE = "Дуальні (рух / спокій)";
export const ADVERBS_GROUP_TITLE = "Прислівники місця";
