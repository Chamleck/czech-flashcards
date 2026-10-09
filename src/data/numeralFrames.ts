import type { Needs } from "./prepositionPartners";
import type { DeclFrame, QuizCase, ValueCell } from "./declensionFrames";
import type { NounTag } from "./nounTags";
import type { SkipRule } from "../utils/quizCommon";

// ─────────────────────── ФРАЗИ КВІЗУ «ЧИСЛІВНИКИ» ───────────────────────
// ДАНІ, а не логіка. Кожна фраза задає відмінок усієї групи «числівник + іменник» через дієслово чи прийменник
// («Volám ___» — давальний, «Mluvili jsme o ___» — місцевий). Рушій (utils/numeralAgreementEngine.ts) підставляє в
// «___» групу, де пропуск — числівник або іменник:  «Volám [dvěma] kamarádům» / «Volám dvěma [kamarádům]».
// Іменник береться за смисловими тегами (data/nounTags.ts), як у квізах «Прийменники» та «Прикметники та
// займенники»; списків слів тут немає — нове слово з тегами потрапляє в усі підхожі фрази саме.
//
// ПРАВИЛА ДОДАВАННЯ ФРАЗ
//  1. Фраза природна для КОЖНОГО іменника, що підпадає під її теги (any / all / none), і для будь-якої кількості:
//     jeden, dva, pět, dvacet tři, а без max — і sto, tisíc, milion. Незлічувані іменники (uncountable) і слова, яких
//     не буває кілька (тег oneSystem — metro), квіз не бере взагалі (countable у utils/numeralAgreementEngine.ts),
//     тож виключати їх тегами у фразах не треба. Іменник, форму якого числівник вимагає, а мова її не вживає
//     (NOUN_USAGE_RULES у utils/partnerSelection.ts), у лічбу теж не потрапляє.
//  2. {V} — дієслово, що узгоджується з групою в називному: verb = [однина, множина]. Однина — після jeden, pět+,
//     sto…, dvacet jeden; множина — після dva / tři / čtyři, dvacet dva…, dvoje (IJP id=792: «pět mužů přišlo»,
//     «dva muži přišli»). Тому окремих фраз для однини й множини не треба.
//  3. {v} {k} {s} {z} — прийменник перед групою; ve / ke / se / ze вирішує перше слово групи (числівник) за
//     CLUSTER_RULES (data/prepositionPartners.ts). Невідома група приголосних (dv-, čt- з k / s / z; з v вони
//     класифіковані: ve dvou, ve čtyřech) — ця фраза для такого числівника не береться (не вгадуємо «s dvěma» / «se dvěma»).
//     Тому для кожного відмінку й кожного роду, який мають числівники, потрібна й фраза без {v}{k}{s}{z} (před, mezi,
//     bez, do…) — інакше dva / čtyři в цьому відмінку з таким іменником не питаються.
//  4. many: true — лише для кількості від двох (mezi: «mezi dvěma domy», не «mezi jedním domem»).
//     max — найбільша кількість, за якої фраза ще природна (sto, tisíc… мають numeralValue у nouns.ts; прості й
//     складені числівники — до 99). max: EVERYDAY_MAX (99) — фраза про звичайний досвід однієї людини, де sto / tisíc безглузді
//     («Volám tisíci kamarádům», «Před milionem let jsem tam byl»); max: PEOPLE_ANIMALS_MAX (1000) — люди й тварини: «Na fotce je sto
//     psů», але не «Znám milion hostů». Без max — і milion / miliarda («Ve městě je milion domů»).
//  5. Після додавання фрази прочитай усі пари «фраза × іменник», що в неї потрапили; тег, що дає безглузду пару,
//     прибери з вимоги. dev-збірка попереджає про фразу, в яку потрапляє менше 3 іменників.

export interface NumeralFrame extends Needs {
  text: string; // «___» — місце групи «числівник + іменник»
  verb?: [string, string]; // для {V}: [однина, множина]
  many?: true;
  max?: number;
}

