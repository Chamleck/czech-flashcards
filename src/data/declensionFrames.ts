import type { AdjectiveEntry, CzechCase, Gender, GrammaticalNumber, NounFilter, PronounEntry, PronounQuiz } from "../types";
import type { NumberPolicy } from "./prepositionPartners";
import type { NounTag } from "./nounTags";
import { NUMERAL_CASE_ORDER } from "../types";
import { PARTNER_NOUNS, agreementGender } from "../utils/partnerSelection";
import type { SkipRule } from "../utils/quizCommon";

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
//  6. evaluative: true — фраза про ставлення мовця («Mám rád ___», «Líbí se mi ___», «Chybí mi ___», «Věřím ___», «Díky ___ jsem to zvládl»): прикметники-стани
//     (semClass "state": hladový, nemocný…) у неї не потрапляють — ні як тестоване слово, ні як партнер.
//     qualitative: true — фраза природна лише з не відносним прикметником (не semClass "relational": celý, hlavní…).
//  7. У питаннях (role "question") слова-партнера немає: «Za jakým přítelem jdeš?», не «Za jakým starým přítelem…»;
//     партнер в інших фразах — лише не відносний прикметник (правило 6 у шапці data/adjectives.ts).
//  8. plOk — теги, для яких У ЦІЙ фразі природна множина, хоча загальне правило (pluralNatural, utils/partnerSelection.ts)
//     її не дає: одиниці часу («Strávil jsem tam celé dny», «Během posledních týdnů…»). Фраза мусить дозволяти
//     множину (num "any" чи "pl"). Тег із plOk — явне рішення про це слово, тож він відкриває множину й незлічуваному
//     (так само в усіх квізах, utils/partnerSelection.ts candidateNumbers). Погоду сюди не ставимо:
//     природну множину має лише déšť, а «teplá slunce» — ні. Слова з тегами NO_PLURAL (utils/partnerSelection.ts:
//     збірні — rodina, система, одна в місті, — metro) у множину не стають без plOk із їхнім тегом; так само частина тіла,
//     якої в людини одна (body без bodyMany: «tvé krky» — ні). Форму, якої мова не вживає (NOUN_USAGE_RULES,
//     utils/partnerSelection.ts), рушій не поставить ніколи, навіть із plOk.
//  9. Фрази з role "every" для їжі — лише в однині: všechen з незлічуваним («Zbavil jsem se vší kávy»); «po všech
//     chlebech» неприродне. Перед všechen у фразі не став {v}/{k}/{s}/{z}: група vš- коливається (CLUSTER_RULES),
//     слово в таку фразу не потрапить.

export type QuizCase = Exclude<CzechCase, "vokativ">;

export interface DeclFrame extends NounFilter {
  text: string;
  num?: NumberPolicy; // за замовчуванням "sg"
  degrees?: true;
  role?: "neg" | "question" | "order" | "every";
  some?: true; // звичайна фраза, де природний і неозначений «nějaký» («Hledám nějaký hotel»; не «Mám rád nějaké studenty»)
  ownerless?: true; // у фразі немає підмета-особи, якому могла б належати річ (Je tu…, Za … je zahrada): svůj сюди не ставимо
  evaluative?: true; // оцінка / ставлення мовця (Mám rád, Líbí se mi, Chybí mi): без прикметників-станів (AdjectiveEntry.semClass "state")
  qualitative?: true; // без відносних прикметників (semClass "relational"): «k vysokým skříním», не «k celým domům»
  plOk?: NounTag[]; // множина природна в цій фразі для слів із цими тегами (правило 8): «Strávil jsem tam celé dny»
  max?: number; // лише для порядкових (банк ORDINAL_FRAMES, data/numeralFrames.ts): найбільше value, за якого фраза природна
  // Фраза БЕЗ іменника: у «___» стоїть лише порядковий, що називає людей («Dojeli jsme druzí», «Skončili jsme dvanáctí»).
  // Значення — рід і число клітинки, яку фраза питає (підмет фрази їх задає); іменник-партнера немає, тож теги
  // (all / any / none) не діють. Лише в банку ORDINAL_FRAMES; без {v}{k}{s}{z} перед пропуском.
  standalone?: { gender: Gender; num: GrammaticalNumber };
}

