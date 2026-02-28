export const SERVICE_LEVELS = [
  { label: "85%", value: 0.85, z: 1.04 },
  { label: "90%", value: 0.9, z: 1.28 },
  { label: "95%", value: 0.95, z: 1.65 },
  { label: "98%", value: 0.98, z: 2.05 },
  { label: "99%", value: 0.99, z: 2.33 },
];

// Months in display order for charts
export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Mock monthly sales history per SKU.
 * Values are units sold per month and are loosely aligned
 * with the dashboard cards so the experience feels coherent.
 */
export const SKU_SALES_HISTORY = [
  {
    id: 1,
    sku: "APPLE_AIRPOD_2ND_GEN",
    name: "Apple Airpod 2nd Gen",
    months: [
      { month: "Jan", sales: 180 },
      { month: "Feb", sales: 195 },
      { month: "Mar", sales: 205 },
      { month: "Apr", sales: 210 },
      { month: "May", sales: 230 },
      { month: "Jun", sales: 225 },
      { month: "Jul", sales: 235 },
      { month: "Aug", sales: 245 },
      { month: "Sep", sales: 255 },
      { month: "Oct", sales: 248 },
      { month: "Nov", sales: 260 },
      { month: "Dec", sales: 280 },
    ],
  },
  {
    id: 2,
    sku: "MACBOOK_PRO_16",
    name: 'Macbook Pro 16" 32/1TB',
    months: [
      { month: "Jan", sales: 24 },
      { month: "Feb", sales: 26 },
      { month: "Mar", sales: 25 },
      { month: "Apr", sales: 27 },
      { month: "May", sales: 29 },
      { month: "Jun", sales: 28 },
      { month: "Jul", sales: 30 },
      { month: "Aug", sales: 31 },
      { month: "Sep", sales: 32 },
      { month: "Oct", sales: 30 },
      { month: "Nov", sales: 34 },
      { month: "Dec", sales: 36 },
    ],
  },
  {
    id: 3,
    sku: "GAMING_MOUSE_PAD",
    name: "Gaming Mouse Pad",
    months: [
      { month: "Jan", sales: 420 },
      { month: "Feb", sales: 430 },
      { month: "Mar", sales: 440 },
      { month: "Apr", sales: 450 },
      { month: "May", sales: 470 },
      { month: "Jun", sales: 465 },
      { month: "Jul", sales: 480 },
      { month: "Aug", sales: 495 },
      { month: "Sep", sales: 510 },
      { month: "Oct", sales: 505 },
      { month: "Nov", sales: 520 },
      { month: "Dec", sales: 540 },
    ],
  },
  {
    id: 4,
    sku: "APPLE_WATCH_ULTRA",
    name: "Apple Watch Ultra",
    months: [
      { month: "Jan", sales: 60 },
      { month: "Feb", sales: 64 },
      { month: "Mar", sales: 62 },
      { month: "Apr", sales: 66 },
      { month: "May", sales: 70 },
      { month: "Jun", sales: 68 },
      { month: "Jul", sales: 72 },
      { month: "Aug", sales: 74 },
      { month: "Sep", sales: 78 },
      { month: "Oct", sales: 76 },
      { month: "Nov", sales: 82 },
      { month: "Dec", sales: 88 },
    ],
  },
];

