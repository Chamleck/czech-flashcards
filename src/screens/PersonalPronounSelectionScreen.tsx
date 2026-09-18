import React, { useLayoutEffect } from "react";
import { Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { PERSONAL_GROUP_TITLE } from "../data/groupTitles";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "PersonalPronounSelection">;

export function PersonalPronounSelectionScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: PERSONAL_GROUP_TITLE,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation]);

  return (
    <SelectionList
      words={PERSONAL_PRONOUNS}
      renderExtra={(w) => <Text style={styles.subtypeTag}>{w.gendered ? "за родом" : "особовий"}</Text>}
      onStart={(ids) =>
        navigation.navigate("DeclSession", { title: PERSONAL_GROUP_TITLE, kind: "personal", entryIds: ids })
      }
    />
  );
}

const styles = StyleSheet.create({
  subtypeTag: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "700" },
});
