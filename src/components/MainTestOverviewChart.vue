<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { CATEGORY_COLORS } from "../constants";
import { useBarChart } from "../composables/useBarChart";
import {
  makeCategorySeriesData,
  makeProductXAxis,
  makeSelectionMarkArea,
} from "../utils/chartUtils";
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

const chartRef = useTemplateRef<InstanceType<typeof VChart>>("chartRef");
const {
  store,
  selectedProduct,
  legendItems,
  hiddenCategories,
  handleLegendChange,
  handleChartClick,
  chartMinWidth,
} = useBarChart(() => props.products, sortedEntries, chartRef);

const option = computed((): EChartsOption => {
  const entries = sortedEntries.value;
  const selected = store.selectedName;
  const selIdx = selected ? entries.findIndex((e) => e.name === selected) : -1;
  const selectedCategory = selIdx >= 0 ? entries[selIdx].category : null;
  const categories = [...new Set(entries.map((e) => e.category))];

  return {
    legend: {
      top: 4,
      left: "center",
      itemWidth: 14,
      itemHeight: 14,
      itemGap: 20,
      textStyle: { fontSize: 13 },
      data: legendItems.value.map((item) => ({ name: item.category })),
      selected: Object.fromEntries(
        legendItems.value.map((item) => [
          item.category,
          !hiddenCategories.value.has(item.category),
        ]),
      ),
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const items = (Array.isArray(params) ? params : [params]) as Array<{
          name: string;
          value: number | null;
          marker: string;
        }>;
        const item = items.find((i) => i.value != null);
        if (!item) return "";
        return `${item.marker}<b>${item.name}</b>: ${Math.round(item.value!)} km`;
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
    series: categories.map((cat) => ({
      name: cat,
      type: "bar" as const,
      stack: "main",
      color: CATEGORY_COLORS[cat],
      data: makeCategorySeriesData(entries, cat, (e) => e.equivalent),
      barMaxWidth: 56,
      markArea:
        selIdx >= 0 && cat === selectedCategory
          ? makeSelectionMarkArea(entries[selIdx].name)
          : undefined,
    })),
  };
});
</script>

<template>
  <div class="main-test-overview-chart">
    <div class="chart-scroll-outer">
      <div
        class="chart-wrapper"
        :style="{ minWidth: chartMinWidth + 'px' }"
        @click="handleChartClick"
      >
        <VChart
          ref="chartRef"
          :option="option"
          style="height: 420px"
          autoresize
          @legendselectchanged="handleLegendChange"
        />
      </div>
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
</style>
