// src/rules/warnings.ts
import type { Allergy, Severity, UserProfile } from "../storage/profile";

type NutritionInput = {
  sugars_g?: string;
  salt_g?: string;
  sodium_g?: string;
  sat_fat_g?: string;
  fat_g?: string;
};

type Input = {
  ingredients: string[];
  allergens: string[];
  additives?: string[];
  nutrition?: NutritionInput;
};

function toNum(x?: string) {
  const n = Number(String(x ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function up(s: any) {
  return String(s ?? "").toUpperCase();
}

function severityLabel(sev: Severity) {
  if (sev === "severe") return "Severe";
  if (sev === "moderate") return "Moderate";
  return "Mild";
}

function strictMult(profile: UserProfile) {
  if (profile.strictness === "strict") return 0.8;
  if (profile.strictness === "mild") return 1.25;
  return 1.0;
}

function normalizeList(arr: any): string[] {
  return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
}

function normalizeKey(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[():/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAnyWord(textUpper: string, words: string[]) {
  return words.some((w) => textUpper.includes(up(w)));
}

function hasTag(list: string[], candidates: string[]) {
  const normalized = list.map(normalizeKey);
  return candidates.some((c) => normalized.includes(normalizeKey(c)));
}

function allergyMatches(
  allergyIdLower: string,
  ingredientUpper: string,
  allergenUpper: string,
) {
  const map: Record<string, string[]> = {
    "milk dairy": ["MILK", "DAIRY", "LACTOSE", "WHEY", "CASEIN", "BUTTERMILK"],
    milk: ["MILK", "DAIRY", "LACTOSE", "WHEY", "CASEIN", "BUTTERMILK"],
    eggs: ["EGG", "EGGS", "ALBUMIN"],
    peanuts: ["PEANUT", "GROUNDNUT"],
    "tree nuts": [
      "TREE NUT",
      "ALMOND",
      "CASHEW",
      "WALNUT",
      "PISTACHIO",
      "HAZELNUT",
      "PECAN",
    ],
    soy: ["SOY", "SOYA", "SOYBEAN", "SOYBEANS", "LECITHIN"],
    "wheat gluten": ["WHEAT", "GLUTEN", "FLOUR", "BARLEY", "RYE", "OATS"],
    fish: ["FISH"],
    shellfish: ["SHELLFISH", "SHRIMP", "PRAWN", "CRAB", "LOBSTER"],
    sesame: ["SESAME", "TAHINI"],
    mustard: ["MUSTARD"],
    celery: ["CELERY"],
    sulphites: ["SULPHITE", "SULFITE", "SULPHUR DIOXIDE"],
    lupin: ["LUPIN"],
  };

  const key = normalizeKey(allergyIdLower);
  const keys = map[key] || [allergyIdLower.toUpperCase()];
  return keys.some(
    (k) => ingredientUpper.includes(k) || allergenUpper.includes(k),
  );
}

export function buildWarningsFromProfile(profile: UserProfile, input: Input) {
  const warnings: string[] = [];

  const ingredientText = normalizeList(input.ingredients)
    .join(" ")
    .toUpperCase();
  const allergenText = normalizeList(input.allergens).join(" ").toUpperCase();
  const additiveText = normalizeList(input.additives).join(" ").toUpperCase();

  const conditions = normalizeList(profile.conditions);
  const prefs = normalizeList(profile.preferences);

  const mult = strictMult(profile);

  const sugars = toNum(input.nutrition?.sugars_g);
  const salt = toNum(input.nutrition?.salt_g);
  const sodium = toNum(input.nutrition?.sodium_g);
  const satFat = toNum(input.nutrition?.sat_fat_g);

  const hasSugarWords = hasAnyWord(ingredientText, [
    "SUGAR",
    "GLUCOSE",
    "SYRUP",
    "FRUCTOSE",
    "DEXTROSE",
    "MALTODEXTRIN",
  ]);

  const hasSaltWords = hasAnyWord(ingredientText, ["SALT", "SODIUM", "BRINE"]);

  const hasBadFatWords = hasAnyWord(ingredientText, [
    "PALM",
    "PALM OIL",
    "PALMOLEIN",
    "HYDROGENATED",
    "TRANS FAT",
    "SHORTENING",
  ]);

  const hasSweetenerWords = hasAnyWord(ingredientText, [
    "ASPARTAME",
    "SUCRALOSE",
    "ACESULFAME",
    "SACCHARIN",
    "STEVIOL",
    "STEVIA",
  ]);

  const hasColorWords =
    ingredientText.includes("COLOR") ||
    ingredientText.includes("COLOUR") ||
    additiveText.includes("E1");

  const hasPreservativeWords =
    ingredientText.includes("PRESERVATIVE") ||
    additiveText.includes("E2") ||
    additiveText.includes("E21");

  const hasMsgWords =
    ingredientText.includes("MSG") ||
    ingredientText.includes("MONOSODIUM GLUTAMATE");

  const hasCaffeineWords = hasAnyWord(ingredientText, [
    "CAFFEINE",
    "COFFEE",
    "COLA",
    "GUARANA",
    "GREEN TEA",
  ]);

  // 1) Allergy warnings
  const userAllergies: Allergy[] = Array.isArray(profile.allergies)
    ? profile.allergies
    : [];

  for (const a of userAllergies) {
    const id = String(a?.id || "");
    if (!id) continue;

    if (allergyMatches(id, ingredientText, allergenText)) {
      const sev = a.severity ?? "moderate";
      const prefix = sev === "severe" ? "🚨" : sev === "moderate" ? "⚠️" : "ℹ️";
      warnings.push(
        `${prefix} ${severityLabel(sev)} allergy risk: this product contains or mentions ${id}. Avoid consuming.`,
      );
    }
  }

  // 2) Condition-based warnings
  if (
    hasTag(conditions, ["diabetes", "prediabetes"]) ||
    hasTag(prefs, ["goal sugar control"])
  ) {
    const sugarHigh = 10 * mult;
    if (sugars !== null && sugars >= sugarHigh) {
      warnings.push(
        "⚠️ High sugar detected — this product is not recommended for diabetes or sugar control.",
      );
    } else if (hasSugarWords) {
      warnings.push(
        "⚠️ Sugar-related ingredients detected — this product may not be suitable for diabetes or sugar control.",
      );
    }
  }

  if (hasTag(conditions, ["hypertension high bp", "hypertension"])) {
    const saltValue = salt ?? (sodium !== null ? sodium * 2.5 : null);
    const saltHigh = 1.25 * mult;

    if (saltValue !== null && saltValue >= saltHigh) {
      warnings.push(
        "⚠️ High salt detected — this product is not ideal for high blood pressure.",
      );
    } else if (hasSaltWords) {
      warnings.push(
        "⚠️ Salt or sodium is mentioned — monitor intake for hypertension.",
      );
    }
  }

  if (
    hasTag(conditions, ["high cholesterol", "heart health risk"]) ||
    hasTag(prefs, ["goal heart health"])
  ) {
    const satHigh = 5 * mult;
    if (satFat !== null && satFat >= satHigh) {
      warnings.push(
        "⚠️ High saturated fat detected — this product may worsen cholesterol or heart-related concerns.",
      );
    } else if (hasBadFatWords) {
      warnings.push(
        "⚠️ Unhealthy fat indicators detected (such as palm oil or hydrogenated fats).",
      );
    }
  }

  if (hasTag(conditions, ["kidney disease ckd"])) {
    const sodiumHigh = 0.4 * mult;
    if (sodium !== null && sodium >= sodiumHigh) {
      warnings.push(
        "⚠️ Higher sodium detected — this product may not be suitable for kidney disease.",
      );
    } else if (hasSaltWords) {
      warnings.push(
        "⚠️ Salt or sodium is mentioned — caution is advised for kidney disease.",
      );
    }
  }

  if (hasTag(conditions, ["fatty liver"])) {
    if (hasSugarWords || hasBadFatWords) {
      warnings.push(
        "⚠️ Sugar or unhealthy fat indicators detected — this product may not be suitable for fatty liver management.",
      );
    }
  }

  if (hasTag(conditions, ["thyroid"])) {
    if (hasAnyWord(ingredientText, ["SOY", "SOYA"])) {
      warnings.push(
        "⚠️ Soy-related ingredients detected — monitor suitability based on thyroid condition and medical advice.",
      );
    }
  }

  if (hasTag(conditions, ["pcos", "weight management"])) {
    if (hasSugarWords || hasSweetenerWords) {
      warnings.push(
        "⚠️ Sweet ingredients or sweeteners detected — this product may not support weight management or PCOS goals.",
      );
    }
  }

  if (hasTag(conditions, ["anemia"])) {
    if (hasAnyWord(ingredientText, ["TEA", "COFFEE", "CAFFEINE"])) {
      warnings.push(
        "⚠️ Caffeine sources detected — frequent intake may not be ideal around iron-rich meals for anemia.",
      );
    }
  }

  if (hasTag(conditions, ["lactose intolerance"])) {
    if (
      hasAnyWord(ingredientText, ["MILK", "DAIRY", "LACTOSE", "WHEY", "CASEIN"])
    ) {
      warnings.push(
        "⚠️ Dairy ingredients detected — this product may not be suitable for lactose intolerance.",
      );
    }
  }

  if (hasTag(conditions, ["gluten sensitivity celiac"])) {
    if (
      hasAnyWord(ingredientText, ["WHEAT", "GLUTEN", "BARLEY", "RYE", "OATS"])
    ) {
      warnings.push(
        "⚠️ Gluten-related ingredients detected — avoid if you have gluten sensitivity or celiac disease.",
      );
    }
  }

  if (hasTag(conditions, ["ibs", "acidity gerd"])) {
    if (
      hasAnyWord(ingredientText, [
        "SPICE",
        "CHILLI",
        "CAFFEINE",
        "COLA",
        "CITRIC",
      ])
    ) {
      warnings.push(
        "⚠️ Irritating ingredients may be present — this product may aggravate IBS or acidity/GERD symptoms.",
      );
    }
  }

  if (hasTag(conditions, ["pregnancy"])) {
    if (hasSweetenerWords || hasCaffeineWords) {
      warnings.push(
        "⚠️ Artificial sweeteners or caffeine-related ingredients detected — review suitability during pregnancy.",
      );
    }
  }

  if (hasTag(conditions, ["child 0 12"])) {
    if (hasColorWords || hasSweetenerWords || hasCaffeineWords) {
      warnings.push(
        "⚠️ Artificial colors, sweeteners, or caffeine-related ingredients detected — not ideal for children.",
      );
    }
  }

  if (hasTag(conditions, ["senior 60"])) {
    if (hasSaltWords || hasSugarWords) {
      warnings.push(
        "⚠️ Higher sugar or salt indicators detected — seniors may need more cautious product selection.",
      );
    }
  }

  if (hasTag(conditions, ["migraine caffeine trigger"])) {
    if (hasCaffeineWords) {
      warnings.push(
        "⚠️ Caffeine-related ingredients detected — this may trigger migraine symptoms.",
      );
    }
  }

  // 3) Preference-based warnings
  if (hasTag(prefs, ["vegetarian"])) {
    if (
      hasAnyWord(ingredientText, ["FISH", "CHICKEN", "MEAT", "BEEF", "PORK"])
    ) {
      warnings.push(
        "⚠️ Non-vegetarian ingredients detected — conflicts with your vegetarian preference.",
      );
    }
  }

  if (hasTag(prefs, ["vegan"])) {
    if (
      hasAnyWord(ingredientText, [
        "MILK",
        "EGG",
        "HONEY",
        "WHEY",
        "CASEIN",
        "GELATIN",
      ])
    ) {
      warnings.push(
        "⚠️ Non-vegan ingredients detected — conflicts with your vegan preference.",
      );
    }
  }

  if (hasTag(prefs, ["eggetarian"])) {
    if (
      hasAnyWord(ingredientText, ["FISH", "CHICKEN", "MEAT", "BEEF", "PORK"])
    ) {
      warnings.push(
        "⚠️ Meat or fish ingredients detected — conflicts with your eggetarian preference.",
      );
    }
  }

  if (hasTag(prefs, ["halal"])) {
    if (hasAnyWord(ingredientText, ["PORK", "LARD", "ALCOHOL", "GELATIN"])) {
      warnings.push("⚠️ Ingredients may conflict with halal preference.");
    }
  }

  if (hasTag(prefs, ["jain no onion garlic"])) {
    if (hasAnyWord(ingredientText, ["ONION", "GARLIC"])) {
      warnings.push(
        "⚠️ Onion or garlic detected — conflicts with your Jain preference.",
      );
    }
  }

  if (hasTag(prefs, ["avoid added sugar"])) {
    if (sugars !== null && sugars >= 10 * mult) {
      warnings.push(
        "⚠️ High sugar detected — conflicts with your preference to avoid added sugar.",
      );
    } else if (hasSugarWords) {
      warnings.push(
        "⚠️ Added sugar ingredients detected — conflicts with your preference.",
      );
    }
  }

  if (hasTag(prefs, ["avoid palm oil"])) {
    if (hasAnyWord(ingredientText, ["PALM", "PALM OIL", "PALMOLEIN"])) {
      warnings.push("⚠️ Palm oil detected — conflicts with your preference.");
    }
  }

  if (hasTag(prefs, ["avoid artificial sweeteners"])) {
    if (hasSweetenerWords) {
      warnings.push(
        "⚠️ Artificial sweeteners detected — conflicts with your preference.",
      );
    }
  }

  if (hasTag(prefs, ["avoid artificial colors"])) {
    if (hasColorWords) {
      warnings.push(
        "⚠️ Artificial colors detected or mentioned — conflicts with your preference.",
      );
    }
  }

  if (hasTag(prefs, ["avoid preservatives"])) {
    if (hasPreservativeWords) {
      warnings.push(
        "⚠️ Preservatives detected or mentioned — conflicts with your preference.",
      );
    }
  }

  if (hasTag(prefs, ["avoid msg"])) {
    if (hasMsgWords) {
      warnings.push("⚠️ MSG detected — conflicts with your preference.");
    }
  }

  if (hasTag(prefs, ["avoid caffeine"])) {
    if (hasCaffeineWords) {
      warnings.push(
        "⚠️ Caffeine-related ingredients detected — conflicts with your preference.",
      );
    }
  }

  if (hasTag(prefs, ["goal weight loss"])) {
    if (hasSugarWords || hasBadFatWords) {
      warnings.push(
        "⚠️ Sugar or unhealthy fat indicators detected — this product may not support your weight loss goal.",
      );
    }
  }

  if (hasTag(prefs, ["goal sugar control"])) {
    if (hasSugarWords || (sugars !== null && sugars >= 10 * mult)) {
      warnings.push(
        "⚠️ High sugar indicators detected — this product may not support your sugar control goal.",
      );
    }
  }

  if (hasTag(prefs, ["goal heart health"])) {
    if (hasBadFatWords || (satFat !== null && satFat >= 5 * mult)) {
      warnings.push(
        "⚠️ Unhealthy fat indicators detected — this product may not support your heart health goal.",
      );
    }
  }

  if (hasTag(prefs, ["goal high protein"])) {
    const proteinLow = !hasAnyWord(ingredientText, [
      "PROTEIN",
      "SOY",
      "WHEY",
      "MILK SOLIDS",
      "PEA PROTEIN",
    ]);
    if (proteinLow) {
      warnings.push(
        "ℹ️ This product may not be a strong high-protein choice based on available ingredients.",
      );
    }
  }

  if (hasTag(prefs, ["goal low sodium"])) {
    if (hasSaltWords || (salt !== null && salt >= 1.25 * mult)) {
      warnings.push(
        "⚠️ Salt or sodium indicators detected — this product may not support your low sodium goal.",
      );
    }
  }

  // 4) Additives count warning
  const additives = normalizeList(input.additives).map(up).filter(Boolean);
  if (additives.length >= (profile.strictness === "strict" ? 5 : 8)) {
    warnings.push(
      "⚠️ Many additives detected — consider limiting this product.",
    );
  }

  return Array.from(new Set(warnings));
}
