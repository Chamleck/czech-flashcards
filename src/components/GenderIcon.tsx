import React from "react";
import { User, Box, Flower2, Circle } from "lucide-react-native";
import { Gender } from "../types";
import { theme } from "../utils/theme";

// Іконка роду (Lucide — однаковий вигляд на всіх пристроях, на відміну від емодзі).
// Рід також кодується кольором (theme.genderColor), іконка це дублює візуально.
const ICON: Record<Gender, typeof User> = {
  masc_anim: User, // чол. істота — людина
  masc_inan: Box, // чол. неістота — предмет
  fem: Flower2, // жін. рід
  neut: Circle, // сер. рід — нейтральна форма
};

export function GenderIcon({ gender, size = 18 }: { gender: Gender; size?: number }) {
  const Cmp = ICON[gender];
  return <Cmp size={size} color={theme.genderColor[gender]} strokeWidth={2.4} />;
}
