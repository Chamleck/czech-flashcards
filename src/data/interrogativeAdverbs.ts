import { InvariantWordEntry } from "../types";

// Питальні прислівники місця: kde? / kam? / odkud? / kudy? — незмінна частина
// мови (zájmenná příslovce tázací, czechency.org), без парадигми, тому по
// 4 приклади на слово (той самий компенсаційний паттерн, що й для решти
// незмінюваних питальних слів). Формально ЦЕ ІНШІ слова, ніж їхні відповіді
// (vlevo/tam/tady тощо з adverbs.ts) — kde запитує, vlevo відповідає.
//
// Ці ж слова — правильні відповіді у reverse-квізі adverbQuizEngine.ts
// (кв "Прислівники місця": дано речення-відповідь, обрати яке питання воно
// покриває). Дані тут — для словника/граматики; квіз-логіка окремо.

export const INTERROGATIVE_ADVERBS: InvariantWordEntry[] = [
  {
    id: "int-kde",
    cz: "kde",
    uk: "де?",
    examples: [
      { cz: "Kde bydlíš?", uk: "Де ти живеш?" },
      { cz: "Kde je nádraží?", uk: "Де вокзал?" },
      { cz: "Nevím, kde to je.", uk: "Я не знаю, де це." },
      { cz: "Kde se sejdeme?", uk: "Де ми зустрінемось?" },
    ],
  },
  {
    id: "int-kam",
    cz: "kam",
    uk: "куди?",
    examples: [
      { cz: "Kam jdeš?", uk: "Куди ти йдеш?" },
      { cz: "Kam pojedeme na dovolenou?", uk: "Куди ми поїдемо у відпустку?" },
      { cz: "Kam mám dát ten kufr?", uk: "Куди мені поставити цю валізу?" },
      { cz: "Nevím, kam jít.", uk: "Я не знаю, куди йти." },
    ],
  },
  {
    id: "int-odkud",
    cz: "odkud",
    uk: "звідки?",
    examples: [
      { cz: "Odkud jsi?", uk: "Звідки ти?" },
      { cz: "Odkud to víš?", uk: "Звідки ти це знаєш?" },
      { cz: "Odkud přijíždí ten vlak?", uk: "Звідки прибуває цей потяг?" },
      { cz: "Odkud se ozval ten zvuk?", uk: "Звідки почувся цей звук?" },
    ],
  },
  {
    id: "int-kudy",
    cz: "kudy",
    uk: "кудою? / яким шляхом?",
    examples: [
      { cz: "Kudy se dostanu na nádraží?", uk: "Яким шляхом мені дістатись до вокзалу?" },
      { cz: "Kudy půjdeme?", uk: "Яким шляхом ми підемо?" },
      { cz: "Nevím, kudy jet.", uk: "Я не знаю, яким шляхом їхати." },
      { cz: "Kudy jedeš do práce?", uk: "Яким шляхом ти їздиш на роботу?" },
    ],
  },
];
