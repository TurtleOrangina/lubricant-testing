<script setup lang="ts">
import { computed, ref } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { CATEGORY_COLORS } from "../constants";

const props = defineProps<{ products: Product[] }>();

const BLOCK_LABELS: Record<number, string> = {
  0: "Block 1 – No Contamination",
  1: "Block 2 – Dry Offroad",
  2: "Block 3 – No Contamination",
  3: "Block 4 – Wet Conditions",
  4: "Block 5 – No Contamination",
  5: "Block 6 – Harsh Wet",
};

const selectedBlock = ref(0);

const availableBlocks = computed(() =>
  Object.entries(BLOCK_LABELS)
    .map(([k, v]) => ({ index: Number(k), label: v }))
    .filter(({ index }) =>
      props.products.some((p) => p.mainTest != null && p.mainTest[index] != null),
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
    .filter((p) => p.mainTest != null && p.mainTest[idx] != null)
    .map((p) => ({
      name: p.name,
      wearRate: p.mainTest![idx].wearRate,
      category: p.category,
      color: CATEGORY_COLORS[p.category],
    }))
    .sort((a, b) => b.wearRate - a.wearRate);
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
        return `${item.marker}<b>${item.name}</b>: ${item.value.toFixed(2)} mm/1000km`;
      },
    },
    grid: { left: 72, right: 24, top: 40, bottom: 100 },
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
      name: "mm / 1000 km",
      nameLocation: "middle",
      nameGap: 52,
      nameTextStyle: { fontSize: 12 },
      axisLabel: { formatter: (val: number) => val.toFixed(2) },
    },
    series: [
      {
        type: "bar",
        data: entries.map((e) => ({
          value: e.wearRate,
          itemStyle: { color: e.color },
        })),
        label: {
          show: true,
          position: "top",
          formatter: (params: unknown) => {
            const p = params as { value: number };
            return p.value.toFixed(2);
          },
          fontSize: 11,
        },
        barMaxWidth: 56,
      },
    ],
  };
});
</script>

<template>
  <div class="main-test-chart">
    <select v-model="selectedBlock" class="block-select">
      <option v-for="b in availableBlocks" :key="b.index" :value="b.index">
        {{ b.label }}
      </option>
    </select>

    <VChart :option="option" style="height: 420px" autoresize />

    <div class="legend">
      <span v-for="item in legendItems" :key="item.category" class="legend-item">
        <span class="legend-swatch" :style="{ background: item.color }" />
        {{ item.category }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.main-test-chart {
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
</style>
