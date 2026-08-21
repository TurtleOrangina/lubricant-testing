import type { ProductCategory } from "../../src/types.ts";
import { PRODUCT_OVERRIDES, type ProductOverride } from "./product-overrides.ts";
import { cellAt, numberAt, sheetNamed, textAt, type Sheet, type Workbook } from "./xlsx.ts";

const MAIN_SHEET = "Data Raw revamp 1.1";
const LONGEVITY_SHEET = "Single Application Longevity";

/** Text in column A that marks a row as a table header rather than a product. */
const HEADER_NAME_CELL = "Lubricant";

/** Cell fill marking a value as extrapolated rather than measured. */
const EXTRAPOLATED_FILL = "FFFF0000";

/** Name font colours the workbook uses to encode the product category. */
const CATEGORY_BY_FONT_COLOUR: Record<string, ProductCategory> = {
  FFFF00FF: "immersive wax",
  FF00B050: "wax drip",
  FF00B0F0: "wet-drip",
  // Orange, which the workbook writes as theme colour 5 rather than an RGB.
  FFED7D31: "rub on wax",
};

/** Block wear columns in the block-by-block table, in block order. */
const BLOCK_COLUMNS = ["B", "C", "E", "F", "H", "I"] as const;
/** Companion "chains worn per 5000km" columns, keyed by the block they scale. */
const PER_5000KM_COLUMNS: Record<string, string> = { C: "D", F: "G", I: "J" };

const BLOCK_COUNT = BLOCK_COLUMNS.length;
const CUMULATIVE_COLUMNS = ["B", "C", "D", "E", "F", "G"] as const;

const MAIN_TEST_KM = 6000;
/** The workbook derives its "real world" columns by dividing the lab result by three. */
const REAL_WORLD_DIVISOR = 3;

const WEAR_TOLERANCE = 0.0015;
/**
 * The summary tables are rounded to three decimals and were typed in by hand,
 * so comparing them against the block data needs more slack than comparing
 * values within one table.
 */
const CROSS_TABLE_WEAR_TOLERANCE = 0.005;
const LIFESPAN_TOLERANCE_RATIO = 0.01;
/** The workbook rounds its real-world columns inconsistently; only flag real drift. */
const REAL_WORLD_TOLERANCE_RATIO = 0.02;
const REAL_WORLD_TOLERANCE_MIN_KM = 2;

export type IssueLevel = "info" | "warning" | "error";

export interface Issue {
  level: IssueLevel;
  message: string;
}

export interface LongevityCondition {
  jumpPoint: number;
  wearAllowance: number;
}

export interface ExtractedProduct {
  name: string;
  note?: string;
  category: ProductCategory;
  /** Measured block wear rates, truncated at the first extrapolated block. */
  blocks: number[];
  costPackageAUD?: number;
  usagesMainTest?: number;
  dryRoad?: LongevityCondition;
  dryGravel?: LongevityCondition;
  extremeConditions?: LongevityCondition;
}

export interface ExtractionResult {
  products: ExtractedProduct[];
  issues: Issue[];
}

interface BlockRow {
  name: string;
  fontRgb?: string;
  /** All block values present in the row, including extrapolated ones. */
  values: (number | undefined)[];
  /** Index of the first extrapolated block, or `-1` when none is marked. */
  firstExtrapolated: number;
}

interface CumulativeRow {
  name: string;
  fontRgb?: string;
  values: (number | undefined)[];
}

interface CostRow {
  name: string;
  lifespanKm?: number;
  costPackageAUD?: number;
  usagesMainTest?: number;
}

interface LongevityRow {
  name: string;
  jumpPoint?: number;
  wearAllowance?: number;
  realWorldJumpPoint?: number;
  realWorldWearAllowance?: number;
}

type LongevityConditionKey = "dryRoad" | "dryGravel" | "extremeConditions";

