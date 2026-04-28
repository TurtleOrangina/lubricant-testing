<script setup lang="ts">
import { computed, ref } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { CATEGORY_COLORS, LONGEVITY_CONDITIONS } from "../constants";
import type { ConditionKey } from "../constants";
import { useBarChart } from "../composables/useBarChart";
import { makeCategoryBarData, makeProductXAxis, makeSelectionMarkArea } from "../utils/chartUtils";
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
    series: [
      {
        name: "Until jump point",
        type: "bar",
        stack: "longevity",
        data: makeCategoryBarData(entries, (e) => e.jumpPoint),
        barMaxWidth: 56,
        markArea: selIdx >= 0 ? makeSelectionMarkArea(entries[selIdx].name) : undefined,
      },
      {
        name: "Until replacement",
        type: "bar",
        stack: "longevity",
        data: makeCategoryBarData(entries, (e) => e.wearAllowance - e.jumpPoint, 0.35),
        barMaxWidth: 56,
      },
    ],
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

    <div class="chart-wrapper" @click="handleChartClick">
      <VChart ref="chartRef" :option="option" style="height: 420px" autoresize />
    </div>

    <div class="legend-row">
      <div class="legend">
        <span v-for="item in legendItems" :key="item.category" class="legend-item">
          <span class="legend-swatch" :style="{ background: item.color }" />
          {{ item.category }}
        </span>
      </div>
      <div class="bar-key">
        <span class="bar-key-item">
          <span class="bar-key-swatch bar-key-swatch--solid" />
          Until jump point
        </span>
        <span class="bar-key-item">
          <span class="bar-key-swatch bar-key-swatch--light" />
          Until replacement
        </span>
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

.legend-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
}

.bar-key {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.bar-key-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bar-key-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
  background: #6b7280;
}

.bar-key-swatch--light {
  opacity: 0.35;
}

.selected-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}
</style>
