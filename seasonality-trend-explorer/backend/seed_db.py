"""
Database seeding script for Inventory Forecasting Dashboard.
Creates SQLite database with monthly_sales and sku_info tables.
Populates with realistic sample data showing seasonality patterns.
"""
import sqlite3
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
import os

# Database path
DB_DIR = Path(__file__).parent.parent / "data"
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / "inventory.db"

# Sample SKUs
SKUS = ["A101", "B202", "C303"]

# SKU descriptions and metadata
SKU_INFO = {
    "A101": {
        "description": "Premium Widget - High demand seasonal product",
        "unit_price": 29.99,
        "lead_time_days": 20
    },
    "B202": {
        "description": "Standard Component - Steady demand with moderate seasonality",
        "unit_price": 15.50,
        "lead_time_days": 14
    },
    "C303": {
        "description": "Enterprise Solution - Growing trend with peak in Q4",
        "unit_price": 199.99,
        "lead_time_days": 30
    }
}


def generate_sales_data():
    """
    Generate realistic sales data with seasonality patterns.
    Returns DataFrame with columns: sku, date, sales
    """
    data = []
    start_date = datetime(2023, 1, 1)
    
    for sku in SKUS:
        base_sales = {"A101": 120, "B202": 80, "C303": 200}[sku]
        
        for month_offset in range(24):  # 24 months = 2 years
            date = start_date + pd.DateOffset(months=month_offset)
            month_num = date.month
            
            # Apply seasonality patterns
            if sku == "A101":
                # Strong seasonality: peak in Dec (holiday season), high in summer
                if month_num == 12:
                    seasonal_factor = 1.5  # December peak
                elif month_num in [6, 7, 8]:
                    seasonal_factor = 1.3  # Summer high
                elif month_num in [1, 2]:
                    seasonal_factor = 0.8  # Post-holiday dip
                else:
                    seasonal_factor = 1.0
            
            elif sku == "B202":
                # Moderate seasonality: slight increase in Q4
                if month_num in [10, 11, 12]:
                    seasonal_factor = 1.2
                elif month_num in [1, 2]:
                    seasonal_factor = 0.9
                else:
                    seasonal_factor = 1.0
            
            else:  # C303
                # Growing trend with Q4 peak
                trend_factor = 1 + (month_offset * 0.01)  # 1% growth per month
                if month_num in [11, 12]:
                    seasonal_factor = 1.3 * trend_factor
                elif month_num in [1, 2]:
                    seasonal_factor = 0.9 * trend_factor
                else:
                    seasonal_factor = 1.0 * trend_factor
            
            # Add some random variation (±10%)
            import random
            variation = random.uniform(0.9, 1.1)
            sales = int(base_sales * seasonal_factor * variation)
            
            data.append({
                "sku": sku,
                "date": date.strftime("%Y-%m-%d"),
                "sales": sales
            })
    
    return pd.DataFrame(data)


def create_tables(conn):
    """Create database tables."""
    cursor = conn.cursor()
    
    # Create monthly_sales table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS monthly_sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT NOT NULL,
            date DATE NOT NULL,
            sales INTEGER NOT NULL,
            UNIQUE(sku, date)
        )
    """)
    
    # Create sku_info table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sku_info (
            sku TEXT PRIMARY KEY,
            description TEXT,
            unit_price REAL,
            lead_time_days INTEGER
        )
    """)
    
    # Create indexes for better query performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sku_date ON monthly_sales(sku, date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_date ON monthly_sales(date)")
    
    conn.commit()
    print("✓ Tables created successfully")


def seed_monthly_sales(conn, df):
    """Seed monthly_sales table with sales data."""
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM monthly_sales")
    
    # Insert data
    for _, row in df.iterrows():
        cursor.execute("""
            INSERT INTO monthly_sales (sku, date, sales)
            VALUES (?, ?, ?)
        """, (row['sku'], row['date'], row['sales']))
    
    conn.commit()
    
    # Verify
    cursor.execute("SELECT COUNT(*) FROM monthly_sales")
    count = cursor.fetchone()[0]
    print(f"✓ Seeded {count} records into monthly_sales table")
    
    # Show sample data
    cursor.execute("""
        SELECT sku, COUNT(*) as months, 
               MIN(date) as first_date, MAX(date) as last_date,
               AVG(sales) as avg_sales
        FROM monthly_sales
        GROUP BY sku
    """)
    
    print("\nSample data summary:")
    print("-" * 70)
    for row in cursor.fetchall():
        print(f"  SKU: {row[0]:<6} | Months: {row[1]:<3} | "
              f"Range: {row[2]} to {row[3]} | Avg Sales: {row[4]:.1f}")
    print("-" * 70)


