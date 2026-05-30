import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AgentProvider } from "../src/agent/AgentContext";
import { clearAuth, getAuthUser } from "../src/storage/auth";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      await clearAuth(); // keep only for demo if you want login first every time
      const savedUser = await getAuthUser();
      setUser(savedUser);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <AgentProvider>
        <View style={[styles.root, styles.center]}>
          <ActivityIndicator size="large" />
        </View>
      </AgentProvider>
    );
  }

  return (
    <AgentProvider>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="(tabs)" />
          ) : (
            <Stack.Screen name="(auth)" />
          )}
        </Stack>
      </View>
    </AgentProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});
