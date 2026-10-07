import type { NounEntry } from "../types";

// ─────────────────────────── СМИСЛОВІ ТЕГИ ІМЕННИКІВ ───────────────────────────
// Навіщо. Правильність фрази «Jsem v ___», «Jdu do ___», «Polož to na ___» залежить не лише від відмінка, а й
// від ЗНАЧЕННЯ іменника: після «do» не стоїть особа, «Jsem na ___» вимагає місця з прийменником na
// (на пошті, але в школі), «pod» потребує предмета, під який можна щось покласти. Раніше партнер у квізі
// «Прийменники» брався з усього словника навмання, звідси «do učitele» та подібні фрази.
//
// Як працює. Кожен іменник у nouns.ts має поле `sem` (хоча б один тег; без нього проєкт не збереться —
// поле обов'язкове в типі). Кожен фрейм квізу (data/prepositionPartners.ts) каже, які теги йому потрібні,
// і нове слово ПОТРАПЛЯЄ в усі фрази, де його теги підходять, — без ручного редагування списків.
// Помилковий або надто бідний набір тегів безпечний: слово просто з'являється в меншій кількості фраз.
//
// Тег = окрема властивість, яку можна перевірити питанням «так чи ні» (див. NOUN_TAG_DOC). Слово може мати
// кілька тегів. Не ставимо тег «про всяк випадок»: кожен тег — це обіцянка, що фрази з ним природні.
//
// ПРАВИЛА ДОДАВАННЯ ТЕГУ
//  1. Новий тег — лише коли жоден наявний не відділяє погані пари від добрих (так з'явилися air, served, homemade).
//     Тег може стояти й на одному слові, якщо описує ПОВЕДІНКУ, яку матиме будь-яке майбутнє слово того ж класу
//     (strongPl, mineral, worksPl — множина живе лише з прикметником; oneSystem — множини немає в жодному квізі), а не
//     виняток заради однієї фрази чи одного слова.
//  2. Пояснення й приклади — у NOUN_TAG_DOC; тег ставиться всім словам nouns.ts, яких він стосується.
//  3. Фрази всіх квізів, що беруть тег (data/prepositionPartners.ts, declensionFrames.ts, numeralFrames.ts,
//     nounFrames.ts, поле fits у data/adjectives.ts), — перечитати; суперечливі набори ловить validateNounSem.
//  4. Перед здачею — оракул scripts/check-quiz-coverage.ts (усі квізи): «Помилок: 0».
//  5. Наскрізний тег (CROSS: ordered) описує не клас слова, а одну його властивість і сполучається з будь-яким
//     тегом, навіть «самотнім» (den: time + timeUnit + ordered; host: person + ordered).

export type NounTag =
  | "person"
  | "animal"
  | "placeV"
  | "placeNa"
  | "building"
  | "outdoor"
  | "path"
  | "residence"
  | "workplace"
  | "surface"
  | "seat"
  | "space"
  | "support"
  | "item"
  | "carried"
  | "clothes"
  | "paired"
  | "collective"
  | "document"
  | "money"
  | "food"
  | "meal"
  | "vehicle"
  | "time"
  | "timeUnit"
  | "dayPart"
  | "furniture"
  | "weather"
  | "body"
  | "bodyLevel"
  | "activity"
  | "container"
  | "opening"
  | "abstract"
  | "nature"
  | "air"
  | "served"
  | "homemade"
  | "landform"
  | "ordered"
  | "singleLevel"
  | "grade"
  | "sequencePart"
  | "line"
  | "nonVisual"
  | "recurring"
  | "room"
  | "plant"
  | "flower"
  | "sight"
  | "overhead"
  | "floor"
  | "bodyMany"
  | "month"
  | "season"
  | "weekday"
  | "daySpan"
  | "dayPoint"
  | "timeV"
  | "yearsPlural"
  | "strongPl"
  | "drink"
  | "weatherCause"
  | "sky"
  | "mineral"
  | "oneSystem"
  | "worksPl";

