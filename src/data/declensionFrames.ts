import type { CzechCase, NounFilter } from "../types";
import type { NumberPolicy } from "./prepositionPartners";
import type { NounTag } from "./nounTags";

// ─────────────────────── ФРАЗИ КВІЗУ «ПРИКМЕТНИКИ ТА ЗАЙМЕННИКИ» ───────────────────────
// ДАНІ, а не логіка. Кожна фраза задає відмінок через дієслово чи прийменник («Věřím ___» — давальний, «Bydlím v ___»
// — місцевий), тож відмінок видно з речення, а не лише з підпису завдання. Рушій (utils/declensionFlashcardEngine.ts)
// підставляє у «___» іменникову групу: тестоване слово (пропуск) + іменник + інколи слово-партнер:
//   прикметник:  «Bydlím v [tom] ___ domě»   займенник:  «Bydlím v ___ [velkém] domě»
// Іменник береться за смисловими тегами (data/nounTags.ts): вимога фрейму (any/all/none/countable, як у квізі
// «Прийменники») ∩ поле fits прикметника (data/adjectives.ts) ∩ quiz.fits займенника. Нове слово з тегами потрапляє
// в усі підхожі фрази саме; списків слів тут немає.
//
// Банк власний, не спільний із квізом «Прийменники»: там фрази підібрані під вибір прийменника, тут — під рівне
// покриття відмінків (і з дієсловами без прийменника). Спільні лише механізм (теги, partnerSelection.ts) і вокалізація.
//
// ПРАВИЛА ДОДАВАННЯ ФРАЗ
//  1. Фраза природна для КОЖНОГО іменника, що підпадає під її теги, у кожному числі, яке дозволяє num
//     ("sg" — однина, слово лише з множиною бере множину; "pl" — лише множина; "any" — обидва, множина лише де природна).
//     Підмет фрази — я/ти (не узгоджується з іменниковою групою); у називному дієслово узгоджується в числі — тому
//     окремі фрази для однини й множини («To je ___» / «To jsou ___»), і число там суворе (brýle — лише в «To jsou»).
//     Їжа — переважно в однині («Koupil jsem studený čaj», не «studené čaje»): для неї окрема фраза з num "sg".
//     ownerless: true — у фразі немає підмета-особи (Je tu…, Leží to na…): svůj туди не ставиться.
//  2. {v} {k} {s} {z} — прийменник перед групою, вокалізація (ve/ke/se/ze) за першим словом групи (utils/partnerSelection.ts,
//     CLUSTER_RULES). Невідома група приголосних → ця фраза для такого слова не береться (не вгадуємо).
//  3. degrees: true — фраза природна і для вищого/найвищого ступеня («Hledám levnější hotel»). Без нього ступені
//     у фразу не потрапляють («Odešel bez novějšího klíče» звучить дивно).
//  4. role: "neg" — фраза з запереченим дієсловом, лише для слів із quiz.role = "neg" (žádný: «Nemám žádné auto»; після
//     заперечення — знахідний, родовий тут застарілий). "question" — питання з групою на початку для jaký/který/čí;
//     у них «___» — сам пропуск, «{N}» — решта групи («Ve ___ {N} bydlíš?» → «Ve kterém domě bydlíš?»). "order" —
//     питання лише для kolikátý («Kolikátý den už čekáš?» — з «který» безглузде). "every" — узагальнення для každý /
//     všechen («Každý student to ví», «Cvičím každý den», «Koupil jsem všechen chléb»). Без role — звичайне речення;
//     some: true на ньому — речення природне й для nějaký («Hledám nějaký hotel»).
//  5. Після додавання фрази прочитай усі пари «фраза × іменник», що в неї потрапили; тег, що дає безглузду пару, прибери
//     з вимоги. dev-збірка попереджає про фразу, в яку потрапляє менше 3 іменників.

export type QuizCase = Exclude<CzechCase, "vokativ">;

