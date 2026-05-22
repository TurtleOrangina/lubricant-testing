import type { ProductCategory, SingleApplicationLongevity } from "./types";

export type ConditionKey = keyof SingleApplicationLongevity;

export const LONGEVITY_CONDITIONS: { key: ConditionKey; label: string }[] = [
  { key: "dryRoad", label: "Dry Road Conditions" },
  { key: "dryGravel", label: "Dry Gravel / MTB / CX" },
  { key: "extremeConditions", label: "Extreme Conditions" },
];

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  "immersive wax": "#ff98ff",
  "wax drip": "#ffa600",
  "wet-drip": "#00ffff",
  other: "#f4ff13",
};

export const BLOCK_LABELS: Record<number, string> = {
  0: "Block 1 (clean)",
  1: "Block 2 (dry dirt)",
  2: "Block 3 (clean)",
  3: "Block 4 (wet dirt)",
  4: "Block 5 (clean)",
  5: "Block 6 (harsh wet)",
};

export const DEFAULT_DRIVETRAIN_COST = 250;

export const BLOCK_DESCRIPTIONS: Record<number, string> = {
  0: "1000km dry and clean (no water and no contamination). Includes 3 re lubrication points (or 1 for extended intervals)",
  1: "1000km dry dust contamination. At 7 points dry dust is added, and 6 re lubrications are done (or 2 for extended intervals).",
  2: "1000km dry and clean. Includes 3 re lubrication points (or 1 for extended intervals). Tests clearing of left over contamination from Block 2.",
  3: "1000km wet contamination. At 7 points wet contamination is added, and 6 re lubrications are done (or 2 for extended intervals).",
  4: "1000km dry and clean. Includes 3 re lubrication points (or 1 for extended intervals). Tests clearing of left over contamination from Block 4.",
  5: "1000km extreme wet contamination. At 14 points wet contamination is added, and 6 re lubrications are done (or 3 for extended intervals).",
};
