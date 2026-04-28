<script setup lang="ts">
import { ref } from "vue";
import { useProductsStore } from "../stores/products";
import { convertCsvToProducts } from "../utils/convertCsv";

type UploadStatus =
  | { kind: "idle" }
  | { kind: "success"; count: number; fileName: string }
  | { kind: "error"; message: string };

const productsStore = useProductsStore();
const status = ref<UploadStatus>({ kind: "idle" });

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const products = convertCsvToProducts(reader.result as string);
      productsStore.setProducts(products);
      status.value = { kind: "success", count: products.length, fileName: file.name };
    } catch (err) {
      status.value = {
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      };
    }
    input.value = "";
  };
  reader.readAsText(file);
}
</script>

<template>
  <div class="admin-tab">
    <h2>Admin</h2>
    <p class="desc">
      Upload a <code>data.csv</code> file to reload the visualization data for this session. The
      data is held in memory only — a page refresh reverts to the bundled dataset.
    </p>

    <label class="upload-label">
      <span class="upload-btn">Choose CSV file</span>
      <input type="file" accept=".csv,text/csv" class="file-input" @change="onFileChange" />
    </label>

    <p v-if="status.kind === 'success'" class="status success">
      Loaded {{ status.count }} products from <strong>{{ status.fileName }}</strong
      >.
    </p>
    <p v-else-if="status.kind === 'error'" class="status error">Error: {{ status.message }}</p>
  </div>
</template>

<style scoped>
.admin-tab {
  max-width: 560px;
}

h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.desc {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 20px;
  line-height: 1.5;
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

.upload-btn {
  display: inline-block;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-heading);
  transition:
    background 0.15s,
    border-color 0.15s;
}

.upload-label:hover .upload-btn {
  border-color: #3b82f6;
  background: color-mix(in srgb, #3b82f6 8%, var(--surface));
}

.status {
  margin-top: 14px;
  font-size: 0.875rem;
  padding: 10px 14px;
  border-radius: var(--radius);
}

.success {
  background: color-mix(in srgb, #22c55e 12%, transparent);
  color: #166534;
  border: 1px solid color-mix(in srgb, #22c55e 30%, transparent);
}

.error {
  background: color-mix(in srgb, #ef4444 12%, transparent);
  color: #991b1b;
  border: 1px solid color-mix(in srgb, #ef4444 30%, transparent);
  word-break: break-word;
}
</style>
