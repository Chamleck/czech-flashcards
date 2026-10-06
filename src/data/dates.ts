import { DateOrdinal, NounEntry } from "../types";
import { NOUNS } from "./nouns";

// ─────────────────────────── ДАТИ ───────────────────────────
// Легкий датасет спеціально для квіза дат. НЕ повна парадигма (для дат
// потрібні лише дві форми порядкового: називний = «сама дата як підмет»,
// родовий = «коли щось відбувається»). Тому не тягнемо сюди важкий
// AdjectiveEntry (56 форм) — за принципом проєкту моделюємо рівно те, що
// потрібно, як зробили з CardinalEntry.
//
// Формула дати (звірено з ÚJČ / realityczech.org / elon.io / language-hub):
//   родовий порядкового (день) + родовий назви місяця → «pátého května»
// Складені дати 13–31 мають ДВА нормативні варіанти:
//   • аналітичний: обидві частини порядкові й відмінювані — «dvacátého pátého»
//   • злитий (нім. модель): одиниця+а+десяток як одне слово — «pětadvacátého»
// Зберігаємо обидва рядком через " / " (усталений патерн дублетів проєкту);
// перший — аналітичний, TTS читає обидва; квіз питає обидва (правило 2 нижче).
//
// nom — форма для рідкісного випадку «дата як підмет речення»:
//   «První leden je státní svátek» (Перше січня — свято) — називний.
// gen — форма для звичайного «коли»: «prvního ledna» (першого січня) — родовий.
//
// ПРАВИЛА ДОДАВАННЯ (квіз «Дата й час»)
//  1. Рівно 31 день; nom і gen — чоловічий рід однини порядкового (den: «pátý», «pátého»). Дні 1–12 мусять збігатися
//     з порядковими прикметниками data/adjectives.ts (category ordinal, поле value) — оракул це звіряє.
//  2. Складені дні 21–29, 31: обидва нормативні варіанти через « / » — спершу аналітичний, потім злитий; квіз питає
//     ОБИДВА (кожен як правильну відповідь) і дистрактор бере в тому ж варіанті (інакше стиль підказав би відповідь).
//  3. uk — середній рід, як в українській даті («п'яте травня»: квіз додає місяць у родовому з поля month.ukGen).
//  4. Місяці не тут — це іменники з полем month (data/nouns.ts, правило 12).
//  5. Фрази квізу — data/datetimeFrames.ts. Перед здачею — оракул scripts/check-quiz-coverage.ts --only=datetime:
//     «Помилок: 0».

export const DATE_ORDINALS: DateOrdinal[] = [
  { day: 1, uk: "перше", nom: "první", gen: "prvního" },
  { day: 2, uk: "друге", nom: "druhý", gen: "druhého" },
  { day: 3, uk: "третє", nom: "třetí", gen: "třetího" },
  { day: 4, uk: "четверте", nom: "čtvrtý", gen: "čtvrtého" },
  { day: 5, uk: "п'яте", nom: "pátý", gen: "pátého" },
  { day: 6, uk: "шосте", nom: "šestý", gen: "šestého" },
  { day: 7, uk: "сьоме", nom: "sedmý", gen: "sedmého" },
  { day: 8, uk: "восьме", nom: "osmý", gen: "osmého" },
  { day: 9, uk: "дев'яте", nom: "devátý", gen: "devátého" },
  { day: 10, uk: "десяте", nom: "desátý", gen: "desátého" },
  { day: 11, uk: "одинадцяте", nom: "jedenáctý", gen: "jedenáctého" },
  { day: 12, uk: "дванадцяте", nom: "dvanáctý", gen: "dvanáctého" },
  { day: 13, uk: "тринадцяте", nom: "třináctý", gen: "třináctého" },
  { day: 14, uk: "чотирнадцяте", nom: "čtrnáctý", gen: "čtrnáctého" },
  { day: 15, uk: "п'ятнадцяте", nom: "patnáctý", gen: "patnáctého" },
  { day: 16, uk: "шістнадцяте", nom: "šestnáctý", gen: "šestnáctého" },
  { day: 17, uk: "сімнадцяте", nom: "sedmnáctý", gen: "sedmnáctého" },
  { day: 18, uk: "вісімнадцяте", nom: "osmnáctý", gen: "osmnáctého" },
  { day: 19, uk: "дев'ятнадцяте", nom: "devatenáctý", gen: "devatenáctého" },
  { day: 20, uk: "двадцяте", nom: "dvacátý", gen: "dvacátého" },
  // 21–29, 31: аналітичний / злитий. Обидві частини в родовому в аналітичному
  // варіанті (dvacátého prvního — не можна відмінювати лише першу половину).
  { day: 21, uk: "двадцять перше", nom: "dvacátý první / jednadvacátý", gen: "dvacátého prvního / jednadvacátého" },
  { day: 22, uk: "двадцять друге", nom: "dvacátý druhý / dvaadvacátý", gen: "dvacátého druhého / dvaadvacátého" },
  { day: 23, uk: "двадцять третє", nom: "dvacátý třetí / třiadvacátý", gen: "dvacátého třetího / třiadvacátého" },
  { day: 24, uk: "двадцять четверте", nom: "dvacátý čtvrtý / čtyřiadvacátý", gen: "dvacátého čtvrtého / čtyřiadvacátého" },
  { day: 25, uk: "двадцять п'яте", nom: "dvacátý pátý / pětadvacátý", gen: "dvacátého pátého / pětadvacátého" },
  { day: 26, uk: "двадцять шосте", nom: "dvacátý šestý / šestadvacátý", gen: "dvacátého šestého / šestadvacátého" },
  { day: 27, uk: "двадцять сьоме", nom: "dvacátý sedmý / sedmadvacátý", gen: "dvacátého sedmého / sedmadvacátého" },
  { day: 28, uk: "двадцять восьме", nom: "dvacátý osmý / osmadvacátý", gen: "dvacátého osmého / osmadvacátého" },
  { day: 29, uk: "двадцять дев'яте", nom: "dvacátý devátý / devětadvacátý", gen: "dvacátého devátého / devětadvacátého" },
  { day: 30, uk: "тридцяте", nom: "třicátý", gen: "třicátého" },
  { day: 31, uk: "тридцять перше", nom: "třicátý první / jednatřicátý", gen: "třicátého prvního / jednatřicátého" },
];

// Місяці — іменники словника з полем month (data/nouns.ts): називний і родовий однини беремо з їхньої таблиці
// (leden → ledna, září незмінне, listopad → listopadu, červenec → července), номер і найбільший день — з поля.
export const CALENDAR_MONTHS: (NounEntry & { month: NonNullable<NounEntry["month"]> })[] = NOUNS.filter(
  (n): n is NounEntry & { month: NonNullable<NounEntry["month"]> } => n.month !== undefined
).sort((a, b) => a.month.num - b.month.num);
