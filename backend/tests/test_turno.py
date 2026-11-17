from datetime import time
from app.models.turno import Turno


def test_marcaje_en_limite_de_tolerancia_es_puntual():
    turno_manana = Turno(nombre="Mañana", hora_inicio=time(6, 0), hora_fin=time(14, 0))
    resultado = turno_manana.evaluar_marcaje(time(6, 5, 59))
    assert resultado == {"estado": "Puntual", "minutos_tardanza": 0}


def test_marcaje_desde_minuto_seis_calcula_tardanza_desde_hora_oficial():
    turno_manana = Turno(nombre="Mañana", hora_inicio=time(6, 0), hora_fin=time(14, 0))
    resultado = turno_manana.evaluar_marcaje(time(6, 6, 0))
    assert resultado == {"estado": "Tardanza", "minutos_tardanza": 6}


def test_marcaje_anticipado_es_puntual():
    turno_tarde = Turno(nombre="Tarde", hora_inicio=time(14, 0), hora_fin=time(22, 0))
    resultado = turno_tarde.evaluar_marcaje(time(13, 50, 0))
    assert resultado == {"estado": "Puntual", "minutos_tardanza": 0}


def test_turno_noche_cruce_medianoche():
    turno_noche = Turno(nombre="Noche", hora_inicio=time(22, 0), hora_fin=time(6, 0))
    assert turno_noche.evaluar_marcaje(time(22, 4, 30)) == {
        "estado": "Puntual",
        "minutos_tardanza": 0,
    }
    assert turno_noche.evaluar_marcaje(time(0, 15, 0)) == {
        "estado": "Tardanza",
        "minutos_tardanza": 135,
    }