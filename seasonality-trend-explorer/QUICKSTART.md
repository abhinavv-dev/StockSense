# Quick Start Guide

## Prerequisites Check

```bash
# Check Python version (need 3.8+)
python3 --version

# Check Node.js version (need 16+)
node --version
```

## Automated Installation (Recommended)

Run the installation script:

```bash
chmod +x install.sh
./install.sh
```

This will:
1. ✅ Check prerequisites
2. ✅ Create Python virtual environment
3. ✅ Install backend dependencies
4. ✅ Install frontend dependencies
5. ✅ Create and seed SQLite database

## Manual Installation

### Step 1: Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create database
python3 seed_db.py

# Verify database
python3 test_db.py
```

### Step 2: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

## Running the Application

### Terminal 1: Backend

```bash
cd backend
source .venv/bin/activate  # If using venv
uvicorn app:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Terminal 2: Frontend

```bash
cd frontend
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view the app in the browser.

  Local:            http://localhost:3000
```

## Verify It Works

### 1. Test Backend API

```bash
# Get available SKUs
curl http://localhost:8000/api/skus
```

**Expected response:**
```json
{"skus": ["A101", "B202", "C303"]}
```

### 2. Test Database

```bash
cd backend
source .venv/bin/activate
python3 test_db.py
```

**Expected output:**
```
======================================================================
Database Connection Test
======================================================================

[Test 1] Checking tables...
✓ Found tables: monthly_sales, sku_info

[Test 2] Checking monthly_sales table...
✓ Total records: 72
✓ Unique SKUs: 3

✅ All database tests passed!
```

### 3. Test Frontend

1. Open `http://localhost:3000` in your browser
2. You should see the "Seasonality & Trend Explorer" interface
3. Select a SKU and click "Analyze"

## First Analysis

1. **Select SKU**: Choose `A101` from dropdown
2. **Set Lookback Months**: `12`
3. **Set Current Stock**: `200`
4. **Set Lead Time Days**: `20`
5. **Set Service Level**: `95%`
6. **Click "Analyze"**

You should see:
- ✅ Three interactive charts (Trend, Seasonality, Depletion)
- ✅ Key metrics cards (Predicted Next Month, ROP, Safety Stock, etc.)
- ✅ Stock status badge (Understock/Balanced/Overstock)
- ✅ Recommendation text

## Database Location

The SQLite database is stored at:
```
seasonality-trend-explorer/data/inventory.db
```

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill process or use different port
uvicorn app:app --reload --port 8001
# Then update API_BASE_URL in frontend/src/App.js
```

**Database not found:**
```bash
cd backend
source .venv/bin/activate
python3 seed_db.py
```

**Module not found errors:**
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

### Frontend Issues

**Cannot connect to backend:**
- Verify backend is running: `curl http://localhost:8000/api/skus`
- Check browser console for CORS errors
- Update `API_BASE_URL` in `frontend/src/App.js` if backend uses different port

**Charts not displaying:**
- Check browser console for errors
- Verify analysis data is returned (check Network tab in DevTools)
- Ensure Chart.js dependencies installed: `npm list chart.js react-chartjs-2`

**npm install fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Database Issues

**Database corrupted or needs regeneration:**
```bash
cd backend
source .venv/bin/activate
rm ../data/inventory.db
python3 seed_db.py
python3 test_db.py
```

## Project Structure

```
seasonality-trend-explorer/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── analytics.py        # Analytics calculations
│   ├── data_loader.py      # SQLite data loading
│   ├── seed_db.py          # Database seeding script
│   ├── test_db.py          # Database test script
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   └── App.css         # Styles
│   └── package.json        # Node.js dependencies
├── data/
│   └── inventory.db        # SQLite database (created by seed_db.py)
├── README.md               # Full documentation
├── DATABASE_SETUP.md       # Database documentation
└── QUICKSTART.md           # This file
```

## Next Steps

1. ✅ Installation complete
2. ✅ Database created and seeded
3. ✅ Backend and frontend running
4. 🎯 Explore the application!
5. 📚 Read [README.md](README.md) for detailed documentation
6. 🗄️ Read [DATABASE_SETUP.md](DATABASE_SETUP.md) for database details

## Support

For detailed troubleshooting, see:
- [README.md](README.md) - Full documentation
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database setup guide
