<script setup lang="ts">
import { ref } from "vue";
import { useProductsStore } from "../stores/products";
import { convertCsvToProducts } from "../utils/convertCsv";
import type { ParseLogEntry } from "../utils/convertCsv";
import bundledCsvText from "../../data.csv?raw";

const productsStore = useProductsStore();

type UploadStatus =
  | { kind: "idle" }
  | { kind: "done"; fileName: string; productCount: number; log: ParseLogEntry[] };

const status = ref<UploadStatus>({ kind: "idle" });

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const { products, log } = convertCsvToProducts(reader.result as string);
    productsStore.setProducts(products);
    status.value = { kind: "done", fileName: file.name, productCount: products.length, log };
    input.value = "";
  };
  reader.readAsText(file);
}

function downloadBundledCsv() {
  const blob = new Blob([bundledCsvText], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function hasErrors(log: ParseLogEntry[]) {
  return log.some((e) => e.level === "error");
}
</script>

<template>
  <div class="admin-tab">
    <h2>Admin</h2>

    <section class="admin-section">
      <h3>Download source data</h3>
      <p class="desc">Download the CSV file bundled with this build.</p>
      <button class="action-btn" @click="downloadBundledCsv">Download data.csv</button>
    </section>

    <section class="admin-section">
      <h3>Upload CSV</h3>
      <p class="desc">
        Load a <code>data.csv</code> to update the visualisation for this session. A page refresh
        reverts to the bundled dataset.
      </p>
      <label class="upload-label">
        <span class="upload-btn">Choose CSV file</span>
        <input type="file" accept=".csv,text/csv" class="file-input" @change="onFileChange" />
      </label>

      <template v-if="status.kind === 'done'">
        <p :class="['upload-result', hasErrors(status.log) ? 'result-error' : 'result-success']">
          {{ hasErrors(status.log) ? "Loaded with errors" : "Loaded successfully" }} —
          {{ status.productCount }} products from <strong>{{ status.fileName }}</strong>
        </p>
        <div class="log-panel">
          <div
            v-for="(entry, i) in status.log"
            :key="i"
            :class="['log-entry', `log-${entry.level}`]"
          >
            <span class="log-icon">{{
              entry.level === "error" ? "✕" : entry.level === "warning" ? "⚠" : "·"
            }}</span>
            {{ entry.message }}
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.admin-tab {
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0;
}

.admin-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-heading);
  margin: 0;
}

.desc {
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.action-btn,
.upload-btn {
  display: inline-block;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-heading);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.action-btn:hover,
.upload-label:hover .upload-btn {
  border-color: #3b82f6;
  background: color-mix(in srgb, #3b82f6 8%, var(--surface));
}

.upload-label {
  display: inline-block;
  cursor: pointer;
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
}

.upload-result {
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
  max-height: 320px;
  overflow-y: auto;
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
