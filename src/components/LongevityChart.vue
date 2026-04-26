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

type ConditionKey = "dryRoad" | "dryGravel" | "extremeConditions";

const CONDITIONS: { key: ConditionKey; label: string }[] = [
  { key: "dryRoad", label: "Dry Road Conditions" },
  { key: "dryGravel", label: "Dry Gravel / MTB / CX" },
  { key: "extremeConditions", label: "Extreme Conditions" },
];

const selectedCondition = ref<ConditionKey>("dryRoad");

const selectedProduct = computed(
  () => props.products.find((p) => p.name === store.selectedName) ?? null,
);

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
        data: entries.map((e) => ({
          value: e.jumpPoint,
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
      {
        name: "Until replacement",
        type: "bar",
        stack: "longevity",
        data: entries.map((e) => ({
          value: e.wearAllowance - e.jumpPoint,
          itemStyle: { color: e.color, opacity: 0.35 },
        })),
        barMaxWidth: 56,
      },
    ],
  };
});
</script>

<template>
  <div class="longevity-chart">
    <select v-model="selectedCondition" class="condition-select">
      <option v-for="c in CONDITIONS" :key="c.key" :value="c.key">
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

.chart-wrapper {
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
