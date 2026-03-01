"""
Optional script to seed SQLite database from CSV.
Run this to create a SQLite database with monthly_sales table.
"""
import sqlite3
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
CSV_PATH = DATA_DIR / "sample_sales.csv"
DB_PATH = Path(__file__).parent / "sales.db"


def seed_database():
    """Load CSV and seed SQLite database."""
    if not CSV_PATH.exists():
        print(f"Error: CSV file not found at {CSV_PATH}")
        return
    
    print(f"Loading data from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    df['date'] = pd.to_datetime(df['date'])
    
    print(f"Found {len(df)} records for {df['sku'].nunique()} SKUs")
    
    # Connect to SQLite
    conn = sqlite3.connect(DB_PATH)
    
    # Create table
    df.to_sql('monthly_sales', conn, if_exists='replace', index=False)
    
    # Verify
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM monthly_sales")
    count = cursor.fetchone()[0]
    
    cursor.execute("SELECT DISTINCT sku FROM monthly_sales")
    skus = [row[0] for row in cursor.fetchall()]
    
    conn.close()
    
    print(f"✓ Database seeded successfully!")
    print(f"  - Database path: {DB_PATH}")
    print(f"  - Records: {count}")
    print(f"  - SKUs: {skus}")


if __name__ == "__main__":
    seed_database()
