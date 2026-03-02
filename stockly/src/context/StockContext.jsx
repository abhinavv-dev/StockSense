import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";

const StockContext = createContext(null);

const API_BASE = "/api";
const IS_STATIC = import.meta.env.VITE_STATIC === "true";

async function fetchApi(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function fetchApiMethod(path, method, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function filterProductsBySearch(products, search) {
  if (!search || !search.trim()) return products;
  const q = search.toLowerCase().trim();
  return products.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
  );
}

export function StockProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [salesBreakdown, setSalesBreakdown] = useState(null);
  const [demandSupply, setDemandSupply] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [monthlyFilter, setMonthlyFilter] = useState("all");

  // Static mode: full snapshot (products array is mutated by add/update/delete)
  const [staticSnapshot, setStaticSnapshot] = useState(null);

  const refresh = useCallback(async () => {
    if (IS_STATIC) {
      try {
        setError(null);
        const res = await fetch("/static-data.json");
        if (!res.ok) throw new Error("Failed to load static data");
        const data = await res.json();
        setStaticSnapshot({
          products: data.products || [],
          inventory: data.inventory || null,
          salesBreakdown: data.salesBreakdown || null,
          demandSupply: data.demandSupply || null,
          metrics: data.metrics || null,
        });
      } catch (e) {
        setError(e.message);
        console.error("Static data load error:", e);
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      setError(null);
      const filterQuery = monthlyFilter !== "all" ? `?filter=${encodeURIComponent(monthlyFilter)}` : "";
      const [prods, inv, sales, ds, mets] = await Promise.all([
        fetchApi(`/products?search=${encodeURIComponent(searchQuery)}`),
        fetchApi(`/inventory${filterQuery}`),
        fetchApi(`/sales-breakdown${filterQuery}`),
        fetchApi(`/demand-supply${filterQuery}`),
        fetchApi(`/metrics${filterQuery}`),
      ]);
      setProducts(prods);
      setInventory(inv);
      setSalesBreakdown(sales);
      setDemandSupply(ds);
      setMetrics(mets);
    } catch (e) {
      setError(e.message);
      console.error("API error:", e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, monthlyFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // In static mode, derive products from staticSnapshot + search; otherwise use products state
  const displayedProducts = useMemo(() => {
    if (IS_STATIC && staticSnapshot) {
      return filterProductsBySearch(staticSnapshot.products, searchQuery);
    }
    return products;
  }, [IS_STATIC, staticSnapshot, searchQuery, products]);

  // Expose displayed products and static snapshot for static add/update/delete
  const effectiveProducts = IS_STATIC ? displayedProducts : products;
  const effectiveInventory = IS_STATIC && staticSnapshot ? staticSnapshot.inventory : inventory;
  const effectiveSalesBreakdown = IS_STATIC && staticSnapshot ? staticSnapshot.salesBreakdown : salesBreakdown;
  const effectiveDemandSupply = IS_STATIC && staticSnapshot ? staticSnapshot.demandSupply : demandSupply;
  const effectiveMetrics = IS_STATIC && staticSnapshot ? staticSnapshot.metrics : metrics;

  useEffect(() => {
    if (IS_STATIC && staticSnapshot) {
      setInventory(staticSnapshot.inventory);
      setSalesBreakdown(staticSnapshot.salesBreakdown);
      setDemandSupply(staticSnapshot.demandSupply);
      setMetrics(staticSnapshot.metrics);
    }
  }, [IS_STATIC, staticSnapshot]);

  const addProduct = useCallback(
    async (data) => {
      if (IS_STATIC && staticSnapshot) {
        const newId = staticSnapshot.products.length ? Math.max(...staticSnapshot.products.map((p) => p.id)) + 1 : 1;
        const newProduct = {
          id: newId,
          name: data.name,
          variants_count: data.variants_count ?? 0,
          variants: data.variants_count ? `${data.variants_count} Variants` : "",
          date: data.date?.includes("-") ? `${new Date(data.date).getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][new Date(data.date).getMonth()]}, ${new Date(data.date).getFullYear()}` : data.date,
          date_iso: data.date,
          amount: data.amount,
          quantity: data.quantity ?? 1,
          status: data.status || "Pending",
          image: data.image || "",
          category: data.category || "Electronics",
          type: data.type || "physical",
          tags: data.tags || [],
        };
        setStaticSnapshot((s) => ({ ...s, products: [...s.products, newProduct] }));
        return newProduct;
      }
      const created = await fetchApiMethod("/products", "POST", data);
      await refresh();
      return created;
    },
    [refresh, IS_STATIC, staticSnapshot]
  );

  const updateProduct = useCallback(
    async (id, data) => {
      if (IS_STATIC && staticSnapshot) {
        setStaticSnapshot((s) => ({
          ...s,
          products: s.products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: data.name ?? p.name,
                  variants_count: data.variants_count ?? p.variants_count,
                  variants: data.variants_count != null ? `${data.variants_count} Variants` : p.variants,
                  date_iso: data.date ?? p.date_iso,
                  date: data.date ? `${new Date(data.date).getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][new Date(data.date).getMonth()]}, ${new Date(data.date).getFullYear()}` : p.date,
                  amount: data.amount ?? p.amount,
                  quantity: data.quantity ?? p.quantity,
                  status: data.status ?? p.status,
                  image: data.image !== undefined ? data.image : p.image,
                  category: data.category ?? p.category,
                  type: data.type ?? p.type,
                }
              : p
          ),
        }));
        return {};
      }
      const updated = await fetchApiMethod(`/products/${id}`, "PUT", data);
      await refresh();
      return updated;
    },
    [refresh, IS_STATIC, staticSnapshot]
  );

  const deleteProduct = useCallback(
    async (id) => {
      if (IS_STATIC && staticSnapshot) {
        setStaticSnapshot((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
        return;
      }
      await fetchApiMethod(`/products/${id}`, "DELETE");
      await refresh();
    },
    [refresh, IS_STATIC, staticSnapshot]
  );

  const exportCsv = useCallback(() => {
    const list = IS_STATIC && staticSnapshot ? staticSnapshot.products : products;
    if (IS_STATIC && list.length) {
      const headers = ["id", "name", "variants_count", "date", "amount", "status", "category", "type"];
      const csv = [
        headers.join(","),
        ...list.map((r) =>
          headers.map((h) => {
            const val = h === "date" ? (r.date_iso ?? r.date ?? "") : (r[h] ?? "");
            return `"${String(val).replace(/"/g, '""')}"`;
          }).join(",")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stockly-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (!IS_STATIC) window.open(`${API_BASE}/export/csv`, "_blank");
  }, [IS_STATIC, staticSnapshot, products]);

  const downloadReport = useCallback(() => {
    const list = IS_STATIC && staticSnapshot ? staticSnapshot.products : products;
    if (IS_STATIC && list.length) {
      const report = {
        generatedAt: new Date().toISOString(),
        summary: { totalProducts: list.length },
        products: list,
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stocksense-report.json";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (!IS_STATIC) window.open(`${API_BASE}/report`, "_blank");
  }, [IS_STATIC, staticSnapshot, products]);

  const value = {
    products: effectiveProducts,
    inventory: effectiveInventory,
    salesBreakdown: effectiveSalesBreakdown,
    demandSupply: effectiveDemandSupply,
    metrics: effectiveMetrics,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    monthlyFilter,
    setMonthlyFilter,
    refresh,
    addProduct,
    updateProduct,
    deleteProduct,
    exportCsv,
    downloadReport,
  };

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error("useStock must be used within StockProvider");
  return ctx;
}
