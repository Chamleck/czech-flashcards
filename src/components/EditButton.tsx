import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Pencil from "lucide-react-native/icons/pencil";
import { theme } from "../utils/theme";

// Кнопка «редагувати вибір слів» (✏️) — спільна для всіх Category/Groups-екранів.
// Раніше стиль розходився: частина екранів мала lucide Pencil у власному
// контейнері, частина — emoji ✏️, одна ще й з окремим divider-обрамленням.
// Тепер один компонент, один вигляд скрізь.
export function EditButton({ onPress, accessibilityLabel = "Редагувати вибір слів" }: { onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable style={styles.btn} hitSlop={8} onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <Pencil size={20} color={theme.colors.lilac} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(4),
    alignItems: "center",
    justifyContent: "center",
  },
});
