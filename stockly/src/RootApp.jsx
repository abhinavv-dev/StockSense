import React, { useState, useEffect } from "react";
import { StockProvider } from "./context/StockContext";
import Header from "./components/Header";
import { ProductsDashboard } from "./App";
import InventoryIntelligencePage from "./pages/InventoryIntelligence";
import SKUDemandAnalysis from "./pages/SKUDemandAnalysis";
import CalendarPage from "./pages/Calendar";
import CustomersPage from "./pages/Customers";

function getRouteFromHash() {
  const hash = (window.location.hash || "#/").slice(1);
  if (hash.startsWith("/calendar")) return "calendar";
  if (hash.startsWith("/customers")) return "customers";
  if (hash.startsWith("/sku-demand-analysis")) return "sku-demand-analysis";
  if (hash.startsWith("/inventory-intelligence")) return "inventory-intelligence";
  return "dashboard";
}

export default function RootApp() {
  const [route, setRoute] = useState(getRouteFromHash);

  useEffect(() => {
    const handler = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return (
    <StockProvider>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
        <Header />
        <main className="max-w-[1600px] mx-auto px-6 pt-8">
          {route === "calendar" ? (
            <CalendarPage />
          ) : route === "customers" ? (
            <CustomersPage />
          ) : route === "sku-demand-analysis" ? (
            <SKUDemandAnalysis />
          ) : route === "inventory-intelligence" ? (
            <InventoryIntelligencePage />
          ) : (
            <ProductsDashboard />
          )}
        </main>
      </div>
    </StockProvider>
  );
}
