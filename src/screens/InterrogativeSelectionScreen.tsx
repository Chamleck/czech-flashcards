import React, { useLayoutEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { INTERROGATIVE_ALL } from "../data/interrogativePronouns";
import { INTERROGATIVE_GROUP_TITLE } from "../data/groupTitles";
import { HomeHeaderButton } from "../components/HeaderIcons";
import { SelectionList } from "../components/SelectionList";

type Props = NativeStackScreenProps<RootStackParamList, "InterrogativeSelection">;

export function InterrogativeSelectionScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: INTERROGATIVE_GROUP_TITLE,
      headerRight: () => <HomeHeaderButton navigation={navigation} />,
    });
  }, [navigation]);

  return (
    <SelectionList
      words={INTERROGATIVE_ALL}
      onStart={(ids) =>
        navigation.navigate("DeclSession", { title: INTERROGATIVE_GROUP_TITLE, kind: "interrogative", entryIds: ids })
      }
    />
  );
}
