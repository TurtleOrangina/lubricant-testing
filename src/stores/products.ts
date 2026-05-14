import { defineStore } from "pinia";
import { ref } from "vue";
import type { Product } from "../types";
import { convertCsvToProducts } from "../utils/convertCsv";
import type { ParseLogEntry } from "../utils/convertCsv";

export const useProductsStore = defineStore("products", () => {
  const products = ref<Product[]>([]);
  const parseLog = ref<ParseLogEntry[]>([]);
  const loadError = ref<string | null>(null);

  async function loadProducts(): Promise<void> {
    try {
      const url = import.meta.env.DEV
        ? import.meta.env.BASE_URL + "assets/data.csv"
        : new URL("data.csv", import.meta.url).href;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const result = convertCsvToProducts(text);
      products.value = result.products;
      parseLog.value = result.log;
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : String(e);
    }
  }

  return { products, parseLog, loadError, loadProducts };
});
