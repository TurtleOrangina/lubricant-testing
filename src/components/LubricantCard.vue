<script setup lang="ts">
import type { Product } from "../types";
import { BLOCK_LABELS, CATEGORY_COLORS, LONGEVITY_CONDITIONS } from "../constants";
import GlossaryLink from "./GlossaryLink.vue";

const props = defineProps<{
  product: Product;
  highlighted?: boolean;
  selectable?: boolean;
}>();
const emit = defineEmits<{ select: [] }>();

function roundToHundreds(n: number): number {
  return Math.round(n / 100) * 100;
}

function priceFor6000km(p: Product): string {
  if (p.costPackageAUD == null || p.usagesMainTest == null) return "Unknown";
  return `$${(p.costPackageAUD * p.usagesMainTest).toFixed(0)}`;
}

function costTooltip(p: Product): string {
  const unitCost = p.costPackageAUD != null ? `${p.costPackageAUD.toFixed(2)} AUD` : "Unknown";
  const usages = p.usagesMainTest != null ? String(p.usagesMainTest) : "Unknown";
  return `Product cost per unit: ${unitCost}\nUnits used in Main Test: ${usages}`;
}
</script>

<template>
  <div :class="['product-card', { highlighted: props.highlighted }]">
    <div
      class="card-top"
      :class="{ 'card-top--selectable': props.selectable }"
      @click="props.selectable ? emit('select') : undefined"
    >
      <div class="card-header">
        <div class="product-name">{{ product.name }}</div>
      </div>
      <div v-if="product.note" class="product-note">{{ product.note }}</div>
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
    </div>

    <div class="stats">
      <div class="stat-row">
        <span class="stat-label">
          <GlossaryLink section="main-test-kilometers">Main Test Kilometers</GlossaryLink>
        </span>
        <span class="stat-value">
          {{
            product.mainTest
              ? `${roundToHundreds(product.mainTest.testKilometerEquivalent).toLocaleString()} km`
              : "No data"
          }}
        </span>
      </div>

      <template v-if="product.mainTest?.blockWear?.length">
        <div class="stat-row">
          <span class="stat-label">
            Main Test <GlossaryLink section="chain-wear">chain wear</GlossaryLink>
          </span>
        </div>
        <div
          v-for="(block, i) in product.mainTest.blockWear"
          :key="i"
          class="stat-row stat-row--indented"
        >
          <span class="stat-label">
            <GlossaryLink section="main-test-blocks">{{ BLOCK_LABELS[i] }}</GlossaryLink>
          </span>
          <span class="stat-value"> {{ Math.round(100 * block.wearRate) }}% </span>
        </div>
      </template>

      <div class="stat-row">
        <span class="stat-label">Commercially available</span>
        <span class="stat-value">{{ product.commerciallyAvailable ? "Yes" : "No" }}</span>
      </div>

      <div class="stat-row has-tooltip">
        <span class="stat-label">
          <GlossaryLink section="lubricant-cost">Lubricant cost</GlossaryLink>
        </span>
        <span class="stat-value">{{ priceFor6000km(product) }}</span>
        <div class="tooltip-bubble tooltip-bubble--pre">{{ costTooltip(product) }}</div>
      </div>

      <div class="stat-row">
        <span class="stat-label">
          <GlossaryLink section="single-application-longevity">Longevity</GlossaryLink>
        </span>
        <span v-if="!product.longevity" class="stat-value">Not tested</span>
      </div>

      <template v-if="product.longevity">
        <template v-for="cond in LONGEVITY_CONDITIONS" :key="cond.key">
          <template v-if="product.longevity[cond.key]">
            <div class="stat-row stat-row--indented">
              <span class="stat-label stat-label--condition">{{ cond.label }}</span>
            </div>
            <div class="stat-row stat-row--double-indented">
              <span class="stat-label">Jump Point</span>
              <span class="stat-value"
                >{{ product.longevity[cond.key]!.jumpPoint.toLocaleString() }} km</span
              >
            </div>
            <div class="stat-row stat-row--double-indented">
              <span class="stat-label">Wear Allowance</span>
              <span class="stat-value"
                >{{ product.longevity[cond.key]!.wearAllowance.toLocaleString() }} km</span
              >
            </div>
          </template>
        </template>
      </template>
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

.card-top {
  margin: -16px -16px 0;
  padding: 16px 16px 0;
  border-radius: var(--radius) var(--radius) 0 0;
}

.card-top--selectable {
  cursor: pointer;
}

.card-top--selectable:hover {
  background: rgba(0, 0, 0, 0.03);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 0;
}

.product-card.highlighted {
  border-color: #3b82f6;
  box-shadow:
    0 0 0 2px rgba(59, 130, 246, 0.2),
    var(--shadow-sm);
}

.product-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-heading);
  margin-bottom: 2px;
  line-height: 1.35;
}

.product-note {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
  margin-bottom: 8px;
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

.stat-row--double-indented {
  padding-left: 20px;
}

.stat-row--double-indented .stat-label {
  font-size: 0.75rem;
}

.stat-label--condition {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-heading);
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
