import { StyleSheet } from "react-native";
import { theme } from "../utils/theme";

// Стилі екранів сесії флеш-карток (рахунок, картка, «Ще повторити» / «Знаю», екран «Готово!»): один дім для всіх
// сесійних екранів (Word / Decl / Verb / Preposition / Adverb). Новий сесійний екран бере їх звідси, а не пише копію.
export const sessionStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { color: theme.colors.textDim, textAlign: "center", marginTop: 40 },
  counter: { color: theme.colors.textDim, fontSize: 15, fontWeight: "700" },
  cardArea: { flex: 1, paddingHorizontal: theme.space(4), paddingTop: theme.space(2) },
  actions: { flexDirection: "row", gap: theme.space(3), padding: theme.space(4) },
  actionBtn: { flex: 1, paddingVertical: theme.space(4), borderRadius: theme.radius.md, alignItems: "center" },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dontKnow: { backgroundColor: theme.colors.coral },
  know: { backgroundColor: theme.colors.mint },
  actionText: { color: "#1a1020", fontWeight: "800", fontSize: 15 },
  doneWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: theme.space(6) },
  doneTitle: { color: theme.colors.text, fontSize: 26, fontWeight: "800", marginTop: 8 },
  doneText: { color: theme.colors.textDim, fontSize: 16, textAlign: "center", marginTop: 12, lineHeight: 24 },
  againBtn: {
    marginTop: theme.space(6),
    backgroundColor: theme.colors.honey,
    paddingVertical: theme.space(3.5),
    paddingHorizontal: theme.space(8),
    borderRadius: theme.radius.md,
  },
  againText: { color: "#3a1f00", fontWeight: "800", fontSize: 16 },
  backHome: { marginTop: theme.space(4) },
  backHomeText: { color: theme.colors.lilac, fontSize: 15, fontWeight: "700" },
});
