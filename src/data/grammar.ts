// Структурований контент розділу "Граматика".
// Кожна тема складається з блоків, які рендерить GrammarTopicScreen.
// Блоки типізовані — легко додавати нові теми без зміни коду екрана.

import { BrowseKind } from "../types";
import { PosEmojiName } from "../components/icons/posEmoji";

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
  icon: PosEmojiName;
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
  // Кілька самостійних фактів в ОДНОМУ банері "Важливо" (роздільник між
  // абзацами) — для випадків, коли два tip/rich-tip раніше йшли ВПРИТУЛ один
  // під одним без жодного блоку між ними (кілька банерів поспіль розмивають
  // важливість). Не використовується для tip/rich-tip, що стоять окремо в
  // різних місцях теми — ті лишаються звичайними "tip"/"rich-tip".
  | { type: "tip-group"; items: ({ text: string } | { segments: ParagraphSegment[] })[] }
  | { type: "list"; items: { term: string; note: string }[] }
  | { type: "rich-list"; items: { term: ParagraphSegment[]; note: ParagraphSegment[]; icon?: PosEmojiName }[] }; // список, де term і note клікабельні; icon — опційна декоративна іконка перед term (наприклад рід)

export interface GrammarTopic {
  id: string;
  icon: PosEmojiName;
  title: string; // українською
  subtitle: string;
  ready: boolean; // false → тема ще в розробці (позначка 🔒)
  blocks: GrammarBlock[];
}

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: "gender-number",
    icon: "womanAndManHoldingHands",
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
            term: [{ text: "Чоловічий істот." }],
            icon: "bustInSilhouette",
            note: [
              { text: "наприклад " },
              { word: "student", wordId: "student", kind: "nouns" },
              { text: " → studenti, " },
              { word: "pán", wordId: "muz-pan", kind: "nouns" },
              { text: " → páni. Знахідний однини = родовий однини (бо істота): «vidím studenta» (бачу студента)." },
            ],
          },
          {
            term: [{ text: "Чоловічий неістот." }],
            icon: "package",
            note: [
              { text: "наприклад " },
              { word: "hrad", wordId: "hrad", kind: "nouns" },
              { text: " → hrady, " },
              { word: "stůl", wordId: "stul", kind: "nouns" },
              { text: " → stoly. Знахідний однини = називний однини (бо неістота): «vidím hrad» (бачу замок)." },
            ],
          },
          {
            term: [{ text: "Жіночий" }],
            icon: "tulip",
            note: [
              { text: "наприклад " },
              { word: "žena", wordId: "zena", kind: "nouns" },
              { text: " → ženy, " },
              { word: "růže", wordId: "ruze", kind: "nouns" },
              { text: " → růže, " },
              { word: "kost", wordId: "kost", kind: "nouns" },
              { text: " → kosti. Часто на -a, -e або приголосний." },
            ],
          },
          {
            term: [{ text: "Середній" }],
            icon: "whiteCircle",
            note: [
              { text: "наприклад " },
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
          { text: "Щоб визначити рід незнайомого слова — дивись на закінчення називного відмінка й перевіряй за словником. Рід у чеській та українській часто збігається, але не завжди (наприклад чеське «to " },
          { word: "auto", wordId: "auto", kind: "nouns" },
          { text: "» — середній рід)." },
        ],
      },
    ],
  },
  {
    id: "seven-cases",
    icon: "bullseye",
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
      { type: "heading", text: "Для чого який відмінок" },
      {
        type: "paragraph",
        text: "Кожен відмінок має свою типову роль у реченні. Це не повний перелік, а те, що треба знати насамперед:",
      },
      {
        type: "rich-list",
        items: [
          { term: [{ text: "1. Називний" }], note: [{ text: "підмет (хто? що?) і іменна частина присудка після být: Ten pán je učitel (той чоловік — вчитель)." }] },
          { term: [{ text: "2. Родовий" }], note: [{ text: "належність і частина цілого: dům otce (дім батька). Також після числівників 5 і більше (pět studentů) та багатьох прийменників: bez, do, od, z, u." }] },
          { term: [{ text: "3. Давальний" }], note: [{ text: "кому адресована дія: Dám knihu studentovi (дам книгу студентові). Також після прийменників k, díky, kvůli, proti." }] },
          { term: [{ text: "4. Знахідний" }], note: [{ text: "прямий додаток (кого? що?): Vidím psa (бачу пса). Також після pro, přes, skrz і після прийменників руху на питання «куди?»." }] },
          { term: [{ text: "5. Кличний" }], note: [{ text: "звертання: Pane! Petře! (пане! Петре!)" }] },
          { term: [{ text: "6. Місцевий" }], note: [{ text: "«де?» і «про що?», завжди з прийменником: Kniha je na stole (книга на столі). Mluvím o práci (говорю про роботу)." }] },
          { term: [{ text: "7. Орудний" }], note: [{ text: "засіб і супровід: Jedu autem (їду автомобілем). Mluvím s tím mužem (розмовляю з ним)." }] },
        ],
      },
      {
        type: "tip-group",
        items: [
          { text: "Прийменник не вимагає ні називного, ні кличного, а місцевий без прийменника не вживається взагалі: форма 6-го відмінка завжди має перед собою v, na, o, po або při." },
          {
            segments: [
              { text: "Кличний відмінок (5.) в українській теж є (мамо, Петре) — використовується при звертанні. У чеській він активний у щоденному мовленні: «" },
              { word: "Pane", wordId: "muz-pan", kind: "nouns" },
              { text: "!», «Petře!»." },
            ],
          },
        ],
      },
      { type: "heading", text: "Відмінок задає дієслово" },
      {
        type: "paragraph",
        text: "Багато дієслів вимагають після себе певного відмінка, тому його вчать разом зі словом. Здебільшого він збігається з українським:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "děkovat", wordId: "dekovat", kind: "verbs" }, { text: " + давальний (za + знахідний)" }],
            note: [{ text: "дякувати кому за що: Děkuji učiteli za pomoc (дякую вчителеві за допомогу)." }],
          },
          {
            term: [{ word: "pomáhat", wordId: "pomahat", kind: "verbs" }, { text: " + давальний" }],
            note: [{ text: "допомагати кому: Pomáhám matce (допомагаю мамі)." }],
          },
          {
            term: [{ word: "líbit se", wordId: "libit-se", kind: "verbs" }, { text: " + давальний" }],
            note: [{ text: "подобатися кому: Líbí se mi to auto (мені подобається це авто). Особа — у давальному (mi), річ — підмет." }],
          },
          {
            term: [{ word: "čekat", wordId: "cekat", kind: "verbs" }, { text: " + na + знахідний" }],
            note: [{ text: "чекати на кого/що: Čekám na matku (чекаю на маму)." }],
          },
          {
            term: [{ word: "bát se", wordId: "bat-se", kind: "verbs" }, { text: " + родовий" }],
            note: [{ text: "боятися кого/чого: Bojím se psa (боюся пса)." }],
          },
          {
            term: [{ word: "ptát se", wordId: "ptat-se", kind: "verbs" }, { text: " koho (родовий) + na + знахідний" }],
            note: [{ text: "питати кого про що: Ptám se učitele na cestu (питаю вчителя про дорогу)." }],
          },
        ],
      },
      {
        type: "tip",
        text: "Серед цих дієслів лише ptát se розходиться з українським: після нього «про що?» передається прийменником na + знахідний, а не «про».",
      },
    ],
  },
  {
    id: "patterns",
    icon: "cardIndexDividers",
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
            icon: "bustInSilhouette",
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
            icon: "package",
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
            icon: "tulip",
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
            icon: "whiteCircle",
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
      { type: "heading", text: "Зміни в основі слова" },
      {
        type: "paragraph",
        text: "Крім закінчень, у багатьох слів змінюється й сама основа. Це закономірності, а не помилки в картках:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "Випадає -e-" }],
            note: [
              { text: "у слів на -ek, -ec, -en та деяких інших голосний -e- зникає в непрямих відмінках: " },
              { word: "pes", wordId: "pes", kind: "nouns" },
              { text: " → psa, " },
              { word: "otec", wordId: "otec", kind: "nouns" },
              { text: " → otce, " },
              { word: "den", wordId: "den", kind: "nouns" },
              { text: " → dne." },
            ],
          },
          {
            term: [{ text: "ů → o" }],
            note: [
              { text: "у називному (і знахідному — для неістот) стоїть ů, у решті форм — o: " },
              { word: "dům", wordId: "dum", kind: "nouns" },
              { text: " → domu, " },
              { word: "stůl", wordId: "stul", kind: "nouns" },
              { text: " → stolu, " },
              { word: "nůž", wordId: "stul-nuz", kind: "nouns" },
              { text: " → nože, " },
              { word: "kůň", wordId: "kun", kind: "nouns" },
              { text: " → koně. Не в кожному слові: důvod → důvodu." },
            ],
          },
          {
            term: [{ text: "k → c, h → z, ch → š, r → ř" }],
            note: [
              { text: "перед закінченням -e/-i: у жіночому роді на -a в давальному й місцевому однини — " },
              { word: "matka", wordId: "matka", kind: "nouns" },
              { text: " → matce, " },
              { word: "kniha", wordId: "kniha", kind: "nouns" },
              { text: " → knize, " },
              { word: "sprcha", wordId: "sprcha", kind: "nouns" },
              { text: " → sprše, " },
              { word: "dcera", wordId: "dcera", kind: "nouns" },
              { text: " → dceři." },
            ],
          },
        ],
      },
      {
        type: "tip-group",
        items: [
          {
            text: "У чол. роду істот той самий принцип чергування, що й у прикметників: перед закінченням -i у називному множини кінцевий приголосний основи часто змінюється — k→c (kluk→kluci, žák→žáci), r→ř (bratr→bratři), h→z, ch→š. Стосується лише називного множини цього роду — решта форм основу не чіпають.",
          },
          {
            text: "Спочатку визнач рід і чи слово тверде/м'яке. Це одразу звужує зразок до 1–2 варіантів, і далі легко підставити закінчення.",
          },
        ],
      },
    ],
  },
  {
    id: "adjectives",
    icon: "palette",
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
          { text: " (сер.), mladí muži (множина). У картках усі чотири роди перемикаються табами зверху." },
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
        text: "В усіх інших родах (жіночому, середньому) і в множині такого розрізнення немає — воно стосується лише чоловічого роду однини. У множині й жіночому/середньому роді знахідний завжди має свою окрему форму, однакову для істот і неістот.",
      },
      { type: "heading", text: "Чергування приголосного" },
      {
        type: "paragraph",
        text: "У твердого зразка перед закінченням -í (називний і кличний множини, чол. істот.) кінцевий приголосний основи часто змінюється:",
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
        segments: [{ text: "У прикметника кличний відмінок (5.) завжди збігається з називним: «" }, { word: "milý", wordId: "mily", kind: "adjectives" }, { text: " " }, { word: "pane", wordId: "muz-pan", kind: "nouns" }, { text: "!» (шановний пане!; milý — як у називному). Окремої форми, як в іменника (pan → pane), прикметник не має: при звертанні змінюється лише сам іменник." }],
      },
      {
        type: "rich-tip",
        segments: [{ text: "Щоб визначити зразок — постав прикметник у чол. рід однини: закінчення -ý/-á/-é за родами → твердий (" }, { word: "mladý", wordId: "mlady", kind: "adjectives" }, { text: "); суцільне -í в усіх родах → м'який (" }, { word: "jarní", wordId: "jarni", kind: "adjectives" }, { text: ")." }],
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
        type: "tip-group",
        items: [
          {
            text: "Порівняння з ніж передається сполучником než: «Praha je větší než Brno» (Прага більша, ніж Брно). Найвищий часто йде з прийменником z/ze: «nejlepší z nás» (найкращий з нас).",
          },
          {
            segments: [{ text: "Перед суфіксом -ší (і рідше -ější) кінцевий приголосний основи часто чергується — той самий принцип, що й у називному множини чол. істот.: k→č (" }, { word: "hezký", wordId: "hezky", kind: "adjectives" }, { text: "→hezčí, " }, { word: "měkký", wordId: "mekky", kind: "adjectives" }, { text: "→měkčí), h→ž (" }, { word: "drahý", wordId: "drahy", kind: "adjectives" }, { text: "→dražší, " }, { word: "ubohý", wordId: "ubohy", kind: "adjectives" }, { text: "→ubožejší), ch→š (" }, { word: "tichý", wordId: "tichy", kind: "adjectives" }, { text: "→tišší). Якщо основа закінчується на -tý/-dý/-ný — приголосний зазвичай не чергується (" }, { word: "mladý", wordId: "mlady", kind: "adjectives" }, { text: "→mladší)." }],
          },
          {
            text: "Форми вищого й найвищого ступенів самі відмінюються за родами й відмінками (novější → novějšího → novějšímu…) — як звичайний м'який прикметник. Тут ми відпрацьовуємо відмінювання у звичайному ступені; картки на відмінювання ступенів порівняння додамо згодом окремо.",
          },
        ],
      },
      { type: "heading", text: "Прислівники від прикметників" },
      {
        type: "paragraph",
        text: "Прикметник відповідає на «який?», прислівник — на «як?». Прислівник утворюється від основи прикметника:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "-ě / -e" }],
            note: [{ text: "суфікс -ě після d, t, n, b, p, m, v: " }, { word: "nový", wordId: "novy", kind: "adjectives" }, { text: " → nově, " }, { word: "špatný", wordId: "spatny", kind: "adjectives" }, { text: " → špatně. Суфікс -e після l, s, z: " }, { word: "rychlý", wordId: "rychly", kind: "adjectives" }, { text: " → rychle." }],
          },
          {
            term: [{ text: "Чергування + -e" }],
            note: [{ text: "перед суфіксом приголосний змінюється (r → ř, h → z, ch → š, k → c): " }, { word: "dobrý", wordId: "dobry", kind: "adjectives" }, { text: " → dobře, tichý → tiše, krátký → krátce." }],
          },
          {
            term: [{ text: "-y" }],
            note: [{ text: "від прикметників на -sky, -cky, -zky: " }, { word: "hezký", wordId: "hezky", kind: "adjectives" }, { text: " → hezky, český → česky." }],
          },
          {
            term: [{ text: "-u / -o" }],
            note: [{ word: "pomalý", wordId: "pomaly", kind: "adjectives" }, { text: " → pomalu; а також daleko, blízko, vysoko (на -o)." }],
          },
        ],
      },
      {
        type: "tip",
        text: "У слів на -o є й форма на -e, але вона має переносне значення: vysoko — «високо» (місце: letadlo letí vysoko), vysoce — «дуже» (vysoce ceněný odborník).",
      },
      { type: "heading", text: "Ступені порівняння прислівників" },
      {
        type: "rich-paragraph",
        segments: [{ text: "Вищий ступінь прислівника — суфікс -eji / -ěji, найвищий — nej- + вищий: " }, { word: "rychlý", wordId: "rychly", kind: "adjectives" }, { text: " → rychle → rychleji → nejrychleji. Нерегулярні треба запам'ятати:" }],
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "dobře" }],
            note: [{ text: "lépe, у розмові líp; nejlépe." }],
          },
          {
            term: [{ text: "špatně" }],
            note: [{ text: "hůř, hůře; nejhůře." }],
          },
          {
            term: [{ text: "málo / hodně" }],
            note: [{ text: "méně (у розмові míň) / více (у розмові víc)." }],
          },
          {
            term: [{ text: "daleko / blízko" }],
            note: [{ text: "dál, dále / blíž, blíže." }],
          },
          {
            term: [{ text: "brzy / dlouho / vysoko" }],
            note: [{ text: "dřív, dříve / déle / výš, výše." }],
          },
        ],
      },
      { type: "heading", text: "Присвійні прикметники" },
      {
        type: "paragraph",
        text: "В українській є «мамин, батьків» — чеська теж утворює прикметник від імені власника. Він відповідає на «чий?» і означає одну конкретну особу:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "Власник-чоловік: -ův, -ova, -ovo" }],
            note: [{ text: "Pavlův dům, Pavlova žena, Pavlovo auto; " }, { word: "otec", wordId: "otec", kind: "nouns" }, { text: " → otcův, bratr → bratrův, dědeček → dědečkův." }],
          },
          {
            term: [{ text: "Власниця-жінка: -in, -ina, -ino" }],
            note: [{ word: "matka", wordId: "matka", kind: "nouns" }, { text: " → matčin (k → č), babička → babiččin, dcera → dceřin (r → ř)." }],
          },
          {
            term: [{ text: "Відмінювання" }],
            note: [{ text: "змінюється за відмінком і родом: z matčina dopisu, po strýcově odjezdu, na dceřinu promoci, v dědečkově zahradě." }],
          },
        ],
      },
      {
        type: "tip",
        text: "Те саме можна сказати родовим: matčina kniha = kniha matky. Від деяких імен (зокрема жіночих на -ice, -yně) такий прикметник зазвичай не утворюється — тоді вживають тільки родовий.",
      },
      { type: "heading", text: "Прикметники в ролі іменників" },
      {
        type: "paragraph",
        text: "Деякі прикметники самі стали іменниками й зберегли прикметникове відмінювання:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "nemocný", wordId: "nemocny", kind: "adjectives" }],
            note: [{ text: "хворий: Doktor mluví s nemocným (лікар розмовляє з хворим). Znám tu nemocnou (знаю ту хвору). Жіночий рід: nemocná, nemocné, nemocnou…" }],
          },
          {
            term: [{ word: "vedoucí", wordId: "vedouci", kind: "adjectives" }],
            note: [{ text: "керівник / керівниця: Ptám se vedoucího (питаю керівника). Znám novou vedoucí (знаю нову керівницю). Відмінюється за м'яким зразком, як jarní." }],
          },
        ],
      },
      {
        type: "tip",
        text: "У vedoucí однакова форма для чоловіка й жінки, рід видно з узгодженого слова: nový vedoucí / nová vedoucí.",
      },
    ],
  },
  {
    id: "verbs",
    icon: "running",
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
        text: "Головне для практики: недоконані дієслова мають усі три часи, а доконані НЕ мають теперішнього — їхня «теперішня» форма за значенням є майбутньою (udělám = «зроблю», а не «роблю»). Тому в картках доконані показують лише минулий і майбутній час.",
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
      { type: "heading", text: "Нерегулярні дієслова" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Нерегулярні дієслова. Кілька високочастотних дієслів мають власну парадигму й не вкладаються в жоден клас: " },
          { word: "být", wordId: "byt", kind: "verbs" },
          { text: " (jsem/jsi/je…), " },
          { word: "mít", wordId: "mit", kind: "verbs" },
          { text: " (mám/máš…), " },
          { word: "chtít", wordId: "chtit", kind: "verbs" },
          { text: " (chci/chceš…), " },
          { word: "jíst", wordId: "jist", kind: "verbs" },
          { text: " (jím, але oni jedí), " },
          { word: "vědět", wordId: "vedet", kind: "verbs" },
          { text: " (vím, але oni vědí)." },
        ],
      },
      { type: "heading", text: "Модальні дієслова" },
      {
        type: "paragraph",
        text: "Модальні дієслова виражають бажання, обов'язок, можливість чи дозвіл і йдуть з інфінітивом:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "chtít", wordId: "chtit", kind: "verbs" }],
            note: [{ text: "хотіти: Chci pracovat (хочу працювати). Може мати й додаток у знахідному: Chci nové auto (хочу нове авто)." }],
          },
          {
            term: [{ word: "muset", wordId: "muset", kind: "verbs" }],
            note: [{ text: "мусити, бути змушеним: Musím pracovat (мушу працювати)." }],
          },
          {
            term: [{ word: "moci", wordId: "moci", kind: "verbs" }],
            note: [{ text: "могти, мати можливість: Může přijít zítra (може прийти завтра)." }],
          },
          {
            term: [{ word: "smět", wordId: "smet", kind: "verbs" }],
            note: [{ text: "мати дозвіл: Smím otevřít okno? (чи можна мені відкрити вікно?)" }],
          },
          {
            term: [{ word: "umět", wordId: "umet", kind: "verbs" }],
            note: [{ text: "уміти, володіти навичкою чи мовою: Umím plavat (вмію плавати). Umíte anglicky? (чи володієте ви англійською?)" }],
          },
          {
            term: [{ word: "mít", wordId: "mit", kind: "verbs" }],
            note: [{ text: "з інфінітивом — «маю зробити, повинен»: Nevím, co mám koupit (що мені купити)." }],
          },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "Заперечення змінює зміст: " },
          { word: "nemusím", wordId: "muset", kind: "verbs" },
          { text: " — «не обов'язково» (Nemusím chodit pěšky, mám auto), але " },
          { word: "nesmím", wordId: "smet", kind: "verbs" },
          { text: " — «заборонено» (Nesmím kouřit). Не плутай «не мушу» і «не можна»." },
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
            note: [{ text: "дієприкметник на -l (тобто «л-форма» — форма, що закінчується на -l) + допоміжне jsem/jsi (у 3-й особі — без нього). Дієприкметник узгоджується в роді й числі з підметом: dělal (він) / dělala (вона) / dělalo (воно) / dělali (вони, чол. істот.) / dělaly (вони, жін.) / dělala (вони, сер.). Чол. неістот. у множині — як жін.: stoly stály. Тому «я робив» = dělal jsem, а «я робила» = dělala jsem." }],
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
      { type: "heading", text: "Дієслова руху: однократні й багатократні" },
      {
        type: "paragraph",
        text: "Для руху чеська має пари дієслів. Однократне (jít, jet) — рух в один бік у конкретний момент; багатократне (chodit, jezdit) — рух регулярно чи туди й назад:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "jít", wordId: "jit", kind: "verbs" }, { text: " — " }, { word: "chodit", wordId: "chodit", kind: "verbs" }],
            note: [{ text: "іти пішки: Jdu domů (іду додому, зараз) — Chodím do školy pěšky (ходжу до школи пішки, регулярно)" }],
          },
          {
            term: [{ word: "jet", wordId: "jet", kind: "verbs" }, { text: " — " }, { word: "jezdit", wordId: "jezdit", kind: "verbs" }],
            note: [{ text: "їхати транспортом: Jedu do Prahy (їду до Праги, зараз) — Jezdím do Prahy každý týden (їжджу до Праги щотижня, регулярно)" }],
          },
          {
            term: [{ text: "Так само" }],
            note: [
              { word: "nést", wordId: "nest", kind: "verbs" },
              { text: " — " },
              { word: "nosit", wordId: "nosit", kind: "verbs" },
              { text: " (нести), " },
              { word: "letět", wordId: "letet", kind: "verbs" },
              { text: " — " },
              { word: "létat", wordId: "letat", kind: "verbs" },
              { text: " (летіти), " },
              { word: "běžet", wordId: "bezet", kind: "verbs" },
              { text: " — " },
              { word: "běhat", wordId: "behat", kind: "verbs" },
              { text: " (бігти)" },
            ],
          },
        ],
      },
      {
        type: "tip",
        text: "Майбутній час: однократні мають власну форму (půjdu, pojedu), багатократні — складену: budu chodit, budu jezdit.",
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
          { text: "У більшості дієслів se/si вже стало частиною самого слова — без нього дієслово або не вживається в цьому значенні, або означає геть інше: " },
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
          { text: "Виняток для «ty» (2 особи однини): «jsi» + se/si стягується в ОДНЕ слово — ses/sis. «učil ses» (" },
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
              { text: "від основи 3-ї особи множини: dělají → dělej!, prosí → pros!, kupují → kupuj! Після d/t/n відбувається пом'якшення: vrátit → vrať!, " },
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
        type: "tip-group",
        items: [
          {
            text: "Майбутній час теж може звучати як наказ: Uděláš to hned! (Зробиш це негайно!) — це та сама форма майбутнього часу, лише вжита з наказовою інтонацією, а не окремий наказовий спосіб.",
          },
          {
            text: "Щоб визначити клас незнайомого дієслова — постав його в 3-тю особу однини (він ___) і подивись на закінчення: -e/-ě → I, -ne → II, -uje/-je → III, -í → IV, -á → V.",
          },
        ],
      },
    ],
  },
  {
    id: "pronouns",
    icon: "pointing",
    title: "Займенники",
    subtitle: "Особові, присвійні та вказівні",
    ready: true,
    blocks: [
      {
        type: "rich-paragraph",
        segments: [
          { text: "Займенники бувають особові (" },
          { word: "já", wordId: "pp-ja", kind: "pronouns" },
          { text: ", " },
          { word: "ty", wordId: "pp-ty", kind: "pronouns" },
          { text: ", " },
          { word: "on", wordId: "pp-on", kind: "pronouns" },
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
            term: [{ word: "její", wordId: "jeji", kind: "pronouns" }],
            note: [
              { text: "відмінюється як прикметник " },
              { word: "jarní", wordId: "jarni", kind: "adjectives" },
              { text: " (м'який зразок): jejího, jejímu, jejím, jejích. Форма змінюється за відмінком, хоч і схожа на незмінну." },
            ],
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
            note: [{ text: "підкреслює, що дію виконано особисто / без сторонньої допомоги. Мішана відміна: у називному й знахідному — короткі форми (sám, sama, samo; множина sami/samy/sama), у решті відмінків — як прикметник (samého, samému…). Увага: у називному множини чол. істот. sami (м'яке i), а в знахідному множини samy." }],
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
        type: "tip-group",
        items: [
          {
            segments: [
              { word: "svůj", wordId: "svuj", kind: "pronouns" },
              { text: " (свій) вживають, коли присвійність стосується підмета речення: «Mám rád svůj pokoj» (люблю свою власну кімнату). Якщо сказати «můj pokoj» (моя кімната), акцент просто на приналежності, без зв'язку з підметом — тому в багатьох реченнях природніше svůj." },
            ],
          },
          {
            segments: [
              { word: "váš", wordId: "vas", kind: "pronouns" },
              { text: " / " },
              { word: "vy", wordId: "pp-vy", kind: "pronouns" },
              { text: " — це не лише «ваш» до кількох людей, а й ввічливе звертання до однієї особи (як укр. «Ви»): «Je to váš kufr, pane?» (це ваша валіза, пане?). Тому váš чуєш і там, де йдеться про одну людину, до якої звертаються шанобливо." },
            ],
          },
        ],
      },
      { type: "heading", text: "Особові — хто діє?" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Особові займенники (" },
          { word: "já", wordId: "pp-ja", kind: "pronouns" },
          { text: ", " },
          { word: "ty", wordId: "pp-ty", kind: "pronouns" },
          { text: ", " },
          { word: "on, ona, ono", wordId: "pp-on", kind: "pronouns" },
          { text: ", " },
          { word: "my", wordId: "pp-my", kind: "pronouns" },
          { text: ", " },
          { word: "vy", wordId: "pp-vy", kind: "pronouns" },
          { text: ", " },
          { word: "oni, ony, ona", wordId: "pp-oni", kind: "pronouns" },
          { text: ") та зворотний " },
          { word: "se/si", wordId: "pp-se", kind: "pronouns" },
          { text: " мають нерегулярну парадигму — її треба просто вивчити. Головна складність не в називному, а в інших відмінках, де форми часто зовсім інші (já → mě, mně, mnou)." },
        ],
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "Короткі й довгі форми" }],
            note: [
              { word: "já", wordId: "pp-ja", kind: "pronouns" },
              { text: ", " },
              { word: "ty", wordId: "pp-ty", kind: "pronouns" },
              { text: " та se мають короткий (приклонка) і довгий твар: mě/mne, mi/mně, tě/tebe, ti/tobě, se/sebe, si/sobě. Короткий стоїть усередині речення (Vidím tě), довгий — на початку, під наголосом і завжди після прийменника (pro tebe, beze mě)." },
            ],
          },
          {
            term: [{ word: "mě", wordId: "pp-ja", kind: "pronouns" }, { text: " vs " }, { word: "mně", wordId: "pp-ja", kind: "pronouns" }],
            note: [{ text: "У родовому і знахідному (2. і 4.) — mě (2 літери), у давальному і місцевому (3. і 6.) — mně (3 літери). Підказка: підстав «Pepa» — Pepu → mě, Pepovi → mně." }],
          },
          {
            term: [{ text: "Форми після прийменника (3-тя особа)" }],
            note: [
              { text: "У третьої особи (" },
              { word: "on/ona/ono", wordId: "pp-on", kind: "pronouns" },
              { text: ") після прийменника початкове j- переходить у м'яке n-: jemu → k němu, jí → s ní, jich → od nich, je → na ně. Це м'яке n традиційно називають «ň», але окремої літери з гачком тут ніколи не буде — перед ě/í/i м'якість n передається самим написанням (němu, ní, nich, ně), тому в прикладах бачиш звичайне n. Без прийменника — j-форма (znám ho), з прийменником — n-форма (jdu k němu)." },
            ],
          },
          {
            term: [{ word: "ji", wordId: "pp-on", kind: "pronouns" }, { text: " vs " }, { word: "jí", wordId: "pp-on", kind: "pronouns" }, { text: " (вона)" }],
            note: [{ text: "Знахідний — ji (короткий i): Vidím ji (бачу її). Решта відмінків (родовий/давальний/місцевий/орудний) — jí (довгий í): bez ní, s ní. Після прийменника скрізь ní." }],
          },
          {
            term: [{ text: "Зворотний " }, { word: "se/si", wordId: "pp-se", kind: "pronouns" }],
            note: [{ text: "Не має називного відмінка (1.) взагалі. se — знахідний (myji se), si — давальний (koupím si). Стосується підмета: Dívám se (дивлюсь на себе, просто дивлюся)." }],
          },
          {
            term: [
              { word: "my", wordId: "pp-my", kind: "pronouns" },
              { text: " / " },
              { word: "vy", wordId: "pp-vy", kind: "pronouns" },
            ],
            note: [{ text: "Найпростіші: одна форма на кожен відмінок, після прийменника не змінюються (nás, nám, námi; vás, vám, vámi). Пиши my, vy з твердим y." }],
          },
        ],
      },
      {
        type: "rich-tip",
        segments: [
          { text: "s " },
          { word: "sebou", wordId: "pp-se", kind: "pronouns" },
          { text: " vs sebou: «vezmi to s sebou» (візьми з собою) — з прийменником s; але «hodil sebou» (кинувся) — без прийменника. У сучасній мові часто плутають, орієнтуйся на зміст: якщо «разом зі мною/тобою» — пиши s sebou." },
        ],
      },
      { type: "heading", text: "Неозначені й заперечні — хтось, ніхто" },
      {
        type: "paragraph",
        text: "Від питальних слів kdo, co утворюються пари з приставками ně- (хтось, щось) і ni- (ніхто, нічого). Основа відмінюється як у питального слова:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "někdo", wordId: "nekdo-ind", kind: "pronouns" }, { text: " / " }, { word: "nikdo", wordId: "nikdo-ind", kind: "pronouns" }],
            note: [{ text: "хтось / ніхто (від " }, { word: "kdo", wordId: "kdo-int", kind: "interrogative" }, { text: "): někoho, někomu, o někom, s někým; nikoho, nikomu, o nikom, s nikým." }],
          },
          {
            term: [{ word: "něco", wordId: "neco-ind", kind: "pronouns" }, { text: " / " }, { word: "nic", wordId: "nic-ind", kind: "pronouns" }],
            note: [{ text: "щось / ніщо (від " }, { word: "co", wordId: "co-int", kind: "interrogative" }, { text: "): něčeho, něčemu, o něčem, s něčím; ničeho, ničemu, o ničem, s ničím." }],
          },
          {
            term: [{ word: "nějaký", wordId: "nejaky-ind", kind: "pronouns" }],
            note: [{ text: "якийсь: nějaký muž, nějaká žena, nějaké auto. Відмінюється як прикметник: nějakého, nějakému…" }],
          },
          {
            term: [{ word: "žádný", wordId: "zadny-ind", kind: "pronouns" }],
            note: [{ text: "жодний: žádný problém, žádná práce. Теж як прикметник: žádného, žádnému…" }],
          },
          {
            term: [{ word: "každý", wordId: "kazdy-ind", kind: "pronouns" }],
            note: [{ text: "кожний: každý den, každá žena. Як прикметник: každého, každému…" }],
          },
        ],
      },
      {
        type: "tip",
        text: "Подвійне заперечення, як і в українській: після nikdo, nic, nikdy дієслово теж у запереченні. Nikdo nepřišel (ніхто не прийшов). Nic nevidím (нічого не бачу). Nikdy nic nikomu neřeknu (нікому нічого ніколи не скажу).",
      },
      { type: "heading", text: "Відносні — який, що" },
      {
        type: "paragraph",
        text: "Відносне слово відкриває підрядне речення про щойно названу особу чи річ і заступає її. Рід і число воно бере від цього слова, а відмінок — від своєї ролі в підрядному реченні:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "který", wordId: "ktery-int", kind: "interrogative" }],
            note: [{ text: "який, котрий: Muž, kterého jsem viděl (чоловік, якого я бачив). Žena, se kterou jsem mluvil (жінка, з якою я розмовляв). Studenti, kteří bydlí v Praze (студенти, які живуть у Празі). У книжних текстах трапляється й jenž — він теж змінюється за родом, числом і відмінком." }],
          },
          {
            term: [{ word: "co", wordId: "co-int", kind: "interrogative" }],
            note: [{ text: "у розмові замість který часто ставлять незмінне co, а особу повторюють перед дієсловом: Muž, co jsem ho viděl — те саме, що Muž, kterého jsem viděl." }],
          },
          {
            term: [{ word: "to", wordId: "ten", kind: "pronouns" }, { text: ", " }, { word: "co", wordId: "co-int", kind: "interrogative" }, { text: " / " }, { word: "všechno", wordId: "vsechen-ind", kind: "pronouns" }, { text: ", " }, { word: "co", wordId: "co-int", kind: "interrogative" }],
            note: [{ text: "те, що / все, що: Není všechno zlato, co se třpytí (не все те золото, що блищить)." }],
          },
          {
            term: [{ word: "ten", wordId: "ten", kind: "pronouns" }, { text: ", " }, { word: "kdo", wordId: "kdo-int", kind: "interrogative" }, { text: " / " }, { word: "kdo", wordId: "kdo-int", kind: "interrogative" }],
            note: [{ text: "той, хто: Kdo pozdě chodí, sám sobě škodí (хто спізнюється, сам собі шкодить)." }],
          },
        ],
      },
    ],
  },
  {
    id: "numbers-dates",
    icon: "numbers",
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
          { text: " — «котрий?»). Кількісні мають особливе відмінювання, а порядкові відмінюються як звичайні прикметники (зразок " },
          { word: "mladý", wordId: "mlady", kind: "adjectives" },
          { text: ", а перший/третій — за м'яким " },
          { word: "jarní", wordId: "jarni", kind: "adjectives" },
          { text: ")." },
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
          { term: "5 і більше → родовий множини", note: "pět domů, šest žen, sedm aut — іменник у родовому множини (numerativ)." },
        ],
      },
      {
        type: "tip",
        text: "Це правило діє лише в називному й знахідному. У непрямих відмінках (давальний, орудний, місцевий) і числівник, і іменник стоять в одному відмінку: «se pěti muži» (з п'ятьма чоловіками), не в родовому.",
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
      { type: "heading", text: "Слова лише з множиною: dvoje kalhoty" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Іменники, що мають лише множину (" },
          { word: "kalhoty", wordId: "kalhoty", kind: "nouns" },
          { text: ", " },
          { word: "brýle", wordId: "bryle", kind: "nouns" },
          { text: "), рахують особливими формами — як українське «двоє штанів». Вони є на картках " },
          { word: "jeden", wordId: "card-jeden", kind: "cardinals" },
          { text: ", " },
          { word: "dva", wordId: "card-dva", kind: "cardinals" },
          { text: ", " },
          { word: "oba", wordId: "card-oba", kind: "cardinals" },
          { text: ", " },
          { word: "tři", wordId: "card-tri", kind: "cardinals" },
          { text: " і " },
          { word: "čtyři", wordId: "card-ctyri", kind: "cardinals" },
          { text: " (друга вкладка)." },
        ],
      },
      {
        type: "list",
        items: [
          { term: "1 → jedny", note: "jedny kalhoty (одні штани); із середнім родом — jedna ústa (одні уста)." },
          { term: "2 → dvoje, обидва → oboje", note: "dvoje kalhoty (двоє штанів), oboje brýle (обидві пари окулярів)." },
          { term: "3 → troje, 4 → čtvery", note: "troje kalhoty (троє штанів), čtvery brýle (четверо окулярів)." },
          { term: "5 і більше → як завжди", note: "pět kalhot (п'ять штанів), šest brýlí (шість окулярів) — родовий множини." },
        ],
      },
      {
        type: "tip",
        text: "Ці форми відмінюються як прикметники в множині: bez dvojích kalhot (без двох пар штанів), s trojími brýlemi (з трьома парами окулярів). «Dvě kalhoty» чи «tři brýle» так не кажуть.",
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
        text: "«dvě stě» — це залишок старої форми двоїни (колись рахували «один, два, багато»). Тому 200 має окрему форму «stě», а від 300 уже звичайне «sta».",
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
          { text: " іменник-предмет стоїть у РОДОВОМУ множини: sto korun (сто крон), tisíc lidí (тисяча людей), milion obyvatel (мільйон мешканців). Так само в усіх відмінках: k tisíci korun (до тисячі крон), o milionu lidí (про мільйон людей). У непрямих відмінках правильна й форма в тому самому відмінку: s třemi tisíci diváků / diváky (з трьома тисячами глядачів)." },
        ],
      },
      {
        type: "tip",
        text: "Зі sto у непрямих відмінках можливі три варіанти, усі нормативні: ke stu korun, ke stu korunám і навіть незмінне ke sto korunám (до ста крон). Найпростіше — родовий іменника (ke stu korun): він працює завжди.",
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
          { term: "…1 → як jeden", note: "dvacet jeden dům (двадцять один будинок), třicet jedna žena (тридцять одна жінка) — однина, узгоджена в роді." },
          { term: "…2, …3, …4 → як 2-4", note: "dvacet dva domy (двадцять два будинки), čtyřicet tři ženy (сорок три жінки) — множина." },
          { term: "…5–…9 → як 5+", note: "dvacet pět domů (двадцять п'ять будинків), šedesát osm žen (шістдесят вісім жінок) — родовий множини." },
        ],
      },
      {
        type: "tip",
        text: "Після …1–…4 у називному й знахідному правильний і родовий множини, і він навіть уживаніший: dvacet jedna žáků (двадцять один учень), dvacet dva žáků (двадцять два учні). У непрямих відмінках чисел на …2–…9 відмінюються ОБИДВІ частини числа, а іменник стоїть у тому самому відмінку: bez čtyřiceti sedmi oken (без сорока семи вікон), o šedesáti osmi lidech (про шістдесят вісім людей), od dvaceti dvou žáků (від двадцяти двох учнів). Із …1 зазвичай кажуть dvacet jedna і відмінюють лише десяток, іменник — у множині: k dvaceti jedna žákům (до двадцяти одного учня), od dvaceti jedna žáků (від двадцяти одного учня). У розмові трапляється й зовсім незмінна форма: s dvacet dva žáky (з двадцятьма двома учнями).",
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
          { term: "256", note: "dvě stě padesát šest (двісті + п'ятдесят + шість)" },
          { term: "3 421", note: "tři tisíce čtyři sta dvacet jedna (три тисячі + чотириста + двадцять один)" },
          { term: "2 000 000", note: "dva miliony (два мільйони)" },
          { term: "8 000 000 000", note: "osm miliard (вісім мільярдів)" },
        ],
      },
      {
        type: "tip",
        text: "Кожен шматок (тисячі → сотні → десятки-одиниці) просто йде по черзі своєю формою — не треба узгоджувати їх між собою. Складне лише саме число сотень/тисяч перед іменником, який рахують.",
      },
      { type: "heading", text: "Вік: je mi … let" },
      {
        type: "paragraph",
        text: "Вік називають так само, як в українській «мені двадцять років»: особа в давальному відмінку, дієслово je, число і слово «рік» (let). Не «jsem dvacet», а:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "Kolik je ti let?" }],
            note: [{ text: "скільки тобі років? Je mi dvacet pět let (мені двадцять п'ять років). А ввічливо: Kolik je vám let? (скільки вам років?)" }],
          },
          {
            term: [{ text: "Je mu / jí …" }],
            note: [{ text: "йому / їй: Je mu deset let (йому десять років). Je jí třicet let (їй тридцять років)." }],
          },
          {
            term: [{ text: "Минулий і майбутній час" }],
            note: [{ text: "Bylo mi deset let (мені було десять років). Bude mi třicet (мені буде тридцять)." }],
          },
        ],
      },
      {
        type: "paragraph",
        text: "Слово «рік» при числівниках має три форми — від числа залежить і дієслово:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "1" }],
            note: [{ word: "rok", wordId: "rok", kind: "nouns" }, { text: " — Synovi je rok (синові рік)." }],
          },
          {
            term: [{ text: "2, 3, 4" }],
            note: [{ text: "roky, дієслово у множині: Naší dceři jsou tři roky (нашій доньці три роки)." }],
          },
          {
            term: [{ text: "5 і більше" }],
            note: [{ text: "let, а не roků: Je mi pět let (мені п'ять років). Це окрема форма (родовий множини від " }, { word: "léto", wordId: "leto", kind: "nouns" }, { text: "), її треба запам'ятати." }],
          },
        ],
      },
      { type: "heading", text: "Гроші й ціни" },
      {
        type: "paragraph",
        text: "Ціну питають так: Kolik to stojí? (скільки це коштує?) Відповідь: Stojí to sto korun (це коштує сто крон). Валюти рахуються за загальним правилом чисел (1 / 2–4 / 5 і більше):",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "koruna", wordId: "koruna", kind: "nouns" }],
            note: [{ text: "1 koruna, 2–4 koruny, 5 і більше — korun (родовий множини): Stojí to dvacet korun (це коштує двадцять крон)." }],
          },
          {
            term: [{ word: "euro", wordId: "euro", kind: "nouns" }],
            note: [{ text: "середній рід: 1 euro, 2–4 eura, 5 і більше — eur: Stojí to deset eur (це коштує десять євро)." }],
          },
        ],
      },
      { type: "heading", text: "Порядкові в побуті: поверхи й місце" },
      {
        type: "rich-paragraph",
        segments: [{ text: "Порядкові відповідають на " }, { word: "kolikátý", wordId: "kolikaty-int", kind: "interrogative" }, { text: "? (котрий за рахунком?) і відмінюються як прикметники: " }, { word: "první", wordId: "ord-prvni", kind: "adjectives" }, { text: ", " }, { word: "druhý", wordId: "ord-druhy", kind: "adjectives" }, { text: ", " }, { word: "třetí", wordId: "ord-treti", kind: "adjectives" }, { text: ". Крім дат вони потрібні для поверхів і порядку:" }],
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "Поверхи" }],
            note: [{ text: "Перший поверх на рівні землі — " }, { word: "přízemí", wordId: "prizemi", kind: "nouns" }, { text: " (нульовий), далі 1. " }, { word: "patro", wordId: "patro", kind: "nouns" }, { text: ", 2. patro… Тобто 1. patro — це другий поверх за українським рахунком: Bydlím v prvním patře (я живу на другому поверсі). Obchod je v druhém patře (магазин на третьому поверсі)." }],
          },
          {
            term: [{ text: "Місце" }],
            note: [{ text: "Je na prvním místě (він на першому місці)." }],
          },
        ],
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
        text: "Форма ve (замість v) з'являється перед збігом приголосних для милозвучності: ve středu, ve čtvrtek, ve třech.",
      },
    ],
  },
  {
    id: "date-time",
    icon: "clock",
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
        text: "Крапка після цифри в даті — це не крапка речення, а позначка порядкового числівника: «5. května» читається «pátého května», не «pět». Тому день завжди пишуть з крапкою.",
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
        type: "tip-group",
        items: [
          {
            text: "Відчуй різницю: «prvního ledna se slaví Nový rok» (першого січня — коли, родовий) проти «první leden je svátek» (перше січня — сам предмет розмови, називний).",
          },
          {
            segments: [{ text: "Коли місяць названий СЛОВОМ — обидва в родовому: «čtrnáctého " }, { word: "února", wordId: "unor", kind: "nouns" }, { text: "». Але якщо місяць позначений числом, усталена практика (за рекомендацією Інституту чеської мови): день у родовому, а місяць-число в називному — «čtrnáctého druhý» — щоб уникнути плутанини двох однакових закінчень." }],
          },
        ],
      },
      { type: "heading", text: "Котра година: офіційно" },
      {
        type: "rich-paragraph",
        segments: [{ text: "У формальному контексті (розклади, радіо, вокзал) — 24-годинна система: просто «година хвилина» без слова " }, { word: "hodina", wordId: "hodina", kind: "nouns" }, { text: ". «Je patnáct dvacet» (15:20). Ціла година: «Je patnáct " }, { word: "hodin", wordId: "hodina", kind: "nouns" }, { text: "» (15:00)." }],
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
        text: "Увага на два різні числівники: після čtvrt na / tři čtvrtě na йде КІЛЬКІСНЕ у знахідному (na jednu, na dvě), а після půl — ПОРЯДКОВЕ у родовому (druhé, třetí). І виняток: 12:30 = «půl jedné», не «půl první».",
      },
      {
        type: "paragraph",
        text: "Проміжні хвилини — через «za X minut <опорна точка>»: «za pět minut půl druhé» (1:25), «za deset minut tři čtvrtě na dvě» (1:35).",
      },
      {
        type: "rich-list",
        items: [
          { term: [{ word: "poledne", wordId: "poledne", kind: "nouns" }, { text: " / " }, { word: "půlnoc", wordId: "pulnoc", kind: "nouns" }], note: [{ text: "v " }, { word: "poledne", wordId: "poledne", kind: "nouns" }, { text: " (опівдні) — але o " }, { word: "půlnoci", wordId: "pulnoc", kind: "nouns" }, { text: " (опівночі): різні прийменники" }] },
          { term: [{ text: "цілі 2-4" }], note: [{ text: "«Jsou dvě " }, { word: "hodiny", wordId: "hodina", kind: "nouns" }, { text: "» (дві години), «Jsou tři hodiny» (три години) — дієслово в множині; для 1 і 5+ — «Je»" }] },
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
        segments: [{ text: "Межі цих слів у чеській дещо розмиті (навіть мовознавці це визнають) — приблизно: " }, { word: "ráno", wordId: "rano", kind: "nouns" }, { text: " 6–9, " }, { word: "dopoledne", wordId: "dopoledne", kind: "nouns" }, { text: " 9–12, " }, { word: "odpoledne", wordId: "odpoledne", kind: "nouns" }, { text: " 12–18, " }, { word: "večer", wordId: "vecer", kind: "nouns" }, { text: " 18–22, v " }, { word: "noci", wordId: "noc", kind: "nouns" }, { text: " 22–6. Не намагайся визначити межу з точністю до хвилини — носії теж не завжди погоджуються." }],
      },
      { type: "heading", text: "Коли саме: вчора, за тиждень, тиждень тому" },
      {
        type: "paragraph",
        text: "Прості слова на питання «коли?» — це прислівники, їх треба просто знати:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "včera", wordId: "adv-vcera", kind: "service-word" }, { text: " / " }, { word: "dnes", wordId: "adv-dnes", kind: "service-word" }, { text: " / " }, { word: "zítra", wordId: "adv-zitra", kind: "service-word" }],
            note: [{ text: "вчора / сьогодні / завтра. Ще: " }, { word: "předevčírem", wordId: "adv-predevcirem", kind: "service-word" }, { text: " (позавчора), " }, { word: "pozítří", wordId: "adv-pozitri", kind: "service-word" }, { text: " (післязавтра)." }],
          },
          {
            term: [{ word: "loni", wordId: "adv-loni", kind: "service-word" }, { text: " / " }, { word: "letos", wordId: "adv-letos", kind: "service-word" }],
            note: [{ text: "торік / цього року: Letos jedeme na hory (цього року ми їдемо в гори)." }],
          },
        ],
      },
      {
        type: "paragraph",
        text: "Для днів, тижнів, місяців і років працюють три моделі:",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "minulý / příští + " }, { word: "týden", wordId: "tyden", kind: "nouns" }],
            note: [{ text: "без прийменника, у знахідному: Minulý týden jsem byl v Praze (минулого тижня я був у Празі). Příští týden jedeme na hory (наступного тижня ми їдемо в гори). Так само: tento týden, příští " }, { word: "měsíc", wordId: "mesic", kind: "nouns" }, { text: ", příští " }, { word: "rok", wordId: "rok", kind: "nouns" }, { text: "." }],
          },
          {
            term: [{ text: "za + знахідний" }],
            note: [{ text: "через (рахуючи від цього моменту): Za týden mám zkoušku (за тиждень у мене іспит). Vlak odjíždí za pět minut (потяг відправляється за п'ять хвилин)." }],
          },
          {
            term: [{ text: "před + орудний" }],
            note: [{ text: "тому (назад): Před týdnem jsem byla nemocná (тиждень тому я хворіла). Před třemi roky (три роки тому)." }],
          },
        ],
      },
      {
        type: "tip",
        text: "Запам'ятай пару: za týden (вперед, знахідний) і před týdnem (назад, орудний) — це різні напрямки в часі, їх не можна міняти місцями.",
      },
      { type: "heading", text: "Як часто" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "vždy", wordId: "adv-vzdy", kind: "service-word" }, { text: " / " }, { word: "vždycky", wordId: "adv-vzdycky", kind: "service-word" }],
            note: [{ text: "завжди (vždycky — розмовніше)" }],
          },
          {
            term: [{ word: "často", wordId: "adv-casto", kind: "service-word" }],
            note: [{ text: "часто" }],
          },
          {
            term: [{ word: "obvykle", wordId: "adv-obvykle", kind: "service-word" }],
            note: [{ text: "зазвичай" }],
          },
          {
            term: [{ word: "někdy", wordId: "adv-nekdy", kind: "service-word" }],
            note: [{ text: "іноді" }],
          },
          {
            term: [{ word: "nikdy", wordId: "adv-nikdy", kind: "service-word" }],
            note: [{ text: "ніколи; дієслово при ньому — у запереченні: Nikdy to nedělám (я цього ніколи не роблю)." }],
          },
        ],
      },
      {
        type: "paragraph",
        text: "Скільки разів за період — число + -krát + за + знахідний: dvakrát za den (двічі на день).",
      },
    ],
  },
  {
    id: "prepositions-fixed",
    icon: "compass",
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
            note: [{ text: "до (всередину/до часу) — «jdu do školy» (йду до школи)" }],
          },
          {
            term: [{ word: "od", wordId: "prep-od", kind: "prepositions" }],
            note: [{ text: "від — «dopis od kamaráda» (лист від друга)" }],
          },
          {
            term: [{ word: "z / ze", wordId: "prep-z", kind: "prepositions" }],
            note: [{ text: "з (звідкись) — «vracím se z práce» (повертаюсь з роботи)" }],
          },
          {
            term: [{ word: "u", wordId: "prep-u", kind: "prepositions" }],
            note: [{ text: "біля / у когось — «bydlím u nádraží» (живу біля вокзалу)" }],
          },
          {
            term: [{ word: "vedle", wordId: "prep-vedle", kind: "prepositions" }],
            note: [{ text: "поряд — «vedle okna» (поряд з вікном)" }],
          },
          {
            term: [{ word: "kolem", wordId: "prep-kolem", kind: "prepositions" }],
            note: [{ text: "навколо / повз — «kolem domu» (навколо будинку)" }],
          },
          {
            term: [{ word: "kromě", wordId: "prep-kromě", kind: "prepositions" }],
            note: [{ text: "крім — «všichni kromě Petra» (всі, крім Петра)" }],
          },
          {
            term: [{ word: "místo", wordId: "prep-misto", kind: "prepositions" }],
            note: [{ text: "замість — «místo tebe» (замість тебе)" }],
          },
          {
            term: [{ word: "podle", wordId: "prep-podle", kind: "prepositions" }],
            note: [{ text: "згідно з — «podle návodu» (за інструкцією)" }],
          },
        ],
      },
      { type: "heading", text: "Давальний (3. — Komu? Čemu?)" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "k / ke", wordId: "prep-k", kind: "prepositions" }],
            note: [{ text: "до (у напрямку) — «jdu k lékaři» (йду до лікаря)" }],
          },
          {
            term: [{ word: "kvůli", wordId: "prep-kvuli", kind: "prepositions" }],
            note: [{ text: "через (причина) — «kvůli nemoci» (через хворобу)" }],
          },
          {
            term: [{ word: "díky", wordId: "prep-diky", kind: "prepositions" }],
            note: [{ text: "завдяки — «díky tobě» (завдяки тобі)" }],
          },
          {
            term: [{ word: "proti", wordId: "prep-proti", kind: "prepositions" }],
            note: [{ text: "проти / навпроти — «proti návrhu» (проти пропозиції)" }],
          },
        ],
      },
      { type: "heading", text: "Знахідний (4. — Koho? Co?)" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "pro", wordId: "prep-pro", kind: "prepositions" }],
            note: [{ text: "для / за (піти по когось) — «pro tebe» (для тебе)" }],
          },
          {
            term: [{ word: "přes", wordId: "prep-pres", kind: "prepositions" }],
            note: [{ text: "через (поперек) / понад — «přes most» (через міст)" }],
          },
          {
            term: [{ word: "skrz", wordId: "prep-skrz", kind: "prepositions" }],
            note: [{ text: "крізь — «skrz dav» (крізь натовп)" }],
          },
          {
            term: [{ word: "mimo", wordId: "prep-mimo", kind: "prepositions" }],
            note: [{ text: "поза / окрім — «mimo město» (поза містом)" }],
          },
        ],
      },
      { type: "heading", text: "Місцевий (6. — O kom? O čem?)" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "při", wordId: "prep-pri", kind: "prepositions" }],
            note: [{ text: "при / під час — «při práci» (під час роботи)" }],
          },
        ],
      },
      { type: "heading", text: "Орудний (7. — Kým? Čím?)" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "s / se", wordId: "prep-s", kind: "prepositions" }],
            note: [{ text: "з (разом із) — «s kamarádem» (з другом)" }],
          },
        ],
      },
      {
        type: "tip-group",
        items: [
          {
            segments: [
              { text: "Вокалізація: короткі прийменники " },
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
            segments: [
              { text: "Не плутай: деякі слова бувають і прийменником, і прислівником. «Stál " },
              { word: "vedle", wordId: "prep-vedle", kind: "prepositions" },
              { text: " mě» (прийменник + іменник) проти «Stál vedle» (прислівник, сам по собі). Прийменник завжди тягне за собою слово в потрібному відмінку." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "prepositions-dual",
    icon: "compass",
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
          { term: "куди? → знахідний", note: "Jdu na poštu (йду на пошту). Dal boty pod postel (поставив черевики під ліжко). Schoval se za dveře (сховався за двері)." },
          { term: "де? → місцевий / орудний", note: "Jsem na poště (я на пошті). Boty jsou pod postelí (черевики під ліжком). Stojí za dveřmi (стоїть за дверима)." },
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
            note: [{ text: "куди → знахідний (4., akuzativ), де → місцевий (6., lokál): na stůl (на стіл) / na stole (на столі)" }],
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
            note: [{ text: "куди → знахідний (4., akuzativ), де → орудний (7., instrumentál): pod stůl (під стіл) / pod stolem (під столом)" }],
          },
        ],
      },
      {
        type: "tip-group",
        items: [
          {
            segments: [
              { text: "Порівняй пару: «Kočka leze POD STŮL» (куди? — знахідний, рух) проти «Kočka spí POD STOLEM» (де? — орудний, спокій / дія без напрямку). Той самий прийменник " },
              { word: "pod", wordId: "prep-pod", kind: "prepositions" },
              { text: ", але різні відмінки." },
            ],
          },
          {
            segments: [
              { text: "«" },
              { word: "o", wordId: "prep-o", kind: "prepositions" },
              { text: "» має ще й непросторове значення «про» (тема розмови) — і там воно ЗАВЖДИ місцевий, без пари «куди»: «Mluvíme o práci» (говоримо про роботу). Просторова пара «куди/де» діє лише для фізичного значення o (наприклад opřít se o zeď — знахідний, спертися об щось)." },
            ],
          },
        ],
      },
      { type: "heading", text: "v чи na: яке слово обрати?" },
      {
        type: "paragraph",
        text: "Простого правила, коли брати v/ve, а коли na, немає — вибір часто задає традиція, тому зручніше запам'ятовувати сполуки. На питання «де?» відповідає v/ve або na + місцевий, а на «куди?» — do + родовий (замість v/ve) або na + знахідний (замість na).",
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "Країни: здебільшого v — do" }],
            note: [{ text: "v Itálii — do Itálie (в Італії — до Італії), v Polsku — do Polska (у Польщі — до Польщі), v Ukrajině — do Ukrajiny (в Україні — до України), ve Slovinsku — do Slovinska (у Словенії — до Словенії). Винятки: na Slovensku — na Slovensko (у Словаччині — до Словаччини), na Moravě — na Moravu (на Мораві — до Моравії)." }],
          },
          {
            term: [{ text: "Гори: здебільшого v — do" }],
            note: [{ text: "v Jeseníkách — do Jeseníků (в Єсеніках — до Єсеників), v Alpách (в Альпах). Виняток: na Šumavě — na Šumavu (на Шумаві — на Шумаву)." }],
          },
          {
            term: [{ text: "Пори року" }],
            note: [{ text: "v " }, { word: "létě", wordId: "leto", kind: "nouns" }, { text: " (влітку), v " }, { word: "zimě", wordId: "zima", kind: "nouns" }, { text: " (взимку) — але na " }, { word: "jaře", wordId: "jaro", kind: "nouns" }, { text: " (навесні), na " }, { word: "podzim", wordId: "podzim", kind: "nouns" }, { text: " (восени)." }],
          },
          {
            term: [{ text: "Будівлі й місця" }],
            note: [{ text: "v " }, { word: "obchodě", wordId: "obchod", kind: "nouns" }, { text: " (у магазині), ve " }, { word: "škole", wordId: "skola", kind: "nouns" }, { text: " (у школі), v " }, { word: "hotelu", wordId: "hotel", kind: "nouns" }, { text: " (у готелі); na " }, { word: "poště", wordId: "posta", kind: "nouns" }, { text: " (на пошті), na " }, { word: "nádraží", wordId: "nadrazi", kind: "nouns" }, { text: " (на вокзалі), na " }, { word: "úřadě", wordId: "urad", kind: "nouns" }, { text: " (в установі)." }],
          },
        ],
      },
      {
        type: "tip",
        text: "Україна: v Ukrajině / do Ukrajiny — коректна форма, і її вживають дедалі частіше. Традиційно в чеській казали й na Ukrajině / na Ukrajinu: прийменник na тут не має зневажливого відтінку (так пояснює Інститут чеської мови), це просто усталена звичка мови, тому почути можна обидва варіанти.",
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
          { text: "Вокалізація " },
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
    icon: "map",
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
          { text: "Помічник (не правило без винятків!): БІЛЬШІСТЬ «куди?»-форм починаються на до- (" },
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
        type: "tip-group",
        items: [
          {
            segments: [
              { text: "«" },
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
            segments: [
              { text: "«" },
              { word: "doma", wordId: "adv-doma", kind: "adverbs" },
              { text: "» (вдома) / «" },
              { word: "domů", wordId: "adv-doma", kind: "adverbs" },
              { text: "» (додому) — пара де/куди звичайна, а от форми «звідки?» одним словом немає: вживається прийменникова конструкція «z domova» (родовий відмінок іменника domov: Přišel z domova), не самостійний прислівник." },
            ],
          },
          {
            text: "Не плутай зі словом «vedle» з прийменників — це та сама лексема в іншій ролі: «Stůl je vedle» (прислівник, сам по собі) проти «Stůl je vedle okna» (прийменник, керує родовим). У цьому розділі vedle не повторюємо — дивись «Прийменники».",
          },
        ],
      },
      { type: "heading", text: "Четвертий вимір: кудою? (шлях)" },
      {
        type: "paragraph",
        text: "Окрім де?/куди?/звідки?, є ще одне питання про місце — кудою? (яким шляхом). Це НЕ четверта форма кожного слова з таблиці вище: форми шляху існують лише для двох слів — «тут» і «там». Для vlevo/nahoře/venku тощо форми шляху в чеській мові просто немає.",
      },
      {
        type: "rich-tip",
        segments: [
          { text: "кудою? → " },
          { word: "tudy", wordId: "adv-tady", kind: "adverbs" },
          { text: " (цим шляхом, від tady) / " },
          { word: "tamtudy", wordId: "adv-tam", kind: "adverbs" },
          { text: " (тим шляхом, від tam). «Kudy se dostanu na nádraží? — Tudy.» (Яким шляхом мені дістатись до вокзалу? — Цим.) Саме питальне слово " },
          { word: "kudy", wordId: "int-kudy", kind: "interrogative" },
          { text: " — дивись розділ «Питальні слова»." },
        ],
      },
    ],
  },
  {
    id: "interrogative-words",
    icon: "question",
    title: "Питальні слова",
    subtitle: "Як ставити запитання — уся система разом",
    ready: true,
    blocks: [
      {
        type: "paragraph",
        text: "Чеські питальні слова — це не одна частина мови, а ціла родина «k-слів» (zájmena tázací і zájmenná příslovce tázací), об'єднана функцією: усі вони запитують. Для того, як ставити запитання, зручніше вчити їх разом, ніж розкидати за формальними частинами мови.",
      },
      { type: "heading", text: "Займенникові — про особу/предмет/ознаку" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ text: "хто? / що?" }],
            note: [
              { word: "kdo", wordId: "kdo-int", kind: "interrogative" },
              { text: " / " },
              { word: "co", wordId: "co-int", kind: "interrogative" },
              { text: " — без роду, одна форма на відмінок (як особові займенники)." },
            ],
          },
          {
            term: [{ text: "який?" }],
            note: [
              { word: "jaký", wordId: "jaky-int", kind: "interrogative" },
              { text: " — про якість/ознаку: «Jaký je ten film?» (Який цей фільм?). Відмінюється як прикметник." },
            ],
          },
          {
            term: [{ text: "котрий? (з кількох)" }],
            note: [
              { word: "který", wordId: "ktery-int", kind: "interrogative" },
              { text: " — про вибір з-поміж відомих варіантів: «Který chceš?» (Котрий хочеш?). Теж адʼєктивне відмінювання." },
            ],
          },
          {
            term: [{ text: "чий?" }],
            note: [
              { word: "čí", wordId: "ci-int", kind: "interrogative" },
              { text: " — про належність: «Čí je to kniha?» (Чия це книга?)." },
            ],
          },
        ],
      },
      { type: "heading", text: "Прислівникові — про місце" },
      {
        type: "rich-paragraph",
        segments: [
          { text: "Чотири самостійні незмінювані слова (не форми одного): " },
          { word: "kde", wordId: "int-kde", kind: "interrogative" },
          { text: " (де?), " },
          { word: "kam", wordId: "int-kam", kind: "interrogative" },
          { text: " (куди?), " },
          { word: "odkud", wordId: "int-odkud", kind: "interrogative" },
          { text: " (звідки?), " },
          { word: "kudy", wordId: "int-kudy", kind: "interrogative" },
          { text: " (кудою?, яким шляхом). Детальніше про відповіді на ці питання (vlevo, tam) — розділ «Прислівники місця»." },
        ],
      },
      { type: "heading", text: "Інші" },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "kdy", wordId: "int-kdy", kind: "interrogative" }],
            note: [{ text: "коли? — про час: «Kdy přijedeš?» (Коли ти приїдеш?)" }],
          },
          {
            term: [{ word: "jak", wordId: "int-jak", kind: "interrogative" }],
            note: [{ text: "як? — про спосіб: «Jak to funguje?» (Як це працює?)" }],
          },
          {
            term: [{ word: "proč", wordId: "int-proc", kind: "interrogative" }],
            note: [{ text: "чому? — про причину: «Proč to děláš?» (Чому ти це робиш?)" }],
          },
          {
            term: [{ word: "kolik", wordId: "int-kolik", kind: "interrogative" }],
            note: [{ text: "скільки? — про кількість: «Kolik to stojí?» (Скільки це коштує?)" }],
          },
        ],
      },
      {
        type: "tip-group",
        items: [
          {
            segments: [
              { word: "kolik", wordId: "int-kolik", kind: "interrogative" },
              { text: " керує родовим відмінком множини наступного іменника — так само, як числівники " },
              { word: "pět", wordId: "card-pet", kind: "cardinals" },
              { text: " і більше: «Kolik jablek chceš?» (Скільки яблук ти хочеш? — jablek, родовий множини). Той самий навик, що в розділі «Числівники»." },
            ],
          },
          {
            text: "kdy/jak/proč — прозорі відповідники «коли/як/чому», тому окремого квізу для них немає: досить словника і кількох прикладів. А от kde/kam/odkud/kudy тренуються в Флеш-картках, у розділі «Прислівники місця» — там треба РОЗРІЗНЯТИ, яке питання підходить до конкретного речення.",
          },
        ],
      },
    ],
  },
  {
    id: "service-words",
    icon: "link",
    title: "Службові слова",
    subtitle: "pokud/jestli, nicméně/přesto, aby+kondicionál",
    ready: true,
    blocks: [
      {
        type: "paragraph",
        text: "Кілька службових слів виглядають як прості синоніми, але мають свій нюанс вживання — розберемо найважливіші пари.",
      },
      { type: "heading", text: "pokud і jestli — «якщо»" },
      {
        type: "rich-paragraph",
        segments: [
          { word: "pokud", wordId: "conj-pokud", kind: "service-word" },
          {
            text: " — нейтральний, універсальний вибір «якщо»: працює і в мові, і на письмі, а ще має ДОДАТКОВЕ значення «оскільки, за умови, що» (наприклад «Budeš zdravá, pokud budeš sportovat» — будеш здорова, якщо будеш займатися спортом), якого в ",
          },
          { word: "jestli", wordId: "conj-jestli", kind: "service-word" },
          { text: " немає." },
        ],
      },
      {
        type: "rich-paragraph",
        segments: [
          { word: "jestli", wordId: "conj-jestli", kind: "service-word" },
          {
            text: " — розмовніший варіант, і єдиний із двох годиться для непрямого питання «чи»: «Řekni mi, jestli přijdeš» (Скажи, чи прийдеш). У звичайному значенні «якщо» обидва слова взаємозамінні.",
          },
        ],
      },
      {
        type: "tip",
        text: "Порада: якщо не впевнений, який вибрати — бери pokud, це безпечний дефолт для «якщо» в будь-якому реченні.",
      },
      { type: "heading", text: "nicméně, přesto, ačkoli/přestože — «проте / хоча»" },
      {
        type: "rich-paragraph",
        segments: [
          { word: "nicméně", wordId: "adv-nicmene", kind: "service-word" },
          { text: " і " },
          { word: "přesto", wordId: "adv-presto", kind: "service-word" },
          {
            text: " — справжні синоніми (проте, однак): nicméně трохи книжніше/писемне, přesto — нейтральне, однаково природне і в мові, і на письмі. Обидва зазвичай стоять після коми: «Pršelo, přesto jsme šli ven» (йшов дощ, проте ми вийшли надвір).",
          },
        ],
      },
      {
        type: "rich-paragraph",
        segments: [
          { word: "ačkoli", wordId: "conj-ackoli", kind: "service-word" },
          { text: " і " },
          { word: "přestože", wordId: "conj-prestoze", kind: "service-word" },
          {
            text: " (хоча) — теж дуже близькі синоніми: за корпусними даними майже в 98% випадків виконують ту саму функцію, чіткої стилістичної різниці немає. Практична порада: ačkoli — безпечний нейтральний вибір завжди; головне — не плутати přestože з ",
          },
          { word: "přesto", wordId: "adv-presto", kind: "service-word" },
          {
            text: " (той самий корінь, різна роль: přestože вводить підрядне речення «хоча…», а přesto — самостійне слово в головному реченні).",
          },
        ],
      },
      { type: "heading", text: "aby і kdyby — частка + кондиціонал" },
      {
        type: "rich-paragraph",
        segments: [
          { word: "aby", wordId: "conj-aby", kind: "service-word" },
          { text: " і " },
          { word: "kdyby", wordId: "conj-kdyby", kind: "service-word" },
          {
            text: " історично зрослися з особовими закінченнями кондиціоналу (a+by, kdy+by) — тому мають 6 форм за особами (abych/abys/aby/abychom/abyste/aby — повну таблицю дивись на картці самого слова), а не одну незмінну форму.",
          },
        ],
      },
      {
        type: "rich-list",
        items: [
          {
            term: [{ word: "aby", wordId: "conj-aby", kind: "service-word" }],
            note: [
              {
                text: "мета/бажання (щоб): «Přišel jsem, abych ti pomohl» (Я прийшов, щоб тобі допомогти).",
              },
            ],
          },
          {
            term: [{ word: "kdyby", wordId: "conj-kdyby", kind: "service-word" }],
            note: [
              {
                text: "гіпотетична умова (якби): «Kdybych měl čas, pomohl bych ti» (Якби я мав час, я б тобі допоміг).",
              },
            ],
          },
        ],
      },
      {
        type: "tip",
        text: "Після aby/kdyby-форми дієслово стоїть у дієприкметниковій формі на -l (як у минулому часі й кондиціоналі: dělal, pomohl, měl): abych pomohl, kdybych měl тощо. Якщо підмет обох частин речення той самий — простіше вжити інфінітив: «Přišel jsem pomoct» (я прийшов допомогти) замість «abych pomohl» (щоб допомогти).",
      },
    ],
  },
];