// Запис для КОЖНОГО тегу обов'язковий (Record): додав тег до NounTag — компілятор вимагає пояснення.
export const NOUN_TAG_DOC: Record<NounTag, string> = {
  person: "людина, професія, родич: kamarád, učitel, matka, rodina",
  animal: "тварина: pes, kočka, kůň",
  placeV: "місце, де «є» з прийменником v/ve і «іду» з do: v škole, ve městě, do lesa (НЕ pošta — вона na)",
  placeNa: "місце з прийменником na: na poště, na úřadě, na nádraží, na hoře, na moři",
  building: "будівля чи споруда як орієнтир для před/za/vedle: kostel, škola, nádraží, most",
  outdoor: "відкритий простір чи ландшафт: město, les, hora, moře, pole, park, náměstí",
  path: "по чому можна йти: silnice, ulice, cesta, most, park, pole",
  residence: "де можна жити: město, dům, hotel, pokoj, přízemí (разом з placeV або placeNa)",
  workplace: "де можна працювати: škola, obchod, banka, pošta (разом з placeV або placeNa)",
  surface: "на що кладуть чи де сидять/лежать: stůl, židle, postel, koberec, okno, lednička",
  seat: "на чому сидять: židle, postel, koberec, polštář",
  space: "під чим є місце (залізти, покласти): stůl, postel, skříň, auto, most, strom",
  support: "до чого можна притулитися: dům, strom, skříň, stůl, okno",
  item: "невеликий предмет: kniha, klíč, telefon, bota, taška, hrnek",
  carried: "те, що беруть із собою з дому й можуть забути («Odešel bez klíče», «Jdu pro tašku»): klíč, telefon, deštník, brýle, taška, pas (НЕ hrnek, lžíce, televize)",
  clothes: "одяг і взуття («Odešel bez kabátu», «Poznal jsem ho podle kabátu»): košile, kalhoty, kabát, svetr, bota, ponožka",
  paired: "річ, яку зазвичай уживають парою, тож у фразах квізу береться множина («bez ponožek», не «bez ponožky»): bota, ponožka",
  collective: "збірна назва групи людей, множина якої у фразах неприродна («od rodin»): rodina (разом з person)",
  document: "документ чи реквізит: pas, doklad, adresa, účet",
  money: "гроші, валюта: peníze, koruna, euro",
  food: "їжа чи напій: chléb, káva, maso, voda",
  meal: "прийом їжі як подія: snídaně, oběd, večeře",
  vehicle: "транспорт: auto, vlak, autobus, letadlo",
  time: "проміжок чи момент часу: hodina, týden, noc, ráno",
  timeUnit: "вимірна одиниця часу: hodina, minuta, den, týden, měsíc, rok, noc — «přes týden», «přes noc», «po hodině» (але den/noc мають і dayPart: «po dni» неприродне; НЕ ráno, poledne, večer — частини доби; разом з time)",
  dayPart: "доба чи її частина: den, noc, ráno, dopoledne, poledne, odpoledne, večer, půlnoc; «po dni», «po noci» неприродні (разом з time)",
  furniture: "меблі й техніка, над/через які щось висить чи перелазять: stůl, židle, postel, skříň, lednička, televize",
  weather: "опади, вітер, сонце, після яких природні «při dešti», «ve slunci»: déšť, sníh, vítr, slunce (НЕ počasí — «při počasí» без прикметника безглузде)",
  body: "частина тіла: hlava, ruka, koleno",
  bodyLevel: "частина тіла, до якої сягає вода/сніг («po kolena», «po ramena»; разом з body): koleno, rameno, ucho, oko",
  activity: "заняття чи ситуація, під час якої щось відбувається: práce, škola, cesta (při práci, po škole)",
  container: "куди кладуть і звідки виймають: taška, hrnek, lednička, auto, kabát",
  opening: "отвір, крізь який дивляться чи проходять: okno",
  abstract: "абстракція чи слово без природних просторових фраз: cena, sto, milion",
  nature: "рослина, світило, природний об'єкт без власної фрази: růže, květina, hvězda, strom",
  served: "страва чи напій, який подають теплим або холодним («teplá polévka», «studené pivo»): káva, čaj, voda, polévka, maso (НЕ cukr, máslo, jablko — «studený cukr» безглузде; разом з food)",
  homemade: "їжа, що буває домашньою — приготованою чи вирощеною вдома («domácí chléb», «domácí vejce»): chléb, pivo, sýr, ovoce (НЕ voda, káva, cukr; разом з food)",
  air: "повітря, яким дихають і яке відчувають («svěží / čistý / teplý vzduch»): vzduch (НЕ weather — «při vzduchu» безглузде)",
  landform: "природний ландшафт, не створений людиною: moře, řeka, hora, les, pole — «staré / nové moře» неприродне (разом з outdoor)",
  singleLevel: "частина тіла — рівень, до якого щось сягає, ОДНА, не пара («až po krk»; у множинних фразах «po kolena» її немає; разом з body і bodyLevel): krk",
  grade: "шкільний рівень — клас чи рік навчання («chodí do třetí třídy», «je v druhém ročníku», «deváté ročníky jely na výlet»): třída, ročník",
  sequencePart: "частина тексту чи впорядкованого цілого без власних просторових фраз: kapitola, stránka, řada — «zajímavá kapitola», «první řada»; НЕ abstract («vysoká cena» — так, «vysoká stránka» — ні)",
  line: "ряд чи черга, у якій стоять або сидять («stát v řadě», «sedět v první řadě»): řada (згодом fronta, kolona)",
  nonVisual: "річ, яку не намалюєш і не сфотографуєш як предмет («Nakresli ročník» — ні): ročník, kapitola (НЕ stránka — «fotka stránky» природна)",
  recurring: "подія, що повторюється, тож множина природна («při cestách», «po lekcích», «silné deště»): cesta, lekce, oběd, snídaně, večeře, déšť — у множині його беруть лише фрази з plOk «recurring» (загальне правило pluralNatural для meal / weather / activity дає однину); наскрізний",
  ordered: "природно рахується по порядку порядковим числівником від první до dvanáctý («Jsem tu teprve třetí den», «Jedu prvním vlakem», «Bydlím ve třetím patře», «Čekám na druhého hosta»): den, týden, rok, hodina, vlak, patro, dům, host (НЕ родичі — «dvanáctý manžel», НЕ речі без черги — «jedenácté oko»); наскрізний тег — сполучається з будь-яким",
  room: "кімната в будинку чи школі, до якої веде коридор («Chodba vede ke koupelně», «Stojím před třídou»): pokoj, kuchyně, koupelna, třída; у множинних фразах («Mezi pokoji je chodba», «Chodba vede ke třídám») — лише разом з ordered (нумеровані кімнати: pokoj, třída), бо кухня й ванна в квартирі одна",
  plant: "рослина, яку поливають («Dej vodu květinám / stromům»): růže, květina, strom",
  flower: "квітка, що пахне («Voní to růží»; разом з plant): růže, květina — НЕ strom («voní to stromem» неприродне)",
  sight: "місце, заради якого приїжджають туристи («Turisté sem jezdí kvůli hradům / horám / řekám»): hrad, kostel, most, hora, les, park, zahrada, řeka — НЕ dům, ulice, moře («kvůli mořím» неприродне)",
  overhead: "те, під чим можна стояти («Stojím pod stromem / mostem / sprchou / deštníkem»): strom, most, sprcha, deštník",
  floor: "поверх будинку («Nad přízemím je půda»; у множині «Výtah jezdí mezi patry» — лише разом з ordered): přízemí, patro",
  bodyMany: "частина тіла, якої в людини дві чи більше, тож множина природна про одну людину («Mám problém se zuby», «To škodí kolenům»; разом з body): ruka, noha, zub, kost, oko, ucho, koleno, rameno — НЕ hlava, nos, krk, srdce",
  month: "місяць календаря (leden … prosinec; разом з time). Ставиться ТОДІ Й ЛИШЕ ТОДІ, коли в слова є поле month (validateNounSem): множину місяців квіз «Відмінки» не питає («ledny», «v listopadech» у мові не вживаються)",
  season: "пора року, множина якої означає кілька таких пір («Jaké tu bývají zimy?», «Kolik zim jsi tu strávil?»; разом з time): zima, jaro, podzim — НЕ léto (його множина — «роки», тег yearsPlural)",
  weekday: "день тижня («Mám rád pátky», «O sobotách chodím plavat», «Ve středu mám volno»; разом з time): pondělí … neděle",
  daySpan: "частина доби, що триває й повторюється («Po večerech čtu», «Kolik nocí jsi tu strávil?»; разом з time): ráno, dopoledne, odpoledne, večer, noc — НЕ půlnoc, poledne (це моменти, dayPoint)",
  dayPoint: "момент доби («Vrátil se o půlnoci / o poledni»; разом з time): půlnoc, poledne — множини квіз не питає",
  timeV: "час, який кажуть із «v» + місцевим («Co děláš v lednu / v létě / v zimě / v noci?»; разом з time): місяці, léto, zima, noc — НЕ jaro («na jaře»), podzim («na podzim»), дні тижня («v pondělí» — знахідний)",
  yearsPlural: "слово, множина якого означає «роки» («Kolik ti je let?», «před pár lety», «po letech», «Známe se už léta», «Utíkají léta»; українською так само «літа»; разом з time): léto",
  strongPl: "погода, у якої множина природна з «silný» («Očekávají se silné větry», «Kvůli silným dešťům…»; разом з weather). Лише чол. неістота чи жін. рід — фрази мають «silné» у наз. / знах. множини: déšť, vítr — НЕ sníh («silné sněhy» — ні), slunce",
  drink: "напій, який замовляють і п'ють порціями, тож множина — «порції» («Kolik káv denně vypiješ?», «Objednal jsem kávy pro všechny»; разом з food; слово злічуване): káva, čaj, pivo — НЕ voda («kolik vod» — ні)",
  weatherCause: "погода як причина чи перешкода («Kvůli počasí / dešti jsme zůstali doma», «Mám problém se sněhem»): počasí, déšť, sníh, vítr — НЕ slunce",
  sky: "небо й світило, до яких дивляться («Podíval se k nebi / ke slunci»; без weather — ще й «Spím pod širým nebem»): nebe, slunce",
  mineral: "вода, що буває мінеральною, — її множина природна з «minerální» («Pijeme minerální vody»; разом з food): voda",
  oneSystem: "система, яка в місті одна, тож множина неприродна в УСІХ квізах («kvůli metrům», «s jakými metry» — ні; pluralNatural, а в квізі «Відмінки» — правило NOUN_SKIP_RULES): metro (разом з vehicle)",
  worksPl: "робота, у множини якої значення «роботи» — природна з прикметником («Kvůli stavebním pracím je silnice zavřená», «Pomáhám mámě s domácími pracemi»; разом з activity): práce",
};

