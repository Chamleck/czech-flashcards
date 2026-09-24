import React from "react";
import { View, Text, StyleSheet, StyleProp, TextStyle } from "react-native";
import { theme } from "../utils/theme";
import Info from "lucide-react-native/icons/info";

interface Props {
  // Один або кілька абзаців. 2+ рендеряться в ОДНОМУ боксі під одним "Важливо",
  // розділені тонким inset-роздільником — замість кількох окремих банерів
  // поспіль (це розмиває важливість і плутає, а не допомагає — стандартна
  // рекомендація для callout-компонентів).
  paragraphs: React.ReactNode[];
  // Опційне перевизначення розміру шрифту для контексту читання (напр.
  // GrammarTopicScreen — більший кегль, ніж у компактних картках слів).
  textStyle?: StyleProp<TextStyle>;
}

export function InfoBanner({ paragraphs, textStyle }: Props) {
  // Захист на майбутнє: жоден із поточних 8 викликів не передає порожній
  // масив (усі або обгорнуті умовою, або завжди мають хоча б 1 елемент), але
  // якщо колись новий виклик забуде guard — краще нічого не намалювати, ніж
  // порожня рамка "Важливо" без жодного тексту під нею.
  if (paragraphs.length === 0) return null;

  return (
    <View style={styles.box}>
      <View style={styles.labelRow}>
        <Info size={13} color={theme.colors.honey} strokeWidth={2.5} />
        <Text style={styles.labelText}>Важливо</Text>
      </View>
      {paragraphs.map((p, i) => (
        <View key={i} style={i > 0 ? styles.divider : undefined}>
          <Text style={[styles.text, textStyle]}>{p}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    marginBottom: theme.space(3),
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: theme.space(1.5) },
  labelText: { color: theme.colors.honey, fontSize: 12, fontWeight: "600" },
  text: { color: theme.colors.text, fontSize: 13, lineHeight: 19 },
  divider: {
    marginTop: theme.space(2),
    paddingTop: theme.space(2),
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
});
