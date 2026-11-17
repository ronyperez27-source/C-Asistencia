from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth_router, turnos
from app.core.database import Base, engine
from app.models import turno  # Registra el modelo TurnoDB en SQLAlchemy

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Asistencia - Grifo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(turnos.router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "API de Control de Asistencia activa"}