export type AgentPayload = {
  message: string;
  profile?: any;
  context?: any;
};

export async function askAgent(apiBase: string, payload: AgentPayload) {
  const res = await fetch(`${apiBase}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data?.ok) throw new Error(data?.answer || "Agent failed");
  return String(data.answer || "");
}
