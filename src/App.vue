<script setup lang="ts">
import { ref } from "vue";
import { products } from "./data";
import { useSelectionStore } from "./stores/selection";
import MainTestOverviewChart from "./components/MainTestOverviewChart.vue";
import MainTestBlockChart from "./components/MainTestBlockChart.vue";
import LubricantDetails from "./components/LubricantDetails.vue";
import LongevityChart from "./components/LongevityChart.vue";

type TabId = "overview" | "blocks" | "details" | "longevity";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Main Test Overview" },
  { id: "blocks", label: "Main Test Blocks" },
  { id: "longevity", label: "Single Application Longevity" },
  { id: "details", label: "Lubricant Details" },
];

const activeTab = ref<TabId>("overview");
const store = useSelectionStore();
</script>

<template>
  <header class="app-header">
    <h1>Chain Lubricant Test Results</h1>
    <p class="subtitle">Comparative performance analysis of bicycle chain lubricants</p>
  </header>

  <main>
    <div v-if="store.selectedName" class="selection-banner">
      <span
        >Selected lubricant: <strong>{{ store.selectedName }}</strong></span
      >
      <button class="clear-btn" @click="store.clear()">✕</button>
    </div>

    <nav class="tab-nav" role="tablist">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="tab-panel">
      <template v-if="activeTab === 'overview'">
        <p class="section-desc">
          Test kilometers to fully wear one chain, derived from cumulative chain wear across all
          completed blocks. Higher is better.
        </p>
        <MainTestOverviewChart :products="products" />
      </template>

      <template v-else-if="activeTab === 'blocks'">
        <p class="section-desc">
          Chain wear in the selected 1000 km block of the Main Test. Lower is better.
        </p>
        <MainTestBlockChart :products="products" />
      </template>

      <template v-else-if="activeTab === 'longevity'">
        <p class="section-desc">
          Total distance (km) until chain replacement is needed per single application, by riding
          condition. Higher is better. Hover to see jump point (when wear rate accelerates).
        </p>
        <LongevityChart :products="products" />
      </template>

      <template v-else-if="activeTab === 'details'">
        <LubricantDetails :products="products" />
      </template>
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

.selection-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--radius);
  padding: 10px 16px;
  font-size: 0.875rem;
  margin-bottom: 16px;
  color: var(--text-heading);
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-muted);
  padding: 0 4px;
  line-height: 1;
}

.clear-btn:hover {
  color: var(--text-heading);
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
</style>
