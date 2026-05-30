import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "agent:last_context";

export async function saveAgentContext(context: any) {
  await AsyncStorage.setItem(KEY, JSON.stringify(context ?? {}));
}

export async function loadAgentContext(): Promise<any> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
