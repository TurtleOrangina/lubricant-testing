<script setup lang="ts">
import type { Product } from '../types'
import { CATEGORY_COLORS } from '../constants'

defineProps<{ products: Product[] }>()

function blocksLabel(p: Product): string {
  if (!p.mainTest) return 'No data'
  return `${p.mainTest.length} / 6 blocks`
}

function longevityLabel(p: Product): string {
  if (!p.longevity) return 'Not tested'
  const count = [p.longevity.dryRoad, p.longevity.dryGravel, p.longevity.extremeConditions].filter(
    Boolean,
  ).length
  return `${count} / 3 conditions`
}
</script>

<template>
  <div class="product-grid">
    <div v-for="product in products" :key="product.name" class="product-card">
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
        <span class="cost">
          {{ product.costAUD != null ? `AUD ${product.costAUD.toFixed(2)}` : 'Price unknown' }}
        </span>
      </div>
      <div class="product-stats">
        <div class="stat">
          <span class="stat-label">Main test</span>
          <span class="stat-value">{{ blocksLabel(product) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Longevity</span>
          <span class="stat-value">{{ longevityLabel(product) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 14px;
}

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
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.category-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  letter-spacing: 0.02em;
}

.cost {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.product-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  gap: 8px;
}

.stat-label {
  color: var(--text-muted);
}

.stat-value {
  font-weight: 500;
  color: var(--text-heading);
}
</style>
