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
const COL_COMMERCIALLY_AVAILABLE = 17;

const EXPECTED_COLS = 18;
const WEAR_RATE_MIN = 0;
const WEAR_RATE_MAX = 10.0;
const LONGEVITY_MIN = 30;
const LONGEVITY_MAX = 50_000;

export type ParseLogLevel = "info" | "warning" | "error";

export interface ParseLogEntry {
  level: ParseLogLevel;
  message: string;
}

export interface ConvertResult {
  products: Product[];
  log: ParseLogEntry[];
}

function parseNum(s: string): number | undefined {
  const trimmed = s.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  return isNaN(n) ? undefined : n;
}

function mapCategory(raw: string): ProductCategory | undefined {
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
      return undefined;
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

export function convertCsvToProducts(csvText: string): ConvertResult {
  const log: ParseLogEntry[] = [];
  const products: Product[] = [];
  const seenNames = new Set<string>();

  const [_header, ...dataLines] = csvText.split("\n").filter((l) => l.trim() !== "");

  for (const line of dataLines) {
    const cols = line.split(",");
    const get = (i: number): string => (cols[i] ?? "").trim();

    const rawName = get(COL_NAME);

    if (cols.length !== EXPECTED_COLS) {
      log.push({
        level: "error",
        message: `"${rawName || "(no name)"}": expected ${EXPECTED_COLS} columns, got ${cols.length}.`,
      });
      if (cols.length < 3) continue;
    }

    if (!rawName) {
      log.push({ level: "error", message: "Row with empty name skipped." });
      continue;
    }
    const name = rawName;

    if (seenNames.has(name)) {
      log.push({ level: "error", message: `"${name}": duplicate product name. Row skipped.` });
      continue;
    }
    seenNames.add(name);

    const category = mapCategory(get(COL_CATEGORY));
    if (!category) {
      log.push({
        level: "error",
        message: `"${name}": unknown category "${get(COL_CATEGORY)}". Row skipped.`,
      });
      continue;
    }

    const caRaw = get(COL_COMMERCIALLY_AVAILABLE);
    if (caRaw !== "0" && caRaw !== "1") {
      log.push({
        level: "error",
        message: `"${name}": "commercially available" must be "0" or "1", got "${caRaw}".`,
      });
    }
    const commerciallyAvailable = caRaw === "1";

    const mainTestBlocks: { wearRate: number }[] = [];
    for (let i = COL_MAIN_FIRST; i <= COL_MAIN_LAST; i++) {
      const raw = (cols[i] ?? "").trim();
      if (raw === "") break;
      const v = parseNum(raw);
      if (v === undefined) {
        log.push({
          level: "warning",
          message: `"${name}": block ${i - COL_MAIN_FIRST + 1} wear rate "${raw}" is not a valid number. Stopping block parsing.`,
        });
        break;
      }
      if (v < WEAR_RATE_MIN || v > WEAR_RATE_MAX) {
        log.push({
          level: "warning",
          message: `"${name}": block ${i - COL_MAIN_FIRST + 1} wear rate ${v} is outside valid range [${WEAR_RATE_MIN}, ${WEAR_RATE_MAX}].`,
        });
      }
      mainTestBlocks.push({ wearRate: v });
    }

    const getLongevityNum = (colIdx: number, fieldLabel: string): number | undefined => {
      const raw = get(colIdx);
      if (raw === "") return undefined;
      const v = parseNum(raw);
      if (v === undefined) {
        log.push({
          level: "warning",
          message: `"${name}": ${fieldLabel} "${raw}" is not a valid number.`,
        });
        return undefined;
      }
      if (v < LONGEVITY_MIN || v > LONGEVITY_MAX) {
        log.push({
          level: "warning",
          message: `"${name}": ${fieldLabel} ${v} is outside valid range [${LONGEVITY_MIN}, ${LONGEVITY_MAX}].`,
        });
      }
      return v;
    };

    const longevityCondition = (
      jump: number | undefined,
      allowance: number | undefined,
    ): LongevityCondition | undefined =>
      jump !== undefined && allowance !== undefined
        ? { jumpPoint: jump, wearAllowance: allowance }
        : undefined;

    const dryRoad = longevityCondition(
      getLongevityNum(COL_ROAD_JUMP, "dry road jump"),
      getLongevityNum(COL_ROAD_ALLOWANCE, "dry road allowance"),
    );
    const dryGravel = longevityCondition(
      getLongevityNum(COL_GRAVEL_JUMP, "dry gravel jump"),
      getLongevityNum(COL_GRAVEL_ALLOWANCE, "dry gravel allowance"),
    );
    const extremeConditions = longevityCondition(
      getLongevityNum(COL_EXTREME_JUMP, "extreme jump"),
      getLongevityNum(COL_EXTREME_ALLOWANCE, "extreme allowance"),
    );

    const longevity: SingleApplicationLongevity | undefined =
      dryRoad !== undefined || dryGravel !== undefined || extremeConditions !== undefined
        ? {
            ...(dryRoad !== undefined && { dryRoad }),
            ...(dryGravel !== undefined && { dryGravel }),
            ...(extremeConditions !== undefined && { extremeConditions }),
          }
        : undefined;

    const product: Product = { name, category, commerciallyAvailable };

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

    products.push(product);
  }

  const counts: Record<string, number> = {};
  for (const p of products) {
    const t = p.mainTest?.testKilometerCalculationType;
    if (t) counts[t] = (counts[t] ?? 0) + 1;
  }

  const beatTest = counts["test_completed_with_less_than_hundred_percent_wear"] ?? 0;
  const fullyWorn = counts["have_data_past_hundred_percent_wear"] ?? 0;
  const aborted = counts["no_data_past_hundred_test_aborted_early"] ?? 0;

  log.push({ level: "info", message: `Loaded ${products.length} products.` });
  if (beatTest > 0)
    log.push({
      level: "info",
      message: `${beatTest} beat the main test (chain < 100% worn at end).`,
    });
  if (fullyWorn > 0)
    log.push({
      level: "info",
      message: `${fullyWorn} worn through by the main test (≥ 100% wear reached).`,
    });
  if (aborted > 0)
    log.push({ level: "info", message: `${aborted} test aborted before chain fully worn.` });

  return { products, log };
}
