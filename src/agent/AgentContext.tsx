import React, { createContext, useContext, useMemo, useState } from "react";

export type RecommendationItem = {
  name: string;
  reason: string;
};

export type MatchedProduct = {
  product_name?: string;
  brand?: string;
  barcode?: string;
  nutri_grade?: string;
  image?: string;
};

export type LabelScanResult = {
  raw_text?: string;
  ingredients?: string[];
  allergens?: string[];
  additives?: string[];
  imageUri?: string | null;
  matched_product?: MatchedProduct | null;
};

export type AgentContextPayload = {
  user_id?: number;
  mode?: "barcode" | "label" | "home";
  barcode?: string;
  productName?: string;
  nutriGrade?: string;
  ingredients?: string[];
  allergens?: string[];
  additives?: string[];
  warnings?: string[];
  recommendations?: RecommendationItem[];
  rawText?: string;
};

type AgentCtx = {
  context: AgentContextPayload;
  setContext: (c: AgentContextPayload) => void;

  labelResult: LabelScanResult | null;
  setLabelResult: (v: LabelScanResult | null) => void;
};

const Ctx = createContext<AgentCtx | null>(null);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<AgentContextPayload>({
    mode: "home",
    user_id: undefined,
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

  const [labelResult, setLabelResult] = useState<LabelScanResult | null>(null);

  const value = useMemo(
    () => ({
      context,
      setContext,
      labelResult,
      setLabelResult,
    }),
    [context, labelResult],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAgentContext() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAgentContext must be used inside AgentProvider");
  return v;
}