export function extractProducts(workbook: Workbook): ExtractionResult {
  const issues: Issue[] = [];
  const report = (level: IssueLevel, message: string): void => {
    issues.push({ level, message });
  };

  const mainSheet = sheetNamed(workbook, MAIN_SHEET);
  const longevitySheet = sheetNamed(workbook, LONGEVITY_SHEET);

  const blockRows = readBlockTable(mainSheet, report);
  const cumulativeRows = readCumulativeTable(mainSheet, report);
  const costRows = readCostTable(mainSheet, report);
  const longevityTables = readLongevityTables(longevitySheet, report);

  const overrides = indexOverrides(report);
  const usedOverrides = new Set<string>();
  const takeOverride = (name: string): ProductOverride | undefined => {
    const override = overrides.get(normalizeName(name));
    if (override) usedOverrides.add(override.source);
    return override;
  };

  const cumulativeByName = indexByName(cumulativeRows, "cumulative wear", report);
  const costByName = indexByName(costRows, "cost", report);
  const longevityByName = new Map(
    Object.entries(longevityTables).map(([key, rows]) => [
      key as LongevityConditionKey,
      indexByName(rows, `${key} longevity`, report),
    ]),
  );

  const products: ExtractedProduct[] = [];
  const emittedNames = new Map<string, string>();
  const consumedCumulative = new Set<string>();
  const consumedCost = new Set<string>();
  const consumedLongevity = new Map<LongevityConditionKey, Set<string>>(
    [...longevityByName.keys()].map((key) => [key, new Set<string>()]),
  );

  const addProduct = (
    sourceName: string,
    override: ProductOverride | undefined,
    category: ProductCategory | undefined,
    blocks: number[],
  ): ExtractedProduct | undefined => {
    const name = override?.name ?? sourceName;
    const previous = emittedNames.get(normalizeName(name));
    if (previous !== undefined) {
      report(
        "error",
        `"${sourceName}" and "${previous}" both produce the product name "${name}". ` +
          `Add a "name" override to tell them apart.`,
      );
      return undefined;
    }
    emittedNames.set(normalizeName(name), sourceName);

    const resolvedCategory = override?.category ?? category;
    if (resolvedCategory === undefined) {
      report(
        "error",
        `"${sourceName}": category is undetermined — the name cell carries no known ` +
          `category font colour. Add a "category" override.`,
      );
      return undefined;
    }

    const product: ExtractedProduct = {
      name,
      ...(override?.note !== undefined && { note: override.note }),
      category: resolvedCategory,
      blocks,
    };

    const costName = override?.summaryName ?? sourceName;
    const costRow = costByName.get(normalizeName(costName));
    if (costRow) {
      consumedCost.add(normalizeName(costName));
      checkLifespan(sourceName, costRow, blocks, report);
    }
    const costPackageAUD = costRow?.costPackageAUD ?? override?.costPackageAUD;
    const usagesMainTest = costRow?.usagesMainTest ?? override?.usagesMainTest;
    if (costPackageAUD !== undefined) product.costPackageAUD = costPackageAUD;
    if (usagesMainTest !== undefined) product.usagesMainTest = usagesMainTest;

    const longevityNames = override?.longevityNames ?? [sourceName];
    for (const [key, rowsByName] of longevityByName) {
      for (const alias of longevityNames) {
        const row = rowsByName.get(normalizeName(alias));
        if (!row) continue;
        consumedLongevity.get(key)!.add(normalizeName(alias));
        const condition = toCondition(sourceName, key, row, report);
        if (condition) product[key] = condition;
        break;
      }
    }

    products.push(product);
    return product;
  };

  for (const row of blockRows) {
    const override = takeOverride(row.name);
    const blocks = measuredBlocks(row, report);
    const summaryName = override?.summaryName ?? row.name;
    const cumulativeRow = cumulativeByName.get(normalizeName(summaryName));
    if (cumulativeRow) {
      consumedCumulative.add(normalizeName(summaryName));
      checkCumulative(row.name, blocks, cumulativeRow, report);
    }
    addProduct(row.name, override, categoryOf(row.fontRgb), blocks);
  }

  // Products the block-by-block table omits but the cumulative table still
  // carries — differencing the running totals recovers their block wear.
  for (const row of cumulativeRows) {
    const key = normalizeName(row.name);
    if (consumedCumulative.has(key) || emittedNames.has(key)) continue;
    const override = takeOverride(row.name);
    if (override?.name !== undefined && emittedNames.has(normalizeName(override.name))) continue;
    addProduct(row.name, override, categoryOf(row.fontRgb), differenceCumulative(row.values));
  }

  // Products tested only for single-application longevity have no main test at all.
  for (const [key, rowsByName] of longevityByName) {
    for (const [normalized, row] of rowsByName) {
      if (consumedLongevity.get(key)!.has(normalized)) continue;
      const override = takeOverride(row.name);
      const name = override?.name ?? row.name;
      if (emittedNames.has(normalizeName(name))) continue;
      if (!override) {
        report(
          "warning",
          `"${row.name}" appears in the ${key} longevity table but in no main-test table. ` +
            `Emitting it without main-test data; add an override if it should join an ` +
            `existing product.`,
        );
      }
      addProduct(row.name, override, undefined, []);
    }
  }

  for (const override of PRODUCT_OVERRIDES) {
    if (!usedOverrides.has(override.source)) {
      report("warning", `Override for "${override.source}" matched no row in the workbook.`);
    }
  }
  for (const [normalized, row] of costByName) {
    if (!consumedCost.has(normalized)) {
      report("warning", `"${row.name}" has cost data but no matching main-test row.`);
    }
  }

  report("info", `Extracted ${products.length} products.`);
  return { products, issues };
}