export interface DeclFrame extends NounFilter {
  text: string;
  num?: NumberPolicy; // за замовчуванням "sg"
  degrees?: true;
  role?: "neg" | "question" | "order" | "every";
  some?: true; // звичайна фраза, де природний і неозначений «nějaký» («Hledám nějaký hotel»; не «Mám rád nějaké studenty»)
  ownerless?: true; // у фразі немає підмета-особи, якому могла б належати річ (Je tu…, Za … je zahrada): svůj сюди не ставимо
}

const NOT_THING: NounTag[] = ["time", "weather", "abstract", "activity"];

export const DECL_FRAMES: Record<QuizCase, DeclFrame[]> = {
  nominativ: [
    { text: "To je ___.", num: "sg", degrees: true },
    { text: "To jsou ___.", num: "pl", degrees: true },
    { some: true, text: "Tady je ___.", num: "sg", none: NOT_THING },
    { some: true, text: "Tady jsou ___.", num: "pl", none: NOT_THING },
    { text: "Kde je ___?", num: "sg", countable: true, none: [...NOT_THING, "meal"] },
    { text: "Kde jsou ___?", num: "pl", countable: true, none: [...NOT_THING, "meal"] },
    { text: "Líbí se mi ___.", num: "any", degrees: true, none: ["time", "abstract", "money", "document"] }, // líbí — і одн., і мн.
    { text: "Chybí mi ___.", num: "any", any: ["person", "animal", "carried"] },
    // заперечення: «Není tu žádný student», «Nejsou tu žádné knihy» (називний)
    { text: "Není tu ___.", num: "sg", role: "neg", any: ["person", "animal", "item", "vehicle", "food", "furniture", "building"] },
    { text: "Nejsou tu ___.", num: "pl", role: "neg", any: ["person", "animal", "item", "vehicle", "food", "furniture", "building"] },
    // питання
    { text: "___ je to {N}?", num: "sg", role: "question" },
    { text: "___ jsou to {N}?", num: "pl", role: "question" },
    { text: "___ {N} se ti líbí?", num: "any", role: "question", none: ["time", "abstract", "money", "document"] },
    // узагальнення «кожен / усі» (každý, všechen — quiz.role "every")
    { text: "___ to ví.", num: "sg", role: "every", any: ["person"] }, // každý student to ví
    { text: "___ to vědí.", num: "pl", role: "every", any: ["person"] }, // všichni studenti to vědí
    { text: "___ má svou cenu.", num: "sg", role: "every", any: ["item", "clothes", "furniture"] }, // každá věc má svou cenu
    { text: "___ mají svou cenu.", num: "pl", role: "every", any: ["item", "clothes", "furniture"] },
    { text: "___ je pryč.", num: "sg", role: "every", any: ["food", "weather"] }, // všechen sníh / všechna voda je pryč
  ],
  genitiv: [
    { text: "Bojím se ___.", num: "any", any: ["person", "animal"] },
    { some: true, text: "Jdu do ___.", degrees: true, any: ["placeV"] },
    { text: "Vracím se {z} ___.", any: ["placeV"] }, // ze školy, z města
    { text: "Vracím se {z} ___.", all: ["placeNa", "workplace"] }, // z pošty, z nádraží (не «ze silnice»)
    { text: "Bydlím blízko ___.", any: ["building", "outdoor"] },
    { some: true, text: "Mám dárek od ___.", num: "any", degrees: true, any: ["person"] },
    { text: "Bez ___ nikam nejdu.", any: ["carried"] },
    { text: "Je tu hodně ___.", num: "pl", degrees: true, ownerless: true, any: ["person", "animal", "item", "vehicle", "building", "furniture"] },
    { text: "Nechci nic kromě ___.", any: ["food", "meal"] },
    { text: "Vedle ___ sedí kočka.", num: "any", ownerless: true, any: ["furniture", "building"] },
    { some: true, text: "Dal jsem to do ___.", any: ["container"], none: ["vehicle", "clothes"] }, // do tašky, do skříně
    { text: "Nebojím se ___.", num: "any", role: "neg", any: ["person", "animal"] },
    { text: "Nejdu do ___.", role: "neg", any: ["placeV"] },
    { text: "Do ___ {N} jdeš?", role: "question", any: ["placeV"] },
    { text: "Od ___ {N} je ten dárek?", num: "any", role: "question", any: ["person"] },
    { text: "___ {N} se bojíš?", num: "any", role: "question", any: ["person", "animal"] },
    { text: "Od ___ {N} tu jsi?", role: "question", any: ["timeUnit"] }, // od kterého dne, od kolikátého týdne
    { text: "Bojím se ___.", num: "any", role: "every", any: ["person", "animal"] }, // každého psa, všech psů
    { text: "Ptám se ___.", num: "any", role: "every", any: ["person"] }, // ptát se koho — родовий
  ],
  dativ: [
    { text: "Věřím ___.", num: "any", any: ["person"] },
    { text: "Pomáhám ___.", num: "any", degrees: true, any: ["person", "animal"] },
    { some: true, text: "Jdu {k} ___.", degrees: true, any: ["person", "building"] },
    { text: "Dám to ___.", num: "any", any: ["person", "animal"] },
    { text: "Díky ___ jsem to zvládl.", num: "any", degrees: true, any: ["person"] },
    { text: "Zavolám ___.", any: ["person"] },
    { some: true, text: "Kvůli ___ jsem přišel pozdě.", num: "any", degrees: true, any: ["weather", "vehicle", "activity"] }, // kvůli silnému dešti, pomalému vlaku, té práci
    { some: true, text: "Přistoupil jsem {k} ___.", num: "any", any: ["furniture", "vehicle", "opening"] }, // k tomu stolu, k oknu, k autu
    { text: "Díky ___ to zvládnu.", num: "any", any: ["carried", "vehicle"] }, // díky novému telefonu, díky brýlím
    { text: "Nevěřím ___.", num: "any", role: "neg", any: ["person"] },
    { text: "Nepomáhám ___.", num: "any", role: "neg", any: ["person", "animal"] },
    { text: "___ {N} věříš?", num: "any", role: "question", any: ["person"] },
    { text: "{k} ___ {N} jdeš?", role: "question", any: ["person", "building"] },
    { text: "___ {N} pomáháš?", num: "any", role: "question", any: ["person", "animal"] },
    { text: "Pomáhám ___.", num: "any", role: "every", any: ["person", "animal"] },
    { text: "Dám to ___.", num: "any", role: "every", any: ["person", "animal"] },
  ],
  akuzativ: [
    { some: true, text: "Vidím ___.", num: "any", countable: true, any: ["person", "animal", "item", "clothes", "vehicle", "building", "furniture", "outdoor", "nature"] },
    { some: true, text: "Hledám ___.", num: "any", degrees: true, any: ["person", "animal", "item", "carried", "clothes", "document", "building"] },
    { text: "Mám rád ___.", num: "any", any: ["person", "animal", "activity", "nature"] },
    { text: "Mám rád ___.", any: ["food"] }, // їжа — в однині: «studený čaj», не «studené čaje»
    { some: true, text: "Koupil jsem ___.", num: "any", degrees: true, any: ["item", "clothes", "furniture"] }, // не vehicle: «koupil jsem vlak»
    { some: true, text: "Koupil jsem ___.", degrees: true, any: ["food"] },
    { text: "Jdu na ___.", any: ["placeNa", "meal"] }, // na poštu, na oběd
    { some: true, text: "Čekám na ___.", num: "any", any: ["person"] },
    { some: true, text: "Čekám na ___.", all: ["vehicle", "container"] }, // na autobus, na vlak (не «na kolo»)
    { some: true, text: "Potřebuju ___.", num: "any", degrees: true, any: ["item", "carried", "document", "money", "clothes"] },
    { some: true, text: "Dej mi ___.", any: ["item", "food"] },
    // після заперечення — знахідний («Nemám žádné peníze»)
    { text: "Nemám ___.", num: "any", role: "neg", any: ["item", "carried", "clothes", "animal", "money", "document"] },
    { text: "Nemám ___.", role: "neg", any: ["food"] },
    { text: "Nevidím ___.", num: "any", role: "neg", any: ["person", "animal", "item", "vehicle", "building"] },
    { text: "___ {N} hledáš?", num: "any", role: "question", any: ["person", "animal", "item", "carried", "clothes", "document", "building"] },
    { text: "___ {N} sis koupil?", num: "any", role: "question", any: ["item", "clothes", "furniture"] },
    { text: "___ {N} sis koupil?", role: "question", any: ["food"] },
    { text: "Na ___ {N} čekáš?", num: "any", role: "question", any: ["person"] },
    { text: "___ {N} už čekáš?", role: "order", any: ["timeUnit"] }, // kolikátý den / kolikátou hodinu už čekáš
    { text: "Znám ___.", num: "any", role: "every", any: ["person", "path", "building", "animal"] }, // znám každou ulici
    { text: "Cvičím ___.", role: "every", any: ["timeUnit", "dayPart"] }, // každý den, každé ráno
    { text: "Koupil jsem ___.", role: "every", any: ["food"] }, // všechen chléb, všechnu kávu
  ],
  lokal: [
    { some: true, text: "Mluvíme o ___.", num: "any", degrees: true },
    { text: "Přemýšlím o ___.", any: ["person", "activity"] },
    { some: true, text: "Bydlím {v} ___.", all: ["residence", "placeV"] },
    { some: true, text: "Pracuju {v} ___.", all: ["workplace", "placeV"] },
    { text: "Pracuju na ___.", all: ["workplace", "placeNa"] },
    { some: true, text: "Sedím na ___.", any: ["seat"] },
    { some: true, text: "Leží to na ___.", ownerless: true, any: ["surface"] },
    { some: true, text: "Jsem {v} ___.", any: ["placeV"], none: ["activity"] },
    { text: "Jsem na ___.", any: ["placeNa"] },
    { text: "Nemluvíme o ___.", num: "any", role: "neg" },
    { text: "Nesedím na ___.", role: "neg", any: ["seat"] },
    { text: "{v} ___ {N} bydlíš?", role: "question", all: ["residence", "placeV"] },
    { text: "O ___ {N} mluvíte?", num: "any", role: "question" },
    { text: "Na ___ {N} sedíš?", role: "question", any: ["seat"] },
    { text: "{v} ___ {N} se to stalo?", role: "question", any: ["timeUnit"] }, // ve kterém roce, v kolikátém týdnu
    { text: "{v} ___ je okno.", num: "any", role: "every", ownerless: true, all: ["placeV"], none: ["activity"] }, // v každém pokoji
    { text: "Na ___ leží kniha.", num: "any", role: "every", ownerless: true, any: ["surface"] },
  ],
  instrumental: [
    { some: true, text: "Jdu tam {s} ___.", num: "any", degrees: true, any: ["person", "animal"] },
    { some: true, text: "Mluvím {s} ___.", num: "any", degrees: true, any: ["person"] },
    { text: "Cestuju ___.", all: ["vehicle", "container"] }, // autobusem, vlakem (не «kolem»)
    { text: "Stojím před ___.", num: "any", any: ["building"] },
    { some: true, text: "Kočka spí pod ___.", ownerless: true, any: ["space"] },
    { text: "Za ___ je zahrada.", num: "any", ownerless: true, any: ["building"], none: ["placeNa"] },
    { text: "Jsem spokojený {s} ___.", num: "any", degrees: true, any: ["item", "vehicle", "activity", "clothes"] },
    { some: true, text: "Jdu za ___.", num: "any", any: ["person"] }, // jít za někým — піти до когось
    { text: "Běžím za ___.", num: "any", any: ["person", "animal"] }, // za tím psem
    { some: true, text: "Hraju si {s} ___.", num: "any", any: ["person", "animal"] }, // s kamarády, s kočkou
    { text: "Mezi ___ je místo.", num: "pl", ownerless: true, any: ["furniture", "building", "vehicle"] }, // mezi těmi stoly
    { text: "Nemluvím {s} ___.", num: "any", role: "neg", any: ["person"] },
    { text: "Necestuju ___.", role: "neg", all: ["vehicle", "container"] },
    { text: "{s} ___ {N} jdeš?", num: "any", role: "question", any: ["person", "animal"] },
    { text: "___ {N} cestuješ?", role: "question", all: ["vehicle", "container"] },
    { text: "Před ___ {N} stojíš?", role: "question", any: ["building"] },
    { text: "Za ___ {N} jdeš?", num: "any", role: "question", any: ["person", "animal"] }, // za kterým kamarádem
    { text: "Mluvím {s} ___.", num: "any", role: "every", any: ["person"] },
    { text: "Před ___ stojí auto.", num: "any", role: "every", ownerless: true, any: ["building"] }, // před každým domem
    { text: "Jdu za ___.", num: "any", role: "every", any: ["person"] }, // za každým kamarádem, za všemi
  ],
};

