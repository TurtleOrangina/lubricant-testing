import type { ProductCategory, SingleApplicationLongevity } from "./types";

export type ConditionKey = keyof SingleApplicationLongevity;

export const LONGEVITY_CONDITIONS: { key: ConditionKey; label: string }[] = [
  { key: "dryRoad", label: "Dry Road Conditions" },
  { key: "dryGravel", label: "Dry Gravel / MTB / CX" },
  { key: "extremeConditions", label: "Extreme Conditions" },
];

export const PRODUCT_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"] as const;

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  "immersive wax": "#8b5cf6",
  "wax drip": "#3b82f6",
  "wet-drip": "#06b6d4",
  other: "#9a0823",
};

export const BLOCK_LABELS: Record<number, string> = {
  0: "Block 1 – No Contamination",
  1: "Block 2 – Dry Offroad",
  2: "Block 3 – No Contamination",
  3: "Block 4 – Wet Conditions",
  4: "Block 5 – No Contamination",
  5: "Block 6 – Harsh Wet",
};

export const BLOCK_DESCRIPTIONS: Record<number, string> = {
  0: "1000km dry and clean (no water and no contamination). Includes 2 re lubrication points.",
  1: "1000km dry dust contamination. At 7 points dry dust is added, and 7 re lubrications are done.",
  2: "1000km dry and clean. Includes 3 re lubrication points. Tests clearing of left over contamination from Block 2.",
  3: "1000km wet contamination. At 7 points wet contamination is added, and 7 re lubrications are done.",
  4: "1000km dry and clean. Includes 3 re lubrication points. Tests clearing of left over contamination from Block 4.",
  5: "1000km extreme wet contamination. At 14 points wet contamination is added, and 7 re lubrications are done.",
};
