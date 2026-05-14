import { defineStore } from "pinia";
import { ref } from "vue";

export const useSelectionStore = defineStore("selection", () => {
  const selectedName = ref<string | null>(null);

  function select(name: string) {
    selectedName.value = selectedName.value === name ? null : name;
  }

  function clear() {
    selectedName.value = null;
  }

  function setFromUrl(name: string | null) {
    selectedName.value = name;
  }

  return { selectedName, select, clear, setFromUrl };
});
