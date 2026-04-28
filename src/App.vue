<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { storeToRefs } from "pinia";
import MainTestOverviewChart from "./components/MainTestOverviewChart.vue";
import MainTestBlockChart from "./components/MainTestBlockChart.vue";
import LubricantDetails from "./components/LubricantDetails.vue";
import LongevityChart from "./components/LongevityChart.vue";
import Glossary from "./components/Glossary.vue";
import GlossaryLink from "./components/GlossaryLink.vue";
import AdminTab from "./components/AdminTab.vue";
import { useNavigationStore } from "./stores/navigation";
import { useProductsStore } from "./stores/products";
import type { TabId } from "./stores/navigation";

const nav = useNavigationStore();
const { products } = storeToRefs(useProductsStore());

const includeUnavailable = ref(false);
const filteredProducts = computed(() =>
  includeUnavailable.value ? products.value : products.value.filter((p) => p.commerciallyAvailable),
);

function onPopState(event: PopStateEvent) {
  nav.restoreFromHistory(event.state);
}

onMounted(() => {
  history.replaceState({ tab: nav.activeTab }, "");
  window.addEventListener("popstate", onPopState);
});

onUnmounted(() => {
  window.removeEventListener("popstate", onPopState);
});

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Main Test Overview" },
  { id: "blocks", label: "Main Test Blocks" },
  { id: "longevity", label: "Single Application Longevity" },
  { id: "details", label: "Lubricant Details" },
  { id: "glossary", label: "Glossary" },
  { id: "admin", label: "Admin" },
];
</script>

<template>
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
          How many kilometres of the <GlossaryLink section="main-test">Main Test</GlossaryLink> does
          it take to fully <GlossaryLink section="chain-wear">wear</GlossaryLink> one chain? See
          <GlossaryLink section="main-test-kilometers"> Main Test Kilometers</GlossaryLink> for
          details. Higher is better.
        </p>
        <MainTestOverviewChart :products="filteredProducts" />
      </template>

      <template v-else-if="nav.activeTab === 'blocks'">
        <p class="section-desc">
          <GlossaryLink section="chain-wear">Chain wear</GlossaryLink> in the selected 1000 km block
          of the <GlossaryLink section="main-test">Main Test</GlossaryLink>. Lower is better.
        </p>
        <MainTestBlockChart :products="filteredProducts" />
      </template>

      <template v-else-if="nav.activeTab === 'longevity'">
        <p class="section-desc">
          Total distance (km) until chain replacement is needed with a
          <GlossaryLink section="single-application-longevity">single application</GlossaryLink> of
          lubricant, depending on the selected riding condition. Higher is better.
        </p>
        <LongevityChart :products="filteredProducts" />
      </template>

      <template v-else-if="nav.activeTab === 'details'">
        <LubricantDetails :products="filteredProducts" />
      </template>

      <template v-else-if="nav.activeTab === 'glossary'">
        <Glossary />
      </template>

      <template v-else-if="nav.activeTab === 'admin'">
        <AdminTab />
      </template>
    </div>

    <div class="filter-bar">
      <label class="filter-checkbox">
        <input v-model="includeUnavailable" type="checkbox" />
        Include unavailable products
      </label>
    </div>
  </main>
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
  color: var(--text-muted);
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
  background: var(--surface);
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

.filter-bar {
  padding: 12px 0 4px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
}

.filter-checkbox input[type="checkbox"] {
  cursor: pointer;
}
</style>