// Клітинка порядкового для свідомих винятків (ORDINAL_BARE_SKIPS у data/numeralFrames.ts): value — число, яке слово називає.
export interface ValueCell {
  value: number;
  g: Gender;
  c: QuizCase;
  n: GrammaticalNumber;
}

const NOT_THING: NounTag[] = ["time", "weather", "abstract", "activity"];
// Частина тіла — не річ, яку шукають чи показують окремо («Kde je dobrý krk?», «Tady je nějaký nos»): її фрази нижче
// (tag body) — «Lékař vyšetřil», «Dotkl se», «To škodí», «Co se stalo s».

export const DECL_FRAMES: Record<QuizCase, DeclFrame[]> = {
  nominativ: [
    { text: "To je ___.", num: "sg", degrees: true },
    { text: "To jsou ___.", num: "pl", degrees: true },
    { some: true, text: "Tady je ___.", num: "sg", none: [...NOT_THING, "body"] },
    { some: true, text: "Tady jsou ___.", num: "pl", none: [...NOT_THING, "body"] },
    { text: "Kde je ___?", num: "sg", countable: true, none: [...NOT_THING, "meal", "body"] },
    { text: "Kde jsou ___?", num: "pl", countable: true, none: [...NOT_THING, "meal", "body"] },
    { text: "Líbí se mi ___.", num: "any", degrees: true, evaluative: true, none: ["time", "abstract", "money", "document", "noLooks"] }, // líbí — і одн., і мн.
    { text: "Chybí mi ___.", num: "any", evaluative: true, any: ["person", "animal", "carried"] },
    // заперечення: «Není tu žádný student», «Nejsou tu žádné knihy» (називний)
    { text: "Není tu ___.", num: "sg", role: "neg", any: ["person", "animal", "item", "vehicle", "food", "furniture", "building"] },
    { text: "Nejsou tu ___.", num: "pl", role: "neg", any: ["person", "animal", "item", "vehicle", "food", "furniture", "building"] },
    { text: "To byly ___.", num: "pl", qualitative: true, any: ["timeUnit"], plOk: ["timeUnit"] }, // to byly krásné dny, dlouhé noci
    // питання
    { text: "___ je to {N}?", num: "sg", role: "question", none: ["body"] },
    { text: "___ jsou to {N}?", num: "pl", role: "question", none: ["body"] },
    { text: "___ {N} se ti líbí?", num: "any", role: "question", evaluative: true, none: ["time", "abstract", "money", "document", "noLooks"] },
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
    { text: "Během ___ se toho hodně stalo.", num: "any", ownerless: true, any: ["timeUnit", "dayPart"], plOk: ["timeUnit"] }, // během posledního týdne, během dlouhých nocí
    { text: "Nevejdu se do ___.", num: "any", any: ["clothes"] }, // do toho úzkého kabátu, do těch bot
    { text: "Vstal jsem {z} ___.", any: ["seat"] }, // ze židle, z měkkého koberce
    { some: true, text: "Potřebuju kopie ___.", num: "pl", any: ["document"] }, // kopie důležitých dokladů
    { text: "Ve městě je hodně ___.", num: "pl", ownerless: true, any: ["path"], none: ["activity", "landform", "residence"] }, // parků, ulic, mostů
    { text: "Do ___ {N} chodíš?", num: "pl", role: "question", all: ["building", "workplace"], none: ["placeNa"] }, // do kterých obchodů
    { text: "Nechodím do ___.", num: "pl", role: "neg", all: ["building", "workplace"], none: ["placeNa"] }, // do žádných kaváren
    { text: "Mám klíče od ___.", num: "any", role: "every", all: ["residence", "building"] }, // od každého domu, od všech hotelů (не «od každého přízemí»)
    { text: "Zbavil jsem se ___.", role: "every", any: ["food"] }, // vší kávy, všeho cukru
    { text: "Dotkl se ___.", num: "any", any: ["body"] }, // jejího ramene, mé ruky, jejích kolen (SSJČ: «dotkl se nesměle její ruky»)
  ],
  dativ: [
    { text: "Věřím ___.", num: "any", evaluative: true, any: ["person"] },
    { some: true, text: "Pomáhám ___.", num: "any", degrees: true, any: ["person", "animal"] }, // pomáhám nějakým ženám
    { some: true, text: "Jdu {k} ___.", degrees: true, any: ["person", "building"] },
    { text: "Dám to ___.", num: "any", any: ["person", "animal"] },
    { text: "Díky ___ jsem to zvládl.", num: "any", degrees: true, evaluative: true, any: ["person"] },
    { text: "Zavolám ___.", any: ["person"] },
    { some: true, text: "Kvůli ___ jsem přišel pozdě.", num: "any", degrees: true, any: ["weather", "vehicle", "activity"] }, // kvůli silnému dešti, pomalému vlaku, té práci
    { some: true, text: "Přistoupil jsem {k} ___.", any: ["furniture", "vehicle", "opening"] }, // k tomu stolu, k oknu, k autu (однина: «k vlakům» — ні)
    { text: "Nikdo nechodí {k} ___.", num: "pl", qualitative: true, any: ["furniture", "building", "opening"] }, // k vysokým skříním, k zavřeným oknům
    { text: "Díky ___ to zvládnu.", num: "any", any: ["carried", "vehicle"] }, // díky novému telefonu, díky brýlím
    { text: "Nevěřím ___.", num: "any", role: "neg", any: ["person"] },
    { text: "Nepomáhám ___.", num: "any", role: "neg", any: ["person", "animal"] },
    { text: "___ {N} věříš?", num: "any", role: "question", any: ["person"] },
    { text: "{k} ___ {N} jdeš?", role: "question", any: ["person", "building"] },
    { text: "___ {N} pomáháš?", num: "any", role: "question", any: ["person", "animal"] },
    { text: "Pomáhám ___.", num: "any", role: "every", any: ["person", "animal"] },
    { text: "Dám to ___.", num: "any", role: "every", any: ["person", "animal"] },
    { text: "Dávám přednost ___.", degrees: true, evaluative: true, any: ["food"] }, // teplé polévce, domácímu chlebu
    { text: "{k} ___ se to hodí.", num: "any", degrees: true, any: ["clothes"] }, // k tomu dlouhému kabátu, k užším kalhotám
    { text: "Autobusy jezdí {k} ___.", num: "pl", ownerless: true, any: ["building"], none: ["outdoor"] }, // k hlavním nádražím
    { text: "___ {N} dáváš přednost?", num: "any", role: "question", any: ["item", "vehicle", "clothes"] }, // kterým autům
    { text: "Dal jsem nálepku ___.", num: "any", role: "every", any: ["item", "furniture", "carried"], none: ["food"] }, // každému pasu, všem židlím
    { text: "Díky ___ jsme nemuseli nakupovat.", role: "every", any: ["food"] }, // všemu cukru, vší rýži
    { text: "To škodí ___.", num: "any", ownerless: true, any: ["body"] }, // tvým zubům, jejímu srdci («Neškoďte svému srdci» — МОЗ ЧР)
  ],
  akuzativ: [
    { some: true, text: "Vidím ___.", num: "any", countable: true, any: ["person", "animal", "item", "clothes", "vehicle", "building", "furniture", "outdoor", "nature"] },
    { some: true, text: "Hledám ___.", num: "any", degrees: true, any: ["person", "animal", "item", "carried", "clothes", "document", "building"] },
    { text: "Mám rád ___.", num: "any", evaluative: true, any: ["person", "animal", "activity", "nature"] },
    { text: "Mám rád ___.", evaluative: true, any: ["food"] }, // їжа — в однині: «studený čaj», не «studené čaje»
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
    { text: "Koupil jsem ___.", role: "every", any: ["food"] }, // všechen cukr, všechnu kávu
    { text: "Pamatuju si ___.", num: "any", any: ["timeUnit", "dayPart", "weather", "air"], plOk: ["timeUnit"] }, // ten nudný týden, ty dlouhé noci, ten svěží vzduch
    { text: "Strávil jsem tam ___.", num: "pl", any: ["timeUnit"], plOk: ["timeUnit"] }, // celé dny, dlouhé týdny
    { text: "Lékař vyšetřil ___.", num: "any", ownerless: true, any: ["body"] }, // zdravý zub, nemocné koleno, její zuby
    { text: "Na zítra hlásí ___.", ownerless: true, any: ["weather"] }, // silný vítr, slabý déšť
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
    { text: "Vím něco o ___.", num: "any", role: "every", any: ["person"] }, // o každém studentovi, o všech dětech
    { text: "Po ___ mě bolí břicho.", role: "every", any: ["food"] }, // po všem tom cukru, po vší rýži
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
    { text: "Byl jsem spokojený {s} ___.", evaluative: true, any: ["food"] }, // s domácím chlebem, s teplou polévkou
    { text: "Byl jsem překvapený ___.", any: ["weather", "air"] }, // silným větrem, jarním deštěm, čistým vzduchem
    { some: true, text: "{s} ___ je problém.", num: "any", ownerless: true, any: ["item", "document", "vehicle"] }, // s tím starým počítačem
    { text: "{s} ___ {N} je problém?", num: "any", role: "question", any: ["item", "document", "vehicle"] }, // s jakými doklady
    { text: "Mezi ___ {N} vybíráš?", num: "pl", role: "question", any: ["item"] }, // mezi kterými počítači (s + kt- коливається)
    { text: "Nemám problém {s} ___.", num: "any", role: "neg", any: ["item", "document", "vehicle"] }, // se žádným autem
    { text: "Co uděláš {s} ___?", num: "any", role: "every", any: ["food", "item"] }, // s každým klíčem
    { text: "Naplnil jsem sklenici ___.", role: "every", any: ["food"] }, // vším cukrem, vší vodou, vší rýží
    // Лише однина: орудний множини ruce / nohy / oči / uši — двоїна («tvýma rukama»), форм прикметника на -ma в даних немає.
    { text: "Co se stalo {s} ___?", ownerless: true, any: ["body"] }, // s tvou rukou, s tím kolenem, s tvými ústy
  ],
};

