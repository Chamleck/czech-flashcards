import React, { useLayoutEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { VERBS } from "../data/verbs";
import { VERB_CLASS_BY_KEY } from "../data/verbCategories";

type Props = NativeStackScreenProps<RootStackParamList, "VerbSelection">;

export function VerbSelectionScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { verbClass } = route.params;
  const meta = VERB_CLASS_BY_KEY[verbClass];

  const verbs = useMemo(() => VERBS.filter((v) => v.verbClass === verbClass), [verbClass]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(verbs.map((v) => v.id)));

  useLayoutEffect(() => {
    navigation.setOptions({ title: meta.title });
  }, [navigation, meta]);

  const allSelected = selected.size === verbs.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(verbs.map((v) => v.id)));
  }

  function start() {
    if (selected.size === 0) return;
    const ids = verbs.filter((v) => selected.has(v.id)).map((v) => v.id);
    navigation.navigate("VerbSession", { title: meta.title, entryIds: ids });
  }

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: theme.space(3) }]}>
        <Pressable style={styles.selectAllRow} onPress={toggleAll}>
          <Text style={styles.selectAllText}>{allSelected ? "Зняти всі" : "Обрати всі"}</Text>
          <Text style={styles.selectAllCount}>{selected.size} / {verbs.length}</Text>
        </Pressable>

        {verbs.map((v) => {
          const on = selected.has(v.id);
          const infinitive = v.reflexive ? `${v.cz} ${v.reflexive}` : v.cz;
          const aspectMark = v.aspect === "perfective" ? "док." : "недок.";
          return (
            <Pressable key={v.id} style={styles.wordRow} onPress={() => toggle(v.id)}>
              <View style={[styles.checkbox, on && { backgroundColor: theme.colors.mint, borderColor: theme.colors.mint }]}>
                {on && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.wordUk}>{v.uk}</Text>
                <Text style={[styles.wordCz, { color: meta.color }]}>{infinitive}</Text>
              </View>
              <Text style={styles.aspect}>{aspectMark}</Text>
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
          <Text style={[styles.startText, selected.size === 0 && styles.startTextDisabled]}>
            {selected.size === 0 ? "Оберіть дієслова" : `Почати (${selected.size}) ▶️`}
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
  wordCz: { fontSize: 14, fontWeight: "700", marginTop: 1 },
  aspect: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600" },
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
  startTextDisabled: { color: theme.colors.textFaint },
});
