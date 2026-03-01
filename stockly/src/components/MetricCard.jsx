import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../lib/utils";

export default function MetricCard({ title, value, trend, icon: Icon, trendLabel = "Then Last Month" }) {
  const isPositive = trend > 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <p className="text-xs text-gray-400">{trendLabel}</p>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold",
          isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        )}>
          {isPositive ? "+" : ""}{trend}% 
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );
}
