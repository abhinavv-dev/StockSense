import express from "express";
import cors from "cors";
import db from "./db.js";
import { GREEN_PALETTE, BASELINE_DEMAND_SUPPLY, BASELINE_SALES_BY_CATEGORY } from "./analytics.js";
import "./seed.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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

function filterProducts(products, { search }) {
  let out = [...products];
  if (search) {
    const q = search.toLowerCase();
    out = out.filter((p) => p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q));
  }
  return out.sort((a, b) => new Date(b.date) - new Date(a.date));
}

app.get("/api/products", (req, res) => {
  const products = db.products;
  const filtered = filterProducts(products, req.query);
  res.json(filtered.map(toProduct));
});

app.get("/api/products/:id", (req, res) => {
  const product = db.products.find((p) => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(toProduct(product));
});

app.post("/api/products", (req, res) => {
  const { name, variants_count = 0, date, amount, status = "Pending", image, category = "Electronics", type = "physical", quantity = 1 } = req.body;
  if (!name || !date || amount == null) {
    return res.status(400).json({ error: "name, date, and amount are required" });
  }
  const products = db.products;
  const maxId = products.length ? Math.max(...products.map((p) => p.id)) : 0;
  const product = {
    id: maxId + 1,
    name,
    variants_count,
    date,
    amount,
    quantity: quantity ?? 1,
    status,
    image: image || "",
    category,
    type,
    tags: [],
  };
  db.run((d) => {
    d.products.push(product);
    return product;
  });
  res.status(201).json(toProduct(product));
});

app.put("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { name, variants_count, date, amount, quantity, status, image, category, type, tags } = req.body;
  const product = db.run((d) => {
    const idx = d.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const p = d.products[idx];
    if (name != null) p.name = name;
    if (variants_count != null) p.variants_count = variants_count;
    if (date != null) p.date = date;
    if (amount != null) p.amount = amount;
    if (quantity != null) p.quantity = quantity;
    if (status != null) p.status = status;
    if (image != null) p.image = image;
    if (category != null) p.category = category;
    if (type != null) p.type = type;
    if (tags != null) p.tags = Array.isArray(tags) ? tags : [];
    return p;
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(toProduct(product));
});

app.delete("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const found = db.run((d) => {
    const idx = d.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    d.products.splice(idx, 1);
    return true;
  });
  if (!found) return res.status(404).json({ error: "Product not found" });
  res.json({ success: true });
});

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
    const tags = p.tags || [];
    for (const t of tags) if (t) tagSet.add(t);
  }
  return [...tagSet];
}

app.get("/api/inventory", (req, res) => {
  const products = filterByTimeRange(db.products, req.query.filter);
  const byType = {};
  for (const p of products) {
    const t = p.type || "physical";
    if (!byType[t]) byType[t] = { count: 0, total: 0 };
    byType[t].count++;
    byType[t].total += productValue(p);
  }
  const digital = byType.digital || { count: 0, total: 0 };
  const physical = byType.physical || { count: 0, total: 0 };
  const totalCount = digital.count + physical.count;
  const totalValue = digital.total + physical.total;
  const digitalPct = totalValue > 0 ? Math.round((digital.total / totalValue) * 100) : 42;
  const physicalPct = Math.max(0, 100 - digitalPct);
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const totalInventory = totalValue;
  const tags = getAllTags(db.products);

  const fallbackCategories = ["Laptop", "Watch", "Mouse", "Airpod", "iMac", "iPhone"];
  const categoriesList = categories.length > 0 ? categories : ["Electronics", "Tools", "Clothes", "Furniture"];

  res.json({
    totalInventory: Math.round(totalInventory) || 321767,
    inventoryData: [
      { name: "Digital Goods", value: digitalPct, fill: GREEN_PALETTE[0] },
      { name: "Physical Goods", value: physicalPct, fill: "#d1fae5" },
    ],
    categories: categoriesList,
    tags: tags.length > 0 ? tags : ["Laptop", "Watch", "Mouse", "Airpod", "iMac", "iPhone"],
    digitalPct,
    trend: 16,
  });
});