// Теги-«самоцілі»: слово з таким тегом не має жодних інших (особа не буває будівлею, їжа — місцем тощо).
// Винятки: body разом з bodyLevel / singleLevel / bodyMany, time разом зі своїми підтегами (timeUnit, dayPart, month…), document разом з carried (pas, doklad),
// person разом з collective (rodina), food разом з served / homemade; наскрізні теги (CROSS) — з будь-яким.
const CROSS: NounTag[] = ["ordered", "recurring"];
const SOLO: NounTag[] = ["person", "animal", "money", "food", "meal", "time", "weather", "abstract", "document", "body", "air"];
// Теги, що ВИМАГАЮТЬ супутнього: (тег → хоча б один з переліку).
const REQUIRES: Partial<Record<NounTag, NounTag[]>> = {
  residence: ["placeV", "placeNa"],
  workplace: ["placeV", "placeNa"],
  bodyLevel: ["body"],
  singleLevel: ["bodyLevel"],
  bodyMany: ["body"],
  flower: ["plant"],
  month: ["time"],
  season: ["time"],
  weekday: ["time"],
  daySpan: ["time"],
  dayPoint: ["time"],
  timeV: ["time"],
  yearsPlural: ["time"],
  strongPl: ["weather"],
  drink: ["food"],
  mineral: ["food"],
  oneSystem: ["vehicle"],
  worksPl: ["activity"],
  timeUnit: ["time"],
  landform: ["outdoor"],
  served: ["food"],
  homemade: ["food"],
};

