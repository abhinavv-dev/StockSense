import React, { useState, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { TrendingUp, AlertTriangle, CheckCircle, Package, Calendar, BarChart3 } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";
const LOCAL_FALLBACK_SKUS = ["A101", "B202", "C303"];
const LOCAL_FALLBACK_PRODUCTS = [
  { sku: "P001", name: "Apple Airpod 2nd Gen" },
  { sku: "P002", name: 'Macbook Pro 16" 32/1TB' },
  { sku: "P003", name: "Gaming Mouse Pad" },
  { sku: "P004", name: "Apple Airpod Max" },
  { sku: "P005", name: "Apple Magic Mouse" },
  { sku: "P006", name: "Apple Watch Ultra" },
  { sku: "P007", name: "Mouse Pad" },
  { sku: "P008", name: "Digital License Key" },
  { sku: "P009", name: "Software Subscription" },
  { sku: "P010", name: "Power Drill Set" },
  { sku: "P011", name: "Wireless Headphones" },
  { sku: "P012", name: "Office Chair" },
  { sku: "P013", name: "Desk Lamp" },
  { sku: "P014", name: "Cotton T-Shirt" },
];

function getLocalMonthlySeries(sku) {
  // Deterministic 24 months, seasonal pattern (same idea as backend fallback)
  const patterns = {
    A101: [40, 42, 45, 50, 60, 70, 75, 72, 65, 55, 48, 42],
    B202: [25, 26, 28, 30, 34, 38, 40, 39, 36, 32, 29, 26],
    C303: [55, 58, 60, 63, 70, 78, 82, 80, 74, 68, 60, 58],
  };
  // Product-derived SKUs reuse A101 seasonality shape with deterministic bumps
  let pattern = patterns[sku];
  if (!pattern && /^P\d{3}$/.test(sku)) {
    const pid = Number(sku.slice(1)) || 1;
    const bump = (pid % 7) - 3; // [-3..3]
    pattern = patterns.A101.map((v) => Math.max(1, v + bump));
  }
  pattern = pattern || patterns.A101;
  const startYear = 2023;
  const rows = [];
  for (let i = 0; i < 24; i++) {
    const year = startYear + Math.floor(i / 12);
    const month = (i % 12) + 1;
    const date = `${year}-${String(month).padStart(2, "0")}-01`;
    const base = pattern[i % 12];
    const factor = i < 12 ? 1.0 : 1.1; // mild growth in year 2
    rows.push({ date, sales: Math.round(base * factor) });
  }
  return rows;
}

function expandMonthlyToDaily(monthlyRows) {
  // Convert monthly first-of-month points into a daily series via linear interpolation.
  const points = monthlyRows
    .map((r) => ({ t: new Date(r.date).getTime(), sales: Number(r.sales) || 0 }))
    .sort((a, b) => a.t - b.t);
  if (points.length < 2) return [];

  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.max(1, Math.round((b.t - a.t) / dayMs));
    for (let d = 0; d < days; d++) {
      const t = a.t + d * dayMs;
      const frac = days === 0 ? 0 : d / days;
      const sales = a.sales + (b.sales - a.sales) * frac;
      out.push({ date: new Date(t), sales });
    }
  }
  // include last point day
  out.push({ date: new Date(points[points.length - 1].t), sales: points[points.length - 1].sales });
  return out;
}

