// app/(tabs)/result.tsx
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAgentContext } from "../../src/agent/AgentContext";
import ADDITIVES_DB from "../../src/data/e_additives.json";
import { buildRecommendationsFromProfile } from "../../src/rules/recommendations";
import { buildWarningsFromProfile } from "../../src/rules/warnings";
import { saveHistory } from "../../src/services/history";
import { getAuthUser } from "../../src/storage/auth";
import { getProfile as loadProfile } from "../../src/storage/profile";

type OFFResponse = {
  status: number;
  product?: any;
};

type RecommendationItem = {
  name: string;
  reason: string;
};

function gradeLabel(grade?: string) {
  const g = (grade || "").toLowerCase();
  const map: Record<string, string> = {
    a: "Best nutritional quality",
    b: "Good nutritional quality",
    c: "Average nutritional quality",
    d: "Lower nutritional quality",
    e: "Poor nutritional quality",
  };
  return map[g] || "Unavailable";
}

function gradeColor(grade?: string) {
  const g = (grade || "").toLowerCase();
  if (g === "a") return "#16a34a";
  if (g === "b") return "#22c55e";
  if (g === "c") return "#facc15";
  if (g === "d") return "#fb923c";
  if (g === "e") return "#ef4444";
  return "#111827";
}

function levelColor(level?: string) {
  const x = (level || "").toLowerCase();
  if (x === "high") return "#ef4444";
  if (x === "moderate") return "#f59e0b";
  if (x === "low") return "#22c55e";
  return "#9ca3af";
}

function formatNum(x: any, digits = 2) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(digits).replace(/\.00$/, "");
}

function nutrVal(nutr: any, key: string, unit?: string) {
  const v100 = nutr?.[`${key}_100g`];
  const vsrv = nutr?.[`${key}_serving`];
  const u = unit ?? nutr?.[`${key}_unit`] ?? "";
  return {
    per100g: v100 !== undefined ? `${formatNum(v100)} ${u}`.trim() : "",
    perServing: vsrv !== undefined ? `${formatNum(vsrv)} ${u}`.trim() : "",
  };
}

function scoreFromOcr(rawText: string, additives: string[]) {
  const t = (rawText || "").toLowerCase();
  let penalty = 0;

  penalty += Math.min(additives.length, 10);

  if (t.includes("sugar") || t.includes("glucose") || t.includes("syrup")) {
    penalty += 3;
  }
  if (t.includes("salt") || t.includes("sodium")) {
    penalty += 3;
  }
  if (t.includes("hydrogenated") || t.includes("trans fat")) {
    penalty += 4;
  }

  if (penalty <= 2) {
    return { level: "Low", reason: "Low additives and low risk signals" };
  }
  if (penalty <= 5) {
    return { level: "Moderate", reason: "Some additives or mild risk signals" };
  }
  if (penalty <= 8) {
    return {
      level: "Moderate",
      reason: "Moderate additives and moderate risk signals",
    };
  }
  return { level: "High", reason: "High additives or strong risk signals" };
}

function parseAllergensOFF(product: any) {
  const tags: string[] = Array.isArray(product?.allergens_tags)
    ? product.allergens_tags
    : [];
  return tags.map((t) => String(t).replace(/^..:/, "").toUpperCase());
}

function parseAdditivesOFF(product: any) {
  const tags: string[] = Array.isArray(product?.additives_tags)
    ? product.additives_tags
    : [];
  return tags.map((t) => String(t).replace(/^..:/, "").toUpperCase());
}

function parseIngredientsOFF(product: any) {
  const txt =
    product?.ingredients_text_en ||
    product?.ingredients_text ||
    product?.ingredients_text_with_allergens ||
    "";

  const listFromArray: string[] = Array.isArray(product?.ingredients)
    ? product.ingredients.map((i: any) => i?.text).filter(Boolean)
    : [];

  return {
    ingredientsText: String(txt || "").trim(),
    ingredientsList: listFromArray,
  };
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.sectionWrap}>
      <Pressable
        onPress={() => setOpen((p) => !p)}
        style={styles.sectionHeader}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionChevron}>{open ? "▴" : "▾"}</Text>
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