// Пороги max (правило 4 шапки): один рядок — одна причина; число в самій фразі не пишемо.
const EVERYDAY_MAX = 99; // звичайний досвід однієї людини: sto / tisíc безглузді
const PEOPLE_ANIMALS_MAX = 1000; // люди й тварини: «sto psů» так, «milion hostů» ні

const BE: [string, string] = ["je", "jsou"];

export const NUMERAL_FRAMES: Record<QuizCase, NumeralFrame[]> = {
  nominativ: [
    { text: "Na fotce {V} ___.", verb: BE, any: ["person", "animal"], max: PEOPLE_ANIMALS_MAX },
    { text: "Na stole {V} ___.", verb: BE, any: ["item", "carried"], none: ["furniture", "support", "seat", "clothes"], max: EVERYDAY_MAX },
    { text: "Ve skříni {V} ___.", verb: BE, any: ["clothes"], max: EVERYDAY_MAX },
    { text: "Ve městě {V} ___.", verb: BE, any: ["building"] },
    { text: "V pokoji {V} ___.", verb: BE, any: ["furniture"], max: EVERYDAY_MAX },
    { text: "{V} ještě ___.", verb: ["Zbývá", "Zbývají"], any: ["timeUnit"], max: EVERYDAY_MAX },
  ],
  akuzativ: [
    { text: "Znám ___.", any: ["person"], max: PEOPLE_ANIMALS_MAX },
    { text: "Mám ___.", any: ["animal"], max: PEOPLE_ANIMALS_MAX },
    { text: "Mám ___.", any: ["carried", "money"] },
    { text: "Koupil jsem ___.", any: ["item", "food", "clothes"], none: ["support"] },
    { text: "Vidím ___.", any: ["animal", "vehicle"], max: PEOPLE_ANIMALS_MAX },
    { text: "Z okna vidím ___.", any: ["building"] },
    { text: "Čekám už ___.", any: ["timeUnit"], max: EVERYDAY_MAX },
  ],
  genitiv: [
    { text: "Mám dopis od ___.", any: ["person"], max: EVERYDAY_MAX },
    { text: "Mám fotku ___.", any: ["animal"], max: PEOPLE_ANIMALS_MAX },
    { text: "Vrátím se do ___.", any: ["timeUnit"], max: EVERYDAY_MAX },
    { text: "Cena ___ je vysoká.", any: ["item", "clothes"], none: ["support"] },
    { text: "Vedle ___ je park.", any: ["building"], max: EVERYDAY_MAX },
  ],
  dativ: [
    { text: "Volám ___.", any: ["person"], max: EVERYDAY_MAX },
    { text: "Díky ___ jsme to zvládli.", any: ["person"], max: PEOPLE_ANIMALS_MAX },
    { text: "Dávám jídlo ___.", any: ["animal"], max: EVERYDAY_MAX },
    { text: "Naproti ___ je park.", any: ["building"], max: EVERYDAY_MAX },
    { text: "Přišel jsem pozdě kvůli ___.", any: ["vehicle"], max: EVERYDAY_MAX },
    { text: "Kvůli ___ jsem se vrátil domů.", any: ["carried"], max: EVERYDAY_MAX },
    { text: "Kvůli ___ je tu hluk.", any: ["vehicle"] },
  ],
  lokal: [
    { text: "Mluvili jsme o ___.", any: ["person", "animal"], max: PEOPLE_ANIMALS_MAX },
    { text: "Psal jsem o ___.", any: ["vehicle", "building"], none: ["placeV"] },
    { text: "Na ___ je skvrna.", any: ["item", "clothes", "carried"], none: ["support", "furniture"], max: EVERYDAY_MAX },
    { text: "Odešel po ___.", any: ["timeUnit"], max: EVERYDAY_MAX },
    // práce, škola-діяльність — «byl jsem ve dvou pracích» неприродне (metro квіз не бере взагалі — правило 1)
    { text: "Byl jsem {v} ___.", all: ["placeV"], none: ["activity"], max: EVERYDAY_MAX },
  ],
  instrumental: [
    { text: "Šel jsem tam {s} ___.", any: ["person", "animal"], max: EVERYDAY_MAX },
    // před / mezi не вокалізуються — люди в орудному і для dva / čtyři (s + dv-, čt- не класифіковано). «Stál jsem před» —
    // лише люди (виступ перед залом: «před tisícem lidí»; «před tisícem kuřat» — ні, Нік 2026-10-09).
    { text: "Stál jsem před ___.", any: ["person"], max: PEOPLE_ANIMALS_MAX },
    { text: "Seděl jsem mezi ___.", any: ["person"], many: true, max: PEOPLE_ANIMALS_MAX },
    { text: "Mezi ___ je park.", any: ["building"], many: true, max: EVERYDAY_MAX },
    { text: "Je to město {s} ___.", any: ["building"] },
    { text: "Je to farma {s} ___.", any: ["farm"], max: PEOPLE_ANIMALS_MAX }, // не «farma s koťaty» (Нік 2026-10-09)
    { text: "Za ___ je les.", any: ["building"], max: EVERYDAY_MAX },
    { text: "Před ___ jsem tam byl.", any: ["timeUnit"], max: EVERYDAY_MAX },
    { text: "Přišel {s} ___.", any: ["carried"], none: ["document"], max: EVERYDAY_MAX },
    // mezi — без вокалізації, тож годиться й для dvěma / čtyřmi / dvojími (група dv-, čt- з s не класифікована)
    { text: "Mezi ___ leží dopis.", any: ["item", "carried", "clothes"], none: ["support", "furniture"], many: true, max: EVERYDAY_MAX },
  ],
};

