import type { ProductCategory } from "./types";

export const PRODUCT_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"] as const;

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  "immersive wax": "#8b5cf6",
  "wax drip": "#3b82f6",
  "wet-drip": "#06b6d4",
  other: "#9a0823",
};
