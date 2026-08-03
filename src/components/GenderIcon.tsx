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

export function GenderIcon({
  gender,
  size = 18,
  activeDark = false,
}: {
  gender: Gender;
  size?: number;
  activeDark?: boolean;
}) {
  const Cmp = ICON[gender];
  // На активному табі фон залито кольором роду — фарбуємо іконку в темний,
  // щоб вона не зливалася з фоном (інакше однаковий колір → іконка зникає).
  const color = activeDark ? "#1a1020" : theme.genderColor[gender];
  return <Cmp size={size} color={color} strokeWidth={2.4} />;
}
