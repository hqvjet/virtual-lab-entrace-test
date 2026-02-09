from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import auth, users, documents, comments, admin_roles, admin_categories, admin_users, approvals, stats

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Document Management System with Social Features and Role-Based Access Control"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(comments.router, prefix=settings.API_V1_PREFIX)
app.include_router(approvals.router, prefix=settings.API_V1_PREFIX)
app.include_router(stats.router, prefix=settings.API_V1_PREFIX)

# Admin routers
app.include_router(admin_roles.router, prefix=f"{settings.API_V1_PREFIX}/admin")
app.include_router(admin_categories.router, prefix=f"{settings.API_V1_PREFIX}/admin")
app.include_router(admin_users.router, prefix=f"{settings.API_V1_PREFIX}/admin")


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("🚀 Starting DocHub API...")
    print("📊 Initializing database...")
    init_db()
    print("✅ Application started successfully!")


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to DocHub API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
