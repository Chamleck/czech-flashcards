import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { HomeScreen, Screen } from "./src/screens/HomeScreen";
import { WordModeScreen } from "./src/screens/WordModeScreen";
import { GrammarScreen } from "./src/screens/GrammarScreen";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <>
      <StatusBar style="light" />
      {screen === "home" && <HomeScreen onOpen={setScreen} />}
      {screen === "words" && <WordModeScreen onBack={() => setScreen("home")} />}
      {screen === "grammar" && <GrammarScreen onBack={() => setScreen("home")} />}
    </>
  );
}
