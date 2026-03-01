import React, { useState, useEffect } from 'react';
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
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './App.css';

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

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [skus, setSkus] = useState([]);
  const [selectedSku, setSelectedSku] = useState('');
  const [lookbackMonths, setLookbackMonths] = useState(12);
  const [currentStock, setCurrentStock] = useState(200);
  const [leadTimeDays, setLeadTimeDays] = useState(20);
  const [serviceLevel, setServiceLevel] = useState(95);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available SKUs on mount
  useEffect(() => {
    fetchSKUs();
  }, []);

  const fetchSKUs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/skus`);
      const data = await response.json();
      setSkus(data.skus || []);
      if (data.skus && data.skus.length > 0) {
        setSelectedSku(data.skus[0]);
      }
    } catch (err) {
      setError('Failed to connect to backend. Make sure the Python server is running on port 8000.');
      console.error('Error fetching SKUs:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedSku) {
      setError('Please select a SKU');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku: selectedSku,
          lookback_months: lookbackMonths,
          current_stock: currentStock,
          lead_time_days: leadTimeDays,
          service_level: serviceLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze SKU');
      console.error('Error analyzing:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const trendChartData = analysisData
    ? {
        labels: analysisData.trend.map((d) => {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }),
        datasets: [
          {
            label: 'Monthly Sales',
            data: analysisData.trend.map((d) => d.sales),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            type: 'line',
          },
          {
            label: 'Rolling 3-Month Avg',
            data: analysisData.trend.map((d) => d.rolling_3),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.4,
          },
          {
            label: 'Rolling 6-Month Avg',
            data: analysisData.trend.map((d) => d.rolling_6),
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'transparent',
            borderDash: [10, 5],
            tension: 0.4,
          },
        ],
      }
    : null;

  const seasonalityChartData = analysisData
    ? {
        labels: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
        datasets: [
          {
            label: 'Seasonal Index',
            data: analysisData.seasonality.seasonal_index,
            backgroundColor: 'rgba(168, 85, 247, 0.6)',
            borderColor: 'rgb(168, 85, 247)',
            borderWidth: 2,
          },
        ],
      }
    : null;

  const depletionChartData = analysisData
    ? {
        labels: analysisData.depletion_projection.map((d) => d.day),
        datasets: [
          {
            label: 'Projected Stock',
            data: analysisData.depletion_projection.map((d) => d.stock),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Reorder Point',
            data: new Array(analysisData.depletion_projection.length).fill(
              analysisData.reorder_point
            ),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            borderWidth: 2,
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
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Understock':
        return 'status-badge understock';
      case 'Overstock':
        return 'status-badge overstock';
      case 'Balanced':
        return 'status-badge balanced';
      default:
        return 'status-badge';
    }
  };

  const getCurrentMonthIndex = () => {
    return new Date().getMonth();
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Seasonality & Trend Explorer</h1>
        <p>Analyze SKU sales patterns, seasonality, and inventory metrics</p>
      </header>

      <div className="container">
        {/* Input Section */}
        <div className="input-section">
          <h2>Analysis Parameters</h2>
          <div className="input-grid">
            <div className="input-group">
              <label>SKU</label>
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                disabled={loading}
              >
                {skus.length === 0 ? (
                  <option value="">Loading...</option>
                ) : (
                  skus.map((sku) => (
                    <option key={sku} value={sku}>
                      {sku}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="input-group">
              <label>Lookback Months</label>
              <input
                type="number"
                min="1"
                max="24"
                value={lookbackMonths}
                onChange={(e) => setLookbackMonths(parseInt(e.target.value) || 12)}
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Current Stock</label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Lead Time (days)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 20)}
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Service Level (%)</label>
              <select
                value={serviceLevel}
                onChange={(e) => setServiceLevel(parseInt(e.target.value))}
                disabled={loading}
              >
                <option value={90}>90%</option>
                <option value={95}>95%</option>
                <option value={99}>99%</option>
              </select>
            </div>

            <div className="input-group">
              <button
                onClick={handleAnalyze}
                disabled={loading || !selectedSku}
                className="analyze-button"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Results Section */}
        {analysisData && (
          <>
            {/* Key Metrics */}
            <div className="metrics-section">
              <div className="metric-card">
                <div className="metric-label">Predicted Next Month</div>
                <div className="metric-value">{analysisData.predicted_next_month}</div>
                <div className="metric-unit">units</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Reorder Point</div>
                <div className="metric-value">{analysisData.reorder_point.toFixed(1)}</div>
                <div className="metric-unit">units</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Safety Stock</div>
                <div className="metric-value">{analysisData.safety_stock.toFixed(1)}</div>
                <div className="metric-unit">units</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Recommended Order Qty</div>
                <div className="metric-value">{analysisData.recommended_order_qty.toFixed(0)}</div>
                <div className="metric-unit">units</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Stock Status</div>
                <div className={getStatusColor(analysisData.stock_status)}>
                  {analysisData.stock_status}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="recommendation-section">
              <h3>Recommendation</h3>
              <p>
                {analysisData.stock_status === 'Understock' && (
                  <>
                    Order <strong>{analysisData.recommended_order_qty.toFixed(0)} units</strong> now
                    to meet expected demand and maintain {serviceLevel}% service level. Current
                    stock ({currentStock} units) is below the reorder point (
                    {analysisData.reorder_point.toFixed(1)} units).
                  </>
                )}
                {analysisData.stock_status === 'Balanced' && (
                  <>
                    Stock levels are optimal. Current stock ({currentStock} units) is sufficient
                    to meet expected demand. Continue monitoring and maintain {serviceLevel}%
                    service level.
                  </>
                )}
                {analysisData.stock_status === 'Overstock' && (
                  <>
                    Stock levels are higher than necessary. Consider reducing orders or running
                    promotions. Current stock ({currentStock} units) exceeds predicted demand by
                    more than 50%.
                  </>
                )}
              </p>
            </div>

            {/* Charts */}
            <div className="charts-section">
              {/* Trend Chart */}
              <div className="chart-container">
                <h3>Monthly Sales Trend & Rolling Averages</h3>
                <div className="chart-wrapper">
                  {trendChartData && <Line data={trendChartData} options={chartOptions} />}
                </div>
                <p className="chart-description">
                  Historical monthly sales with 3-month and 6-month rolling averages showing
                  demand trends.
                </p>
              </div>

              {/* Seasonality Chart */}
              <div className="chart-container">
                <h3>Seasonality Pattern</h3>
                <div className="chart-wrapper">
                  {seasonalityChartData && <Bar data={seasonalityChartData} options={chartOptions} />}
                </div>
                <p className="chart-description">
                  Monthly seasonal indices showing demand multipliers. Values above 1.0 indicate
                  above-average demand for that month. Current month:{' '}
                  {seasonalityChartData &&
                    seasonalityChartData.datasets[0].data[getCurrentMonthIndex()].toFixed(2)}
                </p>
              </div>

              {/* Depletion Chart */}
              <div className="chart-container">
                <h3>Stock Depletion Projection vs Reorder Point</h3>
                <div className="chart-wrapper">
                  {depletionChartData && <Line data={depletionChartData} options={chartOptions} />}
                </div>
                <p className="chart-description">
                  Projected daily stock depletion based on average daily demand. Reorder when stock
                  crosses the reorder point line.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!analysisData && !loading && (
          <div className="empty-state">
            <p>Select parameters and click "Analyze" to see results</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
