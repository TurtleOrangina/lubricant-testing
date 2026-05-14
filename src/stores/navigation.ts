import { defineStore } from "pinia";
import { ref } from "vue";
import { buildUrl, parseUrl } from "../utils/url";
import { useSelectionStore } from "./selection";

export type TabId = "overview" | "blocks" | "longevity" | "details" | "glossary" | "admin";

export const GLOSSARY_SECTION_ANCHORS: Record<string, string> = {
  "main-test": "The Main Test",
  "main-test-blocks": "Main Test Blocks",
  "chain-wear": "Chain Wear",
  "main-test-kilometers": "Main Test Kilometers",
  "single-application-longevity": "Single Application Longevity",
  "lubricant-cost": "Lubricant Cost",
};

export const GLOSSARY_ANCHOR_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(GLOSSARY_SECTION_ANCHORS).map(([id, anchor]) => [anchor, id]),
);

export const useNavigationStore = defineStore("navigation", () => {
  const activeTab = ref<TabId>("overview");
  const glossaryTarget = ref<string | null>(null);
  const glossaryAnchor = ref<string | null>(null);
  const includeUnavailable = ref(false);

  function currentUrl(): string {
    const selection = useSelectionStore();
    return buildUrl({
      tab: activeTab.value,
      selectedLubricant: selection.selectedName,
      includeUnavailable: includeUnavailable.value,
      glossaryAnchor: activeTab.value === "glossary" ? glossaryAnchor.value : null,
    });
  }

  function navigateTo(tab: TabId) {
    activeTab.value = tab;
    glossaryTarget.value = null;
    glossaryAnchor.value = null;
    history.pushState(null, "", currentUrl());
  }

  function navigateToGlossary(sectionId: string) {
    activeTab.value = "glossary";
    glossaryTarget.value = sectionId;
    glossaryAnchor.value = GLOSSARY_SECTION_ANCHORS[sectionId] ?? null;
    history.pushState(null, "", currentUrl());
  }

  function setGlossarySection(anchor: string) {
    glossaryAnchor.value = anchor;
    history.replaceState(null, "", currentUrl());
  }

  function setIncludeUnavailable(val: boolean) {
    includeUnavailable.value = val;
    history.replaceState(null, "", currentUrl());
  }

  function syncSelection() {
    history.replaceState(null, "", currentUrl());
  }

  function initFromUrl(): string | null {
    const state = parseUrl();
    activeTab.value = state.tab;
    includeUnavailable.value = state.includeUnavailable;
    if (state.glossaryAnchor && state.tab === "glossary") {
      glossaryAnchor.value = state.glossaryAnchor;
      glossaryTarget.value = GLOSSARY_ANCHOR_TO_ID[state.glossaryAnchor] ?? null;
    }
    return state.selectedLubricant;
  }

  function restoreFromUrl(): string | null {
    const state = parseUrl();
    activeTab.value = state.tab;
    includeUnavailable.value = state.includeUnavailable;
    glossaryAnchor.value = state.tab === "glossary" ? state.glossaryAnchor : null;
    glossaryTarget.value =
      state.tab === "glossary" && state.glossaryAnchor
        ? (GLOSSARY_ANCHOR_TO_ID[state.glossaryAnchor] ?? null)
        : null;
    return state.selectedLubricant;
  }

  function clearGlossaryTarget() {
    glossaryTarget.value = null;
  }

  return {
    activeTab,
    glossaryTarget,
    glossaryAnchor,
    includeUnavailable,
    navigateTo,
    navigateToGlossary,
    setGlossarySection,
    setIncludeUnavailable,
    syncSelection,
    initFromUrl,
    restoreFromUrl,
    clearGlossaryTarget,
    currentUrl,
  };
});
