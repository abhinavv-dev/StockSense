# Seasonality & Trend Explorer

A local demo application for analyzing SKU sales patterns, seasonality, trends, and inventory metrics. Built with Python FastAPI backend and React frontend with Chart.js visualizations.

## Features

- **Monthly Sales Analysis**: Analyze historical sales data for multiple SKUs
- **Seasonality Detection**: Identify monthly seasonal patterns using simple or advanced methods
- **Trend Analysis**: Calculate rolling averages (3-month and 6-month) to identify trends
- **Inventory Metrics**: Compute reorder points, safety stock, and recommended order quantities
- **Stock Depletion Projection**: Visualize projected stock levels over time
- **Interactive Charts**: Three Chart.js visualizations that update dynamically

## Project Structure

```
seasonality-trend-explorer/
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── analytics.py           # Analytics calculations
│   ├── data_loader.py        # CSV/SQLite data loading
│   ├── seed_db.py            # Optional SQLite seeding script
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── App.css           # Styles
│   │   ├── index.js          # React entry point
│   │   └── index.css         # Global styles
│   ├── public/
│   │   └── index.html        # HTML template
│   └── package.json         # Node.js dependencies
├── data/
│   └── sample_sales.csv     # Sample sales data (24 months × 3 SKUs)
└── README.md                # This file
```

## Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** (optional, for cloning)

## Setup Instructions

### 1. Backend Setup

#### Create Virtual Environment (Recommended)

```bash
cd seasonality-trend-explorer/backend
python3 -m venv .venv
```

#### Activate Virtual Environment

**On macOS/Linux:**
```bash
source .venv/bin/activate
```

**On Windows:**
```bash
.venv\Scripts\activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pandas` - Data processing
- `numpy` - Numerical calculations
- `statsmodels` - Advanced seasonality (optional)
- `python-multipart` - File upload support

#### Create and Seed SQLite Database

```bash
python3 seed_db.py
```

This creates `data/inventory.db` with:
- `monthly_sales` table (24 months × 3 SKUs = 72 records)
- `sku_info` table (product metadata)
- Indexes for performance

**Verify database:**
```bash
python3 test_db.py
```

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed database documentation.


### 2. Frontend Setup

```bash
cd ../frontend
npm install
```

This installs:
- `react` & `react-dom`
- `react-scripts` (Create React App)
- `chart.js` & `react-chartjs-2`

## Running the Application

### Terminal 1: Start Backend

```bash
cd seasonality-trend-explorer/backend
source .venv/bin/activate  # If using venv
uvicorn app:app --reload --port 8000
```

Or using Python directly:
```bash
python app.py
```

The API will be available at `http://localhost:8000`

**Verify backend is running:**
```bash
curl http://localhost:8000/api/skus
```

Expected response:
```json
{"skus": ["A101", "B202", "C303"]}
```

### Terminal 2: Start Frontend

```bash
cd seasonality-trend-explorer/frontend
npm start
```

The frontend will open at `http://localhost:3000` (or another port if 3000 is busy).

## Usage

1. **Select SKU**: Choose from dropdown (A101, B202, or C303)
2. **Set Parameters**:
   - **Lookback Months**: Number of historical months to analyze (1-24)
   - **Current Stock**: Current inventory on hand
   - **Lead Time Days**: Supplier lead time (1-90 days)
   - **Service Level**: Target service level (90%, 95%, or 99%)
3. **Click "Analyze"**: The backend computes analytics and returns JSON
4. **View Results**: Three charts update automatically:
   - **Monthly Sales Trend**: Historical sales with rolling averages
   - **Seasonality Pattern**: Monthly seasonal indices
   - **Stock Depletion Projection**: Projected stock levels vs reorder point

## API Endpoints

### GET `/api/skus`

Returns list of available SKUs.

**Response:**
```json
{
  "skus": ["A101", "B202", "C303"]
}
```

### POST `/api/analyze`

Performs comprehensive SKU analysis.

**Request Body:**
```json
{
  "sku": "A101",
  "lookback_months": 12,
  "current_stock": 200,
  "lead_time_days": 20,
  "service_level": 95,
  "use_advanced_seasonality": false
}
```

