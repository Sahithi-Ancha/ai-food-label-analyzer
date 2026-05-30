// src/data/recommendation_products.ts

export type RecommendedProduct = {
  name: string;
  tags: string[];
  reason: string;
};

export const RECOMMENDED_PRODUCTS: RecommendedProduct[] = [
  // -------------------------
  // Diabetes / Sugar control
  // -------------------------
  {
    name: "Britannia NutriChoice Essentials",
    tags: [
      "diabetes",
      "prediabetes",
      "goal sugar control",
      "avoid added sugar",
    ],
    reason: "Lower sugar option compared to regular sweet biscuits.",
  },
  {
    name: "Diabliss Sugar Smart Cookies",
    tags: [
      "diabetes",
      "prediabetes",
      "goal sugar control",
      "avoid added sugar",
    ],
    reason: "Suitable option for users looking for controlled sugar intake.",
  },
  {
    name: "Whole Grain Oats Biscuits",
    tags: [
      "diabetes",
      "prediabetes",
      "goal sugar control",
      "weight management",
    ],
    reason: "A better alternative to refined sugary snacks.",
  },

  // -------------------------
  // Hypertension / Low sodium / Kidney
  // -------------------------
  {
    name: "Unsalted Whole Wheat Crackers",
    tags: ["hypertension", "goal low sodium", "kidney disease ckd"],
    reason: "Better low-sodium alternative to salty processed snacks.",
  },
  {
    name: "Low Sodium Roasted Nuts",
    tags: ["hypertension", "goal low sodium", "heart health risk"],
    reason: "A snack option with lower sodium than many packaged foods.",
  },
  {
    name: "Plain Puffed Rice Snacks",
    tags: ["hypertension", "goal low sodium", "weight management"],
    reason: "Simple snack alternative with lower sodium and fewer additives.",
  },

  // -------------------------
  // Heart / Cholesterol / Fatty liver
  // -------------------------
  {
    name: "Oats-Based High Fiber Biscuits",
    tags: [
      "high cholesterol",
      "heart health risk",
      "goal heart health",
      "fatty liver",
    ],
    reason:
      "Fiber-rich option that may be better than high-fat processed snacks.",
  },
  {
    name: "Whole Grain Crackers",
    tags: ["high cholesterol", "heart health risk", "goal heart health"],
    reason:
      "Better choice compared to products with palm oil or trans fat indicators.",
  },
  {
    name: "Baked Multigrain Snacks",
    tags: ["fatty liver", "goal heart health", "weight management"],
    reason: "A lighter alternative to fried or high-fat packaged foods.",
  },

  // -------------------------
  // Weight / PCOS
  // -------------------------
  {
    name: "High Fiber Oat Crackers",
    tags: ["weight management", "pcos", "goal weight loss"],
    reason: "Better snack option for satiety and reduced refined sugar intake.",
  },
  {
    name: "Roasted Chana Snack Pack",
    tags: ["weight management", "pcos", "goal high protein"],
    reason: "Higher protein and better snacking alternative than sugary items.",
  },

  // -------------------------
  // Thyroid
  // -------------------------
  {
    name: "Plain Whole Wheat Biscuits",
    tags: ["thyroid"],
    reason:
      "Simple ingredient products can be easier to monitor for thyroid-sensitive diets.",
  },

  // -------------------------
  // Anemia
  // -------------------------
  {
    name: "Iron-Fortified Cereal",
    tags: ["anemia"],
    reason:
      "Fortified products may be more suitable than low-nutrient snack foods.",
  },

  // -------------------------
  // Lactose intolerance / Milk allergy / Vegan
  // -------------------------
  {
    name: "Oat Milk Based Cookies",
    tags: ["milk dairy", "milk", "lactose intolerance", "vegan"],
    reason: "Dairy-free alternative for users avoiding milk-based products.",
  },
  {
    name: "Almond Milk Based Snacks",
    tags: ["milk dairy", "milk", "lactose intolerance", "vegan"],
    reason: "Plant-based substitute for dairy-containing foods.",
  },
  {
    name: "Coconut Milk Biscuits",
    tags: ["milk dairy", "milk", "lactose intolerance", "vegan"],
    reason: "Non-dairy alternative for milk-sensitive users.",
  },

  // -------------------------
  // Egg allergy / Vegan
  // -------------------------
  {
    name: "Egg-Free Bakery Products",
    tags: ["eggs", "vegan"],
    reason: "Safer alternative for users avoiding egg ingredients.",
  },

  // -------------------------
  // Peanut / Tree nut allergy
  // -------------------------
  {
    name: "Nut-Free Snack Bars",
    tags: ["peanuts", "tree nuts"],
    reason: "Safer alternative for users with nut allergies.",
  },

  // -------------------------
  // Soy allergy
  // -------------------------
  {
    name: "Soy-Free Savory Crackers",
    tags: ["soy"],
    reason: "Better option for users who need to avoid soy ingredients.",
  },

  // -------------------------
  // Gluten / Celiac / Wheat
  // -------------------------
  {
    name: "Gluten-Free Rice Crackers",
    tags: ["wheat gluten", "gluten sensitivity celiac"],
    reason: "Suitable alternative for users avoiding gluten and wheat.",
  },
  {
    name: "Millet-Based Gluten-Free Snacks",
    tags: ["wheat gluten", "gluten sensitivity celiac"],
    reason: "A grain alternative for gluten-sensitive users.",
  },

  // -------------------------
  // Fish / Shellfish allergy
  // -------------------------
  {
    name: "Plant-Based Protein Snacks",
    tags: ["fish", "shellfish", "vegetarian", "vegan"],
    reason: "Safer option for users avoiding seafood ingredients.",
  },

  // -------------------------
  // Sesame / Mustard / Celery / Sulphites / Lupin
  // -------------------------
  {
    name: "Simple Ingredient Crackers",
    tags: ["sesame", "mustard", "celery", "sulphites", "lupin"],
    reason:
      "Products with fewer ingredients may reduce exposure to specific allergens.",
  },

  // -------------------------
  // IBS / GERD / Acidity
  // -------------------------
  {
    name: "Plain Digestive Biscuits",
    tags: ["ibs", "acidity gerd"],
    reason: "Milder snack option compared to spicy or acidic packaged foods.",
  },
  {
    name: "Non-Spicy Rice Cakes",
    tags: ["ibs", "acidity gerd"],
    reason:
      "A simpler alternative for users sensitive to irritating ingredients.",
  },

  // -------------------------
  // Pregnancy / Child / Senior
  // -------------------------
  {
    name: "Low-Additive Plain Snacks",
    tags: ["pregnancy", "child 0 12", "senior 60"],
    reason: "Products with fewer additives may be a safer general choice.",
  },
  {
    name: "Simple Whole Grain Biscuits",
    tags: ["child 0 12", "senior 60"],
    reason: "A simpler and more balanced option than heavily processed snacks.",
  },

  // -------------------------
  // Migraine / Avoid caffeine
  // -------------------------
  {
    name: "Caffeine-Free Snack Bars",
    tags: ["migraine caffeine trigger", "avoid caffeine"],
    reason: "Better option for users trying to avoid caffeine triggers.",
  },
  {
    name: "Herbal / Caffeine-Free Biscuits",
    tags: ["migraine caffeine trigger", "avoid caffeine"],
    reason: "Alternative option without coffee or cola-related ingredients.",
  },

  // -------------------------
  // Vegetarian / Vegan / Eggetarian / Halal / Jain
  // -------------------------
  {
    name: "Vegetarian-Certified Snacks",
    tags: ["vegetarian"],
    reason: "Suitable for users who prefer vegetarian products.",
  },
  {
    name: "Vegan-Certified Products",
    tags: ["vegan"],
    reason: "Suitable for users who prefer plant-based food choices.",
  },
  {
    name: "Egg-Friendly Vegetarian Snacks",
    tags: ["eggetarian"],
    reason: "Suitable for users who consume eggs but avoid meat and fish.",
  },
  {
    name: "Halal-Certified Biscuits",
    tags: ["halal"],
    reason: "Better aligned with halal dietary preferences.",
  },
  {
    name: "Jain Labelled Packaged Foods",
    tags: ["jain no onion garlic"],
    reason: "Suitable for users avoiding onion and garlic.",
  },

  // -------------------------
  // Avoid palm oil / sweeteners / colors / preservatives / MSG
  // -------------------------
  {
    name: "Palm Oil-Free Whole Grain Biscuits",
    tags: ["avoid palm oil"],
    reason: "Better alternative for users wanting to avoid palm oil.",
  },
  {
    name: "Naturally Sweetened Snacks",
    tags: ["avoid artificial sweeteners"],
    reason: "Better choice than products containing artificial sweeteners.",
  },
  {
    name: "Clean Label Snacks",
    tags: ["avoid artificial colors", "avoid preservatives", "avoid msg"],
    reason: "Products with simpler labels may reduce unnecessary additives.",
  },

  // -------------------------
  // High protein goal
  // -------------------------
  {
    name: "High Protein Greek Yogurt",
    tags: ["goal high protein"],
    reason: "A better fit for users aiming to increase protein intake.",
  },
  {
    name: "Protein Bars with Simple Ingredients",
    tags: ["goal high protein"],
    reason: "Convenient alternative for high-protein goals.",
  },
];
