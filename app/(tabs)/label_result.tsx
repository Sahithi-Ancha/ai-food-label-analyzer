import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import ProfileWarnings from "../../src/Components/ProfileWarnings";
import ADDITIVES_DB from "../../src/data/e_additives.json";

type LabelPayload = {
  imageUri: string;
  ingredients: string[];
  additives: string[];
  allergens: string[];
  score?: number;
};

function normalizeCode(x: string) {
  return String(x || "")
    .toUpperCase()
    .trim();
}

function computeScore(
  ingredients: string[],
  additives: string[],
  provided?: number,
) {
  if (typeof provided === "number") return provided;

  // quick score 0-100
  let score = 85;
  const t = ingredients.join(" ").toUpperCase();

  if (["SUGAR", "GLUCOSE", "SYRUP"].some((k) => t.includes(k))) score -= 15;
  if (["SALT", "SODIUM"].some((k) => t.includes(k))) score -= 10;
  if (["PALM", "HYDROGENATED"].some((k) => t.includes(k))) score -= 10;

  score -= Math.min(25, (additives?.length || 0) * 2);
  return Math.max(0, Math.min(100, score));
}

export default function LabelResultScreen() {
  const params = useLocalSearchParams<{ payload?: string }>();
  const payloadStr = params?.payload
    ? decodeURIComponent(String(params.payload))
    : "";

  const payload: LabelPayload | null = useMemo(() => {
    try {
      return payloadStr ? (JSON.parse(payloadStr) as LabelPayload) : null;
    } catch {
      return null;
    }
  }, [payloadStr]);

  if (!payload) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          No label result
        </Text>
      </View>
    );
  }

  const additives = (payload.additives || []).map(normalizeCode);
  const score = computeScore(
    payload.ingredients || [],
    additives,
    payload.score,
  );

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 28 }}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Label Result</Text>
        <Text style={styles.headerSub}>
          Score + Ingredients + Additives + Warnings
        </Text>
      </View>

      {/* Image */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scanned Image</Text>
        <Image source={{ uri: payload.imageUri }} style={styles.image} />
      </View>

      {/* Score */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Health Score</Text>
        <Text style={styles.score}>{score}/100</Text>
        <Text style={styles.muted}>
          (Score is estimated from ingredients + additives)
        </Text>
      </View>

      {/* Warnings */}
      <ProfileWarnings
        source="label"
        input={{
          ingredients: payload.ingredients || [],
          allergens: payload.allergens || [],
          additives,
          score: String(score),
        }}
      />

      {/* Ingredients */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingredients</Text>
        {(payload.ingredients || []).length ? (
          payload.ingredients.slice(0, 60).map((x, i) => (
            <Text key={i} style={styles.line}>
              • {x}
            </Text>
          ))
        ) : (
          <Text style={styles.muted}>No ingredients detected.</Text>
        )}
      </View>

      {/* Additives */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Additives</Text>
        {additives.length ? (
          additives.slice(0, 80).map((code, i) => {
            const info = (ADDITIVES_DB as any)[code];
            return (
              <View key={code + i} style={{ marginTop: 10 }}>
                <Text style={styles.addTitle}>
                  {code}
                  {info?.name ? ` — ${info.name}` : ""}
                </Text>
                {info?.risk_level ? (
                  <Text style={styles.smallMuted}>Risk: {info.risk_level}</Text>
                ) : null}
                {info?.description ? (
                  <Text style={styles.desc}>{info.description}</Text>
                ) : (
                  <Text style={styles.desc}>No details in dataset.</Text>
                )}
                {info?.safety_notes ? (
                  <Text style={styles.note}>⚠ {info.safety_notes}</Text>
                ) : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.muted}>No additives found.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0b0b0f" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  headerSub: { color: "rgba(255,255,255,0.6)", marginTop: 6 },

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#0f1117",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "900" },

  image: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginTop: 10,
    backgroundColor: "#111",
  },

  score: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 10 },
  muted: { color: "rgba(255,255,255,0.60)", marginTop: 6 },

  line: { color: "rgba(255,255,255,0.88)", marginTop: 8, lineHeight: 20 },

  addTitle: { color: "#fff", fontWeight: "900" },
  desc: { color: "rgba(255,255,255,0.82)", marginTop: 6, lineHeight: 20 },
  note: { color: "#fbbf24", marginTop: 6 },
  smallMuted: { color: "rgba(255,255,255,0.55)", marginTop: 6, fontSize: 12 },
});