function measuredBlocks(row: BlockRow, report: (level: IssueLevel, m: string) => void): number[] {
  const limit = row.firstExtrapolated === -1 ? BLOCK_COUNT : row.firstExtrapolated;
  const blocks: number[] = [];

  for (let i = 0; i < BLOCK_COUNT; i++) {
    const value = row.values[i];
    if (i < limit) {
      if (value === undefined) break;
      blocks.push(value);
    } else if (value !== undefined && i > limit && row.values[limit] === undefined) {
      report("error", `"${row.name}": block ${i + 1} has data but block ${limit + 1} is empty.`);
      break;
    }
  }

  if (blocks.length < limit) {
    const missing = blocks.length + 1;
    if (row.values.slice(missing).some((value) => value !== undefined)) {
      report(
        "error",
        `"${row.name}": block ${missing} is empty but a later block has data. ` +
          `Blocks must run without gaps.`,
      );
    }
  }
  return blocks;
}

function differenceCumulative(values: (number | undefined)[]): number[] {
  const blocks: number[] = [];
  let previous = 0;
  for (const value of values) {
    if (value === undefined) break;
    blocks.push(round(value - previous));
    previous = value;
  }
  return blocks;
}

function checkCumulative(
  name: string,
  blocks: number[],
  cumulativeRow: CumulativeRow,
  report: (level: IssueLevel, m: string) => void,
): void {
  let runningTotal = 0;
  for (let i = 0; i < blocks.length; i++) {
    runningTotal += blocks[i]!;
    const stated = cumulativeRow.values[i];
    if (stated === undefined) continue;
    if (Math.abs(stated - runningTotal) > CROSS_TABLE_WEAR_TOLERANCE) {
      report(
        "warning",
        `"${name}": block ${i + 1} cumulative wear disagrees between tables — ` +
          `blocks sum to ${round(runningTotal)}, cumulative table says ${round(stated)}.`,
      );
      return;
    }
  }
}

function checkLifespan(
  name: string,
  costRow: CostRow,
  blocks: number[],
  report: (level: IssueLevel, m: string) => void,
): void {
  if (costRow.lifespanKm === undefined || blocks.length !== BLOCK_COUNT) return;
  const totalWear = blocks.reduce((sum, wear) => sum + wear, 0);
  if (totalWear <= 0) return;
  const expected = MAIN_TEST_KM / totalWear;
  if (Math.abs(expected - costRow.lifespanKm) > expected * LIFESPAN_TOLERANCE_RATIO) {
    report(
      "warning",
      `"${name}": chain lifespan of ${Math.round(costRow.lifespanKm)}km does not follow from ` +
        `the block wear rates (${MAIN_TEST_KM}km / ${round(totalWear)} = ` +
        `${Math.round(expected)}km).`,
    );
  }
}

function toCondition(
  name: string,
  key: LongevityConditionKey,
  row: LongevityRow,
  report: (level: IssueLevel, m: string) => void,
): LongevityCondition | undefined {
  const { jumpPoint, wearAllowance } = row;
  if (jumpPoint === undefined || wearAllowance === undefined) {
    if (jumpPoint !== undefined || wearAllowance !== undefined) {
      report(
        "error",
        `"${name}": ${key} longevity has only one of jump point / wear allowance. ` +
          `Both are required, so the condition is dropped.`,
      );
    }
    return undefined;
  }
  if (jumpPoint > wearAllowance + WEAR_TOLERANCE) {
    report(
      "warning",
      `"${name}": ${key} jump point (${jumpPoint}km) is beyond the wear allowance ` +
        `(${wearAllowance}km).`,
    );
  }
  checkRealWorld(name, key, "jump point", jumpPoint, row.realWorldJumpPoint, report);
  checkRealWorld(name, key, "wear allowance", wearAllowance, row.realWorldWearAllowance, report);
  return { jumpPoint, wearAllowance };
}

function checkRealWorld(
  name: string,
  key: LongevityConditionKey,
  label: string,
  labValue: number,
  realWorldValue: number | undefined,
  report: (level: IssueLevel, m: string) => void,
): void {
  if (realWorldValue === undefined) return;
  const expected = labValue / REAL_WORLD_DIVISOR;
  const tolerance = Math.max(REAL_WORLD_TOLERANCE_MIN_KM, expected * REAL_WORLD_TOLERANCE_RATIO);
  if (Math.abs(expected - realWorldValue) > tolerance) {
    report(
      "warning",
      `"${name}": ${key} real-world ${label} is ${realWorldValue}km, but ` +
        `${labValue} / ${REAL_WORLD_DIVISOR} = ${Math.round(expected)}km.`,
    );
  }
}

