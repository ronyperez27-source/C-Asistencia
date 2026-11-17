import pytest
from app.services.planilla_service import PlanillaService


def test_calculo_descuento_criterio_aceptacion_cah8():
    # Dado un empleado con tarifa de S/ 12.00/hora (S/ 0.20/minuto) y 30 min de tardanza
    resultado = PlanillaService.calcular_descuento_tardanza(
        tarifa_hora=12.00,
        minutos_tardanza=30,
    )
    # Entonces el sistema calcula un descuento exacto de S/ 6.00
    assert resultado["tarifa_minuto"] == 0.20
    assert resultado["monto_descuento"] == 6.00


def test_empleado_sin_tardanzas_descuento_cero():
    resultado = PlanillaService.calcular_descuento_tardanza(
        tarifa_hora=15.00,
        minutos_tardanza=0,
    )
    assert resultado["monto_descuento"] == 0.00


def test_tarifa_con_decimales_redondeo_exacto():
    # S/ 12.50/hora -> 0.208333.../min * 15 min = 3.125 -> S/ 3.13
    resultado = PlanillaService.calcular_descuento_tardanza(
        tarifa_hora=12.50,
        minutos_tardanza=15,
    )
    assert resultado["monto_descuento"] == 3.13


def test_valores_negativos_lanzan_error():
    with pytest.raises(ValueError):
        PlanillaService.calcular_descuento_tardanza(tarifa_hora=12.00, minutos_tardanza=-5)