**Response:**
```json
{
  "sku": "A101",
  "history": [
    {"date": "2023-01-01", "sales": 120},
    {"date": "2023-02-01", "sales": 150},
    ...
  ],
  "predicted_next_month": 135.5,
  "avg_monthly": 130.2,
  "std_monthly": 15.8,
  "daily_avg": 4.34,
  "lead_time_demand": 86.8,
  "safety_stock": 20.5,
  "reorder_point": 107.3,
  "recommended_order_qty": 60,
  "stock_status": "Understock",
  "seasonality": {
    "month_index": [1, 2, 3, ..., 12],
    "seasonal_index": [0.9, 1.1, 1.0, ..., 1.05]
  },
  "trend": [
    {"date": "2023-01-01", "sales": 120, "rolling_3": 120, "rolling_6": 120},
    ...
  ],
  "depletion_projection": [
    {"day": 0, "stock": 200},
    {"day": 1, "stock": 195.66},
    ...
  ]
}
```

## Calculation Logic

### A. Historical Series Preparation
- Load monthly sales for requested SKU from CSV
- Sort by date ascending
- Cap lookback_months to available data

### B. Next Month Prediction
- **Simple Method** (default): Average of last N months
- **Advanced Method** (optional): Uses `statsmodels.seasonal_decompose` to extract trend and seasonal components

### C. Trend Calculation
- Rolling 3-month average
- Rolling 6-month average
- Computed using pandas `.rolling()` function

### D. Seasonality Calculation
- **Method 1** (default): Monthly seasonal index
  - Group by month-of-year (1-12)
  - Compute average for each month
  - Normalize by overall mean to get multiplicative index
- **Method 2** (optional): Uses `seasonal_decompose` if statsmodels available

### E. Demand Variability
- Standard deviation of monthly sales over lookback period
- Converted to daily: `std_daily = std_monthly / sqrt(30)`

### F. Lead Time Demand
- `lead_time_demand = daily_avg × lead_time_days`

### G. Safety Stock
- Uses Z-values: 90% → 1.28, 95% → 1.65, 99% → 2.33
- `safety_stock = Z × std_daily × sqrt(lead_time_days)`

### H. Reorder Point
- `reorder_point = lead_time_demand + safety_stock`

### I. Recommended Order Quantity
- If `current_stock < reorder_point`:
  - `recommended_order_qty = max(0, desired_target_stock - current_stock)`
- Else: `recommended_order_qty = 0`

### J. Stock Status
- **Understock**: `current_stock < reorder_point`
- **Overstock**: `current_stock > predicted_next_month × 1.5`
- **Balanced**: Otherwise

### K. Depletion Projection
- Simulates daily stock reduction
- Starts at `current_stock`
- Subtracts `daily_avg` per day
- Projects up to 60 days or until stock ≤ 0

## Example Requests

### Using curl

```bash
# Get available SKUs
curl http://localhost:8000/api/skus

# Analyze SKU A101
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "A101",
    "lookback_months": 12,
    "current_stock": 200,
    "lead_time_days": 20,
    "service_level": 95
  }'
```

### Using Python

```python
import requests

# Get SKUs
response = requests.get("http://localhost:8000/api/skus")
print(response.json())

# Analyze
response = requests.post(
    "http://localhost:8000/api/analyze",
    json={
        "sku": "A101",
        "lookback_months": 12,
        "current_stock": 200,
        "lead_time_days": 20,
        "service_level": 95
    }
)
print(response.json())
```

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Use a different port
uvicorn app:app --reload --port 8001
# Then update API_BASE_URL in frontend/src/App.js
```

**CSV file not found:**
- Verify `data/sample_sales.csv` exists
- Check path in `data_loader.py` if using custom location

**Import errors:**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again

### Frontend Issues

**Cannot connect to backend:**
- Verify backend is running on port 8000
- Check CORS settings in `backend/app.py`
- Update `API_BASE_URL` in `frontend/src/App.js` if backend uses different port

**Charts not displaying:**
- Check browser console for errors
- Verify Chart.js dependencies: `npm list chart.js react-chartjs-2`
- Ensure analysis data is returned from API

**npm install fails:**
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then reinstall

## Database Schema

The SQLite database (`data/inventory.db`) contains:

### Table: `monthly_sales`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `sku`: TEXT (SKU identifier)
- `date`: DATE (YYYY-MM-DD, first day of month)
- `sales`: INTEGER (units sold)

### Table: `sku_info` (optional)
- `sku`: TEXT PRIMARY KEY
- `description`: TEXT
- `unit_price`: REAL
- `lead_time_days`: INTEGER

**Sample Data:**
- 3 SKUs: A101, B202, C303
- 24 months per SKU (2 years)
- Realistic seasonality patterns included

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed database documentation.

## Development Notes

- All calculations use pandas/numpy (fast, local computation)
- No heavy ML training - all operations are lightweight
- Defensive coding: handles missing months, edge cases
- Logging enabled for debugging
- CORS configured for local development

## License

This is a demo project for educational purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify all prerequisites are installed
3. Check backend logs for errors
4. Check browser console for frontend errors
