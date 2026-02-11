from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from api.routes import router, set_data_processor
from services.data_processor import CovidDataProcessor

# Initialize FastAPI app
app = FastAPI(
    title="COVID-19 Vietnam Data API",
    description="API for COVID-19 survey data visualization in Vietnam using Polars for high-performance data processing",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize data processor
DATA_PATH = Path(__file__).parent.parent / "data" / "vietnam.csv"
print(f"Loading data from: {DATA_PATH}")

try:
    processor = CovidDataProcessor(str(DATA_PATH))
    set_data_processor(processor)
    print("✅ Data loaded successfully with Polars!")
except Exception as e:
    print(f"❌ Error loading data: {e}")
    raise

# Include routers
app.include_router(router)

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "COVID-19 Vietnam Data API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "/api/overview",
            "/api/timeline",
            "/api/regions",
            "/api/demographics",
            "/api/health-mental",
            "/api/vaccination",
            "/api/filters"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
