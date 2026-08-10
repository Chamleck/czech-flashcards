import React from "react";
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from "react-native";
import { theme } from "../utils/theme";

// Спільний перемикач-таби (segment). Раніше логіка табів була продубльована
// в AdjPronounCard (рід, ступінь) і VerbConjugation (час). Тепер один компонент:
// той самий контейнер, поведінка активного стану й стилі. Використовується для
// табів роду (прикметники / займенники / особові), ступеня порівняння та часу.
interface Props<T extends string> {
  options: readonly T[];
  active: T;
  onSelect: (value: T) => void;
  // Колір активного табу для конкретного значення (рід → колір роду тощо).
  colorFor: (value: T) => string;
  labelFor: (value: T) => string;
  // Необовʼязкова іконка ліворуч від підпису (напр. GenderIcon). activeDark —
  // чи активний таб (щоб іконка фарбувалась у темний на залитому фоні).
  iconFor?: (value: T, active: boolean) => React.ReactNode;
  // Мінімальна ширина табу: 4 таби роду вужчі (76), 3 таби ступеня/часу — 90.
  minWidth?: number;
  flexBasis?: string;
  style?: StyleProp<ViewStyle>;
}

export function SegmentTabs<T extends string>({
  options,
  active,
  onSelect,
  colorFor,
  labelFor,
  iconFor,
  minWidth = 76,
  flexBasis = "22%",
  style,
}: Props<T>) {
  return (
    <View style={[styles.segment, style]}>
      {options.map((opt) => {
        const on = opt === active;
        return (
          <Pressable
            key={opt}
            style={[
              styles.segBtn,
              { minWidth, flexBasis: flexBasis as ViewStyle["flexBasis"] },
              on && { backgroundColor: colorFor(opt) },
            ]}
            onPress={() => onSelect(opt)}
          >
            {iconFor?.(opt, on)}
            <Text style={[styles.segText, on && styles.segTextActive]}>{labelFor(opt)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: 3,
    marginBottom: theme.space(3),
  },
  segBtn: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: theme.space(2),
    borderRadius: theme.radius.sm,
  },
  segText: { color: theme.colors.textDim, fontSize: 12, fontWeight: "700" },
  segTextActive: { color: "#1a1020" },
});
