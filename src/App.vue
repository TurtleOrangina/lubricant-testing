<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import MainTestOverviewChart from "./components/MainTestOverviewChart.vue";
import MainTestBlockChart from "./components/MainTestBlockChart.vue";
import LubricantDetails from "./components/LubricantDetails.vue";
import LongevityChart from "./components/LongevityChart.vue";
import CostToRunChart from "./components/CostToRunChart.vue";
import Glossary from "./components/Glossary.vue";
import GlossaryLink from "./components/GlossaryLink.vue";
import ParseDataCsv from "./components/ParseDataCsv.vue";
import { useNavigationStore, type TabId } from "./stores/navigation";
import { useProductsStore } from "./stores/products";
import { useSelectionStore } from "./stores/selection";
import { isParseDataCsvRoute } from "./utils/url";

const nav = useNavigationStore();
const { products } = storeToRefs(useProductsStore());
const selection = useSelectionStore();
const { selectedNames } = storeToRefs(selection);

const showParseRoute = ref(isParseDataCsvRoute());

watch(selectedNames, () => {
  nav.syncSelection();
});

function onPopState() {
  if (isParseDataCsvRoute()) {
    showParseRoute.value = true;
    return;
  }
  showParseRoute.value = false;
  const selectedLubricants = nav.restoreFromUrl();
  selection.setFromUrl(selectedLubricants);
}

onMounted(() => {
  if (!showParseRoute.value) {
    const selectedLubricants = nav.initFromUrl();
    selection.setFromUrl(selectedLubricants);
    history.replaceState(null, "", nav.currentUrl());
  }
  window.addEventListener("popstate", onPopState);
});

onUnmounted(() => {
  window.removeEventListener("popstate", onPopState);
});

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Main Test Overview" },
  { id: "blocks", label: "Main Test Blocks" },
  { id: "longevity", label: "Single Application Longevity" },
  { id: "cost-to-run", label: "Cost to Run" },
  { id: "details", label: "Lubricant Details" },
  { id: "glossary", label: "Glossary" },
];
</script>

<template>
  <template v-if="showParseRoute">
    <ParseDataCsv />
  </template>

  <template v-else>
    <header class="app-header">
      <h1>Chain Lubricant Test Results</h1>
      <p class="subtitle">Comparative chain wear analysis of bicycle chain lubricants</p>
    </header>

    <main>
      <nav class="tab-nav" role="tablist">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          role="tab"
          :aria-selected="nav.activeTab === tab.id"
          :class="['tab-btn', { active: nav.activeTab === tab.id }]"
          @click="nav.navigateTo(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div class="tab-panel">
        <template v-if="nav.activeTab === 'overview'">
          <p class="section-desc">
            How many kilometres of the
            <GlossaryLink section="main-test">Main Test</GlossaryLink> does it take to fully
            <GlossaryLink section="chain-wear">wear</GlossaryLink> one chain? See
            <GlossaryLink section="main-test-kilometers"> Main Test Kilometers</GlossaryLink> for
            details. Higher is better.
          </p>
          <MainTestOverviewChart :products="products" />
        </template>

        <template v-else-if="nav.activeTab === 'blocks'">
          <p class="section-desc">
            <GlossaryLink section="chain-wear">Chain wear</GlossaryLink> in the selected 1000 km
            block of the <GlossaryLink section="main-test">Main Test</GlossaryLink>. Lower is
            better.
          </p>
          <MainTestBlockChart :products="products" />
        </template>

        <template v-else-if="nav.activeTab === 'longevity'">
          <p class="section-desc">
            Total distance (km) until chain replacement is needed with a
            <GlossaryLink section="single-application-longevity">single application</GlossaryLink>
            of lubricant, depending on the selected riding condition. Higher is better.
          </p>
          <LongevityChart :products="products" />
        </template>

        <template v-else-if="nav.activeTab === 'cost-to-run'">
          <p class="section-desc">
            <GlossaryLink section="cost-to-run">Cost to run</GlossaryLink> a lubricant, based on the
            cost of the lubricant itself, plus the cost incurred by drive-train wear. Lower is
            better.
          </p>
          <CostToRunChart :products="products" />
        </template>

        <template v-else-if="nav.activeTab === 'details'">
          <LubricantDetails :products="products" />
        </template>

        <template v-else-if="nav.activeTab === 'glossary'">
          <Glossary />
        </template>
      </div>
    </main>
  </template>
</template>

<style scoped>
.app-header {
  padding: 36px 0 28px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}

h1 {
  font-size: 1.875rem;
  margin-bottom: 6px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.tab-nav {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 18px;
  font-size: 0.875rem;
  font-weight: 500;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  color: var(--text);
  border-radius: 4px 4px 0 0;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.tab-btn:hover {
  color: var(--text-heading);
}

.tab-btn.active {
  color: var(--text-heading);
  border-bottom-color: #3b82f6;
}

.tab-panel {
  background: var(--surface-dim);
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 var(--radius) var(--radius);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.section-desc {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 20px;
}
</style>
