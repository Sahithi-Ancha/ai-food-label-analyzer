import React, { useMemo, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAgentContext } from "../agent/AgentContext";
import { askAgent } from "../services/chat";

type Msg = { role: "user" | "assistant"; text: string };

export default function FloatingAgent() {
  const { context } = useAgentContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView | null>(null);

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi! Ask me: “Can I eat this?”, “Why is this risky?”, or “Suggest a better option.”",
    },
  ]);

  const headerLine = useMemo(() => {
    if (context?.mode === "barcode" && context?.productName) {
      return `Product: ${context.productName}`;
    }
    if (context?.mode === "label") return `Label Scan`;
    return `Home`;
  }, [context]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const nextMessages: Msg[] = [...messages, { role: "user", text: q }];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const answer = await askAgent(q, context, nextMessages);

      setMessages((m) => [...m, { role: "assistant", text: answer }]);
      scrollToBottom();
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Error: ${e?.message || "Failed"}`,
        },
      ]);
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Pressable
        style={[styles.fab, { bottom: 90 + insets.bottom }]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.fabText}>AI</Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modal}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.title}>Health Assistant</Text>
              <Text style={styles.sub}>{headerLine}</Text>
            </View>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.chat}
            contentContainerStyle={{ paddingBottom: 16 }}
            onContentSizeChange={scrollToBottom}
          >
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.bubble,
                  msg.role === "user" ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === "user" ? styles.userBubbleText : null,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            ))}

            {loading ? (
              <View style={[styles.bubble, styles.botBubble]}>
                <ActivityIndicator />
                <Text style={[styles.bubbleText, { marginTop: 6 }]}>
                  Thinking…
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask something…"
              placeholderTextColor="#888"
              style={styles.input}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, loading && { opacity: 0.7 }]}
              onPress={send}
              disabled={loading}
            >
              <Text style={styles.sendText}>Send</Text>
            </Pressable>
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    zIndex: 9999,
  },
  fabText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  modal: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "900", color: "#111" },
  sub: { marginTop: 4, color: "#666" },
  close: { color: "#2563eb", fontWeight: "800" },

  chat: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  bubble: {
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
    maxWidth: "92%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#111",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
  },
  bubbleText: {
    color: "#111",
    lineHeight: 20,
  },
  userBubbleText: {
    color: "#fff",
  },

  inputRow: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111",
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: "#111",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sendText: { color: "#fff", fontWeight: "900" },
});
