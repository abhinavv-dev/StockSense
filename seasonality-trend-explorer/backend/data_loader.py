"""
Data loader module for loading data from SQLite database.
Supports querying monthly_sales and sku_info tables.
Compatible with pandas for date parsing and data manipulation.
"""
import pandas as pd
import sqlite3
from pathlib import Path
from typing import List, Optional, Dict
import os

# Database path
DB_DIR = Path(__file__).parent.parent / "data"
DB_PATH = DB_DIR / "inventory.db"


def get_db_connection():
    """Get SQLite database connection."""
    if not DB_PATH.exists():
        raise FileNotFoundError(
            f"Database not found at {DB_PATH}. "
            f"Please run seed_db.py to create the database."
        )
    return sqlite3.connect(str(DB_PATH))


def get_available_skus() -> List[str]:
    """Get list of available SKUs from database."""
    conn = get_db_connection()
    try:
        df = pd.read_sql_query("SELECT DISTINCT sku FROM monthly_sales ORDER BY sku", conn)
        return df['sku'].tolist()
    finally:
        conn.close()


def get_sku_data(sku: str, lookback_months: Optional[int] = None) -> pd.DataFrame:
    """
    Get sales data for a specific SKU from database.
    
    Args:
        sku: SKU identifier
        lookback_months: Optional limit on number of months to return
    
    Returns:
        DataFrame with columns: sku, date, sales
        Date column is parsed as datetime
    """
    conn = get_db_connection()
    try:
        if lookback_months:
            # Get last N months
            query = """
                SELECT sku, date, sales 
                FROM monthly_sales 
                WHERE sku = ?
                ORDER BY date DESC
                LIMIT ?
            """
            df = pd.read_sql_query(query, conn, params=(sku, lookback_months))
            # Reverse to get chronological order
            df = df.iloc[::-1].reset_index(drop=True)
        else:
            # Get all data
            query = """
                SELECT sku, date, sales 
                FROM monthly_sales 
                WHERE sku = ?
                ORDER BY date ASC
            """
            df = pd.read_sql_query(query, conn, params=(sku,))
        
        if df.empty:
            raise ValueError(f"No data found for SKU: {sku}")
        
        # Parse date column to datetime
        df['date'] = pd.to_datetime(df['date'])
        
        return df
    
    finally:
        conn.close()


def get_sku_info(sku: str) -> Optional[Dict]:
    """
    Get SKU information from sku_info table.
    
    Args:
        sku: SKU identifier
    
    Returns:
        Dict with sku, description, unit_price, lead_time_days
        Returns None if SKU not found
    """
    conn = get_db_connection()
    try:
        query = "SELECT * FROM sku_info WHERE sku = ?"
        df = pd.read_sql_query(query, conn, params=(sku,))
        
        if df.empty:
            return None
        
        row = df.iloc[0]
        return {
            "sku": row['sku'],
            "description": row['description'],
            "unit_price": float(row['unit_price']),
            "lead_time_days": int(row['lead_time_days'])
        }
    
    finally:
        conn.close()


def get_all_sku_info() -> pd.DataFrame:
    """Get all SKU information."""
    conn = get_db_connection()
    try:
        query = "SELECT * FROM sku_info ORDER BY sku"
        return pd.read_sql_query(query, conn)
    finally:
        conn.close()


def get_sales_summary() -> pd.DataFrame:
    """
    Get summary statistics for all SKUs.
    
    Returns:
        DataFrame with columns: sku, total_months, total_sales, avg_sales, 
        min_sales, max_sales, first_date, last_date
    """
    conn = get_db_connection()
    try:
        query = """
            SELECT 
                sku,
                COUNT(*) as total_months,
                SUM(sales) as total_sales,
                AVG(sales) as avg_sales,
                MIN(sales) as min_sales,
                MAX(sales) as max_sales,
                MIN(date) as first_date,
                MAX(date) as last_date
            FROM monthly_sales
            GROUP BY sku
            ORDER BY sku
        """
        return pd.read_sql_query(query, conn)
    finally:
        conn.close()


# Backward compatibility: support CSV loading if database doesn't exist
def load_csv_data() -> pd.DataFrame:
    """Load sales data from CSV file (fallback if database not available)."""
    CSV_PATH = DB_DIR / "sample_sales.csv"
    
    if not CSV_PATH.exists():
        raise FileNotFoundError(
            f"Neither database ({DB_PATH}) nor CSV ({CSV_PATH}) found. "
            f"Please run seed_db.py to create the database."
        )
    
    df = pd.read_csv(CSV_PATH)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['sku', 'date']).reset_index(drop=True)
    return df


if __name__ == "__main__":
    # Test data loading
    print("Testing database connection...")
    try:
        print(f"\nAvailable SKUs: {get_available_skus()}")
        
        print("\nSample data for A101 (last 6 months):")
        df = get_sku_data("A101", lookback_months=6)
        print(df)
        
        print("\nSKU Info for A101:")
        info = get_sku_info("A101")
        print(info)
        
        print("\nSales Summary:")
        summary = get_sales_summary()
        print(summary)
        
    except FileNotFoundError as e:
        print(f"\n❌ {e}")
        print("\nPlease run seed_db.py first to create the database.")
