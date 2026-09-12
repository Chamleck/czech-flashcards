// Структурований контент розділу "Граматика".
// Кожна тема складається з блоків, які рендерить GrammarTopicScreen.
// Блоки типізовані — легко додавати нові теми без зміни коду екрана.

import { BrowseKind } from "../types";

// Сегмент "багатого" тексту — звичайний фрагмент або клікабельне слово, що
// відкриває картку слова в словнику (BrowseCard) через ту саму навігаційну
// глибину, що вже безпечно працює для результатів пошуку (WordsPartOfSpeechScreen
// openSearchResult): parentScreen → BrowseList → BrowseCard. wordId+kind —
// пара для пошуку в searchIndex.ts (findSearchEntry), а НЕ довільний текст:
// value — це те, що ПОКАЗУЄТЬСЯ (форма як у реченні), wordId — куди веде тап
// (завжди словникова форма). Розмітка РУЧНА (не автоматичний матчинг форм —
// узгоджено окремо, див. нотатки проєкту).
export type ParagraphSegment = { text: string } | { word: string; wordId: string; kind: BrowseKind };

// Зразок відмінювання (взір) — одна позиція в темі "Зразки відмінювання".
// nameWordId — коли сама назва зразка є словниковим словом (тепер усі 11 — і
// stavení теж, додано окремою карткою, бо в словнику досі був лише
// представник цього типу, nádraží, а не саме слово-зразок).
export interface PatternExample {
  name: string;
  nameWordId?: string;
  note: ParagraphSegment[];
}
export interface PatternGroup {
  emoji: string;
  title: string;
  items: PatternExample[];
}

export type GrammarBlock =
  | { type: "paragraph"; text: string }
  | { type: "rich-paragraph"; segments: ParagraphSegment[] } // paragraph із клікабельними словами
  | { type: "heading"; text: string } // кольоровий підзаголовок секції
  | { type: "cases" } // рендерить таблицю 7 відмінків із контрольними питаннями
  | { type: "patterns"; groups: PatternGroup[] } // згруповані зразки відмінювання, дані тут-таки
  | { type: "tip"; text: string }
  | { type: "rich-tip"; segments: ParagraphSegment[] } // tip із клікабельними словами
  | { type: "list"; items: { term: string; note: string }[] }
  | { type: "rich-list"; items: { term: ParagraphSegment[]; note: ParagraphSegment[] }[] }; // список, де term і note клікабельні

