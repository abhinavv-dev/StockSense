import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useStock } from "../context/StockContext";
import { Box, TrendingUp } from "lucide-react";

export default function InventoryCard() {
  const { inventory, loading } = useStock();

  if (loading || !inventory) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const { totalInventory, inventoryData, categories, tags, digitalPct, trend } = inventory;
  const displayTags = (tags && tags.length > 0) ? tags : categories;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-between relative overflow-hidden">
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Inventory</p>
          <h3 className="text-3xl font-bold text-gray-900">{totalInventory.toLocaleString()}</h3>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
          <Box className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 z-10">
        {(displayTags || []).slice(0, 7).map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-medium text-gray-600">
            {tag}
          </span>
        ))}
        {(displayTags || []).length > 7 && (
          <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-medium text-gray-600">
            +{(displayTags || []).length - 7}
          </span>
        )}
      </div>

      <div className="flex items-center justify-center py-2 relative z-10">
        <div className="w-40 h-40 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={inventoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
              >
                {inventoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{digitalPct}%</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide leading-tight">Digital<br/>Goods</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 z-10">
        <p className="text-sm text-gray-500">Then Last Month</p>
        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-md text-green-600 text-xs font-bold">
          +{trend}% <TrendingUp className="w-3 h-3" />
        </div>
      </div>

      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-50 pointer-events-none" style={{ backgroundColor: "#dcfce7" }} />
    </div>
  );
}
