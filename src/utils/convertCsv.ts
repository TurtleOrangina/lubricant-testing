import type {
  LongevityCondition,
  Product,
  ProductCategory,
  SingleApplicationLongevity,
} from "../types";

const COL_NAME = 0;
const COL_NOTE = 1;
const COL_CATEGORY = 2;
const COL_MAIN_FIRST = 3;
const COL_MAIN_LAST = 8;
const COL_COST = 9;
const COL_USAGES = 10;
const COL_ROAD_JUMP = 11;
const COL_ROAD_ALLOWANCE = 12;
const COL_GRAVEL_JUMP = 13;
const COL_GRAVEL_ALLOWANCE = 14;
const COL_EXTREME_JUMP = 15;
const COL_EXTREME_ALLOWANCE = 16;

function parseNum(s: string): number | undefined {
  const trimmed = s.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  return isNaN(n) ? undefined : n;
}

function mapCategory(raw: string): ProductCategory {
  switch (raw.trim().toLowerCase()) {
    case "immersive wax":
      return "immersive wax";
    case "wax drip":
      return "wax drip";
    case "wet drip":
    case "wet-drip":
      return "wet-drip";
    case "other":
      return "other";
    default:
      throw new Error(`Unknown category: ${JSON.stringify(raw)}`);
  }
}

function calculateEquivalentTestKilometers(product: Product): void {
  let cumWear = 0;
  const mainTestBlocks = product.mainTest!.blockWear!.map((block) => block.wearRate);
  let idx = mainTestBlocks.length - 1;

  for (let i = 0; i < mainTestBlocks.length; i++) {
    cumWear += mainTestBlocks[i];
    if (cumWear >= 1.0) {
      idx = i;
      break;
    }
  }

  if (cumWear < 1.0) {
    const res = (1000 * (idx + 1)) / cumWear;
    if (idx === 5) {
      product.mainTest!.testKilometerCalculationType =
        "test_completed_with_less_than_hundred_percent_wear";
    } else {
      product.mainTest!.testKilometerCalculationType = "no_data_past_hundred_test_aborted_early";
    }
    if (idx < 5 && res > 1000 * (idx + 2)) {
      const truncated_res = 1000 * (idx + 2);
      const append_string = `"Main Test Kilometers" are truncated due to missing block ${idx + 2}.`;
      product.note = product.note ? `${product.note}. ${append_string}` : append_string;
      product.mainTest!.testKilometerEquivalent = Math.round(truncated_res);
    } else {
      product.mainTest!.testKilometerEquivalent = Math.round(res);
    }
  } else {
    product.mainTest!.testKilometerCalculationType = "have_data_past_hundred_percent_wear";
    product.mainTest!.testKilometerEquivalent = Math.round(
      1000 * (idx + (1.0 + mainTestBlocks[idx] - cumWear) / mainTestBlocks[idx]),
    );
  }
}

export function convertCsvToProducts(csvText: string): Product[] {
  const [_header, ...dataLines] = csvText.split("\n").filter((l) => l.trim() !== "");

  return dataLines.map((line) => {
    const cols = line.split(",");
    const get = (i: number): string => (cols[i] ?? "").trim();

    const mainTestBlocks = [];
    for (let i = COL_MAIN_FIRST; i <= COL_MAIN_LAST; i++) {
      const v = parseNum(cols[i] ?? "");
      if (v === undefined) break;
      mainTestBlocks.push({ wearRate: v });
    }

    const longevityCondition = (
      jump: number | undefined,
      allowance: number | undefined,
    ): LongevityCondition | undefined =>
      jump !== undefined && allowance !== undefined
        ? { jumpPoint: jump, wearAllowance: allowance }
        : undefined;

    const dryRoad = longevityCondition(
      parseNum(get(COL_ROAD_JUMP)),
      parseNum(get(COL_ROAD_ALLOWANCE)),
    );
    const dryGravel = longevityCondition(
      parseNum(get(COL_GRAVEL_JUMP)),
      parseNum(get(COL_GRAVEL_ALLOWANCE)),
    );
    const extremeConditions = longevityCondition(
      parseNum(get(COL_EXTREME_JUMP)),
      parseNum(get(COL_EXTREME_ALLOWANCE)),
    );

    const longevity: SingleApplicationLongevity | undefined =
      dryRoad !== undefined || dryGravel !== undefined || extremeConditions !== undefined
        ? {
            ...(dryRoad !== undefined && { dryRoad }),
            ...(dryGravel !== undefined && { dryGravel }),
            ...(extremeConditions !== undefined && { extremeConditions }),
          }
        : undefined;

    const product: Product = { name: get(COL_NAME), category: mapCategory(get(COL_CATEGORY)) };

    const note = get(COL_NOTE);
    if (note) product.note = note;

    const cost = parseNum(get(COL_COST));
    if (cost !== undefined) product.costPackageAUD = cost;

    const usages = parseNum(get(COL_USAGES));
    if (usages !== undefined) product.usagesMainTest = usages;

    if (mainTestBlocks.length > 0) {
      product.mainTest = {
        blockWear: mainTestBlocks,
        testKilometerEquivalent: -1,
        testKilometerCalculationType: "unknown",
      };
      calculateEquivalentTestKilometers(product);
    }
    if (longevity !== undefined) product.longevity = longevity;

    return product;
  });
}
