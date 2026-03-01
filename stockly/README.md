# StockSense

A dynamic inventory and product management dashboard with real-time charts and a temporary JSON database.

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the app** (API server + frontend)
   ```bash
   npm run dev:all
   ```

   Or run separately:
   ```bash
   npm run server   # API at http://localhost:3001
   npm run dev      # Frontend at http://localhost:3000
   ```

3. Open **http://localhost:3000** in your browser.
   - **/** — Redirects to landing page
   - **/login/index.html** — Landing page (StockSense)
   - **/login/signin.html** — Login / credentials (admin/admin)
   - **/dashboard.html** — StockSense dashboard (after Login)

## Features

- **Dynamic data** – All charts and tables load from the API
- **Temporary database** – JSON file at `server/stocksense.json` (auto-created, seeded on first run)
- **Full CRUD** – Add, edit, delete products; changes immediately update all charts
- **Search** – Filter products by name or category in the header
- **Export** – Download CSV or JSON report
- **Charts** – Inventory (digital vs physical), Sales breakdown by category, Demand & Supply over months

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (optional `?search=`) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/inventory` | Inventory stats & digital/physical split |
| GET | `/api/sales-breakdown` | Sales by category |
| GET | `/api/demand-supply` | Monthly demand & supply |
| GET | `/api/metrics` | Total sales, churn rate |
| GET | `/api/export/csv` | Export products as CSV |
| GET | `/api/report` | Download full JSON report |

## Data Flow

When you add, edit, or delete a product:

1. The API updates `server/stocksense.json`
2. The frontend refetches all data
3. Inventory, Sales Breakdown, Demand & Supply, and Metrics recompute from the updated products
4. Charts and tables re-render with the new values
