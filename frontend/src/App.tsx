import { LoginPage } from './pages/LoginPage';
import MarcajeKiosco from './pages/MarcajeKiosco';
import AdminTurnosPage from './pages/AdminTurnosPage';

function App() {
  const rutaActual = window.location.pathname;

  if (rutaActual === '/marcaje') {
    return <MarcajeKiosco />;
  }

  if (rutaActual === '/admin/turnos') {
    return <AdminTurnosPage />;
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoginPage />
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 50,
        }}
      >
        <a
          href="/marcaje"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #334155',
          }}
        >
          📷 Ir a Estación de Marcaje
        </a>
      </div>
    </div>
  );
}

export default App;