<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { CATEGORY_COLORS } from "../constants";
import { useBarChart } from "../composables/useBarChart";
import SelectedOnlyToggle from "./SelectedOnlyToggle.vue";
import {
  makeCategorySeriesData,
  makeProductXAxis,
  makeSelectionMarkArea,
  DARK_VALUE_AXIS_STYLE,
  CHART_GRID,
  BAR_MAX_WIDTH,
  tooltipSwatch,
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
  selectedProducts,
  legendItems,
  hiddenCategories,
  visibleEntries,
  handleLegendChange,
  handleChartClick,
  chartMinWidth,
} = useBarChart(() => props.products, sortedEntries, chartRef);

const option = computed((): EChartsOption => {
  const entries = visibleEntries.value;
  const allCategories = [...new Set(sortedEntries.value.map((e) => e.category))];
  const selectedNamesSet = store.selectedNames;

  return {
    backgroundColor: "transparent",
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
          color: string;
        }>;
        const item = items.find((i) => i.value != null);
        if (!item) return "";
        return `${tooltipSwatch(item.color)}<b>${item.name}</b>: ${Math.round(item.value!)} km`;
      },
    },
    grid: CHART_GRID,
    xAxis: makeProductXAxis(
      entries.map((e) => e.name),
      selectedNamesSet,
    ),
    yAxis: {
      ...DARK_VALUE_AXIS_STYLE,
      type: "value",
      name: "Main Test Kilometers",
      nameLocation: "middle",
      nameGap: 52,
      axisLabel: {
        formatter: (val: number) => String(Math.round(val)),
      },
    },
    series: allCategories.map((cat) => ({
      name: cat,
      type: "bar" as const,
      stack: "main",
      color: CATEGORY_COLORS[cat],
      data: makeCategorySeriesData(entries, cat, (e) => e.equivalent),
      barMaxWidth: BAR_MAX_WIDTH,
      markArea: makeSelectionMarkArea(
        entries
          .filter((e) => e.category === cat && selectedNamesSet.has(e.name))
          .map((e) => e.name),
      ),
    })),
  };
});
</script>

<template>
  <div class="main-test-overview-chart">
    <SelectedOnlyToggle />
    <div class="chart-scroll-outer">
      <div
        class="chart-wrapper"
        :style="{ minWidth: chartMinWidth + 'px' }"
        @click="handleChartClick"
      >
        <VChart
          ref="chartRef"
          :option="option"
          theme="dark"
          style="height: max(420px, 60vh)"
          autoresize
          @legendselectchanged="handleLegendChange"
        />
      </div>
    </div>
    <div v-if="selectedProducts.length" class="selected-cards">
      <LubricantCard
        v-for="product in selectedProducts"
        :key="product.name"
        :product="product"
        :highlighted="true"
        :closable="true"
        @close="store.deselect(product.name)"
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

.selected-only-toggle {
  margin-top: 10px;
}
</style>