// ─────────────────────── ПОРЯДКОВІ ЧИСЛІВНИКИ (první … dvanáctý) ───────────────────────
// Свій банк фраз квізу «Числівники» для порядкових; механізм — той самий, що в квізі «Прикметники та займенники»
// (adjectiveTableUnits у utils/declensionFlashcardEngine.ts): у «___» стає група «порядковий + іменник», пропуск — на
// порядковому, дистрактор — інша форма того ж порядкового. Тип фрази — DeclFrame (правила 1–2 шапки
// data/declensionFrames.ts: число, {v}{k}{s}{z}). Фрази квізу «Прикметники та займенники» сюди не годяться: з
// порядковим вони граматичні, але безглузді («od jejího dvanáctého manžela», «tvé jedenácté oko»).
//
// ПРАВИЛА ДОДАВАННЯ ФРАЗ З ПОРЯДКОВИМИ
//  1. Іменник — лише з тегом ordered (рахується по порядку: den, vlak, patro, host; data/nounTags.ts), тож кожна фраза
//     має all: ["ordered", …]. Фраза природна для КОЖНОГО такого іменника під її тегами й для КОЖНОГО порядкового
//     до її max (без max — první … dvanáctý).
//  2. max — найбільше value порядкового, з яким фраза ще природна. Множина порядкових природна лише у кількох
//     конструкціях: перший (první hosté), шкільні рівні (grade, max 9: «deváté ročníky», «v devátých třídách»),
//     ранжування в кількох категоріях (тег ranking: «první místa obsadili…», max ORDINAL_PLURAL_MAX) і розподільне
//     «N-ті X у кожному Y» («třetí sedadla v každé řadě», «druzí studenti v každé skupině», max ORDINAL_PLURAL_MAX).
//     Транспорт — max 3 («jedenáctým autobusem» — ні, номер лінії кажуть інакше).
//  3. Множина одиниць часу — через plOk: ["timeUnit"] (загальне правило pluralNatural її не дає).
//  4. Розподільна фраза несе в собі «у кожному Y» — Y залежить від групи тегів: seat — «v každé řadě», person — «v každé
//     skupině», building — «v každé ulici», sequencePart без line — «v každé knize»; ранжування — «ve všech kategoriích».
//     Фраза в називному множини НЕ залежить від роду групи (слово з тегом може бути будь-якого роду): теперішній час
//     множини («dostanou», «se vyhlašují»), прикметник на -í («nejlepší») або «většina» (рід — «většina», не групи).
//     Тег space («під чим є місце») — лише там, де фраза справді фізична («Pod ___ je schránka»), а не щоб відсіяти слово.
//  5. standalone — фраза БЕЗ іменника: порядковий стоїть сам і називає людей («Dojeli jsme druzí», «Do cíle dojeli
//     čtvrtí»; живе в мові лише в називному множини чоловічого роду істот: denik.cz, tn.nova.cz, czechrally.com, auto.cz).
//     Теги не діють; перед пропуском — без {v}{k}{s}{z}.
//  6. Клітинка без жодної фрази (ні з іменником, ні standalone) питається без речення, ЯКЩО її не прибирає
//     ORDINAL_BARE_SKIPS (нижче): це свідомий виняток із причиною, оракул друкує її. Після додавання фрази прочитай усі
//     пари «фраза × іменник × порядковий» і запусти оракул scripts/check-quiz-coverage.ts --only=numerals: «Помилок: 0».
//  7. Шкільний рівень (grade) — лише у фразах з max: 9 (у школі 9 класів): загальні фрази мають none: ["grade"].
//  8. Фрази з «ранжуванням» мають all: ["ordered", "ranking"] (лише místo; тег ranking — власна властивість слова, а не
//     відсів за іншими тегами): «Obsadil třetí ulici» — безглуздо, тож
//     ulice (placeNa без seat) у них не потрапляє.

