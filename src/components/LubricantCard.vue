<script setup lang="ts">
import type { Product } from "../types";
import { BLOCK_DESCRIPTIONS, CATEGORY_COLORS } from "../constants";

defineProps<{ product: Product }>();

const BLOCK_LABELS: Record<number, string> = {
  0: "Chain wear block 1",
  1: "Chain wear block 2",
  2: "Chain wear block 3",
  3: "Chain wear block 4",
  4: "Chain wear block 5",
  5: "Chain wear block 6",
};

const MAIN_TEST_KM_TOOLTIP =
  'Full Main Test - 6000km. Alternating clean and contamination test blocks including wet + extreme contamination. Unless specified otherwise, 30x relubrication during the test, without any cleaning maintenance. The Main Test Kilometers is the number of kilometers of the main test it takes to fully wear one chain (100% worn means 0.5% chain elongation). If a lubricant survives all 6000km of the main test, the kilometers is calculated linearly based on how worn the chain was at the end (e.g. if the chain was 50% worn after the 6000km main test, we list the "Main test Kilometers" as 12000km).';

const LONGEVITY_TOOLTIP =
  "How well a single application of the lubricant protects the chain - how long it lasts.";

function roundToHundreds(n: number): number {
  return Math.round(n / 100) * 100;
}

function longevityLabel(p: Product): string {
  if (!p.longevity) return "Not tested";
  const count = [p.longevity.dryRoad, p.longevity.dryGravel, p.longevity.extremeConditions].filter(
    Boolean,
  ).length;
  return `${count} / 3 conditions`;
}

function priceFor6000km(p: Product): string {
  if (p.costPackageAUD == null || p.usagesMainTest == null) return "Unknown";
  return `$${(p.costPackageAUD * p.usagesMainTest).toFixed(0)}`;
}

function costTooltip(p: Product): string {
  const unitCost = p.costPackageAUD != null ? `${p.costPackageAUD.toFixed(2)} AUD` : "Unknown";
  const usages = p.usagesMainTest != null ? String(p.usagesMainTest) : "Unknown";
  return `Total lubricant cost to run the full 6000km main test, in Australian Dollars.\nProduct cost per unit: ${unitCost}\nUnits used for 6000km Main Test: ${usages}`;
}
</script>

<template>
  <div class="product-card">
    <div class="product-name">{{ product.name }}</div>
    <div class="product-meta">
      <span
        class="category-badge"
        :style="{
          backgroundColor: CATEGORY_COLORS[product.category] + '22',
          color: CATEGORY_COLORS[product.category],
        }"
      >
        {{ product.category }}
      </span>
    </div>

    <div class="stats">
      <div class="stat-row has-tooltip">
        <span class="stat-label">Main Test Kilometers</span>
        <span class="stat-value">
          {{
            product.mainTest
              ? `${roundToHundreds(product.mainTest.testKilometerEquivalent).toLocaleString()} km`
              : "No data"
          }}
        </span>
        <div class="tooltip-bubble">{{ MAIN_TEST_KM_TOOLTIP }}</div>
      </div>

      <template v-if="product.mainTest?.blockWear?.length">
        <div
          v-for="(block, i) in product.mainTest.blockWear"
          :key="i"
          class="stat-row stat-row--indented has-tooltip"
        >
          <span class="stat-label">{{ BLOCK_LABELS[i] }}</span>
          <span class="stat-value">{{ Math.round(100 * block.wearRate) }}%</span>
          <div class="tooltip-bubble">{{ BLOCK_DESCRIPTIONS[i] }}</div>
        </div>
      </template>

      <div class="stat-row has-tooltip">
        <span class="stat-label">Lubricant cost</span>
        <span class="stat-value">{{ priceFor6000km(product) }}</span>
        <div class="tooltip-bubble tooltip-bubble--pre">{{ costTooltip(product) }}</div>
      </div>

      <div class="stat-row has-tooltip">
        <span class="stat-label">Longevity</span>
        <span class="stat-value">{{ longevityLabel(product) }}</span>
        <div class="tooltip-bubble">{{ LONGEVITY_TOOLTIP }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.product-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-heading);
  margin-bottom: 8px;
  line-height: 1.35;
}

.product-meta {
  margin-bottom: 12px;
}

.category-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  letter-spacing: 0.02em;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.8rem;
  gap: 8px;
  position: relative;
}

.stat-row--indented {
  padding-left: 10px;
}

.stat-row--indented .stat-label {
  font-size: 0.75rem;
}

.stat-label {
  color: var(--text-muted);
  flex-shrink: 0;
}

.stat-value {
  font-weight: 500;
  color: var(--text-heading);
  text-align: right;
}

.has-tooltip {
  cursor: help;
}

.tooltip-bubble {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 100;
  background: #1f2937;
  color: #f9fafb;
  font-size: 0.75rem;
  line-height: 1.5;
  padding: 8px 10px;
  border-radius: 6px;
  width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  white-space: normal;
}

.tooltip-bubble--pre {
  white-space: pre-line;
}

.has-tooltip:hover .tooltip-bubble {
  display: block;
}
</style>
