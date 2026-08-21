import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describeCsvDifferences, formatDataCsv } from "./lib/csv.ts";
import { extractProducts, type Issue } from "./lib/extract.ts";
import { readWorkbook } from "./lib/xlsx.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKBOOK_DIR_NAME = "xlsx_data";
const WORKBOOK_DIR = resolve(ROOT, WORKBOOK_DIR_NAME);
const DEFAULT_OUTPUT = resolve(ROOT, "public", "assets", "data.csv");

const USAGE = `Regenerates public/assets/data.csv from the ZFC test workbook.

Usage: node scripts/convert-xlsx-to-csv.ts [options]

Options:
  --in <path>    Source .xlsx workbook. Defaults to the only .xlsx in
                 xlsx_data/.
  --out <path>   Destination .csv. Defaults to public/assets/data.csv.
  --check        Do not write; exit non-zero if the destination is out of date.
  -h, --help     Show this message.
`;

const PREFIX: Record<Issue["level"], string> = {
  info: "  [info]",
  warning: "  [warn]",
  error: " [error]",
};

main();

function main(): void {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(USAGE);
    return;
  }

  const input = options.input ?? findWorkbook();
  const output = options.output ?? DEFAULT_OUTPUT;

  console.log(`Reading ${relative(ROOT, input)}`);
  const { products, issues } = extractProducts(readWorkbook(input));
  const { text, issues: formatIssues } = formatDataCsv(products);

  const allIssues = [...issues, ...formatIssues];
  for (const issue of allIssues) console.log(`${PREFIX[issue.level]} ${issue.message}`);
  const errorCount = allIssues.filter((issue) => issue.level === "error").length;
  const warningCount = allIssues.filter((issue) => issue.level === "warning").length;

  if (errorCount > 0) {
    console.error(`\n${errorCount} error(s); ${relative(ROOT, output)} not written.`);
    process.exitCode = 1;
    return;
  }

  if (options.check) {
    reportCheck(output, text, warningCount);
    return;
  }

  writeFileSync(output, text);
  console.log(
    `\nWrote ${products.length} products → ${relative(ROOT, output)}` +
      (warningCount > 0 ? ` (${warningCount} warning(s))` : ""),
  );
}

function reportCheck(output: string, text: string, warningCount: number): void {
  const existing = existsSync(output) ? readFileSync(output, "utf-8") : "";
  if (existing === text) {
    console.log(
      `\n${relative(ROOT, output)} is up to date` +
        (warningCount > 0 ? ` (${warningCount} warning(s))` : ""),
    );
    return;
  }

  console.error(`\n${relative(ROOT, output)} is out of date.`);
  const differences = describeCsvDifferences(text, existing);
  if (differences.length === 0) {
    console.error("  The data matches; only row order or formatting differs.");
  } else {
    for (const difference of differences) console.error(`  ${difference}`);
  }
  console.error("\nRun `pnpm run convert-xlsx-to-csv` to regenerate it.");
  process.exitCode = 1;
}

interface Options {
  input?: string;
  output?: string;
  check: boolean;
  help: boolean;
}

function parseArguments(argv: string[]): Options {
  const options: Options = { check: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const argument = argv[i]!;
    switch (argument) {
      case "--check":
        options.check = true;
        break;
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "--in":
      case "--out": {
        const value = argv[++i];
        if (value === undefined) throw new Error(`${argument} requires a path.`);
        if (argument === "--in") options.input = resolve(value);
        else options.output = resolve(value);
        break;
      }
      default:
        throw new Error(`Unknown argument "${argument}".\n\n${USAGE}`);
    }
  }
  return options;
}

/**
 * The workbook's filename carries the test date and so changes over time;
 * requiring an exact name would mean editing this script every few months.
 */
function findWorkbook(): string {
  let candidates: string[];
  try {
    candidates = readdirSync(WORKBOOK_DIR).filter(
      // `~$` prefixes Excel's lock files, which are not readable workbooks.
      (name) => name.toLowerCase().endsWith(".xlsx") && !name.startsWith("~$"),
    );
  } catch {
    throw new Error(
      `No ${WORKBOOK_DIR_NAME}/ directory. Create it and put the workbook there, ` +
        `or pass one with --in.`,
    );
  }

  if (candidates.length === 1) return resolve(WORKBOOK_DIR, candidates[0]!);
  if (candidates.length === 0) {
    throw new Error(`No .xlsx workbook found in ${WORKBOOK_DIR_NAME}/. Pass one with --in.`);
  }
  throw new Error(
    `Found ${candidates.length} .xlsx files in ${WORKBOOK_DIR_NAME}/ ` +
      `(${candidates.join(", ")}). Pick one with --in.`,
  );
}
