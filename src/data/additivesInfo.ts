export type AdditiveInfo = {
  eno: string; // E322
  chemical_name: string;
  name: string; // Lecithins
  category?: string; // Emulsifier
  description?: string; // Helps mix ingredients
  risk_level?: string;
  safety_notes?: string; // Simple caution line
};

export const ADDITIVES_INFO: Record<string, AdditiveInfo> = {
  E100: {
    eno: "E100",
    chemical_name: "Curcumin",
    name: "Curcumin",
    category: "Color",
    description:
      "Natural yellow color from turmeric. Mostly used to give foods a yellow tone; it does not add sugar or salt, but it is a marker of processed foods when used in packaged snacks.",
    risk_level: "low",
    safety_notes: "Generally considered safe at normal food levels.",
  },
  E101: {
    eno: "E101",
    chemical_name: "Riboflavin",
    name: "Riboflavin (Vitamin B2)",
    category: "Color",
    description:
      "Vitamin B2 used as a yellow coloring. It is a nutrient and does not increase sugar or salt; commonly found in fortified foods.",
    risk_level: "low",
    safety_notes: "Usually safe; it is a vitamin.",
  },
  E110: {
    eno: "E110",
    chemical_name: "Sunset Yellow FCF",
    name: "Sunset Yellow FCF",
    category: "Color",
    description:
      "Synthetic orange-yellow dye used in soft drinks, candy, and snacks. Often appears in sugary products—so the bigger concern is usually the high sugar rather than the dye itself.",
    risk_level: "high",
    safety_notes:
      "May trigger sensitivity in some people; many prefer to limit synthetic dyes, especially for children.",
  },
  E120: {
    eno: "E120",
    chemical_name: "Carminic acid",
    name: "Cochineal / Carmines",
    category: "Color",
    description:
      "Red coloring made from insects. Used in flavored yogurts, sweets, and drinks; the color itself is the additive, but the food item may still be high in sugar.",
    risk_level: "moderate",
    safety_notes:
      "Not vegetarian/vegan; can trigger allergies in some individuals.",
  },
  E150D: {
    eno: "E150D",
    chemical_name: "Caramel color (sulfite ammonia process)",
    name: "Caramel Color (Sulphite Ammonia)",
    category: "Color",
    description:
      "Dark brown caramel coloring used in colas and sauces. If you see this in cola, the bigger health issue is usually high sugar and acidity (teeth/gut).",
    risk_level: "moderate",
    safety_notes:
      "Common in colas; sulphite-sensitive users should be cautious.",
  },
  E200: {
    eno: "E200",
    chemical_name: "Sorbic acid",
    name: "Sorbic Acid",
    category: "Preservative",
    description:
      "Prevents mold and yeast growth to increase shelf life. This does not increase sugar or salt, but it is common in packaged foods.",
    risk_level: "moderate",
    safety_notes:
      "Generally safe in regulated amounts; very sensitive people may notice irritation.",
  },
  E211: {
    eno: "E211",
    chemical_name: "Sodium benzoate",
    name: "Sodium Benzoate",
    category: "Preservative",
    description:
      "Preservative used mostly in acidic drinks and sauces. Often found in soft drinks—so the bigger concern is usually high sugar and frequent intake.",
    risk_level: "moderate",
    safety_notes:
      "Some people may be sensitive; if headaches/skin reactions occur, reduce intake.",
  },
  E220: {
    eno: "E220",
    chemical_name: "Sulfur dioxide",
    name: "Sulphur Dioxide",
    category: "Preservative",
    description:
      "Preservative used in dried fruits, juices, and wines to prevent browning and spoilage. Can trigger breathing issues in sulfite-sensitive people.",
    risk_level: "high",
    safety_notes:
      "Sulphites can trigger asthma-like symptoms in sensitive people.",
  },
  E250: {
    eno: "E250",
    chemical_name: "Sodium nitrite",
    name: "Sodium Nitrite",
    category: "Preservative",
    description:
      "Used in processed meats to prevent dangerous bacteria and maintain pink color. The main risk is frequent processed meat intake.",
    risk_level: "high",
    safety_notes:
      "Limit processed meats; not recommended frequently for long-term health.",
  },
  E300: {
    eno: "E300",
    chemical_name: "Ascorbic acid",
    name: "Ascorbic Acid (Vitamin C)",
    category: "Antioxidant",
    description:
      "Vitamin C used to prevent oxidation (keeps foods from browning/staling). It does not increase sugar or salt.",
    risk_level: "low",
    safety_notes: "Generally safe; it’s vitamin C.",
  },
  E322: {
    eno: "E322",
    chemical_name: "Lecithins",
    name: "Lecithins",
    category: "Emulsifier",
    description:
      "Helps oil and water mix so food stays smooth and doesn’t separate (common in chocolate and bakery). In some products it may indicate ultra-processed formulation.",
    risk_level: "moderate",
    safety_notes:
      "Often derived from soy or sunflower; soy-allergic users should be cautious.",
  },
  E420: {
    eno: "E420",
    chemical_name: "Sorbitol",
    name: "Sorbitol",
    category: "Sweetener / Humectant",
    description:
      "Sugar alcohol used in sugar-free gums/candies and to retain moisture. It can cause bloating or loose stools when consumed in large amounts.",
    risk_level: "moderate",
    safety_notes: "High intake may cause laxative effect or gas/bloating.",
  },
  E621: {
    eno: "E621",
    chemical_name: "Monosodium glutamate",
    name: "Monosodium Glutamate (MSG)",
    category: "Flavor Enhancer",
    description:
      "Boosts savory (umami) taste in seasonings, noodles, and snacks. Usually safe for most people, but some report sensitivity.",
    risk_level: "moderate",
    safety_notes:
      "Sensitivity is uncommon; if headaches/flushing occur, reduce intake.",
  },
};
