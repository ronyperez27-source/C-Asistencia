from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.models.empleado import EmpleadoModel
from app.api.empleados import router as empleados_router
from app.api import auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Asistencia - El Huamanguino")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(empleados_router)


@app.get("/")
def inicio():
    return {"mensaje": "API conectada a SQL Server correctamente"}