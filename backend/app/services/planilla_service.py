from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy import extract
from sqlalchemy.orm import Session
from app.models.empleado import EmpleadoModel
from app.models.asistencia import AsistenciaModel


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
    def ejecutar_cierre_mensual(db: Session, anio: int, mes: int) -> list[dict]:
        """Calcula el descuento acumulado del mes para cada empleado activo."""
        empleados = db.query(EmpleadoModel).filter(EmpleadoModel.activo == True).all()
        resultados = []

        for emp in empleados:
            registros = (
                db.query(AsistenciaModel)
                .filter(
                    AsistenciaModel.empleado_id == emp.id,
                    extract("year", AsistenciaModel.fecha) == anio,
                    extract("month", AsistenciaModel.fecha) == mes,
                )
                .all()
            )
            minutos_acumulados = sum(
                getattr(r, "minutos_tardanza", 0) or 0 for r in registros
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