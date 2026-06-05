import { computed, ref } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";
import VChart from "vue-echarts";
import type { Product } from "../types";
import { useSelectionStore } from "../stores/selection";
import { useNavigationStore } from "../stores/navigation";

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
  const nav = useNavigationStore();

  const selectedProducts = computed(() =>
    toValue(products).filter((p) => store.selectedNames.has(p.name)),
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

  const _hiddenCategories = ref<Set<string>>(new Set());

  // In selectedOnly mode all categories are treated as visible
  const hiddenCategories = computed(() =>
    nav.selectedOnly ? new Set<string>() : _hiddenCategories.value,
  );

  const visibleEntries = computed(() => {
    const entries = toValue(sortedEntries);
    if (nav.selectedOnly) {
      return entries.filter((e) => store.selectedNames.has(e.name));
    }
    return entries.filter((e) => !_hiddenCategories.value.has(e.category));
  });

  function handleLegendChange({ selected }: { name: string; selected: Record<string, boolean> }) {
    if (!nav.selectedOnly) {
      const categories = new Set(legendItems.value.map((item) => item.category));
      _hiddenCategories.value = new Set(
        Object.entries(selected)
          .filter(([k, v]) => categories.has(k) && !v)
          .map(([k]) => k),
      );
    }
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
    store.toggle(entries[dataIdx].name);
  }

  const chartMinWidth = computed(() => 150 + visibleEntries.value.length * 12);

  return {
    store,
    selectedProducts,
    legendItems,
    hiddenCategories,
    visibleEntries,
    handleLegendChange,
    handleChartClick,
    chartMinWidth,
  };
}
