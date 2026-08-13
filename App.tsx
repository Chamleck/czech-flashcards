import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "./src/types";
import { theme } from "./src/utils/theme";
import { HomeScreen } from "./src/screens/HomeScreen";
import { TTSPrototypeScreen } from "./src/screens/TTSPrototypeScreen";
import { WordsPartOfSpeechScreen } from "./src/screens/WordsPartOfSpeechScreen";
import { WordCategoriesScreen } from "./src/screens/WordCategoriesScreen";
import { WordSelectionScreen } from "./src/screens/WordSelectionScreen";
import { WordSessionScreen } from "./src/screens/WordSessionScreen";
import { VerbCategoriesScreen } from "./src/screens/VerbCategoriesScreen";
import { VerbSelectionScreen } from "./src/screens/VerbSelectionScreen";
import { VerbSessionScreen } from "./src/screens/VerbSessionScreen";
import { AdjectiveCategoriesScreen } from "./src/screens/AdjectiveCategoriesScreen";
import { AdjectiveSelectionScreen } from "./src/screens/AdjectiveSelectionScreen";
import { PronounGroupsScreen } from "./src/screens/PronounGroupsScreen";
import { PronounSelectionScreen } from "./src/screens/PronounSelectionScreen";
import { PersonalPronounSelectionScreen } from "./src/screens/PersonalPronounSelectionScreen";
import { DeclSessionScreen } from "./src/screens/DeclSessionScreen";
import { BrowseListScreen } from "./src/screens/BrowseListScreen";
import { BrowseCardScreen } from "./src/screens/BrowseCardScreen";
import { GrammarCategoriesScreen } from "./src/screens/GrammarCategoriesScreen";
import { GrammarTopicScreen } from "./src/screens/GrammarTopicScreen";
import { FlashcardsCategoriesScreen } from "./src/screens/FlashcardsCategoriesScreen";
import { FlashcardsQuizScreen } from "./src/screens/FlashcardsQuizScreen";

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
          <Stack.Screen name="TTSPrototype" component={TTSPrototypeScreen} options={{ title: "🔊 Тест голосу" }} />
          <Stack.Screen name="WordsPartOfSpeech" component={WordsPartOfSpeechScreen} options={{ title: "Слова" }} />
          <Stack.Screen name="WordCategories" component={WordCategoriesScreen} options={{ title: "Іменники" }} />
          <Stack.Screen name="WordSelection" component={WordSelectionScreen} options={{ title: "Вибір слів" }} />
          <Stack.Screen name="WordSession" component={WordSessionScreen} options={{ title: "" }} />
          <Stack.Screen name="VerbCategories" component={VerbCategoriesScreen} options={{ title: "Дієслова" }} />
          <Stack.Screen name="VerbSelection" component={VerbSelectionScreen} options={{ title: "Вибір дієслів" }} />
          <Stack.Screen name="VerbSession" component={VerbSessionScreen} options={{ title: "" }} />
          <Stack.Screen name="AdjectiveCategories" component={AdjectiveCategoriesScreen} options={{ title: "Прикметники" }} />
          <Stack.Screen name="AdjectiveSelection" component={AdjectiveSelectionScreen} options={{ title: "Вибір слів" }} />
          <Stack.Screen name="PronounGroups" component={PronounGroupsScreen} options={{ title: "Займенники" }} />
          <Stack.Screen name="PronounSelection" component={PronounSelectionScreen} options={{ title: "Вибір слів" }} />
          <Stack.Screen name="PersonalPronounSelection" component={PersonalPronounSelectionScreen} options={{ title: "Вибір слів" }} />
          <Stack.Screen name="DeclSession" component={DeclSessionScreen} options={{ title: "" }} />
          <Stack.Screen name="BrowseList" component={BrowseListScreen} options={{ title: "" }} />
          <Stack.Screen name="BrowseCard" component={BrowseCardScreen} options={{ title: "" }} />
          <Stack.Screen name="GrammarCategories" component={GrammarCategoriesScreen} options={{ title: "Граматика" }} />
          <Stack.Screen name="GrammarTopic" component={GrammarTopicScreen} options={{ title: "" }} />
          <Stack.Screen name="FlashcardsCategories" component={FlashcardsCategoriesScreen} options={{ title: "Флеш-картки" }} />
          <Stack.Screen name="FlashcardsQuiz" component={FlashcardsQuizScreen} options={{ title: "" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
