import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base

# Load environment variables
load_dotenv()

# Import models so SQLAlchemy registers all tables
from app.models.user import User
from app.models.appointment import Appointment
from app.models.health_report import HealthReport
from app.models.skincare_routine import SkincareRoutine
from app.models.chat import ChatConversation, ChatMessage
from app.models.skin_concern import SkinConcern

# Import API routes
from app.routes.predict import router as predict_router
from app.routes.acne_predict import router as acne_predict_router
from app.routes.auth import router as auth_router
from app.routes.skincare import router as skincare_router
from app.routes.appointments import router as appointments_router
from app.routes.reports import router as reports_router
from app.routes.profile import router as profile_router
from app.routes.chat import router as chat_router
from app.routes.skin_concerns import router as skin_concerns_router


app = FastAPI(
    title="DermaLytix API",
    description="AI-Powered Skin Health Platform",
    version="2.1.0"
)

# Frontend CORS configuration
default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
]

extra_origins = os.getenv("FRONTEND_ORIGINS", "")

allowed_origins = default_origins + [
    origin.strip()
    for origin in extra_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register database tables
Base.metadata.create_all(bind=engine)

# Register API routes
app.include_router(auth_router)
app.include_router(predict_router)
app.include_router(acne_predict_router)
app.include_router(skincare_router)
app.include_router(appointments_router)
app.include_router(reports_router)
app.include_router(profile_router)
app.include_router(skin_concerns_router)
app.include_router(chat_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to DermaLytix API",
        "status": "Running successfully",
        "version": "2.1.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": "DermaLytix",
        "api": "running"
    }