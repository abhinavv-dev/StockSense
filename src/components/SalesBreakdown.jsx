import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useStock } from "../context/StockContext";
import { Box, ChevronDown } from "lucide-react";

export default function SalesBreakdown() {
  const { salesBreakdown, loading, monthlyFilter, setMonthlyFilter } = useStock();

  if (loading || !salesBreakdown) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const { data, totalSales, monthlyGrowth } = salesBreakdown;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Product Sales Breakdown</h3>
          <p className="text-sm text-gray-500">Analyze Product Performance And Key Metrics</p>
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

      <div className="flex flex-col lg:flex-row items-center gap-8 flex-1">
        <div className="relative w-52 h-52 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                cornerRadius={6}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="#fff" strokeWidth={1} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-2xl font-bold text-gray-900">{monthlyGrowth}%</p>
            <p className="text-[10px] text-gray-500 leading-tight">Monthly<br/>Growth</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 min-w-[140px]">
          <Box className="w-6 h-6 text-gray-400 mb-2" />
          <p className="text-xs text-gray-500 mb-1">Total Product Sell</p>
          <h4 className="text-xl font-bold text-gray-900">{totalSales.toLocaleString()}</h4>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 flex-1 w-full">
          {data.map((item) => (
            <div key={item.name} className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-xs font-medium text-gray-500">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900 pl-4">${item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
