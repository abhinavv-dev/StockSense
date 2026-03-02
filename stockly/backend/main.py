from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
import os
from typing import List, Optional
import sqlite3

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    # SKU Demand AnalysisNew is often served from varying dev ports.
    # Allow localhost/127.0.0.1 on any port for local development.
    allow_origins=[],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
SKU_CSV_PATH = os.path.join(DATA_DIR, "sku_sales.csv")
SAMPLE_CSV_PATH = os.path.join(DATA_DIR, "sample_sales.csv")
PRODUCTS_CSV_PATH = os.path.join(DATA_DIR, "products.csv")


def generate_sample_sales_csv(csv_path: str) -> None:
    """
    Generate deterministic monthly sample sales data for SKUs A101, B202, C303.
    - 24 months per SKU
    - date = first day of month (YYYY-MM-DD)
    - simple seasonal variation pattern
    """
    if os.path.exists(csv_path):
        return

    os.makedirs(os.path.dirname(csv_path), exist_ok=True)

    skus = {
        "A101": [40, 42, 45, 50, 60, 70, 75, 72, 65, 55, 48, 42],
        "B202": [25, 26, 28, 30, 34, 38, 40, 39, 36, 32, 29, 26],
        "C303": [55, 58, 60, 63, 70, 78, 82, 80, 74, 68, 60, 58],
    }

    start_year = 2023
    rows = ["date,sku,sales\n"]

    for sku, pattern in skus.items():
        for i in range(24):
            year = start_year + (i // 12)
            month = (i % 12) + 1
            d = date(year, month, 1).isoformat()
            base = pattern[i % 12]
            # Second year slightly higher to simulate growth
            factor = 1.0 if i < 12 else 1.1
            sales = int(round(base * factor))
            rows.append(f"{d},{sku},{sales}\n")

    with open(csv_path, "w", encoding="utf-8") as f:
        f.writelines(rows)


def ensure_sample_data() -> None:
    """
    Ensure local sample dataset exists for SKU Demand AnalysisNew.
    - If CSV missing → generate deterministic sample_sales.csv
    - If SQLite DB missing → seed minimal table from CSV
    """
    os.makedirs(DATA_DIR, exist_ok=True)

    if not os.path.exists(SAMPLE_CSV_PATH):
        generate_sample_sales_csv(SAMPLE_CSV_PATH)

    # Seed a small SQLite DB from the sample CSV if it doesn't exist.
    db_path = os.path.join(DATA_DIR, "sku_sales.db")
    if not os.path.exists(db_path) and os.path.exists(SAMPLE_CSV_PATH):
        try:
            df = pd.read_csv(SAMPLE_CSV_PATH)
            conn = sqlite3.connect(db_path)
            df.to_sql("sku_sales", conn, index=False, if_exists="replace")
            conn.close()
        except Exception as e:
            # Soft failure – this DB is optional for the current feature.
            print(f"[SKU Demand AnalysisNew] Warning seeding SQLite DB failed: {e}")


def _read_products_catalog() -> pd.DataFrame:
    """
    Best-effort read of backend product catalog CSV.
    Expected: id,name,...
    Returns empty DataFrame if missing/invalid.
    """
    if not os.path.exists(PRODUCTS_CSV_PATH):
        return pd.DataFrame()
    try:
        df = pd.read_csv(PRODUCTS_CSV_PATH)
        if "id" not in df.columns or "name" not in df.columns:
            return pd.DataFrame()
        cols = ["id", "name"]
        if "sku" in df.columns:
            cols.insert(1, "sku")
        return df[cols].dropna()
    except Exception:
        return pd.DataFrame()


def _product_id_to_sku(product_id: int) -> str:
    # Deterministic SKU id derived from product id (stable across runs)
    return f"P{int(product_id):03d}"


def ensure_product_skus_in_sales_csv() -> None:
    """
    SKU Demand AnalysisNew helper:
    - Derive a SKU ID for each product in backend/data/products.csv
    - Ensure each derived SKU exists in backend/data/sku_sales.csv by appending
      24 monthly rows (first day of month), deterministic seasonal pattern.

    This does NOT overwrite existing sku_sales.csv contents.
    """
    catalog = _read_products_catalog()
    if catalog.empty:
        return

    os.makedirs(DATA_DIR, exist_ok=True)

    existing = set()
    if os.path.exists(SKU_CSV_PATH):
        try:
            df_existing = pd.read_csv(SKU_CSV_PATH)
            if "sku" in df_existing.columns:
                existing = set(df_existing["sku"].dropna().astype(str).unique().tolist())
        except Exception:
            existing = set()

    # Create file with header if it doesn't exist
    if not os.path.exists(SKU_CSV_PATH):
        with open(SKU_CSV_PATH, "w", encoding="utf-8") as f:
            f.write("date,sku,sales\n")

    # Deterministic base seasonal curve (12 months)
    base_curve = [30, 32, 35, 40, 48, 56, 60, 58, 52, 44, 38, 34]
    start_year = 2023

    rows_to_append: List[str] = []
    for _, r in catalog.iterrows():
        try:
            pid = int(r["id"])
        except Exception:
            continue
        sku = str(r["sku"]) if "sku" in catalog.columns and pd.notna(r.get("sku")) else _product_id_to_sku(pid)
        if sku in existing:
            continue

        # Slight per-product variation based on pid (deterministic)
        bump = (pid % 7) - 3  # [-3..3]
        for i in range(24):
            year = start_year + (i // 12)
            month = (i % 12) + 1
            d = date(year, month, 1).isoformat()
            base = base_curve[i % 12] + bump
            factor = 1.0 if i < 12 else 1.08
            sales = int(round(max(1, base) * factor))
            rows_to_append.append(f"{d},{sku},{sales}\n")

        existing.add(sku)

    if rows_to_append:
        with open(SKU_CSV_PATH, "a", encoding="utf-8") as f:
            f.writelines(rows_to_append)


def _load_csv_if_exists(path: str) -> Optional[pd.DataFrame]:
    if os.path.exists(path):
        return pd.read_csv(path)
    return None


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
    """Load historical sales data for a SKU from primary CSV with local fallback."""
    # Primary source
    df_primary = _load_csv_if_exists(SKU_CSV_PATH)
    df_sample = _load_csv_if_exists(SAMPLE_CSV_PATH)

    sku_df: Optional[pd.DataFrame] = None

    if df_primary is not None:
        sku_df = df_primary[df_primary["sku"] == sku].copy()

    # Fallback to local sample dataset if missing or empty
    if sku_df is None or sku_df.empty:
        if df_sample is None:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for SKU: {sku} and no fallback dataset available",
            )
        print("[SKU Demand AnalysisNew] Using local sample dataset")
        sku_df = df_sample[df_sample["sku"] == sku].copy()

    if sku_df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for SKU: {sku}")

    # Convert date column to datetime and stabilise time series
    sku_df["date"] = pd.to_datetime(sku_df["date"])
    sku_df = sku_df.sort_values("date").reset_index(drop=True)

    # Reindex to daily frequency and forward-fill/interpolate missing days
    sku_df = (
        sku_df.set_index("date")
        .asfreq("D")
        .assign(sales=lambda x: x["sales"].interpolate(method="linear").ffill().bfill())
        .reset_index()
    )

    return sku_df


def calculate_seasonality(df: pd.DataFrame) -> List[float]:
    """Calculate weekly and monthly seasonality factors with safe fallbacks."""
    if df.empty or df["sales"].sum() <= 0:
        return [1.0] * 30

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_month"] = df["date"].dt.day
    df["week_of_year"] = df["date"].dt.isocalendar().week

    weekly_avg = df.groupby("day_of_week")["sales"].mean()
    overall_avg = df["sales"].mean()
    if overall_avg <= 0 or pd.isna(overall_avg):
        return [1.0] * 30

    weekly_seasonality = (weekly_avg / overall_avg).tolist()

    while len(weekly_seasonality) < 7:
        weekly_seasonality.append(1.0)

    seasonality_30 = [round(weekly_seasonality[i % 7], 2) for i in range(30)]
    return seasonality_30


def calculate_trend(df: pd.DataFrame, window: int = 7) -> List[float]:
    """Calculate rolling average trend with capped lookback and interpolation."""
    if df.empty:
        return [0.0] * 30

    df_sorted = df.sort_values("date").reset_index(drop=True)

    rolling_7 = df_sorted["sales"].rolling(
        window=min(window, len(df_sorted)), min_periods=1
    ).mean()
    rolling_30 = df_sorted["sales"].rolling(
        window=min(30, len(df_sorted)), min_periods=1
    ).mean()

    trend = rolling_7.round(2).tolist()

    if len(trend) < 30:
        last_value = trend[-1] if trend else float(df_sorted["sales"].mean() or 0.0)
        trend.extend([round(last_value, 2)] * (30 - len(trend)))

    return trend[:30]


def calculate_forecast(df: pd.DataFrame, days: int = 30) -> List[float]:
    """Generate forecast for next N days with stabilised outputs."""
    if df.empty or df["sales"].sum() <= 0:
        return [0.0] * days

    avg_daily = float(df["sales"].mean() or 0.0)

    seasonality = calculate_seasonality(df)

    if len(df) >= 7:
        recent_avg = df.tail(7)["sales"].mean()
        older_avg = df.head(max(1, len(df) - 7))["sales"].mean()
        trend_factor = float(recent_avg / older_avg) if older_avg > 0 else 1.0
    else:
        trend_factor = 1.0

    forecast: List[float] = []
    for i in range(days):
        seasonal_factor = seasonality[i % len(seasonality)]
        forecast_value = avg_daily * seasonal_factor * (trend_factor ** (i / max(days, 1)))
        forecast.append(round(max(0.0, forecast_value), 2))

    return forecast


def calculate_safety_stock(
    avg_daily_demand: float,
    lead_time: int,
    demand_std: float,
    service_level: float = 1.65,
) -> float:
    """Calculate safety stock using standard deviation method."""
    safety_stock = service_level * demand_std * np.sqrt(max(lead_time, 0))
    return max(0.0, float(round(safety_stock, 2)))


def classify_stock_status(current_stock: float, reorder_point: float) -> str:
    """Classify stock status."""
    if current_stock < reorder_point * 0.7:
        return "Understock"
    elif current_stock > reorder_point * 1.5:
        return "Overstock"
    else:
        return "Balanced"


@app.on_event("startup")
def _startup_sku_analysis_new() -> None:
    """Ensure local sample data exists for SKU Demand AnalysisNew on startup."""
    ensure_sample_data()
    ensure_product_skus_in_sales_csv()

@app.get("/")
def root():
    return {"message": "SKU Demand Analysis API", "version": "1.0.0"}

@app.get("/api/skus")
def get_available_skus():
    """Get list of available SKUs from CSV"""
    df_primary = _load_csv_if_exists(SKU_CSV_PATH)
    df_sample = _load_csv_if_exists(SAMPLE_CSV_PATH)

    if df_primary is not None and not df_primary.empty:
        skus = df_primary["sku"].unique().tolist()
        return {"skus": sorted(skus)}

    if df_sample is not None and not df_sample.empty:
        print("[SKU Demand AnalysisNew] Using local sample dataset")
        skus = df_sample["sku"].unique().tolist()
        return {"skus": sorted(skus)}

    return {"skus": []}


@app.get("/api/skus-detailed")
def get_available_skus_detailed():
    """
    SKU Demand AnalysisNew helper endpoint:
    Returns SKU IDs and (when available) product names derived from backend/data/products.csv.
    """
    df_primary = _load_csv_if_exists(SKU_CSV_PATH)
    df_sample = _load_csv_if_exists(SAMPLE_CSV_PATH)
    catalog = _read_products_catalog()

    sku_set = set()
    if df_primary is not None and not df_primary.empty and "sku" in df_primary.columns:
        sku_set |= set(df_primary["sku"].dropna().astype(str).unique().tolist())
    elif df_sample is not None and not df_sample.empty and "sku" in df_sample.columns:
        print("[SKU Demand AnalysisNew] Using local sample dataset")
        sku_set |= set(df_sample["sku"].dropna().astype(str).unique().tolist())

    sku_to_name = {}
    if not catalog.empty:
        for _, r in catalog.iterrows():
            try:
                pid = int(r["id"])
            except Exception:
                continue
            sku = str(r["sku"]) if "sku" in catalog.columns and pd.notna(r.get("sku")) else _product_id_to_sku(pid)
            sku_to_name[sku] = str(r["name"])
            sku_set.add(sku)

    items = []
    for sku in sorted(sku_set):
        name = sku_to_name.get(sku)
        items.append(
            {
                "sku": sku,
                "name": name,
            }
        )
    return {"skus": items}

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