export interface GrammarTopic {
  id: string;
  emoji: string;
  title: string; // українською
  subtitle: string;
  ready: boolean; // false → тема ще в розробці (позначка 🔒)
  blocks: GrammarBlock[];
}

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: "gender-number",
    emoji: "⚥",
    title: "Рід і число",
    subtitle: "4 роди, однина й множина",
    ready: true,
    blocks: [
      {
        type: "paragraph",
        text: "У чеській мові чотири роди. Чоловічий рід додатково ділиться на істоти (люди, тварини) та неістоти (предмети) — це впливає на відмінювання, особливо на знахідний відмінок.",
      },
      { type: "heading", text: "Чотири роди" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "🧑 Чоловічий істот." }],
            note: [
              { text: "напр. " },
              { word: "student", wordId: "student", kind: "nouns" },
              { text: " → studenti, " },
              { word: "pán", wordId: "muz-pan", kind: "nouns" },
              { text: " → páni. Знахідний однини = родовий однини (бо істота): «vidím studenta»." },
            ],
          },
          {
            term: [{ text: "📦 Чоловічий неістот." }],
            note: [
              { text: "напр. " },
              { word: "hrad", wordId: "hrad", kind: "nouns" },
              { text: " → hrady, " },
              { word: "stůl", wordId: "stul", kind: "nouns" },
              { text: " → stoly. Знахідний однини = називний однини (бо неістота): «vidím hrad»." },
            ],
          },
          {
            term: [{ text: "🌷 Жіночий" }],
            note: [
              { text: "напр. " },
              { word: "žena", wordId: "zena", kind: "nouns" },
              { text: " → ženy, " },
              { word: "růže", wordId: "ruze", kind: "nouns" },
              { text: " → růže, " },
              { word: "kost", wordId: "kost", kind: "nouns" },
              { text: " → kosti. Часто на -a, -e або приголосний." },
            ],
          },
          {
            term: [{ text: "⚪ Середній" }],
            note: [
              { text: "напр. " },
              { word: "město", wordId: "mesto", kind: "nouns" },
              { text: " → města, " },
              { word: "moře", wordId: "more", kind: "nouns" },
              { text: " → moře, " },
              { word: "kuře", wordId: "kure", kind: "nouns" },
              { text: " → kuřata. Часто на -o, -e, -í; у множині часто -a." },
            ],
          },
        ],
      },
      { type: "heading", text: "Однина і множина" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Число буває однина (jednotné číslo) і множина (množné číslo). Кожен відмінок має окрему форму для однини та множини — тому повна парадигма іменника це 7 × 2 = 14 форм. Наприклад: одна " },
          { word: "žena", wordId: "zena", kind: "nouns" },
          { text: " — дві ženy, jeden " },
          { word: "hrad", wordId: "hrad", kind: "nouns" },
          { text: " — tři hrady." },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 Щоб визначити рід незнайомого слова — дивись на закінчення називного відмінка й перевіряй за словником. Рід у чеській та українській часто збігається, але не завжди (напр. чеське 'to " },
          { word: "auto", wordId: "auto", kind: "nouns" },
          { text: "' — середній рід)." },
        ],
      },
    ],
  },
  {
    id: "seven-cases",
    emoji: "📚",
    title: "Сім відмінків",
    subtitle: "Контрольні питання до кожного",
    ready: true,
    blocks: [
      {
        type: "paragraph",
        text: "Чеська має 7 відмінків. На кожен є контрольне питання — по ньому легше визначити потрібну форму в реченні.",
      },
      { type: "heading", text: "Таблиця відмінків із питаннями" },
      { type: "cases" },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 Кличний відмінок (5.) в українській теж є (мамо, Петре) — використовується при звертанні. У чеській він активний у щоденному мовленні: '" },
          { word: "Pane", wordId: "muz-pan", kind: "nouns" },
          { text: "!', 'Petře!'." },
        ],
      },
    ],
  },
  {
    id: "patterns",
    emoji: "🗂️",
    title: "Зразки відмінювання",
    subtitle: "11 базових взорів",
    ready: true,
    blocks: [
      {
        type: "paragraph",
        text: "Кожен іменник відмінюється за одним із зразків (взорів). Знаючи рід і зразок — можеш побудувати всі 14 форм слова. Зразок визначають за родом і за тим, тверда чи м'яка основа (за останнім приголосним).",
      },
      { type: "heading", text: "11 базових зразків" },
      {
        type: "patterns",
        groups: [
          {
            emoji: "🧑",
            title: "Чол. рід — істоти",
            items: [
              {
                name: "pán",
                nameWordId: "muz-pan",
                note: [
                  { text: "твердий: " },
                  { word: "student", wordId: "student", kind: "nouns" },
                  { text: ", " },
                  { word: "pán", wordId: "muz-pan", kind: "nouns" },
                  { text: ", " },
                  { word: "syn", wordId: "syn", kind: "nouns" },
                  { text: " — називний однини на приголосний, родовий однини на -a" },
                ],
              },
              {
                name: "muž",
                nameWordId: "muz-muz",
                note: [
                  { text: "м'який: " },
                  { word: "učitel", wordId: "ucitel", kind: "nouns" },
                  { text: ", " },
                  { word: "muž", wordId: "muz-muz", kind: "nouns" },
                  { text: ", " },
                  { word: "otec", wordId: "otec", kind: "nouns" },
                  { text: " — родовий однини на -e, часто називний множини на -i/-é" },
                ],
              },
            ],
          },
          {
            emoji: "📦",
            title: "Чол. рід — неістоти",
            items: [
              {
                name: "hrad",
                nameWordId: "hrad",
                note: [
                  { text: "твердий: " },
                  { word: "stůl", wordId: "stul", kind: "nouns" },
                  { text: ", " },
                  { word: "dům", wordId: "dum", kind: "nouns" },
                  { text: ", " },
                  { word: "les", wordId: "les", kind: "nouns" },
                  { text: " — родовий однини на -u, місцевий однини на -e/-u" },
                ],
              },
              {
                name: "stroj",
                nameWordId: "stroj",
                note: [
                  { text: "м'який: " },
                  { word: "pokoj", wordId: "pokoj", kind: "nouns" },
                  { text: ", " },
                  { word: "čaj", wordId: "caj", kind: "nouns" },
                  { text: " — родовий однини на -e, називний множини на -e" },
                ],
              },
            ],
          },
          {
            emoji: "🌷",
            title: "Жін. рід",
            items: [
              {
                name: "žena",
                nameWordId: "zena",
                note: [
                  { text: "твердий на -a: " },
                  { word: "káva", wordId: "kava", kind: "nouns" },
                  { text: ", " },
                  { word: "škola", wordId: "skola", kind: "nouns" },
                  { text: " — родовий однини на -y, орудний однини на -ou" },
                ],
              },
              {
                name: "růže",
                nameWordId: "ruze",
                note: [
                  { text: "м'який на -e: " },
                  { word: "restaurace", wordId: "restaurace", kind: "nouns" },
                  { text: " — родовий однини на -e, називний множини на -e" },
                ],
              },
              {
                name: "kost",
                nameWordId: "kost",
                note: [
                  { text: "на приголосний (i-відміна): " },
                  { word: "věc", wordId: "vec", kind: "nouns" },
                  { text: ", noc — орудний однини на -í" },
                ],
              },
            ],
          },
          {
            emoji: "⚪",
            title: "Сер. рід",
            items: [
              {
                name: "město",
                nameWordId: "mesto",
                note: [
                  { text: "твердий на -o: " },
                  { word: "auto", wordId: "auto", kind: "nouns" },
                  { text: ", " },
                  { word: "okno", wordId: "okno", kind: "nouns" },
                  { text: " — називний множини на -a" },
                ],
              },
              {
                name: "moře",
                nameWordId: "more",
                note: [
                  { text: "м'який на -e: " },
                  { word: "pole", wordId: "pole", kind: "nouns" },
                  { text: " — родовий однини на -e, називний множини на -e" },
                ],
              },
              {
                name: "kuře",
                nameWordId: "kure",
                note: [
                  { text: "малята (тип -ete): " },
                  { word: "dítě", wordId: "dite", kind: "nouns" },
                  { text: "-подібні — родовий однини на -ete, називний множини на -ata" },
                ],
              },
              {
                name: "stavení",
                nameWordId: "staveni",
                note: [
                  { text: "на -í: " },
                  { word: "nádraží", wordId: "nadrazi", kind: "nouns" },
                  { text: " — незмінне в однині, орудний множини на -ími" },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "tip",
        text: "💡 У чол. роду істот той самий принцип чергування, що й у прикметників: перед закінченням -i у називному множини кінцевий приголосний основи часто змінюється — k→c (kluk→kluci, žák→žáci), r→ř (bratr→bratři), h→z, ch→š. Стосується лише називного множини цього роду — решта форм основу не чіпають.",
      },
      {
        type: "tip",
        text: "💡 Порада: спочатку визнач рід і чи слово тверде/м'яке. Це одразу звужує зразок до 1–2 варіантів, і далі легко підставити закінчення.",
      },
    ],
  },
  {
    id: "adjectives",
    emoji: "🎨",
    title: "Прикметники",
    subtitle: "Два зразки: mladý і jarní",
    ready: true,
    blocks: [
      {
        type: "rich-paragraph",
        segments: [
          { text: "Прикметник узгоджується з іменником у роді, числі й відмінку. Тому одне слово має форму для кожного роду: " },
          { word: "mladý", wordId: "mlady", kind: "adjectives" },
          { text: " " },
          { word: "muž", wordId: "muz-muz", kind: "nouns" },
          { text: " (чол.), mladá " },
          { word: "žena", wordId: "zena", kind: "nouns" },
          { text: " (жін.), mladé " },
          { word: "dítě", wordId: "dite", kind: "nouns" },
          { text: " (сер.), mladí muži (мн.). У картках усі чотири роди перемикаються табами зверху." },
        ],
      },
      { type: "heading", text: "Два зразки відмінювання" },
      {
        type: "paragraph",
        text: "На відміну від 11 зразків у іменників, прикметники мають лише два — твердий і м'який. Досить визначити, який із них, і всі 56 форм стають передбачуваними.",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "Твердий — " }, { word: "mladý", wordId: "mlady", kind: "adjectives" }],
            note: [{ text: "у називному однини рід чути в закінченні: -ý / -á / -é (mladý / mladá / mladé). Далі скрізь тверде -ý, -ých, -ým, -ými — КРІМ називного й кличного множини чол. істот., де завжди м'яке -í: mladí muži." }],
          },
          {
            term: [{ text: "М'який — " }, { word: "jarní", wordId: "jarni", kind: "adjectives" }],
            note: [{ text: "закінчення -í однакове в усіх трьох родах: jarní muž, jarní žena, jarní dítě. Найпростіше пізнати так: при зміні роду форма не змінюється." }],
          },
        ],
      },
{ type: "heading", text: "Знахідний однини: істота проти неістоти" },
      {
        type: "paragraph",
        text: "Той самий принцип, що й в іменників (vidím studenta, але vidím hrad), діє і в прикметника чоловічого роду в знахідному однини — бо прикметник узгоджується з іменником, і форма стежить за ним:",
      },
      {
        type: "rich-list",
        items: [
          { term: [{ text: "Чол. істот. → як родовий" }], note: [{ text: "vidím " }, { word: "velkého", wordId: "velky", kind: "adjectives" }, { text: " muže, mám " }, { word: "mladého", wordId: "mlady", kind: "adjectives" }, { text: " bratra — знахідний однини збігається з родовим (-ého)." }] },
          { term: [{ text: "Чол. неістот. → як називний" }], note: [{ text: "vidím " }, { word: "velký", wordId: "velky", kind: "adjectives" }, { text: " dům, mám " }, { word: "mladý", wordId: "mlady", kind: "adjectives" }, { text: " strom — знахідний однини не змінюється, лишається як у називному (-ý)." }] },
        ],
      },
      {
        type: "tip",
        text: "💡 В усіх інших родах (жіночому, середньому) і в множині такого розрізнення немає — воно стосується лише чоловічого роду однини. У множині й жіночому/середньому роді знахідний завжди має свою окрему форму, однакову для істот і неістот.",
      },
      { type: "heading", text: "Чергування приголосного" },
      {
        type: "paragraph",
        text: "У твердого зразка перед закінченням -í (наз./клич. множини чол. істот.) кінцевий приголосний основи часто змінюється:",
      },
      {
        type: "rich-list",
        items: [
          { term: [{ text: "k → c" }], note: [{ word: "velký", wordId: "velky", kind: "adjectives" }, { text: " → velcí, " }, { word: "vysoký", wordId: "vysoky", kind: "adjectives" }, { text: " → vysocí, " }, { word: "nízký", wordId: "nizky", kind: "adjectives" }, { text: " → nízcí, " }, { word: "hezký", wordId: "hezky", kind: "adjectives" }, { text: " → hezcí." }] },
          { term: [{ text: "r → ř" }], note: [{ word: "starý", wordId: "stary", kind: "adjectives" }, { text: " → staří, " }, { word: "dobrý", wordId: "dobry", kind: "adjectives" }, { text: " → dobří, " }, { word: "modrý", wordId: "modry", kind: "adjectives" }, { text: " → modří." }] },
          { term: [{ text: "h → z" }], note: [{ word: "drahý", wordId: "drahy", kind: "adjectives" }, { text: " → drazí." }] },
        ],
      },
      {
        type: "paragraph",
        text: "Стосується воно лише форми чол. істот. у множині — усі інші форми будуються без змін основи. У картках такі слова позначені приміткою про чергування.",
      },
      { type: "heading", text: "Кличний відмінок" },
      {
        type: "rich-paragraph",
        segments: [{ text: "У прикметника кличний відмінок (5.) завжди збігається з називним: «" }, { word: "milý", wordId: "mily", kind: "adjectives" }, { text: " " }, { word: "pane", wordId: "muz-pan", kind: "nouns" }, { text: "!» (milý — як у називному). Окремої форми, як в іменника (pan → pane), прикметник не має: при звертанні змінюється лише сам іменник." }],
      },
      {
        type: "rich-tip",
        segments: [{ text: "💡 Щоб визначити зразок — постав прикметник у чол. рід однини: закінчення -ý/-á/-é за родами → твердий (" }, { word: "mladý", wordId: "mlady", kind: "adjectives" }, { text: "); суцільне -í в усіх родах → м'який (" }, { word: "jarní", wordId: "jarni", kind: "adjectives" }, { text: ")." }],
      },
      { type: "heading", text: "Ступені порівняння" },
      {
        type: "rich-paragraph",
        segments: [{ text: "Прикметник має три ступені: звичайний (" }, { word: "nový", wordId: "novy", kind: "adjectives" }, { text: " — новий), вищий (novější — новіший) і найвищий (nejnovější — найновіший). Вищий утворюється суфіксом, найвищий — префіксом nej- до вищого ступеня." }],
      },
      {
        type: "rich-list",
        items: [
          { term: [{ text: "Вищий: -ější / -ejší" }], note: [{ text: "найчастіший суфікс: " }, { word: "nový", wordId: "novy", kind: "adjectives" }, { text: " → novější, " }, { word: "rychlý", wordId: "rychly", kind: "adjectives" }, { text: " → rychlejší, " }, { word: "tvrdý", wordId: "tvrdy", kind: "adjectives" }, { text: " → tvrdší. Перед ним інколи чергується приголосний основи." }] },
          { term: [{ text: "Вищий: -ší" }], note: [{ text: "коротший варіант для частини прикметників: " }, { word: "mladý", wordId: "mlady", kind: "adjectives" }, { text: " → mladší, " }, { word: "starý", wordId: "stary", kind: "adjectives" }, { text: " → starší, " }, { word: "drahý", wordId: "drahy", kind: "adjectives" }, { text: " → dražší (h→ž)." }] },
          { term: [{ text: "Найвищий: nej- + вищий" }], note: [{ text: "просто додаємо префікс: novější → nejnovější, mladší → nejmladší, lepší → nejlepší." }] },
        ],
      },
      {
        type: "paragraph",
        text: "Нерегулярні ступені (їх треба запам'ятати):",
      },
      {
        type: "rich-list",
        items: [
          { term: [{ word: "dobrý", wordId: "dobry", kind: "adjectives" }, { text: " (добрий)" }], note: [{ text: "→ lepší → nejlepší (кращий, найкращий)." }] },
          { term: [{ word: "špatný", wordId: "spatny", kind: "adjectives" }, { text: " (поганий)" }], note: [{ text: "→ horší → nejhorší (гірший, найгірший)." }] },
          { term: [{ word: "velký", wordId: "velky", kind: "adjectives" }, { text: " (великий)" }], note: [{ text: "→ větší → největší (більший, найбільший)." }] },
          { term: [{ word: "malý", wordId: "maly", kind: "adjectives" }, { text: " (малий)" }], note: [{ text: "→ menší → nejmenší (менший, найменший)." }] },
          { term: [{ word: "dlouhý", wordId: "dlouhy", kind: "adjectives" }, { text: " (довгий)" }], note: [{ text: "→ delší → nejdelší (довший, найдовший)." }] }
        ],
      },
      {
        type: "tip",
        text: "💡 Порівняння з ніж передається сполучником než: «Praha je větší než Brno» (Прага більша, ніж Брно). Найвищий часто йде з прийменником z/ze: «nejlepší z nás» (найкращий з нас).",
      },
      {
        type: "rich-tip",
        segments: [{ text: "💡 Перед суфіксом -ší (і рідше -ější) кінцевий приголосний основи часто чергується — той самий принцип, що й у називному множини чол. істот. (див. вище): k→č (" }, { word: "hezký", wordId: "hezky", kind: "adjectives" }, { text: "→hezčí, " }, { word: "měkký", wordId: "mekky", kind: "adjectives" }, { text: "→měkčí), h→ž (" }, { word: "drahý", wordId: "drahy", kind: "adjectives" }, { text: "→dražší, " }, { word: "ubohý", wordId: "ubohy", kind: "adjectives" }, { text: "→ubožejší), ch→š (" }, { word: "tichý", wordId: "tichy", kind: "adjectives" }, { text: "→tišší). Якщо основа закінчується на -tý/-dý/-ný — приголосний зазвичай не чергується (" }, { word: "mladý", wordId: "mlady", kind: "adjectives" }, { text: "→mladší)." }],
      },
      {
        type: "tip",
        text: "💡 Форми вищого й найвищого ступенів самі відмінюються за родами й відмінками (novější → novějšího → novějšímu…) — як звичайний м'який прикметник. Тут ми відпрацьовуємо відмінювання у звичайному ступені; картки на відмінювання ступенів порівняння додамо згодом окремо.",
      },
    ],
  },
  {
    id: "verbs",
    emoji: "🏃",
    title: "Дієслова",
    subtitle: "Вид, класи та часи",
    ready: true,
    blocks: [
      { type: "heading", text: "Вид: доконаний і недоконаний" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Кожне чеське дієслово має вид. Недоконаний (nedokonavý) описує дію як процес або повторення: " },
          { word: "dělat", wordId: "delat", kind: "verbs" },
          { text: " (робити), " },
          { word: "číst", wordId: "cist", kind: "verbs" },
          { text: " (читати). Доконаний (dokonavý) — дію як завершений результат: " },
          { word: "udělat", wordId: "udelat", kind: "verbs" },
          { text: " (зробити), " },
          { word: "přečíst", wordId: "precist", kind: "verbs" },
          { text: " (прочитати)." },
        ],
      },
      {
        type: "tip",
        text: "💡 Головне для практики: недоконані дієслова мають усі три часи, а доконані НЕ мають теперішнього — їхня «теперішня» форма за значенням є майбутньою (udělám = «зроблю», а не «роблю»). Тому в картках доконані показують лише минулий і майбутній час.",
      },
      { type: "heading", text: "П'ять класів дієвідміни" },
      {
        type: "paragraph",
        text: "П'ять класів дієвідміни. Клас визначають за закінченням 3-ї особи однини (він/вона ___):",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "I клас (-e/-ě)" }],
            note: [
              { text: "nese, bere, čte, peče. Основа часто чергується: péct → peču, číst → čtu. Приклади: " },
              { word: "nést", wordId: "nest", kind: "verbs" },
              { text: " (нести), " },
              { word: "brát", wordId: "brat", kind: "verbs" },
              { text: " (брати), " },
              { word: "číst", wordId: "cist", kind: "verbs" },
              { text: " (читати), " },
              { word: "péct", wordId: "pect", kind: "verbs" },
              { text: " (пекти)." },
            ],
          },
          {
            term: [{ text: "II клас (-ne)" }],
            note: [
              { text: "tiskne, začne, vstane. Характерний суфікс -ne-. Приклади: " },
              { word: "začít", wordId: "zacit", kind: "verbs" },
              { text: " (почати), " },
              { word: "vstát", wordId: "vstat", kind: "verbs" },
              { text: " (встати), " },
              { word: "zapomenout", wordId: "zapomenout", kind: "verbs" },
              { text: " (забути)." },
            ],
          },
          {
            term: [{ text: "III клас (-uje/-je)" }],
            note: [
              { text: "pracuje, kupuje, kryje, hraje, pije. Найпродуктивніший клас — нові й запозичені дієслова йдуть сюди. Приклади: " },
              { word: "pracovat", wordId: "pracovat", kind: "verbs" },
              { text: ", " },
              { word: "kupovat", wordId: "kupovat", kind: "verbs" },
              { text: ", " },
              { word: "krýt", wordId: "kryt", kind: "verbs" },
              { text: ", " },
              { word: "pít", wordId: "pit", kind: "verbs" },
              { text: " (пити), " },
              { word: "mýt", wordId: "myt", kind: "verbs" },
              { text: " (мити), " },
              { word: "hrát", wordId: "hrat", kind: "verbs" },
              { text: " (грати)." },
            ],
          },
          {
            term: [{ text: "IV клас (-í)" }],
            note: [
              { text: "prosí, mluví, vidí, spí. Приклади: " },
              { word: "mluvit", wordId: "mluvit", kind: "verbs" },
              { text: " (говорити), " },
              { word: "vidět", wordId: "videt", kind: "verbs" },
              { text: " (бачити), " },
              { word: "prosit", wordId: "prosit", kind: "verbs" },
              { text: " (просити), " },
              { word: "spát", wordId: "spat", kind: "verbs" },
              { text: " (спати)." },
            ],
          },
          {
            term: [{ text: "V клас (-á)" }],
            note: [
              { text: "dělá, čeká, zná, dívá se. Найрегулярніший, найлегший клас. Приклади: " },
              { word: "dělat", wordId: "delat", kind: "verbs" },
              { text: " (робити), " },
              { word: "čekat", wordId: "cekat", kind: "verbs" },
              { text: " (чекати), " },
              { word: "znát", wordId: "znat", kind: "verbs" },
              { text: " (знати), " },
              { word: "dívat se", wordId: "divat-se", kind: "verbs" },
              { text: " (дивитися)." },
            ],
          },
        ],
      },
      { type: "heading", text: "Нерегулярні та модальні" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Нерегулярні та модальні. Кілька високочастотних дієслів мають власну парадигму й не вкладаються в жоден клас: " },
          { word: "být", wordId: "byt", kind: "verbs" },
          { text: " (jsem/jsi/je…), " },
          { word: "mít", wordId: "mit", kind: "verbs" },
          { text: " (mám/máš…), " },
          { word: "chtít", wordId: "chtit", kind: "verbs" },
          { text: " (chci/chceš…), " },
          { word: "jíst", wordId: "jist", kind: "verbs" },
          { text: " (jím, але oni jedí), " },
          { word: "vědět", wordId: "vedet", kind: "verbs" },
          { text: " (vím, але oni vědí). Модальні " },
          { word: "moci", wordId: "moci", kind: "verbs" },
          { text: " (можу), " },
          { word: "muset", wordId: "muset", kind: "verbs" },
          { text: " (мушу), " },
          { word: "umět", wordId: "umet", kind: "verbs" },
          { text: " (вмію), " },
          { word: "smět", wordId: "smet", kind: "verbs" },
          { text: " (мати дозвіл) зазвичай ідуть з інфінітивом: chci jít, musím pracovat." },
        ],
      },
      { type: "heading", text: "Три часи" },
      {
        type: "paragraph",
        text: "Як утворюється кожен час:",
      },
      {
        type: "rich-list",
        items: [
          { term: [{ text: "Теперішній (лише недоконані)" }], note: [{ text: "особові закінчення додаються до основи: dělá-m, dělá-š, dělá…" }] },
          {
            term: [{ text: "Минулий" }],
            note: [{ text: "дієприкметник на -l (тобто «л-форма» — форма, що закінчується на -l) + допоміжне jsem/jsi (у 3-й особі — без нього). Дієприкметник узгоджується в роді й числі з підметом: dělal (він) / dělala (вона) / dělalo (воно) / dělali (вони, чол. істот.) / dělaly (решта). Тому «я робив» = dělal jsem, а «я робила» = dělala jsem." }],
          },
          {
            term: [{ text: "Майбутній" }],
            note: [
              { text: "у недоконаних складений: budu/budeš… + інфінітив (budu dělat). У доконаних — власна форма (udělám). Дієслова руху " },
              { word: "jít", wordId: "jit", kind: "verbs" },
              { text: "/" },
              { word: "jet", wordId: "jet", kind: "verbs" },
              { text: " мають особливе майбутнє: půjdu (піду), pojedu (поїду), а не budu jít." },
            ],
          },
        ],
      },
      { type: "heading", text: "Зворотні se / si" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Навіщо se/si і яке брати. Se — це знахідний відмінок «себе»: " },
          { word: "dívat se", wordId: "divat-se", kind: "verbs" },
          { text: " (дивитися, букв. «дивити себе»), " },
          { word: "učit se", wordId: "ucit-se", kind: "verbs" },
          { text: " (вчитися = вчити себе), " },
          { word: "bát se", wordId: "bat-se", kind: "verbs" },
          { text: " (боятися). Si — давальний «собі»: " },
          { word: "sednout si", wordId: "sednout-si", kind: "verbs" },
          { text: " (сісти собі), " },
          { word: "vzpomenout si", wordId: "vzpomenout-si", kind: "verbs" },
          { text: " (згадати собі) — тут дія спрямована «для себе», а не «на себе»." },
        ],
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "se-дієслова" }],
            note: [
              { word: "dívat se", wordId: "divat-se", kind: "verbs" },
              { text: ", " },
              { word: "jmenovat se", wordId: "jmenovat-se", kind: "verbs" },
              { text: ", " },
              { word: "učit se", wordId: "ucit-se", kind: "verbs" },
              { text: ", " },
              { word: "vrátit se", wordId: "vratit-se", kind: "verbs" },
              { text: ", " },
              { word: "ptát se", wordId: "ptat-se", kind: "verbs" },
              { text: ", " },
              { word: "stát se", wordId: "stat-se", kind: "verbs" },
              { text: ", " },
              { word: "bát se", wordId: "bat-se", kind: "verbs" },
              { text: ", " },
              { word: "obléknout se", wordId: "obleknout-se", kind: "verbs" },
              { text: " — усі з нашого списку, крім двох нижче." },
            ],
          },
          {
            term: [{ text: "si-дієслова" }],
            note: [
              { word: "sednout si", wordId: "sednout-si", kind: "verbs" },
              { text: " (сісти собі), " },
              { word: "vzpomenout si", wordId: "vzpomenout-si", kind: "verbs" },
              { text: " (згадати собі)." },
            ],
          },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 У більшості дієслів se/si вже стало частиною самого слова — без нього дієслово або не вживається в цьому значенні, або означає геть інше: " },
          { word: "mýt", wordId: "myt", kind: "verbs" },
          { text: " (мити щось) → mýt se (митися, себе). А " },
          { word: "jmenovat se", wordId: "jmenovat-se", kind: "verbs" },
          { text: " чи " },
          { word: "bát se", wordId: "bat-se", kind: "verbs" },
          { text: " без se взагалі не мають того самого сенсу." },
        ],
      },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Порядок зворотної частки se/si. Зворотні дієслова (" },
          { word: "učit se", wordId: "ucit-se", kind: "verbs" },
          { text: ", " },
          { word: "dívat se", wordId: "divat-se", kind: "verbs" },
          { text: ") підкоряються правилу другої позиції в реченні: se/si стоїть одразу після першого наголошеного слова. У минулому часі це між дієприкметником і допоміжним: učil jsem se (не učil se jsem). У складеному майбутньому — після budu: budu se učit (не budu učit se)." },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 Виняток для «ty» (2 особи однини): «jsi» + se/si стягується в ОДНЕ слово — ses/sis. «učil ses» (" },
          { word: "učit se", wordId: "ucit-se", kind: "verbs" },
          { text: "), «vzpomínal sis» (" },
          { word: "vzpomínat si", wordId: "vzpominat-si", kind: "verbs" },
          { text: ") — це і є кодифікована норма (не розмовне спрощення!), а повна форма «učil jsi se» досі офіційно некодифікована, хоч і часто трапляється усно. Для «já/vy» (jsem/jste) такого стягнення нема — лишається «jsem se», «jste se»." },
        ],
      },
      { type: "heading", text: "Наказовий спосіб" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Наказовий спосіб (rozkazovací způsob) виражає наказ, прохання чи заклик: Dělej! (Роби!), Pojď sem! (Ходи сюди!). Він має лише 3 форми — ty (ти), vy (ви) і my (закличне «зробімо»). Форм «я» та «він/вона/вони» немає: наказати можна лише співрозмовнику або собі разом з іншими. Для «нехай він зробить» вживають конструкцію ať to udělá." },
        ],
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "Творення" }],
            note: [
              { text: "від основи 3-ї особи множини: dělají → dělej!, prosí → pros!, kupují → kupuj!. Після d/t/n відбувається пом'якшення: vrátit → vrať!, " },
              { word: "zapomenout", wordId: "zapomenout", kind: "verbs" },
              { text: " → zapomeň!, " },
              { word: "chodit", wordId: "chodit", kind: "verbs" },
              { text: " → choď!" },
            ],
          },
          {
            term: [{ text: "Нерегулярні" }],
            note: [
              { word: "být", wordId: "byt", kind: "verbs" },
              { text: " → buď!, " },
              { word: "mít", wordId: "mit", kind: "verbs" },
              { text: " → měj!, " },
              { word: "jíst", wordId: "jist", kind: "verbs" },
              { text: " → jez!, " },
              { word: "vědět", wordId: "vedet", kind: "verbs" },
              { text: " → věz!, " },
              { word: "vidět", wordId: "videt", kind: "verbs" },
              { text: " → viz!, " },
              { word: "jít", wordId: "jit", kind: "verbs" },
              { text: " → jdi! (туди) / pojď! (сюди)." },
            ],
          },
          { term: [{ text: "Вид" }], note: [{ text: "стверджувальний наказ зазвичай від доконаного виду (Udělej to!), заперечний — від недоконаного (Nedělej to!)." }] },
        ],
      },
      {
        type: "tip",
        text: "💡 Майбутній час теж може звучати як наказ: Uděláš to hned! (Зробиш це негайно!) — це та сама форма майбутнього часу, лише вжита з наказовою інтонацією, а не окремий наказовий спосіб.",
      },
      {
        type: "tip",
        text: "💡 Порада: щоб визначити клас незнайомого дієслова — постав його в 3-тю особу однини (він ___) і подивись на закінчення: -e/-ě → I, -ne → II, -uje/-je → III, -í → IV, -á → V.",
      },
    ],
  },
  {
    id: "pronouns",
    emoji: "👤",
    title: "Займенники",
    subtitle: "Особові, присвійні та вказівні",
    ready: true,
    blocks: [
      {
        type: "rich-paragraph",
        segments: [
          { text: "Займенники бувають особові (" },
          { word: "já", wordId: "pp-ja", kind: "personal" },
          { text: ", " },
          { word: "ty", wordId: "pp-ty", kind: "personal" },
          { text: ", " },
          { word: "on", wordId: "pp-on", kind: "personal" },
          { text: "), присвійні (" },
          { word: "můj", wordId: "muj", kind: "pronouns" },
          { text: ", " },
          { word: "náš", wordId: "nas", kind: "pronouns" },
          { text: ") та вказівні (" },
          { word: "ten", wordId: "ten", kind: "pronouns" },
          { text: ", " },
          { word: "tento", wordId: "tento", kind: "pronouns" },
          { text: ", " },
          { word: "tenhle", wordId: "tenhle", kind: "pronouns" },
          { text: "). Присвійні й вказівні узгоджуються в роді, числі й відмінку — як прикметники, тому в картках вони теж мають таби роду. Особові мають власну нерегулярну парадигму — про неї нижче окремо." },
        ],
      },
      { type: "heading", text: "Присвійні — чиє це?" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Присвійні (чиє це?): " },
          { word: "můj", wordId: "muj", kind: "pronouns" },
          { text: " (мій), " },
          { word: "tvůj", wordId: "tvuj", kind: "pronouns" },
          { text: " (твій), " },
          { word: "jeho", wordId: "jeho", kind: "pronouns" },
          { text: " (його), " },
          { word: "její", wordId: "jeji", kind: "pronouns" },
          { text: " (її), " },
          { word: "náš", wordId: "nas", kind: "pronouns" },
          { text: " (наш), " },
          { word: "váš", wordId: "vas", kind: "pronouns" },
          { text: " (ваш), " },
          { word: "jejich", wordId: "jejich", kind: "pronouns" },
          { text: " (їхній) і зворотний " },
          { word: "svůj", wordId: "svuj", kind: "pronouns" },
          { text: " (свій). Поводяться вони по-різному:" },
        ],
      },
      {
        type: "rich-list",
        items: [
          {
            term: [
              { word: "můj", wordId: "muj", kind: "pronouns" },
              { text: " / " },
              { word: "tvůj", wordId: "tvuj", kind: "pronouns" },
              { text: " / " },
              { word: "svůj", wordId: "svuj", kind: "pronouns" },
            ],
            note: [{ text: "відмінюються майже як прикметник mladý (крім називного й знахідного). Жіночий рід має паралельні форми: má / moje, mou / moji — обидві правильні." }],
          },
          {
            term: [
              { word: "náš", wordId: "nas", kind: "pronouns" },
              { text: " / " },
              { word: "váš", wordId: "vas", kind: "pronouns" },
            ],
            note: [{ text: "власний м'який займенниковий зразок: našeho, našemu, naším, naší, našich, našimi." }],
          },
          {
            term: [{ word: "její", wordId: "jeji", kind: "pronouns" }, { text: " (її)" }],
            note: [{ text: "відмінюється як прикметник jarní: jejího, jejímu, jejím, jejích. Форма змінюється за відмінком, хоч і схожа на незмінну." }],
          },
          {
            term: [
              { word: "jeho", wordId: "jeho", kind: "pronouns" },
              { text: ", " },
              { word: "jejich", wordId: "jejich", kind: "pronouns" },
            ],
            note: [{ text: "НЕ відмінюються — одна форма на всі відмінки, роди й числа: jeho auto, jeho auta, s jeho autem." }],
          },
        ],
      },
      { type: "heading", text: "Вказівні — котрий саме?" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Вказівні (котрий саме?): " },
          { word: "ten", wordId: "ten", kind: "pronouns" },
          { text: " (той), ta (та), to (те). Мають власний твердий займенниковий зразок ten: toho, tomu, tím у однині; ti / ty / ta та těch, těm, těmi у множині." },
        ],
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "tento", wordId: "tento", kind: "pronouns" }, { text: " (цей)" }],
            note: [{ text: "ten + незмінний суфікс -to: відмінюється лише перша частина (tento, tohoto, tomuto, tímto; tato, této…). Книжніший, точніший відповідник «цей»." }],
          },
          {
            term: [{ word: "tenhle", wordId: "tenhle", kind: "pronouns" }, { text: " (оцей)" }],
            note: [{ text: "ten + -hle: те саме відмінювання (tenhle, tohohle, tomuhle, tímhle). Розмовніший варіант, частий у мовленні." }],
          },
          {
            term: [{ word: "takový", wordId: "takovy", kind: "pronouns" }, { text: " (такий)" }],
            note: [{ text: "вказує не на предмет, а на його ВЛАСТИВІСТЬ (який?). Відмінюється повністю як прикметник за зразком mladý: takový, takového, takovému…" }],
          },
          {
            term: [{ word: "tentýž", wordId: "tentyz", kind: "pronouns" }, { text: " / týž (той самий)" }],
            note: [{ text: "тотожність — «той самий, що вже згадувався». Відмінюється як mladý з додаванням -ž: téhož, témuž, tímtéž. Форма týž — коротший книжний варіант того ж слова." }],
          },
          {
            term: [{ word: "sám", wordId: "sam", kind: "pronouns" }, { text: " (сам)" }],
            note: [{ text: "підкреслює, що дію виконано особисто / без сторонньої допомоги. Мішана відміна: у наз. і знах. — короткі форми (sám, sama, samo; мн. sami/samy/sama), у решті відмінків — як прикметник (samého, samému…). Увага: наз. мн. чол. істот. sami (м'яке i), а знах. мн. samy." }],
          },
        ],
      },
      { type: "heading", text: "Кличний відмінок" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Займенники кличного відмінка не мають — при звертанні їхнього рядка немає (у картках він позначений «—»). Кличну форму бере лише сам іменник: «" },
          { word: "Můj", wordId: "muj", kind: "pronouns" },
          { text: " příteli!» — тут můj стоїть у називному, а кличну форму має тільки " },
          { word: "příteli", wordId: "pritel", kind: "nouns" },
          { text: "." },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 " },
          { word: "svůj", wordId: "svuj", kind: "pronouns" },
          { text: " (свій) вживають, коли присвійність стосується підмета речення: «Mám rád svůj pokoj» = люблю свою (власну) кімнату. Якщо сказати «můj pokoj», акцент просто на приналежності, без зв'язку з підметом — тому в багатьох реченнях природніше svůj." },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 " },
          { word: "váš", wordId: "vas", kind: "pronouns" },
          { text: " / " },
          { word: "vy", wordId: "pp-vy", kind: "personal" },
          { text: " — це не лише «ваш» до кількох людей, а й ввічливе звертання до однієї особи (як укр. «Ви»): «Je to váš kufr, pane?». Тому váš чуєш і там, де йдеться про одну людину, до якої звертаються шанобливо." },
        ],
      },
      { type: "heading", text: "Особові — хто діє?" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Особові займенники (" },
          { word: "já", wordId: "pp-ja", kind: "personal" },
          { text: ", " },
          { word: "ty", wordId: "pp-ty", kind: "personal" },
          { text: ", " },
          { word: "on, ona, ono", wordId: "pp-on", kind: "personal" },
          { text: ", " },
          { word: "my", wordId: "pp-my", kind: "personal" },
          { text: ", " },
          { word: "vy", wordId: "pp-vy", kind: "personal" },
          { text: ", " },
          { word: "oni, ony, ona", wordId: "pp-oni", kind: "personal" },
          { text: ") та зворотний " },
          { word: "se/si", wordId: "pp-se", kind: "personal" },
          { text: " мають нерегулярну парадигму — її треба просто вивчити. Головна складність не в називному, а в інших відмінках, де форми часто зовсім інші (já → mě, mně, mnou)." },
        ],
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "Короткі й довгі форми" }],
            note: [
              { word: "já", wordId: "pp-ja", kind: "personal" },
              { text: ", " },
              { word: "ty", wordId: "pp-ty", kind: "personal" },
              { text: " та se мають короткий (приклонка) і довгий твар: mě/mne, mi/mně, tě/tebe, ti/tobě, se/sebe, si/sobě. Короткий стоїть усередині речення (Vidím tě), довгий — на початку, під наголосом і завжди після прийменника (pro tebe, beze mě)." },
            ],
          },
          {
            term: [{ word: "mě", wordId: "pp-ja", kind: "personal" }, { text: " vs " }, { word: "mně", wordId: "pp-ja", kind: "personal" }],
            note: [{ text: "У родовому і знахідному (2. і 4.) — mě (2 літери), у давальному і місцевому (3. і 6.) — mně (3 літери). Підказка: підстав «Pepa» — Pepu → mě, Pepovi → mně." }],
          },
          {
            term: [{ text: "Форми після прийменника (3-тя особа)" }],
            note: [
              { text: "У третьої особи (" },
              { word: "on/ona/ono", wordId: "pp-on", kind: "personal" },
              { text: ") після прийменника початкове j- переходить у м'яке n-: jemu → k němu, jí → s ní, jich → od nich, je → na ně. Це м'яке n традиційно називають «ň», але окремої літери з гачком тут ніколи не буде — перед ě/í/i м'якість n передається самим написанням (němu, ní, nich, ně), тому в прикладах бачиш звичайне n. Без прийменника — j-форма (znám ho), з прийменником — n-форма (jdu k němu)." },
            ],
          },
          {
            term: [{ word: "ji", wordId: "pp-on", kind: "personal" }, { text: " vs " }, { word: "jí", wordId: "pp-on", kind: "personal" }, { text: " (вона)" }],
            note: [{ text: "Знахідний — ji (короткий i): Vidím ji. Решта відмінків (родовий/давальний/місцевий/орудний) — jí (довгий í): bez ní, s ní. Після прийменника скрізь ní." }],
          },
          {
            term: [{ text: "Зворотний " }, { word: "se/si", wordId: "pp-se", kind: "personal" }],
            note: [{ text: "Не має називного відмінка (1.) взагалі. se — знахідний (myji se), si — давальний (koupím si). Стосується підмета: Dívám se = дивлюсь на себе/просто дивлюся." }],
          },
          {
            term: [
              { word: "my", wordId: "pp-my", kind: "personal" },
              { text: " / " },
              { word: "vy", wordId: "pp-vy", kind: "personal" },
            ],
            note: [{ text: "Найпростіші: одна форма на кожен відмінок, після прийменника не змінюються (nás, nám, námi; vás, vám, vámi). Пиши my, vy з твердим y." }],
          },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 s " },
          { word: "sebou", wordId: "pp-se", kind: "personal" },
          { text: " vs sebou: «vezmi to s sebou» (візьми з собою) — з прийменником s; але «hodil sebou» (кинувся) — без прийменника. У сучасній мові часто плутають, орієнтуйся на зміст: якщо «разом зі мною/тобою» — пиши s sebou." },
        ],
      },
    ],
  },
  {
    id: "numbers-dates",
    emoji: "🔢",
    title: "Числівники й дати",
    subtitle: "Числа, дні, місяці",
    ready: true,
    blocks: [
      {
        type: "rich-paragraph",
        segments: [
          { text: "Числівники бувають кількісні (" },
          { word: "jeden", wordId: "card-jeden", kind: "cardinals" },
          { text: ", " },
          { word: "dva", wordId: "card-dva", kind: "cardinals" },
          { text: ", " },
          { word: "pět", wordId: "card-pet", kind: "cardinals" },
          { text: " — «скільки?») і порядкові (" },
          { word: "první", wordId: "ord-prvni", kind: "adjectives" },
          { text: ", " },
          { word: "druhý", wordId: "ord-druhy", kind: "adjectives" },
          { text: ", " },
          { word: "třetí", wordId: "ord-treti", kind: "adjectives" },
          { text: " — «котрий?»). Кількісні мають особливе відмінювання, а порядкові відмінюються як звичайні прикметники (зразок mladý, а перший/третій — за м'яким jarní)." },
        ],
      },
      { type: "heading", text: "Узгодження з іменником" },
      {
        type: "paragraph",
        text: "Головна особливість чеської: після числівника 5 і більше в називному та знахідному відмінку іменник стоїть у РОДОВОМУ множини — не в називному. Це відрізняється від українського відчуття.",
      },
      {
        type: "list",
        items: [
          { term: "1 → називний однини", note: "jeden dům, jedna žena, jedno auto — узгоджується в роді." },
          { term: "2, 3, 4 → називний множини", note: "dva domy, tři ženy, čtyři auta — іменник у звичайній множині." },
          { term: "5 і більше → родовий множини", note: "pět domů, šest žen, sedm aut — іменник у родовому множини («numerativ»)." },
        ],
      },
      {
        type: "tip",
        text: "💡 Це правило діє лише в називному й знахідному. У непрямих відмінках (давальний, орудний, місцевий) і числівник, і іменник стоять в одному відмінку: «se pěti muži» (з п'ятьма чоловіками), не в родовому.",
      },
      { type: "heading", text: "Рід у числівниках 1, 2 і oba" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Тільки " },
          { word: "jeden", wordId: "card-jeden", kind: "cardinals" },
          { text: ", " },
          { word: "dva", wordId: "card-dva", kind: "cardinals" },
          { text: " і " },
          { word: "oba", wordId: "card-oba", kind: "cardinals" },
          { text: " змінюються за родом. jeden / jedna / jedno (чол. / жін. / сер.). dva (чол.) — але dvě (жін. і сер.): dva muži, dvě ženy, dvě auta. Слово oba (обидва) поводиться точно так само, як dva: oba (чол.) — obě (жін. і сер.): oba bratři, obě sestry, obě auta. Числівники tři, čtyři та 5+ за родом не змінюються." },
        ],
      },
      { type: "heading", text: "Сотні і тисячі" },
      {
        type: "rich-paragraph",
        segments: [
          { word: "sto", wordId: "num-sto", kind: "nouns" },
          { text: " і " },
          { word: "tisíc", wordId: "num-tisic", kind: "nouns" },
          { text: " — звичайні іменники (sto відмінюється як město, tisíc як stroj). При множенні беруть різні форми залежно від числа перед ними — за тим самим правилом 1 / 2-4 / 5+:" },
        ],
      },
      {
        type: "list",
        items: [
          { term: "100 · 1000", note: "(jedno) sto, (jeden) tisíc" },
          { term: "200–400", note: "dvě stě, tři sta, čtyři sta · dva tisíce, tři tisíce, čtyři tisíce" },
          { term: "500+", note: "pět set, šest set… · pět tisíc, šest tisíc… (форма родового множини)" },
        ],
      },
      {
        type: "tip",
        text: "💡 «dvě stě» — це залишок старої форми двоїни (колись рахували «один, два, багато»). Тому 200 має окрему форму «stě», а від 300 уже звичайне «sta».",
      },
      { type: "heading", text: "Сотні/тисячі з іменником" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Після " },
          { word: "sto", wordId: "num-sto", kind: "nouns" },
          { text: ", " },
          { word: "tisíc", wordId: "num-tisic", kind: "nouns" },
          { text: ", " },
          { word: "milion", wordId: "num-milion", kind: "nouns" },
          { text: ", " },
          { word: "miliarda", wordId: "num-miliarda", kind: "nouns" },
          { text: " іменник-предмет стоїть у РОДОВОМУ множини: sto korun, tisíc lidí, milion obyvatel. Для tisíc/milion/miliarda це діє в усіх відмінках без винятку (k tisíci korun, o milionu lidí — іменник лишається в родовому)." },
        ],
      },
      {
        type: "tip",
        text: "💡 У непрямих відмінках зі sto є й варіант з повним узгодженням (ke stu korunám), обидва нормативні. Базовий, найуживаніший спосіб — родовий іменника (ke stu korun); у сумніві обирайте його — він працює завжди.",
      },
      { type: "heading", text: "Мільйони і мільярди" },
      {
        type: "rich-paragraph",
        segments: [
          { word: "milion", wordId: "num-milion", kind: "nouns" },
          { text: " і " },
          { word: "miliarda", wordId: "num-miliarda", kind: "nouns" },
          { text: " — теж звичайні іменники (milion за зразком hrad, miliarda за зразком žena), і на відміну від sto/tisíc — БЕЗ жодних винятків у відмінюванні. Узгоджуються з тим самим правилом 1/2-4/5+: milion, dva miliony, pět milionů; miliarda, dvě miliardy, pět miliard." },
        ],
      },
      { type: "heading", text: "Складені числа 21–99 з іменником" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "У складеному числі (" },
          { word: "dvacet", wordId: "card-dvacet", kind: "cardinals" },
          { text: " jedna, třicet pět…) узгодження іменника вирішує ОСТАННЯ цифра — за тим самим правилом 1 / 2-4 / 5+, що й прості числа. Тобто спершу дивимось на одиницю, а вже вона диктує форму іменника." },
        ],
      },
      {
        type: "list",
        items: [
          { term: "…1 → як jeden", note: "dvacet jeden dům, třicet jedna žena — однина, узгоджена в роді." },
          { term: "…2, …3, …4 → як 2-4", note: "dvacet dva domy, čtyřicet tři ženy — множина." },
          { term: "…5–…9 → як 5+", note: "dvacet pět domů, šedesát osm žen — родовий множини." },
        ],
      },
      {
        type: "tip",
        text: "💡 У непрямих відмінках чисел на …5–…9 відмінюються ОБИДВІ частини: «bez čtyřiceti sedmi oken» (47), «o šedesáti osmi lidech» (68). А от для чисел на …1–…4 непрямі відмінки в реальній мові хиткі — носії часто лишають число незмінним. Тому тут досить знати називний і знахідний, а в непрямих орієнтуйся на …5+ як надійний зразок.",
      },
      { type: "heading", text: "Як складаються великі числа" },
      {
        type: "paragraph",
        text: "На відміну від узгодження з іменником (де є граматичні правила), складання самого числа з частин — це просто послідовне перелічування шматків одне за одним, без жодної особливої граматики:",
      },
      {
        type: "list",
        items: [
          { term: "134", note: "sto třicet čtyři (сто + тридцять + чотири)" },
          { term: "256", note: "dvě stě padesát šest" },
          { term: "3 421", note: "tři tisíce čtyři sta dvacet jedna" },
          { term: "2 000 000", note: "dva miliony" },
          { term: "8 000 000 000", note: "osm miliard" },
        ],
      },
      {
        type: "tip",
        text: "💡 Кожен шматок (тисячі → сотні → десятки-одиниці) просто йде по черзі своєю формою — не треба узгоджувати їх між собою. Складне лише саме число сотень/тисяч перед іменником, який рахують (див. вище).",
      },
      { type: "heading", text: "Дні тижня і місяці: v / ve" },
      {
        type: "paragraph",
        text: "Той самий прийменник v/ve поводиться по-різному з днями й місяцями — це часта пастка:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "v + ДЕНЬ → знахідний" }],
            note: [
              { text: "v " },
              { word: "pondělí", wordId: "pondeli", kind: "nouns" },
              { text: ", v " },
              { word: "sobotu", wordId: "sobota", kind: "nouns" },
              { text: ", ve " },
              { word: "středu", wordId: "streda", kind: "nouns" },
              { text: " — «у понеділок, у суботу, в середу»." },
            ],
          },
          {
            term: [{ text: "v + МІСЯЦЬ → місцевий" }],
            note: [
              { text: "v " },
              { word: "lednu", wordId: "leden", kind: "nouns" },
              { text: ", v " },
              { word: "květnu", wordId: "kveten", kind: "nouns" },
              { text: ", v " },
              { word: "září", wordId: "zari", kind: "nouns" },
              { text: " — «у січні, у травні, у вересні»." },
            ],
          },
        ],
      },
      {
        type: "tip",
        text: "💡 Форма ve (замість v) з'являється перед збігом приголосних для милозвучності: ve středu, ve čtvrtek, ve třech.",
      },
    ],
  },
  {
    id: "date-time",
    emoji: "🕐",
    title: "Дати й час",
    subtitle: "Число місяця та як казати години",
    ready: true,
    blocks: [
      { type: "heading", text: "Як назвати дату" },
      {
        type: "paragraph",
        text: "Дата в чеській — це порядковий числівник (день) + назва місяця, обидва в РОДОВОМУ відмінку, без прийменника. Формула: «pátého května» (п'ятого травня). Порядковий відповідає на питання kolikátého? (котрого?).",
      },
      {
        type: "rich-list",
        items: [
          { term: [{ text: "1. " }, { word: "května", wordId: "kveten", kind: "nouns" }], note: [{ text: "prvního " }, { word: "května", wordId: "kveten", kind: "nouns" }, { text: " — першого травня" }] },
          { term: [{ text: "5. " }, { word: "října", wordId: "rijen", kind: "nouns" }], note: [{ text: "pátého " }, { word: "října", wordId: "rijen", kind: "nouns" }, { text: " — п'ятого жовтня" }] },
          { term: [{ text: "20. " }, { word: "dubna", wordId: "duben", kind: "nouns" }], note: [{ text: "dvacátého " }, { word: "dubna", wordId: "duben", kind: "nouns" }, { text: " — двадцятого квітня" }] },
        ],
      },
      {
        type: "tip",
        text: "💡 Крапка після цифри в даті — це не крапка речення, а позначка порядкового числівника: «5. května» читається «pátého května», не «pět». Тому день завжди пишуть з крапкою.",
      },
      { type: "heading", text: "Складені числа 13–31" },
      {
        type: "paragraph",
        text: "Для складених дат (21–29, 31) є два нормативні способи. Аналітичний — обидві частини порядкові й обидві відмінюються: «dvacátého pátého» (не можна відмінити лише першу половину!). Злитий (за німецькою моделлю) — одиниця приєднується до десятка: «pětadvacátého». Обидва правильні; аналітичний офіційніший.",
      },
      {
        type: "rich-list",
        items: [
          { term: [{ text: "21. " }, { word: "května", wordId: "kveten", kind: "nouns" }], note: [{ text: "dvacátého prvního / jednadvacátého" }] },
          { term: [{ text: "24. " }, { word: "prosince", wordId: "prosinec", kind: "nouns" }], note: [{ text: "dvacátého čtvrtého / čtyřiadvacátého — Святвечір" }] },
          { term: [{ text: "25. " }, { word: "května", wordId: "kveten", kind: "nouns" }], note: [{ text: "dvacátého pátého / pětadvacátého" }] },
        ],
      },
      { type: "heading", text: "Родовий чи називний?" },
      {
        type: "paragraph",
        text: "Зазвичай дата в родовому — бо відповідає на «коли?»: «Narodil jsem se pátého května» (я народився п'ятого травня). Але коли дата САМА є підметом (про що йдеться), вона в називному: «První leden je státní svátek» (Перше січня — державне свято).",
      },
      {
        type: "tip",
        text: "💡 Відчуй різницю: «prvního ledna se slaví Nový rok» (першого січня — коли, родовий) проти «první leden je svátek» (перше січня — сам предмет розмови, називний).",
      },
      {
        type: "rich-tip",
        segments: [{ text: "💡 Коли місяць названий СЛОВОМ — обидва в родовому: «čtrnáctého " }, { word: "února", wordId: "unor", kind: "nouns" }, { text: "». Але якщо місяць позначений числом, усталена практика (за рекомендацією Інституту чеської мови): день у родовому, а місяць-число в називному — «čtrnáctého druhý» — щоб уникнути плутанини двох однакових закінчень." }],
      },
      { type: "heading", text: "Котра година: офіційно" },
      {
        type: "rich-paragraph",
        segments: [{ text: "У формальному контексті (розклади, радіо, вокзал) — 24-годинна система: просто «година хвилина» без слова " }, { word: "hodina", wordId: "hodina", kind: "nouns" }, { text: ". «Je patnáct dvacet» (15:20). Ціла година: «Je patnáct " }, { word: "hodin", wordId: "hodina", kind: "nouns" }, { text: "»." }],
      },
      { type: "heading", text: "Котра година: розмовно" },
      {
        type: "paragraph",
        text: "У побуті все відлічується ВПЕРЕД, до наступної години (як українське «пів на другу»). Але чеська йде далі — так само працюють і чверті:",
      },
      {
        type: "list",
        items: [
          { term: "čtvrt na + знахідний", note: "1:15 → čtvrt na dvě (чверть на другу) — кількісне у знахідному: na jednu, na dvě" },
          { term: "půl + родовий", note: "1:30 → půl druhé (пів другої) — ПОРЯДКОВЕ у родовому жін.: druhé, třetí…" },
          { term: "tři čtvrtě na + знахідний", note: "1:45 → tři čtvrtě na dvě (три чверті на другу)" },
        ],
      },
      {
        type: "tip",
        text: "💡 Увага на два різні числівники: після čtvrt na / tři čtvrtě na йде КІЛЬКІСНЕ у знахідному (na jednu, na dvě), а після půl — ПОРЯДКОВЕ у родовому (druhé, třetí). І виняток: 12:30 = «půl jedné», не «půl první».",
      },
      {
        type: "paragraph",
        text: "Проміжні хвилини — через «za X minut <опорна точка>»: «za pět minut půl druhé» (за 5 хв пів другої, тобто 1:25), «za deset minut tři čtvrtě na dvě» (1:35).",
      },
      {
        type: "rich-list",
        items: [
          { term: [{ word: "poledne", wordId: "poledne", kind: "nouns" }, { text: " / " }, { word: "půlnoc", wordId: "pulnoc", kind: "nouns" }], note: [{ text: "v " }, { word: "poledne", wordId: "poledne", kind: "nouns" }, { text: " (опівдні) — але o " }, { word: "půlnoci", wordId: "pulnoc", kind: "nouns" }, { text: " (опівночі): різні прийменники" }] },
          { term: [{ text: "цілі 2-4" }], note: [{ text: "«Jsou dvě " }, { word: "hodiny", wordId: "hodina", kind: "nouns" }, { text: "», «Jsou tři hodiny» — дієслово в множині; для 1 і 5+ — «Je»" }] },
        ],
      },
      { type: "heading", text: "Уточнення: ранок, день чи вечір?" },
      {
        type: "rich-paragraph",
        segments: [{ text: "Розмовний час сам по собі не показує ранок це чи вечір (на відміну від 24-год формату). Якщо це не ясно з контексту, додають слово-уточнення ПІСЛЯ всієї фрази: " }, { word: "ráno", wordId: "rano", kind: "nouns" }, { text: ", " }, { word: "dopoledne", wordId: "dopoledne", kind: "nouns" }, { text: ", " }, { word: "odpoledne", wordId: "odpoledne", kind: "nouns" }, { text: ", " }, { word: "večer", wordId: "vecer", kind: "nouns" }, { text: ", v " }, { word: "noci", wordId: "noc", kind: "nouns" }, { text: "." }],
      },
      {
        type: "rich-list",
        items: [
          { term: [{ text: "v půl druhé " }, { word: "ráno", wordId: "rano", kind: "nouns" }], note: [{ text: "пів другої РАНКУ (1:30)" }] },
          { term: [{ text: "v půl druhé " }, { word: "odpoledne", wordId: "odpoledne", kind: "nouns" }], note: [{ text: "пів другої ДНЯ (13:30)" }] },
          { term: [{ text: "ve tři čtvrtě na sedm " }, { word: "večer", wordId: "vecer", kind: "nouns" }], note: [{ text: "за чверть сьома ВЕЧОРА (18:45)" }] },
        ],
      },
      {
        type: "rich-tip",
        segments: [{ text: "💡 Межі цих слів у чеській дещо розмиті (навіть мовознавці це визнають) — приблизно: " }, { word: "ráno", wordId: "rano", kind: "nouns" }, { text: " 6–9, " }, { word: "dopoledne", wordId: "dopoledne", kind: "nouns" }, { text: " 9–12, " }, { word: "odpoledne", wordId: "odpoledne", kind: "nouns" }, { text: " 12–18, " }, { word: "večer", wordId: "vecer", kind: "nouns" }, { text: " 18–22, v " }, { word: "noci", wordId: "noc", kind: "nouns" }, { text: " 22–6. Не намагайся визначити межу з точністю до хвилини — носії теж не завжди погоджуються." }],
      },
    ],
  },
  {
    id: "prepositions-fixed",
    emoji: "🧭",
    title: "Прийменники (фіксований відмінок)",
    subtitle: "Який відмінок вимагає кожен прийменник",
    ready: true,
    blocks: [
      { type: "heading", text: "Прийменник керує відмінком" },
      {
        type: "paragraph",
        text: "Прийменник — незмінне слово, але він ВИМАГАЄ від наступного іменника певного відмінка. У чеській це жорстке правило: щоб правильно поставити слово після прийменника, треба знати, яким відмінком цей прийменник керує. Багато прийменників завжди керують одним і тим самим відмінком — їх і зібрано тут.",
      },
      { type: "heading", text: "Родовий (2. — Koho? Čeho?)" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "bez", wordId: "prep-bez", kind: "prepositions" }],
            note: [{ text: "без — «káva bez cukru» (кава без цукру)" }],
          },
          {
            term: [{ word: "do", wordId: "prep-do", kind: "prepositions" }],
            note: [{ text: "до (всередину/до часу) — «jdu do školy»" }],
          },
          {
            term: [{ word: "od", wordId: "prep-od", kind: "prepositions" }],
            note: [{ text: "від — «dopis od kamaráda»" }],
          },
          {
            term: [{ word: "z / ze", wordId: "prep-z", kind: "prepositions" }],
            note: [{ text: "з (звідкись) — «vracím se z práce»" }],
          },
          {
            term: [{ word: "u", wordId: "prep-u", kind: "prepositions" }],
            note: [{ text: "біля / у когось — «bydlím u nádraží»" }],
          },
          {
            term: [{ word: "vedle", wordId: "prep-vedle", kind: "prepositions" }],
            note: [{ text: "поряд — «vedle okna»" }],
          },
          {
            term: [{ word: "kolem", wordId: "prep-kolem", kind: "prepositions" }],
            note: [{ text: "навколо / повз — «kolem domu»" }],
          },
          {
            term: [{ word: "kromě", wordId: "prep-kromě", kind: "prepositions" }],
            note: [{ text: "крім — «všichni kromě Petra»" }],
          },
          {
            term: [{ word: "místo", wordId: "prep-misto", kind: "prepositions" }],
            note: [{ text: "замість — «místo tebe»" }],
          },
          {
            term: [{ word: "podle", wordId: "prep-podle", kind: "prepositions" }],
            note: [{ text: "згідно з — «podle návodu»" }],
          },
        ],
      },
      { type: "heading", text: "Давальний (3. — Komu? Čemu?)" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "k / ke", wordId: "prep-k", kind: "prepositions" }],
            note: [{ text: "до (у напрямку) — «jdu k lékaři»" }],
          },
          {
            term: [{ word: "kvůli", wordId: "prep-kvuli", kind: "prepositions" }],
            note: [{ text: "через (причина) — «kvůli nemoci»" }],
          },
          {
            term: [{ word: "díky", wordId: "prep-diky", kind: "prepositions" }],
            note: [{ text: "завдяки — «díky tobě»" }],
          },
          {
            term: [{ word: "proti", wordId: "prep-proti", kind: "prepositions" }],
            note: [{ text: "проти / навпроти — «proti návrhu»" }],
          },
        ],
      },
      { type: "heading", text: "Знахідний (4. — Koho? Co?)" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "pro", wordId: "prep-pro", kind: "prepositions" }],
            note: [{ text: "для / за (піти по когось) — «pro tebe»" }],
          },
          {
            term: [{ word: "přes", wordId: "prep-pres", kind: "prepositions" }],
            note: [{ text: "через (поперек) / понад — «přes most»" }],
          },
          {
            term: [{ word: "skrz", wordId: "prep-skrz", kind: "prepositions" }],
            note: [{ text: "крізь — «skrz dav»" }],
          },
          {
            term: [{ word: "mimo", wordId: "prep-mimo", kind: "prepositions" }],
            note: [{ text: "поза / окрім — «mimo město»" }],
          },
        ],
      },
      { type: "heading", text: "Місцевий (6. — O kom? O čem?)" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "při", wordId: "prep-pri", kind: "prepositions" }],
            note: [{ text: "при / під час — «při práci»" }],
          },
        ],
      },
      { type: "heading", text: "Орудний (7. — Kým? Čím?)" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "s / se", wordId: "prep-s", kind: "prepositions" }],
            note: [{ text: "з (разом із) — «s kamarádem»" }],
          },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 Вокалізація: короткі прийменники " },
          { word: "k", wordId: "prep-k", kind: "prepositions" },
          { text: "/" },
          { word: "s", wordId: "prep-s", kind: "prepositions" },
          { text: "/" },
          { word: "z", wordId: "prep-z", kind: "prepositions" },
          { text: "/" },
          { word: "v", wordId: "prep-v", kind: "prepositions" },
          { text: " отримують -e перед збігом приголосних або тим самим звуком: ke stolu, se sestrou, ze zahrady. Це для милозвучності — значення не змінюється." },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 Не плутай: деякі слова бувають і прийменником, і прислівником. «Stál " },
          { word: "vedle", wordId: "prep-vedle", kind: "prepositions" },
          { text: " mě» (прийменник + іменник) проти «stál vedle» (прислівник, сам по собі). Прийменник завжди тягне за собою слово в потрібному відмінку." },
        ],
      },
    ],
  },
  {
    id: "prepositions-dual",
    emoji: "🧭",
    title: "Прийменники руху й спокою",
    subtitle: "Один прийменник — два відмінки (куди? / де?)",
    ready: true,
    blocks: [
      { type: "heading", text: "Два відмінки — залежно від руху" },
      {
        type: "paragraph",
        text: "Деякі прийменники керують РІЗНИМИ відмінками залежно від того, це рух чи спокій (дія без напрямку). Це те саме, що в німецькій (in, auf, unter…). Головне питання: якщо «kam?» (куди прямує дія) — знахідний (4.); якщо «kde?» (де щось перебуває або відбувається) — місцевий (6.) або орудний (7.).",
      },
      {
        type: "list",
        items: [
          { term: "куди? → знахідний", note: "Jdu na poštu. Dal boty pod postel. Schoval se za dveře." },
          { term: "де? → місцевий / орудний", note: "Jsem na poště. Boty jsou pod postelí. Stojí za dveřmi." },
        ],
      },
      { type: "heading", text: "Дві групи" },
      {
        type: "paragraph",
        text: "Прийменники поділяються за тим, який відмінок беруть на «де?»:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [
              { word: "na", wordId: "prep-na", kind: "prepositions" },
              { text: ", " },
              { word: "o", wordId: "prep-o", kind: "prepositions" },
              { text: ", " },
              { word: "po", wordId: "prep-po", kind: "prepositions" },
              { text: ", " },
              { word: "v", wordId: "prep-v", kind: "prepositions" },
            ],
            note: [{ text: "куди → знахідний (4., akuzativ), де → місцевий (6., lokál): na stůl / na stole" }],
          },
          {
            term: [
              { word: "nad", wordId: "prep-nad", kind: "prepositions" },
              { text: ", " },
              { word: "pod", wordId: "prep-pod", kind: "prepositions" },
              { text: ", " },
              { word: "před", wordId: "prep-pred", kind: "prepositions" },
              { text: ", " },
              { word: "za", wordId: "prep-za", kind: "prepositions" },
              { text: ", " },
              { word: "mezi", wordId: "prep-mezi", kind: "prepositions" },
            ],
            note: [{ text: "куди → знахідний (4., akuzativ), де → орудний (7., instrumentál): pod stůl / pod stolem" }],
          },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 Порівняй пару: «Kočka leze POD STŮL» (куди? — знахідний, рух) проти «Kočka spí POD STOLEM» (де? — орудний, спокій / дія без напрямку). Той самий прийменник " },
          { word: "pod", wordId: "prep-pod", kind: "prepositions" },
          { text: ", але різні відмінки." },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 «" },
          { word: "o", wordId: "prep-o", kind: "prepositions" },
          { text: "» має ще й непросторове значення «про» (тема розмови) — і там воно ЗАВЖДИ місцевий, без пари «куди»: «Mluvíme o práci» (говоримо про роботу). Просторова пара «куди/де» діє лише для фізичного значення o (напр. opřít se o zeď — знахідний, спертися об щось)." },
        ],
      },
      { type: "heading", text: "Особливий випадок: za" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Прийменник «" },
          { word: "za", wordId: "prep-za", kind: "prepositions" },
          { text: "» має, крім просторового, ще й значення обміну/ціни — і там він завжди знахідний (4.), незалежно від руху: «Zaplatil jsem za oběd» (я заплатив за обід), «Koupil to za sto korun» (купив за сто крон)." },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 Вокалізація " },
          { word: "v", wordId: "prep-v", kind: "prepositions" },
          { text: " → ve перед збігом приголосних: ve škole, ve třídě, ve městě — так само, як " },
          { word: "k", wordId: "prep-k", kind: "prepositions" },
          { text: "→ke, " },
          { word: "s", wordId: "prep-s", kind: "prepositions" },
          { text: "→se, " },
          { word: "z", wordId: "prep-z", kind: "prepositions" },
          { text: "→ze." },
        ],
      },
    ],
  },
  {
    id: "adverbs-place",
    emoji: "🗺️",
    title: "Прислівники місця",
    subtitle: "Де? Куди? Звідки?",
    ready: true,
    blocks: [
      { type: "heading", text: "Три різні слова, не форми одного" },
      {
        type: "paragraph",
        text: "На відміну від прийменників (де один прийменник керує різними відмінками), тут кожне питання — окреме, самостійне слово. Ці слова незмінні (не відмінюються), тому одне й те саме слово підходить для будь-якого роду, числа й відмінка іменника поруч.",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [
              { text: "де? → " },
              { word: "vlevo", wordId: "adv-vlevo", kind: "adverbs" },
              { text: ", " },
              { word: "nahoře", wordId: "adv-nahore", kind: "adverbs" },
              { text: ", " },
              { word: "venku", wordId: "adv-venku", kind: "adverbs" },
              { text: "…" },
            ],
            note: [{ text: "Auto je vlevo. (авто ліворуч)" }],
          },
          {
            term: [
              { text: "куди? → " },
              { word: "doleva", wordId: "adv-vlevo", kind: "adverbs" },
              { text: ", " },
              { word: "nahoru", wordId: "adv-nahore", kind: "adverbs" },
              { text: ", " },
              { word: "ven", wordId: "adv-venku", kind: "adverbs" },
              { text: "…" },
            ],
            note: [{ text: "Zahni doleva. (поверни ліворуч)" }],
          },
          {
            term: [
              { text: "звідки? → " },
              { word: "zleva", wordId: "adv-vlevo", kind: "adverbs" },
              { text: ", " },
              { word: "shora", wordId: "adv-nahore", kind: "adverbs" },
              { text: ", " },
              { word: "zvenku", wordId: "adv-venku", kind: "adverbs" },
              { text: "…" },
            ],
            note: [{ text: "Přišel zleva. (він прийшов зліва)" }],
          },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 Помічник (не правило без винятків!): БІЛЬШІСТЬ «куди?»-форм починаються на до- (" },
          { word: "doleva", wordId: "adv-vlevo", kind: "adverbs" },
          { text: ", " },
          { word: "dolů", wordId: "adv-dole", kind: "adverbs" },
          { text: ", " },
          { word: "dovnitř", wordId: "adv-vevnitr", kind: "adverbs" },
          { text: ", " },
          { word: "doprostřed", wordId: "adv-uprostred", kind: "adverbs" },
          { text: "), а БІЛЬШІСТЬ «звідки?»-форм — на з-/зе- (" },
          { word: "zleva", wordId: "adv-vlevo", kind: "adverbs" },
          { text: ", " },
          { word: "zdola", wordId: "adv-dole", kind: "adverbs" },
          { text: ", " },
          { word: "zevnitř", wordId: "adv-vevnitr", kind: "adverbs" },
          { text: ", " },
          { word: "zprostřed", wordId: "adv-uprostred", kind: "adverbs" },
          { text: "). Але є явні винятки: " },
          { word: "nahoru", wordId: "adv-nahore", kind: "adverbs" },
          { text: ", " },
          { word: "ven", wordId: "adv-venku", kind: "adverbs" },
          { text: ", " },
          { word: "sem", wordId: "adv-tady", kind: "adverbs" },
          { text: " (куди? без до-); " },
          { word: "shora", wordId: "adv-nahore", kind: "adverbs" },
          { text: ", " },
          { word: "odtud", wordId: "adv-tady", kind: "adverbs" },
          { text: ", " },
          { word: "odtamtud", wordId: "adv-tam", kind: "adverbs" },
          { text: " (звідки? без з-). Орієнтир корисний, та не запам'ятовуй його як стовідсоткове правило." },
        ],
      },
      { type: "heading", text: "Два винятки" },
      {
        type: "paragraph",
        text: "Не всі слова мають повну трійку — два поширені слова випадають із загального правила:",
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 «" },
          { word: "tam", wordId: "adv-tam", kind: "adverbs" },
          { text: "» (там) — ОДНЕ слово одразу і для «де?», і для «куди?»: «Jsem tam» (я там) і «Jdu tam» (я йду туди) звучать однаково. А от «звідки?» — усе ж окреме слово: " },
          { word: "odtamtud", wordId: "adv-tam", kind: "adverbs" },
          { text: ". Для порівняння «тут» має повну трійку: " },
          { word: "tady", wordId: "adv-tady", kind: "adverbs" },
          { text: " / " },
          { word: "sem", wordId: "adv-tady", kind: "adverbs" },
          { text: " / " },
          { word: "odtud", wordId: "adv-tady", kind: "adverbs" },
          { text: " — там, де tam зливає дві форми в одну, tady їх розрізняє." },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "💡 «" },
          { word: "doma", wordId: "adv-doma", kind: "adverbs" },
          { text: "» (вдома) / «" },
          { word: "domů", wordId: "adv-doma", kind: "adverbs" },
          { text: "» (додому) — пара де/куди звичайна, а от форми «звідки?» одним словом немає: вживається прийменникова конструкція «z domova» (родовий відмінок іменника domov: Přišel z domova), не самостійний прислівник." },
        ],
      },
      {
        type: "tip",
        text: "💡 Не плутай зі словом «vedle» з прийменників — це та сама лексема в іншій ролі: «Stůl je vedle» (прислівник, сам по собі) проти «Stůl je vedle okna» (прийменник, керує родовим). У цьому розділі vedle не повторюємо — дивись «Прийменники».",
      },
    ],
  },
];

export const GRAMMAR_BY_ID: Record<string, GrammarTopic> = GRAMMAR_TOPICS.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<string, GrammarTopic>
);
