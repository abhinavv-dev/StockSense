import React, { useState, useRef, useEffect } from "react";
import { Search, Settings, Download, Upload, Command, LogOut, AlertTriangle, Moon, Sun } from "lucide-react";
import { NAV_LINKS } from "../data/mockData";
import { useStock } from "../context/StockContext";
import { cn } from "../lib/utils";

const FALLBACK_TAGS = ["Laptop", "Watch", "Mouse", "Airpod", "iMac", "iPhone"];

export default function Header() {
  const { searchQuery, setSearchQuery, exportCsv, downloadReport, inventory } = useStock();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("stocksense_dark_mode");
    if (stored === "true") return true;
    if (stored === "false") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const hash = typeof window !== "undefined" ? (window.location.hash || "#/").slice(1) : "/";
  const getRouteFromHash = (h) => {
    if (h.startsWith("/calendar")) return "calendar";
    if (h.startsWith("/customers")) return "customers";
    if (h.startsWith("/sku-demand-analysis")) return "sku-demand-analysis";
    if (h.startsWith("/inventory-intelligence")) return "inventory-intelligence";
    return "dashboard";
  };
  const route = getRouteFromHash(hash);

  const isLinkActive = (link) => {
    if (!link.path) return false;
    if (link.path === "dashboard") return hash === "/" || hash === "";
    if (link.path === "calendar") return hash.startsWith("/calendar");
    if (link.path === "customers") return hash.startsWith("/customers");
    if (link.path === "inventory-intelligence") return hash.startsWith("/inventory-intelligence");
    if (link.path === "sku-demand-analysis") return hash.startsWith("/sku-demand-analysis");
    return false;
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
       if (settingsRef.current && !settingsRef.current.contains(e.target)) {
         setSettingsOpen(false);
       }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Apply dark mode class to document root
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("stocksense-dark");
    } else {
      root.classList.remove("stocksense-dark");
    }
    window.localStorage.setItem("stocksense_dark_mode", darkMode ? "true" : "false");
  }, [darkMode]);

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
          <span className="text-xl font-bold tracking-tight">StockSense</span>
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
              {(link.badge || link.badgeIcon) && (
                <span
                  className={cn(
                    "absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-white",
                    link.badgeColor === "red"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  )}
                >
                  {link.badgeIcon === "alert" ? (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      <span className="sr-only">Under maintenance</span>
                    </>
                  ) : (
                    link.badge
                  )}
                </span>
              )}
            </a>
          );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative" ref={settingsRef}>
            <button
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setSettingsOpen((v) => !v)}
            >
              <Settings className="w-5 h-5" />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-40">
                <button
                  onClick={() => setDarkMode((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span>Dark mode</span>
                  {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
            )}
          </div>
          <div className="relative pl-4 border-l border-gray-200" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none"
            >
              <img
                src="/vignesh-avatar.png"
                alt="User"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm cursor-pointer"
              />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-gray-900">Vignesh</p>
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

      {route === "dashboard" && (
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
      )}
    </header>
  );
}
