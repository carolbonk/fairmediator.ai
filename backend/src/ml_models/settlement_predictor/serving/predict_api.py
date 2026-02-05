"""
Settlement Prediction API

FastAPI endpoints for serving settlement predictions.
Integrates with trained Random Forest model.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import logging
from datetime import datetime
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from training.train_model import SettlementPredictor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="FCA Settlement Predictor API",
    description="Predict False Claims Act settlement ranges using ML",
    version="1.0.0"
)

# Global predictor instance (loaded on startup)
predictor: Optional[SettlementPredictor] = None


class PredictionRequest(BaseModel):
    """Request schema for settlement prediction"""
    fraud_type: str = Field(
        ...,
        description="Type of fraud (healthcare, defense, covid, procurement, grant, housing, education, other)"
    )
    damages_claimed: float = Field(
        ...,
        gt=0,
        description="Claimed damages amount in USD"
    )
    industry: str = Field(
        ...,
        description="Defendant industry (healthcare, defense_contractor, pharmaceutical, technology, construction, education, financial, other)"
    )
    jurisdiction: str = Field(
        ...,
        description="Court jurisdiction (e.g., 'Southern District of New York')"
    )
    whistleblower_present: bool = Field(
        default=False,
        description="Whether a whistleblower is involved in the case"
    )
    settlement_year: int = Field(
        default=2024,
        ge=2010,
        le=2030,
        description="Expected settlement year"
    )

    class Config:
        schema_extra = {
            "example": {
                "fraud_type": "healthcare",
                "damages_claimed": 10000000,
                "industry": "pharmaceutical",
                "jurisdiction": "Southern District of New York",
                "whistleblower_present": True,
                "settlement_year": 2024
            }
        }


class PredictionResponse(BaseModel):
    """Response schema for settlement prediction"""
    predicted_low: float = Field(description="25th percentile prediction")
    predicted_mid: float = Field(description="50th percentile (median) prediction")
    predicted_high: float = Field(description="75th percentile prediction")
    confidence: float = Field(description="Prediction confidence (0-1)")
    input_damages: float = Field(description="Input damages claimed")
    similar_cases: Optional[List[dict]] = Field(default=None, description="Similar historical cases")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    timestamp: str


@app.on_event("startup")
async def load_model():
    """Load trained model on startup"""
    global predictor

    logger.info("Loading settlement prediction model...")

    try:
        # Initialize predictor
        predictor = SettlementPredictor()

        # Load latest model (you would specify actual paths)
        # For now, this is a placeholder - actual implementation would load from saved model
        model_path = os.path.join(
            os.path.dirname(__file__),
            '../models/settlement_model_latest.joblib'
        )
        scaler_path = os.path.join(
            os.path.dirname(__file__),
            '../models/feature_scaler_latest.joblib'
        )

        if os.path.exists(model_path) and os.path.exists(scaler_path):
            predictor.load_model(model_path, scaler_path)
            logger.info("✅ Model loaded successfully")
        else:
            logger.warning("⚠️ No saved model found. Model will need to be trained first.")
            logger.warning(f"Expected paths:\n  Model: {model_path}\n  Scaler: {scaler_path}")

    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        predictor = None


@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if predictor and predictor.model else "model_not_loaded",
        "model_loaded": predictor is not None and hasattr(predictor, 'model'),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_settlement(request: PredictionRequest):
    """
    Predict settlement range for an FCA case

    Returns 25th, 50th, and 75th percentile predictions with confidence score.
    """
    if not predictor or not hasattr(predictor, 'model'):
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please train the model first."
        )

    try:
        # Validate fraud type
        valid_fraud_types = ['healthcare', 'defense', 'covid', 'procurement', 'grant', 'housing', 'education', 'other']
        if request.fraud_type.lower() not in valid_fraud_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid fraud_type. Must be one of: {', '.join(valid_fraud_types)}"
            )

        # Validate industry
        valid_industries = ['healthcare', 'defense_contractor', 'pharmaceutical', 'technology', 'construction', 'education', 'financial', 'other']
        if request.industry.lower() not in valid_industries:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid industry. Must be one of: {', '.join(valid_industries)}"
            )

        # Make prediction
        prediction = predictor.predict_settlement_range(
            fraud_type=request.fraud_type,
            damages_claimed=request.damages_claimed,
            industry=request.industry,
            jurisdiction=request.jurisdiction,
            whistleblower_present=request.whistleblower_present,
            settlement_year=request.settlement_year
        )

        logger.info(f"Prediction made: {request.fraud_type} fraud, ${request.damages_claimed:,.0f} → ${prediction['predicted_mid']:,.0f}")

        return prediction

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@app.get("/model/info")
async def get_model_info():
    """Get model information and statistics"""
    if not predictor or not hasattr(predictor, 'model'):
        raise HTTPException(
            status_code=503,
            detail="Model not loaded"
        )

    try:
        # Get feature importance
        feature_importance = predictor.get_feature_importance()

        return {
            "model_type": "RandomForestRegressor",
            "n_estimators": predictor.model.n_estimators,
            "max_depth": predictor.model.max_depth,
            "training_stats": predictor.training_stats,
            "top_features": feature_importance.head(10).to_dict('records'),
            "feature_count": len(predictor.feature_engine.feature_columns)
        }

    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve model info: {str(e)}"
        )


@app.post("/batch-predict")
async def batch_predict(requests: List[PredictionRequest]):
    """
    Batch prediction endpoint for multiple cases

    Useful for analyzing multiple settlement scenarios at once.
    """
    if not predictor or not hasattr(predictor, 'model'):
        raise HTTPException(
            status_code=503,
            detail="Model not loaded"
        )

    if len(requests) > 100:
        raise HTTPException(
            status_code=400,
            detail="Batch size limited to 100 predictions"
        )

    results = []

    for req in requests:
        try:
            prediction = predictor.predict_settlement_range(
                fraud_type=req.fraud_type,
                damages_claimed=req.damages_claimed,
                industry=req.industry,
                jurisdiction=req.jurisdiction,
                whistleblower_present=req.whistleblower_present,
                settlement_year=req.settlement_year
            )

            results.append({
                "input": req.dict(),
                "prediction": prediction,
                "status": "success"
            })

        except Exception as e:
            results.append({
                "input": req.dict(),
                "error": str(e),
                "status": "failed"
            })

    return {
        "total": len(requests),
        "successful": sum(1 for r in results if r["status"] == "success"),
        "failed": sum(1 for r in results if r["status"] == "failed"),
        "results": results
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "predict_api:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
