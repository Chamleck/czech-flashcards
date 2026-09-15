import React, { useLayoutEffect } from "react";
import { Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { PRONOUNS } from "../data/pronouns";
import { PRONOUN_GROUP_TITLE } from "../data/groupTitles";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "PronounSelection">;

export function PronounSelectionScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: PRONOUN_GROUP_TITLE,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation]);

  return (
    <SelectionList
      words={PRONOUNS}
      renderExtra={(w) => (
        <Text style={styles.subtypeTag}>{w.subtype === "demonstrative" ? "вказівний" : "присвійний"}</Text>
      )}
      onStart={(ids) =>
        navigation.navigate("DeclSession", { title: PRONOUN_GROUP_TITLE, kind: "pronoun", entryIds: ids })
      }
    />
  );
}

const styles = StyleSheet.create({
  subtypeTag: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "700" },
});
