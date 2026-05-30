import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "auth_user_id";
const USERNAME_KEY = "auth_username";

export async function saveAuth(userId: number, username: string) {
  await AsyncStorage.setItem(USER_ID_KEY, String(userId));
  await AsyncStorage.setItem(USERNAME_KEY, username);
}

export async function getAuthUser() {
  const userId = await AsyncStorage.getItem(USER_ID_KEY);
  const username = await AsyncStorage.getItem(USERNAME_KEY);

  if (!userId) return null;

  return {
    user_id: Number(userId),
    username: username || "",
  };
}

export async function clearAuth() {
  await AsyncStorage.removeItem(USER_ID_KEY);
  await AsyncStorage.removeItem(USERNAME_KEY);
}
