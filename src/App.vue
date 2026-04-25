<script setup lang="ts">
import { products } from "./data";
import ProductSummary from "./components/ProductSummary.vue";
import MainTestChart from "./components/MainTestChart.vue";
import LongevityChart from "./components/LongevityChart.vue";
</script>

<template>
  <header class="app-header">
    <h1>Chain Lubricant Test Results</h1>
    <p class="subtitle">Comparative performance analysis of bicycle chain lubricants</p>
  </header>

  <main>
    <ProductSummary :products="products" />

    <section class="chart-section">
      <h2>Main Test: Chain Wear Rate</h2>
      <p class="section-desc">
        Chain wear (mm / 1000 km) across up to 6 × 1000 km blocks under varying conditions. Lower is
        better.
      </p>
      <MainTestChart :products="products" />
    </section>

    <section class="chart-section">
      <h2>Single Application Longevity</h2>
      <p class="section-desc">
        Total distance (km) until chain replacement is needed per single application, by riding
        condition. Higher is better. Hover to see jump point (when wear rate accelerates).
      </p>
      <LongevityChart :products="products" />
    </section>
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

.chart-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  margin-top: 20px;
  box-shadow: var(--shadow-sm);
}

.chart-section h2 {
  font-size: 1.05rem;
  margin-bottom: 4px;
}

.section-desc {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 20px;
}
</style>
