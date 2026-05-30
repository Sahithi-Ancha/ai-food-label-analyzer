import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { setLocale, t } from "../../src/i18n/i18n";
import type { AppLang } from "../../src/i18n/translations";
import { clearAuth, getAuthUser } from "../../src/storage/auth";
import {
  getProfile,
  resetProfile,
  saveProfile,
  type Allergy,
  type Severity,
  type UserProfile,
} from "../../src/storage/profile";

const LANGS: { id: AppLang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
  { id: "te", label: "తెలుగు" },
  { id: "ta", label: "தமிழ்" },
];

const CONDITION_IDS = [
  "diabetes",
  "prediabetes",
  "hypertension",
  "cholesterol",
  "heart",
  "kidney",
  "fatty_liver",
  "thyroid",
  "pcos",
  "obesity",
  "anemia",
  "lactose",
  "gluten",
  "ibs",
  "gerd",
  "pregnancy",
  "child",
  "senior",
  "migraine",
] as const;

const ALLERGY_IDS = [
  "milk",
  "eggs",
  "peanuts",
  "treenuts",
  "soy",
  "wheat",
  "fish",
  "shellfish",
  "sesame",
  "mustard",
  "celery",
  "sulphites",
  "lupin",
] as const;

const PREF_IDS = [
  "vegetarian",
  "vegan",
  "eggetarian",
  "halal",
  "jain",
  "avoid_added_sugar",
  "avoid_palm_oil",
  "avoid_sweeteners",
  "avoid_colors",
  "avoid_preservatives",
  "avoid_msg",
  "avoid_caffeine",
  "goal_weightloss",
  "goal_sugar",
  "goal_heart",
  "goal_protein",
  "goal_lowsodium",
] as const;

const severities: Severity[] = ["mild", "moderate", "severe"];

function normalizeProfile(p: UserProfile | null | undefined): UserProfile {
  const base = (p ?? {}) as UserProfile;

  return {
    ...base,
    language: (base as any).language ?? "en",
    strictness: (base as any).strictness ?? "moderate",
    conditions: Array.isArray((base as any).conditions)
      ? (base as any).conditions
      : [],
    preferences: Array.isArray((base as any).preferences)
      ? (base as any).preferences
      : [],
    allergies: Array.isArray((base as any).allergies)
      ? (base as any).allergies
      : [],
  } as UserProfile;
}

