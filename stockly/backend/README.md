# SKU Demand Analysis Backend

Python FastAPI backend for SKU demand analysis with seasonality and trend calculations.

## Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Ensure the CSV data file exists at `backend/data/sku_sales.csv`

## Running the Server

```bash
cd backend
python main.py
```

Or using uvicorn directly:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### GET `/api/skus`
Returns list of available SKUs from the CSV file.

**Response:**
```json
{
  "skus": ["A101", "B202", "C303"]
}
```

### POST `/api/demand-analysis`
Performs demand analysis for a SKU.

**Request Body:**
```json
{
  "sku": "A101",
  "stock_intake": 1000,
  "time_limit": 30,
  "stock_exhausted": 0
}
```

**Response:**
```json
{
  "sku": "A101",
  "forecast": [10, 12, 15, ...],
  "avg_daily_demand": 12.75,
  "lead_time_demand": 51,
  "safety_stock": 15,
  "reorder_point": 66,
  "recommended_order_qty": 100,
  "stock_status": "Understock",
  "seasonality": [0.9, 1.1, 1.0, ...],
  "trend": [11, 12, 12.5, 13, ...]
}
```

## CSV Data Format

The CSV file should have the following columns:
- `date`: Date in YYYY-MM-DD format
- `sku`: SKU identifier
- `sales`: Number of units sold

Example:
```csv
date,sku,sales
2024-01-01,A101,12
2024-01-02,A101,15
```
