import { useState } from 'react';
import type { EmpleadoResponse } from './empleado.types';
import FotocheckCard from './FotocheckCard';
import './empleados.css';

interface Props {
  empleados: EmpleadoResponse[];
  cargando: boolean;
}

export default function EmpleadosTable({ empleados, cargando }: Props) {
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<EmpleadoResponse | null>(null);
  const activos = empleados.filter((e) => e.activo).length;

  return (
    <div className="emp-tabla">
      {/* ── Encabezado ── */}
      <div className="emp-tabla__header">
        <h2 className="emp-tabla__title">📋 Personal Registrado</h2>
        <span className="emp-tabla__badge">{activos} activos</span>
      </div>

      {/* ── Contenido ── */}
      {cargando ? (
        <div className="emp-tabla__loading">
          <p>Cargando empleados…</p>
        </div>
      ) : empleados.length === 0 ? (
        <div className="emp-tabla__empty">
          <div className="emp-tabla__empty-icon">👥</div>
          <p>Aún no hay empleados registrados.</p>
        </div>
      ) : (
        <div className="emp-tabla__scroll">
          <table>
            <thead>
              <tr>
                {['#', 'DNI', 'Nombres', 'Cargo', 'Tarifa/h', 'Código Marcaje', 'Estado', 'Acción'].map(
                  (col) => (
                    <th key={col}>{col}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp, idx) => (
                <tr
                  key={emp.id}
                  className={idx % 2 === 0 ? 'emp-tabla__row--even' : 'emp-tabla__row--odd'}
                >
                  <td style={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600, letterSpacing: '0.05em' }}>{emp.dni}</td>
                  <td style={{ fontWeight: 500 }}>{emp.nombres}</td>
                  <td>
                    <span
                      className={
                        emp.cargo === 'Supervisor'
                          ? 'emp-tabla__badge--supervisor'
                          : 'emp-tabla__badge--empleado'
                      }
                    >
                      {emp.cargo}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>S/ {emp.tarifa_hora.toFixed(2)}</td>
                  <td>
                    <code className="emp-tabla__codigo">{emp.codigo_qr}</code>
                  </td>
                  <td>
                    <span
                      className={
                        emp.activo ? 'emp-tabla__badge--activo' : 'emp-tabla__badge--inactivo'
                      }
                    >
                      {emp.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="emp-tabla__btn-ver-qr"
                      title="Ver Fotocheck y Código QR"
                      onClick={() => setEmpleadoSeleccionado(emp)}
                    >
                      📷 QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal de Detalle / Fotocheck con QR ── */}
      {empleadoSeleccionado && (
        <div
          className="emp-modal-backdrop"
          onClick={() => setEmpleadoSeleccionado(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="emp-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <FotocheckCard
              empleado={empleadoSeleccionado}
              onCerrar={() => setEmpleadoSeleccionado(null)}
              titulo="Fotocheck y Código QR"
              badgeTexto="🪪 Fotocheck Oficial"
            />
          </div>
        </div>
      )}
    </div>
  );
}
