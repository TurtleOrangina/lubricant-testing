<script setup lang="ts">
import { computed, onMounted } from "vue";
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

function toggleSelect(name: string) {
  if (store.selectedName === name) store.clear();
  else store.select(name);
}

const cardEls: Record<string, HTMLElement> = {};
function setCardEl(el: unknown, name: string) {
  if (el) cardEls[name] = (el as { $el: HTMLElement }).$el;
  else delete cardEls[name];
}

onMounted(() => {
  if (store.selectedName) {
    cardEls[store.selectedName]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});
</script>

<template>
  <div>
    <div class="product-grid">
      <LubricantCard
        v-for="product in sortedProducts"
        :key="product.name"
        :ref="(el) => setCardEl(el, product.name)"
        :product="product"
        :highlighted="product.name === store.selectedName"
        :selectable="true"
        @select="toggleSelect(product.name)"
      />
    </div>
  </div>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}
</style>
