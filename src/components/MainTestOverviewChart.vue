<script setup lang="ts">
import { computed } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { CATEGORY_COLORS } from "../constants";
import { useBarChart } from "../composables/useBarChart";
import { makeCategoryBarData, makeProductXAxis, makeSelectionMarkArea } from "../utils/chartUtils";
import LubricantCard from "./LubricantCard.vue";

const props = defineProps<{ products: Product[] }>();

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

const { store, chartRef, selectedProduct, legendItems, handleChartClick } = useBarChart(
  () => props.products,
  sortedEntries,
);

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
    grid: { left: 72, right: 24, top: 40, bottom: 130 },
    xAxis: makeProductXAxis(
      entries.map((e) => e.name),
      selected,
    ),
    yAxis: {
      type: "value",
      name: "Main Test Kilometers",
      nameLocation: "middle",
      nameGap: 52,
      nameTextStyle: { fontSize: 12 },
      axisLabel: { formatter: (val: number) => String(Math.round(val)) },
    },
    series: [
      {
        type: "bar",
        data: makeCategoryBarData(entries, (e) => e.equivalent),
        barMaxWidth: 56,
        markArea: selIdx >= 0 ? makeSelectionMarkArea(entries[selIdx].name) : undefined,
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
      <LubricantCard
        :product="selectedProduct"
        :highlighted="true"
        :closable="true"
        @close="store.clear()"
      />
    </div>
  </div>
</template>

<style>
@import "../styles/chart.css";
</style>

<style scoped>
.main-test-overview-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  font-size: 13px;
}
</style>