function readBlockTable(sheet: Sheet, report: (level: IssueLevel, m: string) => void): BlockRow[] {
  const header = findHeaderRow(
    sheet,
    (row) => textAt(sheet, row, "B").startsWith("Block 1") && textAt(sheet, row, "H") !== "",
    "block-by-block wear",
  );
  checkPer5000kmColumns(sheet, header, report);

  return readDataRows(sheet, header, BLOCK_COLUMNS, (row, name) => {
    const values = BLOCK_COLUMNS.map((column) => numberAt(sheet, row, column));
    const firstExtrapolated = BLOCK_COLUMNS.findIndex(
      (column) => cellAt(sheet, row, column)?.fillRgb === EXTRAPOLATED_FILL,
    );
    const trailing = BLOCK_COLUMNS.slice(firstExtrapolated + 1).some(
      (column, offset) =>
        firstExtrapolated !== -1 &&
        numberAt(sheet, row, column) !== undefined &&
        cellAt(sheet, row, column)?.fillRgb !== EXTRAPOLATED_FILL &&
        offset >= 0,
    );
    if (trailing) {
      report(
        "warning",
        `"${name}": a measured block follows an extrapolated one, so later measured ` +
          `blocks are dropped.`,
      );
    }
    const fontRgb = cellAt(sheet, row, "A")?.fontRgb;
    return { name, ...(fontRgb !== undefined && { fontRgb }), values, firstExtrapolated };
  });
}

function readCumulativeTable(
  sheet: Sheet,
  _report: (level: IssueLevel, m: string) => void,
): CumulativeRow[] {
  const header = findHeaderRow(
    sheet,
    (row) => textAt(sheet, row, "B").startsWith("Block 1") && textAt(sheet, row, "H") === "",
    "cumulative wear",
  );
  return readDataRows(sheet, header, CUMULATIVE_COLUMNS, (row, name) => {
    const fontRgb = cellAt(sheet, row, "A")?.fontRgb;
    return {
      name,
      ...(fontRgb !== undefined && { fontRgb }),
      values: CUMULATIVE_COLUMNS.map((column) => numberAt(sheet, row, column)),
    };
  });
}

function readCostTable(sheet: Sheet, _report: (level: IssueLevel, m: string) => void): CostRow[] {
  const header = findHeaderRow(
    sheet,
    (row) => textAt(sheet, row, "B").startsWith("Total Chain wear life"),
    "chain lifespan and cost",
  );
  return readDataRows(sheet, header, ["B", "D", "E"], (row, name) => {
    const lifespanKm = numberAt(sheet, row, "B");
    const costPackageAUD = numberAt(sheet, row, "D");
    const usagesMainTest = numberAt(sheet, row, "E");
    return {
      name,
      ...(lifespanKm !== undefined && { lifespanKm }),
      ...(costPackageAUD !== undefined && { costPackageAUD }),
      ...(usagesMainTest !== undefined && { usagesMainTest }),
    };
  });
}

function readLongevityTables(
  sheet: Sheet,
  report: (level: IssueLevel, m: string) => void,
): Record<LongevityConditionKey, LongevityRow[]> {
  const tables: Record<LongevityConditionKey, LongevityRow[]> = {
    dryRoad: [],
    dryGravel: [],
    extremeConditions: [],
  };
  const seen = new Set<LongevityConditionKey>();

  for (let row = 1; row <= sheet.lastRow; row++) {
    if (textAt(sheet, row, "A") !== HEADER_NAME_CELL) continue;
    if (!textAt(sheet, row, "B").includes("Jump Point")) continue;

    const key = classifyLongevityTable(sheet, row);
    if (key === undefined) {
      report("error", `Longevity table at row ${row} has no recognisable section heading.`);
      continue;
    }
    if (seen.has(key)) {
      report(
        "error",
        `Found more than one "${key}" longevity table; ignoring the one at row ${row}.`,
      );
      continue;
    }
    seen.add(key);

    tables[key] = readDataRows(sheet, row, ["B", "C"], (dataRow, name) => {
      const jumpPoint = numberAt(sheet, dataRow, "B");
      const wearAllowance = numberAt(sheet, dataRow, "C");
      const realWorldJumpPoint = numberAt(sheet, dataRow, "D");
      const realWorldWearAllowance = numberAt(sheet, dataRow, "E");
      return {
        name,
        ...(jumpPoint !== undefined && { jumpPoint }),
        ...(wearAllowance !== undefined && { wearAllowance }),
        ...(realWorldJumpPoint !== undefined && { realWorldJumpPoint }),
        ...(realWorldWearAllowance !== undefined && { realWorldWearAllowance }),
      };
    });
  }

  for (const key of ["dryRoad", "dryGravel", "extremeConditions"] as const) {
    if (!seen.has(key)) report("error", `No "${key}" longevity table found.`);
  }
  return tables;
}

