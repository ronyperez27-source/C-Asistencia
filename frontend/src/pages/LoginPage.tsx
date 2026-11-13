import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [captchaCodigo, setCaptchaCodigo] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dibujarCaptchaEnCanvas = (texto: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo base
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Líneas de ruido
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(30, 58, 138, ${Math.random() * 0.4 + 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Puntos de ruido
    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dibujar cada carácter con ligera rotación
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < texto.length; i++) {
      const char = texto[i];
      const x = 18 + i * 24;
      const y = canvas.height / 2 + (Math.random() * 6 - 3);
      const angulo = (Math.random() - 0.5) * 0.45;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angulo);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  };

  const cargarCaptcha = async () => {
    try {
      const { data } = await axios.get('http://localhost:8000/api/v1/auth/captcha');
      setCaptchaCodigo(data.pregunta);
      setCaptchaToken(data.captcha_token);
      setCaptchaAnswer('');
    } catch {
      setError('No se pudo cargar el código de verificación. Verifica que el backend esté activo.');
    }
  };

  useEffect(() => {
    cargarCaptcha();
  }, []);

  useEffect(() => {
    if (captchaCodigo) {
      dibujarCaptchaEnCanvas(captchaCodigo);
    }
  }, [captchaCodigo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const { data } = await axios.post('http://localhost:8000/api/v1/auth/login', {
        username,
        password,
        captcha_token: captchaToken,
        captcha_answer: captchaAnswer,
      });

      localStorage.setItem('token_admin', data.access_token);
      alert('¡Bienvenida Administradora! Acceso concedido al sistema.');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Error al iniciar sesión');
      } else {
        setError('Ocurrió un error inesperado');
      }
      cargarCaptcha();
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="brand-badge">EESS • CONTROL OPERATIVO</div>
        <h1 className="hero-title">Sistema de Gestión de Asistencia y Planillas</h1>
        <p className="hero-text">
          Plataforma administrativa para el control de turnos, validación de puntualidad,
          gestión de personal y cálculo automatizado de planillas de la estación de servicio.
        </p>
        <div className="security-note">
          🔒 Acceso restringido exclusivamente a personal administrativo autorizado.
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <div className="icon-circle">⛽</div>
            <h2 className="login-title">Iniciar Sesión</h2>
            <p className="login-subtitle">Ingresa tus credenciales de Administradora</p>
          </div>

          {error && (
            <div className="error-box">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Usuario</label>
              <input
                type="text"
                placeholder="Ej. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Contraseña</label>
              <div className="password-wrapper">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input password-input"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="toggle-btn"
                >
                  {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Verificación de Seguridad (CAPTCHA)</label>
              <div className="captcha-row">
                <div className="captcha-box" style={{ padding: '0.25rem 0.5rem' }}>
                  <canvas
                    ref={canvasRef}
                    width={145}
                    height={38}
                    style={{ borderRadius: '4px', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={cargarCaptcha}
                    title="Generar nuevo código"
                    className="refresh-btn"
                  >
                    🔄
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Código"
                  maxLength={5}
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                  required
                  className="captcha-input"
                  style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
                />
              </div>
            </div>

            <button type="submit" disabled={cargando} className="submit-btn">
              {cargando ? 'Verificando credenciales...' : 'Ingresar al Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};