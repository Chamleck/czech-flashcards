import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Home, Search } from "lucide-react-native";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";

// Навмисно вузький тип — беремо лише ті два методи, які реально викликаємо.
// Повний NativeStackNavigationProp<RootStackParamList, "X"> для КОНКРЕТНОГО
// екрана X не підходить тут, бо цей компонент спільний для багатьох різних
// екранів з різними param-типами (TS contravariance на setParams не дає їх
// уніфікувати одним конкретним RouteName). Ця вузька структурна форма
// підходить для navigation-об'єкта БУДЬ-ЯКого екрана без кастів.
type Nav = {
  popToTop(): void;
  reset(state: { index: number; routes: { name: keyof RootStackParamList; params?: object }[] }): void;
};

// Home і Search — дві навігаційні дії в headerRight, поруч. За принципом
// консистентності (елементи одного рівня в одному контексті — однакове
// трактування) обидві мають ІДЕНТИЧНИЙ вигляд: колір lilac (уже усталений
// колір навігації в застосунку — стрілка «← Назад» скрізь lilac), однакова
// фонова пілюля (bgElevated) для візуальної ваги й рівного touch-таргета,
// однаковий розмір іконки. Раніше Home був голий text-колір без фону, а Search
// — honey з пілюлею; це створювало дисонанс між двома рівноправними кнопками.
const ICON_SIZE = 19;
const ICON_STROKE = 2.2;

export function HomeHeaderButton({ navigation }: { navigation: Nav }) {
  return (
    <Pressable onPress={() => navigation.popToTop()} hitSlop={10} style={styles.pill} accessibilityLabel="На головну">
      <Home size={ICON_SIZE} color={theme.colors.lilac} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
}

// Скидає стек до Home→WordsPartOfSpeech(focusSearch) — той самий виклик, що
// раніше жив окремо в BrowseListScreen і BrowseCardScreen; тепер в одному місці.
export function SearchHeaderButton({ navigation }: { navigation: Nav }) {
  return (
    <Pressable
      onPress={() =>
        navigation.reset({
          index: 1,
          routes: [{ name: "Home" }, { name: "WordsPartOfSpeech", params: { focusSearch: true } }],
        })
      }
      hitSlop={10}
      style={styles.pill}
      accessibilityLabel="Пошук"
    >
      <Search size={ICON_SIZE} color={theme.colors.lilac} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
});
