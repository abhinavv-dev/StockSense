import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
} from "recharts";
import { AlertTriangle, Brain, Activity, TrendingUp } from "lucide-react";
import { SERVICE_LEVELS, SKU_SALES_HISTORY, MONTH_LABELS } from "../data/inventoryIntelligenceData";

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stdDev(values) {
  if (values.length <= 1) return 0;
  const m = mean(values);
  const variance =
    values.reduce((s, v) => s + (v - m) * (v - m), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function buildSalesTrendData(history, lookbackMonths) {
  const months = history.months;
  const startIndex = Math.max(0, months.length - lookbackMonths);
  const sliced = months.slice(startIndex);
  const avg = mean(sliced.map((m) => m.sales));
  const forecastNext = Math.round(avg);
  const nextLabel = "Next";
  return [
    ...sliced.map((m) => ({ month: m.month, sales: m.sales })),
    { month: nextLabel, sales: forecastNext, forecast: true },
  ];
}

function buildDepletionData(currentStock, dailyDemand, reorderPoint) {
  const horizonDays = Math.max(leadTimeClamp(30), 30);
  const step = Math.max(1, Math.floor(horizonDays / 15));
  const data = [];
  for (let day = 0; day <= horizonDays; day += step) {
    const projected = Math.max(0, currentStock - dailyDemand * day);
    data.push({ day, stock: projected, rop: reorderPoint });
  }
  return data;
}

function leadTimeClamp(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(1, Math.min(90, value));
}

function classifyStatus(currentStock, reorderPoint) {
  if (!Number.isFinite(reorderPoint) || reorderPoint <= 0) {
    return { status: "Balanced", tone: "neutral" };
  }
  if (currentStock < reorderPoint) {
    return { status: "Understock", tone: "danger" };
  }
  if (currentStock > reorderPoint * 1.5) {
    return { status: "Overstock", tone: "warning" };
  }
  return { status: "Balanced", tone: "success" };
}

export default function InventoryIntelligencePage() {
  const [selectedSkuId, setSelectedSkuId] = useState(SKU_SALES_HISTORY[0].id);
  const [currentStock, setCurrentStock] = useState(1200);
  const [leadTimeDays, setLeadTimeDays] = useState(14);
  const [serviceLevelZ, setServiceLevelZ] = useState(SERVICE_LEVELS[2].z); // 95%
  const [lookbackMonths, setLookbackMonths] = useState(3);

  const selectedSku = useMemo(
    () => SKU_SALES_HISTORY.find((s) => s.id === selectedSkuId) || SKU_SALES_HISTORY[0],
    [selectedSkuId]
  );

  const metrics = useMemo(() => {
    const ltDays = leadTimeClamp(leadTimeDays);
    const history = selectedSku.months;
    const lastMonths = history.slice(-lookbackMonths);
    const monthlyValues = lastMonths.map((m) => m.sales);

    const avgMonthlyDemand = mean(monthlyValues);
    const monthlyStd = stdDev(monthlyValues);
    const avgDailyDemand = avgMonthlyDemand / 30;
    const dailyStd = monthlyStd / 30;

    const leadTimeDemand = avgDailyDemand * ltDays;
    const safetyStock =
      serviceLevelZ * dailyStd * Math.sqrt(ltDays || 1);
    const reorderPoint = leadTimeDemand + safetyStock;

    const recommendedOrderRaw = reorderPoint + leadTimeDemand - currentStock;
    const recommendedOrder = recommendedOrderRaw > 0 ? Math.round(recommendedOrderRaw) : 0;

    const statusInfo = classifyStatus(currentStock, reorderPoint);

    return {
      avgMonthlyDemand,
      monthlyStd,
      avgDailyDemand,
      dailyStd,
      leadTimeDemand,
      safetyStock,
      reorderPoint,
      recommendedOrder,
      statusInfo,
    };
  }, [selectedSku, lookbackMonths, leadTimeDays, serviceLevelZ, currentStock]);

  const salesTrendData = useMemo(
    () => buildSalesTrendData(selectedSku, lookbackMonths),
    [selectedSku, lookbackMonths]
  );

  const depletionData = useMemo(
    () =>
      buildDepletionData(
        currentStock,
        metrics.avgDailyDemand || 0,
        metrics.reorderPoint || 0
      ),
    [currentStock, metrics.avgDailyDemand, metrics.reorderPoint]
  );

  const summaryBars = [
    { name: "Lead Time Demand", value: Math.round(metrics.leadTimeDemand || 0) },
    { name: "Safety Stock", value: Math.round(metrics.safetyStock || 0) },
    { name: "Reorder Point", value: Math.round(metrics.reorderPoint || 0) },
    { name: "On Hand", value: Math.round(currentStock || 0), isCurrent: true },
  ];

  const statusTone = metrics.statusInfo.tone;
  const statusLabel = metrics.statusInfo.status;

  const statusClasses =
    statusTone === "danger"
      ? "bg-red-50 text-red-700 border-red-100"
      : statusTone === "warning"
      ? "bg-yellow-50 text-yellow-700 border-yellow-100"
      : statusTone === "success"
      ? "bg-green-50 text-green-700 border-green-100"
      : "bg-gray-50 text-gray-700 border-gray-100";

  const currentBarFill =
    statusTone === "danger"
      ? "#f97373"
      : statusTone === "warning"
      ? "#facc15"
      : "#22c55e";

  return (
    <div className="grid grid-cols-12 gap-6">
      <section className="col-span-12 xl:col-span-4 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-lime-600 uppercase tracking-wide flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Inventory Intelligence
              </p>
              <h2 className="text-xl font-bold text-gray-900 mt-1">
                Demand & Reorder Simulation
              </h2>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Select SKU
              </label>
              <select
                value={selectedSkuId}
                onChange={(e) => setSelectedSkuId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400 bg-white"
              >
                {SKU_SALES_HISTORY.map((sku) => (
                  <option key={sku.id} value={sku.id}>
                    {sku.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Current Stock On Hand
                </label>
                <input
                  type="number"
                  min={0}
                  value={currentStock}
                  onChange={(e) =>
                    setCurrentStock(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Lead Time (days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={leadTimeDays}
                  onChange={(e) =>
                    setLeadTimeDays(leadTimeClamp(Number(e.target.value) || 0))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Lookback Window (months)
              </label>
              <select
                value={lookbackMonths}
                onChange={(e) => setLookbackMonths(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400 bg-white"
              >
                {[3, 6, 9, 12].map((m) => (
                  <option key={m} value={m}>
                    Last {m} months
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl px-3 py-3 border border-gray-100">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Avg Monthly Demand
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {Math.round(metrics.avgMonthlyDemand || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                σ = {metrics.monthlyStd.toFixed(1)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-3 border border-gray-100">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Lead Time Demand
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {Math.round(metrics.leadTimeDemand || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {Math.round(metrics.avgDailyDemand || 0)} units / day
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border px-4 py-4 shadow-sm flex gap-3 items-start ${statusClasses}`}>
          <div className="mt-0.5">
            {statusTone === "danger" ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Activity className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1">
              {statusLabel}
            </p>
            <p className="text-sm font-medium">
              {statusLabel === "Understock" &&
                "Current stock is below the safety threshold. Reorder immediately to avoid stockouts."}
              {statusLabel === "Balanced" &&
                "Stock is at a safe level given current demand and lead time."}
              {statusLabel === "Overstock" &&
                "Inventory is higher than required. Consider slowing orders or running a promotion."}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Suggested reorder quantity:{" "}
              <span className="font-semibold text-gray-900">
                {metrics.recommendedOrder.toLocaleString()} units
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="col-span-12 xl:col-span-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[280px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Historical Demand
                </p>
                <h3 className="text-sm font-semibold text-gray-900">
                  Monthly Sales Trend
                </h3>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData} margin={{ top: 10, left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#84cc16"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[280px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Projected Coverage
                </p>
                <h3 className="text-sm font-semibold text-gray-900">
                  Stock Depletion vs Reorder Point
                </h3>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={depletionData} margin={{ top: 10, left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    label={{ value: "Days", position: "insideBottomRight", offset: -4 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  />
                  <ReferenceLine
                    y={metrics.reorderPoint || 0}
                    stroke="#f97373"
                    strokeDasharray="4 4"
                    label={{
                      value: "Reorder Point",
                      position: "insideTopRight",
                      fill: "#b91c1c",
                      fontSize: 11,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stock"
                    stroke="#84cc16"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-6 h-[260px]">
          <div className="flex-1 min-w-[220px]">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Inventory Summary
            </p>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Lead Time Demand, Safety Stock & On-hand
            </h3>
            <ResponsiveContainer width="100%" height="180px">
              <BarChart
                data={summaryBars}
                margin={{ top: 10, left: -10, right: 10, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {summaryBars.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isCurrent ? currentBarFill : "#a3e635"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 min-w-[220px] flex flex-col justify-between bg-gray-50 rounded-2xl border border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recommendation
                </p>
                <h3 className="text-sm font-semibold text-gray-900">
                  Service Level Optimised
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-white border border-gray-100">
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                With a{" "}
                <span className="font-semibold">
                  {SERVICE_LEVELS.find((sl) => sl.z === serviceLevelZ)?.label ??
                    "95%"}
                </span>{" "}
                service level and{" "}
                <span className="font-semibold">
                  {leadTimeClamp(leadTimeDays)} day
                  {leadTimeClamp(leadTimeDays) !== 1 && "s"}
                </span>{" "}
                lead time, the optimal reorder point is{" "}
                <span className="font-semibold">
                  {Math.round(metrics.reorderPoint || 0).toLocaleString()} units
                </span>
                .
              </p>
              {statusLabel === "Understock" && (
                <p>
                  To restore coverage, place an order of{" "}
                  <span className="font-semibold">
                    {metrics.recommendedOrder.toLocaleString()} units
                  </span>{" "}
                  immediately.
                </p>
              )}
              {statusLabel === "Balanced" && (
                <p>
                  No urgent reorder is required. Continue monitoring demand and
                  lead time; update parameters as conditions change.
                </p>
              )}
              {statusLabel === "Overstock" && (
                <p>
                  Consider pausing new orders and exploring markdowns or
                  promotions to reduce excess inventory.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

