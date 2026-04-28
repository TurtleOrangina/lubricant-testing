import { computed, ref } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";
import VChart from "vue-echarts";
import type { Product } from "../types";
import { useSelectionStore } from "../stores/selection";

export interface ChartEntry {
  name: string;
  category: Product["category"];
  color: string;
}

export function useBarChart<T extends ChartEntry>(
  products: MaybeRefOrGetter<Product[]>,
  sortedEntries: MaybeRefOrGetter<T[]>,
) {
  const store = useSelectionStore();
  const chartRef = ref<InstanceType<typeof VChart> | null>(null);

  const selectedProduct = computed(
    () => toValue(products).find((p) => p.name === store.selectedName) ?? null,
  );

  const legendItems = computed(() => {
    const seen = new Set<string>();
    const items: { category: string; color: string }[] = [];
    for (const e of toValue(sortedEntries)) {
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
    const entries = toValue(sortedEntries);
    if (dataIdx < 0 || dataIdx >= entries.length) return;
    store.select(entries[dataIdx].name);
  }

  return { store, chartRef, selectedProduct, legendItems, handleChartClick };
}
