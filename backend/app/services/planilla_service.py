from datetime import datetime, date, time, timedelta
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy import extract
from sqlalchemy.orm import Session
from app.models.empleado import EmpleadoModel
from app.models.asistencia import AsistenciaModel
from app.models.turno import Turno


class PlanillaService:
    @staticmethod
    def calcular_descuento_tardanza(tarifa_hora: float | Decimal, minutos_tardanza: int) -> dict:
        """
        Calcula el descuento exacto por tardanza:
        - tarifa_minuto = tarifa_hora / 60
        - descuento = tarifa_minuto * minutos_tardanza
        """
        if minutos_tardanza < 0:
            raise ValueError("Los minutos de tardanza no pueden ser negativos")
        if Decimal(str(tarifa_hora)) < 0:
            raise ValueError("La tarifa por hora no puede ser negativa")

        tarifa_h = Decimal(str(tarifa_hora))
        tarifa_min = tarifa_h / Decimal("60")
        descuento = (tarifa_min * Decimal(minutos_tardanza)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        return {
            "tarifa_hora": float(tarifa_h.quantize(Decimal("0.01"))),
            "tarifa_minuto": float(tarifa_min.quantize(Decimal("0.0001"))),
            "minutos_tardanza": minutos_tardanza,
            "monto_descuento": float(descuento),
        }

    @staticmethod
    def _calcular_minutos_retraso(fecha_hora: datetime, turnos: list[Turno]) -> int:
        """Determina a qué turno pertenece el marcaje y devuelve los minutos de retraso."""
        hora_marcaje = fecha_hora.time().replace(second=0, microsecond=0)
        hoy = date.today()

        for turno in turnos:
            inicio = turno.hora_inicio
            fin = turno.hora_fin

            # Turno normal (ej. 06:00 a 14:00 o 14:00 a 22:00)
            if inicio <= fin:
                if inicio <= hora_marcaje < fin:
                    diff = datetime.combine(hoy, hora_marcaje) - datetime.combine(hoy, inicio)
                    return max(0, int(diff.total_seconds() // 60))
            # Turno nocturno que cruza medianoche (ej. 22:00 a 06:00)
            else:
                if hora_marcaje >= inicio or hora_marcaje < fin:
                    dt_inicio = datetime.combine(hoy, inicio)
                    dt_marcaje = datetime.combine(
                        hoy + timedelta(days=1) if hora_marcaje < fin else hoy,
                        hora_marcaje,
                    )
                    diff = dt_marcaje - dt_inicio
                    return max(0, int(diff.total_seconds() // 60))

        return 0

    @staticmethod
    def ejecutar_cierre_mensual(db: Session, anio: int, mes: int) -> list[dict]:
        """Calcula el descuento acumulado del mes para cada empleado activo."""
        empleados = db.query(EmpleadoModel).filter(EmpleadoModel.activo == True).all()
        turnos = db.query(Turno).all()
        resultados = []

        for emp in empleados:
            tardanzas = (
                db.query(AsistenciaModel)
                .filter(
                    AsistenciaModel.empleado_id == emp.id,
                    AsistenciaModel.tipo_evento == "ENTRADA",
                    AsistenciaModel.estado == "Tardanza",
                    extract("year", AsistenciaModel.fecha_hora) == anio,
                    extract("month", AsistenciaModel.fecha_hora) == mes,
                )
                .all()
            )

            minutos_acumulados = sum(
                PlanillaService._calcular_minutos_retraso(reg.fecha_hora, turnos)
                for reg in tardanzas
            )

            calculo = PlanillaService.calcular_descuento_tardanza(
                emp.tarifa_hora, minutos_acumulados
            )
            resultados.append(
                {
                    "empleado_id": emp.id,
                    "dni": emp.dni,
                    "nombres": emp.nombres,
                    **calculo,
                }
            )

        return resultados