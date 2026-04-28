import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { convertCsvToProducts } from "../src/utils/convertCsv.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const csvText = readFileSync(resolve(ROOT, "data.csv"), "utf-8");
const { products, log } = convertCsvToProducts(csvText);

const PREFIX: Record<string, string> = {
  info: "  [info]",
  warning: "  [warn]",
  error: " [error]",
};
for (const entry of log) {
  console.log(`${PREFIX[entry.level] ?? "  [info]"} ${entry.message}`);
}

const outputPath = resolve(ROOT, "src", "data.json");
writeFileSync(outputPath, JSON.stringify(products, null, 2) + "\n");
console.log(`\nWrote ${products.length} products → ${outputPath}`);
