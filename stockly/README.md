# StockSense

A dynamic inventory and product management dashboard with real-time charts and a temporary JSON database.

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Install Python backend dependencies** (for SKU Demand Analysis)
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Run the app** (API server + frontend)
   ```bash
   npm run dev:all
   ```

   Or run separately:
   ```bash
   npm run server   # API at http://localhost:3001
   npm run dev      # Frontend at http://localhost:3000
   ```

4. **Run Python backend** (for SKU Demand Analysis page)
   ```bash
   cd backend
   python main.py
   # Or: uvicorn main:app --reload --port 8000
   ```
   The Python API will be available at `http://localhost:8000`

5. Open **http://localhost:3000** in your browser.
   - **/** — Redirects to landing page
   - **/login/index.html** — Landing page (StockSense)
   - **/login/signin.html** — Login / credentials (admin/admin)
   - **/dashboard.html** — StockSense dashboard (after Login)
   - **#/sku-demand-analysis** — SKU Demand Analysis page (requires Python backend)

## Features

- **Dynamic data** – All charts and tables load from the API
- **Temporary database** – JSON file at `server/stocksense.json` (auto-created, seeded on first run)
- **Full CRUD** – Add, edit, delete products; changes immediately update all charts
- **Search** – Filter products by name or category in the header
- **Export** – Download CSV or JSON report
- **Charts** – Inventory (digital vs physical), Sales breakdown by category, Demand & Supply over months
- **SKU Demand Analysis** – Advanced demand forecasting with seasonality, trends, and restocking recommendations (Chart.js visualizations)

## API Endpoints

### Node.js API (Port 3001)

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

### Python FastAPI (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skus` | List available SKUs from CSV |
| POST | `/api/demand-analysis` | Perform demand analysis with seasonality and trends |

## Data Flow

When you add, edit, or delete a product:

1. The API updates `server/stocksense.json`
2. The frontend refetches all data
3. Inventory, Sales Breakdown, Demand & Supply, and Metrics recompute from the updated products
4. Charts and tables re-render with the new values
