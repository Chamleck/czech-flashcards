import React, { useLayoutEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { theme } from "../utils/theme";
import { PERSONAL_PRONOUNS } from "../data/personalPronouns";
import { PERSONAL_GROUP_TITLE } from "../data/groupTitles";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";
import { SubtypeTag } from "../components/SubtypeTag";

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
      renderExtra={(w) => <SubtypeTag>{w.gendered ? "за родом" : "особовий"}</SubtypeTag>}
      onStart={(ids) =>
        navigation.navigate("DeclSession", { title: PERSONAL_GROUP_TITLE, kind: "personal", entryIds: ids })
      }
    />
  );
}
