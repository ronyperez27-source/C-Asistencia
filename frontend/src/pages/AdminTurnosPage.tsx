import { useEffect, useState } from 'react';
import { Clock, CheckCircle2, Save, AlertCircle } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

interface Turno {
  id: number;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  tolerancia_minutos: number;
  hora_limite: string;
}

export default function AdminTurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [mensaje, setMensaje] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);

  const cargarTurnos = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/turnos/');
      if (res.ok) {
        const data = await res.json();
        setTurnos(data);
      }
    } catch (err) {
      console.error('Error al cargar turnos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTurnos();
  }, []);

  const manejarCambio = (id: number, campo: keyof Turno, valor: string | number) => {
    setTurnos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [campo]: valor } : t))
    );
  };

  const guardarTurno = async (turno: Turno) => {
    setMensaje('');
    setGuardandoId(turno.id);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/turnos/${turno.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hora_inicio: turno.hora_inicio,
          hora_fin: turno.hora_fin,
          tolerancia_minutos: Number(turno.tolerancia_minutos),
        }),
      });

      if (res.ok) {
        const actualizado = await res.json();
        setTurnos((prev) => prev.map((t) => (t.id === turno.id ? actualizado : t)));
        setMensaje(`Turno ${turno.nombre} actualizado. Límite sin penalización: ${actualizado.hora_limite.slice(0, 5)}`);
      }
    } catch (err) {
      console.error('Error al guardar turno:', err);
    } finally {
      setGuardandoId(null);
    }
  };

  return (
    <AdminLayout
      paginaActiva="turnos"
      titulo="Configuración de Turnos Operativos"
      subtitulo="Horarios de guardia y parámetros de tolerancia para el personal de pista y tienda"
    >
      {mensaje && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
          <span>{mensaje}</span>
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p style={{ fontWeight: 600 }}>Cargando turnos operativos…</p>
        </div>
      ) : turnos.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '2.5rem',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <AlertCircle size={32} style={{ color: '#94a3b8', margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: 600 }}>No se encontraron turnos configurados.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {turnos.map((turno) => (
            <div
              key={turno.id}
              style={{
                backgroundColor: '#ffffff',
                padding: '1.5rem',
                borderRadius: '14px',
                boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Cabecera de Tarjeta de Turno */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '0.75rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#fff7ed',
                        border: '1px solid #ffedd5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ea580c',
                      }}
                    >
                      <Clock size={18} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      Turno {turno.nombre}
                    </h2>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#ea580c',
                      backgroundColor: '#fff7ed',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    EESS
                  </span>
                </div>

                {/* Hora de Inicio */}
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={turno.hora_inicio.slice(0, 5)}
                    onChange={(e) => manejarCambio(turno.id, 'hora_inicio', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box',
                      fontSize: '0.95rem',
                      fontFamily: 'ui-monospace, monospace',
                      fontVariantNumeric: 'tabular-nums',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </div>

                {/* Hora de Fin */}
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Hora de Fin
                  </label>
                  <input
                    type="time"
                    value={turno.hora_fin.slice(0, 5)}
                    onChange={(e) => manejarCambio(turno.id, 'hora_fin', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box',
                      fontSize: '0.95rem',
                      fontFamily: 'ui-monospace, monospace',
                      fontVariantNumeric: 'tabular-nums',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </div>

                {/* Tolerancia en Minutos */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Tolerancia Fija (minutos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={turno.tolerancia_minutos}
                    onChange={(e) => manejarCambio(turno.id, 'tolerancia_minutos', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box',
                      fontSize: '0.95rem',
                      fontFamily: 'ui-monospace, monospace',
                      fontVariantNumeric: 'tabular-nums',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </div>

                {/* Banner de Tolerancia / Límite */}
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '8px',
                    marginBottom: '1.25rem',
                    fontSize: '0.84rem',
                    color: '#92400e',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Clock size={15} style={{ color: '#d97706', flexShrink: 0 }} />
                  <span>
                    Límite puntual:{' '}
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontVariantNumeric: 'tabular-nums', color: '#78350f' }}>
                      {turno.hora_limite.slice(0, 5)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Botón Guardar Cambios */}
              <button
                onClick={() => guardarTurno(turno)}
                disabled={guardandoId === turno.id}
                style={{
                  width: '100%',
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '9px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: guardandoId === turno.id ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                  transition: 'background-color 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <Save size={16} />
                <span>{guardandoId === turno.id ? 'Guardando…' : 'Guardar Cambios'}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
