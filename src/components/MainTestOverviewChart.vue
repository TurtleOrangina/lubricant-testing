<script setup lang="ts">
import { computed, ref } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { CATEGORY_COLORS } from "../constants";
import { useSelectionStore } from "../stores/selection";
import LubricantCard from "./LubricantCard.vue";

const props = defineProps<{ products: Product[] }>();

const store = useSelectionStore();
const chartRef = ref<InstanceType<typeof VChart> | null>(null);

const selectedProduct = computed(
  () => props.products.find((p) => p.name === store.selectedName) ?? null,
);

interface BarEntry {
  name: string;
  equivalent: number;
  category: Product["category"];
  color: string;
}

const sortedEntries = computed((): BarEntry[] =>
  props.products
    .filter((p) => p.mainTest != null)
    .map((p) => ({
      name: p.name,
      equivalent: p.mainTest!.testKilometerEquivalent,
      category: p.category,
      color: CATEGORY_COLORS[p.category],
    }))
    .sort((a, b) => b.equivalent - a.equivalent),
);

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

function handleChartClick(event: MouseEvent) {
  if (!chartRef.value) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const result = chartRef.value.convertFromPixel({ seriesIndex: 0 }, [x, y]) as number[] | null;
  if (!result) return;
  const dataIdx = Math.round(result[0]);
  if (dataIdx < 0 || dataIdx >= sortedEntries.value.length) return;
  store.select(sortedEntries.value[dataIdx].name);
}

const option = computed((): EChartsOption => {
  const entries = sortedEntries.value;
  const selected = store.selectedName;
  const selIdx = selected ? entries.findIndex((e) => e.name === selected) : -1;

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
        return `${item.marker}<b>${item.name}</b>: ${Math.round(item.value)} km`;
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
        formatter: (value: string) => (value === selected ? `{b|${value}}` : value),
        rich: { b: { fontWeight: "bold", fontSize: 11, width: 120 } },
      },
    },
    yAxis: {
      type: "value",
      name: "Equivalent Test Kilometers",
      nameLocation: "middle",
      nameGap: 52,
      nameTextStyle: { fontSize: 12 },
      axisLabel: { formatter: (val: number) => String(Math.round(val)) },
    },
    series: [
      {
        type: "bar",
        data: entries.map((e) => ({
          value: e.equivalent,
          itemStyle: { color: e.color },
        })),
        barMaxWidth: 56,
        markArea:
          selIdx >= 0
            ? {
                silent: true,
                data: [[{ xAxis: entries[selIdx].name }, { xAxis: entries[selIdx].name }]],
                itemStyle: { color: "rgba(59, 130, 246, 0.12)" },
              }
            : undefined,
      },
    ],
  };
});
</script>

<template>
  <div class="main-test-overview-chart">
    <div class="chart-wrapper" @click="handleChartClick">
      <VChart ref="chartRef" :option="option" style="height: 420px" autoresize />
    </div>
    <div class="legend">
      <span v-for="item in legendItems" :key="item.category" class="legend-item">
        <span class="legend-swatch" :style="{ background: item.color }" />
        {{ item.category }}
      </span>
    </div>
    <div v-if="selectedProduct" class="selected-card">
      <p class="selected-label">Selected lubricant</p>
      <LubricantCard :product="selectedProduct" :highlighted="true" />
    </div>
  </div>
</template>

<style scoped>
.main-test-overview-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-wrapper {
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