def seed_sku_info(conn):
    """Seed sku_info table with product metadata."""
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM sku_info")
    
    # Insert data
    for sku, info in SKU_INFO.items():
        cursor.execute("""
            INSERT INTO sku_info (sku, description, unit_price, lead_time_days)
            VALUES (?, ?, ?, ?)
        """, (sku, info["description"], info["unit_price"], info["lead_time_days"]))
    
    conn.commit()
    
    # Verify
    cursor.execute("SELECT COUNT(*) FROM sku_info")
    count = cursor.fetchone()[0]
    print(f"✓ Seeded {count} records into sku_info table")
    
    # Show sample data
    cursor.execute("SELECT * FROM sku_info ORDER BY sku")
    print("\nSKU Information:")
    print("-" * 70)
    for row in cursor.fetchall():
        print(f"  SKU: {row[0]:<6} | Price: ${row[2]:<8.2f} | "
              f"Lead Time: {row[3]} days")
        print(f"  Description: {row[1]}")
    print("-" * 70)


def verify_database(conn):
    """Verify database integrity and test queries."""
    cursor = conn.cursor()
    
    print("\n" + "=" * 70)
    print("Database Verification")
    print("=" * 70)
    
    # Test query for A101
    cursor.execute("""
        SELECT date, sales 
        FROM monthly_sales 
        WHERE sku = 'A101' 
        ORDER BY date 
        LIMIT 5
    """)
    
    print("\nSample query result (A101 - first 5 months):")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]} units")
    
    # Test pandas compatibility
    print("\nTesting pandas compatibility...")
    df = pd.read_sql_query("""
        SELECT sku, date, sales 
        FROM monthly_sales 
        WHERE sku = 'A101'
        ORDER BY date
    """, conn)
    
    df['date'] = pd.to_datetime(df['date'])
    print(f"✓ Pandas can read and parse dates correctly")
    print(f"  Data shape: {df.shape}")
    print(f"  Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"  Total sales: {df['sales'].sum()} units")
    
    print("\n" + "=" * 70)


def main():
    """Main function to create and seed database."""
    print("=" * 70)
    print("Inventory Forecasting Database Seeder")
    print("=" * 70)
    print(f"\nDatabase path: {DB_PATH}")
    
    # Remove existing database if it exists
    if DB_PATH.exists():
        print("\n⚠ Existing database found. Removing...")
        DB_PATH.unlink()
    
    # Create database connection
    conn = sqlite3.connect(str(DB_PATH))
    print("\n✓ Database connection established")
    
    try:
        # Create tables
        print("\n[1/4] Creating tables...")
        create_tables(conn)
        
        # Generate sales data
        print("\n[2/4] Generating sales data...")
        sales_df = generate_sales_data()
        print(f"✓ Generated {len(sales_df)} records")
        
        # Seed monthly_sales
        print("\n[3/4] Seeding monthly_sales table...")
        seed_monthly_sales(conn, sales_df)
        
        # Seed sku_info
        print("\n[4/4] Seeding sku_info table...")
        seed_sku_info(conn)
        
        # Verify database
        verify_database(conn)
        
        print("\n" + "=" * 70)
        print("✅ Database seeding completed successfully!")
        print("=" * 70)
        print(f"\nDatabase location: {DB_PATH.absolute()}")
        print("\nYou can now use this database with your backend application.")
        print("\nExample query:")
        print("  import sqlite3")
        print("  conn = sqlite3.connect('data/inventory.db')")
        print("  cursor = conn.cursor()")
        print("  cursor.execute(\"SELECT * FROM monthly_sales WHERE sku='A101'\")")
        print("  data = cursor.fetchall()")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
