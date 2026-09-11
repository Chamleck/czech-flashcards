import React from "react";
import { Text, Pressable, StyleSheet } from "react-native";
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

// Екрани глибиною 3+ пуші від Home отримують цю кнопку в шапці — веде
// СПРАВДІ на Home (popToTop очищає весь стек до кореня), на відміну від
// іконки пошуку нижче, яка веде лише в корінь "Слів". popToTop — той самий
// виклик, що вже безпечно працює на екранах "Готово!" в *SessionScreen;
// тут просто той самий виклик у шапці, доступний одразу, а не лише наприкінці сесії.
export function HomeHeaderButton({ navigation }: { navigation: Nav }) {
  return (
    <Pressable onPress={() => navigation.popToTop()} hitSlop={10} accessibilityLabel="На головну">
      <Text style={styles.homeIcon}>🏠</Text>
    </Pressable>
  );
}

// Скидає стек до Home→WordsPartOfSpeech(focusSearch) — той самий виклик, що
// раніше жив окремо в BrowseListScreen і BrowseCardScreen; тепер в одному
// місці. Пілюля-фон навколо іконки — щоб не губилась у шапці поруч з іншими
// елементами (сама лупа впізнавана, проблема була у видимості, не в змісті).
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
      style={styles.searchPill}
      accessibilityLabel="Пошук"
    >
      <Text style={styles.searchIcon}>🔍</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  homeIcon: { fontSize: 19, color: theme.colors.text },
  searchPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: { fontSize: 16, color: theme.colors.honey },
});
