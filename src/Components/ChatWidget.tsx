import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { askAgent } from "../services/agent";
import { loadAgentContext } from "../storage/agentContext";
import { getProfile } from "../storage/profile"; // your existing profile storage

type Msg = { role: "user" | "assistant"; text: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi 👋 Ask me anything like: “Can I eat this?”, “Is sugar high?”, “What does E330 mean?”",
    },
  ]);

  // ✅ change to your laptop IP base (same as label backend)
  const API_BASE = "http://10.210.177.59:8000";

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading],
  );

  const send = async () => {
    const q = input.trim();
    if (!q) return;

    setInput("");
    setMsgs((p) => [...p, { role: "user", text: q }]);
    setLoading(true);

    try {
      const [profile, context] = await Promise.all([
        getProfile(),
        loadAgentContext(),
      ]);

      const answer = await askAgent(API_BASE, {
        message: q,
        profile,
        context,
      });

      setMsgs((p) => [...p, { role: "assistant", text: answer }]);
    } catch (e: any) {
      setMsgs((p) => [
        ...p,
        {
          role: "assistant",
          text: `❌ ${e?.message || "Agent request failed"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <Pressable style={styles.fab} onPress={() => setOpen(true)}>
        <Text style={styles.fabText}>AI</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Health Assistant</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.chat}
              contentContainerStyle={{ paddingBottom: 14 }}
            >
              {msgs.map((m, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.bubble,
                    m.role === "user" ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text style={styles.bubbleText}>{m.text}</Text>
                </View>
              ))}
              {loading ? (
                <View style={[styles.bubble, styles.botBubble]}>
                  <ActivityIndicator />
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask about this product…"
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.input}
                multiline
              />
              <Pressable
                style={[styles.sendBtn, !canSend ? { opacity: 0.5 } : null]}
                disabled={!canSend}
                onPress={send}
              >
                <Text style={styles.sendText}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    bottom: 26,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    zIndex: 9999,
    elevation: 10,
  },
  fabText: { color: "#fff", fontWeight: "900" },

  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "80%",
    backgroundColor: "#0b0b0f",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  sheetHeader: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sheetTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  close: { color: "rgba(255,255,255,0.7)", fontWeight: "800" },

  chat: { flex: 1, padding: 14 },
  bubble: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    maxWidth: "92%",
  },
  userBubble: { backgroundColor: "#1f2937", alignSelf: "flex-end" },
  botBubble: { backgroundColor: "#111827", alignSelf: "flex-start" },
  bubbleText: { color: "rgba(255,255,255,0.9)", lineHeight: 20 },

  inputRow: {
    padding: 12,
    gap: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  sendBtn: {
    backgroundColor: "#111",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sendText: { color: "#fff", fontWeight: "900" },
});
