import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";

export function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.line} />
      <Text style={styles.text}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    marginTop: theme.space(2),
    marginBottom: theme.space(3),
  },
  line: { flex: 1, height: 1, backgroundColor: theme.colors.bgElevated },
  text: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
