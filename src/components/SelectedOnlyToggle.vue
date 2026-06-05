<script setup lang="ts">
import { computed } from "vue";
import { useNavigationStore } from "../stores/navigation";
import { useSelectionStore } from "../stores/selection";

const nav = useNavigationStore();
const selection = useSelectionStore();

const selectedOnly = computed({
  get: () => nav.selectedOnly,
  set: (val: boolean) => nav.setSelectedOnly(val),
});
</script>

<template>
  <label class="selected-only-toggle">
    <input type="checkbox" v-model="selectedOnly" :disabled="!selection.selectedNames.size" />
    Show selected only
  </label>
</template>
