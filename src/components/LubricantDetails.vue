<script setup lang="ts">
import { computed } from "vue";
import type { Product } from "../types";
import LubricantCard from "./LubricantCard.vue";

const props = defineProps<{ products: Product[] }>();

const sortedProducts = computed(() =>
  [...props.products].sort(
    (a, b) =>
      (b.mainTest?.testKilometerEquivalent ?? -Infinity) -
      (a.mainTest?.testKilometerEquivalent ?? -Infinity),
  ),
);
</script>

<template>
  <div class="product-grid">
    <LubricantCard v-for="product in sortedProducts" :key="product.name" :product="product" />
  </div>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}
</style>
