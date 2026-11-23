import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Clock,
  FileSpreadsheet,
  FileText,
  Inbox,
  LoaderCircle,
  RefreshCw,
  Table2,
  Timer,
  Users,
  Wallet,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { API_BASE_URL } from '../config/api';
import './AdminPlanillaPage.css';

// ─── Contrato real de GET /planilla/cierre-mensual ───────────────────────────
// (backend/app/schemas/planilla.py → CierreMensualItemResponse)
interface CierreMensualItem {
  empleado_id: number;
  dni: string;
  nombres: string;
  cargo: string;
  horas_trabajadas: number;
  minutos_tardanza: number;
  monto_descuento: number;
}

type FormatoExportacion = 'excel' | 'pdf';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

const FECHA_ACTUAL = new Date();
const ANIO_ACTUAL = FECHA_ACTUAL.getFullYear();
const MES_ACTUAL = FECHA_ACTUAL.getMonth() + 1;

// Backend acepta anio >= 2020. Se ofrecen los últimos años y el siguiente.
const ANIOS_DISPONIBLES = Array.from(
  { length: ANIO_ACTUAL + 2 - 2020 },
  (_, indice) => ANIO_ACTUAL + 1 - indice
);

const formatoMoneda = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatoEntero = new Intl.NumberFormat('es-PE');