// Перевірка набору тегів одного слова: список проблем (порожній — усе гаразд). Використовується у
// dev-збірці (див. prepositionQuizEngine.ts), у релізі нічого не блокує.
export function validateNounSem(n: Pick<NounEntry, "id" | "sem" | "month">): string[] {
  const out: string[] = [];
  const sem = n.sem ?? [];
  if (sem.length === 0) return [`${n.id}: порожній sem — слово не потрапить у фрази, що вимагають тегів`];
  for (const t of sem) if (!(t in NOUN_TAG_DOC)) out.push(`${n.id}: невідомий тег «${t}»`);
  for (const solo of SOLO) {
    if (!sem.includes(solo)) continue;
    const allowed: NounTag[] =
      solo === "body" ? ["body", "bodyLevel", "singleLevel", "bodyMany"] : solo === "time" ? ["time", "timeUnit", "dayPart", "month", "season", "weekday", "daySpan", "dayPoint", "timeV", "yearsPlural"] : solo === "document" ? ["document", "carried"] : solo === "person" ? ["person", "collective"] : solo === "food" ? ["food", "served", "homemade", "drink", "mineral"] : solo === "weather" ? ["weather", "strongPl", "weatherCause", "sky"] : [solo];
    const extra = sem.filter((t) => !allowed.includes(t) && !CROSS.includes(t));
    if (extra.length > 0) out.push(`${n.id}: тег «${solo}» не сполучається з ${extra.join(", ")}`);
  }
  if (sem.includes("month") !== !!n.month) out.push(`${n.id}: тег month і поле month мають бути разом (обидва або жодного)`);
  if (sem.includes("placeV") && sem.includes("placeNa")) out.push(`${n.id}: placeV і placeNa одночасно (слово має ОДИН прийменник місця)`);
  for (const [tag, need] of Object.entries(REQUIRES) as [NounTag, NounTag[]][]) {
    if (sem.includes(tag) && !need.some((t) => sem.includes(t))) out.push(`${n.id}: тег «${tag}» потребує одного з: ${need.join(", ")}`);
  }
  return out;
}
