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
  chartRef: { readonly value: InstanceType<typeof VChart> | null },
) {
  const store = useSelectionStore();

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

  const hiddenCategories = ref<Set<string>>(new Set());

  // Only entries whose category is currently visible — used for the x-axis so
  // hidden-category products disappear from the axis entirely.
  const visibleEntries = computed(() =>
    toValue(sortedEntries).filter((e) => !hiddenCategories.value.has(e.category)),
  );

  function handleLegendChange({ selected }: { selected: Record<string, boolean> }) {
    hiddenCategories.value = new Set(
      Object.entries(selected)
        .filter(([, v]) => !v)
        .map(([k]) => k),
    );
  }

  function handleChartClick(event: MouseEvent) {
    if (!chartRef.value) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!chartRef.value.containPixel("grid", [x, y])) return;
    const result = chartRef.value.convertFromPixel({ seriesIndex: 0 }, [x, y]) as number[] | null;
    if (!result) return;
    const dataIdx = Math.round(result[0]);
    const entries = visibleEntries.value;
    if (dataIdx < 0 || dataIdx >= entries.length) return;
    store.select(entries[dataIdx].name);
  }

  const chartMinWidth = computed(() => 150 + visibleEntries.value.length * 12);

  return {
    store,
    selectedProduct,
    legendItems,
    hiddenCategories,
    visibleEntries,
    handleLegendChange,
    handleChartClick,
    chartMinWidth,
  };
}
