<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { BLOCK_LABELS, CATEGORY_COLORS } from "../constants";
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
import { useNavigationStore } from "../stores/navigation";

const props = defineProps<{ products: Product[] }>();

const nav = useNavigationStore();
const selectedBlock = computed({
  get: () => nav.activeBlock,
  set: (val: number) => nav.setActiveBlock(val),
});

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

function formatPct(value: number): string {
  return `${Math.round(100 * value)}%`;
}

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
        return `${tooltipSwatch(item.color)}<b>${item.name}</b>: ${formatPct(item.value!)}`;
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
      name: "Chain wear",
      nameLocation: "middle",
      nameGap: 52,
      axisLabel: { formatter: (v: number) => formatPct(v) },
    },
    series: allCategories.map((cat) => ({
      name: cat,
      type: "bar" as const,
      stack: "main",
      color: CATEGORY_COLORS[cat],
      data: makeCategorySeriesData(entries, cat, (e) => e.wearRate),
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
  <div class="main-test-block-chart">
    <div class="chart-controls">
      <select v-model="selectedBlock" class="block-select">
        <option v-for="b in availableBlocks" :key="b.index" :value="b.index">
          {{ b.label }}
        </option>
      </select>
      <SelectedOnlyToggle />
    </div>

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
.main-test-block-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block-select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--select-border);
  background: var(--select-surface);
  background-color: var(--select-surface);
  color: var(--select-text);
  font-size: 14px;
  cursor: pointer;
}
.block-select option {
  background: #ffffff;
  color: #000000;
}
</style>
