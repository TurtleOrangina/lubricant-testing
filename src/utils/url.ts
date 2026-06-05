import type { TabId } from "../stores/navigation";
import { BLOCK_LABELS, LONGEVITY_CONDITIONS } from "../constants";
import type { ConditionKey } from "../constants";

export const TAB_PATHS: Record<TabId, string> = {
  overview: "main_test_overview",
  blocks: "main_test_blocks",
  longevity: "single_application_longevity",
  "cost-to-run": "cost_to_run",
  details: "lubricant_details",
  glossary: "glossary",
};

const PATH_TO_TAB: Readonly<Record<string, TabId>> = Object.fromEntries(
  Object.entries(TAB_PATHS).map(([k, v]) => [v, k as TabId]),
);

const BLOCK_LABEL_TO_INDEX: Record<string, number> = Object.fromEntries(
  Object.entries(BLOCK_LABELS).map(([k, v]) => [v, Number(k)]),
);

const CONDITION_LABEL_TO_KEY: Record<string, ConditionKey> = Object.fromEntries(
  LONGEVITY_CONDITIONS.map((c) => [c.label, c.key]),
);

export interface AppUrlState {
  tab: TabId;
  selectedLubricant: string | null;
  glossaryAnchor: string | null;
  block: number | null;
  condition: ConditionKey | null;
  drivetrainCost: number | null;
}

export function isParseDataCsvRoute(): boolean {
  return location.hash.split("?")[0] === "#parse_data_csv";
}

export function parseUrl(): AppUrlState {
  const hashContent = location.hash.slice(1); // strip leading "#"
  const [hashPath, hashQuery] = hashContent.split("?");
  const [tabPath, encodedAnchor] = (hashPath ?? "").split("/");
  const tab = PATH_TO_TAB[tabPath ?? ""] ?? "overview";
  const params = new URLSearchParams(hashQuery ?? "");

  const blockLabel = params.get("block");
  const block = blockLabel != null ? (BLOCK_LABEL_TO_INDEX[blockLabel] ?? null) : null;

  const conditionLabel = params.get("condition");
  const condition =
    conditionLabel != null ? (CONDITION_LABEL_TO_KEY[conditionLabel] ?? null) : null;

  const drivetrainCostStr = params.get("drivetrain_cost");
  const drivetrainCostNum = drivetrainCostStr != null ? Number(drivetrainCostStr) : NaN;
  const drivetrainCost =
    !isNaN(drivetrainCostNum) && drivetrainCostNum >= 100 && drivetrainCostNum <= 2000
      ? drivetrainCostNum
      : null;

  return {
    tab,
    selectedLubricant: params.get("selected_lubricant"),
    glossaryAnchor: encodedAnchor ? decodeURIComponent(encodedAnchor) : null,
    block,
    condition,
    drivetrainCost,
  };
}

export function buildUrl(state: AppUrlState): string {
  const hashBase = TAB_PATHS[state.tab];
  const hashPath = state.glossaryAnchor
    ? `${hashBase}/${encodeURIComponent(state.glossaryAnchor)}`
    : hashBase;

  const parts: string[] = [];
  if (state.selectedLubricant)
    parts.push(`selected_lubricant=${encodeURIComponent(state.selectedLubricant)}`);
  if (state.block != null) {
    const label = BLOCK_LABELS[state.block];
    if (label) parts.push(`block=${encodeURIComponent(label)}`);
  }
  if (state.condition != null) {
    const cond = LONGEVITY_CONDITIONS.find((c) => c.key === state.condition);
    if (cond) parts.push(`condition=${encodeURIComponent(cond.label)}`);
  }
  if (state.drivetrainCost != null) parts.push(`drivetrain_cost=${state.drivetrainCost}`);

  const query = parts.length ? "?" + parts.join("&") : "";
  return `#${hashPath}${query}`;
}
