from datetime import datetime, time
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.empleado import EmpleadoModel
from app.models.asistencia import AsistenciaModel

def registrar_marca(db: Session, codigo_qr: str, timestamp_servidor: datetime) -> dict:
    # 1. Validar que el código no sea nulo, vacío o ilegible
    if not codigo_qr or not codigo_qr.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código ilegible o vacío. No se generó registro."
        )

    codigo_limpio = codigo_qr.strip()

    # 2. Buscar empleado por codigo_qr o dni, verificando que esté activo
    empleado = (
        db.query(EmpleadoModel)
        .filter(
            (EmpleadoModel.codigo_qr == codigo_limpio) | (EmpleadoModel.dni == codigo_limpio),
            EmpleadoModel.activo == True
        )
        .first()
    )

    if not empleado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código no registrado o trabajador inactivo. No se generó registro."
        )

    # 3. Verificar última marcación del empleado en el día actual
    inicio_dia = timestamp_servidor.replace(hour=0, minute=0, second=0, microsecond=0)
    ultima_marca = (
        db.query(AsistenciaModel)
        .filter(
            AsistenciaModel.empleado_id == empleado.id,
            AsistenciaModel.fecha_hora >= inicio_dia
        )
        .order_by(AsistenciaModel.fecha_hora.desc())
        .first()
    )

    tipo_evento = "SALIDA" if (ultima_marca and ultima_marca.tipo_evento == "ENTRADA") else "ENTRADA"

    # 4. Evaluar puntualidad (ejemplo: turno 06:00 AM -> 05:58 AM es "A tiempo")
    minutos_tardanza = 0
    if tipo_evento == "ENTRADA":
        hora_limite = time(6, 0)
        # Normalizamos segundos para comparar contra el minuto exacto del límite
        hora_marcaje = timestamp_servidor.time().replace(second=0, microsecond=0)

        if hora_marcaje <= hora_limite:
            estado = "A tiempo"
        else:
            estado = "Tardanza"
            limite_dt = datetime.combine(timestamp_servidor.date(), hora_limite)
            minutos_tardanza = max(
                0, int((timestamp_servidor - limite_dt).total_seconds() // 60)
            )

        mensaje = f"Entrada Registrada - {estado}"
    else:
        estado = "Completado"
        mensaje = "Salida Registrada"

    # 5. Guardar registro en SQL Server
    nueva_asistencia = AsistenciaModel(
        empleado_id=empleado.id,
        fecha_hora=timestamp_servidor,
        tipo_evento=tipo_evento,
        estado=estado
    )
    db.add(nueva_asistencia)
    db.commit()
    db.refresh(nueva_asistencia)

    return {
        "mensaje": mensaje,
        "empleado_nombres": empleado.nombres,
        "cargo": empleado.cargo,
        "tipo_evento": tipo_evento,
        "fecha_hora": nueva_asistencia.fecha_hora,
        "minutos_tardanza": minutos_tardanza
    }