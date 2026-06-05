import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { buildUrl, parseUrl } from "../utils/url";
import { useSelectionStore } from "./selection";
import type { ConditionKey } from "../constants";
import { DEFAULT_DRIVETRAIN_COST } from "../constants";

export type TabId = "overview" | "blocks" | "longevity" | "cost-to-run" | "details" | "glossary";

export const GLOSSARY_SECTION_ANCHORS: Record<string, string> = {
  "main-test": "The Main Test",
  "main-test-blocks": "Main Test Blocks",
  "chain-wear": "Chain Wear",
  "main-test-kilometers": "Main Test Kilometers",
  "single-application-longevity": "Single Application Longevity",
  "lubricant-cost": "Lubricant Cost",
  "cost-to-run": "Cost to Run",
  "drive-train-cost": "Drive Train Cost",
};

export const GLOSSARY_ANCHOR_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(GLOSSARY_SECTION_ANCHORS).map(([id, anchor]) => [anchor, id]),
);

export const useNavigationStore = defineStore("navigation", () => {
  const activeTab = ref<TabId>("overview");
  const glossaryTarget = ref<string | null>(null);
  const glossaryAnchor = ref<string | null>(null);
  const activeBlock = ref<number>(0);
  const activeCondition = ref<ConditionKey>("dryRoad");
  const drivetrainCost = ref<number>(DEFAULT_DRIVETRAIN_COST);
  const selectedOnly = ref(false);

  const selectionStore = useSelectionStore();
  watch(
    () => selectionStore.selectedNames.size,
    (size) => {
      if (size === 0) selectedOnly.value = false;
    },
  );

  function currentUrl(): string {
    return buildUrl({
      tab: activeTab.value,
      selectedLubricants: [...selectionStore.selectedNames],
      glossaryAnchor: activeTab.value === "glossary" ? glossaryAnchor.value : null,
      block: activeTab.value === "blocks" ? activeBlock.value : null,
      condition: activeTab.value === "longevity" ? activeCondition.value : null,
      drivetrainCost: activeTab.value === "cost-to-run" ? drivetrainCost.value : null,
      selectedOnly: selectedOnly.value,
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

  function setActiveBlock(index: number) {
    activeBlock.value = index;
    history.replaceState(null, "", currentUrl());
  }

  function setActiveCondition(key: ConditionKey) {
    activeCondition.value = key;
    history.replaceState(null, "", currentUrl());
  }

  function setDrivetrainCost(val: number) {
    drivetrainCost.value = val;
    history.replaceState(null, "", currentUrl());
  }

  function setSelectedOnly(val: boolean) {
    selectedOnly.value = val;
    history.replaceState(null, "", currentUrl());
  }

  function syncSelection() {
    history.replaceState(null, "", currentUrl());
  }

  function initFromUrl(): string[] {
    const state = parseUrl();
    activeTab.value = state.tab;
    if (state.block != null) activeBlock.value = state.block;
    if (state.condition != null) activeCondition.value = state.condition;
    if (state.drivetrainCost != null) drivetrainCost.value = state.drivetrainCost;
    selectedOnly.value = state.selectedOnly;
    if (state.glossaryAnchor && state.tab === "glossary") {
      glossaryAnchor.value = state.glossaryAnchor;
      glossaryTarget.value = GLOSSARY_ANCHOR_TO_ID[state.glossaryAnchor] ?? null;
    }
    return state.selectedLubricants;
  }

  function restoreFromUrl(): string[] {
    const state = parseUrl();
    activeTab.value = state.tab;
    if (state.block != null) activeBlock.value = state.block;
    if (state.condition != null) activeCondition.value = state.condition;
    if (state.drivetrainCost != null) drivetrainCost.value = state.drivetrainCost;
    selectedOnly.value = state.selectedOnly;
    glossaryAnchor.value = state.tab === "glossary" ? state.glossaryAnchor : null;
    glossaryTarget.value =
      state.tab === "glossary" && state.glossaryAnchor
        ? (GLOSSARY_ANCHOR_TO_ID[state.glossaryAnchor] ?? null)
        : null;
    return state.selectedLubricants;
  }

  function clearGlossaryTarget() {
    glossaryTarget.value = null;
  }

  return {
    activeTab,
    glossaryTarget,
    glossaryAnchor,
    activeBlock,
    activeCondition,
    drivetrainCost,
    selectedOnly,
    navigateTo,
    navigateToGlossary,
    setGlossarySection,
    setActiveBlock,
    setActiveCondition,
    setDrivetrainCost,
    setSelectedOnly,
    syncSelection,
    initFromUrl,
    restoreFromUrl,
    clearGlossaryTarget,
    currentUrl,
  };
});
