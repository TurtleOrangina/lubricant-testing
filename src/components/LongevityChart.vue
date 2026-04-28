<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { CATEGORY_COLORS, LONGEVITY_CONDITIONS } from "../constants";
import type { ConditionKey } from "../constants";
import { useBarChart } from "../composables/useBarChart";
import {
  makeCategorySeriesData,
  makeProductXAxis,
  makeSelectionMarkArea,
} from "../utils/chartUtils";
import LubricantCard from "./LubricantCard.vue";

const props = defineProps<{ products: Product[] }>();

const selectedCondition = ref<ConditionKey>("dryRoad");

interface BarEntry {
  name: string;
  category: Product["category"];
  color: string;
  jumpPoint: number;
  wearAllowance: number;
}

const sortedEntries = computed((): BarEntry[] => {
  const key = selectedCondition.value;
  return props.products
    .filter((p) => p.longevity?.[key] != null)
    .map((p) => ({
      name: p.name,
      category: p.category,
      color: CATEGORY_COLORS[p.category],
      jumpPoint: p.longevity![key]!.jumpPoint,
      wearAllowance: p.longevity![key]!.wearAllowance,
    }))
    .sort((a, b) => b.wearAllowance - a.wearAllowance);
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
      selected: Object.fromEntries([
        ...legendItems.value.map((item) => [
          item.category,
          !hiddenCategories.value.has(item.category),
        ]),
        ...legendItems.value.map((item) => [
          `${item.category}_`,
          !hiddenCategories.value.has(item.category),
        ]),
      ]),
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const items = (Array.isArray(params) ? params : [params]) as Array<{ name: string }>;
        const entry = entries.find((e) => e.name === items[0]?.name);
        if (!entry) return "";
        return (
          `<b>${entry.name}</b><br>` +
          `Jump point: <b>${entry.jumpPoint.toLocaleString()} km</b><br>` +
          `Wear allowance: <b>${entry.wearAllowance.toLocaleString()} km</b>`
        );
      },
    },
    grid: { left: 72, right: 24, top: 40, bottom: 130 },
    xAxis: makeProductXAxis(
      entries.map((e) => e.name),
      selected,
    ),
    yAxis: {
      type: "value",
      name: "km",
      nameLocation: "end",
      nameTextStyle: { fontSize: 12 },
      axisLabel: { formatter: (v: number) => v.toLocaleString() },
    },
    series: categories.flatMap((cat) => [
      {
        name: cat,
        type: "bar" as const,
        stack: "longevity",
        color: CATEGORY_COLORS[cat],
        data: makeCategorySeriesData(entries, cat, (e) => e.jumpPoint),
        barMaxWidth: 56,
        markArea:
          selIdx >= 0 && cat === selectedCategory
            ? makeSelectionMarkArea(entries[selIdx].name)
            : undefined,
      },
      {
        name: `${cat}_`,
        type: "bar" as const,
        stack: "longevity",
        color: CATEGORY_COLORS[cat],
        itemStyle: { opacity: 0.35 },
        data: makeCategorySeriesData(entries, cat, (e) => e.wearAllowance - e.jumpPoint),
        barMaxWidth: 56,
      },
    ]),
  };
});
</script>

<template>
  <div class="longevity-chart">
    <select v-model="selectedCondition" class="condition-select">
      <option v-for="c in LONGEVITY_CONDITIONS" :key="c.key" :value="c.key">
        {{ c.label }}
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
      <p class="selected-label">Selected lubricant</p>
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
.longevity-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.condition-select {
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
}

.selected-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}
</style>
