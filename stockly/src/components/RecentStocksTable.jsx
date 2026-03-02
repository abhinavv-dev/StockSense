import React, { useState } from "react";
import { useStock } from "../context/StockContext";
import {
  MoreVertical,
  ChevronRight,
  Calendar,
  Trash2,
  Edit,
  Eye,
  Plus,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

const STATUS_OPTIONS = ["Complete", "In Progress", "Pending"];
const CATEGORY_OPTIONS = ["Electronics", "Tools", "Clothes", "Furniture", "Accessories", "Software"];
const TYPE_OPTIONS = ["digital", "physical"];

function parseDateToYMD(val) {
  if (!val) return val;
  if (val.includes("-") && val.length >= 10) return val.slice(0, 10);
  const m = val.match(/(\d+)\s+(\w+),\s+(\d+)/);
  if (!m) return val;
  const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  return `${m[3]}-${months[m[2]] || "01"}-${String(m[1]).padStart(2, "0")}`;
}

function ProductModal({ product, onClose, onSave, mode = "edit" }) {
  const [form, setForm] = useState(
    product
      ? {
          name: product.name,
          variants_count: product.variants_count ?? 0,
          date: parseDateToYMD(product.date_iso || product.date),
          amount: product.amount,
          quantity: product.quantity ?? 1,
          status: product.status,
          image: product.image || "",
          category: product.category || "Electronics",
          type: product.type || "physical",
        }
      : {
          name: "",
          variants_count: 0,
          date: new Date().toISOString().slice(0, 10),
          amount: 0,
          quantity: 1,
          status: "Pending",
          image: "",
          category: "Electronics",
          type: "physical",
        }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              {mode === "add" ? "Add Product" : "Edit Product"}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variants</label>
                <input
                  type="number"
                  min="0"
                  value={form.variants_count}
                  onChange={(e) => setForm({ ...form, variants_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-400"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-400"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-400"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-400"
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-lime-400 text-black rounded-xl text-sm font-medium hover:bg-lime-500"
              >
                {mode === "add" ? "Add" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function RecentStocksTable() {
  const { products, loading, error, addProduct, updateProduct, deleteProduct, refresh } = useStock();
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalMode, setModalMode] = useState("edit");
  const [detailProduct, setDetailProduct] = useState(null);

  const toggleSelect = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === products.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(products.map((s) => s.id));
    }
  };

  const toggleMenu = (id) => {
    if (activeMenu === id) {
      setActiveMenu(null);
    } else {
      setActiveMenu(id);
    }
  };

  const handleEdit = (product) => {
    setActiveMenu(null);
    setModalProduct(product);
    setModalMode("edit");
  };

  const handleAdd = () => {
    setModalProduct(null);
    setModalMode("add");
  };

  const handleViewDetails = (product) => {
    setActiveMenu(null);
    setDetailProduct(product);
  };

  const handleSave = async (form) => {
    if (modalMode === "add") {
      await addProduct(form);
    } else {
      await updateProduct(modalProduct.id, form);
    }
    setModalProduct(null);
  };

  const handleDelete = async (product) => {
    setActiveMenu(null);
    if (window.confirm(`Delete "${product.name}"?`)) {
      await deleteProduct(product.id);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.includes("-")) {
      const d = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
    }
    return dateStr;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center gap-3">
        <p className="text-amber-600 font-medium">Could not load products</p>
        <p className="text-sm text-gray-500 text-center max-w-md">{error}</p>
        <p className="text-xs text-gray-400">Make sure the API server is running on port 3001 (run from stockly: npm run dev)</p>
        <button onClick={refresh} className="px-4 py-2 bg-lime-400 text-black rounded-lg text-sm font-medium hover:bg-lime-500">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Recent Stocks</h3>
          <p className="text-sm text-gray-500">Monitor Stock Activity And Store Updates</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 px-3 py-1.5 bg-lime-400 text-black rounded-lg text-sm font-medium hover:bg-lime-500"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors group">
            View All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-10 py-3 text-left">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-lime-400 focus:ring-lime-400 cursor-pointer accent-lime-400 sm:mx-0 mx-auto block"
                  checked={products.length > 0 && selectedRows.length === products.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((stock) => (
              <tr
                key={stock.id}
                className={cn(
                  "group hover:bg-gray-50/50 transition-colors",
                  selectedRows.includes(stock.id) ? "bg-lime-50/30" : ""
                )}
              >
                <td className="py-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-lime-400 focus:ring-lime-400 cursor-pointer accent-lime-400"
                    checked={selectedRows.includes(stock.id)}
                    onChange={() => toggleSelect(stock.id)}
                  />
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={stock.image || "https://via.placeholder.com/100"}
                      alt={stock.name}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{stock.name}</p>
                      {stock.variants && (
                        <p className="text-xs text-gray-500">{stock.variants}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(stock.date_iso || stock.date)}
                  </div>
                </td>
                <td className="py-4">
                  <span className="text-sm font-medium text-gray-900">${Number(stock.amount).toFixed(2)}</span>
                </td>
                <td className="py-4">
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      stock.status === "Complete"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : stock.status === "In Progress"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-gray-50 text-gray-700 border-gray-100"
                    )}
                  >
                    {stock.status}
                  </span>
                </td>
                <td className="py-4 text-right relative">
                  <button
                    onClick={() => toggleMenu(stock.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {activeMenu === stock.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-10 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1"
                      >
                        <button
                          onClick={() => handleViewDetails(stock)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                        <button
                          onClick={() => handleEdit(stock)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(stock)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {(modalProduct !== null || modalMode === "add") && (
          <ProductModal
            product={modalProduct}
            mode={modalMode}
            onClose={() => {
              setModalProduct(null);
              setModalMode("edit");
            }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {detailProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailProduct(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Product Details</h3>
              <button onClick={() => setDetailProduct(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-4">
                <img src={detailProduct.image || "https://via.placeholder.com/100"} alt={detailProduct.name} className="w-20 h-20 rounded-lg object-cover" />
                <div>
                  <p className="font-semibold text-gray-900">{detailProduct.name}</p>
                  <p className="text-sm text-gray-500">{detailProduct.variants || "No variants"}</p>
                </div>
              </div>
              <p><span className="text-gray-500">Date:</span> {formatDate(detailProduct.date_iso || detailProduct.date)}</p>
              <p><span className="text-gray-500">Amount:</span> ${Number(detailProduct.amount).toFixed(2)}</p>
              <p><span className="text-gray-500">Status:</span> {detailProduct.status}</p>
              <p><span className="text-gray-500">Category:</span> {detailProduct.category}</p>
              <p><span className="text-gray-500">Type:</span> {detailProduct.type}</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
