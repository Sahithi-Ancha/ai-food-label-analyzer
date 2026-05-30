const BACKEND_BASE = "http://10.210.177.59:8000";

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export async function askAgent(
  question: string,
  context: any,
  history: ChatMessage[] = [],
) {
  const res = await fetch(`${BACKEND_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      context,
      history,
    }),
  });

  const data = await res.json();

  if (!data?.ok) {
    throw new Error(data?.error || "Chat failed");
  }

  return String(data.answer || "");
}
