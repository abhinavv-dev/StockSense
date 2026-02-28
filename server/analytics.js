/**
 * Static analytics baseline - ensures graphs always have meaningful data.
 * When products exist, API derives from products; when empty/sparse, this provides fallback.
 * Green theme palette: shades of lime, emerald, green.
 */
export const GREEN_PALETTE = [
  "#84cc16", // lime-500 - primary
  "#65a30d", // lime-600 - darker
  "#a3e635", // lime-400 - lighter
  "#4ade80", // green-400 - emerald
  "#22c55e", // green-500
  "#16a34a", // green-600
  "#86efac", // green-300 - light
];

/** Baseline demand/supply by month (in millions) - drives Demand & Supply chart */
export const BASELINE_DEMAND_SUPPLY = [
  { month: "Jan", demand: 2.1, supply: 2.4 },
  { month: "Feb", demand: 2.4, supply: 2.8 },
  { month: "Mar", demand: 2.8, supply: 3.2 },
  { month: "Apr", demand: 3.1, supply: 3.6 },
  { month: "May", demand: 3.5, supply: 4.0 },
  { month: "Jun", demand: 3.8, supply: 4.4 },
  { month: "Jul", demand: 4.0, supply: 4.6 },
  { month: "Aug", demand: 4.2, supply: 4.8 },
  { month: "Sep", demand: 4.5, supply: 5.2 },
  { month: "Oct", demand: 4.8, supply: 5.5 },
  { month: "Nov", demand: 5.0, supply: 5.8 },
  { month: "Dec", demand: 5.2, supply: 6.0 },
];

/** Baseline sales by category - drives Sales Breakdown chart (matches design) */
export const BASELINE_SALES_BY_CATEGORY = [
  { name: "Electronics", value: 89922, fill: "#84cc16" },
  { name: "Tools", value: 41954, fill: "#65a30d" },
  { name: "Clothes", value: 21082, fill: "#a3e635" },
  { name: "Furniture", value: 17561, fill: "#4ade80" },
];
