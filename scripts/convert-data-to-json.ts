import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { convertCsvToProducts } from "../src/utils/convertCsv.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const csvText = readFileSync(resolve(ROOT, "data.csv"), "utf-8");
const products = convertCsvToProducts(csvText);

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
