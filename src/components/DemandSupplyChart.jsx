import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useStock } from "../context/StockContext";
import { ChevronDown, TrendingUp } from "lucide-react";

export default function DemandSupplyChart() {
  const { demandSupply, loading, monthlyFilter, setMonthlyFilter } = useStock();

  if (loading || !demandSupply) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const { data, totalSupplyFormatted, trend } = demandSupply;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Demand & Supply</h3>
          <p className="text-sm text-gray-500">Track Product Demand And Stock Levels</p>
        </div>
        <div className="relative">
          <select
            value={monthlyFilter}
            onChange={(e) => setMonthlyFilter(e.target.value)}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors appearance-none pr-8 bg-white cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Total Supply:</span>
          <span className="text-xl font-bold text-gray-900">{totalSupplyFormatted}</span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-600 text-xs font-bold rounded">
            +{trend}% <TrendingUp className="w-3 h-3" />
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-lime-500" style={{ backgroundColor: "#84cc16" }} />
            <span className="text-xs text-gray-500">Demand</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#a3e635" }} />
            <span className="text-xs text-gray-500">Supply</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#84cc16" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a3e635" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
              tickFormatter={(value) => `${value}m`}
            />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              cursor={{ stroke: "#84cc16", strokeWidth: 2, strokeDasharray: "5 5" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                const isMay = label === "May";
                return (
                  <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
                    <p className="text-xs text-gray-600">Demand: ${d?.demand ?? 0}M</p>
                    <p className="text-xs text-gray-600">Supply: ${d?.supply ?? 0}M</p>
                    {isMay && (
                      <p className="text-xs font-bold text-green-600 mt-1 flex items-center gap-1">+12% <TrendingUp className="w-3 h-3" /></p>
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="demand"
              stroke="#84cc16"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorDemand)"
            />
            <Area
              type="monotone"
              dataKey="supply"
              stroke="#a3e635"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSupply)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
