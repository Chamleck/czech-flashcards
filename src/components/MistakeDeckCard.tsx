import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import { plural } from "../utils/plural";
import RotateCcw from "lucide-react-native/icons/rotate-ccw";

// Плашка "Повторити помилки" — раніше була скопійована дослівно в 8 екранах
// (Слова/Дієслова/Прикметники/Займенники/Прислівники/Числівники/Прийменники/
// Питальні), відрізняючись лише відмінюванням іменника та ціллю навігації.
// Навігація лишається в кожному екрані (різні route-параметри), тут — лише
// сама картка.
interface Props {
  count: number;
  // [однина, кілька, багато] — родовий множини (wordForms[2]) використовується
  // і в plural(), і в порожньому стані ("Поки що немає ЧОГО на повторення"),
  // бо в українській "немає" завжди керує родовим.
  wordForms: [string, string, string];
  onPress: () => void;
}

export function MistakeDeckCard({ count, wordForms, onPress }: Props) {
  const [one, few, many] = wordForms;
  return (
    <Pressable
      style={[styles.card, count === 0 && styles.cardEmpty]}
      onPress={onPress}
      disabled={count === 0}
    >
      <RotateCcw size={26} color={theme.colors.coral} strokeWidth={2.5} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Повторити помилки</Text>
        <Text style={styles.sub}>
          {count === 0 ? `Поки що немає ${many} на повторення` : `${count} ${plural(count, one, few, many)} чекає`}
        </Text>
      </View>
      {count > 0 && <Text style={styles.badge}>{count}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.coral,
    padding: theme.space(4),
  },
  cardEmpty: { opacity: 0.5, borderColor: theme.colors.textFaint },
  title: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
  sub: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  badge: {
    color: "#1a1020",
    backgroundColor: theme.colors.coral,
    fontWeight: "800",
    fontSize: 15,
    minWidth: 30,
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
});
