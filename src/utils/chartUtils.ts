import { SELECTION_COLOR } from "../constants";

export interface ColoredBarEntry {
  name: string;
  color: string;
}

export const DARK_VALUE_AXIS_STYLE = {
  nameTextStyle: { fontSize: 12 },
};

export const CHART_GRID = { left: 72, right: 24, top: 60, bottom: 170 } as const;
export const BAR_MAX_WIDTH = 156;

export function tooltipSwatch(color: string, opacity = 1): string {
  return `<span style="display:inline-block;width:10px;height:10px;background:${color};opacity:${opacity};border-radius:2px;margin-right:6px;vertical-align:middle"></span>`;
}

export function makeProductXAxis(names: string[], selectedNames: Set<string>) {
  return {
    type: "category" as const,
    data: names,
    axisLabel: {
      rotate: 90,
      fontSize: 12,
      interval: 0,
      overflow: "truncate" as const,
      width: 160,
      formatter: (value: string) => (selectedNames.has(value) ? `{b|${value}}` : value),
      rich: {
        b: { fontWeight: "bold" as const, fontSize: 12, width: 160 },
      },
    },
  };
}

export function makeSelectionMarkArea(names: string[]) {
  if (names.length === 0) return undefined;
  return {
    silent: true,
    data: names.map((name) => [{ xAxis: name }, { xAxis: name }]) as Array<
      [{ xAxis: string }, { xAxis: string }]
    >,
    itemStyle: { color: `${SELECTION_COLOR}40` },
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
