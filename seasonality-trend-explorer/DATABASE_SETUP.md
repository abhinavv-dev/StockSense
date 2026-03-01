# Database Setup Guide

This guide explains how to set up and use the SQLite database for the Inventory Forecasting Dashboard.

## Database Structure

### Table: `monthly_sales`
Stores historical monthly sales data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing unique ID |
| `sku` | TEXT | SKU identifier (e.g., "A101") |
| `date` | DATE | First day of month (YYYY-MM-DD) |
| `sales` | INTEGER | Units sold in that month |

**Indexes:**
- `idx_sku_date` on (sku, date) for fast lookups
- `idx_date` on (date) for date-based queries

### Table: `sku_info`
Stores product metadata (optional, for future extensions).

| Column | Type | Description |
|--------|------|-------------|
| `sku` | TEXT PRIMARY KEY | SKU identifier |
| `description` | TEXT | Product description |
| `unit_price` | REAL | Unit price in USD |
| `lead_time_days` | INTEGER | Default lead time for restocking |

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Create and Seed Database

```bash
python3 seed_db.py
```

This will:
1. Create `data/inventory.db` SQLite database
2. Create `monthly_sales` and `sku_info` tables
3. Seed with 24 months of data for 3 SKUs (A101, B202, C303)
4. Populate `sku_info` with product metadata
5. Create indexes for performance

**Expected Output:**
```
======================================================================
Inventory Forecasting Database Seeder
======================================================================

Database path: /path/to/data/inventory.db

✓ Database connection established

[1/4] Creating tables...
✓ Tables created successfully

[2/4] Generating sales data...
✓ Generated 72 records

[3/4] Seeding monthly_sales table...
✓ Seeded 72 records into monthly_sales table

[4/4] Seeding sku_info table...
✓ Seeded 3 records into sku_info table

✅ Database seeding completed successfully!
```

### Step 3: Verify Database

```bash
python3 test_db.py
```

This will test:
- Database connection
- Table existence
- Data integrity
- Query functionality
- Pandas compatibility

## Using the Database in Backend

### Basic SQLite Connection

```python
import sqlite3

conn = sqlite3.connect("data/inventory.db")
cursor = conn.cursor()

# Query all sales for a SKU
cursor.execute("SELECT * FROM monthly_sales WHERE sku='A101'")
data = cursor.fetchall()

# Query with date range
cursor.execute("""
    SELECT date, sales 
    FROM monthly_sales 
    WHERE sku = 'A101' AND date >= '2023-06-01'
    ORDER BY date
""")
results = cursor.fetchall()

conn.close()
```

### Using data_loader.py (Recommended)

```python
from data_loader import get_sku_data, get_available_skus, get_sku_info

# Get list of available SKUs
skus = get_available_skus()
print(skus)  # ['A101', 'B202', 'C303']

# Get sales data for a SKU (returns pandas DataFrame)
df = get_sku_data("A101", lookback_months=12)
print(df.head())

# Get SKU information
info = get_sku_info("A101")
print(info)
# {
#     'sku': 'A101',
#     'description': 'Premium Widget - High demand seasonal product',
#     'unit_price': 29.99,
#     'lead_time_days': 20
# }
```

### Using Pandas Directly

```python
import pandas as pd
import sqlite3

conn = sqlite3.connect("data/inventory.db")

# Read into DataFrame
df = pd.read_sql_query("""
    SELECT sku, date, sales 
    FROM monthly_sales 
    WHERE sku = 'A101'
    ORDER BY date
""", conn)

# Parse dates
df['date'] = pd.to_datetime(df['date'])

# Now you can use pandas operations
print(df.groupby(df['date'].dt.month)['sales'].mean())

conn.close()
```

## Sample Data

The database is seeded with realistic data showing:

### SKU A101 - Premium Widget
- **Base Sales**: ~120 units/month
- **Seasonality**: Strong peak in December (1.5x), high in summer (1.3x), dip in Jan-Feb (0.8x)
- **Pattern**: Holiday seasonality

### SKU B202 - Standard Component
- **Base Sales**: ~80 units/month
- **Seasonality**: Moderate increase in Q4 (1.2x), slight dip in Jan-Feb (0.9x)
- **Pattern**: Steady with moderate seasonality

### SKU C303 - Enterprise Solution
- **Base Sales**: ~200 units/month
- **Trend**: Growing trend (+1% per month)
- **Seasonality**: Q4 peak (1.3x), Jan-Feb dip (0.9x)
- **Pattern**: Growth trend with seasonality

## Database Location

The database file is stored at:
```
seasonality-trend-explorer/data/inventory.db
```

## Regenerating the Database

To regenerate the database with fresh data:

```bash
# Remove existing database
rm data/inventory.db

# Run seed script again
python3 seed_db.py
```

## Integration with Backend API

The backend (`app.py`) automatically uses the database through `data_loader.py`. No changes needed to API endpoints - they will automatically query SQLite instead of CSV.

**Example API Request:**
```bash
curl http://localhost:8000/api/skus
# Returns: {"skus": ["A101", "B202", "C303"]}

curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "A101",
    "lookback_months": 12,
    "current_stock": 200,
    "lead_time_days": 20,
    "service_level": 95
  }'
```

## Troubleshooting

### Database not found
```
FileNotFoundError: Database not found at data/inventory.db
```
**Solution**: Run `python3 seed_db.py` to create the database.

### Tables don't exist
**Solution**: The seed script creates tables automatically. If missing, run seed script again.

### Date parsing issues
**Solution**: The `data_loader.py` automatically converts dates to pandas datetime. If issues persist, ensure dates are in YYYY-MM-DD format.

### Performance issues
**Solution**: Indexes are created automatically. For large datasets, consider:
- Adding more indexes
- Using connection pooling
- Implementing query caching

## Next Steps

1. ✅ Database created and seeded
2. ✅ Backend configured to use SQLite
3. ✅ Frontend can query through API
4. 🚀 Start backend: `uvicorn app:app --reload --port 8000`
5. 🚀 Start frontend: `npm start`
6. 🎯 Test the application!
