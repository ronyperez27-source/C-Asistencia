from datetime import datetime, date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Table, TableStyle
from sqlalchemy import and_, extract
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
    def _calcular_horas_trabajadas(asistencias: list[AsistenciaModel]) -> float:
        """Suma las horas de jornadas completadas (ENTRADA seguida de SALIDA)."""
        total_segundos = 0.0
        entrada_pendiente: datetime | None = None

        for registro in asistencias:
            if registro.tipo_evento == "ENTRADA":
                entrada_pendiente = registro.fecha_hora
            elif registro.tipo_evento == "SALIDA" and entrada_pendiente is not None:
                diferencia = (registro.fecha_hora - entrada_pendiente).total_seconds()
                if diferencia > 0:
                    total_segundos += diferencia
                entrada_pendiente = None

        return round(total_segundos / 3600, 2)

    @staticmethod
    def ejecutar_cierre_mensual(db: Session, anio: int, mes: int) -> list[dict]:
        """Consolida tardanzas, horas trabajadas y descuentos de empleados activos.

        Parte siempre de `empleados` con un LEFT JOIN a las asistencias del mes,
        de modo que los trabajadores sin marcajes también aparezcan con ceros.
        """
        filas = (
            db.query(EmpleadoModel, AsistenciaModel)
            .outerjoin(
                AsistenciaModel,
                and_(
                    AsistenciaModel.empleado_id == EmpleadoModel.id,
                    extract("year", AsistenciaModel.fecha_hora) == anio,
                    extract("month", AsistenciaModel.fecha_hora) == mes,
                ),
            )
            .filter(EmpleadoModel.activo == True)
            .order_by(EmpleadoModel.id, AsistenciaModel.fecha_hora, AsistenciaModel.id)
            .all()
        )

        empleados_por_id: dict[int, EmpleadoModel] = {}
        asistencias_por_empleado: dict[int, list[AsistenciaModel]] = {}

        for empleado, asistencia in filas:
            empleados_por_id[empleado.id] = empleado
            asistencias_por_empleado.setdefault(empleado.id, [])
            if asistencia is not None:
                asistencias_por_empleado[empleado.id].append(asistencia)

        turnos = db.query(Turno).all()
        resultados = []

        for empleado_id, empleado in empleados_por_id.items():
            asistencias = asistencias_por_empleado.get(empleado_id, [])

            minutos_acumulados = sum(
                PlanillaService._calcular_minutos_retraso(registro.fecha_hora, turnos)
                for registro in asistencias
                if registro.tipo_evento == "ENTRADA" and registro.estado == "Tardanza"
            )
            horas_trabajadas = PlanillaService._calcular_horas_trabajadas(asistencias)
            calculo = PlanillaService.calcular_descuento_tardanza(
                empleado.tarifa_hora, minutos_acumulados
            )

            resultados.append(
                {
                    "empleado_id": empleado.id,
                    "dni": empleado.dni,
                    "nombres": empleado.nombres,
                    "cargo": empleado.cargo,
                    "horas_trabajadas": horas_trabajadas,
                    "minutos_tardanza": minutos_acumulados,
                    "monto_descuento": calculo["monto_descuento"],
                }
            )

        return resultados

    @staticmethod
    def _totales_cierre(datos: list[dict]) -> tuple[float, int, float]:
        """Devuelve horas, minutos y monto totales del cierre."""
        horas = round(
            sum(float(item.get("horas_trabajadas") or 0.0) for item in datos), 2
        )
        minutos = sum(int(item.get("minutos_tardanza") or 0) for item in datos)
        monto = round(
            sum(float(item.get("monto_descuento") or 0.0) for item in datos), 2
        )
        return horas, minutos, monto

    @staticmethod
    def generar_excel_cierre_mensual(
        datos: list[dict], anio: int, mes: int
    ) -> BytesIO:
        """Genera el reporte de planilla en Excel (XLSX) en memoria."""
        periodo = f"{mes:02d}/{anio}"
        libro = Workbook()
        hoja = libro.active
        hoja.title = "Planilla"

        hoja.merge_cells("A1:F1")
        titulo = hoja["A1"]
        titulo.value = f"Grifo El Huamanguino - Reporte de Planilla ({periodo})"
        titulo.font = Font(bold=True, size=14, color="FFFFFF")
        titulo.fill = PatternFill("solid", fgColor="071426")
        titulo.alignment = Alignment(horizontal="center", vertical="center")
        hoja.row_dimensions[1].height = 28

        encabezados = [
            "DNI",
            "Empleado",
            "Cargo",
            "Horas Trabajadas",
            "Minutos Tardanza",
            "Descuento Monetario (S/)",
        ]
        for columna, encabezado in enumerate(encabezados, start=1):
            celda = hoja.cell(row=3, column=columna, value=encabezado)
            celda.font = Font(bold=True, color="FFFFFF")
            celda.fill = PatternFill("solid", fgColor="EA580C")
            celda.alignment = Alignment(
                horizontal="center", vertical="center", wrap_text=True
            )
            celda.border = Border(bottom=Side(style="thin", color="C2410C"))
        hoja.row_dimensions[3].height = 30

        fila = 4
        for item in datos:
            hoja.cell(row=fila, column=1, value=item.get("dni", ""))
            hoja.cell(row=fila, column=2, value=item.get("nombres", ""))
            hoja.cell(row=fila, column=3, value=item.get("cargo", ""))
            hoja.cell(
                row=fila,
                column=4,
                value=float(item.get("horas_trabajadas") or 0.0),
            )
            hoja.cell(
                row=fila,
                column=5,
                value=int(item.get("minutos_tardanza") or 0),
            )
            hoja.cell(
                row=fila,
                column=6,
                value=float(item.get("monto_descuento") or 0.0),
            )

            for columna in range(1, 7):
                celda = hoja.cell(row=fila, column=columna)
                celda.border = Border(bottom=Side(style="thin", color="E2E8F0"))
                if columna == 4:
                    celda.number_format = "0.00"
                    celda.alignment = Alignment(horizontal="right")
                elif columna == 5:
                    celda.number_format = "0"
                    celda.alignment = Alignment(horizontal="right")
                elif columna == 6:
                    celda.number_format = "0.00"
                    celda.alignment = Alignment(horizontal="right")
            fila += 1

        horas, minutos, monto = PlanillaService._totales_cierre(datos)
        hoja.cell(row=fila, column=1, value="TOTAL")
        hoja.merge_cells(start_row=fila, start_column=1, end_row=fila, end_column=3)
        hoja.cell(row=fila, column=4, value=horas)
        hoja.cell(row=fila, column=5, value=minutos)
        hoja.cell(row=fila, column=6, value=monto)

        for columna in range(1, 7):
            celda = hoja.cell(row=fila, column=columna)
            celda.font = Font(bold=True, color="FFFFFF")
            celda.fill = PatternFill("solid", fgColor="0F2744")
            celda.border = Border(top=Side(style="medium", color="EA580C"))
            if columna == 4:
                celda.number_format = "0.00"
                celda.alignment = Alignment(horizontal="right")
            elif columna == 5:
                celda.number_format = "0"
                celda.alignment = Alignment(horizontal="right")
            elif columna == 6:
                celda.number_format = "0.00"
                celda.alignment = Alignment(horizontal="right")
        hoja.cell(row=fila, column=1).alignment = Alignment(horizontal="left")

        hoja.column_dimensions["A"].width = 14
        hoja.column_dimensions["B"].width = 30
        hoja.column_dimensions["C"].width = 18
        hoja.column_dimensions["D"].width = 18
        hoja.column_dimensions["E"].width = 18
        hoja.column_dimensions["F"].width = 24
        hoja.freeze_panes = "A4"
        hoja.auto_filter.ref = f"A3:F{max(fila - 1, 3)}"

        buffer = BytesIO()
        libro.save(buffer)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generar_pdf_cierre_mensual(
        datos: list[dict], anio: int, mes: int
    ) -> BytesIO:
        """Genera el reporte de planilla en PDF en memoria."""
        periodo = f"{mes:02d}/{anio}"
        buffer = BytesIO()

        documento = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=28,
            leftMargin=28,
            topMargin=28,
            bottomMargin=28,
            title=f"Reporte de Planilla {periodo}",
            author="Grifo El Huamanguino",
        )

        estilos = getSampleStyleSheet()
        estilo_titulo = ParagraphStyle(
            "TituloPlanilla",
            parent=estilos["Title"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            alignment=1,
            textColor=colors.HexColor("#071426"),
            spaceAfter=4,
        )
        estilo_subtitulo = ParagraphStyle(
            "SubtituloPlanilla",
            parent=estilos["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            alignment=1,
            textColor=colors.HexColor("#475569"),
            spaceAfter=12,
        )

        elementos = [
            Paragraph("Grifo El Huamanguino", estilo_titulo),
            Paragraph(f"Reporte de Planilla - Periodo {periodo}", estilo_subtitulo),
        ]

        filas: list[list[str]] = [
            [
                "DNI",
                "Empleado",
                "Cargo",
                "Horas Trabajadas",
                "Minutos Tardanza",
                "Descuento Monetario (S/)",
            ]
        ]
        for item in datos:
            filas.append(
                [
                    str(item.get("dni", "")),
                    str(item.get("nombres", "")),
                    str(item.get("cargo", "")),
                    f"{float(item.get('horas_trabajadas') or 0.0):.2f}",
                    str(int(item.get("minutos_tardanza") or 0)),
                    f"{float(item.get('monto_descuento') or 0.0):.2f}",
                ]
            )

        horas, minutos, monto = PlanillaService._totales_cierre(datos)
        filas.append(["TOTAL", "", "", f"{horas:.2f}", str(minutos), f"{monto:.2f}"])

        tabla = Table(
            filas,
            colWidths=[55, 150, 75, 70, 65, 90],
            repeatRows=1,
        )
        tabla.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#071426")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 7.5),
                    ("ALIGN", (3, 1), (-1, -1), "RIGHT"),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.HexColor("#F8FAFC")],
                    ),
                    ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#0F2744")),
                    ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
                    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                    ("LINEABOVE", (0, -1), (-1, -1), 1.0, colors.HexColor("#EA580C")),
                ]
            )
        )
        elementos.append(tabla)

        documento.build(elementos)
        buffer.seek(0)
        return buffer