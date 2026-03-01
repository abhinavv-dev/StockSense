"""
Data loader module for loading CSV or SQLite data.
Supports both CSV file reading and SQLite database queries.
"""
import pandas as pd
import os
from pathlib import Path
from typing import List, Optional

# Path to data directory
DATA_DIR = Path(__file__).parent.parent / "data"
CSV_PATH = DATA_DIR / "sample_sales.csv"


def load_csv_data() -> pd.DataFrame:
    """Load sales data from CSV file."""
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV file not found at {CSV_PATH}")
    
    df = pd.read_csv(CSV_PATH)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['sku', 'date']).reset_index(drop=True)
    return df


def get_available_skus() -> List[str]:
    """Get list of available SKUs from data."""
    df = load_csv_data()
    return sorted(df['sku'].unique().tolist())


def get_sku_data(sku: str, lookback_months: Optional[int] = None) -> pd.DataFrame:
    """
    Get sales data for a specific SKU.
    
    Args:
        sku: SKU identifier
        lookback_months: Optional limit on number of months to return
    
    Returns:
        DataFrame with columns: sku, date, sales
    """
    df = load_csv_data()
    sku_df = df[df['sku'] == sku].copy()
    
    if sku_df.empty:
        raise ValueError(f"No data found for SKU: {sku}")
    
    # Apply lookback limit if specified
    if lookback_months:
        sku_df = sku_df.tail(lookback_months).copy()
    
    return sku_df.sort_values('date').reset_index(drop=True)


def seed_sqlite_db(db_path: str = "sales.db"):
    """
    Optional: Seed SQLite database from CSV.
    Creates table: monthly_sales(sku TEXT, date DATE, sales INTEGER)
    """
    import sqlite3
    
    df = load_csv_data()
    
    conn = sqlite3.connect(db_path)
    df.to_sql('monthly_sales', conn, if_exists='replace', index=False)
    conn.close()
    
    print(f"SQLite database seeded at {db_path}")


if __name__ == "__main__":
    # Test data loading
    print("Available SKUs:", get_available_skus())
    print("\nSample data for A101:")
    print(get_sku_data("A101", lookback_months=6))
