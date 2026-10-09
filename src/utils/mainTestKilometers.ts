import type { MainTestCalculationType, ProductCategory } from "../types.ts";

export const MAIN_TEST_BLOCK_KM = 1000;
export const MAIN_TEST_BLOCK_COUNT = 6;
export const MAIN_TEST_KM = MAIN_TEST_BLOCK_KM * MAIN_TEST_BLOCK_COUNT;

/**
 * Estimates the wear of a block that was never tested from an earlier block of
 * the same product: `wear = wear(fromBlock) × factor + offset`.
 */
export interface BlockExtrapolation {
  /** 1-based block number the estimate is derived from. */
  fromBlock: number;
  factor?: number;
  offset?: number;
}

/**
 * Per-category extrapolation rules, keyed by the 1-based block they estimate.
 * Taken from the "Extrapolation update" notes of the Main Test workbook
 * (Test-Main-DATA-Oct-2026), where they are derived from the average results
 * of lubricants of the same type that were physically tested in that block.
 */
export const BLOCK_EXTRAPOLATIONS: Partial<
  Record<ProductCategory, Partial<Record<number, BlockExtrapolation>>>
> = {
  "wet-drip": {
    2: { fromBlock: 1, offset: 0.283 },
    3: { fromBlock: 2, offset: -0.143 },
    4: { fromBlock: 2, offset: 0.261 },
    5: { fromBlock: 3 },
    6: { fromBlock: 4, factor: 1.5 },
  },
  "wax drip": {
    3: { fromBlock: 2, offset: -0.03 },
    4: { fromBlock: 2, offset: 0.302 },
    5: { fromBlock: 4, offset: -0.161 },
    6: { fromBlock: 4, offset: 0.007 },
  },
  "immersive wax": {
    5: { fromBlock: 3 },
    6: { fromBlock: 4, offset: 0.08 },
  },
};

export interface MainTestKilometers {
  kilometers: number;
  calculationType: MainTestCalculationType;
}

/**
 * Rates a lubricant by how far one chain would last over the full 6000 km Main
 * Test: `6000 km ÷ total wear across all six blocks`. Untested blocks are
 * estimated with the category's extrapolation rule; where there is none, with
 * the average wear of the measured blocks.
 */
export function calculateMainTestKilometers(
  category: ProductCategory,
  measuredBlockWear: readonly number[],
): MainTestKilometers {
  const measured = measuredBlockWear.slice(0, MAIN_TEST_BLOCK_COUNT);
  const measuredAverage = measured.reduce((sum, wear) => sum + wear, 0) / measured.length;
  const rules = BLOCK_EXTRAPOLATIONS[category] ?? {};

  const completedBlockWear = [...measured];
  for (let block = measured.length + 1; block <= MAIN_TEST_BLOCK_COUNT; block++) {
    const rule = rules[block];
    const estimate =
      rule === undefined
        ? measuredAverage
        : completedBlockWear[rule.fromBlock - 1]! * (rule.factor ?? 1) + (rule.offset ?? 0);
    completedBlockWear.push(Math.max(0, estimate));
  }

  const totalWear = completedBlockWear.reduce((sum, wear) => sum + wear, 0);
  return {
    kilometers: Math.round(MAIN_TEST_KM / totalWear),
    calculationType:
      measured.length === MAIN_TEST_BLOCK_COUNT ? "test_completed" : "extrapolated_blocks",
  };
}
