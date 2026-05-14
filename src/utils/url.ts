import type { TabId } from "../stores/navigation";

export const TAB_PATHS: Record<TabId, string> = {
  overview: "main_test_overview",
  blocks: "main_test_blocks",
  longevity: "single_application_longevity",
  details: "lubricant_details",
  glossary: "glossary",
  admin: "admin",
};

const PATH_TO_TAB: Readonly<Record<string, TabId>> = Object.fromEntries(
  Object.entries(TAB_PATHS).map(([k, v]) => [v, k as TabId]),
);

export interface AppUrlState {
  tab: TabId;
  selectedLubricant: string | null;
  includeUnavailable: boolean;
  glossaryAnchor: string | null;
}

export function parseUrl(): AppUrlState {
  const segment = location.pathname.replace(/^\//, "").split("/")[0];
  const tab = PATH_TO_TAB[segment] ?? "overview";
  const params = new URLSearchParams(location.search);
  return {
    tab,
    selectedLubricant: params.get("selected_lubricant"),
    includeUnavailable: params.has("include_unavailable"),
    glossaryAnchor: location.hash ? decodeURIComponent(location.hash.slice(1)) : null,
  };
}

export function buildUrl(state: AppUrlState): string {
  const path = "/" + TAB_PATHS[state.tab];
  const parts: string[] = [];
  if (state.selectedLubricant)
    parts.push(`selected_lubricant=${encodeURIComponent(state.selectedLubricant)}`);
  if (state.includeUnavailable) parts.push("include_unavailable");
  const search = parts.length ? "?" + parts.join("&") : "";
  const hash = state.glossaryAnchor ? "#" + encodeURIComponent(state.glossaryAnchor) : "";
  return path + search + hash;
}
