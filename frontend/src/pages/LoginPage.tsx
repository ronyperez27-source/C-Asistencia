import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Fuel,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
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
      window.location.href = '/admin/turnos';
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
      {/* ── Panel Izquierdo Hero ── */}
      <div className="login-left">
        <div className="brand-badge">
          <Fuel size={14} />
          <span>EESS • AYACUCHO</span>
        </div>
        <h1 className="hero-title">
          Grifo El Huamanguino <br />
          <span className="hero-title__highlight">Gestión de Asistencia & Planillas</span>
        </h1>
        <p className="hero-text">
          Plataforma administrativa para la configuración de turnos operativos, control de puntualidad
          en tiempo real y cálculo automatizado de personal para la estación de servicio.
        </p>

        <div className="hero-features">
          <div className="hero-feature-item">
            <Clock size={18} className="hero-feature-icon" />
            <div className="hero-feature-text">
              <strong>Control de Turnos y Tolerancia</strong>
              <span>Programación exacta de horarios operativos y límites de puntualidad.</span>
            </div>
          </div>
          <div className="hero-feature-item">
            <Fuel size={18} className="hero-feature-icon" />
            <div className="hero-feature-text">
              <strong>Kiosco de Marcaje Autónomo</strong>
              <span>Estación rápida de lectura óptica por código QR para despachadores y supervisores.</span>
            </div>
          </div>
        </div>

        <div className="security-note">
          <ShieldCheck size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span>Acceso restringido exclusivamente a la Administradora y jefatura autorizada.</span>
        </div>
      </div>

      {/* ── Panel Derecho: Formulario de Login ── */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            {/* Logotipo Oficial en reemplazo del surtidor genérico */}
            <div className="login-logo-container">
              <img
                src="/logo-huamanguino.svg"
                alt="Grifo El Huamanguino"
                className="login-logo-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-huamanguino.jpg';
                }}
              />
            </div>
            <h2 className="login-title">Iniciar Sesión</h2>
            <p className="login-subtitle">Ingresa tus credenciales de Administradora</p>
          </div>

          {error && (
            <div className="error-box" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-username">Usuario</label>
              <input
                id="login-username"
                type="text"
                placeholder="Ej. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="form-input"
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password">Contraseña</label>
              <div className="password-wrapper">
                <input
                  id="login-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input password-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="toggle-btn"
                  title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Verificación de Seguridad (CAPTCHA)</label>
              <div className="captcha-row">
                <div className="captcha-box">
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
                    aria-label="Generar nuevo código"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="CÓDIGO"
                  maxLength={5}
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                  required
                  className="captcha-input"
                  autoComplete="off"
                />
              </div>
            </div>

            <button type="submit" disabled={cargando} className="submit-btn">
              <span>{cargando ? 'Verificando credenciales…' : 'Ingresar al Panel'}</span>
              {!cargando && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
