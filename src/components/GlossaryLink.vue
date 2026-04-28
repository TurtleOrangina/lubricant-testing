<script setup lang="ts">
import { useNavigationStore } from "../stores/navigation";

const props = defineProps<{ section: string }>();
const nav = useNavigationStore();
</script>

<template>
  <button class="glossary-link" @click.stop="nav.navigateToGlossary(props.section)">
    <slot />
  </button>
</template>

<style scoped>
.glossary-link {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  color: #3b82f6;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
  font-weight: inherit;
  line-height: inherit;
  display: inline;
}

.glossary-link:hover {
  color: #1d4ed8;
}
</style>
