import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { GRAMMAR_TOPICS } from "../data/grammar";

type Props = NativeStackScreenProps<RootStackParamList, "GrammarCategories">;

export function GrammarCategoriesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <Text style={styles.intro}>
        Правила чеської мови за темами. Почни з родів і відмінків — це основа для всього іменного
        відмінювання.
      </Text>

      {GRAMMAR_TOPICS.map((t) => (
        <Pressable
          key={t.id}
          style={[styles.row, !t.ready && styles.rowDim]}
          onPress={() => t.ready && navigation.navigate("GrammarTopic", { topicId: t.id })}
        >
          <Text style={styles.emoji}>{t.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.sub}>{t.subtitle}</Text>
          </View>
          <Text style={styles.chevron}>{t.ready ? "›" : "🔒"}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  intro: { color: theme.colors.textDim, fontSize: 14, lineHeight: 20, marginBottom: theme.space(4) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: theme.space(4),
    marginBottom: theme.space(3),
  },
  rowDim: { opacity: 0.45 },
  emoji: { fontSize: 26, width: 32, textAlign: "center" },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  sub: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  chevron: { color: theme.colors.textFaint, fontSize: 24, fontWeight: "300" },
});
