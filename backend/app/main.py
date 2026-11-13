from fastapi import FastAPI
from app.core.database import engine, Base
from app.models.empleado import EmpleadoModel
from app.api.empleados import router as empleados_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Asistencia - El Huamanguino")

app.include_router(empleados_router)


@app.get("/")
def inicio():
    return {"mensaje": "API conectada a SQL Server correctamente"}