function safeArray(value: any): string[] {
  return Array.isArray(value) ? value.map((x) => String(x)) : [];
}

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    barcode?: string;
    mode?: string;
  }>();

  const { setContext, labelResult } = useAgentContext();

  const mode = params?.mode ? String(params.mode) : "barcode";
  const barcode = params?.barcode ? String(params.barcode) : "";

  const labelImageUri = labelResult?.imageUri || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);

  const [warnings, setWarnings] = useState<string[]>([]);
  const [warningsLoading, setWarningsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(
    [],
  );

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        if (mode === "label") {
          setProduct(null);
          setLoading(false);
          return;
        }

        if (!barcode) {
          setError("No barcode received.");
          setLoading(false);
          return;
        }

        const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
          barcode,
        )}.json`;

        const res = await fetch(url);
        const data: OFFResponse = await res.json();

        if (!mounted) return;

        if (data.status !== 1 || !data.product) {
          setProduct(null);
          setError("Product not found in OpenFoodFacts.");
        } else {
          setProduct(data.product);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load product.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [mode, barcode]);

  const barcodeUI = useMemo(() => {
    const p = product || {};
    const nutriGrade = (p?.nutriscore_grade || "").toUpperCase();

    const { ingredientsText, ingredientsList } = parseIngredientsOFF(p);
    const allergens = parseAllergensOFF(p);
    const additives = parseAdditivesOFF(p);

    const productName = p?.product_name || p?.product_name_en || "Product";
    const brand = p?.brands || "";
    const quantity = p?.quantity || "";

    const imageFront =
      p?.image_front_url ||
      p?.image_url ||
      p?.selected_images?.front?.display?.en ||
      null;

    return {
      nutriGrade,
      productName,
      brand,
      quantity,
      ingredientsText,
      ingredientsList,
      allergens,
      additives,
      nutriments: p?.nutriments || {},
      nutrientLevels: p?.nutrient_levels || {},
      imageFront,
    };
  }, [product]);

  const labelMatchedProduct = labelResult?.matched_product || null;
  const labelMatchedGrade = (
    labelMatchedProduct?.nutri_grade || ""
  ).toUpperCase();
  const labelMatchedImage = labelMatchedProduct?.image || null;
  const labelMatchedName =
    labelMatchedProduct?.product_name || "Scanned Label Product";

  useEffect(() => {
    let mounted = true;

    async function runWarnings(payload: any) {
      setWarningsLoading(true);
      try {
        const profile = await loadProfile();

        const w = buildWarningsFromProfile(profile, payload);
        const rec = buildRecommendationsFromProfile(profile, payload);

        if (mounted) {
          setWarnings(Array.isArray(w) ? w : []);
          setRecommendations(Array.isArray(rec) ? rec : []);
        }
      } catch {
        if (mounted) {
          setWarnings([]);
          setRecommendations([]);
        }
      } finally {
        if (mounted) setWarningsLoading(false);
      }
    }

    if (mode === "label") {
      if (!labelResult) return;

      const raw = (labelResult.raw_text || "").toUpperCase();

      runWarnings({
        allergens: labelResult.allergens || [],
        ingredients: [...(labelResult.ingredients || []), raw],
        additives: labelResult.additives || [],
        nutrition: {},
      });
    }

    if (mode === "barcode" && product) {
      const nutr = barcodeUI.nutriments || {};
      runWarnings({
        allergens: barcodeUI.allergens,
        ingredients: barcodeUI.ingredientsText
          ? [barcodeUI.ingredientsText]
          : barcodeUI.ingredientsList,
        additives: barcodeUI.additives,
        nutrition: {
          sugars_g: String(nutr?.sugars_100g ?? nutr?.sugars ?? ""),
          salt_g: String(nutr?.salt_100g ?? nutr?.salt ?? ""),
          sodium_g: String(nutr?.sodium_100g ?? nutr?.sodium ?? ""),
          sat_fat_g: String(
            nutr?.["saturated-fat_100g"] ?? nutr?.["saturated-fat"] ?? "",
          ),
        },
      });
    }

    return () => {
      mounted = false;
    };
  }, [mode, labelResult, product, barcodeUI]);

  useEffect(() => {
    let mounted = true;

    async function syncAgentContext() {
      try {
        const authUser = await getAuthUser();
        const userId = authUser?.user_id;

        if (!mounted) return;

        if (mode === "label" && labelResult) {
          setContext({
            user_id: userId,
            mode: "label",
            productName: labelMatchedName,
            nutriGrade: labelMatchedGrade || "",
            ingredients: labelResult.ingredients || [],
            allergens: labelResult.allergens || [],
            additives: labelResult.additives || [],
            warnings,
            recommendations,
            rawText: labelResult.raw_text || "",
          });
          return;
        }

        if (mode === "barcode" && product) {
          setContext({
            user_id: userId,
            mode: "barcode",
            barcode,
            productName: barcodeUI.productName || "Product",
            nutriGrade: barcodeUI.nutriGrade || "",
            ingredients: barcodeUI.ingredientsText
              ? [barcodeUI.ingredientsText]
              : barcodeUI.ingredientsList,
            allergens: barcodeUI.allergens || [],
            additives: barcodeUI.additives || [],
            warnings,
            recommendations,
            rawText: "",
          });
          return;
        }

        setContext({
          user_id: userId,
          mode: "home",
          barcode: "",
          productName: "",
          nutriGrade: "",
          ingredients: [],
          allergens: [],
          additives: [],
          warnings: [],
          recommendations: [],
          rawText: "",
        });
      } catch (e) {
        console.log("Failed to sync chatbot context:", e);
      }
    }

    syncAgentContext();

    return () => {
      mounted = false;
    };
  }, [
    mode,
    labelResult,
    labelMatchedName,
    labelMatchedGrade,
    product,
    barcode,
    barcodeUI.productName,
    barcodeUI.nutriGrade,
    barcodeUI.ingredientsText,
    barcodeUI.ingredientsList,
    barcodeUI.allergens,
    barcodeUI.additives,
    warnings,
    recommendations,
    setContext,
  ]);

  useEffect(() => {
    let mounted = true;

    async function saveScanToHistory() {
      try {
        const authUser = await getAuthUser();
        const userId = authUser?.user_id;

        if (!mounted || !userId) return;

        if (mode === "barcode" && product) {
          const productKey = barcode
            ? `barcode:${barcode}`
            : `barcode:${barcodeUI.productName}`;

          await saveHistory({
            user_id: userId,
            product_key: productKey,
            mode: "barcode",
            product_name: barcodeUI.productName || "Product",
            barcode: barcode || "",
            image_url: barcodeUI.imageFront || "",
            nutri_grade: barcodeUI.nutriGrade || "",
            ingredients: barcodeUI.ingredientsText
              ? [barcodeUI.ingredientsText]
              : barcodeUI.ingredientsList,
            allergens: barcodeUI.allergens || [],
            additives: barcodeUI.additives || [],
            warnings,
            recommendations,
            raw_text: "",
          });
        }

        if (mode === "label" && labelResult) {
          const productKey = labelMatchedProduct?.barcode
            ? `label:${labelMatchedProduct.barcode}`
            : `label:${labelMatchedName}:${(labelResult.raw_text || "").slice(0, 50)}`;

          await saveHistory({
            user_id: userId,
            product_key: productKey,
            mode: "label",
            product_name: labelMatchedName || "Scanned Label Product",
            barcode: labelMatchedProduct?.barcode || "",
            image_url: labelMatchedImage || labelImageUri || "",
            nutri_grade: labelMatchedGrade || "",
            ingredients: labelResult.ingredients || [],
            allergens: labelResult.allergens || [],
            additives: labelResult.additives || [],
            warnings,
            recommendations,
            raw_text: labelResult.raw_text || "",
          });
        }
      } catch (e) {
        console.log("History save failed:", e);
      }
    }

    saveScanToHistory();

    return () => {
      mounted = false;
    };
  }, [
    mode,
    product,
    barcode,
    barcodeUI.productName,
    barcodeUI.imageFront,
    barcodeUI.nutriGrade,
    barcodeUI.ingredientsText,
    barcodeUI.ingredientsList,
    barcodeUI.allergens,
    barcodeUI.additives,
    labelResult,
    labelMatchedName,
    labelMatchedGrade,
    labelMatchedImage,
    labelImageUri,
    labelMatchedProduct,
    warnings,
    recommendations,
  ]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, fontWeight: "700" }}>Oops</Text>
        <Text style={{ marginTop: 8, textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  if (mode === "label") {
    if (!labelResult) {
      return (
        <View style={styles.center}>
          <Text style={{ fontSize: 16, fontWeight: "700" }}>Oops</Text>
          <Text style={{ marginTop: 8, textAlign: "center" }}>
            No label scan data found. Please scan the label again.
          </Text>
        </View>
      );
    }

    const raw = labelResult.raw_text || "";
    const ingredients = safeArray(labelResult.ingredients);
    const allergens = safeArray(labelResult.allergens);
    const additives = safeArray(labelResult.additives);

    const score = scoreFromOcr(raw, additives);
    const hasRealMatch = !!labelMatchedGrade;

    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {hasRealMatch ? labelMatchedName : "Label Scan Result"}
          </Text>
          <Text style={styles.headerSub}>
            {hasRealMatch ? "Matched with OpenFoodFacts" : "OCR-based analysis"}
          </Text>
          {labelMatchedProduct?.brand ? (
            <Text style={styles.headerBarcode}>
              Brand: {labelMatchedProduct.brand}
            </Text>
          ) : null}
        </View>

        {labelMatchedImage ? (
          <View style={styles.imageCard}>
            <Text style={styles.imageLabel}>Matched product image</Text>
            <Image
              source={{ uri: labelMatchedImage }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        ) : labelImageUri ? (
          <View style={styles.imageCard}>
            <Text style={styles.imageLabel}>Uploaded label image</Text>
            <Image
              source={{ uri: labelImageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        ) : null}

        {hasRealMatch ? (
          <View style={styles.nutriBox}>
            <Text style={styles.nutriTitle}>Nutri-Score</Text>
            <View style={styles.nutriRow}>
              <View
                style={[
                  styles.gradeBadge,
                  { backgroundColor: gradeColor(labelMatchedGrade) },
                ]}
              >
                <Text style={styles.gradeText}>{labelMatchedGrade || "?"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nutriScoreLine}>
                  Nutri-Score {labelMatchedGrade || "Unavailable"}
                </Text>
                <Text style={styles.nutriDesc}>
                  {gradeLabel(labelMatchedGrade)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.nutriBox}>
            <Text style={styles.nutriTitle}>Estimated OCR Risk</Text>
            <View style={styles.nutriRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nutriScoreLine}>
                  Risk Level: {score.level}
                </Text>
                <Text style={styles.nutriDesc}>{score.reason}</Text>
                <Text
                  style={[styles.nutriDesc, { marginTop: 6, fontSize: 12 }]}
                >
                  This is an estimate based on OCR-detected text.
                </Text>
              </View>
            </View>
          </View>
        )}

        <Section title="Ingredients" defaultOpen>
          {ingredients.length ? (
            ingredients.map((ing, idx) => (
              <Text key={`${ing}-${idx}`} style={styles.paragraph}>
                • {ing}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>
              No ingredients detected. Try a clearer cropped image focused on
              the ingredients section.
            </Text>
          )}
        </Section>

        <Section title="Allergens" defaultOpen>
          {allergens.length ? (
            <Text style={styles.paragraph}>{allergens.join(", ")}</Text>
          ) : (
            <Text style={styles.muted}>No allergens detected from text.</Text>
          )}
        </Section>

        <Section title="Additives" defaultOpen>
          {additives.length ? (
            additives.map((a, idx) => {
              const code = String(a).toUpperCase();
              const info = (ADDITIVES_DB as any)[code];

              return (
                <View key={`${code}-${idx}`} style={{ marginTop: 12 }}>
                  <Text style={{ fontWeight: "900", color: "#111" }}>
                    {code}
                    {info?.name ? ` — ${info.name}` : ""}
                  </Text>

                  {info?.risk_level ? (
                    <Text style={{ color: "#444", marginTop: 2 }}>
                      Risk: {info.risk_level}
                    </Text>
                  ) : null}

                  <Text style={{ color: "#222", marginTop: 6, lineHeight: 20 }}>
                    {info?.description
                      ? info.description
                      : "Details not available yet."}
                  </Text>

                  {info?.safety_notes || info?.note ? (
                    <Text style={{ color: "#b45309", marginTop: 6 }}>
                      ⚠ {info?.safety_notes || info?.note}
                    </Text>
                  ) : null}
                </View>
              );
            })
          ) : (
            <Text style={styles.muted}>No additives detected.</Text>
          )}
        </Section>

        {warningsLoading ? (
          <View style={styles.warnBox}>
            <Text style={styles.warnTitle}>Checking profile warnings…</Text>
          </View>
        ) : warnings.length ? (
          <View style={styles.warnBox}>
            <Text style={styles.warnTitle}>Warnings for Your Profile</Text>
            {warnings.map((w, i) => (
              <Text key={i} style={styles.warnLine}>
                • {w}
              </Text>
            ))}
          </View>
        ) : null}

        {recommendations.length ? (
          <View style={styles.nutriBox}>
            <Text style={styles.nutriTitle}>Healthier Recommendations</Text>

            {recommendations.map((r, i) => (
              <View key={i} style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: "900", color: "#111" }}>
                  • {r.name}
                </Text>
                <Text style={styles.paragraph}>{r.reason}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  const nutr = barcodeUI.nutriments || {};
  const nutrientLevels = barcodeUI.nutrientLevels || {};

  const nutritionRows = [
    { label: "Energy (kcal)", key: "energy-kcal" },
    { label: "Fat", key: "fat" },
    { label: "Saturated fat", key: "saturated-fat" },
    { label: "Carbohydrates", key: "carbohydrates" },
    { label: "Sugars", key: "sugars" },
    { label: "Fiber", key: "fiber" },
    { label: "Proteins", key: "proteins" },
    { label: "Salt", key: "salt" },
    { label: "Sodium", key: "sodium" },
  ];

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{barcodeUI.productName}</Text>
        <Text style={styles.headerSub}>
          {barcodeUI.brand ? `Brand: ${barcodeUI.brand}` : ""}
          {barcodeUI.brand && barcodeUI.quantity ? " • " : ""}
          {barcodeUI.quantity ? `Qty: ${barcodeUI.quantity}` : ""}
        </Text>
        <Text style={styles.headerBarcode}>Barcode: {barcode}</Text>
      </View>

      {barcodeUI.imageFront ? (
        <View style={styles.imageCard}>
          <Text style={styles.imageLabel}>Product image</Text>
          <Image
            source={{ uri: barcodeUI.imageFront }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      ) : null}

      <View style={styles.nutriBox}>
        <Text style={styles.nutriTitle}>Nutri-Score</Text>
        <View style={styles.nutriRow}>
          <View
            style={[
              styles.gradeBadge,
              { backgroundColor: gradeColor(barcodeUI.nutriGrade) },
            ]}
          >
            <Text style={styles.gradeText}>{barcodeUI.nutriGrade || "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nutriScoreLine}>
              Nutri-Score {barcodeUI.nutriGrade || "Unavailable"}
            </Text>
            <Text style={styles.nutriDesc}>
              {gradeLabel(barcodeUI.nutriGrade)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.nutriBox}>
        <Text style={styles.nutriTitle}>Nutrient levels</Text>

        {["fat", "saturated-fat", "sugars", "salt"].map((k) => {
          const level = nutrientLevels?.[k];
          const val = nutrVal(nutr, k);
          const label =
            k === "saturated-fat"
              ? "Saturated fat"
              : k.charAt(0).toUpperCase() + k.slice(1);

          return (
            <View key={k} style={styles.levelRow}>
              <View
                style={[styles.dot, { backgroundColor: levelColor(level) }]}
              />
              <Text style={styles.levelText}>
                {label}: {level || "unknown"}
                {val.per100g ? ` (${val.per100g} / 100g)` : ""}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.nutriBox}>
        <Text style={styles.nutriTitle}>Nutrition facts</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.4 }]}>Nutrient</Text>
          <Text style={[styles.th, { flex: 1 }]}>Per 100g</Text>
          <Text style={[styles.th, { flex: 1 }]}>Per serving</Text>
        </View>

        {nutritionRows.map((r) => {
          const v = nutrVal(nutr, r.key);
          if (!v.per100g && !v.perServing) return null;

          return (
            <View key={r.key} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 1.4, fontWeight: "700" }]}>
                {r.label}
              </Text>
              <Text style={[styles.td, { flex: 1 }]}>{v.per100g || "-"}</Text>
              <Text style={[styles.td, { flex: 1 }]}>
                {v.perServing || "-"}
              </Text>
            </View>
          );
        })}
      </View>

      <Section title="Ingredients" defaultOpen>
        {barcodeUI.ingredientsText ? (
          <Text style={styles.paragraph}>{barcodeUI.ingredientsText}</Text>
        ) : barcodeUI.ingredientsList.length ? (
          <Text style={styles.paragraph}>
            {barcodeUI.ingredientsList.join(", ")}
          </Text>
        ) : (
          <Text style={styles.muted}>No ingredients listed.</Text>
        )}
      </Section>

      <Section title="Additives" defaultOpen>
        {barcodeUI.additives.length ? (
          barcodeUI.additives.map((a: string, idx: number) => {
            const code = String(a).toUpperCase();
            const info = (ADDITIVES_DB as any)[code];

            return (
              <View key={`${code}-${idx}`} style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: "900", color: "#111" }}>
                  {code}
                  {info?.name ? ` — ${info.name}` : ""}
                </Text>

                {info?.risk_level ? (
                  <Text style={{ color: "#444", marginTop: 2 }}>
                    Risk: {info.risk_level}
                  </Text>
                ) : null}

                <Text style={{ color: "#222", marginTop: 6, lineHeight: 20 }}>
                  {info?.description
                    ? info.description
                    : "Details not available yet."}
                </Text>

                {info?.safety_notes || info?.note ? (
                  <Text style={{ color: "#b45309", marginTop: 6 }}>
                    ⚠ {info?.safety_notes || info?.note}
                  </Text>
                ) : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.muted}>No additives listed.</Text>
        )}
      </Section>

      {warningsLoading ? (
        <View style={styles.warnBox}>
          <Text style={styles.warnTitle}>Checking profile warnings…</Text>
        </View>
      ) : warnings.length ? (
        <View style={styles.warnBox}>
          <Text style={styles.warnTitle}>Warnings for Your Profile</Text>
          {warnings.map((w, i) => (
            <Text key={i} style={styles.warnLine}>
              • {w}
            </Text>
          ))}
        </View>
      ) : null}

      {recommendations.length ? (
        <View style={styles.nutriBox}>
          <Text style={styles.nutriTitle}>Healthier Recommendations</Text>

          {recommendations.map((r, i) => (
            <View key={i} style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "900", color: "#111" }}>
                • {r.name}
              </Text>
              <Text style={styles.paragraph}>{r.reason}</Text>
            </View>
          ))}
        </View>
      ) : null}
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

  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  headerSub: { marginTop: 4, color: "#444" },
  headerBarcode: { marginTop: 2, color: "#666", fontSize: 12 },

  warnBox: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  warnTitle: { fontWeight: "900", color: "#991b1b", marginBottom: 6 },
  warnLine: { color: "#7f1d1d", marginTop: 4 },

  imageCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e7e7e7",
  },
  imageLabel: { fontSize: 12, color: "#666", marginBottom: 8 },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    backgroundColor: "#fafafa",
  },

  nutriBox: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e7e7e7",
  },
  nutriTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  nutriRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  gradeBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  nutriScoreLine: { fontSize: 14, fontWeight: "800", color: "#111" },
  nutriDesc: { marginTop: 2, color: "#555" },

  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  dot: { width: 14, height: 14, borderRadius: 999 },
  levelText: { color: "#111", fontWeight: "700" },

  tableHeader: {
    marginTop: 8,
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  th: { color: "#555", fontWeight: "900", fontSize: 12 },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f1f1f1",
  },
  td: { color: "#111", fontSize: 13 },

  sectionWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    overflow: "hidden",
  },
  sectionHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#111" },
  sectionChevron: { fontSize: 16, color: "#444" },
  sectionBody: { paddingHorizontal: 14, paddingBottom: 14 },

  muted: { color: "#666" },
  paragraph: { color: "#222", marginTop: 6, lineHeight: 20 },
});
