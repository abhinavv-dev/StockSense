import React from "react";
import { StockProvider } from "./context/StockContext";
import Header from "./components/Header";
import InventoryIntelligencePage from "./pages/InventoryIntelligence";

export default function InventoryIntelligenceApp() {
  return (
    <StockProvider>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
        <Header />
        <main className="max-w-[1600px] mx-auto px-6 pt-8">
          <InventoryIntelligencePage />
        </main>
      </div>
    </StockProvider>
  );
}

