import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { ConfiguracionTurnosPage } from './pages/ConfiguracionTurnosPage';

function App() {
  const [autenticado, setAutenticado] = useState<boolean>(() =>
    Boolean(localStorage.getItem('token_admin'))
  );

  const manejarLoginExitoso = () => {
    setAutenticado(true);
  };

  const manejarCerrarSesion = () => {
    localStorage.removeItem('token_admin');
    setAutenticado(false);
  };

  if (!autenticado) {
    return <LoginPage onLoginSuccess={manejarLoginExitoso} />;
  }

  return <ConfiguracionTurnosPage onCerrarSesion={manejarCerrarSesion} />;
}

export default App;