const BACKEND_BASE = "http://10.210.177.59:8000";

export type HistoryRecommendation = {
  name: string;
  reason: string;
};

export type HistoryItem = {
  id: number;
  user_id: number;
  product_key: string;
  mode: "barcode" | "label";
  product_name: string;
  barcode: string;
  image_url: string;
  nutri_grade: string;
  ingredients: string[];
  allergens: string[];
  additives: string[];
  warnings: string[];
  recommendations: HistoryRecommendation[];
  raw_text: string;
  scan_count: number;
  created_at: string;
  updated_at: string;
};

export async function saveHistory(payload: {
  user_id: number;
  product_key: string;
  mode: "barcode" | "label";
  product_name: string;
  barcode?: string;
  image_url?: string;
  nutri_grade?: string;
  ingredients?: string[];
  allergens?: string[];
  additives?: string[];
  warnings?: string[];
  recommendations?: HistoryRecommendation[];
  raw_text?: string;
}) {
  const res = await fetch(`${BACKEND_BASE}/history/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data?.ok) {
    throw new Error(data?.error || "Failed to save history");
  }

  return data;
}

export async function getHistory(userId: number): Promise<HistoryItem[]> {
  const res = await fetch(`${BACKEND_BASE}/history/${userId}`);
  const data = await res.json();

  if (!data?.ok) {
    throw new Error(data?.error || "Failed to fetch history");
  }

  return Array.isArray(data.items) ? data.items : [];
}