// Найбільше value порядкового, з яким природна множина в розподільних фразах і ранжуванні.
const ORDINAL_PLURAL_MAX = 6;
// Найбільший шкільний рівень (grade): у школі 9 класів — «deváté ročníky» є, «desáté» немає.
const ORDINAL_GRADE_MAX = 9;
// Транспорт: номер рейсу / лінії називають лише до третього («třetí vlak» так, «jedenáctým autobusem» ні).
const ORDINAL_VEHICLE_MAX = 3;
// Множина лише від першого: «první hosté», «první dny» (далі потрібна розподільна конструкція, див. ORDINAL_PLURAL_MAX).
const ORDINAL_FIRST_ONLY = 1;

// Свідомі винятки: клітинку, під яку немає жодної природної фрази, не питаємо без речення. Читають рушій
// (adjectiveTableUnits) і оракул (scripts/check-quiz-coverage.ts). Закінчення множини (-ých, -ým, -ými) ті самі, що в
// другий–шостий, тож конструкція «порядковий узгоджується з іменником» лишається покритою; випадають лише форми самих
// числівників (osmých, devátým…).
export const ORDINAL_BARE_SKIPS: SkipRule<ValueCell>[] = [
  {
    reason: `множина порядкових від ${ORDINAL_PLURAL_MAX + 1}: природної конструкції немає (та сама модель, що в 2–${ORDINAL_PLURAL_MAX}; школи й гонки закриті фразами)`,
    applies: ({ value, n }) => n === "pl" && value > ORDINAL_PLURAL_MAX,
  },
];

