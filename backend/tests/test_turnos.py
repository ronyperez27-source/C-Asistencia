from datetime import time
from app.models.turno import Turno


def test_tolerancia_por_defecto_es_5_minutos():
    turno = Turno(nombre="Mañana", hora_inicio=time(6, 0), hora_fin=time(14, 0), tolerancia_minutos=5)
    assert turno.tolerancia_minutos == 5


def test_limite_ingreso_turno_manana_06_05():
    # Criterio de aceptación CAH-14: inicio 06:00 AM + 5 min -> límite 06:05 AM
    turno = Turno(nombre="Mañana", hora_inicio=time(6, 0), hora_fin=time(14, 0), tolerancia_minutos=5)
    assert turno.obtener_hora_limite() == time(6, 5)


def test_evaluacion_puntualidad_en_limite_y_tardanza():
    turno = Turno(nombre="Tarde", hora_inicio=time(14, 0), hora_fin=time(22, 0), tolerancia_minutos=5)
    assert turno.evaluar_puntualidad(time(14, 5)) == "A tiempo"
    assert turno.evaluar_puntualidad(time(14, 6)) == "Tardanza"


def test_cruce_de_medianoche_en_tolerancia():
    turno = Turno(nombre="Noche", hora_inicio=time(23, 58), hora_fin=time(6, 0), tolerancia_minutos=5)
    assert turno.obtener_hora_limite() == time(0, 3)