import type { ExtractedProduct, Issue } from "./extract.ts";

export const CSV_HEADER = [
  "Name",
  "Note",
  "Type",
  "Main 1",
  "Main 2",
  "Main 3",
  "Main 4",
  "Main 5",
  "Main 6",
  "Cost Package",
  "Usages per main test",
  "Longevity Road Jump",
  "Longevity Road Allowance",
  "Longevity Gravel Jump",
  "Longevity Gravel Allowance",
  "Longevity Extreme Jump",
  "Longevity Extreme Allowance",
] as const;

const MAIN_BLOCK_COUNT = 6;

/** Categories are written the way `data.csv` has always spelled them. */
const CATEGORY_LABELS: Record<string, string> = {
  "immersive wax": "immersive wax",
  "wax drip": "wax drip",
  "rub on wax": "Rub on Wax",
  "wet-drip": "wet drip",
  other: "other",
};

export interface FormatResult {
  text: string;
  issues: Issue[];
}

export function formatDataCsv(products: ExtractedProduct[]): FormatResult {
  const issues: Issue[] = [];
  const lines = [CSV_HEADER.join(",")];

  for (const product of products) {
    const blocks = Array.from({ length: MAIN_BLOCK_COUNT }, (_, index) =>
      formatNumber(product.blocks[index]),
    );
    const fields = [
      product.name,
      product.note ?? "",
      CATEGORY_LABELS[product.category] ?? product.category,
      ...blocks,
      formatNumber(product.costPackageAUD),
      formatNumber(product.usagesMainTest),
      formatNumber(product.dryRoad?.jumpPoint),
      formatNumber(product.dryRoad?.wearAllowance),
      formatNumber(product.dryGravel?.jumpPoint),
      formatNumber(product.dryGravel?.wearAllowance),
      formatNumber(product.extremeConditions?.jumpPoint),
      formatNumber(product.extremeConditions?.wearAllowance),
    ];

    // `data.csv` is read by a splitter that does not understand quoting, so a
    // field that would need quotes has to be renamed rather than escaped.
    const offending = fields.find((field) => /[",\r\n]/.test(field));
    if (offending !== undefined) {
      issues.push({
        level: "error",
        message:
          `"${product.name}": the field ${JSON.stringify(offending)} contains a comma, quote ` +
          `or newline, which data.csv cannot represent. Add a "name" or "note" override. ` +
          `Row skipped.`,
      });
      continue;
    }

    lines.push(fields.join(","));
  }

  return { text: lines.join("\n") + "\n", issues };
}

/**
 * Renders a number without the trailing artefacts of binary floating point:
 * the workbook stores 0.203 as 0.20300000000000001.
 */
function formatNumber(value: number | undefined): string {
  if (value === undefined) return "";
  return String(Number(value.toPrecision(12)));
}

export interface CsvRecord {
  name: string;
  fields: string[];
}

/** Parses a `data.csv` the same way the application does, for comparison. */
export function parseDataCsv(text: string): CsvRecord[] {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .slice(1)
    .map((line) => {
      const fields = line.split(",").map((field) => field.trim());
      return { name: fields[0] ?? "", fields };
    });
}

/** Human-readable per-field differences between two `data.csv` documents. */
export function describeCsvDifferences(expected: string, actual: string): string[] {
  const expectedRecords = new Map(parseDataCsv(expected).map((r) => [r.name, r]));
  const actualRecords = new Map(parseDataCsv(actual).map((r) => [r.name, r]));
  const differences: string[] = [];

  for (const [name, expectedRecord] of expectedRecords) {
    const actualRecord = actualRecords.get(name);
    if (!actualRecord) {
      differences.push(`${name}: only in the generated data`);
      continue;
    }
    for (const [index, header] of CSV_HEADER.entries()) {
      const before = actualRecord.fields[index] ?? "";
      const after = expectedRecord.fields[index] ?? "";
      if (before !== after) {
        differences.push(
          `${name}: ${header} ${before === "" ? "(empty)" : before} → ` +
            `${after === "" ? "(empty)" : after}`,
        );
      }
    }
  }
  for (const name of actualRecords.keys()) {
    if (!expectedRecords.has(name)) differences.push(`${name}: only in the existing file`);
  }
  return differences;
}
