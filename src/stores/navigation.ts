import { defineStore } from "pinia";
import { ref } from "vue";

export type TabId = "overview" | "blocks" | "longevity" | "details" | "glossary";

interface NavHistoryState {
  tab: TabId;
}

export const useNavigationStore = defineStore("navigation", () => {
  const activeTab = ref<TabId>("overview");
  const glossaryTarget = ref<string | null>(null);

  function navigateTo(tab: TabId) {
    history.pushState({ tab } satisfies NavHistoryState, "");
    activeTab.value = tab;
    glossaryTarget.value = null;
  }

  function navigateToGlossary(sectionId: string) {
    history.pushState({ tab: "glossary" } satisfies NavHistoryState, "");
    activeTab.value = "glossary";
    glossaryTarget.value = sectionId;
  }

  function restoreFromHistory(state: NavHistoryState | null) {
    activeTab.value = state?.tab ?? "overview";
    glossaryTarget.value = null;
  }

  function clearGlossaryTarget() {
    glossaryTarget.value = null;
  }

  return {
    activeTab,
    glossaryTarget,
    navigateTo,
    navigateToGlossary,
    restoreFromHistory,
    clearGlossaryTarget,
  };
});
