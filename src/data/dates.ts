import { DateOrdinal, MonthName } from "../types";

// ─────────────────────────── ДАТИ ───────────────────────────
// Легкий датасет спеціально для квіза дат. НЕ повна парадигма (для дат
// потрібні лише дві форми порядкового: називний = «сама дата як підмет»,
// родовий = «коли щось відбувається»). Тому не тягнемо сюди важкий
// AdjectiveEntry (56 форм) — за принципом проєкту моделюємо рівно те, що
// потрібно, як зробили з CardinalEntry.
//
// Формула дати (звірено з ÚJЧ / realityczech.org / elon.io / language-hub):
//   родовий порядкового (день) + родовий назви місяця → «pátého května»
// Складені дати 13–31 мають ДВА нормативні варіанти:
//   • аналітичний: обидві частини порядкові й відмінювані — «dvacátého pátého»
//   • злитий (нім. модель): одиниця+а+десяток як одне слово — «pětadvacátého»
// Зберігаємо обидва рядком через " / " (усталений патерн дублетів проєкту);
// перший = canonical для квіза (firstForm), TTS читає обидва.
//
// nom — форма для рідкісного випадку «дата як підмет речення»:
//   «První leden je státní svátek» (Перше січня — свято) — називний.
// gen — форма для звичайного «коли»: «prvního ledna» (першого січня) — родовий.

export const DATE_ORDINALS: DateOrdinal[] = [
  { day: 1, uk: "перший", nom: "první", gen: "prvního" },
  { day: 2, uk: "другий", nom: "druhý", gen: "druhého" },
  { day: 3, uk: "третій", nom: "třetí", gen: "třetího" },
  { day: 4, uk: "четвертий", nom: "čtvrtý", gen: "čtvrtého" },
  { day: 5, uk: "п'ятий", nom: "pátý", gen: "pátého" },
  { day: 6, uk: "шостий", nom: "šestý", gen: "šestého" },
  { day: 7, uk: "сьомий", nom: "sedmý", gen: "sedmého" },
  { day: 8, uk: "восьмий", nom: "osmý", gen: "osmého" },
  { day: 9, uk: "дев'ятий", nom: "devátý", gen: "devátého" },
  { day: 10, uk: "десятий", nom: "desátý", gen: "desátého" },
  { day: 11, uk: "одинадцятий", nom: "jedenáctý", gen: "jedenáctého" },
  { day: 12, uk: "дванадцятий", nom: "dvanáctý", gen: "dvanáctého" },
  { day: 13, uk: "тринадцятий", nom: "třináctý", gen: "třináctého" },
  { day: 14, uk: "чотирнадцятий", nom: "čtrnáctý", gen: "čtrnáctého" },
  { day: 15, uk: "п'ятнадцятий", nom: "patnáctý", gen: "patnáctého" },
  { day: 16, uk: "шістнадцятий", nom: "šestnáctý", gen: "šestnáctého" },
  { day: 17, uk: "сімнадцятий", nom: "sedmnáctý", gen: "sedmnáctého" },
  { day: 18, uk: "вісімнадцятий", nom: "osmnáctý", gen: "osmnáctého" },
  { day: 19, uk: "дев'ятнадцятий", nom: "devatenáctý", gen: "devatenáctého" },
  { day: 20, uk: "двадцятий", nom: "dvacátý", gen: "dvacátého" },
  // 21–29, 31: аналітичний / злитий. Обидві частини в родовому в аналітичному
  // варіанті (dvacátého prvního — не можна відмінювати лише першу половину).
  { day: 21, uk: "двадцять перший", nom: "dvacátý první / jednadvacátý", gen: "dvacátého prvního / jednadvacátého" },
  { day: 22, uk: "двадцять другий", nom: "dvacátý druhý / dvaadvacátý", gen: "dvacátého druhého / dvaadvacátého" },
  { day: 23, uk: "двадцять третій", nom: "dvacátý třetí / třiadvacátý", gen: "dvacátého třetího / třiadvacátého" },
  { day: 24, uk: "двадцять четвертий", nom: "dvacátý čtvrtý / čtyřiadvacátý", gen: "dvacátého čtvrtého / čtyřiadvacátého" },
  { day: 25, uk: "двадцять п'ятий", nom: "dvacátý pátý / pětadvacátý", gen: "dvacátého pátého / pětadvacátého" },
  { day: 26, uk: "двадцять шостий", nom: "dvacátý šestý / šestadvacátý", gen: "dvacátého šestého / šestadvacátého" },
  { day: 27, uk: "двадцять сьомий", nom: "dvacátý sedmý / sedmadvacátý", gen: "dvacátého sedmého / sedmadvacátého" },
  { day: 28, uk: "двадцять восьмий", nom: "dvacátý osmý / osmadvacátý", gen: "dvacátého osmého / osmadvacátého" },
  { day: 29, uk: "двадцять дев'ятий", nom: "dvacátý devátý / devětadvacátý", gen: "dvacátého devátého / devětadvacátého" },
  { day: 30, uk: "тридцятий", nom: "třicátý", gen: "třicátého" },
  { day: 31, uk: "тридцять перший", nom: "třicátý první / jednatřicátý", gen: "třicátého prvního / jednatřicátého" },
];

// Назви місяців у називному й родовому (родовий — форма в даті).
// Родовий звірено: більшість -en → -na (leden→ledna), але září незмінне,
// listopad→listopadu, červenec→července. (Ці факти вже в темі граматики
// «дні/місяці», тут — робочий датасет для квіза дат.)
export const MONTHS: MonthName[] = [
  { num: 1, uk: "січень", nom: "leden", gen: "ledna" },
  { num: 2, uk: "лютий", nom: "únor", gen: "února" },
  { num: 3, uk: "березень", nom: "březen", gen: "března" },
  { num: 4, uk: "квітень", nom: "duben", gen: "dubna" },
  { num: 5, uk: "травень", nom: "květen", gen: "května" },
  { num: 6, uk: "червень", nom: "červen", gen: "června" },
  { num: 7, uk: "липень", nom: "červenec", gen: "července" },
  { num: 8, uk: "серпень", nom: "srpen", gen: "srpna" },
  { num: 9, uk: "вересень", nom: "září", gen: "září" },
  { num: 10, uk: "жовтень", nom: "říjen", gen: "října" },
  { num: 11, uk: "листопад", nom: "listopad", gen: "listopadu" },
  { num: 12, uk: "грудень", nom: "prosinec", gen: "prosince" },
];
