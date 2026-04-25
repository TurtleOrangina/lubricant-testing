import type { Product } from "./types";

export const products: Product[] = [
  {
    name: "Silca Super Secret Chain Lube",
    category: "immersive wax",
    costAUD: 45.0,
    mainTest: [
      { wearRate: 0.09 },
      { wearRate: 0.13 },
      { wearRate: 0.1 },
      { wearRate: 0.21 },
      { wearRate: 0.12 },
      { wearRate: 0.29 },
    ],
    longevity: {
      dryRoad: { jumpPoint: 820, wearAllowance: 1250 },
      dryGravel: { jumpPoint: 610, wearAllowance: 960 },
      extremeConditions: { jumpPoint: 210, wearAllowance: 420 },
    },
  },
  {
    name: "Smoove Universal Chain Lube",
    category: "immersive wax",
    costAUD: 38.0,
    mainTest: [
      { wearRate: 0.11 },
      { wearRate: 0.16 },
      { wearRate: 0.12 },
      { wearRate: 0.25 },
      { wearRate: 0.14 },
      { wearRate: 0.34 },
    ],
    longevity: {
      dryRoad: { jumpPoint: 760, wearAllowance: 1100 },
    },
  },
  {
    name: "Squirt Long Lasting Dry Lube",
    category: "wax drip",
    costAUD: 22.0,
    mainTest: [
      { wearRate: 0.14 },
      { wearRate: 0.19 },
      { wearRate: 0.15 },
      { wearRate: 0.3 },
      { wearRate: 0.17 },
      { wearRate: 0.46 },
    ],
    longevity: {
      dryRoad: { jumpPoint: 640, wearAllowance: 980 },
      dryGravel: { jumpPoint: 470, wearAllowance: 760 },
      extremeConditions: { jumpPoint: 140, wearAllowance: 310 },
    },
  },
  {
    name: "Muc-Off Hydrodynamic Lube",
    category: "wet-drip",
    costAUD: 18.0,
    mainTest: [
      { wearRate: 0.17 },
      { wearRate: 0.22 },
      { wearRate: 0.18 },
      { wearRate: 0.27 },
      { wearRate: 0.2 },
      { wearRate: 0.4 },
    ],
    longevity: {
      dryRoad: { jumpPoint: 490, wearAllowance: 830 },
      dryGravel: { jumpPoint: 390, wearAllowance: 660 },
      extremeConditions: { jumpPoint: 170, wearAllowance: 360 },
    },
  },
  {
    name: "Generic Budget Wet Lube",
    category: "wet-drip",
    mainTest: [{ wearRate: 0.21 }, { wearRate: 0.3 }, { wearRate: 0.23 }, { wearRate: 0.45 }],
  },
];
