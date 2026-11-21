interface AdminHeaderProps {
  paginaActiva: 'turnos' | 'empleados';
}

export default function AdminHeader({ paginaActiva }: AdminHeaderProps) {
  const cerrarSesion = () => {
    localStorage.removeItem('token_admin');
    window.location.href = '/';
  };

  const estiloTab = (activo: boolean): React.CSSProperties => ({
    padding: '0.45rem 1rem',
    borderRadius: '7px',
    fontWeight: 600,
    fontSize: '0.9rem',
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    transition: 'background 0.15s',
    ...(activo
      ? { backgroundColor: '#1d4ed8', color: '#fff' }
      : { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155' }),
  });

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        backgroundColor: '#0f172a',
        color: '#fff',
        padding: '1.1rem 1.75rem',
        borderRadius: '12px',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}
    >
      {/* Título */}
      <div>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
          ⛽ Grifo El Huamanguino — Panel Admin
        </h1>
        <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
          Sistema de Asistencia y Control de Personal
        </p>
      </div>

      {/* Navegación central: tabs */}
      <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <a href="/admin/turnos" style={estiloTab(paginaActiva === 'turnos')}>
          🕐 Turnos
        </a>
        <a href="/admin/empleados" style={estiloTab(paginaActiva === 'empleados')}>
          👷 Empleados
        </a>
      </nav>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <a
          href="/marcaje"
          style={{
            backgroundColor: '#0284c7',
            color: '#fff',
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
          }}
        >
          📷 Ir a Kiosco
        </a>
        <button
          onClick={cerrarSesion}
          style={{
            backgroundColor: '#dc2626',
            color: '#fff',
            border: 'none',
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.88rem',
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}