function toggleId(arr: string[], id: string) {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export default function ProfileScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [langModal, setLangModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<{
    user_id: number;
    username: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await getAuthUser();
        setAuthUser(user);

        const p = normalizeProfile(await getProfile());
        setProfile(p);
        setLocale((p as any).language ?? "en");
      } catch (e) {
        console.log("Profile load error:", e);
        Alert.alert("Error", "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const p = profile;

  const toggleAllergy = (id: string) => {
    const existing = (p.allergies || []).find((a) => a.id === id);
    const next: Allergy[] = existing
      ? (p.allergies || []).filter((a) => a.id !== id)
      : [...(p.allergies || []), { id, severity: "moderate" }];

    setProfile({ ...p, allergies: next });
  };

  const setAllergySeverity = (id: string, sev: Severity) => {
    const next = (p.allergies || []).map((a) =>
      a.id === id ? { ...a, severity: sev } : a,
    );
    setProfile({ ...p, allergies: next });
  };

  const setLanguage = async (lang: AppLang) => {
    const next = { ...p, language: lang } as UserProfile;
    setProfile(next);
    setLocale(lang);
    await saveProfile(next);
    setLangModal(false);
    Alert.alert(t("profile.saved"));
  };

  const onSave = async () => {
    try {
      await saveProfile(p);
      Alert.alert(t("profile.saved"));
    } catch (e) {
      console.log("Save error:", e);
      Alert.alert("Error", "Failed to save profile.");
    }
  };

  const onReset = async () => {
    try {
      await resetProfile();
      const fresh = normalizeProfile(await getProfile());
      setProfile(fresh);
      setLocale((fresh as any).language ?? "en");
      Alert.alert(t("profile.saved"));
    } catch (e) {
      console.log("Reset error:", e);
      Alert.alert("Error", "Failed to reset profile.");
    }
  };

  const onLogout = async () => {
    await clearAuth();
    router.replace("/login");
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <Text style={styles.title}>{t("profile.title")}</Text>
      <Text style={styles.sub}>{t("profile.subtitle")}</Text>

      {authUser ? (
        <View style={styles.userBox}>
          <Text style={styles.userLabel}>Logged in as</Text>
          <Text style={styles.userName}>{authUser.username}</Text>
        </View>
      ) : null}

      {/* Language */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("profile.language")}</Text>

        <Pressable onPress={() => setLangModal(true)} style={styles.dropdown}>
          <Text style={styles.dropdownText}>
            {LANGS.find((x) => x.id === (p as any).language)?.label ||
              "English"}
          </Text>
          <Text style={{ opacity: 0.6 }}>▾</Text>
        </Pressable>

        <Modal visible={langModal} transparent animationType="fade">
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setLangModal(false)}
          >
            <View style={styles.modalCard}>
              {LANGS.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => setLanguage(l.id)}
                  style={[
                    styles.modalRow,
                    (p as any).language === l.id && styles.modalRowActive,
                  ]}
                >
                  <Text style={styles.modalRowText}>{l.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>

      {/* Strictness */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("profile.strictness")}</Text>
        <View style={styles.pillsRow}>
          {(["mild", "moderate", "strict"] as const).map((s) => {
            const active = (p as any).strictness === s;
            return (
              <Pressable
                key={s}
                onPress={() =>
                  setProfile({ ...p, strictness: s } as UserProfile)
                }
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text
                  style={[styles.pillText, active && styles.pillTextActive]}
                >
                  {t(`strictness.${s}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Conditions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("sections.conditions")}</Text>
        <View style={styles.grid}>
          {CONDITION_IDS.map((id) => {
            const checked = (p.conditions || []).includes(id);
            return (
              <Pressable
                key={id}
                onPress={() =>
                  setProfile({
                    ...p,
                    conditions: toggleId(p.conditions || [], id),
                  })
                }
                style={[styles.item, checked && styles.itemChecked]}
              >
                <Text
                  style={[styles.itemText, checked && styles.itemTextChecked]}
                >
                  {t(`conditions.${id}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Allergies + severity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("sections.allergies")}</Text>

        <View style={styles.grid}>
          {ALLERGY_IDS.map((id) => {
            const checked = (p.allergies || []).some((a) => a.id === id);
            return (
              <Pressable
                key={id}
                onPress={() => toggleAllergy(id)}
                style={[styles.item, checked && styles.itemChecked]}
              >
                <Text
                  style={[styles.itemText, checked && styles.itemTextChecked]}
                >
                  {t(`allergies.${id}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {(p.allergies || []).length > 0 && (
          <View style={{ marginTop: 12 }}>
            {(p.allergies || []).map((a) => (
              <View key={a.id} style={styles.sevRow}>
                <Text style={{ fontWeight: "600" }}>
                  {t(`allergies.${a.id}`)}
                </Text>

                <View style={styles.pillsRow}>
                  {severities.map((sev) => {
                    const active = a.severity === sev;
                    return (
                      <Pressable
                        key={sev}
                        onPress={() => setAllergySeverity(a.id, sev)}
                        style={[
                          styles.pillSmall,
                          active && styles.pillSmallActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillSmallText,
                            active && styles.pillSmallTextActive,
                          ]}
                        >
                          {t(`severity.${sev}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("sections.preferences")}</Text>
        <View style={styles.grid}>
          {PREF_IDS.map((id) => {
            const checked = (p.preferences || []).includes(id);
            return (
              <Pressable
                key={id}
                onPress={() =>
                  setProfile({
                    ...p,
                    preferences: toggleId(p.preferences || [], id),
                  })
                }
                style={[styles.item, checked && styles.itemChecked]}
              >
                <Text
                  style={[styles.itemText, checked && styles.itemTextChecked]}
                >
                  {t(`prefs.${id}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Buttons */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable onPress={onSave} style={[styles.btn, styles.btnPrimary]}>
          <Text style={styles.btnPrimaryText}>{t("profile.save")}</Text>
        </Pressable>

        <Pressable onPress={onReset} style={[styles.btn, styles.btnGhost]}>
          <Text style={styles.btnGhostText}>{t("profile.reset")}</Text>
        </Pressable>
      </View>

      <Pressable onPress={onLogout} style={[styles.btn, styles.btnLogout]}>
        <Text style={styles.btnLogoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f6f7fb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  title: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  sub: { marginTop: 6, color: "#4b5563", lineHeight: 18 },

  userBox: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  userLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },
  userName: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  card: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },

  dropdown: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  dropdownText: { fontSize: 15, fontWeight: "600" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalRow: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  modalRowActive: { backgroundColor: "#ecfdf5" },
  modalRowText: { fontSize: 15, fontWeight: "600" },

  grid: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  itemChecked: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  itemText: { fontSize: 13, fontWeight: "600", color: "#111827" },
  itemTextChecked: { color: "#fff" },

  pillsRow: { flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  pillActive: { backgroundColor: "#111827", borderColor: "#111827" },
  pillText: { fontWeight: "700", color: "#111827" },
  pillTextActive: { color: "#fff" },

  sevRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  pillSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  pillSmallActive: { backgroundColor: "#111827", borderColor: "#111827" },
  pillSmallText: { fontWeight: "700", fontSize: 12, color: "#111827" },
  pillSmallTextActive: { color: "#fff" },

  btn: {
    flex: 1,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#16a34a" },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  btnGhostText: { color: "#111827", fontWeight: "800" },

  btnLogout: {
    backgroundColor: "#111827",
  },
  btnLogoutText: {
    color: "#fff",
    fontWeight: "800",
  },
});
