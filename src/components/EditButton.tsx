import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { PencilSimpleIcon } from "phosphor-react-native";
import { theme } from "../utils/theme";

// Кнопка «редагувати вибір слів» (✏️) — спільна для всіх Category/Groups-екранів.
// Раніше стиль розходився: частина екранів мала lucide Pencil у власному
// контейнері, частина — emoji ✏️, одна ще й з окремим divider-обрамленням.
// Тепер один компонент, один вигляд скрізь.
export function EditButton({ onPress, accessibilityLabel = "Редагувати вибір слів" }: { onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable style={styles.btn} hitSlop={8} onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <PencilSimpleIcon size={20} color={theme.colors.lilac} weight="bold" />
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
