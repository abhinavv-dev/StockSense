"""
Analytics module for computing seasonality, trends, and inventory metrics.
All calculations use pandas/numpy for fast, local computation.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta

# Try to import statsmodels for advanced seasonality (optional)
try:
    from statsmodels.tsa.seasonal import seasonal_decompose
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False


def calculate_seasonality_simple(df: pd.DataFrame) -> Dict[str, List[float]]:
    """
    Method 1: Simple monthly seasonal index calculation.
    Groups by month-of-year and computes multiplicative seasonal index.
    
    Returns:
        Dict with 'month_index' (1-12) and 'seasonal_index' (normalized multipliers)
    """
    df = df.copy()
    df['month'] = df['date'].dt.month
    
    # Group by month and compute average
    monthly_avg = df.groupby('month')['sales'].mean()
    overall_mean = df['sales'].mean()
    
    # Compute seasonal index (multiplicative)
    seasonal_index = (monthly_avg / overall_mean).tolist()
    month_index = list(range(1, 13))
    
    return {
        "month_index": month_index,
        "seasonal_index": [round(x, 3) for x in seasonal_index]
    }


def calculate_seasonality_advanced(df: pd.DataFrame) -> Optional[Dict[str, List[float]]]:
    """
    Method 2: Advanced seasonality using statsmodels seasonal_decompose.
    Falls back to simple method if statsmodels not available.
    """
    if not HAS_STATSMODELS:
        return None
    
    try:
        df = df.copy()
        df = df.set_index('date')
        df = df['sales'].resample('MS').mean()  # Monthly start frequency
        
        if len(df) < 24:  # Need at least 2 years for decomposition
            return None
        
        # Perform seasonal decomposition
        decomposition = seasonal_decompose(df, model='multiplicative', period=12)
        seasonal_component = decomposition.seasonal
        
        # Extract seasonal indices for each month
        month_indices = []
        seasonal_indices = []
        
        for month in range(1, 13):
            month_data = seasonal_component[seasonal_component.index.month == month]
            if len(month_data) > 0:
                avg_seasonal = month_data.mean()
                month_indices.append(month)
                seasonal_indices.append(round(avg_seasonal, 3))
        
        return {
            "month_index": month_indices,
            "seasonal_index": seasonal_indices
        }
    except Exception:
        return None


def calculate_trend(df: pd.DataFrame) -> List[Dict[str, any]]:
    """
    Calculate rolling averages (3-month and 6-month) for trend visualization.
    
    Returns:
        List of dicts with date, sales, rolling_3, rolling_6
    """
    df = df.copy()
    df = df.sort_values('date').reset_index(drop=True)
    
    # Calculate rolling averages
    df['rolling_3'] = df['sales'].rolling(window=3, min_periods=1).mean()
    df['rolling_6'] = df['sales'].rolling(window=6, min_periods=1).mean()
    
    # Convert to list of dicts
    trend_data = []
    for _, row in df.iterrows():
        trend_data.append({
            "date": row['date'].strftime('%Y-%m-%d'),
            "sales": round(row['sales'], 2),
            "rolling_3": round(row['rolling_3'], 2),
            "rolling_6": round(row['rolling_6'], 2)
        })
    
    return trend_data


def predict_next_month(df: pd.DataFrame, lookback_months: int, use_advanced: bool = False) -> float:
    """
    Predict next month's sales.
    
    Option 1 (default): Simple average of last N months
    Option 2 (if statsmodels available): Use seasonal decomposition
    
    Args:
        df: Historical sales data
        lookback_months: Number of months to use for prediction
        use_advanced: Whether to use advanced method if available
    
    Returns:
        Predicted sales for next month
    """
    df = df.copy()
    df = df.sort_values('date').reset_index(drop=True)
    
    # Use last N months
    recent_data = df.tail(lookback_months)
    
    if use_advanced and HAS_STATSMODELS:
        try:
            # Try advanced prediction using seasonal decomposition
            recent_data_indexed = recent_data.set_index('date')
            recent_data_indexed = recent_data_indexed['sales'].resample('MS').mean()
            
            if len(recent_data_indexed) >= 12:
                decomposition = seasonal_decompose(recent_data_indexed, model='multiplicative', period=12)
                
                # Get trend component (last value)
                trend_last = decomposition.trend.dropna().iloc[-1]
                
                # Get seasonal component for next month
                next_month = recent_data_indexed.index[-1] + pd.DateOffset(months=1)
                seasonal_for_next = decomposition.seasonal[
                    decomposition.seasonal.index.month == next_month.month
                ]
                
                if len(seasonal_for_next) > 0:
                    seasonal_factor = seasonal_for_next.iloc[-1]
                    predicted = trend_last * seasonal_factor
                    return round(float(predicted), 2)
        except Exception:
            pass  # Fall back to simple method
    
    # Simple method: average of last N months
    predicted = recent_data['sales'].mean()
    return round(float(predicted), 2)


def calculate_inventory_metrics(
    df: pd.DataFrame,
    current_stock: int,
    lead_time_days: int,
    service_level: int
) -> Dict[str, float]:
    """
    Calculate inventory metrics: lead time demand, safety stock, reorder point, etc.
    
    Args:
        df: Historical sales data
        current_stock: Current stock on hand
        lead_time_days: Lead time in days
        service_level: Service level percentage (90, 95, or 99)
    
    Returns:
        Dict with calculated metrics
    """
    # Service level Z-values
    z_values = {90: 1.28, 95: 1.65, 99: 2.33}
    z = z_values.get(service_level, 1.65)
    
    # Monthly statistics
    monthly_sales = df['sales'].values
    avg_monthly = float(np.mean(monthly_sales))
    std_monthly = float(np.std(monthly_sales, ddof=1))  # Sample std
    
    # Convert to daily
    daily_avg = avg_monthly / 30.0
    std_daily = std_monthly / np.sqrt(30.0)  # Approximate conversion
    
    # Lead time demand
    lead_time_demand = daily_avg * lead_time_days
    
    # Safety stock
    safety_stock = z * std_daily * np.sqrt(lead_time_days)
    
    # Reorder point
    reorder_point = lead_time_demand + safety_stock
    
    # Recommended order quantity
    predicted_next_month = predict_next_month(df, len(df))
    predicted_daily = predicted_next_month / 30.0
    
    if current_stock < reorder_point:
        # Need to reorder
        desired_target_stock = lead_time_demand + predicted_daily * 30 + safety_stock
        recommended_order_qty = max(0, desired_target_stock - current_stock)
    else:
        recommended_order_qty = 0.0
    
    # Stock status
    if current_stock < reorder_point:
        ratio = current_stock / reorder_point if reorder_point > 0 else 1.0
        if ratio < 0.5:
            stock_status = "Understock"
        else:
            stock_status = "Understock"  # Still understock but less severe
    elif current_stock > predicted_next_month * 1.5:
        stock_status = "Overstock"
    else:
        stock_status = "Balanced"
    
    return {
        "avg_monthly": round(avg_monthly, 2),
        "std_monthly": round(std_monthly, 2),
        "daily_avg": round(daily_avg, 2),
        "lead_time_demand": round(lead_time_demand, 2),
        "safety_stock": round(safety_stock, 2),
        "reorder_point": round(reorder_point, 2),
        "recommended_order_qty": round(recommended_order_qty, 2),
        "stock_status": stock_status,
        "predicted_next_month": round(predicted_next_month, 2)
    }


def calculate_depletion_projection(
    current_stock: float,
    daily_avg: float,
    horizon_days: int = 60
) -> List[Dict[str, float]]:
    """
    Simulate daily stock depletion.
    
    Args:
        current_stock: Starting stock
        daily_avg: Average daily demand
        horizon_days: Number of days to project
    
    Returns:
        List of dicts with day and stock level
    """
    projection = []
    stock = current_stock
    
    for day in range(horizon_days + 1):
        projection.append({
            "day": day,
            "stock": round(max(0, stock), 2)
        })
        stock -= daily_avg
        if stock <= 0:
            break
    
    return projection


def analyze_sku(
    sku: str,
    lookback_months: int,
    current_stock: int,
    lead_time_days: int,
    service_level: int,
    use_advanced_seasonality: bool = False,
    sku_data: Optional[pd.DataFrame] = None
) -> Dict:
    """
    Main analysis function that combines all calculations.
    
    Args:
        sku: SKU identifier
        lookback_months: Number of months to look back
        current_stock: Current stock on hand
        lead_time_days: Lead time in days
        service_level: Service level percentage
        use_advanced_seasonality: Whether to use advanced seasonality method
        sku_data: Optional pre-loaded DataFrame (to avoid circular import)
    
    Returns:
        Complete analysis dictionary ready for JSON response
    """
    if sku_data is None:
        from data_loader import get_sku_data
        df = get_sku_data(sku, lookback_months)
    else:
        df = sku_data.copy()
    
    # Ensure sorted by date
    df = df.sort_values('date').reset_index(drop=True)
    
    # Prepare history
    history = [
        {"date": row['date'].strftime('%Y-%m-%d'), "sales": int(row['sales'])}
        for _, row in df.iterrows()
    ]
    
    # Calculate seasonality
    seasonality_simple = calculate_seasonality_simple(df)
    seasonality_advanced = None
    
    if use_advanced_seasonality:
        seasonality_advanced = calculate_seasonality_advanced(df)
    
    seasonality = seasonality_advanced if seasonality_advanced else seasonality_simple
    
    # Calculate trend
    trend = calculate_trend(df)
    
    # Predict next month
    predicted_next_month = predict_next_month(df, lookback_months, use_advanced_seasonality)
    
    # Calculate inventory metrics
    inventory_metrics = calculate_inventory_metrics(
        df, current_stock, lead_time_days, service_level
    )
    
    # Calculate depletion projection
    depletion_projection = calculate_depletion_projection(
        current_stock,
        inventory_metrics["daily_avg"],
        horizon_days=60
    )
    
    # Combine results
    result = {
        "sku": sku,
        "history": history,
        "predicted_next_month": predicted_next_month,
        "seasonality": seasonality,
        "trend": trend,
        "depletion_projection": depletion_projection,
        **inventory_metrics
    }
    
    return result
