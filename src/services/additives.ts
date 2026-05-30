import AsyncStorage from "@react-native-async-storage/async-storage";
import ADDITIVES_DB from "../data/e_additives.json";

export type AdditiveDetails = {
  eno: string; // E322
  chemical_name?: string;
  name?: string;
  category?: string;
  description?: string;
  risk_level?: string;
  safety_notes?: string;
  source?: "cache" | "custom";
};

const CACHE_PREFIX = "additive_details_v2:";

const normalizeCode = (raw: string) => {
  const s = String(raw || "")
    .toUpperCase()
    .trim();
  // remove "en:" if any
  return s.replace(/^..:/, "");
};

async function getFromCache(code: string): Promise<AdditiveDetails | null> {
  const key = `${CACHE_PREFIX}${code}`;
  const json = await AsyncStorage.getItem(key);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function saveToCache(details: AdditiveDetails) {
  const key = `${CACHE_PREFIX}${details.eno}`;
  await AsyncStorage.setItem(key, JSON.stringify(details));
}

export async function getAdditiveDetails(
  rawCode: string,
): Promise<AdditiveDetails> {
  const code = normalizeCode(rawCode);

  const cached = await getFromCache(code);
  if (cached) return { ...cached, source: "cache" };

  const info = (ADDITIVES_DB as any)[code];

  const details: AdditiveDetails = {
    eno: code,
    chemical_name: info?.chemical_name,
    name: info?.name,
    category: info?.category,
    description: info?.description,
    risk_level: info?.risk_level,
    safety_notes: info?.safety_notes,
    source: "custom",
  };

  await saveToCache(details);
  return details;
}

export async function getManyAdditivesDetails(rawCodes: string[]) {
  const unique = Array.from(new Set(rawCodes.map(normalizeCode)));
  const results = await Promise.all(unique.map((c) => getAdditiveDetails(c)));
  return results;
}
