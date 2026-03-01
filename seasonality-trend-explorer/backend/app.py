"""
FastAPI backend for Seasonality & Trend Explorer.
Provides endpoints for SKU analysis with seasonality, trends, and inventory metrics.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import logging

from data_loader import get_available_skus, get_sku_data
from analytics import analyze_sku

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Seasonality & Trend Explorer API",
    description="Backend API for analyzing SKU sales seasonality, trends, and inventory metrics",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class AnalyzeRequest(BaseModel):
    sku: str = Field(..., description="SKU identifier")
    lookback_months: int = Field(12, ge=1, le=24, description="Number of months to look back")
    current_stock: int = Field(..., ge=0, description="Current stock on hand")
    lead_time_days: int = Field(..., ge=1, le=90, description="Lead time in days")
    service_level: int = Field(95, description="Service level percentage", ge=90, le=99)
    use_advanced_seasonality: bool = Field(False, description="Use advanced seasonality method if available")


@app.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "message": "Seasonality & Trend Explorer API",
        "version": "1.0.0",
        "endpoints": {
            "GET /api/skus": "Get list of available SKUs",
            "POST /api/analyze": "Analyze SKU with seasonality and trends"
        }
    }


@app.get("/api/skus")
def get_skus():
    """Get list of available SKUs."""
    try:
        skus = get_available_skus()
        return {"skus": skus}
    except Exception as e:
        logger.error(f"Error fetching SKUs: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching SKUs: {str(e)}")


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest):
    """
    Analyze SKU with seasonality, trends, and inventory metrics.
    
    Returns comprehensive analysis including:
    - Historical sales data
    - Predicted next month sales
    - Seasonality indices
    - Rolling trend averages
    - Inventory metrics (ROP, safety stock, etc.)
    - Stock depletion projection
    """
    try:
        # Validate service level
        valid_service_levels = [90, 95, 99]
        if request.service_level not in valid_service_levels:
            raise HTTPException(
                status_code=400,
                detail=f"Service level must be one of {valid_service_levels}"
            )
        
        logger.info(
            f"Analyzing SKU: {request.sku}, "
            f"lookback: {request.lookback_months} months, "
            f"stock: {request.current_stock}, "
            f"lead_time: {request.lead_time_days} days"
        )
        
        # Load SKU data
        sku_data = get_sku_data(request.sku, request.lookback_months)
        
        # Perform analysis
        result = analyze_sku(
            sku=request.sku,
            lookback_months=request.lookback_months,
            current_stock=request.current_stock,
            lead_time_days=request.lead_time_days,
            service_level=request.service_level,
            use_advanced_seasonality=request.use_advanced_seasonality,
            sku_data=sku_data
        )
        
        return result
    
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        logger.error(f"Data file not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing SKU: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing SKU: {str(e)}")


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
