export type ProductCategory = "immersive wax" | "wax drip" | "wet-drip" | "other";

export interface MainTest {
  blockWear?: MainTestBlock[]; // 1–6 sequential blocks, 1000km each.
  testKilometerEquivalent: number; // How many test kilometers does this performance equate to (higher is better)
  testKilometerCalculationType: string; // One of "have_data_past_hundred_percent_wear" "no_data_past_hundred_test_aborted_early" "test_completed_with_less_than_hundred_percent_wear"
}

export interface MainTestBlock {
  wearRate: number; // percent of chain worn (100% corresponds to  0.5% chain elongation)
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
  note?: string;
  category: ProductCategory;
  costPackageAUD?: number;
  usagesMainTest?: number;
  mainTest?: MainTest;
  longevity?: SingleApplicationLongevity;
}
