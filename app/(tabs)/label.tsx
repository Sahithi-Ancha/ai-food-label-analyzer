// app/(tabs)/label.tsx
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { useAgentContext } from "../../src/agent/AgentContext";

const BACKEND_BASE = "http://10.210.177.59:8000";
const LABEL_SCAN_URL = `${BACKEND_BASE}/label-scan`;

type MatchedProduct = {
  product_name?: string;
  brand?: string;
  barcode?: string;
  nutri_grade?: string;
  image?: string;
};

type ScanResponse = {
  ok?: boolean;
  raw_text?: string;
  ingredients?: string[];
  allergens?: string[];
  additives?: string[];
  matched_product?: MatchedProduct | null;
  error?: string;
};

export default function LabelScreen() {
  const router = useRouter();
  const { setLabelResult } = useAgentContext();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    setError(null);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Gallery permission denied.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });

    if (res.canceled) return;

    const uri = res.assets?.[0]?.uri;
    if (uri) setImageUri(uri);
  };

  const captureImage = async () => {
    setError(null);

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError("Camera permission denied.");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (res.canceled) return;

    const uri = res.assets?.[0]?.uri;
    if (uri) setImageUri(uri);
  };

  const scanLabel = async () => {
    if (!imageUri) {
      setError("Select or capture image first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Label scan URL:", LABEL_SCAN_URL);
      console.log("Image URI:", imageUri);

      const form = new FormData();
      form.append("image", {
        uri: imageUri,
        name: "label.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(LABEL_SCAN_URL, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const badText = await res.text();
        throw new Error(`Server error ${res.status}: ${badText}`);
      }

      const data: ScanResponse = await res.json();

      if (!data?.ok) {
        throw new Error(data?.error || "Scan failed");
      }

      const safeResult = {
        ingredients: Array.isArray(data.ingredients)
          ? data.ingredients.slice(0, 35)
          : [],
        allergens: Array.isArray(data.allergens)
          ? data.allergens.slice(0, 20)
          : [],
        additives: Array.isArray(data.additives)
          ? data.additives.slice(0, 25)
          : [],
        raw_text: String(data.raw_text || "").slice(0, 2000),
        matched_product: data.matched_product || null,
        imageUri,
      };

      setLabelResult(safeResult);

      router.push({
        pathname: "/(tabs)/result",
        params: {
          mode: "label",
        },
      });
    } catch (e: any) {
      console.log("Label scan error:", e);
      setError(e?.message || "Network request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "900" }}>Label Scan</Text>

      <Pressable style={styles.btn} onPress={pickImage}>
        <Text style={styles.btnText}>Pick Label Image</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, { backgroundColor: "#18a24a" }]}
        onPress={captureImage}
      >
        <Text style={styles.btnText}>Capture with Camera</Text>
      </Pressable>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : (
        <Text style={{ marginTop: 12, color: "#666" }}>No image selected.</Text>
      )}

      <Text
        style={{
          marginTop: 12,
          color: "#666",
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Capture only the ingredients section clearly for best results.
      </Text>

      <Pressable
        style={[styles.btn, { marginTop: 14, opacity: loading ? 0.6 : 1 }]}
        onPress={scanLabel}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Scan</Text>
        )}
      </Pressable>

      {error ? (
        <Text style={{ marginTop: 10, color: "red" }}>{error}</Text>
      ) : null}

      <Text style={{ marginTop: 16, color: "#555", lineHeight: 20 }}>
        For better OCR results, capture only the ingredients section in good
        lighting and keep the image straight and clear.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginTop: 14,
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "900" },
  preview: {
    width: "100%",
    height: 220,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#eee",
  },
});
