from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from typing import List, Optional

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class DemandAnalysisRequest(BaseModel):
    sku: str
    stock_intake: float
    time_limit: int  # days
    stock_exhausted: float

class DemandAnalysisResponse(BaseModel):
    sku: str
    forecast: List[float]
    avg_daily_demand: float
    lead_time_demand: float
    safety_stock: float
    reorder_point: float
    recommended_order_qty: float
    stock_status: str
    seasonality: List[float]
    trend: List[float]

# Helper functions
def load_sku_data(sku: str) -> pd.DataFrame:
    """Load historical sales data for a SKU from CSV"""
    csv_path = os.path.join(os.path.dirname(__file__), "data", "sku_sales.csv")
    
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail=f"CSV file not found at {csv_path}")
    
    df = pd.read_csv(csv_path)
    
    # Filter by SKU
    sku_df = df[df['sku'] == sku].copy()
    
    if sku_df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for SKU: {sku}")
    
    # Convert date column to datetime
    sku_df['date'] = pd.to_datetime(sku_df['date'])
    sku_df = sku_df.sort_values('date').reset_index(drop=True)
    
    return sku_df

def calculate_seasonality(df: pd.DataFrame) -> List[float]:
    """Calculate weekly and monthly seasonality factors"""
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_of_month'] = df['date'].dt.day
    df['week_of_year'] = df['date'].dt.isocalendar().week
    
    # Weekly seasonality (7-day pattern)
    weekly_avg = df.groupby('day_of_week')['sales'].mean()
    overall_avg = df['sales'].mean()
    weekly_seasonality = (weekly_avg / overall_avg).tolist()
    
    # If we have less than 7 days, pad with 1.0
    while len(weekly_seasonality) < 7:
        weekly_seasonality.append(1.0)
    
    # Extend to 30 days for visualization
    seasonality_30 = []
    for i in range(30):
        seasonality_30.append(weekly_seasonality[i % 7])
    
    return seasonality_30

def calculate_trend(df: pd.DataFrame, window: int = 7) -> List[float]:
    """Calculate rolling average trend"""
    df_sorted = df.sort_values('date').reset_index(drop=True)
    
    # Calculate rolling averages
    rolling_7 = df_sorted['sales'].rolling(window=min(window, len(df_sorted)), min_periods=1).mean()
    rolling_30 = df_sorted['sales'].rolling(window=min(30, len(df_sorted)), min_periods=1).mean()
    
    # Use 7-day rolling average, extend with 30-day if needed
    trend = rolling_7.tolist()
    
    # If we need more data points, extend with last value or 30-day average
    if len(trend) < 30:
        last_value = trend[-1] if trend else df_sorted['sales'].mean()
        trend.extend([last_value] * (30 - len(trend)))
    
    return trend[:30]

def calculate_forecast(df: pd.DataFrame, days: int = 30) -> List[float]:
    """Generate forecast for next N days"""
    # Calculate average daily demand
    avg_daily = df['sales'].mean()
    
    # Apply seasonality
    seasonality = calculate_seasonality(df)
    
    # Calculate trend direction
    if len(df) >= 7:
        recent_avg = df.tail(7)['sales'].mean()
        older_avg = df.head(max(1, len(df) - 7))['sales'].mean()
        trend_factor = recent_avg / older_avg if older_avg > 0 else 1.0
    else:
        trend_factor = 1.0
    
    # Generate forecast
    forecast = []
    for i in range(days):
        seasonal_factor = seasonality[i % len(seasonality)]
        forecast_value = avg_daily * seasonal_factor * (trend_factor ** (i / 30))
        forecast.append(max(0, forecast_value))
    
    return forecast

def calculate_safety_stock(avg_daily_demand: float, lead_time: int, demand_std: float, service_level: float = 1.65) -> float:
    """Calculate safety stock using standard deviation method"""
    # Service level z-score (1.65 for ~95% service level)
    safety_stock = service_level * demand_std * np.sqrt(lead_time)
    return max(0, safety_stock)

def classify_stock_status(current_stock: float, reorder_point: float) -> str:
    """Classify stock status"""
    if current_stock < reorder_point * 0.7:
        return "Understock"
    elif current_stock > reorder_point * 1.5:
        return "Overstock"
    else:
        return "Balanced"

@app.get("/")
def root():
    return {"message": "SKU Demand Analysis API", "version": "1.0.0"}

@app.get("/api/skus")
def get_available_skus():
    """Get list of available SKUs from CSV"""
    csv_path = os.path.join(os.path.dirname(__file__), "data", "sku_sales.csv")
    
    if not os.path.exists(csv_path):
        return {"skus": []}
    
    df = pd.read_csv(csv_path)
    skus = df['sku'].unique().tolist()
    return {"skus": sorted(skus)}

@app.post("/api/demand-analysis", response_model=DemandAnalysisResponse)
def analyze_demand(request: DemandAnalysisRequest):
    """Perform demand analysis for a SKU"""
    try:
        # Validate inputs
        if request.stock_intake < 0:
            raise HTTPException(status_code=400, detail="Stock intake must be non-negative")
        if request.time_limit <= 0:
            raise HTTPException(status_code=400, detail="Time limit must be positive")
        if request.stock_exhausted < 0 or request.stock_exhausted > request.stock_intake:
            raise HTTPException(status_code=400, detail="Stock exhausted must be between 0 and stock intake")
        
        # Load SKU data
        df = load_sku_data(request.sku)
        
        if len(df) < 7:
            raise HTTPException(status_code=400, detail="Insufficient historical data (need at least 7 days)")
        
        # Calculate average daily demand from historical data
        avg_daily_demand = df['sales'].mean()
        
        # Calculate demand variability (standard deviation)
        demand_std = df['sales'].std()
        if np.isnan(demand_std) or demand_std == 0:
            demand_std = avg_daily_demand * 0.2  # Default 20% variability
        
        # Calculate lead time (from user input: time_limit)
        lead_time = request.time_limit
        
        # Calculate lead time demand
        lead_time_demand = avg_daily_demand * lead_time
        
        # Calculate safety stock
        safety_stock = calculate_safety_stock(avg_daily_demand, lead_time, demand_std)
        
        # Calculate reorder point
        reorder_point = lead_time_demand + safety_stock
        
        # Calculate current stock (stock_intake - stock_exhausted)
        current_stock = request.stock_intake - request.stock_exhausted
        
        # Calculate recommended order quantity
        recommended_order_qty = max(0, reorder_point - current_stock + lead_time_demand)
        
        # Classify stock status
        stock_status = classify_stock_status(current_stock, reorder_point)
        
        # Calculate seasonality (30 days)
        seasonality = calculate_seasonality(df)
        
        # Calculate trend (30 days)
        trend = calculate_trend(df)
        
        # Generate forecast (30 days)
        forecast = calculate_forecast(df, days=30)
        
        return DemandAnalysisResponse(
            sku=request.sku,
            forecast=forecast,
            avg_daily_demand=round(avg_daily_demand, 2),
            lead_time_demand=round(lead_time_demand, 2),
            safety_stock=round(safety_stock, 2),
            reorder_point=round(reorder_point, 2),
            recommended_order_qty=round(recommended_order_qty, 2),
            stock_status=stock_status,
            seasonality=seasonality,
            trend=trend
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
