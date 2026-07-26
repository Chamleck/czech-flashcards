import { PersonForms } from "../types";

// Допоміжне дієслово "být" — спільні константи для всіх карток.
// Не дублюємо їх у кожному дієслові.

// Теперішній час "být" (використовується як допоміжне у минулому часі:
// jsem/jsi + l-дієприкметник; у 3-й особі допоміжне НЕ вживається).
export const BYT_PRESENT: PersonForms = {
  ja: "jsem",
  ty: "jsi",
  on: "je",
  my: "jsme",
  vy: "jste",
  oni: "jsou",
};

// Майбутній час "být" — основа складеного майбутнього недоконаних дієслів:
// budu/budeš… + інфінітив.
export const BYT_FUTURE: PersonForms = {
  ja: "budu",
  ty: "budeš",
  on: "bude",
  my: "budeme",
  vy: "budete",
  oni: "budou",
};

// Допоміжні форми минулого часу для 1-ї та 2-ї особи (jsem/jsi/jsme/jste);
// у 3-й особі (on/oni) допоміжного немає — порожній рядок.
export const PAST_AUX: PersonForms = {
  ja: "jsem",
  ty: "jsi",
  on: "",
  my: "jsme",
  vy: "jste",
  oni: "",
};
