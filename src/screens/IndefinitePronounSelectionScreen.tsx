import React, { useLayoutEffect } from "react";
import { Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { INDEFINITE_ALL, INDEFINITE_TAG } from "../data/indefinitePronouns";
import { INDEFINITE_GROUP_TITLE } from "../data/groupTitles";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "IndefinitePronounSelection">;

export function IndefinitePronounSelectionScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: INDEFINITE_GROUP_TITLE,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation]);

  return (
    <SelectionList
      words={INDEFINITE_ALL}
      renderExtra={(w) => <Text style={styles.subtypeTag}>{INDEFINITE_TAG[w.id] ?? ""}</Text>}
      onStart={(ids) =>
        navigation.navigate("DeclSession", { title: INDEFINITE_GROUP_TITLE, kind: "pronoun-mixed", entryIds: ids })
      }
    />
  );
}

const styles = StyleSheet.create({
  subtypeTag: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "700" },
});
