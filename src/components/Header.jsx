import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Settings,
  Bell,
  Download,
  Upload,
  Command,
  LogOut,
} from "lucide-react";
import { NAV_LINKS } from "../data/mockData";
import { useStock } from "../context/StockContext";
import { cn } from "../lib/utils";

const FALLBACK_TAGS = ["Laptop", "Watch", "Mouse", "Airpod", "iMac", "iPhone"];

export default function Header() {
  const { searchQuery, setSearchQuery, exportCsv, downloadReport, inventory } = useStock();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const hash = typeof window !== "undefined" ? (window.location.hash || "#/").slice(1) : "/";
  const isLinkActive = (link) => {
    if (!link.path) return false;
    if (link.path === "dashboard") return hash === "/" || hash === "" || !hash.startsWith("/inventory-intelligence");
    if (link.path === "inventory-intelligence") return hash.startsWith("/inventory-intelligence");
    return false;
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    window.location.href = "/login/index.html";
  };

  return (
    <header className="flex flex-col gap-6 px-8 py-6 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm transform rotate-45" />
          </div>
          <span className="text-xl font-bold tracking-tight">Stockly</span>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-gray-50 p-1 rounded-full">
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link);
            return (
            <a
              key={link.name}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 relative",
                active
                  ? "bg-lime-400 text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {link.name}
              {link.badge && (
                <span className="absolute -top-1 -right-1 bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-white">
                  {link.badge}
                </span>
              )}
            </a>
          );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>
          <div className="relative pl-4 border-l border-gray-200" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none"
            >
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
                alt="User"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm cursor-pointer"
              />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-gray-900">John Smith</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage, track, and analyze products in one place.
          </p>
          {inventory?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(inventory.tags.length > 6 ? inventory.tags.slice(0, 6) : inventory.tags).map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-600 hover:bg-lime-50 hover:border-lime-200 hover:text-lime-700 cursor-pointer transition-colors"
                >
                  {tag}
                </span>
              ))}
              {inventory.tags.length > 6 && (
                <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-600">
                  +{inventory.tags.length - 6}
                </span>
              )}
            </div>
          )}
          {(!inventory?.tags || inventory.tags.length === 0) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {FALLBACK_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-600"
                >
                  {tag}
                </span>
              ))}
              <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-600">+14</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-lime-500 transition-colors" />
            <input
              type="text"
              placeholder="Search Here.."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 w-64 transition-all shadow-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-500 border border-gray-200">
              <Command className="w-3 h-3" />K
            </div>
          </div>

          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>
    </header>
  );
}
