"""
FastAPI Backend Server for Population Forecasting.

Loads the trained DeepAR model and serves probabilistic forecasts.
The frontend communicates with this server to get real AI predictions
instead of mock data.

Endpoints:
    GET  /health          - Health check
    GET  /countries       - List of supported countries
    POST /predict         - Generate forecast for a country

Usage:
    cd challenge_6
    python -m ai_service.server.main
"""

import pickle
import logging
import numpy as np
import pandas as pd
import torch
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ai_service.ai.src.config import Config
from ai_service.ai.src.models.deepar import DeepARModel
from ai_service.ai.src.inference.predictor import DeepARPredictor
from ai_service.ai.src.utils.scaler import MeanScaler
from ai_service.ai.src.data.preprocessor import DataPreprocessor

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s │ %(levelname)-7s │ %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)

# ── Global state ────────────────────────────────────────────────
predictor: Optional[DeepARPredictor] = None
historical_data: dict = {}
country_list: list = []
config: Optional[Config] = None

CHECKPOINT_DIR = Path('ai_service/ai/checkpoints')


# ── Request/Response schemas ────────────────────────────────────
class PredictRequest(BaseModel):
    country: str = Field(..., description="Country name (must match training data)")
    target_year: int = Field(..., ge=2024, le=2100, description="Predict up to this year")
    num_samples: int = Field(200, ge=10, le=1000, description="Monte Carlo samples")


class ForecastPoint(BaseModel):
    year: int
    mean: float
    median: float
    lower: float
    upper: float
    std: float


class PredictResponse(BaseModel):
    country: str
    target_year: int
    forecasts: list[ForecastPoint]


# ── Lifespan: load model on startup ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global predictor, historical_data, country_list, config

    config = Config.from_yaml('ai_service/config.yaml')
    device = 'cuda' if torch.cuda.is_available() else 'cpu'

    logger.info(f"Loading model on {device.upper()}...")

    # Load artifacts
    artifacts_path = CHECKPOINT_DIR / 'artifacts.pkl'
    if not artifacts_path.exists():
        logger.error(f"Artifacts not found: {artifacts_path}")
        logger.error("Run 'python -m ai_service.ai.src.pipeline' first to train the model.")
        yield
        return

    with open(artifacts_path, 'rb') as f:
        artifacts = pickle.load(f)

    # Rebuild scaler
    scaler = MeanScaler()
    scaler.load_state_dict(artifacts['scaler_state'])

    # Load model
    model = DeepARModel(
        num_countries=artifacts['num_countries'],
        embedding_dim=config.model.embedding_dim,
        hidden_size=config.model.hidden_size,
        num_layers=config.model.num_layers,
        dropout=0.0,  # No dropout during inference
    )

    checkpoint_path = CHECKPOINT_DIR / 'deepar_best.pt'
    if not checkpoint_path.exists():
        logger.error(f"Model checkpoint not found: {checkpoint_path}")
        yield
        return

    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
    model.load_state_dict(checkpoint['model_state_dict'])

    predictor = DeepARPredictor(
        model=model,
        scaler=scaler,
        country_to_idx=artifacts['country_to_idx'],
        device=device,
        num_samples=config.inference.num_samples,
    )

    # Load historical data for conditioning
    preprocessor = DataPreprocessor(config.data.csv_path, config.data.non_countries)
    df = preprocessor.load_and_clean()

    for name, group in df.groupby('country'):
        sorted_g = group.sort_values('year')
        historical_data[name] = {
            'populations': sorted_g['population'].values.astype(np.float64),
            'years': sorted_g['year'].values.astype(np.float64),
        }

    country_list = sorted(historical_data.keys())

    logger.info(f"Model loaded! {len(country_list)} countries ready for inference.")

    yield  # Server running

    logger.info("Shutting down...")


# ── App ─────────────────────────────────────────────────────────
app = FastAPI(
    title="DeepAR Population Forecast API",
    description="Probabilistic population forecasting powered by DeepAR (LSTM + Gaussian)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": predictor is not None,
        "countries_available": len(country_list),
    }


@app.get("/countries")
async def get_countries():
    return {"countries": country_list}


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    if predictor is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Train the model first with: python -m ai_service.ai.src.pipeline",
        )

    if req.country not in historical_data:
        raise HTTPException(
            status_code=404,
            detail=f"Country '{req.country}' not found. Use GET /countries for available options.",
        )

    country_hist = historical_data[req.country]

    # Use last 10 years (window_size) for buffer conditioning
    window = config.data.window_size if config else 10
    populations = country_hist['populations'][-window:]
    years = country_hist['years'][-window:]

    try:
        result = predictor.predict(
            country=req.country,
            historical_populations=populations,
            historical_years=years,
            target_year=req.target_year,
            num_samples=req.num_samples,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    return PredictResponse(
        country=req.country,
        target_year=req.target_year,
        forecasts=[ForecastPoint(**f) for f in result['forecasts']],
    )


if __name__ == '__main__':
    import uvicorn
    server_config = Config.from_yaml('ai_service/config.yaml').server
    uvicorn.run(
        "ai_service.server.main:app",
        host=server_config.host,
        port=server_config.port,
        reload=False,
        log_level="info",
    )
