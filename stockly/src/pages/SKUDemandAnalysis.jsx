import React, { useState, useEffect } from "react";
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

const API_BASE_URL = "http://localhost:8000";

export default function SKUDemandAnalysis() {
  const [skus, setSkus] = useState([]);
  const [selectedSku, setSelectedSku] = useState("");
  const [stockIntake, setStockIntake] = useState(1000);
  const [timeLimit, setTimeLimit] = useState(30);
  const [stockExhausted, setStockExhausted] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const response = await fetch(`${API_BASE_URL}/api/skus`);
      const data = await response.json();
      setSkus(data.skus || []);
      if (data.skus && data.skus.length > 0) {
        setSelectedSku(data.skus[0]);
      }
    } catch (err) {
      console.error("Error fetching SKUs:", err);
      setError("Failed to load available SKUs. Make sure the Python backend is running.");
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
      setError(err.message || "Failed to analyze demand. Please check your inputs.");
      setAnalysisData(null);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
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
                skus.map((sku) => (
                  <option key={sku} value={sku}>
                    {sku}
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
