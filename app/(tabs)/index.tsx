import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Food Label Analyzer🍎</Text>
      <Text style={styles.subTitle}>
        Scan barcode or scan a food label to get health insights.
      </Text>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.push("/camera")} // barcode scan screen
      >
        <Text style={styles.btnText}>Barcode Scan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => router.push("/label")} // label OCR screen
      >
        <Text style={styles.btnText}>Scan Label</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f3f3",
    padding: 18,
    justifyContent: "center",
  },
  title: {
    color: "#080101",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subTitle: {
    color: "rgba(7, 3, 3, 0.75)",
    fontSize: 14,
    marginBottom: 30,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: "#18a34a",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  secondaryBtn: {
    backgroundColor: "#18a34a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});