// Речення-контекст для 3-ї особи (on/ona/ono, oni): антецедент задає рід і референта — «Znáš [toho starého psa]?»
// Іменник — особа чи тварина (за тегами), прикметник — з його fits, займенник-партнер — будь-який дозволений.
export const ANTECEDENT_FRAME: DeclFrame = { text: "Znáš ___?", num: "any", any: ["person", "animal"] };
// Власник у питанні «чий?» (jeho / její / jejich) — лише людина: «Znáš tu ženu? Bydlím v jejím domě», не «Znáš krávu?
// Vidím její silnice».
export const OWNER_FRAME: DeclFrame = { text: "Znáš ___?", num: "any", any: ["person"] };

// ── Особові займенники ──
// Регістр 0 = без прийменника / короткий, 1 = після прийменника / довгий, 2 = наголошений (лише 3-тя особа: jeho / jemu
// проти ho / mu; фраза з протиставленням «…, ne tebe», де ненаголошена форма неможлива). s1 — підмет «я» (ціль 2/3 особи),
// s2 — підмет «ти» (ціль 1 особи): «Vidím mě» неможливе (кореференція). Займенник-приклонка ніколи не перший у реченні.
// Прийменник (prep) вокалізується за формою (ke mně, se mnou, ode mě).
export interface PersonalFrame { pre: string; post: string; prep?: string }
export interface PersonalCaseFrame { s1: PersonalFrame; s2: PersonalFrame }
export const PERSONAL_FRAMES: Partial<Record<QuizCase, Partial<Record<0 | 1 | 2, PersonalCaseFrame>>>> = {
  genitiv: {
    0: { s1: { pre: "Bojím se ", post: "." }, s2: { pre: "Bojíš se ", post: "?" } },
    1: { s1: { pre: "Dostal jsem dárek ", post: ".", prep: "od" }, s2: { pre: "Dostal jsi dárek ", post: "?", prep: "od" } },
    2: { s1: { pre: "Bojím se ", post: ", ne tebe." }, s2: { pre: "Bojíš se ", post: ", ne mě?" } },
  },
  dativ: {
    0: { s1: { pre: "Věřím ", post: "." }, s2: { pre: "Věříš ", post: "?" } },
    1: { s1: { pre: "Jdu ", post: ".", prep: "k" }, s2: { pre: "Jdeš ", post: "?", prep: "k" } },
    2: { s1: { pre: "Dej to ", post: ", ne mně." }, s2: { pre: "Dáš to ", post: ", ne mně?" } },
  },
  akuzativ: {
    0: { s1: { pre: "Vidím ", post: "." }, s2: { pre: "Vidíš ", post: "?" } },
    1: { s1: { pre: "Ten dárek je ", post: ".", prep: "pro" }, s2: { pre: "Ten dárek je ", post: ".", prep: "pro" } },
    2: { s1: { pre: "Vidím ", post: ", ne tebe." }, s2: { pre: "Vidíš ", post: ", ne mě?" } },
  },
  lokal: {
    1: { s1: { pre: "Mluví se ", post: ".", prep: "o" }, s2: { pre: "Mluví se ", post: ".", prep: "o" } },
  },
  instrumental: {
    0: { s1: { pre: "Byl jsem ", post: " překvapený." }, s2: { pre: "Byl jsi ", post: " překvapený?" } }, // jím, jí, jimi, námi
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

// ─────────────────────── ЩО КВІЗ «ПРИКМЕТНИКИ ТА ЗАЙМЕННИКИ» СВІДОМО НЕ ПИТАЄ ───────────────────────
// Рішення про слово записане в його даних (поля quiz.* займенника, quizDegrees прикметника); що з цього випливає для
// квізу — лише тут, одним правилом з причиною. Рушій (utils/declensionFlashcardEngine.ts) і оракул
// (scripts/check-quiz-coverage.ts) читають ці самі правила (skipReason, utils/quizCommon.ts), нічого не повторюючи.
// Два рівні: слово цілком (DECL_WORD_SKIPS) і окрема клітинка рід × відмінок × число (DECL_CELL_SKIPS). Ті самі правила
// клітинок діють і для слова-партнера (займенник перед іменником не стоїть у формі, якої квіз не питає).
// ПРАВИЛА ДОДАВАННЯ: нове поле quiz.*, що прибирає клітинки, — новий рядок тут з причиною (поле — у типі PronounQuiz).

// Відмінки квізів: без вокатива (у займенників він «—», у прикметників дублює називний). Єдиний перелік — NUMERAL_CASE_ORDER.
export const QUIZ_CASES = NUMERAL_CASE_ORDER as QuizCase[];
// Непрямі відмінки (без називного): особові займенники й групи прийменників.
export const OBLIQUE_CASES = QUIZ_CASES.filter((c) => c !== "nominativ");

export type DeclWord =
  | { kind: "adjective"; adjective: AdjectiveEntry; degree?: "comparative" | "superlative" }
  | { kind: "pronoun"; pronoun: PronounEntry };
export const DECL_WORD_SKIPS: SkipRule<DeclWord>[] = [
  {
    reason: "ступені не питаються (quizDegrees: false / не якісний)",
    applies: (w) => w.kind === "adjective" && !!w.degree && !(w.adjective.semClass === "quality" && w.adjective.quizDegrees),
  },
  { reason: "quiz.skip (sám — свідоме рішення)", applies: (w) => w.kind === "pronoun" && !!w.pronoun.quiz?.skip },
];

export interface DeclCell {
  quiz: PronounQuiz;
  g: Gender;
  c: QuizCase;
  n: GrammaticalNumber;
}
// Роди, у яких є хоч один незлічуваний іменник (однина všechen — лише з ним: «všechen čas», «všechna voda»).
const MASS_GENDERS = new Set<Gender>(PARTNER_NOUNS.filter((x) => x.uncountable).map((x) => agreementGender(x, "sg")));
export const DECL_CELL_SKIPS: SkipRule<DeclCell>[] = [
  { reason: "лише одне число (quiz.num: každý, kolikátý)", applies: ({ quiz, n }) => !!quiz.num && quiz.num !== n },
  { reason: "svůj у називному (без власника)", applies: ({ quiz, c }) => !!quiz.needsOwner && c === "nominativ" },
  { reason: "quiz.nominative = false", applies: ({ quiz, c }) => quiz.nominative === false && c === "nominativ" },
  {
    reason: "všechen в однині без незлічуваних іменників цього роду (чол. істот.)",
    applies: ({ quiz, g, n }) => !!quiz.massSg && n === "sg" && !MASS_GENDERS.has(g),
  },
];
