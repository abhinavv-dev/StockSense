# StockSense

A dynamic inventory and product management dashboard with real-time charts and a JSON-file database.

## Quick Start (any machine)

### Prerequisites

- **Node.js** LTS ([nodejs.org](https://nodejs.org))
- **Python 3** ([python.org](https://python.org))

### 1 — Install dependencies

```bash
# From the stockly/ folder:
npm install

pip install -r backend/requirements.txt
# If your system uses python3: pip3 install -r backend/requirements.txt
```

### 2 — Start everything with one command

```bash
npm run dev
```

This launches **three processes simultaneously** via `concurrently`:

| Process | Address |
|---------|---------|
| Node.js API | `http://localhost:3001` |
| Vite frontend | `http://localhost:3000` |
| Python FastAPI | `http://localhost:8000` |

### 3 — Open the app

Go to **http://localhost:3000**

| URL | Page |
|-----|------|
| `/` | Redirects to Landing page |
| `/login/index.html` | Landing page |
| `/login/signin.html` | Login (admin / admin) |
| `/dashboard.html` | Main dashboard |
| `#/sku-demand-analysis` | SKU Demand Analysis |

---

## Troubleshooting

**`python: command not found`** — your system may only have `python3`. Edit `package.json`:
```json
"start:python": "cd backend && python3 main.py"
```

**SKU Demand page shows "backend not reachable"** — the Python FastAPI server on port 8000 isn't running. Check the `python` process output in your terminal. Run it manually to see the error:
```bash
cd backend && python main.py
```

**Empty dashboard** — `server/stocksense.json` is auto-created and seeded on first run. If you see an empty table, the seed may not have run: `stop → npm run dev` again.

**Port already in use** — kill the conflicting process or change the port in `package.json` (`--port=3000`) and `vite.config.js`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | Required for Gemini AI features |
| `VITE_PYTHON_API_URL` | `http://localhost:8000` | Override the Python API URL |

---

## Features

- **Dynamic data** — All charts and tables load from the API
- **Persistent database** — JSON file at `server/stocksense.json` (seeded on first run, committed to repo)
- **Full CRUD** — Add, edit, delete products; all charts update instantly
- **Search** — Filter products by name or category
- **Export** — Download CSV or JSON report
- **Charts** — Inventory split, sales by category, demand & supply
- **SKU Demand Analysis** — Demand forecasting with seasonality, trends, and restocking recommendations

---

## API Reference

### Node.js API (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (`?search=`) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/inventory` | Inventory stats |
| GET | `/api/sales-breakdown` | Sales by category |
| GET | `/api/demand-supply` | Monthly demand & supply |
| GET | `/api/metrics` | Total sales, churn rate |
| GET | `/api/export/csv` | Export products as CSV |
| GET | `/api/report` | Full JSON report download |

### Python FastAPI (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skus` | Available SKUs |
| GET | `/api/skus-detailed` | SKUs with product names |
| POST | `/api/demand-analysis` | Demand analysis with seasonality & trends |
