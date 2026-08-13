import React, { useLayoutEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { browseSource, browseEntries, BrowseListItem } from "../utils/browseData";

type Props = NativeStackScreenProps<RootStackParamList, "BrowseList">;

// Список слів для перегляду: ті самі рядки, що в екранах вибору, але БЕЗ чекбоксів
// і БЕЗ ✏️. Тап по рядку відкриває картку цього слова (BrowseCard) з можливістю
// свайпати між сусідніми словами у тому ж порядку.
export function BrowseListScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { kind, entryIds, title } = route.params;

  const items = useMemo(
    () => browseEntries(browseSource(kind), entryIds) as BrowseListItem[],
    [kind, entryIds]
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  function open(index: number) {
    navigation.navigate("BrowseCard", { kind, entryIds, initialIndex: index, title });
  }

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space(6) }]}
    >
      <Text style={styles.hint}>Торкніться слова, щоб відкрити картку. У картці гортайте вліво/вправо.</Text>
      {items.map((w, i) => (
        <Pressable key={w.id} style={styles.row} onPress={() => open(i)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.uk}>{w.uk}</Text>
            <Text style={styles.cz}>{w.cz}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4) },
  hint: { color: theme.colors.textDim, fontSize: 13, lineHeight: 19, marginBottom: theme.space(3) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    marginBottom: theme.space(2.5),
  },
  uk: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  cz: { color: theme.colors.lilac, fontSize: 14, fontWeight: "700", marginTop: 1 },
  chevron: { color: theme.colors.textFaint, fontSize: 26, fontWeight: "700" },
});
