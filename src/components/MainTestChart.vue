<script setup lang="ts">
import { computed } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { Product } from "../types";
import { PRODUCT_COLORS } from "../constants";

const props = defineProps<{ products: Product[] }>();

const BLOCK_LABELS = [
  "B1: Clean",
  "B2: Dry Offroad",
  "B3: Clean",
  "B4: Wet",
  "B5: Clean",
  "B6: Harsh Wet",
];

const productsWithTest = computed(() =>
  props.products
    .map((p, i) => ({ product: p, colorIndex: i }))
    .filter(({ product }) => product.mainTest != null),
);

const option = computed(
  (): EChartsOption => ({
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const items = (Array.isArray(params) ? params : [params]) as Array<{
          marker: string;
          seriesName: string;
          value: number | null;
          axisValue: string;
        }>;
        const label = items[0]?.axisValue ?? "";
        let html = `<div style="font-weight:600;margin-bottom:4px">${label}</div>`;
        for (const item of items) {
          if (item.value == null) continue;
          html += `${item.marker}<b>${item.seriesName}</b>: ${item.value.toFixed(2)} mm/1000km<br>`;
        }
        return html;
      },
    },
    legend: { bottom: 0, type: "scroll", textStyle: { fontSize: 12 } },
    grid: { left: 72, right: 24, top: 24, bottom: 80 },
    xAxis: {
      type: "category",
      data: BLOCK_LABELS,
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: "value",
      name: "mm / 1000 km",
      nameLocation: "middle",
      nameGap: 52,
      nameTextStyle: { fontSize: 12 },
      axisLabel: { formatter: (val: number) => val.toFixed(2) },
    },
    series: productsWithTest.value.map(({ product, colorIndex }) => ({
      name: product.name,
      type: "line",
      color: PRODUCT_COLORS[colorIndex % PRODUCT_COLORS.length],
      data: (product.mainTest ?? []).map((b) => b.wearRate),
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { width: 2.5 },
    })),
  }),
);
</script>

<template>
  <VChart :option="option" style="height: 420px" autoresize />
</template>
