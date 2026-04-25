<script setup lang="ts">
import { computed } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { PRODUCT_COLORS } from "../constants";

const props = defineProps<{ products: Product[] }>();

const CONDITIONS = ["Dry Road", "Dry Gravel", "Extreme Conditions"] as const;
const CONDITION_KEYS = ["dryRoad", "dryGravel", "extremeConditions"] as const;

const productsWithLongevity = computed(() =>
  props.products
    .map((p, i) => ({ product: p, colorIndex: i }))
    .filter(({ product }) => product.longevity != null),
);

const option = computed((): EChartsOption => {
  const filtered = productsWithLongevity.value;

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const items = (Array.isArray(params) ? params : [params]) as Array<{
          marker: string;
          seriesName: string;
          seriesIndex: number;
          value: number | null;
          axisValue: string;
        }>;
        if (!items.length) return "";

        const conditionName = items[0]?.axisValue ?? "";
        const condIdx = CONDITIONS.indexOf(conditionName as (typeof CONDITIONS)[number]);
        const condKey = condIdx >= 0 ? CONDITION_KEYS[condIdx] : null;

        let html = `<div style="font-weight:600;margin-bottom:6px">${conditionName}</div>`;
        for (const item of items) {
          if (item.value == null) continue;
          const entry = filtered[item.seriesIndex];
          if (!entry) continue;
          const cond = condKey ? entry.product.longevity?.[condKey] : undefined;
          if (!cond) continue;
          html += `${item.marker}<b>${item.seriesName}</b>:<br>`;
          html += `&nbsp;&nbsp;Jump point: <b>${cond.jumpPoint}</b> km<br>`;
          html += `&nbsp;&nbsp;Wear allowance: <b>${cond.wearAllowance}</b> km<br>`;
        }
        return html;
      },
    },
    legend: { bottom: 0, type: "scroll", textStyle: { fontSize: 12 } },
    grid: { left: 60, right: 24, top: 24, bottom: 80 },
    xAxis: {
      type: "category",
      data: [...CONDITIONS],
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: "value",
      name: "km",
      nameLocation: "end",
      axisLabel: { fontSize: 12 },
    },
    series: filtered.map(({ product, colorIndex }) => ({
      name: product.name,
      type: "bar",
      color: PRODUCT_COLORS[colorIndex % PRODUCT_COLORS.length],
      barMaxWidth: 48,
      data: CONDITION_KEYS.map((key) => product.longevity?.[key]?.wearAllowance ?? null),
    })),
  };
});
</script>

<template>
  <VChart :option="option" style="height: 420px" autoresize />
</template>
