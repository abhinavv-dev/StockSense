# SKU Demand Analysis Setup Guide

This guide explains how to set up and use the new SKU Demand Analysis feature.

## Prerequisites

1. **Node.js and npm** (already installed for the main app)
2. **Python 3.8+** with pip

## Installation Steps

### 1. Install Frontend Dependencies

```bash
cd stockly
npm install
```

This will install `chart.js` and `react-chartjs-2` for the Chart.js visualizations.

### 2. Install Python Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- FastAPI (web framework)
- uvicorn (ASGI server)
- pandas (data processing)
- numpy (numerical calculations)

### 3. Verify CSV Data

Ensure the CSV file exists at `backend/data/sku_sales.csv` with the following format:
```csv
date,sku,sales
2024-01-01,A101,12
2024-01-02,A101,15
...
```

## Running the Application

### Terminal 1: Node.js Backend & Frontend
```bash
cd stockly
npm run dev:all
```
This starts:
- Node.js API server on `http://localhost:3001`
- React frontend on `http://localhost:3000`

### Terminal 2: Python Backend (for SKU Analysis)
```bash
cd stockly/backend
python main.py
```
Or:
```bash
uvicorn main:app --reload --port 8000
```

This starts the Python FastAPI server on `http://localhost:8000`

## Accessing the SKU Demand Analysis Page

1. Open `http://localhost:3000` in your browser
2. Navigate to the "SKU Demand Analysis" page using the header navigation
3. Or directly visit: `http://localhost:3000#/sku-demand-analysis`

## Using the Page

1. **Select a SKU** from the dropdown (populated from CSV)
2. **Enter Stock Intake**: Total units received at start
3. **Enter Time Limit**: Number of days expected for stock to last
4. **Enter Stock Exhausted**: Units sold before stock exhausted

The page will automatically:
- Calculate seasonality patterns
- Calculate demand trends
- Generate 30-day forecast
- Compute reorder point and safety stock
- Provide restocking recommendations
- Display interactive Chart.js visualizations

## Features

- **Seasonality Chart**: Shows weekly/monthly repeating patterns
- **Trend Chart**: Shows rolling average demand trends
- **Forecast Chart**: 30-day projected demand
- **Key Metrics**: Average daily demand, lead time demand, safety stock, reorder point
- **Stock Status**: Understock/Balanced/Overstock classification
- **Recommendations**: Suggested order quantity based on analysis

## Troubleshooting

### Python backend not starting
- Ensure Python 3.8+ is installed: `python --version`
- Check dependencies: `pip list | grep fastapi`
- Verify CSV file exists: `ls backend/data/sku_sales.csv`

### Frontend can't connect to Python backend
- Ensure Python backend is running on port 8000
- Check CORS settings in `backend/main.py`
- Verify API URL in `src/pages/SKUDemandAnalysis.jsx` (default: `http://localhost:8000`)

### Charts not displaying
- Ensure Chart.js dependencies are installed: `npm list chart.js react-chartjs-2`
- Check browser console for errors
- Verify analysis data is being returned from the API

## API Endpoints

### GET `/api/skus`
Returns available SKUs from CSV.

### POST `/api/demand-analysis`
Request body:
```json
{
  "sku": "A101",
  "stock_intake": 1000,
  "time_limit": 30,
  "stock_exhausted": 0
}
```

Response includes:
- Forecast array (30 days)
- Average daily demand
- Lead time demand
- Safety stock
- Reorder point
- Recommended order quantity
- Stock status
- Seasonality array (30 days)
- Trend array (30 days)
