import React, { useCallback, useState } from "react";
import { Text, StyleSheet, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress } from "../types";
import { theme } from "../utils/theme";
import { PRONOUNS } from "../data/pronouns";
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";
import { plural } from "../utils/plural";
import { ModeToggle, BrowseMode } from "../components/ModeToggle";

type Props = NativeStackScreenProps<RootStackParamList, "PronounGroups">;

export function PronounGroupsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<BrowseMode>("browse");

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadProgressFrom(PROGRESS_KEYS.pronouns).then((p: Record<string, CardProgress>) => {
        if (alive) setMistakeIds(getMistakeIds(p));
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const mistakeCount = mistakeIds.size;

  function startMistakes() {
    const ids = PRONOUNS.filter((p) => mistakeIds.has(p.id)).map((p) => p.id);
    if (ids.length === 0) return;
    navigation.navigate("DeclSession", { title: "Повторити помилки", kind: "pronoun", entryIds: ids });
  }

  // Тап по групі: тренування — сесія; перегляд — список слів групи.
  function openAll() {
    const ids = PRONOUNS.map((p) => p.id);
    const title = "👉 Присвійні та вказівні";
    if (mode === "browse") navigation.navigate("BrowseList", { kind: "pronouns", entryIds: ids, title });
    else navigation.navigate("DeclSession", { title, kind: "pronoun", entryIds: ids });
  }

  function openPersonal() {
    const ids = PERSONAL_PRONOUNS.map((p) => p.id);
    const title = "🙋 Особові";
    if (mode === "browse") navigation.navigate("BrowseList", { kind: "personal", entryIds: ids, title });
    else navigation.navigate("DeclSession", { title, kind: "personal", entryIds: ids });
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <ModeToggle mode={mode} onChange={setMode} />

      {mode === "train" && (
        <Pressable
          style={[styles.mistakeCard, mistakeCount === 0 && styles.mistakeCardEmpty]}
          onPress={startMistakes}
          disabled={mistakeCount === 0}
        >
          <Text style={styles.mistakeEmoji}>🔁</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.mistakeTitle}>Повторити помилки</Text>
            <Text style={styles.mistakeSub}>
              {mistakeCount === 0
                ? "Поки що немає слів на повторення"
                : `${mistakeCount} ${plural(mistakeCount, "слово", "слова", "слів")} чекає`}
            </Text>
          </View>
          {mistakeCount > 0 && <Text style={styles.mistakeBadge}>{mistakeCount}</Text>}
        </Pressable>
      )}

      <Text style={styles.sectionLabel}>Групи</Text>

      {/* Особові — активна група */}
      <View style={[styles.catRow, { borderLeftColor: theme.colors.mint }]}>
        <Pressable style={styles.catMain} onPress={openPersonal}>
          <Text style={styles.catEmoji}>🙋</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.catTitle}>Особові</Text>
            <Text style={styles.catHint}>já, ty, on, ona, my, vy, oni, se — довгі/короткі форми</Text>
            <Text style={styles.catSub}>
              {PERSONAL_PRONOUNS.length} {plural(PERSONAL_PRONOUNS.length, "слово", "слова", "слів")}
            </Text>
          </View>
        </Pressable>
        {mode === "train" && (
          <Pressable
            style={styles.editBtn}
            hitSlop={8}
            onPress={() => navigation.navigate("PersonalPronounSelection")}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </Pressable>
        )}
      </View>

      {/* Присвійні та вказівні — активна група */}
      <View style={[styles.catRow, { borderLeftColor: theme.colors.lilac }]}>
        <Pressable style={styles.catMain} onPress={openAll}>
          <Text style={styles.catEmoji}>👉</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.catTitle}>Присвійні та вказівні</Text>
            <Text style={styles.catHint}>můj, tvůj, náš, její, jeho, ten…</Text>
            <Text style={styles.catSub}>{PRONOUNS.length} {plural(PRONOUNS.length, "слово", "слова", "слів")}</Text>
          </View>
        </Pressable>
        {mode === "train" && (
          <Pressable
            style={styles.editBtn}
            hitSlop={8}
            onPress={() => navigation.navigate("PronounSelection")}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  mistakeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.coral,
    padding: theme.space(4),
  },
  mistakeCardEmpty: { opacity: 0.5, borderColor: theme.colors.textFaint },
  mistakeEmoji: { fontSize: 28 },
  mistakeTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
  mistakeSub: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  mistakeBadge: {
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
  sectionLabel: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: theme.space(6),
    marginBottom: theme.space(3),
    marginLeft: theme.space(1),
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    marginBottom: theme.space(3),
  },
  catRowDim: { opacity: 0.5 },
  catMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    padding: theme.space(4),
  },
  catEmoji: { fontSize: 26 },
  catTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  catHint: { color: theme.colors.textFaint, fontSize: 12, marginTop: 1 },
  catSub: { color: theme.colors.textDim, fontSize: 13, marginTop: 3 },
  lock: { fontSize: 16, paddingHorizontal: theme.space(4) },
  editBtn: {
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(4),
    alignSelf: "stretch",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.06)",
  },
  editIcon: { fontSize: 18 },
});
