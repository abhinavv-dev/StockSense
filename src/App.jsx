import React from "react";
import { StockProvider, useStock } from "./context/StockContext";
import Header from "./components/Header";
import InventoryCard from "./components/InventoryCard";
import MetricCard from "./components/MetricCard";
import SalesBreakdown from "./components/SalesBreakdown";
import DemandSupplyChart from "./components/DemandSupplyChart";
import RecentStocksTable from "./components/RecentStocksTable";
import { Package, Clock } from "lucide-react";

function MetricsContainer() {
  const { metrics, loading } = useStock();
  if (loading || !metrics) {
    return (
      <>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </>
    );
  }
  return (
    <>
      <MetricCard
        title="Total Product Sell"
        value={metrics.totalProductSell.toLocaleString()}
        trend={metrics.totalProductSellTrend}
        icon={Package}
      />
      <MetricCard
        title="Churn Rate"
        value={`${metrics.churnRate}%`}
        trend={metrics.churnRateTrend}
        icon={Clock}
      />
    </>
  );
}

export function ProductsDashboard() {
  return (
    <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="h-[320px]">
                <InventoryCard />
              </div>

              <div className="grid grid-cols-2 gap-6 h-[180px]">
                <MetricsContainer />
              </div>

              <div className="h-[400px]">
                <DemandSupplyChart />
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              <div className="h-[320px]">
                <SalesBreakdown />
              </div>

              <div className="flex-1 min-h-[500px]">
                <RecentStocksTable />
              </div>
            </div>
          </div>
  );
}

export default function App() {
  return (
    <StockProvider>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
        <Header />
        <main className="max-w-[1600px] mx-auto px-6 pt-8">
          <ProductsDashboard />
        </main>
      </div>
    </StockProvider>
  );
}
