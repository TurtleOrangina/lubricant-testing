<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { CATEGORY_COLORS, LONGEVITY_CONDITIONS } from "../constants";
import type { ConditionKey } from "../constants";
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
const selectedCondition = computed({
  get: () => nav.activeCondition,
  set: (val: ConditionKey) => nav.setActiveCondition(val),
});

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
        const tdL = `style="padding-right:20px"`;
        const tdR = `style="text-align:right"`;
        return (
          `<b>${entry.name}</b>` +
          `<table style="margin-top:6px;width:100%;border-collapse:collapse">` +
          `<tr><td ${tdL}>${tooltipSwatch(entry.color)}Jump point</td><td ${tdR}>${entry.jumpPoint.toLocaleString()} km</td></tr>` +
          `<tr><td ${tdL}>${tooltipSwatch(entry.color, 0.35)}Wear allowance</td><td ${tdR}>${entry.wearAllowance.toLocaleString()} km</td></tr>` +
          `</table>`
        );
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
      name: "km",
      nameLocation: "middle",
      axisLabel: {
        formatter: (v: number) => v.toLocaleString(),
      },
    },
    series: allCategories.flatMap((cat) => [
      {
        name: cat,
        type: "bar" as const,
        stack: "longevity",
        color: CATEGORY_COLORS[cat],
        data: makeCategorySeriesData(entries, cat, (e) => e.jumpPoint),
        barMaxWidth: BAR_MAX_WIDTH,
        markArea: makeSelectionMarkArea(
          entries
            .filter((e) => e.category === cat && selectedNamesSet.has(e.name))
            .map((e) => e.name),
        ),
      },
      {
        name: `${cat}_`,
        type: "bar" as const,
        stack: "longevity",
        color: CATEGORY_COLORS[cat],
        itemStyle: { opacity: 0.35 },
        data: makeCategorySeriesData(entries, cat, (e) => e.wearAllowance - e.jumpPoint),
        barMaxWidth: BAR_MAX_WIDTH,
      },
    ]),
  };
});
</script>

<template>
  <div class="longevity-chart">
    <div class="chart-controls">
      <select v-model="selectedCondition" class="condition-select">
        <option v-for="c in LONGEVITY_CONDITIONS" :key="c.key" :value="c.key">
          {{ c.label }}
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
.longevity-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.condition-select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--select-border);
  background: var(--select-surface);
  background-color: var(--select-surface);
  color: var(--select-text);
  font-size: 14px;
  cursor: pointer;
}

.condition-select option {
  background: #ffffff;
  color: #000000;
}
</style>
