import React, { useCallback, useState } from "react";
import { Text, StyleSheet, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CardProgress, CzechCase, CASE_LABELS } from "../types";
import { theme } from "../utils/theme";
import { PREPOSITIONS } from "../data/prepositions";
import { plural } from "../utils/plural";
import { ModeToggle, BrowseMode } from "../components/ModeToggle";
import { loadProgressFrom, getMistakeIds, PROGRESS_KEYS } from "../utils/progress";

type Props = NativeStackScreenProps<RootStackParamList, "Prepositions">;

// Розділ "Прийменники". Ця фаза — лише фіксовані (керують одним відмінком),
// згруповані за відмінком. Дуальні (na/v/pod/nad/před/za/mezi) додамо наступною
// фазою окремою групою. Прогрес усіх прийменників — одне спільне сховище
// PROGRESS_KEYS.prepositions (як "Числівники" мають один store на розділ).

const ALL_PREP_IDS = PREPOSITIONS.map((p) => p.id);

// Порядок груп за відмінком (fixed-прийменники цієї фази покривають 5 відмінків).
const GROUP_CASES: CzechCase[] = ["genitiv", "dativ", "akuzativ", "lokal", "instrumental"];

interface Group {
  gCase: CzechCase;
  ids: string[];
}

const GROUPS: Group[] = GROUP_CASES.map((c) => ({
  gCase: c,
  ids: PREPOSITIONS.filter((p) => p.govCase === c).map((p) => p.id),
})).filter((g) => g.ids.length > 0);

const CASE_COLOR: Record<CzechCase, string> = {
  nominativ: theme.colors.honey,
  genitiv: theme.colors.mint,
  dativ: theme.colors.lilac,
  akuzativ: theme.colors.coral,
  vokativ: theme.colors.honey,
  lokal: "#7fb8e0",
  instrumental: "#e0a458",
};

// Іконка групи — номер відмінка (той самий "число." з CASE_LABELS), а не
// довільна картинка: одразу видно, який відмінок, а не просто "щось спільне".
const CASE_EMOJI: Record<CzechCase, string> = {
  nominativ: "1️⃣",
  genitiv: "2️⃣",
  dativ: "3️⃣",
  akuzativ: "4️⃣",
  vokativ: "5️⃣",
  lokal: "6️⃣",
  instrumental: "7️⃣",
};

export function PrepositionsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<BrowseMode>("browse");
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadProgressFrom(PROGRESS_KEYS.prepositions).then((p: Record<string, CardProgress>) => {
        if (!alive) return;
        const all = getMistakeIds(p);
        setMistakeIds(new Set([...all].filter((id) => ALL_PREP_IDS.includes(id))));
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const mistakeCount = mistakeIds.size;

  function startMistakes() {
    const ids = ALL_PREP_IDS.filter((id) => mistakeIds.has(id));
    if (ids.length === 0) return;
    navigation.navigate("PrepositionSession", { title: "Повторити помилки", entryIds: ids });
  }

  function openGroup(g: Group) {
    const lbl = CASE_LABELS[g.gCase];
    const title = `${lbl.uk} (${lbl.cz})`;
    if (mode === "browse") {
      navigation.navigate("BrowseList", { kind: "prepositions", entryIds: g.ids, title });
    } else {
      navigation.navigate("PrepositionSession", { title, entryIds: g.ids });
    }
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

      {GROUPS.map((g) => {
        const lbl = CASE_LABELS[g.gCase];
        const color = CASE_COLOR[g.gCase];
        return (
          <Pressable
            key={g.gCase}
            style={[styles.row, { borderLeftColor: color }]}
            onPress={() => openGroup(g)}
          >
            <Text style={styles.emoji}>{CASE_EMOJI[g.gCase]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {lbl.uk} ({lbl.cz})
              </Text>
              <Text style={styles.hint}>{lbl.question}</Text>
              <Text style={styles.sub}>
                {g.ids.length} {plural(g.ids.length, "прийменник", "прийменники", "прийменників")}
              </Text>
            </View>
          </Pressable>
        );
      })}
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
    marginBottom: theme.space(3),
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,
    padding: theme.space(4),
    marginBottom: theme.space(3),
  },
  emoji: { fontSize: 32 },
  title: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
  hint: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  sub: { color: theme.colors.textFaint, fontSize: 12, marginTop: 4 },
});
