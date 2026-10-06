// ─────────────────────── ФРАЗИ ВИДОВИХ ПИТАНЬ КВІЗУ «ДІЄСЛОВА» ───────────────────────
// ДАНІ, а не логіка. Видове питання: речення з пропуском, у якому природний лише один вид; обидві кнопки — та сама
// форма (час, особа, рід підмета) тестованого дієслова і його видового партнера. Рушій (utils/verbFlashcardEngine.ts)
// бере фразу за прапорцями дієслова (durative, resultative, delimitativePartner у data/verbs.ts), підмет — будь-який
// з усіх осіб часу (минулий — 16 клітинок PAST_SUBJECT_ORDER, майбутній — 6 осіб); списків слів тут немає.
// Фазові фрази («Přestal jsem ___», «Začnu ___») рушій будує сам із фазових дієслів словника (VerbEntry.phasal):
// після začít / přestat інфінітив лише недоконаний.
//
// Що фраза вимагає від виду (джерела: Dočekal 2007, Linguistica Brunensia 55; Macurová 2023, CASALC Review 2023-2):
//  - "durative": обставина тривалості ("celou noc", "dvě hodiny") — з доконаним неможлива, КРІМ делімітативних
//    (poseděl, proplakala celou noc); для таких пар питання лишається, бо вид визначає підказка (taskText). Лише для
//    недоконаних з durative: true;
//  - "terminative": "za + час" (час до досягнення результату) — природний вибір доконаного; недоконаний змінює
//    значення. Для делімітативних пар (delimitativePartner) вимкнено: "Poseděl jsem za minutu" неприродно;
//  - "resultative": "Zítra ___ a bude hotovo" — навмисна дія з результатом; лише для доконаних з resultative: true
//    ("Zítra přijdu a bude hotovo" неприродно);
//  - "other": контекст завершеності — доконаний природніший, недоконаний неприродний, але не заборонений (критерій
//    Macurová: вибір носія).
//
// Де в реченні пропуск (position):
//  - "initial": дієслово відкриває речення ("___ celou noc."). Таблична форма ("učil jsem se", "naučím se",
//    "budu se učit") тут вже правильна: допоміжне і se/si стоять на 2-му місці, після першого слова;
//  - "afterAdverb": перед пропуском прислівник ("Konečně ___."). Клітики стають між прислівником і дієсловом:
//    "Konečně jsem se naučil", "Zítra se naučím" (pastFormAfterAdverb / futureFormAfterAdverb).
//
// ПРАВИЛА ДОДАВАННЯ ФРАЗ
//  1. {V} — пропуск (рівно один), одразу за ним {O} — додаток пари (VerbEntry.complement) або нічого:
//     «{V}{O} celou noc.» → «Psal jsem dopis celou noc.». "initial" — {V} на початку; "afterAdverb" — рівно одне
//     слово перед {V} (перевіряє scripts/check-verb-quiz.ts).
//  2. Інший вид має бути неграматичним або неприродним для носія (змінювати зміст); фрази, де обидва види однаково
//     природні (Vždycky…, Každý týden, Včera, Právě, Za hodinu), не додаються.
//  3. Теперішній і наказовий не використовуються: доконаний не має теперішнього, а підміна його майбутнім дала б
//     іншу часову форму.
//  4. Нова фраза мусить бути природною з КОЖНОЮ парою, яку пропускають прапорці; прочитай усі речення, у які вона
//     потрапляє. Новий kind — це і нове правило у рушії, і нова перевірка в scripts/check-quiz-coverage.ts.
export type VerbFramePosition = "initial" | "afterAdverb";
export type VerbFrameKind = "durative" | "terminative" | "resultative" | "other";

export interface VerbFrame {
  text: string;
  tense: "past" | "future";
  position: VerbFramePosition;
  kind: VerbFrameKind;
}

// Недоконаний вид — обставини тривалості: доконаний із ними неграматичний.
export const IMPERF_FRAMES: VerbFrame[] = [
  { text: "{V}{O} celý večer.", tense: "past", position: "initial", kind: "durative" },
  { text: "{V}{O} celou noc.", tense: "past", position: "initial", kind: "durative" },
  { text: "{V}{O} dvě hodiny.", tense: "past", position: "initial", kind: "durative" },
  { text: "{V}{O} celé odpoledne.", tense: "future", position: "initial", kind: "durative" },
  { text: "{V}{O} celý týden.", tense: "future", position: "initial", kind: "durative" },
];

// Доконаний вид — «za + час» (результат за певний час; «Nakonec» додає ознаку завершення і прибирає двозначність
// «за хвилину» = «через хвилину») та контексти завершеності.
export const PERF_FRAMES: VerbFrame[] = [
  { text: "{V}{O} za minutu.", tense: "past", position: "initial", kind: "terminative" },
  { text: "{V}{O} za pět minut.", tense: "past", position: "initial", kind: "terminative" },
  { text: "Nakonec {V}{O} za minutu.", tense: "past", position: "afterAdverb", kind: "terminative" },
  { text: "Nakonec {V}{O} za pět minut.", tense: "past", position: "afterAdverb", kind: "terminative" },
  { text: "Konečně {V}{O}.", tense: "past", position: "afterAdverb", kind: "other" },
  { text: "Zítra {V}{O} a bude hotovo.", tense: "future", position: "afterAdverb", kind: "resultative" },
];
