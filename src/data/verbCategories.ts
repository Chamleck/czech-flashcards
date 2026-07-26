import { VerbClass } from "../types";
import { theme } from "../utils/theme";

export interface VerbClassMeta {
  key: VerbClass;
  title: string; // українською
  hint: string; // коротка граматична підказка
  examples: string; // приклади-представники
  color: string;
}

// Порядок відображення класів на екрані вибору дієслів.
export const VERB_CLASSES: VerbClassMeta[] = [
  {
    key: "I",
    title: "I клас (-e/-ě)",
    hint: "3-тя ос. одн. на -e: nese, bere",
    examples: "nést, brát, psát, číst",
    color: theme.colors.honey,
  },
  {
    key: "II",
    title: "II клас (-ne)",
    hint: "3-тя ос. одн. на -ne: tiskne",
    examples: "začít, vstát, sednout si",
    color: theme.colors.coral,
  },
  {
    key: "III",
    title: "III клас (-uje/-je)",
    hint: "3-тя ос. одн. на -uje: kupuje",
    examples: "pracovat, studovat, dívat se",
    color: theme.colors.mint,
  },
  {
    key: "IV",
    title: "IV клас (-í)",
    hint: "3-тя ос. одн. на -í: prosí, mluví",
    examples: "mluvit, vidět, spát, koupit",
    color: theme.colors.lilac,
  },
  {
    key: "V",
    title: "V клас (-á)",
    hint: "3-тя ос. одн. на -á: dělá",
    examples: "dělat, čekat, hrát, dát",
    color: "#5a9fd4",
  },
  {
    key: "irregular",
    title: "Неправильні / модальні",
    hint: "власна парадигма: být, mít, chtít",
    examples: "být, mít, jít, jet, moci",
    color: "#e0a458",
  },
];

export const VERB_CLASS_BY_KEY: Record<VerbClass, VerbClassMeta> =
  VERB_CLASSES.reduce((acc, c) => {
    acc[c.key] = c;
    return acc;
  }, {} as Record<VerbClass, VerbClassMeta>);
