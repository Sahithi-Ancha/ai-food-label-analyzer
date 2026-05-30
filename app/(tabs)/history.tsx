import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { getHistory, type HistoryItem } from "../../src/services/history";
import { getAuthUser } from "../../src/storage/auth";

export default function HistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const authUser = await getAuthUser();
      if (!authUser?.user_id) {
        setItems([]);
        setError("No logged-in user found.");
        return;
      }

      const data = await getHistory(authUser.user_id);
      setItems(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const openHistoryItem = (item: HistoryItem) => {
    if (item.mode === "barcode" && item.barcode) {
      router.push({
        pathname: "/(tabs)/result",
        params: {
          mode: "barcode",
          barcode: item.barcode,
        },
      });
      return;
    }

    const payload = encodeURIComponent(
      JSON.stringify({
        raw_text: item.raw_text || "",
        ingredients: item.ingredients || [],
        allergens: item.allergens || [],
        additives: item.additives || [],
        matched_product: item.barcode
          ? {
              product_name: item.product_name,
              barcode: item.barcode,
              nutri_grade: item.nutri_grade,
              image: item.image_url,
            }
          : null,
      }),
    );

    router.push({
      pathname: "/(tabs)/result",
      params: {
        mode: "label",
        payload,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Loading history…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Scan History</Text>
      <Text style={styles.sub}>
        Open your previously scanned products without rescanning.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!items.length ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No scan history yet.</Text>
        </View>
      ) : null}

      {items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.card}
          onPress={() => openHistoryItem(item)}
        >
          <View style={styles.row}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Text style={{ color: "#666", fontSize: 12 }}>No Image</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {item.product_name || "Unknown Product"}
              </Text>
              <Text style={styles.meta}>
                {item.mode === "barcode" ? "Barcode Scan" : "Label Scan"}
              </Text>

              {item.barcode ? (
                <Text style={styles.meta}>Barcode: {item.barcode}</Text>
              ) : null}

              {item.nutri_grade ? (
                <Text style={styles.meta}>Nutri-Grade: {item.nutri_grade}</Text>
              ) : null}
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f5f6f7" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: "900", color: "#111" },
  sub: { marginTop: 6, color: "#666", marginBottom: 14 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontWeight: "800", color: "#111" },
  meta: { marginTop: 4, color: "#555", fontSize: 12 },

  emptyBox: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e7e7e7",
  },
  emptyText: { color: "#666" },

  errorBox: {
    marginTop: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { color: "#991b1b" },
});
