// src/rules/recommendations.ts
import {
  RECOMMENDED_PRODUCTS,
  type RecommendedProduct,
} from "../data/recommendation_products";
import type { UserProfile } from "../storage/profile";

type Input = {
  ingredients: string[];
  allergens: string[];
  additives?: string[];
};

type RecommendationItem = {
  name: string;
  reason: string;
};

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

function hasTag(list: string[], candidates: string[]) {
  const normalized = list.map(normalizeKey);
  return candidates.some((c) => normalized.includes(normalizeKey(c)));
}

function hasAnyWord(textUpper: string, words: string[]) {
  return words.some((w) => textUpper.includes(w.toUpperCase()));
}

function pushTag(set: Set<string>, value: string) {
  set.add(normalizeKey(value));
}

export function buildRecommendationsFromProfile(
  profile: UserProfile,
  input: Input,
): RecommendationItem[] {
  const ingredientText = normalizeList(input.ingredients)
    .join(" ")
    .toUpperCase();
  const allergenText = normalizeList(input.allergens).join(" ").toUpperCase();

  const conditions = normalizeList(profile.conditions);
  const prefs = normalizeList(profile.preferences);
  const allergies = Array.isArray(profile.allergies)
    ? profile.allergies.map((a) => String(a.id))
    : [];

  const matchedTags = new Set<string>();

  // -------------------------
  // Profile-based tags
  // -------------------------
  conditions.forEach((c) => pushTag(matchedTags, c));
  prefs.forEach((p) => pushTag(matchedTags, p));
  allergies.forEach((a) => pushTag(matchedTags, a));

  // -------------------------
  // Ingredient-driven tags
  // -------------------------
  if (hasAnyWord(ingredientText, ["SUGAR", "GLUCOSE", "SYRUP", "FRUCTOSE"])) {
    pushTag(matchedTags, "diabetes");
    pushTag(matchedTags, "prediabetes");
    pushTag(matchedTags, "goal sugar control");
    pushTag(matchedTags, "avoid added sugar");
  }

  if (hasAnyWord(ingredientText, ["SALT", "SODIUM", "BRINE"])) {
    pushTag(matchedTags, "hypertension");
    pushTag(matchedTags, "hypertension high bp");
    pushTag(matchedTags, "goal low sodium");
    pushTag(matchedTags, "kidney disease ckd");
  }

  if (
    hasAnyWord(ingredientText, [
      "PALM",
      "PALM OIL",
      "HYDROGENATED",
      "TRANS FAT",
    ])
  ) {
    pushTag(matchedTags, "high cholesterol");
    pushTag(matchedTags, "heart health risk");
    pushTag(matchedTags, "goal heart health");
    pushTag(matchedTags, "fatty liver");
    pushTag(matchedTags, "goal weight loss");
    pushTag(matchedTags, "avoid palm oil");
  }

  if (
    hasAnyWord(ingredientText, [
      "MILK",
      "DAIRY",
      "WHEY",
      "CASEIN",
      "LACTOSE",
    ]) ||
    hasAnyWord(allergenText, ["MILK", "DAIRY"])
  ) {
    pushTag(matchedTags, "milk");
    pushTag(matchedTags, "milk dairy");
    pushTag(matchedTags, "lactose intolerance");
  }

  if (
    hasAnyWord(ingredientText, ["EGG", "EGGS", "ALBUMIN"]) ||
    hasAnyWord(allergenText, ["EGG", "EGGS"])
  ) {
    pushTag(matchedTags, "eggs");
  }

  if (
    hasAnyWord(ingredientText, ["PEANUT", "GROUNDNUT"]) ||
    hasAnyWord(allergenText, ["PEANUT", "GROUNDNUT"])
  ) {
    pushTag(matchedTags, "peanuts");
  }

  if (
    hasAnyWord(ingredientText, [
      "ALMOND",
      "CASHEW",
      "WALNUT",
      "PISTACHIO",
      "HAZELNUT",
      "PECAN",
      "TREE NUT",
    ]) ||
    hasAnyWord(allergenText, ["TREE NUT", "ALMOND", "CASHEW", "WALNUT"])
  ) {
    pushTag(matchedTags, "tree nuts");
  }

  if (
    hasAnyWord(ingredientText, ["SOY", "SOYA", "SOYBEAN"]) ||
    hasAnyWord(allergenText, ["SOY", "SOYA"])
  ) {
    pushTag(matchedTags, "soy");
  }

  if (
    hasAnyWord(ingredientText, ["WHEAT", "GLUTEN", "BARLEY", "RYE", "OATS"]) ||
    hasAnyWord(allergenText, ["WHEAT", "GLUTEN"])
  ) {
    pushTag(matchedTags, "wheat gluten");
    pushTag(matchedTags, "gluten sensitivity celiac");
  }

  if (
    hasAnyWord(ingredientText, ["FISH"]) ||
    hasAnyWord(allergenText, ["FISH"])
  ) {
    pushTag(matchedTags, "fish");
  }

  if (
    hasAnyWord(ingredientText, [
      "SHELLFISH",
      "SHRIMP",
      "PRAWN",
      "CRAB",
      "LOBSTER",
    ]) ||
    hasAnyWord(allergenText, ["SHELLFISH", "SHRIMP", "PRAWN", "CRAB"])
  ) {
    pushTag(matchedTags, "shellfish");
  }

  if (
    hasAnyWord(ingredientText, ["SESAME", "TAHINI"]) ||
    hasAnyWord(allergenText, ["SESAME"])
  ) {
    pushTag(matchedTags, "sesame");
  }

  if (
    hasAnyWord(ingredientText, ["MUSTARD"]) ||
    hasAnyWord(allergenText, ["MUSTARD"])
  ) {
    pushTag(matchedTags, "mustard");
  }

  if (
    hasAnyWord(ingredientText, ["CELERY"]) ||
    hasAnyWord(allergenText, ["CELERY"])
  ) {
    pushTag(matchedTags, "celery");
  }

  if (
    hasAnyWord(ingredientText, ["SULPHITE", "SULFITE", "SULPHUR DIOXIDE"]) ||
    hasAnyWord(allergenText, ["SULPHITE", "SULFITE"])
  ) {
    pushTag(matchedTags, "sulphites");
  }

  if (
    hasAnyWord(ingredientText, ["LUPIN"]) ||
    hasAnyWord(allergenText, ["LUPIN"])
  ) {
    pushTag(matchedTags, "lupin");
  }

  if (
    hasAnyWord(ingredientText, [
      "ASPARTAME",
      "SUCRALOSE",
      "ACESULFAME",
      "SACCHARIN",
    ])
  ) {
    pushTag(matchedTags, "avoid artificial sweeteners");
  }

  if (ingredientText.includes("COLOR") || ingredientText.includes("COLOUR")) {
    pushTag(matchedTags, "avoid artificial colors");
  }

  if (ingredientText.includes("PRESERVATIVE")) {
    pushTag(matchedTags, "avoid preservatives");
  }

  if (
    ingredientText.includes("MSG") ||
    ingredientText.includes("MONOSODIUM GLUTAMATE")
  ) {
    pushTag(matchedTags, "avoid msg");
  }

  if (hasAnyWord(ingredientText, ["CAFFEINE", "COFFEE", "COLA", "GUARANA"])) {
    pushTag(matchedTags, "avoid caffeine");
    pushTag(matchedTags, "migraine caffeine trigger");
  }

  if (hasAnyWord(ingredientText, ["ONION", "GARLIC"])) {
    pushTag(matchedTags, "jain no onion garlic");
  }

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
    pushTag(matchedTags, "vegan");
  }

  // -------------------------
  // Product matching
  // -------------------------
  const matches: Array<RecommendedProduct & { score: number }> =
    RECOMMENDED_PRODUCTS.map((product) => {
      const productTags = product.tags.map(normalizeKey);
      const score = productTags.reduce(
        (acc, tag) => acc + (matchedTags.has(tag) ? 1 : 0),
        0,
      );
      return { ...product, score };
    })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);

  const unique = matches.filter(
    (item, index, self) =>
      index === self.findIndex((x) => x.name === item.name),
  );

  return unique.slice(0, 4).map((item) => ({
    name: item.name,
    reason: item.reason,
  }));
}
