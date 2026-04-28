<script setup lang="ts">
import { computed } from "vue";
import type { Product } from "../types";
import { useSelectionStore } from "../stores/selection";
import LubricantCard from "./LubricantCard.vue";

const props = defineProps<{ products: Product[] }>();

const store = useSelectionStore();

const sortedProducts = computed(() =>
  [...props.products].sort(
    (a, b) =>
      (b.mainTest?.testKilometerEquivalent ?? -Infinity) -
      (a.mainTest?.testKilometerEquivalent ?? -Infinity),
  ),
);

const selectedProduct = computed(
  () => props.products.find((p) => p.name === store.selectedName) ?? null,
);

const unselectedProducts = computed(() =>
  sortedProducts.value.filter((p) => p.name !== store.selectedName),
);
</script>

<template>
  <div>
    <div v-if="selectedProduct" class="selected-section">
      <p class="selected-label">Selected lubricant</p>
      <LubricantCard
        :product="selectedProduct"
        :highlighted="true"
        :closable="true"
        class="selected-card"
        @close="store.clear()"
      />
    </div>

    <div class="product-grid">
      <LubricantCard
        v-for="product in unselectedProducts"
        :key="product.name"
        :product="product"
        :selectable="true"
        @select="store.select(product.name)"
      />
    </div>
  </div>
</template>

<style scoped>
.selected-section {
  margin-bottom: 20px;
}

.selected-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.selected-card {
  max-width: 320px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}
</style>
