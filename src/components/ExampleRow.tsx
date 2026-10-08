import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import { Speakable } from "./Speakable";
import { TileEmoji } from "./TileEmoji";

// Рядок прикладу під словом: чеське речення (озвучується) + переклад. Спільний для карток слів.
export function ExampleRow({ id, cz, uk }: { id: string; cz: string; uk: string }) {
  return (
    <View style={styles.example}>
      <View style={styles.exampleRow}>
        <TileEmoji name="speechBalloon" size={15} style={{ marginTop: 2 }} />
        <Speakable id={id} text={cz} style={styles.exampleCz} />
      </View>
      <Text style={styles.exampleUk}>{uk}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  example: {
    marginTop: theme.space(2),
    marginBottom: theme.space(1),
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
  },
  exampleRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  exampleCz: { color: theme.colors.text, fontSize: 15, fontWeight: "600", flex: 1 },
  exampleUk: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
});
