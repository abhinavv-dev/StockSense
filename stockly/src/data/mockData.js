import { 
  ShoppingBag, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Bell, 
  Search, 
  Download, 
  Upload, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle 
} from "lucide-react";

export const NAV_LINKS = [
  { name: "Home", href: "#" },
  { name: "Calendar", href: "#" },
  { name: "Customers", href: "#" },
  { name: "Products", href: "#/", path: "dashboard" },
  { name: "Inventory Intelligence", href: "#/inventory-intelligence", path: "inventory-intelligence", badge: "New" },
  { name: "SKU Demand Analysis", href: "#/sku-demand-analysis", path: "sku-demand-analysis", badge: "New" },
];

export const INVENTORY_DATA = [
  { name: "Digital Goods", value: 42, fill: "#FCD34D" },
  { name: "Physical Goods", value: 58, fill: "#E5E7EB" },
];

export const SALES_BREAKDOWN_DATA = [
  { name: "Electronics", value: 89922, fill: "#FCD34D" },
  { name: "Tools", value: 41954, fill: "#E5E7EB" },
  { name: "Clothes", value: 21082, fill: "#9CA3AF" },
  { name: "Furniture", value: 17561, fill: "#D1D5DB" },
];

export const DEMAND_SUPPLY_DATA = [
  { month: "Jan", demand: 2.5, supply: 3.0 },
  { month: "Feb", demand: 3.0, supply: 3.2 },
  { month: "Mar", demand: 2.8, supply: 3.5 },
  { month: "Apr", demand: 3.2, supply: 3.0 },
  { month: "May", demand: 3.5, supply: 4.2 },
  { month: "Jun", demand: 4.0, supply: 3.8 },
  { month: "Jul", demand: 3.8, supply: 4.5 },
  { month: "Aug", demand: 4.2, supply: 4.0 },
  { month: "Sep", demand: 4.5, supply: 4.8 },
  { month: "Oct", demand: 4.0, supply: 4.2 },
  { month: "Nov", demand: 3.8, supply: 4.0 },
  { month: "Dec", demand: 4.2, supply: 4.5 },
];

export const RECENT_STOCKS = [
  {
    id: 1,
    name: "Apple Airpod 2nd Gen",
    variants: "3 Variants",
    date: "22 Sep, 2025",
    amount: 289.00,
    status: "Complete",
    image: "https://images.unsplash.com/photo-1572569028738-411a197b83f2?w=100&h=100&fit=crop",
  },
  {
    id: 2,
    name: "Macbook Pro 16\" 32/1TB",
    variants: "2 Variants",
    date: "15 Sep, 2025",
    amount: 2890.00,
    status: "View Details", // This seems to be an action in the image, but let's treat it as status for now or just standard row
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=100&h=100&fit=crop",
  },
  {
    id: 3,
    name: "Gaming Mouse Pad",
    variants: "9 Variants",
    date: "15 Sep, 2025",
    amount: 18.00,
    status: "Delete", // Again, action in image
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=100&h=100&fit=crop",
  },
  {
    id: 4,
    name: "Apple Airpod Max",
    variants: "",
    date: "12 Sep, 2025",
    amount: 579.00,
    status: "In Progress",
    image: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=100&h=100&fit=crop",
  },
  {
    id: 5,
    name: "Apple Magic Mouse",
    variants: "3 Variants",
    date: "12 Sep, 2025",
    amount: 108.08,
    status: "Complete",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&h=100&fit=crop",
  },
  {
    id: 6,
    name: "Apple Watch Ultra",
    variants: "",
    date: "08 Sep, 2025",
    amount: 988.08,
    status: "In Progress",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100&h=100&fit=crop",
  },
  {
    id: 7,
    name: "Mouse Pad",
    variants: "",
    date: "5 Sep, 2025",
    amount: 56.98,
    status: "Complete",
    image: "https://images.unsplash.com/photo-1629367494173-c78a56567877?w=100&h=100&fit=crop",
  },
];
