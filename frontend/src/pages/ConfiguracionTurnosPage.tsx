import React, { useEffect, useState } from 'react';
import './ConfiguracionTurnosPage.css';

interface Turno {
  id: number;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  tolerancia_minutos: number;
}

interface ConfiguracionTurnosProps {
  onCerrarSesion?: () => void;
}

const API_URL = 'http://localhost:8000/api/v1/turnos';

export const ConfiguracionTurnosPage: React.FC<ConfiguracionTurnosProps> = ({ onCerrarSesion }) => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    cargarTurnos();
  }, []);

  const cargarTurnos = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/`);
      if (!respuesta.ok) throw new Error('Error al obtener los turnos');
      const data: Turno[] = await respuesta.json();
      setTurnos(data);
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor de turnos.' });
    } finally {
      setCargando(false);
    }
  };

  const manejarCambioHora = (id: number, campo: 'hora_inicio' | 'hora_fin', valor: string) => {
    setTurnos((prev) =>
      prev.map((turno) => (turno.id === id ? { ...turno, [campo]: valor } : turno))
    );
  };

  const guardarTurno = async (turno: Turno) => {
    setGuardandoId(turno.id);
    setMensaje(null);

    try {
      const respuesta = await fetch(`${API_URL}/${turno.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hora_inicio: turno.hora_inicio,
          hora_fin: turno.hora_fin,
        }),
      });

      if (!respuesta.ok) throw new Error('Error al actualizar');

      const actualizado: Turno = await respuesta.json();
      setTurnos((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)));
      setMensaje({
        tipo: 'ok',
        texto: `Horario del turno ${actualizado.nombre} actualizado correctamente.`,
      });
    } catch {
      setMensaje({
        tipo: 'error',
        texto: `No se pudo guardar el turno ${turno.nombre}. Verifica los datos.`,
      });
    } finally {
      setGuardandoId(null);
    }
  };

  const cruzaMedianoche = (inicio: string, fin: string) => inicio > fin;

  return (
    <div className="turnos-layout">
      <header className="turnos-navbar">
        <span className="turnos-badge">EESS • CONTROL OPERATIVO</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Panel de Administración</span>
          {onCerrarSesion && (
            <button
              onClick={onCerrarSesion}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              Volver al Login
            </button>
          )}
        </div>
      </header>

      <main className="turnos-container">
        <div className="turnos-header">
          <h1>Configuración de Turnos de Trabajo</h1>
          <p>Define los horarios oficiales de ingreso y salida para el cálculo automático de puntualidad.</p>
        </div>

        <div className="regla-banner">
          <strong>Regla de Tolerancia Activa:</strong> Todos los turnos cuentan con una tolerancia fija de{' '}
          <strong>5 minutos</strong>. A partir del minuto 6, la tardanza se computa desde la hora oficial de inicio.
        </div>

        {mensaje && (
          <div className={`alerta-estado ${mensaje.tipo === 'ok' ? 'alerta-ok' : 'alerta-error'}`}>
            {mensaje.texto}
          </div>
        )}

        {cargando ? (
          <p>Cargando turnos configurados...</p>
        ) : (
          <div className="turnos-grid">
            {turnos.map((turno) => (
              <div key={turno.id} className="turno-card">
                <div className="turno-card-header">
                  <h2>Turno {turno.nombre}</h2>
                  <span className="tolerancia-tag">Tolerancia: {turno.tolerancia_minutos} min</span>
                </div>

                <div className="campo-grupo">
                  <label>Hora de Inicio Oficial</label>
                  <input
                    type="time"
                    value={turno.hora_inicio.slice(0, 5)}
                    onChange={(e) => manejarCambioHora(turno.id, 'hora_inicio', e.target.value)}
                  />
                </div>

                <div className="campo-grupo">
                  <label>Hora de Fin Oficial</label>
                  <input
                    type="time"
                    value={turno.hora_fin.slice(0, 5)}
                    onChange={(e) => manejarCambioHora(turno.id, 'hora_fin', e.target.value)}
                  />
                </div>

                {cruzaMedianoche(turno.hora_inicio.slice(0, 5), turno.hora_fin.slice(0, 5)) && (
                  <div className="cruce-medianoche">
                    🌙 Este turno cruza la medianoche (finaliza al día siguiente).
                  </div>
                )}

                <button
                  className="btn-guardar"
                  onClick={() => guardarTurno(turno)}
                  disabled={guardandoId === turno.id}
                >
                  {guardandoId === turno.id ? 'Guardando...' : 'Guardar Horario'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ConfiguracionTurnosPage;