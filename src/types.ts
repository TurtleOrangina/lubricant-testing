export type ProductCategory = "immersive wax" | "wax drip" | "rub on wax" | "wet-drip" | "other";

/** Whether all six blocks were tested, or the missing ones had to be extrapolated. */
export type MainTestCalculationType = "test_completed" | "extrapolated_blocks";

export interface MainTest {
  blockWear?: MainTestBlock[]; // 1–6 sequential blocks, 1000km each.
  testKilometerEquivalent: number; // How many test kilometers does this performance equate to (higher is better)
  testKilometerCalculationType: MainTestCalculationType;
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