app.get("/api/sales-breakdown", (req, res) => {
  const products = filterByTimeRange(db.products, req.query.filter);
  const byCategory = {};
  for (const p of products) {
    const c = p.category || "Other";
    byCategory[c] = (byCategory[c] || 0) + productValue(p);
  }
  let data = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value: Math.round(value), fill: GREEN_PALETTE[i % GREEN_PALETTE.length] }));
  if (data.length === 0) {
    data = BASELINE_SALES_BY_CATEGORY;
  }
  const totalSales = data.reduce((s, r) => s + r.value, 0) || 170519;

  res.json({
    data,
    totalSales,
    monthlyGrowth: 12,
  });
});

app.get("/api/demand-supply", (req, res) => {
  const products = filterByTimeRange(db.products, req.query.filter);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const byMonth = {};
  for (let i = 0; i < 12; i++) byMonth[i] = { demand: 0, supply: 0 };

  for (const p of products) {
    const m = new Date(p.date).getMonth();
    const val = productValue(p) / 1_000_000;
    byMonth[m].demand += val;
  }
  for (let i = 0; i < 12; i++) {
    byMonth[i].demand = Math.round(byMonth[i].demand * 100) / 100;
    byMonth[i].supply = Math.round(byMonth[i].demand * 1.15 * 100) / 100;
  }

  let lastDemand = 2.5;
  let lastSupply = 3;
  let data = months.map((name, i) => {
    let d = byMonth[i].demand;
    let s = byMonth[i].supply;
    if (d === 0 && s === 0) {
      d = Math.round((lastDemand + 0.15) * 100) / 100;
      s = Math.round((lastSupply + 0.15) * 100) / 100;
    }
    lastDemand = d;
    lastSupply = s;
    return { month: name, demand: d, supply: s };
  });

  const hasProductData = products.length > 0;
  const totalProductDemand = data.reduce((s, r) => s + r.demand, 0);
  if (!hasProductData || totalProductDemand < 0.01) {
    data = BASELINE_DEMAND_SUPPLY;
  }

  const totalSupply = data.reduce((s, r) => s + r.supply, 0);

  res.json({
    data,
    totalSupplyFormatted: `$${totalSupply.toFixed(2)}M`,
    trend: 18,
  });
});

app.get("/api/metrics", (req, res) => {
  const products = filterByTimeRange(db.products, req.query.filter);
  const totalSales = products.reduce((s, p) => s + productValue(p), 0);
  const completeCount = products.filter((p) => p.status === "Complete").length;
  const totalCount = products.length;
  const churnRate = totalCount > 0 ? Math.round((1 - completeCount / totalCount) * 100) : 12;

  res.json({
    totalProductSell: Math.round(totalSales) || 89922,
    totalProductSellTrend: 12,
    churnRate,
    churnRateTrend: -14,
  });
});

app.get("/api/export/csv", (req, res) => {
  const products = db.products;
  const headers = ["id", "name", "variants_count", "date", "amount", "quantity", "status", "category", "type"];
  const csv = [
    headers.join(","),
    ...products.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=stocksense-export.csv");
  res.send(csv);
});

app.get("/api/report", (req, res) => {
  const products = db.products;
  const byType = {};
  for (const p of products) {
    const t = p.type || "physical";
    byType[t] = byType[t] || { count: 0, total: 0 };
    byType[t].count++;
    byType[t].total += productValue(p);
  }
  const byCategory = {};
  for (const p of products) {
    const c = p.category || "Other";
    byCategory[c] = (byCategory[c] || 0) + productValue(p);
  }
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalProducts: products.length,
      totalValue: products.reduce((s, p) => s + productValue(p), 0),
      inventory: Object.entries(byType).map(([type, v]) => ({ type, ...v })),
      salesByCategory: Object.entries(byCategory).map(([category, total]) => ({ category, total })),
    },
    products,
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=stocksense-report.json");
  res.send(JSON.stringify(report, null, 2));
});

app.listen(PORT, () => {
  console.log(`StockSense API running at http://localhost:${PORT}`);
});
