import { defineStore } from "pinia";
import { ref } from "vue";

export const useSelectionStore = defineStore("selection", () => {
  const selectedNames = ref<Set<string>>(new Set());

  function toggle(name: string) {
    const next = new Set(selectedNames.value);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    selectedNames.value = next;
  }

  function deselect(name: string) {
    const next = new Set(selectedNames.value);
    next.delete(name);
    selectedNames.value = next;
  }

  function clear() {
    selectedNames.value = new Set();
  }

  function setFromUrl(names: string[]) {
    selectedNames.value = new Set(names);
  }

  return { selectedNames, toggle, deselect, clear, setFromUrl };
});
