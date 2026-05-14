<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useProductsStore } from "../stores/products";

const { parseLog, products, loadError } = storeToRefs(useProductsStore());

function hasErrors() {
  return parseLog.value.some((e) => e.level === "error");
}
</script>

<template>
  <div class="parse-page">
    <h1>CSV Parse Report</h1>
    <p class="source-file">data.csv</p>

    <div v-if="loadError" class="load-error">Failed to load data.csv: {{ loadError }}</div>

    <template v-else>
      <p :class="['summary', hasErrors() ? 'result-error' : 'result-success']">
        {{ hasErrors() ? "Loaded with errors" : "Loaded successfully" }} —
        {{ products.length }} products
      </p>
      <div class="log-panel">
        <div v-for="(entry, i) in parseLog" :key="i" :class="['log-entry', `log-${entry.level}`]">
          <span class="log-icon">{{
            entry.level === "error" ? "✕" : entry.level === "warning" ? "⚠" : "·"
          }}</span>
          {{ entry.message }}
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.parse-page {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.source-file {
  font-family: monospace;
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
}

.load-error {
  padding: 10px 14px;
  border-radius: var(--radius);
  background: color-mix(in srgb, #dc2626 12%, transparent);
  color: #991b1b;
  border: 1px solid color-mix(in srgb, #dc2626 30%, transparent);
  font-size: 0.875rem;
}

.summary {
  font-size: 0.875rem;
  padding: 8px 12px;
  border-radius: var(--radius);
  margin: 0;
}

.result-success {
  background: color-mix(in srgb, #22c55e 12%, transparent);
  color: #166534;
  border: 1px solid color-mix(in srgb, #22c55e 30%, transparent);
}

.result-error {
  background: color-mix(in srgb, #f59e0b 12%, transparent);
  color: #92400e;
  border: 1px solid color-mix(in srgb, #f59e0b 30%, transparent);
}

.log-panel {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.8rem;
  font-family: monospace;
  background: color-mix(in srgb, var(--surface) 60%, transparent);
}

.log-entry {
  display: flex;
  gap: 8px;
  line-height: 1.4;
}

.log-icon {
  flex-shrink: 0;
  width: 1em;
  text-align: center;
}

.log-info {
  color: var(--text-muted);
}

.log-warning {
  color: #b45309;
}

.log-error {
  color: #dc2626;
}
</style>
