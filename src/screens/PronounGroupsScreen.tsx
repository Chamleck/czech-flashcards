import React, { useCallback, useState } from "react";
import { Text, StyleSheet, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { EditButton } from "../components/EditButton";
import { MistakeDeckCard } from "../components/MistakeDeckCard";
import { PosEmoji } from "../components/PosEmoji";
import { PRONOUNS } from "../data/pronouns";
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { PRONOUN_GROUP_TITLE, PERSONAL_GROUP_TITLE } from "../data/groupTitles";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";
import { ALL_PRONOUN_MIXED_IDS } from "../utils/pronounEntries";
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
      // Розділ "Займенники" консолідований в ОДНЕ сховище PROGRESS_KEYS.pronouns
      // (Особові+Присвійні+Питальні). Один load, помилки всіх трьох груп уже
      // разом — раніше були три окремі ключі + ручний merge, що спричиняло
      // пропущені помилки (позначив "не знаю" в одній групі — не з'являлось
      // у "Повторити помилки", бо рахувалось інше сховище).
      loadProgressFrom(PROGRESS_KEYS.pronouns).then((p) => {
        if (!alive) return;
        const all = new Set(getMistakeIds(p));
        setMistakeIds(new Set([...all].filter((id) => ALL_PRONOUN_MIXED_IDS.includes(id))));
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const mistakeCount = mistakeIds.size;

  function startMistakes() {
    const ids = ALL_PRONOUN_MIXED_IDS.filter((id) => mistakeIds.has(id));
    if (ids.length === 0) return;
    navigation.navigate("DeclSession", { title: "Повторити помилки", kind: "pronoun-mixed", entryIds: ids });
  }

  // Тап по групі: тренування — сесія; перегляд — список слів групи.
  function openAll() {
    const ids = PRONOUNS.map((p) => p.id);
    if (mode === "browse") navigation.navigate("BrowseList", { kind: "pronouns", entryIds: ids, title: PRONOUN_GROUP_TITLE });
    else navigation.navigate("DeclSession", { title: PRONOUN_GROUP_TITLE, kind: "pronoun", entryIds: ids });
  }

  function openPersonal() {
    const ids = PERSONAL_PRONOUNS.map((p) => p.id);
    if (mode === "browse") navigation.navigate("BrowseList", { kind: "pronouns", entryIds: ids, title: PERSONAL_GROUP_TITLE });
    else navigation.navigate("DeclSession", { title: PERSONAL_GROUP_TITLE, kind: "personal", entryIds: ids });
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <ModeToggle mode={mode} onChange={setMode} />

      {mode === "train" && (
        <MistakeDeckCard count={mistakeCount} wordForms={["слово", "слова", "слів"]} onPress={startMistakes} />
      )}

      {/* Особові — активна група */}
      <View style={styles.catRow}>
        <Pressable style={styles.catMain} onPress={openPersonal}>
          <PosEmoji name="raisingHand" size={26} />
          <View style={{ flex: 1 }}>
            <Text style={styles.catTitle}>Особові</Text>
            <Text style={styles.catHint}>já, ty, on, ona, my, vy, oni, se — довгі/короткі форми</Text>
            <Text style={styles.catSub}>
              {PERSONAL_PRONOUNS.length} {plural(PERSONAL_PRONOUNS.length, "слово", "слова", "слів")}
            </Text>
          </View>
        </Pressable>
        {mode === "train" && (
                      <EditButton onPress={() => navigation.navigate("PersonalPronounSelection")} />
        )}
      </View>

      {/* Присвійні та вказівні — активна група */}
      <View style={styles.catRow}>
        <Pressable style={styles.catMain} onPress={openAll}>
          <PosEmoji name="pointing" size={26} />
          <View style={{ flex: 1 }}>
            <Text style={styles.catTitle}>Присвійні та вказівні</Text>
            <Text style={styles.catHint}>můj, tvůj, náš, její, jeho, ten…</Text>
            <Text style={styles.catSub}>{PRONOUNS.length} {plural(PRONOUNS.length, "слово", "слова", "слів")}</Text>
          </View>
        </Pressable>
        {mode === "train" && (
                      <EditButton onPress={() => navigation.navigate("PronounSelection")} />
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    marginBottom: theme.space(3),
  },
  catMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    padding: theme.space(4),
  },
  catTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  catHint: { color: theme.colors.textFaint, fontSize: 12, marginTop: 1 },
  catSub: { color: theme.colors.textDim, fontSize: 13, marginTop: 3 },
});
