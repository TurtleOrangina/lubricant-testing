<script setup lang="ts">
import { useNavigationStore, GLOSSARY_SECTION_ANCHORS } from "../stores/navigation";

const props = defineProps<{ sectionId: string; heading: string }>();
const nav = useNavigationStore();

function handleClick() {
  const anchor = GLOSSARY_SECTION_ANCHORS[props.sectionId];
  if (!anchor) return;
  nav.setGlossarySection(anchor);
  document.getElementById(props.sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <h3 class="section-heading">
    <button class="anchor-btn" :aria-label="`Link to ${heading}`" @click="handleClick">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    </button>
    {{ heading }}
  </h3>
</template>

<style scoped>
.section-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.2rem;
  margin-bottom: 12px;
  color: var(--text-heading);
}

.anchor-btn {
  opacity: 0;
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition:
    opacity 0.15s,
    color 0.15s;
  flex-shrink: 0;
}

.section-heading:hover .anchor-btn,
.anchor-btn:focus-visible {
  opacity: 1;
}

.anchor-btn:hover {
  color: var(--text-heading);
}
</style>
