<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { BLOCK_DESCRIPTIONS, BLOCK_LABELS, CATEGORY_COLORS } from "../constants";
import { useBarChart } from "../composables/useBarChart";
import {
  makeCategorySeriesData,
  makeProductXAxis,
  makeSelectionMarkArea,
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
  selectedProduct,
  legendItems,
  hiddenCategories,
  handleLegendChange,
  handleChartClick,
  chartMinWidth,
} = useBarChart(() => props.products, sortedEntries, chartRef);

function formatPct(value: number): string {
  return `${Math.round(100 * value)}%`;
}

const option = computed((): EChartsOption => {
  const entries = sortedEntries.value;
  const selected = store.selectedName;
  const selIdx = selected ? entries.findIndex((e) => e.name === selected) : -1;
  const selectedCategory = selIdx >= 0 ? entries[selIdx].category : null;
  const categories = [...new Set(entries.map((e) => e.category))];

  return {
    legend: {
      top: 52,
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
        return `${item.marker}<b>${item.name}</b>: ${formatPct(item.value!)}`;
      },
    },
    title: {
      text: BLOCK_LABELS[selectedBlock.value],
      subtext: BLOCK_DESCRIPTIONS[selectedBlock.value],
      subtextStyle: { fontSize: 12, color: "#6b7280" },
      top: 8,
      left: 60,
    },
    grid: { left: 72, right: 24, top: 80, bottom: 130 },
    xAxis: makeProductXAxis(
      entries.map((e) => e.name),
      selected,
    ),
    yAxis: {
      type: "value",
      name: "Chain wear",
      nameLocation: "middle",
      nameGap: 52,
      nameTextStyle: { fontSize: 12 },
      axisLabel: { formatter: (v: number) => formatPct(v) },
    },
    series: categories.map((cat) => ({
      name: cat,
      type: "bar" as const,
      stack: "main",
      color: CATEGORY_COLORS[cat],
      data: makeCategorySeriesData(entries, cat, (e) => e.wearRate),
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
  <div class="main-test-block-chart">
    <select v-model="selectedBlock" class="block-select">
      <option v-for="b in availableBlocks" :key="b.index" :value="b.index">
        {{ b.label }}
      </option>
    </select>

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
</style>
