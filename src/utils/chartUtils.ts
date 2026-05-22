export interface ColoredBarEntry {
  name: string;
  color: string;
}

export const DARK_VALUE_AXIS_STYLE = {
  nameTextStyle: { fontSize: 12 },
};

export function makeProductXAxis(names: string[], selectedName: string | null) {
  return {
    type: "category" as const,
    data: names,
    axisLabel: {
      rotate: 90,
      fontSize: 12,
      interval: 0,
      overflow: "truncate" as const,
      width: 160,
      formatter: (value: string) => (value === selectedName ? `{b|${value}}` : value),
      rich: {
        b: { fontWeight: "bold" as const, fontSize: 12, width: 160 },
      },
    },
  };
}

export function makeSelectionMarkArea(name: string) {
  return {
    silent: true,
    data: [[{ xAxis: name }, { xAxis: name }]] as [[{ xAxis: string }, { xAxis: string }]],
    itemStyle: { color: "rgba(64, 255, 0, 0.25)" },
  };
}

export function makeCategoryBarData<T extends ColoredBarEntry>(
  entries: T[],
  getValue: (e: T) => number,
  opacity = 1,
) {
  return entries.map((e) => ({
    value: getValue(e),
    itemStyle: { color: e.color, opacity },
  }));
}

export function makeCategorySeriesData<T extends { category: string }>(
  entries: T[],
  category: string,
  getValue: (e: T) => number,
): Array<number | null> {
  return entries.map((e) => (e.category === category ? getValue(e) : null));
}