// Речення-контекст для 3-ї особи (on/ona/ono, oni): антецедент задає рід і референта — «Znáš [toho starého psa]?»
// Іменник — особа чи тварина (за тегами), прикметник — з його fits, займенник-партнер — будь-який дозволений.
export const ANTECEDENT_FRAME: DeclFrame = { text: "Znáš ___?", num: "any", any: ["person", "animal"] };

// ── Особові займенники ──
// Регістр 0 = без прийменника / короткий, 1 = після прийменника / довгий. s1 — підмет «я» (ціль 2/3 особи),
// s2 — підмет «ти» (ціль 1 особи): «Vidím mě» неможливе (кореференція). Займенник-приклонка ніколи не перший у реченні.
// Прийменник (prep) вокалізується за формою (ke mně, se mnou, ode mě).
export interface PersonalFrame { pre: string; post: string; prep?: string }
export interface PersonalCaseFrame { s1: PersonalFrame; s2: PersonalFrame }
export const PERSONAL_FRAMES: Partial<Record<QuizCase, Partial<Record<0 | 1, PersonalCaseFrame>>>> = {
  genitiv: {
    0: { s1: { pre: "Bojím se ", post: "." }, s2: { pre: "Bojíš se ", post: "?" } },
    1: { s1: { pre: "Dostal jsem dárek ", post: ".", prep: "od" }, s2: { pre: "Dostal jsi dárek ", post: "?", prep: "od" } },
  },
  dativ: {
    0: { s1: { pre: "Věřím ", post: "." }, s2: { pre: "Věříš ", post: "?" } },
    1: { s1: { pre: "Jdu ", post: ".", prep: "k" }, s2: { pre: "Jdeš ", post: "?", prep: "k" } },
  },
  akuzativ: {
    0: { s1: { pre: "Vidím ", post: "." }, s2: { pre: "Vidíš ", post: "?" } },
    1: { s1: { pre: "Ten dárek je ", post: ".", prep: "pro" }, s2: { pre: "Ten dárek je ", post: ".", prep: "pro" } },
  },
  lokal: {
    1: { s1: { pre: "Mluví se ", post: ".", prep: "o" }, s2: { pre: "Mluví se ", post: ".", prep: "o" } },
  },
  instrumental: {
    1: { s1: { pre: "Pojedu ", post: ".", prep: "s" }, s2: { pre: "Pojedeš ", post: "?", prep: "s" } },
  },
};

// Зворотний se: справжні зворотні аргументи (reflexivum tantum типу «díval se» — ні: там se зрощене з дієсловом).
export interface ReflexiveFrame { reg: 0 | 1; frame: PersonalFrame; form: string }
export const REFLEXIVE_FRAMES: Partial<Record<QuizCase, ReflexiveFrame[]>> = {
  genitiv: [{ reg: 1, frame: { pre: "Nemám peníze ", post: ".", prep: "u" }, form: "sebe" }],
  dativ: [
    { reg: 0, frame: { pre: "Koupil jsem ", post: " novou knihu." }, form: "si" },
    { reg: 1, frame: { pre: "Byl jsem ", post: " přísný.", prep: "k" }, form: "sobě" },
  ],
  akuzativ: [
    { reg: 0, frame: { pre: "Vidím ", post: " v zrcadle." }, form: "se" },
    { reg: 1, frame: { pre: "Udělal jsem to ", post: ".", prep: "pro" }, form: "sebe" },
  ],
  lokal: [{ reg: 1, frame: { pre: "Mluvím ", post: ".", prep: "o" }, form: "sobě" }],
  instrumental: [{ reg: 1, frame: { pre: "Vezmi si to ", post: ".", prep: "s" }, form: "sebou" }],
};
