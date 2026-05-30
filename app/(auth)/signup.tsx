import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { signupUser } from "../../src/services/auth";
import { saveAuth } from "../../src/storage/auth";

export default function SignupScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing fields", "Please fill all fields.");
      return;
    }

    if (password.trim().length < 4) {
      Alert.alert("Weak password", "Password should be at least 4 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await signupUser(username.trim(), password.trim());
      await saveAuth(data.user_id, data.username);
      Alert.alert("Success", "Account created successfully.");
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Signup failed", e?.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.sub}>Register using username and password</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Pressable
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={onSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push("/login")}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f5f6f7",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
  },
  sub: {
    marginTop: 6,
    marginBottom: 18,
    color: "#6b7280",
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
    color: "#111827",
  },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900",
  },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "700",
  },
});