const RANK: NounTag[] = ["ordered", "ranking"]; // ранжування (правило 8)
const PL = ORDINAL_PLURAL_MAX;
export const ORDINAL_FRAMES: Record<QuizCase, DeclFrame[]> = {
  nominativ: [
    // без «už»: «To je už první den» суперечить собі
    { text: "Tohle je ___.", num: "sg", all: ["ordered"], none: ["vehicle", "grade"] }, // tohle je třetí den / páté patro
    { text: "Tohle je ___.", num: "sg", max: ORDINAL_VEHICLE_MAX, all: ["ordered", "vehicle"] }, // tohle je druhý vlak
    { text: "Kde je ___?", num: "sg", all: ["ordered"], none: ["time", "vehicle", "grade"] }, // kde je třetí patro / druhý host
    { text: "Na zájezd jede ___.", num: "sg", max: ORDINAL_GRADE_MAX, all: ["ordered", "grade"] }, // třetí třída, devátý ročník
    { text: "Tohle jsou ___.", num: "pl", max: ORDINAL_FIRST_ONLY, all: ["ordered"], none: ["residence", "building", "path", "grade"], plOk: ["timeUnit"] }, // první hosté, první dny
    { text: "Na zájezd jedou ___.", num: "pl", max: ORDINAL_GRADE_MAX, all: ["ordered", "grade"] }, // deváté ročníky (SSČ: «deváté ročníky jely na zájezd»), třetí třídy
    // розподільні (правило 4): «N-ті X у кожному Y»
    { text: "Ve všech kategoriích se vyhlašují ___.", num: "pl", max: PL, all: RANK }, // druhá místa (MPSV: «První místa v dalších kategoriích obsadily…»)
    { text: "___ v každé řadě jsou nejlepší.", num: "pl", max: PL, all: ["ordered", "seat"] }, // třetí sedadla, třetí místa
    { text: "___ v každé skupině dostanou dárek.", num: "pl", max: PL, all: ["ordered", "person"] }, // druzí studenti, třetí hosté
    { text: "___ v každé ulici mají zelenou střechu.", num: "pl", max: PL, all: ["ordered", "building"] }, // druhé domy
    { text: "___ v každé knize jsou nejdůležitější.", num: "pl", max: PL, all: ["ordered", "sequencePart"], none: ["line"] }, // druhé kapitoly
    // без іменника (правило 5): називний множини чол. істот — гонки
    { text: "Dojeli jsme ___.", standalone: { gender: "masc_anim", num: "pl" } }, // druzí, čtvrtí, dvanáctí (denik.cz: «Dojeli jsme druzí»)
    { text: "Do cíle dojeli ___.", standalone: { gender: "masc_anim", num: "pl" } }, // (tn.nova.cz: «dojeli do cíle čtvrtí»)
    { text: "Celkově jsme skončili ___.", standalone: { gender: "masc_anim", num: "pl" } }, // (auto.cz: «celkově skončili patnáctí»)
  ],
  genitiv: [
    { text: "Od ___ se to zlepšilo.", all: ["ordered", "timeUnit"] }, // od prvního dne, od šesté noci, od třetí minuty
    { text: "Šel jsem do ___.", all: ["ordered", "placeV"], none: ["grade"] }, // do třetího patra, do druhého obchodu
    { text: "Vystoupil jsem {z} ___.", max: ORDINAL_VEHICLE_MAX, all: ["ordered", "vehicle"] }, // z prvního vlaku, ze třetího autobusu
    { text: "Zahnul jsem do ___.", all: ["ordered", "path"] }, // do druhé ulice
    { text: "Mám dárek od ___.", all: ["ordered", "person"] }, // od prvního hosta
    { text: "Syn chodí do ___.", max: ORDINAL_GRADE_MAX, all: ["ordered", "grade"] }, // do třetí třídy, do druhého ročníku
    { text: "Žáci ___ psali test.", num: "any", max: ORDINAL_GRADE_MAX, all: ["ordered", "grade"] }, // žáci třetí třídy, devátých ročníků
    { text: "Během ___ se toho hodně stalo.", num: "pl", max: ORDINAL_FIRST_ONLY, all: ["ordered", "timeUnit"], plOk: ["timeUnit"] }, // během prvních dnů
    { text: "Kromě ___ získali ještě medaile.", num: "pl", max: PL, all: RANK }, // kromě druhých míst
    { text: "Většina ___ v každé řadě je volná.", num: "pl", max: PL, all: ["ordered", "seat"] }, // většina třetích sedadel
    { text: "Většina ___ v každé skupině přišla pozdě.", num: "pl", max: PL, all: ["ordered", "person"] }, // většina druhých studentů
    { text: "Většina ___ v každé ulici je opravená.", num: "pl", max: PL, all: ["ordered", "building"] }, // většina druhých domů
    { text: "Většina ___ v každé knize je krátká.", num: "pl", max: PL, all: ["ordered", "sequencePart"], none: ["line"] }, // většina druhých kapitol
  ],
  dativ: [
    { text: "Dal jsem klíč ___.", all: ["ordered", "person"] }, // prvnímu hostovi
    { text: "Došel jsem {k} ___.", all: ["ordered"], any: ["building", "path"] }, // k druhému domu, ke třetí ulici
    // naproti — bez vokalizace: dvanáctý (dv-) a čtvrtý (čt-) s k / s nejsou klasifikovány
    { text: "Naproti ___ je park.", all: ["ordered"], any: ["building", "path"] }, // naproti druhému domu, dvanácté ulici
    { text: "Naproti ___ je okno.", all: ["ordered", "seat"] }, // naproti třetímu sedadlu, třetímu místu
    { text: "Díky ___ jsem to stihl.", max: ORDINAL_VEHICLE_MAX, all: ["ordered", "vehicle"] }, // díky prvnímu vlaku
    { text: "Učitelka dala úkol ___.", num: "any", max: ORDINAL_GRADE_MAX, all: ["ordered", "grade"] }, // třetí třídě, devátým ročníkům
    { text: "Díky ___ v obou kategoriích tým postoupil.", num: "pl", max: PL, all: RANK }, // díky druhým místům
    { text: "Dal jsem přednost ___ v každé řadě.", num: "pl", max: PL, all: ["ordered", "seat"] }, // druhým sedadlům
    { text: "Pomáhám ___ v každé skupině.", num: "pl", max: PL, all: ["ordered", "person"] }, // druhým studentům
    { text: "Naproti ___ v každé ulici je park.", num: "pl", max: PL, all: ["ordered", "building"] }, // druhým domům
    { text: "Věnuji pozornost ___ v každé knize.", num: "pl", max: PL, all: ["ordered", "sequencePart"], none: ["line"] }, // druhým kapitolám
  ],
  akuzativ: [
    { text: "Jsem tu teprve ___.", all: ["ordered", "timeUnit"] }, // teprve první den, teprve druhou hodinu
    { text: "Čekám na ___.", all: ["ordered", "person"] }, // na prvního hosta, na pátého žáka
    { text: "Čekám na ___.", max: ORDINAL_VEHICLE_MAX, all: ["ordered", "vehicle"] }, // na druhý vlak
    { text: "Učím ___.", num: "any", max: ORDINAL_GRADE_MAX, all: ["ordered", "grade"] }, // třetí třídu, deváté ročníky
    { text: "Obsadil ___.", all: RANK }, // třetí místo (ne «třetí ulici»: pravidlo 8)
    { text: "Pamatuju si ___.", num: "pl", max: ORDINAL_FIRST_ONLY, all: ["ordered"], any: ["timeUnit", "person"], plOk: ["timeUnit"] }, // první dny, první hosty
    { text: "Čeští sportovci obsadili ___ ve všech kategoriích.", num: "pl", max: PL, all: RANK }, // druhá místa
    { text: "Zarezervoval jsem ___ v každé řadě.", num: "pl", max: PL, all: ["ordered", "seat"] }, // druhá sedadla
    { text: "Pozval jsem ___ v každé skupině.", num: "pl", max: PL, all: ["ordered", "person"] }, // druhé hosty
    { text: "Natřeli jsme ___ v každé ulici.", num: "pl", max: PL, all: ["ordered", "building"] }, // druhé domy
    { text: "Přečetl jsem ___ v každé knize.", num: "pl", max: PL, all: ["ordered", "sequencePart"], none: ["line"] }, // druhé kapitoly
  ],
  lokal: [
    { text: "Bydlím {v} ___.", all: ["ordered", "residence"] }, // ve třetím patře, v druhém domě
    { text: "{v} ___ se toho hodně stalo.", all: ["ordered", "timeUnit"], none: ["dayPart"] }, // v prvním týdnu, v druhém roce
    { text: "Mluvili jsme o ___.", all: ["ordered", "person"] }, // o prvním hostovi
    { text: "Syn je {v} ___.", max: ORDINAL_GRADE_MAX, all: ["ordered", "grade"] }, // ve třetí třídě, v druhém ročníku
    { text: "{v} ___ se učí angličtina.", num: "any", max: ORDINAL_GRADE_MAX, all: ["ordered", "grade"] }, // v devátých třídách
    { text: "Sedím na ___.", all: ["ordered", "seat"] }, // na druhém místě, na třetím sedadle
    { text: "Sedíme {v} ___.", all: ["ordered", "line"] }, // v první řadě, ve třetí řadě
    { text: "Skončil na ___.", all: RANK }, // na třetím místě (ne «na třetí ulici»: pravidlo 8)
    { text: "Po ___ jsem šel domů.", all: ["ordered", "activity"] }, // po první lekci
    { text: "{v} ___ to bylo těžké.", num: "pl", max: ORDINAL_FIRST_ONLY, all: ["ordered", "timeUnit"], plOk: ["timeUnit"] }, // v prvních dnech
    { text: "Skončili jsme na ___ ve všech kategoriích.", num: "pl", max: PL, all: RANK }, // na druhých místech
    { text: "Sedíme na ___ v každé řadě.", num: "pl", max: PL, all: ["ordered", "seat"] }, // na druhých sedadlech
    { text: "Mluvím o ___ v každé skupině.", num: "pl", max: PL, all: ["ordered", "person"] }, // o druhých studentech
    { text: "Na ___ v každé ulici visí cedule.", num: "pl", max: PL, all: ["ordered", "building"] }, // na druhých domech
    { text: "Mluvili jsme o ___ v každé knize.", num: "pl", max: PL, all: ["ordered", "sequencePart"], none: ["line"] }, // o druhých kapitolách
  ],
  instrumental: [
    { text: "Jedu ___.", max: ORDINAL_VEHICLE_MAX, all: ["ordered", "vehicle"] }, // prvním vlakem, druhým autobusem
    { text: "Za ___ je park.", all: ["ordered"], any: ["building", "path"] }, // za třetím domem, za druhou ulicí
    { text: "Mluvil jsem {s} ___.", all: ["ordered", "person"] }, // s prvním hostem, se třetím studentem
    { text: "Mluvil jsem {s} ___.", num: "pl", max: ORDINAL_FIRST_ONLY, all: ["ordered", "person"] }, // s prvními hosty
    { text: "Jeli jsme na zájezd {s} ___.", num: "any", max: ORDINAL_GRADE_MAX, all: ["ordered", "grade"] }, // se třetí třídou, s devátými ročníky
    // před / pod / nad — bez vokalizace: čtvrtý (čt-) a dvanáctý (dv-) s s nejsou klasifikovány
    { text: "Stojím ve frontě před ___.", all: ["ordered", "person"] }, // před čtvrtým studentem, před dvanáctým hostem
    { text: "Pod ___ je schránka.", all: ["ordered", "seat", "space"] }, // pod třetím sedadlem
    { text: "Nad ___ je půda.", all: ["ordered", "floor"] }, // nad třetím patrem
    { text: "Tým je spokojený {s} ___ ve všech kategoriích.", num: "pl", max: PL, all: RANK }, // s druhými místy
    { text: "Pod ___ v každé řadě je schránka.", num: "pl", max: PL, all: ["ordered", "seat", "space"] }, // pod druhými sedadly
    { text: "Před ___ v každé skupině stojí vedoucí.", num: "pl", max: PL, all: ["ordered", "person"] }, // před druhými studenty
    { text: "Před ___ v každé ulici stojí lavička.", num: "pl", max: PL, all: ["ordered", "building"] }, // před druhými domy
    { text: "Před ___ v každé knize je obrázek.", num: "pl", max: PL, all: ["ordered", "sequencePart"], none: ["line"] }, // před druhými kapitolami
  ],
};
