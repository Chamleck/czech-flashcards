import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import Pencil from "lucide-react-native/icons/pencil";
import { theme } from "../utils/theme";

// Кнопка «редагувати вибір слів» (✏️) — спільна для всіх Category/Groups-екранів.
// Раніше стиль розходився: частина екранів мала lucide Pencil у власному
// контейнері, частина — emoji ✏️, одна ще й з окремим divider-обрамленням.
// Тепер один компонент, один вигляд скрізь.
//
// Раніше іконка була "гола" (без фону) — незрозуміло, що це кнопка, на
// відміну від Home/Search у HeaderIcons.tsx, які вже мають пілюлю
// (bgElevated) під іконкою. Тепер той самий принцип тут: пілюля 34×34
// (не 32, як у Home/Search — Pencil сам по собі 20px, більший за їхні
// 19px, тож пілюля пропорційно більша, щоб зберегти те саме співвідношення
// іконка/пілюля ≈0.59, як у HeaderIcons.tsx). Зовнішній padding (16 з
// кожного боку) лишився ЯК БУВ — саме він, а не розмір пілюлі, тримає
// відступ від правого краю catRow (округлення кута там 16px — запас
// достатній, пілюля його не зачіпає).
export function EditButton({ onPress, accessibilityLabel = "Редагувати вибір слів" }: { onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable style={styles.wrap} hitSlop={8} onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <View style={styles.pill}>
        <Pencil size={20} color={theme.colors.lilac} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(4),
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
});
