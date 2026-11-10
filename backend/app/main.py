from fastapi import FastAPI

app = FastAPI(title="Sistema de Asistencia - Grifo")

@app.get("/")
def read_root():
    return {"message": "API de Control de Asistencia activa"}