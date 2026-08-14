// Тепла, дружня палітра. Основа — глибокий сливовий фон із теплими акцентами
// (медовий, коралловий, м'ятний), щоб не скотитись у стандартний "AI-дефолт".
export const theme = {
  colors: {
    bg: "#211527", // глибокий сливовий
    bgCard: "#2f1d38", // картка
    bgElevated: "#3d2749",
    honey: "#f5a623", // медовий — головний акцент
    coral: "#ff6b6b", // кораловий — "не знаю"
    mint: "#4ecdc4", // м'ятний — "знаю"
    lilac: "#c8a2ff", // бузковий — інформація
    text: "#f4ecf7",
    textDim: "#b09cba",
    textFaint: "#7d6a87",
  },
  // Кольори за родом — швидка візуальна орієнтація
  genderColor: {
    masc_anim: "#4ecdc4",
    masc_inan: "#5a9fd4",
    fem: "#ff8fb1",
    neut: "#f5a623",
  },
  radius: { sm: 10, md: 16, lg: 24 },
  space: (n: number) => n * 4,
};

export const GENDER_LABEL = {
  masc_anim: "рід чол. (істота)",
  masc_inan: "рід чол. (неістота)",
  fem: "рід жін.",
  neut: "рід сер.",
} as const;
