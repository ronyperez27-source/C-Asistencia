import { useEffect, useState } from 'react';

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

  const cargarTurnos = async () => {
    try {
      const res = await fetch('http://localhost:8000/turnos/');
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
    const res = await fetch(`http://localhost:8000/turnos/${turno.id}`, {
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
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token_admin');
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', backgroundColor: '#0f172a', color: '#fff', padding: '1.25rem 1.75rem', borderRadius: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Grifo El Huamanguino — Panel de Administración</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>Configuración de Turnos y Tolerancia de Puntualidad</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href="/marcaje" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              Ir a Kiosco
            </a>
            <button onClick={cerrarSesion} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              Cerrar Sesión
            </button>
          </div>
        </header>

        {mensaje && (
          <div style={{ backgroundColor: '#dcfce7', border: '1px solid #22c55e', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
            ✅ {mensaje}
          </div>
        )}

        {cargando ? (
          <p>Cargando turnos...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {turnos.map((turno) => (
              <div key={turno.id} style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                <h2 style={{ marginTop: 0, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  Turno {turno.nombre}
                </h2>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={turno.hora_inicio.slice(0, 5)}
                    onChange={(e) => manejarCambio(turno.id, 'hora_inicio', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                    Hora de Fin
                  </label>
                  <input
                    type="time"
                    value={turno.hora_fin.slice(0, 5)}
                    onChange={(e) => manejarCambio(turno.id, 'hora_fin', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                    Tolerancia fija (minutos)
                  </label>
                  <input
                    type="number"
                    value={turno.tolerancia_minutos}
                    onChange={(e) => manejarCambio(turno.id, 'tolerancia_minutos', Number(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', color: '#0369a1', fontWeight: 600 }}>
                  ⏱️ Límite sin penalización: {turno.hora_limite.slice(0, 5)}
                </div>

                <button
                  onClick={() => guardarTurno(turno)}
                  style={{ width: '100%', backgroundColor: '#1d4ed8', color: '#fff', border: 'none', padding: '0.7rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Guardar Cambios
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}