import { defineStore } from "pinia";
import { ref } from "vue";
import type { Product } from "../types";
import productsData from "../data.json";

export const useProductsStore = defineStore("products", () => {
  const products = ref<Product[]>(productsData as Product[]);

  function setProducts(newProducts: Product[]) {
    products.value = newProducts;
  }

  return { products, setProducts };
});