function cabecerasAutenticadas(): HeadersInit {
  const token = localStorage.getItem('token_admin');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatearSoles(monto: number): string {
  return `S/ ${formatoMoneda.format(Number.isFinite(monto) ? monto : 0)}`;
}

function formatearHoras(horas: number): string {
  return `${formatoMoneda.format(Number.isFinite(horas) ? horas : 0)} h`;
}

function obtenerIniciales(nombres: string | null): string {
  if (!nombres || !nombres.trim()) return '?';
  return nombres
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

export default function AdminPlanillaPage() {
  const [mes, setMes] = useState<number>(MES_ACTUAL);
  const [anio, setAnio] = useState<number>(ANIO_ACTUAL);

  const [datos, setDatos] = useState<CierreMensualItem[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizadoEn, setActualizadoEn] = useState<Date | null>(null);

  // Indicadores de carga independientes para cada exportación.
  const [exportando, setExportando] = useState<Record<FormatoExportacion, boolean>>({
    excel: false,
    pdf: false,
  });
  const [errorExportacion, setErrorExportacion] = useState<string | null>(null);

  const solicitudRef = useRef(0);

  const cargarCierre = useCallback(async () => {
    const idSolicitud = ++solicitudRef.current;
    setCargando(true);
    setError(null);

    try {
      const respuesta = await fetch(
        `${API_BASE_URL}/planilla/cierre-mensual?anio=${anio}&mes=${mes}`,
        { headers: cabecerasAutenticadas() }
      );

      if (!respuesta.ok) {
        let detalle = '';
        try {
          const cuerpo = await respuesta.json();
          if (typeof cuerpo?.detail === 'string') detalle = cuerpo.detail;
        } catch {
          /* El backend no devolvió JSON; se usa el mensaje genérico. */
        }

        if (respuesta.status === 401 || respuesta.status === 403) {
          throw new Error('No autorizado. Inicia sesión nuevamente para consultar la planilla.');
        }
        throw new Error(
          detalle || `No se pudo obtener el cierre mensual (HTTP ${respuesta.status}).`
        );
      }

      const data: CierreMensualItem[] = await respuesta.json();
      if (idSolicitud !== solicitudRef.current) return;

      setDatos(Array.isArray(data) ? data : []);
      setActualizadoEn(new Date());
    } catch (err) {
      if (idSolicitud !== solicitudRef.current) return;
      setDatos([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Error de red al consultar la planilla. Verifica la conexión con el servidor.'
      );
    } finally {
      if (idSolicitud === solicitudRef.current) setCargando(false);
    }
  }, [anio, mes]);

  // Consulta automática al montar y cada vez que cambia Mes o Año.
  useEffect(() => {
    void cargarCierre();
  }, [cargarCierre]);

  const exportarReporte = useCallback(
    async (formato: FormatoExportacion) => {
      setExportando((previo) => ({ ...previo, [formato]: true }));
      setErrorExportacion(null);

      try {
        const respuesta = await fetch(
          `${API_BASE_URL}/planilla/exportar/${formato}?anio=${anio}&mes=${mes}`,
          { headers: cabecerasAutenticadas() }
        );

        if (!respuesta.ok) {
          let detalle = '';
          try {
            const cuerpo = await respuesta.json();
            if (typeof cuerpo?.detail === 'string') detalle = cuerpo.detail;
          } catch {
            /* El backend no devolvió JSON; se usa el mensaje genérico. */
          }

          if (respuesta.status === 401 || respuesta.status === 403) {
            throw new Error(
              'No autorizado. Inicia sesión nuevamente para exportar la planilla.'
            );
          }
          throw new Error(
            detalle ||
              `No se pudo generar el archivo ${formato === 'excel' ? 'Excel' : 'PDF'} (HTTP ${respuesta.status}).`
          );
        }

        const blob = await respuesta.blob();
        const extension = formato === 'excel' ? 'xlsx' : 'pdf';
        const mesFormateado = String(mes).padStart(2, '0');
        const url = URL.createObjectURL(blob);

        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `planilla_${anio}_${mesFormateado}.${extension}`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
      } catch (err) {
        setErrorExportacion(
          err instanceof Error
            ? err.message
            : 'Error de red al generar el reporte. Verifica la conexión con el servidor.'
        );
      } finally {
        setExportando((previo) => ({ ...previo, [formato]: false }));
      }
    },
    [anio, mes]
  );

  const totales = useMemo(() => {
    let horas = 0;
    let minutos = 0;
    let monto = 0;

    for (const item of datos) {
      if (Number.isFinite(item.horas_trabajadas)) horas += item.horas_trabajadas;
      if (Number.isFinite(item.minutos_tardanza)) minutos += item.minutos_tardanza;
      if (Number.isFinite(item.monto_descuento)) monto += item.monto_descuento;
    }

    return {
      empleados: datos.length,
      horas: Math.round(horas * 100) / 100,
      minutos,
      monto,
    };
  }, [datos]);

  const periodo = `${MESES[mes - 1]} ${anio}`;
  const horaActualizacion = actualizadoEn?.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AdminLayout
      paginaActiva="planilla"
      titulo="Cierre Mensual de Planilla"
      subtitulo="Consolidado de horas trabajadas, tardanzas y descuentos por trabajador para el periodo seleccionado"
    >
      <div className="planilla-page">
        {/* ── Filtros de periodo ── */}
        <section className="planilla-filtros" aria-label="Filtros del cierre mensual">
          <div className="planilla-filtros__barra">
            <div className="planilla-filtros__campo">
              <label className="planilla-filtros__label" htmlFor="planilla-mes">
                Mes
              </label>
              <div className="planilla-select-wrap">
                <CalendarDays size={16} aria-hidden="true" />
                <select
                  id="planilla-mes"
                  value={mes}
                  onChange={(evento) => setMes(Number(evento.target.value))}
                >
                  {MESES.map((nombre, indice) => (
                    <option key={nombre} value={indice + 1}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="planilla-filtros__campo">
              <label className="planilla-filtros__label" htmlFor="planilla-anio">
                Año
              </label>
              <div className="planilla-select-wrap">
                <CalendarDays size={16} aria-hidden="true" />
                <select
                  id="planilla-anio"
                  value={anio}
                  onChange={(evento) => setAnio(Number(evento.target.value))}
                >
                  {ANIOS_DISPONIBLES.map((valor) => (
                    <option key={valor} value={valor}>
                      {valor}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              className="planilla-btn planilla-btn--primary"
              onClick={() => void cargarCierre()}
              disabled={cargando}
            >
              <RefreshCw
                size={16}
                className={cargando ? 'planilla-spin' : undefined}
                aria-hidden="true"
              />
              <span>{cargando ? 'Consultando…' : 'Actualizar'}</span>
            </button>

            <div className="planilla-filtros__acciones" aria-label="Exportación de reportes">
              <button
                type="button"
                className="planilla-btn planilla-btn--excel"
                onClick={() => void exportarReporte('excel')}
                disabled={exportando.excel}
                aria-label="Exportar a Excel"
                aria-busy={exportando.excel}
              >
                {exportando.excel ? (
                  <LoaderCircle size={16} className="planilla-spin" aria-hidden="true" />
                ) : (
                  <FileSpreadsheet size={16} aria-hidden="true" />
                )}
                <span className="planilla-btn__label planilla-btn__label--larga">
                  {exportando.excel ? 'Generando…' : 'Exportar a Excel'}
                </span>
                <span
                  className="planilla-btn__label planilla-btn__label--corta"
                  aria-hidden="true"
                >
                  {exportando.excel ? 'Generando…' : 'Excel'}
                </span>
              </button>

              <button
                type="button"
                className="planilla-btn planilla-btn--pdf"
                onClick={() => void exportarReporte('pdf')}
                disabled={exportando.pdf}
                aria-label="Exportar a PDF"
                aria-busy={exportando.pdf}
              >
                {exportando.pdf ? (
                  <LoaderCircle size={16} className="planilla-spin" aria-hidden="true" />
                ) : (
                  <FileText size={16} aria-hidden="true" />
                )}
                <span className="planilla-btn__label planilla-btn__label--larga">
                  {exportando.pdf ? 'Generando…' : 'Exportar a PDF'}
                </span>
                <span
                  className="planilla-btn__label planilla-btn__label--corta"
                  aria-hidden="true"
                >
                  {exportando.pdf ? 'Generando…' : 'PDF'}
                </span>
              </button>
            </div>
          </div>

          <div className="planilla-filtros__meta">
            <span>
              Periodo consultado: <strong>{periodo}</strong>
            </span>
            {horaActualizacion && !cargando && (
              <span className="planilla-filtros__stamp">
                Actualizado a las {horaActualizacion}
              </span>
            )}
          </div>
        </section>

        {errorExportacion && (
          <div className="planilla-export-error" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{errorExportacion}</span>
            <button
              type="button"
              className="planilla-export-error__cerrar"
              onClick={() => setErrorExportacion(null)}
              aria-label="Cerrar aviso de exportación"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Tarjetas resumen ── */}
        <section className="planilla-resumen" aria-label="Resumen del cierre mensual">
          <article className="planilla-card planilla-card--empleados">
            <div className="planilla-card__head">
              <div className="planilla-card__icon" aria-hidden="true">
                <Users size={18} />
              </div>
              <span className="planilla-card__label">Empleados</span>
            </div>
            <div className="planilla-card__body">
              <strong className="planilla-card__value">
                {formatoEntero.format(totales.empleados)}
              </strong>
              <span className="planilla-card__hint">Incluidos en el reporte del periodo</span>
            </div>
          </article>

          <article className="planilla-card planilla-card--horas">
            <div className="planilla-card__head">
              <div className="planilla-card__icon" aria-hidden="true">
                <Clock size={18} />
              </div>
              <span className="planilla-card__label">Horas trabajadas</span>
            </div>
            <div className="planilla-card__body">
              <strong className="planilla-card__value">{formatearHoras(totales.horas)}</strong>
              <span className="planilla-card__hint">Jornadas completadas en el periodo</span>
            </div>
          </article>

          <article className="planilla-card planilla-card--minutos">
            <div className="planilla-card__head">
              <div className="planilla-card__icon" aria-hidden="true">
                <Timer size={18} />
              </div>
              <span className="planilla-card__label">Minutos de tardanza</span>
            </div>
            <div className="planilla-card__body">
              <strong className="planilla-card__value">
                {formatoEntero.format(totales.minutos)}
                <span className="planilla-card__unit"> min</span>
              </strong>
              <span className="planilla-card__hint">Acumulado mensual de todo el personal</span>
            </div>
          </article>

          <article className="planilla-card planilla-card--monto">
            <div className="planilla-card__head">
              <div className="planilla-card__icon" aria-hidden="true">
                <Wallet size={18} />
              </div>
              <span className="planilla-card__label">Descuento total</span>
            </div>
            <div className="planilla-card__body">
              <strong className="planilla-card__value">{formatearSoles(totales.monto)}</strong>
              <span className="planilla-card__hint">Descuento monetario consolidado (S/)</span>
            </div>
          </article>
        </section>

        {/* ── Tabla consolidada ── */}
        <section className="planilla-tabla" aria-label="Tabla consolidada de planilla">
          <header className="planilla-tabla__header">
            <div className="planilla-tabla__header-main">
              <div className="planilla-tabla__icon" aria-hidden="true">
                <Table2 size={18} />
              </div>
              <div>
                <h2 className="planilla-tabla__title">Cierre consolidado</h2>
                <p className="planilla-tabla__subtitle">
                  {periodo} · {formatoEntero.format(totales.empleados)}{' '}
                  {totales.empleados === 1 ? 'trabajador' : 'trabajadores'}
                </p>
              </div>
            </div>
            {horaActualizacion && !cargando && (
              <span className="planilla-tabla__stamp">Actualizado {horaActualizacion}</span>
            )}
          </header>

          {error ? (
            <div className="planilla-estado planilla-estado--error" role="alert">
              <div className="planilla-estado__icon" aria-hidden="true">
                <AlertCircle size={28} />
              </div>
              <p>No se pudo cargar el cierre mensual</p>
              <span>{error}</span>
              <button
                type="button"
                className="planilla-btn planilla-btn--outline"
                onClick={() => void cargarCierre()}
              >
                <RefreshCw size={15} />
                <span>Reintentar</span>
              </button>
            </div>
          ) : cargando && datos.length === 0 ? (
            <div className="planilla-estado" role="status" aria-live="polite">
              <LoaderCircle size={30} className="planilla-spin" aria-hidden="true" />
              <p>Calculando el cierre de {periodo}…</p>
              <span>Estamos consolidando las horas trabajadas y las tardanzas del periodo.</span>
            </div>
          ) : datos.length === 0 ? (
            <div className="planilla-estado">
              <div className="planilla-estado__icon" aria-hidden="true">
                <Inbox size={28} />
              </div>
              <p>No hay trabajadores en el reporte para {periodo}</p>
              <span>
                Verifica que existan empleados activos registrados en el sistema para el periodo
                seleccionado.
              </span>
            </div>
          ) : (
            <div
              className="planilla-tabla__scroll"
              role="region"
              aria-label="Tabla de planilla, desplazable horizontalmente"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">DNI</th>
                    <th scope="col">Empleado</th>
                    <th scope="col">Cargo</th>
                    <th scope="col" className="planilla-tabla__num">
                      Horas Trabajadas
                    </th>
                    <th scope="col" className="planilla-tabla__num">
                      Minutos de Tardanza
                    </th>
                    <th scope="col" className="planilla-tabla__num">
                      Descuento (S/)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datos.map((item, indice) => {
                    const sinTardanza = item.minutos_tardanza === 0;
                    const clave = `${item.empleado_id ?? item.dni ?? 'fila'}-${indice}`;

                    return (
                      <tr
                        key={clave}
                        className={
                          indice % 2 === 0 ? undefined : 'planilla-tabla__fila--alterna'
                        }
                      >
                        <td>
                          <code className="planilla-dni">{item.dni || '—'}</code>
                        </td>
                        <td>
                          <div className="planilla-empleado">
                            <span className="planilla-avatar" aria-hidden="true">
                              {obtenerIniciales(item.nombres)}
                            </span>
                            <div>
                              <span className="planilla-empleado__nombre">
                                {item.nombres || 'Sin nombre'}
                              </span>
                              {item.empleado_id != null && (
                                <span className="planilla-empleado__id">
                                  ID {item.empleado_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`planilla-cargo ${
                              item.cargo === 'Supervisor' ? 'planilla-cargo--supervisor' : ''
                            }`}
                          >
                            {item.cargo || '—'}
                          </span>
                        </td>
                        <td className="planilla-tabla__num">
                          <span className="planilla-horas">
                            {formatearHoras(item.horas_trabajadas)}
                          </span>
                        </td>
                        <td className="planilla-tabla__num">
                          <span
                            className={`planilla-minutos ${
                              sinTardanza ? 'planilla-minutos--ok' : 'planilla-minutos--alerta'
                            }`}
                          >
                            {formatoEntero.format(item.minutos_tardanza)}
                            <small>min</small>
                          </span>
                        </td>
                        <td className="planilla-tabla__num">
                          <span
                            className={`planilla-monto ${
                              sinTardanza ? 'planilla-monto--cero' : ''
                            }`}
                          >
                            {formatearSoles(item.monto_descuento)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="planilla-tabla__total-label">
                      Total consolidado
                    </td>
                    <td className="planilla-tabla__num">{formatearHoras(totales.horas)}</td>
                    <td className="planilla-tabla__num">
                      {formatoEntero.format(totales.minutos)} min
                    </td>
                    <td className="planilla-tabla__num">{formatearSoles(totales.monto)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
