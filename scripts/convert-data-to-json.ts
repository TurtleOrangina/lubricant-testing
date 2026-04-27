import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  LongevityCondition,
  Product,
  ProductCategory,
  SingleApplicationLongevity,
} from "../src/types.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

function calculateEquivalentTestKilometers(product: Product) {
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
    let res = (1000 * (idx + 1)) / cumWear;
    if (idx == 5) {
      product.mainTest!.testKilometerCalculationType =
        "test_completed_with_less_than_hundred_percent_wear";
    } else {
      product.mainTest!.testKilometerCalculationType = "no_data_past_hundred_test_aborted_early";
    }
    if (idx < 5 && res > 1000 * (idx + 2)) {
      let truncated_res = 1000 * (idx + 2);
      console.log(
        `Warning: Truncating equivalent kilometers to ${truncated_res} km (instead of ${Math.round(res)} km) for ${product.name}`,
      );
      const append_string = `"Main Test Kilometers" are truncated due to missing block ${idx + 2}.`;
      if (product.note) {
        product.note = product.note + ". " + append_string;
      } else {
        product.note = append_string;
      }
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

const csvText = readFileSync(resolve(ROOT, "data.csv"), "utf-8");
const [_header, ...dataLines] = csvText.split("\n").filter((l) => l.trim() !== "");

const products: Product[] = dataLines.map((line) => {
  const cols = line.split(",");
  const get = (i: number): string => (cols[i] ?? "").trim();

  // Collect consecutive non-empty main test blocks (no gaps by spec)
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

const outputPath = resolve(ROOT, "src", "data.json");
writeFileSync(outputPath, JSON.stringify(products, null, 2) + "\n");

const calculationTypeCounts: Record<string, number> = {};

for (const product of products) {
  const type = product.mainTest?.testKilometerCalculationType;
  if (!type) continue;

  calculationTypeCounts[type] = (calculationTypeCounts[type] ?? 0) + 1;
}

console.log("=====");
const beat_the_test =
  calculationTypeCounts["test_completed_with_less_than_hundred_percent_wear"] ?? 0;
const tested_until_chain_fully_worn =
  calculationTypeCounts["have_data_past_hundred_percent_wear"] ?? 0;
const test_aborted_before_chain_fully_worn =
  calculationTypeCounts["no_data_past_hundred_test_aborted_early"] ?? 0;
console.log(`${beat_the_test} products beat the main test (chain < 100% worn at end)`);
console.log(
  `${tested_until_chain_fully_worn} products were beaten by the main test (chain >= 100% worn reached)`,
);
console.log(
  `${test_aborted_before_chain_fully_worn} products weren't tested until chain fully worn, test aborted before.`,
);

console.log(`Wrote ${products.length} products → ${outputPath}`);
