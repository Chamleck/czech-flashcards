import React, { useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { PRONOUNS } from "../data/pronouns";

type Props = NativeStackScreenProps<RootStackParamList, "PronounSelection">;

export function PronounSelectionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const words = PRONOUNS;
  const [selected, setSelected] = useState<Set<string>>(() => new Set(words.map((w) => w.id)));

  useLayoutEffect(() => {
    navigation.setOptions({ title: "👉 Присвійні та вказівні" });
  }, [navigation]);

  const allSelected = selected.size === words.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(words.map((w) => w.id)));
  }

  function start() {
    if (selected.size === 0) return;
    const ids = words.filter((w) => selected.has(w.id)).map((w) => w.id);
    navigation.navigate("DeclSession", {
      title: "👉 Присвійні та вказівні",
      kind: "pronoun",
      entryIds: ids,
    });
  }

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: theme.space(3) }]}>
        <Pressable style={styles.selectAllRow} onPress={toggleAll}>
          <Text style={styles.selectAllText}>{allSelected ? "Зняти всі" : "Обрати всі"}</Text>
          <Text style={styles.selectAllCount}>{selected.size} / {words.length}</Text>
        </Pressable>

        {words.map((w) => {
          const on = selected.has(w.id);
          return (
            <Pressable key={w.id} style={styles.wordRow} onPress={() => toggle(w.id)}>
              <View style={[styles.checkbox, on && { backgroundColor: theme.colors.mint, borderColor: theme.colors.mint }]}>
                {on && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.wordUk}>{w.uk}</Text>
                <Text style={styles.wordCz}>{w.cz}</Text>
              </View>
              <Text style={styles.subtypeTag}>
                {w.subtype === "demonstrative" ? "вказівний" : "присвійний"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.space(3) }]}>
        <Pressable
          style={[styles.startBtn, selected.size === 0 && styles.startBtnDisabled]}
          onPress={start}
          disabled={selected.size === 0}
        >
          <Text style={styles.startText}>
            {selected.size === 0 ? "Оберіть слова" : `Почати (${selected.size}) ▶️`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  selectAllRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.space(2),
    paddingHorizontal: theme.space(2),
    marginBottom: theme.space(2),
  },
  selectAllText: { color: theme.colors.lilac, fontSize: 15, fontWeight: "700" },
  selectAllCount: { color: theme.colors.textDim, fontSize: 14, fontWeight: "700" },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    marginBottom: theme.space(2.5),
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.colors.textFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: { color: "#1a1020", fontSize: 16, fontWeight: "900" },
  wordUk: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  wordCz: { color: theme.colors.lilac, fontSize: 14, fontWeight: "700", marginTop: 1 },
  subtypeTag: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "700" },
  footer: {
    paddingHorizontal: theme.space(4),
    paddingTop: theme.space(3),
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  startBtn: {
    backgroundColor: theme.colors.honey,
    paddingVertical: theme.space(4),
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  startBtnDisabled: { backgroundColor: theme.colors.bgElevated },
  startText: { color: "#3a1f00", fontWeight: "800", fontSize: 16 },
});
