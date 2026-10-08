import React from "react";
import { Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";

// Дрібна позначка підтипу слова біля його назви в списках вибору («за родом», «вказівний», «особовий»).
export function SubtypeTag({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtypeTag}>{children}</Text>;
}

const styles = StyleSheet.create({
  subtypeTag: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "700" },
});
