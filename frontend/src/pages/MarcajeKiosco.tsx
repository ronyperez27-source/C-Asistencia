import { useEffect, useRef, useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Maximize,
  Minimize,
  Radio,
} from 'lucide-react';
import './MarcajeKiosco.css';

interface AlertaMarcaje {
  tipo: 'exito' | 'error';
  titulo: string;
  empleado?: string;
  hora?: string;
  estado?: string;
}

const API_URL = 'http://localhost:8000/asistencia/marcar';

export default function MarcajeKiosco() {
  const [ahora, setAhora] = useState<Date>(new Date());
  const [alerta, setAlerta] = useState<AlertaMarcaje | null>(null);
  const [procesando, setProcesando] = useState<boolean>(false);
  const [esPantallaCompleta, setEsPantallaCompleta] = useState<boolean>(false);

  const bufferRef = useRef<string>('');
  const timerAlertaRef = useRef<number | null>(null);

  // Reloj en tiempo real
  useEffect(() => {
    const intervalo = window.setInterval(() => setAhora(new Date()), 1000);
    return () => window.clearInterval(intervalo);
  }, []);

  // Escuchar cambios de pantalla completa
  useEffect(() => {
    const manejarCambioFullscreen = () => {
      setEsPantallaCompleta(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', manejarCambioFullscreen);
    return () => document.removeEventListener('fullscreenchange', manejarCambioFullscreen);
  }, []);

  // CAH-33: Mostrar alerta exactamente 3 segundos y limpiar
  const mostrarAlertaTemporal = (nuevaAlerta: AlertaMarcaje) => {
    if (timerAlertaRef.current) {
      window.clearTimeout(timerAlertaRef.current);
    }
    setAlerta(nuevaAlerta);
    timerAlertaRef.current = window.setTimeout(() => {
      setAlerta(null);
    }, 3000);
  };

  // Enviar código leído al backend
  const procesarCodigo = async (codigoLeido: string) => {
    if (procesando) return;
    setProcesando(true);

    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_qr: codigoLeido }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        mostrarAlertaTemporal({
          tipo: 'error',
          titulo: 'LECTURA RECHAZADA',
          estado: data.detail || 'Código ilegible o no registrado en el sistema',
        });
        return;
      }

      const horaFormateada = new Date(data.fecha_hora).toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Extraer estado ("A tiempo" / "Tardanza" / "Completado")
      const estadoTexto = data.mensaje.includes('-')
        ? data.mensaje.split('-')[1].trim()
        : data.mensaje;

      mostrarAlertaTemporal({
        tipo: 'exito',
        titulo: data.mensaje,
        empleado: data.empleado_nombres,
        hora: horaFormateada,
        estado: estadoTexto,
      });
    } catch {
      mostrarAlertaTemporal({
        tipo: 'error',
        titulo: 'ERROR DE CONEXIÓN',
        estado: 'No se pudo conectar con el servidor de asistencia',
      });
    } finally {
      setProcesando(false);
    }
  };

  // CAH-32: Listener global para escáner USB (captura caracteres + Enter)
  useEffect(() => {
    const manejarTecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === 'Enter') {
        const codigo = bufferRef.current;
        bufferRef.current = '';
        if (codigo.trim().length > 0) {
          procesarCodigo(codigo.trim());
        }
        return;
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [procesando]);

  // Activar/desactivar pantalla completa (CAH-31)
  const alternarPantallaCompleta = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <main className="kiosco-container">
      {/* ── Encabezado Institucional ── */}
      <header className="kiosco-header">
        <div className="kiosco-logo-badge" title="Grifo El Huamanguino">
          <img
            src="/logo-huamanguino.svg"
            alt="Grifo El Huamanguino"
            className="kiosco-logo-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo-huamanguino.jpg';
            }}
          />
        </div>
        <h1>Grifo El Huamanguino</h1>
        <p className="kiosco-header-sub">Estación de Servicio EESS • Control de Asistencia</p>

        {/* Reloj Digital Tabular */}
        <div className="kiosco-reloj" aria-live="polite">
          {ahora.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
        <div className="kiosco-fecha">
          {ahora.toLocaleDateString('es-PE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </header>

      {/* ── Centro: Escáner Óptico o Alerta Temporal ── */}
      <section className="kiosco-centro">
        {!alerta ? (
          <div className="escaner-box">
            <div className="escaner-icono-box">
              <QrCode size={46} strokeWidth={1.8} />
            </div>
            <h2>Acerque su fotocheck al lector QR</h2>
            <p>
              El registro de ingreso o salida de turno se procesará de forma inmediata
              y quedará validado con la tolerancia oficial de la estación.
            </p>
          </div>
        ) : alerta.tipo === 'exito' ? (
          <div className="alerta-card alerta-verde" role="alert">
            <div className="alerta-icon-wrap">
              <CheckCircle2 size={44} strokeWidth={2.2} />
            </div>
            <p className="alerta-titulo">{alerta.titulo}</p>
            <p className="alerta-empleado">{alerta.empleado}</p>
            <div className="alerta-detalles-row">
              <span className="alerta-badge">Hora: {alerta.hora}</span>
              <span className="alerta-badge">Estado: {alerta.estado}</span>
            </div>
          </div>
        ) : (
          <div className="alerta-card alerta-roja" role="alert">
            <div className="alerta-icon-wrap">
              <AlertCircle size={44} strokeWidth={2.2} />
            </div>
            <p className="alerta-titulo">{alerta.titulo}</p>
            <p className="alerta-empleado" style={{ fontSize: '1.25rem', opacity: 0.95 }}>
              {alerta.estado}
            </p>
          </div>
        )}
      </section>

      {/* ── Pie de Kiosco ── */}
      <footer className="kiosco-footer">
        <div className="kiosco-footer-status">
          <span className="kiosco-status-dot" />
          <Radio size={14} style={{ color: '#10b981' }} />
          <span>Estación de Marcaje Activa (Lectura óptica USB / Cámara)</span>
        </div>
        <button
          type="button"
          className="btn-fullscreen"
          onClick={alternarPantallaCompleta}
          title="Alternar modo pantalla completa"
        >
          {esPantallaCompleta ? <Minimize size={15} /> : <Maximize size={15} />}
          <span>{esPantallaCompleta ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}</span>
        </button>
      </footer>
    </main>
  );
}
