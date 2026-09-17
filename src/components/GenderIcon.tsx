import React from "react";
import User from "lucide-react-native/icons/user";
import Box from "lucide-react-native/icons/box";
import Flower2 from "lucide-react-native/icons/flower-2";
import Circle from "lucide-react-native/icons/circle";
import { Gender } from "../types";
import { theme } from "../utils/theme";

// Іконка роду (Lucide — однаковий вигляд на всіх пристроях, на відміну від емодзі).
// Рід також кодується кольором (theme.genderColor), іконка це дублює візуально.
// Deep-import (lucide-react-native/icons/<name>), НЕ named-import з барелю:
// барель реекспортує всі ~1755 іконок і Metro не трясе його — перевірено на
// зібраному бандлі (sourcemap показав 1755 lucide-модулів при named-імпорті
// з барелю). Deep-import резолвиться через exports-map пакета ("./icons/*")
// і підтягує лише файл конкретної іконки. Ніколи не міняй назад на
// `import { X } from "lucide-react-native"`.
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
