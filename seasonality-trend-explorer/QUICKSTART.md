# Quick Start Guide

## Prerequisites Check

```bash
# Check Python version (need 3.8+)
python --version

# Check Node.js version (need 16+)
node --version
```

## One-Time Setup

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### Terminal 1: Backend
```bash
cd backend
source .venv/bin/activate  # If using venv
uvicorn app:app --reload --port 8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm start
```

## Verify It Works

1. Backend should show: `Uvicorn running on http://0.0.0.0:8000`
2. Frontend should open at `http://localhost:3000`
3. Test backend API:
   ```bash
   curl http://localhost:8000/api/skus
   ```
   Should return: `{"skus": ["A101", "B202", "C303"]}`

## First Analysis

1. Select SKU: **A101**
2. Set Lookback Months: **12**
3. Set Current Stock: **200**
4. Set Lead Time Days: **20**
5. Set Service Level: **95%**
6. Click **"Analyze"**

You should see:
- Three interactive charts
- Key metrics cards
- Stock status and recommendations

## Troubleshooting

**Backend won't start:**
- Check if port 8000 is in use: `lsof -i :8000`
- Verify CSV exists: `ls ../data/sample_sales.csv`

**Frontend can't connect:**
- Verify backend is running
- Check browser console for CORS errors
- Update `API_BASE_URL` in `frontend/src/App.js` if needed

**Charts not showing:**
- Check browser console
- Verify analysis data is returned (check Network tab)

For detailed troubleshooting, see README.md
