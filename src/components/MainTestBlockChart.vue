<script setup lang="ts">
import { computed, ref } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { BLOCK_DESCRIPTIONS, BLOCK_LABELS, CATEGORY_COLORS } from "../constants";
import LubricantCard from "./LubricantCard.vue";

const props = defineProps<{ products: Product[] }>();

const selectedBlock = ref(0);
const selectedName = ref<string | null>(null);

const selectedProduct = computed(
  () => props.products.find((p) => p.name === selectedName.value) ?? null,
);

function onChartClick(params: unknown) {
  const { name } = params as { name: string };
  selectedName.value = selectedName.value === name ? null : name;
}

const availableBlocks = computed(() =>
  Object.entries(BLOCK_LABELS)
    .map(([k, v]) => ({ index: Number(k), label: v }))
    .filter(({ index }) =>
      props.products.some(
        (p) =>
          p.mainTest != null && p.mainTest.blockWear != null && p.mainTest.blockWear[index] != null,
      ),
    ),
);

interface BarEntry {
  name: string;
  wearRate: number;
  category: Product["category"];
  color: string;
}

const sortedEntries = computed((): BarEntry[] => {
  const idx = selectedBlock.value;
  return props.products
    .filter((p) => p.mainTest != null && p.mainTest.blockWear && p.mainTest.blockWear[idx] != null)
    .map((p) => ({
      name: p.name,
      wearRate: p.mainTest!.blockWear![idx].wearRate,
      category: p.category,
      color: CATEGORY_COLORS[p.category],
    }))
    .sort((a, b) => a.wearRate - b.wearRate);
});

const legendItems = computed(() => {
  const seen = new Set<string>();
  const items: { category: string; color: string }[] = [];
  for (const e of sortedEntries.value) {
    if (!seen.has(e.category)) {
      seen.add(e.category);
      items.push({ category: e.category, color: e.color });
    }
  }
  return items;
});

function tooltip(value: number): string {
  const percentage = Math.round(100 * value);
  return `${percentage}%`;
}

const option = computed((): EChartsOption => {
  const entries = sortedEntries.value;
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const item = (Array.isArray(params) ? params[0] : params) as {
          name: string;
          value: number;
          marker: string;
        };
        const percentage = Math.round(100 * item.value);
        return `${item.marker}<b>${item.name}</b>: ${percentage}%`;
      },
    },
    title: {
      text: BLOCK_LABELS[selectedBlock.value],
      subtext: BLOCK_DESCRIPTIONS[selectedBlock.value],
      subtextStyle: { fontSize: 12, color: "#6b7280" },
      top: 8,
      left: 60,
    },
    grid: { left: 72, right: 24, top: 72, bottom: 100 },
    xAxis: {
      type: "category",
      data: entries.map((e) => e.name),
      axisLabel: {
        rotate: 35,
        fontSize: 11,
        interval: 0,
        overflow: "truncate",
        width: 120,
      },
    },
    yAxis: {
      type: "value",
      name: "Chain wear",
      nameLocation: "middle",
      nameGap: 52,
      nameTextStyle: { fontSize: 12 },
      axisLabel: { formatter: tooltip },
    },
    series: [
      {
        type: "bar",
        data: entries.map((e) => ({
          value: e.wearRate,
          itemStyle: {
            color: e.color,
            ...(e.name === selectedName.value ? { borderColor: "#111827", borderWidth: 2 } : {}),
          },
        })),
        barMaxWidth: 56,
      },
    ],
  };
});
</script>

<template>
  <div class="main-test-block-chart">
    <select v-model="selectedBlock" class="block-select">
      <option v-for="b in availableBlocks" :key="b.index" :value="b.index">
        {{ b.label }}
      </option>
    </select>

    <VChart :option="option" style="height: 420px" autoresize @click="onChartClick" />

    <div class="legend">
      <span v-for="item in legendItems" :key="item.category" class="legend-item">
        <span class="legend-swatch" :style="{ background: item.color }" />
        {{ item.category }}
      </span>
    </div>

    <div v-if="selectedProduct" class="selected-card">
      <p class="selected-label">Selected lubricant</p>
      <LubricantCard :product="selectedProduct" />
    </div>
  </div>
</template>

<style scoped>
.main-test-block-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block-select {
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  font-size: 13px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
}

.selected-card {
  margin-top: 8px;
  max-width: 320px;
}

.selected-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}
</style>
