import { getAuthUser } from "./auth";

const BACKEND_BASE = "http://10.210.177.59:8000"; // change if needed

export type Severity = "mild" | "moderate" | "severe";

export type Allergy = {
  id: string;
  severity: Severity;
};

export type Strictness = "mild" | "moderate" | "strict";

export type UserProfile = {
  language: "en" | "hi" | "te" | "ta";
  strictness: Strictness;
  conditions: string[];
  preferences: string[];
  allergies: Allergy[];
};

export const DEFAULT_PROFILE: UserProfile = {
  language: "en",
  strictness: "moderate",
  conditions: [],
  preferences: [],
  allergies: [],
};

function normalizeProfile(p: any): UserProfile {
  return {
    language: p?.language || "en",
    strictness: p?.strictness || "moderate",
    conditions: Array.isArray(p?.conditions) ? p.conditions : [],
    preferences: Array.isArray(p?.preferences) ? p.preferences : [],
    allergies: Array.isArray(p?.allergies) ? p.allergies : [],
  };
}
// ---------------------------
export async function getProfile(): Promise<UserProfile> {
  try {
    const user = await getAuthUser();

    if (!user?.user_id) {
      return DEFAULT_PROFILE;
    }

    const res = await fetch(`${BACKEND_BASE}/profile/${user.user_id}`);

    const data = await res.json();

    if (!data?.ok || !data?.profile) {
      return DEFAULT_PROFILE;
    }

    return normalizeProfile(data.profile);
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveProfile(p: UserProfile) {
  try {
    const user = await getAuthUser();

    if (!user?.user_id) return;

    await fetch(`${BACKEND_BASE}/profile/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.user_id,
        language: p.language,
        strictness: p.strictness,
        conditions: p.conditions,
        preferences: p.preferences,
        allergies: p.allergies,
      }),
    });
  } catch (e) {
    console.log("Save profile error:", e);
  }
}

export async function resetProfile() {
  await saveProfile(DEFAULT_PROFILE);
}
