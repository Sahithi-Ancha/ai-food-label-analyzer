import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { buildWarningsFromProfile } from "../rules/warnings";
import { getProfile } from "../storage/profile";

type Props = {
  source: "barcode" | "label";
  input: {
    ingredients: string[];
    allergens: string[];
    additives: string[];
    score?: string;
  };
};

export default function ProfileWarnings({ input }: Props) {
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      try {
        const profile = await getProfile();
        const w = buildWarningsFromProfile(profile, input);
        if (mounted) setWarnings(Array.isArray(w) ? w : []);
      } catch {
        if (mounted) setWarnings([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [
    input.ingredients.join("|"),
    input.allergens.join("|"),
    input.additives.join("|"),
    input.score,
  ]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Warnings (based on your profile)</Text>

      {loading ? (
        <Text style={styles.muted}>Checking…</Text>
      ) : warnings.length ? (
        warnings.map((w, i) => (
          <Text key={i} style={styles.warnLine}>
            • {w}
          </Text>
        ))
      ) : (
        <Text style={styles.muted}>No warnings detected.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#0f1117",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "900" },
  warnLine: { color: "#fecaca", marginTop: 8, lineHeight: 20 },
  muted: { color: "rgba(255,255,255,0.60)", marginTop: 10 },
});
