"""
Test script to verify database connection and queries.
Run this after seeding the database to ensure everything works.
"""
import sqlite3
import sys
from pathlib import Path

DB_DIR = Path(__file__).parent.parent / "data"
DB_PATH = DB_DIR / "inventory.db"


def test_database():
    """Test database queries."""
    if not DB_PATH.exists():
        print(f"❌ Database not found at {DB_PATH}")
        print("Please run seed_db.py first to create the database.")
        return False
    
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        
        print("=" * 70)
        print("Database Connection Test")
        print("=" * 70)
        
        # Test 1: Check tables exist
        print("\n[Test 1] Checking tables...")
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            ORDER BY name
        """)
        tables = [row[0] for row in cursor.fetchall()]
        print(f"✓ Found tables: {', '.join(tables)}")
        
        # Test 2: Check monthly_sales data
        print("\n[Test 2] Checking monthly_sales table...")
        cursor.execute("SELECT COUNT(*) FROM monthly_sales")
        count = cursor.fetchone()[0]
        print(f"✓ Total records: {count}")
        
        cursor.execute("SELECT COUNT(DISTINCT sku) FROM monthly_sales")
        sku_count = cursor.fetchone()[0]
        print(f"✓ Unique SKUs: {sku_count}")
        
        # Test 3: Query specific SKU
        print("\n[Test 3] Querying A101 data...")
        cursor.execute("""
            SELECT date, sales 
            FROM monthly_sales 
            WHERE sku = 'A101' 
            ORDER BY date 
            LIMIT 5
        """)
        print("  First 5 months:")
        for row in cursor.fetchall():
            print(f"    {row[0]}: {row[1]} units")
        
        # Test 4: Check sku_info table
        print("\n[Test 4] Checking sku_info table...")
        cursor.execute("SELECT COUNT(*) FROM sku_info")
        info_count = cursor.fetchone()[0]
        print(f"✓ SKU info records: {info_count}")
        
        cursor.execute("SELECT sku, description, unit_price, lead_time_days FROM sku_info")
        print("  SKU Information:")
        for row in cursor.fetchall():
            print(f"    {row[0]}: ${row[2]:.2f}, {row[3]} days - {row[1]}")
        
        # Test 5: Test pandas compatibility (if available)
        print("\n[Test 5] Testing pandas compatibility...")
        try:
            import pandas as pd
            df = pd.read_sql_query("""
                SELECT sku, date, sales 
                FROM monthly_sales 
                WHERE sku = 'A101'
                ORDER BY date
            """, conn)
            
            df['date'] = pd.to_datetime(df['date'])
            print(f"✓ Pandas can read and parse dates")
            print(f"  Data shape: {df.shape}")
            print(f"  Date range: {df['date'].min()} to {df['date'].max()}")
            print(f"  Total sales: {df['sales'].sum()} units")
        except ImportError:
            print("⚠ Pandas not installed (optional for this test)")
        
        conn.close()
        
        print("\n" + "=" * 70)
        print("✅ All database tests passed!")
        print("=" * 70)
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)
