import { useEffect, type ReactNode } from 'react';
import { Monitor } from 'lucide-react';
import { LoginPage } from './pages/LoginPage';
import MarcajeKiosco from './pages/MarcajeKiosco';
import AdminTurnosPage from './pages/AdminTurnosPage';
import AdminEmpleadosPage from './pages/AdminEmpleadosPage';
import AdminPlanillaPage from './pages/AdminPlanillaPage';

function RutaProtegida({ children }: { children: ReactNode }) {
  const autenticado = Boolean(localStorage.getItem('token_admin'));

  useEffect(() => {
    if (!autenticado) window.location.replace('/');
  }, [autenticado]);

  if (!autenticado) return null;
  return <>{children}</>;
}

function App() {
  const rutaActual = window.location.pathname;

  if (rutaActual === '/marcaje') {
    return <MarcajeKiosco />;
  }

  if (rutaActual === '/admin/turnos') {
    return <AdminTurnosPage />;
  }

  if (rutaActual === '/admin/empleados') {
    return <AdminEmpleadosPage />;
  }

  if (rutaActual === '/admin/planilla') {
    return (
      <RutaProtegida>
        <AdminPlanillaPage />
      </RutaProtegida>
    );
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
            backgroundColor: '#071426',
            color: '#f8fafc',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: '0 4px 14px rgba(7, 20, 38, 0.4)',
            border: '1px solid #1e293b',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0f2744';
            e.currentTarget.style.borderColor = '#ea580c';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#071426';
            e.currentTarget.style.borderColor = '#1e293b';
            e.currentTarget.style.color = '#f8fafc';
          }}
        >
          <Monitor size={17} style={{ color: '#ea580c' }} />
          <span>Ir a Estación de Marcaje</span>
        </a>
      </div>
    </div>
  );
}

export default App;
