/**
 * Generates static-data.json for static Netlify deploy.
 * Reads server/stocksense.json and replicates API response shapes so the frontend can run without the server.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GREEN_PALETTE, BASELINE_DEMAND_SUPPLY, BASELINE_SALES_BY_CATEGORY } from "../server/analytics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT, "server", "stocksense.json");
const OUT_PATH = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, "out");

function loadProducts() {
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    return data.products || [];
  } catch {
    return [];
  }
}

function formatDate(isoDate) {
  const d = new Date(isoDate);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

function toProduct(r) {
  const qty = r.quantity ?? 1;
  return {
    id: r.id,
    name: r.name,
    variants: r.variants_count ? `${r.variants_count} Variants` : "",
    variants_count: r.variants_count,
    date: formatDate(r.date),
    date_iso: r.date,
    amount: r.amount,
    quantity: qty,
    status: r.status,
    image: r.image,
    category: r.category,
    type: r.type,
    tags: r.tags || [],
  };
}

function productValue(p) {
  return (p.amount || 0) * (p.quantity ?? 1);
}

function filterByTimeRange(products, filter) {
  if (!filter || filter === "all") return products;
  const now = new Date();
  return products.filter((p) => {
    const d = new Date(p.date);
    if (filter === "monthly") return d >= new Date(now.getFullYear(), now.getMonth(), 1);
    if (filter === "quarterly") {
      const q = Math.floor(now.getMonth() / 3) + 1;
      return d >= new Date(now.getFullYear(), (q - 1) * 3, 1);
    }
    return true;
  });
}

function getAllTags(products) {
  const tagSet = new Set();
  for (const p of products) {
    for (const t of p.tags || []) if (t) tagSet.add(t);
  }
  return [...tagSet];
}

const products = loadProducts();
const sortedProducts = [...products].sort((a, b) => new Date(b.date) - new Date(a.date));
const productsFormatted = sortedProducts.map(toProduct);

// inventory (filter "all")
const productsAll = filterByTimeRange(products, "all");
const byType = {};
for (const p of productsAll) {
  const t = p.type || "physical";
  if (!byType[t]) byType[t] = { count: 0, total: 0 };
  byType[t].count++;
  byType[t].total += productValue(p);
}
const digital = byType.digital || { count: 0, total: 0 };
const physical = byType.physical || { count: 0, total: 0 };
const totalValue = digital.total + physical.total;
const digitalPct = totalValue > 0 ? Math.round((digital.total / totalValue) * 100) : 42;
const physicalPct = Math.max(0, 100 - digitalPct);
const categories = [...new Set(productsAll.map((p) => p.category).filter(Boolean))];
const tags = getAllTags(products);
const inventory = {
  totalInventory: Math.round(totalValue) || 321767,
  inventoryData: [
    { name: "Digital Goods", value: digitalPct, fill: GREEN_PALETTE[0] },
    { name: "Physical Goods", value: physicalPct, fill: "#d1fae5" },
  ],
  categories: categories.length > 0 ? categories : ["Electronics", "Tools", "Clothes", "Furniture"],
  tags: tags.length > 0 ? tags : ["Laptop", "Watch", "Mouse", "Airpod", "iMac", "iPhone"],
  digitalPct,
  trend: 16,
};

// sales-breakdown
const byCategory = {};
for (const p of productsAll) {
  const c = p.category || "Other";
  byCategory[c] = (byCategory[c] || 0) + productValue(p);
}
let salesData = Object.entries(byCategory)
  .sort((a, b) => b[1] - a[1])
  .map(([name, value], i) => ({ name, value: Math.round(value), fill: GREEN_PALETTE[i % GREEN_PALETTE.length] }));
if (salesData.length === 0) salesData = BASELINE_SALES_BY_CATEGORY;
const totalSales = salesData.reduce((s, r) => s + r.value, 0) || 170519;
const salesBreakdown = {
  data: salesData,
  totalSales,
  monthlyGrowth: 12,
};

// demand-supply
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const byMonth = {};
for (let i = 0; i < 12; i++) byMonth[i] = { demand: 0, supply: 0 };
for (const p of productsAll) {
  const m = new Date(p.date).getMonth();
  const val = productValue(p) / 1_000_000;
  byMonth[m].demand += val;
}
for (let i = 0; i < 12; i++) {
  byMonth[i].demand = Math.round(byMonth[i].demand * 100) / 100;
  byMonth[i].supply = Math.round(byMonth[i].demand * 1.15 * 100) / 100;
}
let lastDemand = 2.5, lastSupply = 3;
let demandSupplyData = months.map((name, i) => {
  let d = byMonth[i].demand, s = byMonth[i].supply;
  if (d === 0 && s === 0) {
    d = Math.round((lastDemand + 0.15) * 100) / 100;
    s = Math.round((lastSupply + 0.15) * 100) / 100;
  }
  lastDemand = d;
  lastSupply = s;
  return { month: name, demand: d, supply: s };
});
const hasProductData = productsAll.length > 0;
const totalProductDemand = demandSupplyData.reduce((s, r) => s + r.demand, 0);
if (!hasProductData || totalProductDemand < 0.01) demandSupplyData = BASELINE_DEMAND_SUPPLY;
const totalSupply = demandSupplyData.reduce((s, r) => s + r.supply, 0);
const demandSupply = {
  data: demandSupplyData,
  totalSupplyFormatted: `$${totalSupply.toFixed(2)}M`,
  trend: 18,
};

// metrics
const totalSalesMetrics = productsAll.reduce((s, p) => s + productValue(p), 0);
const completeCount = productsAll.filter((p) => p.status === "Complete").length;
const totalCount = productsAll.length;
const churnRate = totalCount > 0 ? Math.round((1 - completeCount / totalCount) * 100) : 12;
const metrics = {
  totalProductSell: Math.round(totalSalesMetrics) || 89922,
  totalProductSellTrend: 12,
  churnRate,
  churnRateTrend: -14,
};

const staticData = {
  products: productsFormatted,
  inventory,
  salesBreakdown,
  demandSupply,
  metrics,
};

fs.mkdirSync(OUT_PATH, { recursive: true });
fs.writeFileSync(path.join(OUT_PATH, "static-data.json"), JSON.stringify(staticData), "utf-8");
// Netlify SPA redirect: serve index.html for all routes
fs.writeFileSync(path.join(OUT_PATH, "_redirects"), "/*    /index.html   200\n", "utf-8");
console.log("Wrote static-data.json and _redirects to", OUT_PATH);
