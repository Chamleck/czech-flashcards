// Фрази квізу «Дата й час» (datetimeEngine.ts). ___ — пропуск (саме тестована форма).
//
// ПРАВИЛА ДОДАВАННЯ ФРАЗ
//  1. Фраза однозначна: на місці ___ граматична ЛИШЕ правильна форма, дистрактор — ні. Тому дата-підмет (називний)
//     — лише підмет з іменною частиною в орудному: «1. leden byl prvním dnem nového roku» (ptejteseknihovny.cz). Тоді
//     родовий без підмета неграматичний. НЕ «___ květen byl krásný den» («Pátého května byl krásný den» — «п'ятого
//     травня був гарний день» — теж правильно), НЕ «Dnes je ___ květen» («Dnes je pátého května»).
//  2. Слоти: {M} — назва місяця (у родовому для DATE.gen, у називному для DATE.nom; місяць обирає рушій серед тих, де
//     такий день є); {D} — дата в родовому («pátého května»).
//  3. Фраза — загальна, правдива для будь-якого дня / часу (не «___ prosinec je Štědrý den»).
//  4. Колокації — за джерелом, як і форми. Після додавання прочитай усі фрази з кожною відповіддю; перед здачею —
//     оракул scripts/check-quiz-coverage.ts --only=datetime: «Помилок: 0».

export const DATE_FRAMES = {
  // «коли?» — родовий: день + місяць у родовому
  gen: ["___ {M}", "Narodil jsem se ___ {M}.", "Sejdeme se ___ {M}.", "Dovolenou mám od ___ {M}."],
  // дата як підмет — називний (рідкісний тип питання): «1. leden byl prvním dnem nového roku»
  nom: ["___ {M} byl prvním dnem dovolené.", "___ {M} bude posledním dnem kurzu."],
};

export const WEEKDAY_FRAMES = {
  // «коли?» — v / ve + знахідний
  when: [
    "Schůzka je ___.",
    "Mám narozeniny ___.",
    "Vrátíme se domů ___.",
    "Obchod bude zavřený ___.",
    "Jedeme na výlet ___.",
    "Sejdeme se {D}, ___.",
    "Přijedu {D}, ___.",
    "Narozeniny mám {D}, ___.",
  ],
  // назва дня — називний
  name: ["Dnes je ___.", "Zítra bude ___.", "Pozítří bude ___."],
};

// «V kolik?» — v / ve + час (знахідний): ve tři hodiny, v půl druhé, ve čtvrt na pět (mozaika.eu, «V kolik hodin?»).
export const AT_TIME_FRAMES = ["Sejdeme se ___.", "Vlak odjíždí ___.", "Film začíná ___.", "Přijdu domů ___."];
