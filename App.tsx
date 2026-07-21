import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "./src/types";
import { theme } from "./src/utils/theme";
import { HomeScreen } from "./src/screens/HomeScreen";
import { WordCategoriesScreen } from "./src/screens/WordCategoriesScreen";
import { WordSelectionScreen } from "./src/screens/WordSelectionScreen";
import { WordSessionScreen } from "./src/screens/WordSessionScreen";
import { GrammarCategoriesScreen } from "./src/screens/GrammarCategoriesScreen";
import { GrammarTopicScreen } from "./src/screens/GrammarTopicScreen";
import { FlashcardsCategoriesScreen } from "./src/screens/FlashcardsCategoriesScreen";
import { FlashcardsQuizScreen } from "./src/screens/FlashcardsQuizScreen";
// Імпорт лише заради побічного ефекту: soundCache.ts сам запускає прогрів звуків
// одразу при завантаженні модуля (ще до першого рендеру App) — див. коментар там.
import "./src/utils/soundCache";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Тема навігації в кольорах застосунку
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.bg,
    card: theme.colors.bg,
    text: theme.colors.text,
    primary: theme.colors.honey,
    border: "transparent",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.bg },
            headerTintColor: theme.colors.lilac,
            headerTitleStyle: { color: theme.colors.text, fontWeight: "800" },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.bg },
            headerBackButtonDisplayMode: "minimal",
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WordCategories" component={WordCategoriesScreen} options={{ title: "Слова" }} />
          <Stack.Screen name="WordSelection" component={WordSelectionScreen} options={{ title: "Вибір слів" }} />
          <Stack.Screen name="WordSession" component={WordSessionScreen} options={{ title: "" }} />
          <Stack.Screen name="GrammarCategories" component={GrammarCategoriesScreen} options={{ title: "Граматика" }} />
          <Stack.Screen name="GrammarTopic" component={GrammarTopicScreen} options={{ title: "" }} />
          <Stack.Screen name="FlashcardsCategories" component={FlashcardsCategoriesScreen} options={{ title: "Флеш-картки" }} />
          <Stack.Screen name="FlashcardsQuiz" component={FlashcardsQuizScreen} options={{ title: "" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
