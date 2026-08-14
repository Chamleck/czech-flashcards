import React from "react";
import { Text, StyleProp, TextStyle, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import { speak, useSpeakingId } from "../utils/useSpeech";

interface Props {
  id: string;
  text: string;
  style?: StyleProp<TextStyle>;
}

// Тапабельний озвучуваний текст. Постійна ознака "можна почути" — пунктирне
// підкреслення (НЕ колір: колір на картках уже означає рід/відмінок/ступінь —
// напр. заголовне слово фарбується за родом, форми в таблиці нейтральні, і т.д.
// Забрати цей сенс заради "колір = посилання" означало б зіпсувати наявну
// граматичну кольорову мову застосунку). Під час самого відтворення текст
// тимчасово підсвічується акцентним кольором — це не конфліктує, бо діє лише
// кілька секунд, поки звучить, а не постійно.
export function Speakable({ id, text, style }: Props) {
  const speakingId = useSpeakingId();
  const active = speakingId === id;

  return (
    <Text
      style={[style, styles.speakable, active && styles.active]}
      onPress={() => speak(text, id)}
      suppressHighlighting
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  speakable: { textDecorationLine: "underline", textDecorationStyle: "dotted" },
  active: { color: theme.colors.mint },
});