/**
 * Each longevity table is introduced by a "Single Application Longevity - …"
 * heading a few rows above it, which is what names the riding condition.
 */
function classifyLongevityTable(
  sheet: Sheet,
  headerRow: number,
): LongevityConditionKey | undefined {
  for (let row = headerRow - 1; row >= Math.max(1, headerRow - 6); row--) {
    const heading = textAt(sheet, row, "A").toLowerCase();
    if (!heading.includes("single application longevity")) continue;
    if (heading.includes("extreme")) return "extremeConditions";
    if (heading.includes("gravel") || heading.includes("mtb")) return "dryGravel";
    if (heading.includes("road")) return "dryRoad";
    return undefined;
  }
  return undefined;
}

function checkPer5000kmColumns(
  sheet: Sheet,
  header: number,
  report: (level: IssueLevel, m: string) => void,
): void {
  for (let row = header + 1; row <= sheet.lastRow; row++) {
    const name = textAt(sheet, row, "A");
    if (name === "" || /^average/i.test(name)) {
      if (/^average/i.test(name)) return;
      continue;
    }
    for (const [blockColumn, scaledColumn] of Object.entries(PER_5000KM_COLUMNS)) {
      const block = numberAt(sheet, row, blockColumn);
      const scaled = numberAt(sheet, row, scaledColumn);
      if (block === undefined || scaled === undefined) continue;
      if (Math.abs(block * 5 - scaled) > WEAR_TOLERANCE * 5) {
        report(
          "warning",
          `"${name}": column ${scaledColumn} says ${round(scaled)} chains per 5000km, but ` +
            `column ${blockColumn} × 5 = ${round(block * 5)}.`,
        );
      }
    }
  }
}

/**
 * Scans downwards from a header row, keeping rows that carry a name and at
 * least one number in `valueColumns`. Tables end either at the summary row
 * that closes them or where the next table's header begins.
 */
function readDataRows<T>(
  sheet: Sheet,
  header: number,
  valueColumns: readonly string[],
  build: (row: number, name: string) => T,
): T[] {
  const rows: T[] = [];
  for (let row = header + 1; row <= sheet.lastRow; row++) {
    const name = textAt(sheet, row, "A");
    if (/^average/i.test(name) || name === HEADER_NAME_CELL) break;
    if (name === "") continue;
    if (!valueColumns.some((column) => numberAt(sheet, row, column) !== undefined)) continue;
    rows.push(build(row, name));
  }
  return rows;
}

function findHeaderRow(sheet: Sheet, matches: (row: number) => boolean, label: string): number {
  for (let row = 1; row <= sheet.lastRow; row++) {
    if (textAt(sheet, row, "A") === HEADER_NAME_CELL && matches(row)) return row;
  }
  throw new Error(`Could not find the ${label} table on sheet "${sheet.name}".`);
}

function indexByName<T extends { name: string }>(
  rows: T[],
  label: string,
  report: (level: IssueLevel, m: string) => void,
): Map<string, T> {
  const index = new Map<string, T>();
  for (const row of rows) {
    const key = normalizeName(row.name);
    if (index.has(key)) {
      report("error", `The ${label} table lists "${row.name}" more than once.`);
      continue;
    }
    index.set(key, row);
  }
  return index;
}

function indexOverrides(
  report: (level: IssueLevel, m: string) => void,
): Map<string, ProductOverride> {
  const index = new Map<string, ProductOverride>();
  for (const override of PRODUCT_OVERRIDES) {
    const key = normalizeName(override.source);
    if (index.has(key)) {
      report("error", `Two overrides both target the source name "${override.source}".`);
      continue;
    }
    index.set(key, override);
  }
  return index;
}

function categoryOf(fontRgb: string | undefined): ProductCategory | undefined {
  return fontRgb === undefined ? undefined : CATEGORY_BY_FONT_COLOUR[fontRgb];
}

/**
 * Product names drift between tables in capitalisation, spacing and
 * punctuation, so joins compare a stripped-down form. Genuine differences
 * still need an entry in the override table.
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
