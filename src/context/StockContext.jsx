import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const StockContext = createContext(null);

const API_BASE = "/api";

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

  const refresh = useCallback(async () => {
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

  const addProduct = useCallback(
    async (data) => {
      const created = await fetchApiMethod("/products", "POST", data);
      await refresh();
      return created;
    },
    [refresh]
  );

  const updateProduct = useCallback(
    async (id, data) => {
      const updated = await fetchApiMethod(`/products/${id}`, "PUT", data);
      await refresh();
      return updated;
    },
    [refresh]
  );

  const deleteProduct = useCallback(
    async (id) => {
      await fetchApiMethod(`/products/${id}`, "DELETE");
      await refresh();
    },
    [refresh]
  );

  const exportCsv = useCallback(() => {
    window.open(`${API_BASE}/export/csv`, "_blank");
  }, []);

  const downloadReport = useCallback(() => {
    window.open(`${API_BASE}/report`, "_blank");
  }, []);

  const value = {
    products,
    inventory,
    salesBreakdown,
    demandSupply,
    metrics,
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
