export type ProductCategory = "immersive wax" | "wax drip" | "wet-drip";

export interface MainTestBlock {
  wearRate: number; // mm per 1000 km, lower is better
}

export interface LongevityCondition {
  jumpPoint: number; // km until wear rate accelerates
  wearAllowance: number; // km until chain replacement needed
}

export interface SingleApplicationLongevity {
  dryRoad?: LongevityCondition;
  dryGravel?: LongevityCondition;
  extremeConditions?: LongevityCondition;
}

export interface Product {
  name: string;
  category: ProductCategory;
  costAUD?: number;
  mainTest?: MainTestBlock[]; // 1–6 sequential blocks, never skipped
  longevity?: SingleApplicationLongevity;
}