function mean(xs) {
  if (!xs.length) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

function stddev(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function calculateLocalSeasonality(dailyRows) {
  if (!dailyRows.length) return Array.from({ length: 30 }, () => 1.0);
  const byDow = Array.from({ length: 7 }, () => []);
  for (const r of dailyRows) {
    const dow = r.date.getDay(); // 0..6
    byDow[dow].push(r.sales);
  }
  const overall = mean(dailyRows.map((r) => r.sales));
  const factors = byDow.map((xs) => (overall > 0 ? mean(xs) / overall : 1.0));
  while (factors.length < 7) factors.push(1.0);
  return Array.from({ length: 30 }, (_, i) => round2(factors[i % 7]));
}

function calculateLocalTrend(dailyRows, window = 7) {
  if (!dailyRows.length) return Array.from({ length: 30 }, () => 0.0);
  const sales = dailyRows.map((r) => r.sales);
  const w = Math.max(1, Math.min(window, sales.length));
  const trend = [];
  for (let i = 0; i < sales.length; i++) {
    const start = Math.max(0, i - w + 1);
    trend.push(mean(sales.slice(start, i + 1)));
  }
  const last = trend.length ? trend[trend.length - 1] : mean(sales);
  while (trend.length < 30) trend.push(last);
  return trend.slice(0, 30).map(round2);
}

function calculateLocalForecast(dailyRows, days = 30) {
  if (!dailyRows.length) return Array.from({ length: days }, () => 0.0);
  const sales = dailyRows.map((r) => r.sales);
  const avg = mean(sales);
  const seasonality = calculateLocalSeasonality(dailyRows);
  const recent = mean(sales.slice(-7));
  const older = mean(sales.slice(0, Math.max(1, sales.length - 7)));
  const trendFactor = older > 0 ? recent / older : 1.0;
  return Array.from({ length: days }, (_, i) => {
    const sf = seasonality[i % seasonality.length] || 1.0;
    const v = avg * sf * Math.pow(trendFactor, i / Math.max(days, 1));
    return round2(Math.max(0, v));
  });
}

function localAnalyzeDemand({ sku, stock_intake, time_limit, stock_exhausted }) {
  const monthly = getLocalMonthlySeries(sku);
  const daily = expandMonthlyToDaily(monthly);
  const lookback = daily.slice(-Math.min(365, daily.length)); // cap lookback to available data (max 1 year)
  const sales = lookback.map((r) => r.sales);

  const avg_daily_demand = mean(sales);
  const demand_std = stddev(sales) || avg_daily_demand * 0.2;
  const lead_time = Number(time_limit) || 1;
  const lead_time_demand = avg_daily_demand * lead_time;
  const safety_stock = 1.65 * demand_std * Math.sqrt(Math.max(lead_time, 0));
  const reorder_point = lead_time_demand + safety_stock;
  const current_stock = (Number(stock_intake) || 0) - (Number(stock_exhausted) || 0);
  const recommended_order_qty = Math.max(0, reorder_point - current_stock + lead_time_demand);

  const stock_status =
    current_stock < reorder_point * 0.7 ? "Understock" : current_stock > reorder_point * 1.5 ? "Overstock" : "Balanced";

  return {
    sku,
    forecast: calculateLocalForecast(lookback, 30),
    avg_daily_demand: round2(avg_daily_demand),
    lead_time_demand: round2(lead_time_demand),
    safety_stock: round2(safety_stock),
    reorder_point: round2(reorder_point),
    recommended_order_qty: round2(recommended_order_qty),
    stock_status,
    seasonality: calculateLocalSeasonality(lookback),
    trend: calculateLocalTrend(lookback, 7),
  };
}

export default function SKUDemandAnalysis() {
  const [skus, setSkus] = useState([]); // [{ sku, name? }]
  const [selectedSku, setSelectedSku] = useState("");
  const [stockIntake, setStockIntake] = useState(1000);
  const [timeLimit, setTimeLimit] = useState(30);
  const [stockExhausted, setStockExhausted] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExplorer, setShowExplorer] = useState(false);

  // Fetch available SKUs on component mount
  useEffect(() => {
    fetchSKUs();
  }, []);

  // Fetch analysis when inputs change
  useEffect(() => {
    if (selectedSku && stockIntake >= 0 && timeLimit > 0 && stockExhausted >= 0) {
      const debounceTimer = setTimeout(() => {
        fetchAnalysis();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [selectedSku, stockIntake, timeLimit, stockExhausted]);

  const fetchSKUs = async () => {
    try {
      // Prefer detailed endpoint (includes product-derived SKUs)
      const detailedResp = await fetch(`${API_BASE_URL}/api/skus-detailed`);
      if (detailedResp.ok) {
        const detailed = await detailedResp.json();
        const items = Array.isArray(detailed.skus) ? detailed.skus : [];
        setSkus(items);
        if (items.length > 0) setSelectedSku(items[0].sku);
        return;
      }

      // Fallback to legacy endpoint
      const response = await fetch(`${API_BASE_URL}/api/skus`);
      const data = await response.json();
      const list = (data.skus || []).map((s) => ({ sku: s, name: null }));
      setSkus(list);
      if (list.length > 0) setSelectedSku(list[0].sku);
    } catch (err) {
      console.error("Error fetching SKUs:", err);
      // Local fallback so the feature is usable offline even without the Python backend.
      console.log("[SKU Demand AnalysisNew] Using local sample dataset");
      const list = [...LOCAL_FALLBACK_PRODUCTS, ...LOCAL_FALLBACK_SKUS.map((s) => ({ sku: s, name: null }))];
      setSkus(list);
      setSelectedSku((prev) => prev || list[0].sku);
      setError("Python backend not reachable. Using local sample dataset.");
    }
  };

  const fetchAnalysis = async () => {
    if (!selectedSku) return;

    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (stockIntake < 0) {
        throw new Error("Stock intake must be non-negative");
      }
      if (timeLimit <= 0) {
        throw new Error("Time limit must be positive");
      }
      if (stockExhausted < 0 || stockExhausted > stockIntake) {
        throw new Error("Stock exhausted must be between 0 and stock intake");
      }

      const response = await fetch(`${API_BASE_URL}/api/demand-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: selectedSku,
          stock_intake: stockIntake,
          time_limit: timeLimit,
          stock_exhausted: stockExhausted,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch analysis");
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      console.error("Error fetching analysis:", err);
      // If backend is down, fall back to local deterministic analysis.
      console.log("[SKU Demand AnalysisNew] Using local sample dataset");
      const local = localAnalyzeDemand({
        sku: selectedSku,
        stock_intake: stockIntake,
        time_limit: timeLimit,
        stock_exhausted: stockExhausted,
      });
      setAnalysisData(local);
      setError("Python backend not reachable. Showing local demo analysis.");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const seasonalityChartData = analysisData
    ? {
        labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
        datasets: [
          {
            label: "Seasonality Factor",
            data: analysisData.seasonality,
            borderColor: "rgb(132, 204, 22)",
            backgroundColor: "rgba(132, 204, 22, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 2,
          },
        ],
      }
    : null;

  const trendChartData = analysisData
    ? {
        labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
        datasets: [
          {
            label: "Rolling Average Demand",
            data: analysisData.trend,
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 2,
          },
        ],
      }
    : null;

  const forecastChartData = analysisData
    ? {
        labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
        datasets: [
          {
            label: "Forecasted Demand",
            data: analysisData.forecast,
            borderColor: "rgb(168, 85, 247)",
            backgroundColor: "rgba(168, 85, 247, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 2,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const seasonalInsights = useMemo(() => {
    if (!analysisData) return null;
    const { seasonality = [], trend = [], forecast = [] } = analysisData;
    if (!seasonality.length || !trend.length || !forecast.length) return null;

    const peakSeasonIdx = seasonality.reduce(
      (maxIdx, v, idx) => (v > seasonality[maxIdx] ? idx : maxIdx),
      0
    );
    const peakSeasonFactor = seasonality[peakSeasonIdx] ?? 1;

    const trendStart = trend[0] ?? 0;
    const trendEnd = trend[trend.length - 1] ?? trendStart;
    const trendDelta = trendEnd - trendStart;
    const trendPercent = trendStart !== 0 ? (trendDelta / trendStart) * 100 : 0;

    const totalForecast = forecast.reduce((s, v) => s + (v || 0), 0);

    let trendDirection = "stable";
    if (trendPercent > 5) trendDirection = "upward";
    else if (trendPercent < -5) trendDirection = "downward";

    return {
      peakDayLabel: `Day ${peakSeasonIdx + 1}`,
      peakSeasonFactor,
      trendDirection,
      trendPercent,
      totalForecast,
    };
  }, [analysisData]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Understock":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "Overstock":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "Balanced":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Understock":
        return "bg-red-50 text-red-700 border-red-200";
      case "Overstock":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Balanced":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Inline Seasonality & Trend Explorer (compact overlay) */}
      {seasonalInsights && showExplorer && (
        <div className="absolute right-0 top-0 mt-4 mr-0 md:mr-4 z-20 max-w-sm w-full md:w-80">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Seasonality &amp; Trend Explorer</h3>
              <button
                onClick={() => setShowExplorer(false)}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Brief summary of seasonality and demand trend for the selected SKU.
            </p>
            <div className="space-y-2 text-xs text-gray-700">
              <div>
                <span className="font-medium">Peak period:</span>{" "}
                {seasonalInsights.peakDayLabel} &mdash; factor{" "}
                {seasonalInsights.peakSeasonFactor.toFixed(2)}&times; vs average day.
              </div>
              <div>
                <span className="font-medium">Trend:</span>{" "}
                <span className="capitalize">{seasonalInsights.trendDirection}</span>{" "}
                ({seasonalInsights.trendPercent.toFixed(1)}% over 30 days).
              </div>
              <div>
                <span className="font-medium">30‑day demand:</span>{" "}
                {seasonalInsights.totalForecast.toFixed(0)} units (forecast sum).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-lime-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-lime-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SKU Demand Analysis</h1>
            <p className="text-sm text-gray-500 mt-1">
              Analyze demand patterns, seasonality, and get restocking recommendations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!seasonalInsights}
            onClick={() => setShowExplorer((v) => !v)}
            className={[
              "px-3 py-1.5 rounded-full border text-xs font-medium",
              "transition-colors transition-shadow duration-200",
              seasonalInsights ? "hover:shadow-[0_0_0_1px_rgba(190,242,100,0.8)] hover:bg-gradient-to-r hover:from-lime-50 hover:to-white" : "",
              seasonalInsights
                ? "border-lime-300 text-gray-700 bg-white hover:bg-lime-50"
                : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed",
            ].join(" ")}
          >
            Seasonality &amp; Trend Explorer
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Input Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU Selector
            </label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400 bg-white"
              disabled={loading}
            >
              {skus.length === 0 ? (
                <option value="">Loading SKUs...</option>
              ) : (
                skus.map((item) => (
                  <option key={item.sku} value={item.sku}>
                    {item.name ? `${item.sku} — ${item.name}` : item.sku}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Intake (units)
            </label>
            <input
              type="number"
              min="0"
              value={stockIntake}
              onChange={(e) => setStockIntake(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (days)
            </label>
            <input
              type="number"
              min="1"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Exhausted (units)
            </label>
            <input
              type="number"
              min="0"
              max={stockIntake}
              value={stockExhausted}
              onChange={(e) =>
                setStockExhausted(
                  Math.max(0, Math.min(stockIntake, Number(e.target.value) || 0))
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="animate-pulse text-gray-500">Analyzing demand...</div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisData && !loading && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <p className="text-xs font-medium text-gray-500 uppercase">Avg Daily Demand</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {analysisData.avg_daily_demand.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">units/day</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <p className="text-xs font-medium text-gray-500 uppercase">Lead Time Demand</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {analysisData.lead_time_demand.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">units</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-gray-500" />
                <p className="text-xs font-medium text-gray-500 uppercase">Safety Stock</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {analysisData.safety_stock.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">units</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <p className="text-xs font-medium text-gray-500 uppercase">Reorder Point</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {analysisData.reorder_point.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">units</p>
            </div>
          </div>

          {/* Stock Status & Recommendations */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className={`flex items-start gap-4 p-4 rounded-xl border ${getStatusColor(analysisData.stock_status)}`}>
              {getStatusIcon(analysisData.stock_status)}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Stock Status: {analysisData.stock_status}</h3>
                <p className="text-sm mb-3">
                  {analysisData.stock_status === "Understock" &&
                    "Current stock is below the reorder point. Immediate action required to avoid stockouts."}
                  {analysisData.stock_status === "Balanced" &&
                    "Stock levels are optimal. Continue monitoring demand patterns."}
                  {analysisData.stock_status === "Overstock" &&
                    "Stock levels are higher than necessary. Consider reducing orders or running promotions."}
                </p>
                <div className="bg-white/50 rounded-lg p-3 mt-2">
                  <p className="text-sm font-medium">
                    Recommended Order Quantity:{" "}
                    <span className="text-lg font-bold">
                      {analysisData.recommended_order_qty.toFixed(0)} units
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seasonality Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonality Pattern</h3>
              <div className="h-[300px]">
                {seasonalityChartData && (
                  <Line data={seasonalityChartData} options={chartOptions} />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Shows repeating weekly/monthly demand patterns
              </p>
            </div>

            {/* Trend Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Trend</h3>
              <div className="h-[300px]">
                {trendChartData && <Line data={trendChartData} options={chartOptions} />}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Rolling average showing upward or downward trends
              </p>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">30-Day Demand Forecast</h3>
            <div className="h-[350px]">
              {forecastChartData && <Line data={forecastChartData} options={chartOptions} />}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Projected demand based on historical patterns, seasonality, and trends
            </p>
          </div>
        </>
      )}

      {/* Empty State */}
      {!analysisData && !loading && !error && (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Select a SKU and enter parameters to see demand analysis</p>
        </div>
      )}
    </div>
  );
}
