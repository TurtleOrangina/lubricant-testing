import type { ProductCategory } from "../../src/types.ts";

export interface ProductOverride {
  /**
   * Name exactly as the workbook spells it in the block-by-block wear table —
   * or, for products with no main test, in a Single Application Longevity table.
   */
  source: string;
  /** Product name to publish, when it should differ from `source`. */
  name?: string;
  /** Note column for `data.csv`, usually the qualifier stripped out of `source`. */
  note?: string;
  /** Category, for rows whose name cell carries no category font colour. */
  category?: ProductCategory;
  /**
   * Package price in AUD, for products the workbook's cost table does not
   * list. Ignored when the workbook has a cost row for the product.
   */
  costPackageAUD?: number;
  /** Applications used across the main test, same fallback rule as the price. */
  usagesMainTest?: number;
  /**
   * Name used by the cumulative-wear and cost tables on sheet 1, when those
   * spell the product differently from the block-by-block table.
   */
  summaryName?: string;
  /**
   * Names used by the Single Application Longevity tables, when they differ
   * from `source`. The three condition tables do not always agree with each
   * other, so every spelling the product goes by belongs in this list.
   */
  longevityNames?: string[];
}

/**
 * Editorial and join corrections applied on top of what the workbook says.
 *
 * The converter discovers products automatically and joins the workbook's
 * tables by a punctuation- and case-insensitive comparison of the lubricant
 * name, so an entry is only needed when that is not enough: the published name
 * or note differs from the workbook's, a table spells the product differently,
 * or the name cell carries no category font colour.
 */
export const PRODUCT_OVERRIDES: ProductOverride[] = [
  // --- Published name and note split out of the workbook's name ---
  {
    source: "Event Gear Lube Cube (Rub on, Melt in)",
    name: "Lube Cube (melt in)",
    note: "Rub On Melt In",
    category: "rub on wax",
  },
  {
    source: "Chain Maintenance Test 1* (Finish Line Dry)",
    name: "Chain Maintenance Test 1",
    note: "Finish Line Dry + regular chain cleaning",
  },
  {
    source: "Finish Line Halo IM wax (re-test Jan 25)",
    name: "Finish Line Halo hot wax",
    note: "Re-test Jan 25",
  },
  {
    source: "Finish Line Halo Drip wax - re test.",
    name: "Finish Line Halo Drip wax",
    note: "re test",
  },
  {
    source: "Mspeedwax New Formula",
    name: "Mspeedwax",
    note: "New Formula",
  },
  {
    source: "Ceramic Spd UFO Drip New Formula",
    name: "CeramicSpeed UFO Drip",
    note: "New Formula",
    longevityNames: ["Ceramic Speed UFO Drip All conditions"],
  },
  {
    source: "Tru Tension Tungsten Race (D.A)",
    name: "Tru Tension Tungsten Race",
    note: "Double applications",
  },
  {
    source: "Singer General Purpose ($6.95)",
    name: "Singer General Purpose",
    note: "$6.95",
  },
  {
    source: "Finish Line Wet (green bottle)",
    name: "Finish Line Wet",
    note: "Green bottle",
  },
  {
    source: "Silca + Endurance Chip - *Extended intervals*",
    name: "Silca + Endurance Chip",
    note: "Extended Intervals",
    longevityNames: ["Silca Hot Melt + Endurance Chip"],
  },
  {
    source: "Nano Titanium Armour (*Extended Intervals)",
    name: "Nano Titanium Armour",
    note: "Extended Intervals",
    longevityNames: ["Nano Titanium Armour"],
  },
  {
    source: "Finish line Ceramic Wax (unable to extrapolate data)",
    name: "Finish line Ceramic Wax",
  },

  // --- Sheet 1 summary tables spell the product differently ---
  { source: "Optimize Bike Graphene Wax", summaryName: "Optimize Bike" },
  { source: "Muc  Off Nano", summaryName: "Muc Off Nano Lube" },
  { source: "Tunap Eco Ultimate Synthetic", summaryName: "Tunap Ultimate Synthetic" },
  { source: "Private test - wet lubricant", summaryName: "Private test - wet lubricant (1)" },
  { source: "Rex Black Diamond", summaryName: "Rex Black Diamond (*Extended Intervals)" },

  // --- The longevity sheet spells the product differently ---
  {
    source: "Silca Hot Melt",
    longevityNames: ["Silca Hot Melt", "Silca Hot Melt (re test, up from 1595km)"],
  },
  { source: "Silca Hot wax X", longevityNames: ["Hot Wax X"] },
  { source: "Rex Black Diamond Wax - 4+1 Mix", longevityNames: ["Rex Wax Race Blend (4+1)"] },
  {
    source: "Rex Black Diamond Wax - 11+1 mix",
    longevityNames: ["Rex Wax - Training blend (11+1)"],
  },

  // --- No main test: these products appear only on the longevity sheet ---
  // The cost table only covers main-test products, so prices for these three
  // come from the published data rather than the workbook.
  { source: "Squirt Hot Wax", category: "immersive wax", costPackageAUD: 65 },
  {
    source: "Rex Black Diamond + Race Day Spray",
    category: "immersive wax",
    longevityNames: ["Rex Black Diamond + Race Day Spray", "Rex Black Diamond + RDS"],
  },
  { source: "AB Graphene Lube", category: "wax drip", costPackageAUD: 30 },

  // --- Name cell carries no category font colour, or one that means something else ---
  { source: "Immersive Wax + Wax Drip Combo (Silca)", category: "other" },
  { source: "Shimano Factory Grease", category: "other" },
  { source: "Wend Wax test 1 - stick only", category: "other" },
  { source: "NO LUBRICANT", name: "No lubricant", category: "other" },
];
