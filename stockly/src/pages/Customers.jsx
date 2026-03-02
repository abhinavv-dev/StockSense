import React from "react";
import { AlertTriangle } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500 mt-1">Under maintenance</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
        <p className="text-gray-700 font-medium">This page is under maintenance.</p>
        <p className="text-sm text-gray-500 mt-2">We’re working on it. Please check back soon.</p>
      </div>
    </div>
  );
}

