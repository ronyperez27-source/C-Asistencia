import { useState } from 'react';
import { Users, QrCode } from 'lucide-react';
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
      {/* ── Encabezado de Tabla ── */}
      <div className="emp-tabla__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="emp-tabla__header-icon">
            <Users size={18} />
          </div>
          <h2 className="emp-tabla__title">Personal Operativo Registrado</h2>
        </div>
        <span className="emp-tabla__badge">
          {activos} {activos === 1 ? 'activo' : 'activos'} de {empleados.length}
        </span>
      </div>

      {/* ── Contenido ── */}
      {cargando ? (
        <div className="emp-tabla__loading">
          <p>Cargando personal…</p>
        </div>
      ) : empleados.length === 0 ? (
        <div className="emp-tabla__empty">
          <div className="emp-tabla__empty-icon">
            <Users size={36} strokeWidth={1.5} />
          </div>
          <p>Aún no hay empleados registrados en el sistema.</p>
        </div>
      ) : (
        <div className="emp-tabla__scroll">
          <table>
            <thead>
              <tr>
                {['#', 'DNI', 'Nombres', 'Cargo', 'Tarifa/h', 'Código Marcaje', 'Estado', 'Fotocheck'].map(
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
                  <td className="emp-tabla__td-num">{idx + 1}</td>
                  <td className="emp-tabla__td-dni">{emp.dni}</td>
                  <td className="emp-tabla__td-nombre">{emp.nombres}</td>
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
                  <td className="emp-tabla__td-tarifa">
                    S/ {emp.tarifa_hora.toFixed(2)}
                  </td>
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
                      <QrCode size={13} />
                      <span>Ver QR</span>
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
              titulo="Fotocheck Oficial"
              badgeTexto="EESS HUAMANGUINO"
            />
          </div>
        </div>
      )}
    </div>
  );
}
