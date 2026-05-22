<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { CATEGORY_COLORS } from "../constants";
import { useNavigationStore } from "../stores/navigation";
import { useBarChart } from "../composables/useBarChart";
import {
  makeCategorySeriesData,
  makeProductXAxis,
  makeSelectionMarkArea,
  DARK_VALUE_AXIS_STYLE,
} from "../utils/chartUtils";
import LubricantCard from "./LubricantCard.vue";
import GlossaryLink from "./GlossaryLink.vue";

const props = defineProps<{ products: Product[] }>();

const nav = useNavigationStore();
const drivetrainCost = computed({
  get: () => nav.drivetrainCost,
  set: (val: number) => nav.setDrivetrainCost(val),
});

interface BarEntry {
  name: string;
  category: Product["category"];
  color: string;
  lubricantCostPer1000km: number;
  driveTrainWearCostPer1000km: number;
}

const sortedEntries = computed((): BarEntry[] =>
  props.products
    .filter((p) => p.mainTest != null && p.costPackageAUD != null && p.usagesMainTest != null)
    .map((p) => {
      const lubricantCostPer1000km = (p.costPackageAUD! * p.usagesMainTest!) / 6;
      const driveTrainWearCostPer1000km =
        drivetrainCost.value / ((p.mainTest!.testKilometerEquivalent * 2) / 1000);
      return {
        name: p.name,
        category: p.category,
        color: CATEGORY_COLORS[p.category],
        lubricantCostPer1000km,
        driveTrainWearCostPer1000km,
      };
    })
    .sort(
      (a, b) =>
        a.lubricantCostPer1000km +
        a.driveTrainWearCostPer1000km -
        (b.lubricantCostPer1000km + b.driveTrainWearCostPer1000km),
    ),
);

const chartRef = useTemplateRef<InstanceType<typeof VChart>>("chartRef");
const {
  store,
  selectedProduct,
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
  const selected = store.selectedName;
  const selIdx = selected ? entries.findIndex((e) => e.name === selected) : -1;
  const selectedCategory = selIdx >= 0 ? entries[selIdx].category : null;

  return {
    legend: {
      top: 4,
      left: "center",
      itemWidth: 14,
      itemHeight: 14,
      itemGap: 20,
      textStyle: { fontSize: 13, color: "#d1d5db" },
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
        const lube = Math.round(entry.lubricantCostPer1000km);
        const dt = Math.round(entry.driveTrainWearCostPer1000km);
        const total = lube + dt;
        const tdL = `style="padding-right:20px"`;
        const tdR = `style="text-align:right"`;
        const sep = `<tr><td colspan="2" style="border-top:1px solid #4b5563;padding:2px 0"></td></tr>`;
        return (
          `<b>${entry.name}</b><br>` +
          `<span style="color:#9ca3af;font-size:0.85em">All costs in $ per 1000 km</span>` +
          `<table style="margin-top:6px;width:100%;border-collapse:collapse">` +
          `<tr><td ${tdL}>Drivetrain wear</td><td ${tdR}>$${dt}</td></tr>` +
          `<tr><td ${tdL}>Lubricant</td><td ${tdR}>$${lube}</td></tr>` +
          sep +
          `<tr><td ${tdL}><b>Total</b></td><td ${tdR}><b>$${total}</b></td></tr>` +
          `</table>`
        );
      },
    },
    grid: { left: 72, right: 24, top: 40, bottom: 130 },
    xAxis: makeProductXAxis(
      entries.map((e) => e.name),
      selected,
    ),
    yAxis: {
      ...DARK_VALUE_AXIS_STYLE,
      type: "value",
      name: "AUD / 1000km",
      nameLocation: "end",
      axisLabel: {
        ...DARK_VALUE_AXIS_STYLE.axisLabel,
        formatter: (v: number) => `$${v}`,
      },
    },
    series: allCategories.flatMap((cat) => [
      {
        name: cat,
        type: "bar" as const,
        stack: "cost",
        color: CATEGORY_COLORS[cat],
        data: makeCategorySeriesData(entries, cat, (e) => e.driveTrainWearCostPer1000km),
        barMaxWidth: 56,
        markArea:
          selIdx >= 0 && cat === selectedCategory
            ? makeSelectionMarkArea(entries[selIdx].name)
            : undefined,
      },
      {
        name: `${cat}_`,
        type: "bar" as const,
        stack: "cost",
        color: CATEGORY_COLORS[cat],
        itemStyle: { opacity: 0.35 },
        data: makeCategorySeriesData(entries, cat, (e) => e.lubricantCostPer1000km),
        barMaxWidth: 56,
      },
    ]),
  };
});
</script>

<template>
  <div class="cost-to-run-chart">
    <div class="slider-row">
      <label class="slider-label">
        <GlossaryLink section="drive-train-cost">Drivetrain cost</GlossaryLink>:
        <strong>${{ drivetrainCost }}</strong>
      </label>
      <input
        v-model.number="drivetrainCost"
        type="range"
        min="100"
        max="2000"
        step="10"
        class="cost-slider"
      />
      <span class="slider-range-hint">$100 — $2000</span>
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
.cost-to-run-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slider-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-self: flex-start;
}

.slider-label {
  font-size: 14px;
  color: var(--text-muted);
}

.cost-slider {
  width: 280px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.slider-range-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
