import { useEffect, useRef, useState } from "react";
import "./MarcajeKiosco.css";

interface AlertaMarcaje {
  tipo: "exito" | "error";
  titulo: string;
  empleado?: string;
  hora?: string;
  estado?: string;
}

const API_URL = "http://localhost:8000/asistencia/marcar";

export default function MarcajeKiosco() {
  const [ahora, setAhora] = useState<Date>(new Date());
  const [alerta, setAlerta] = useState<AlertaMarcaje | null>(null);
  const [procesando, setProcesando] = useState<boolean>(false);

  const bufferRef = useRef<string>("");
  const timerAlertaRef = useRef<number | null>(null);

  // Reloj en tiempo real
  useEffect(() => {
    const intervalo = window.setInterval(() => setAhora(new Date()), 1000);
    return () => window.clearInterval(intervalo);
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo_qr: codigoLeido }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        mostrarAlertaTemporal({
          tipo: "error",
          titulo: "LECTURA RECHAZADA",
          estado: data.detail || "Código ilegible o no registrado",
        });
        return;
      }

      const horaFormateada = new Date(data.fecha_hora).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // Extraer estado ("A tiempo" / "Tardanza" / "Completado")
      const estadoTexto = data.mensaje.includes("-")
        ? data.mensaje.split("-")[1].trim()
        : data.mensaje;

      mostrarAlertaTemporal({
        tipo: "exito",
        titulo: data.mensaje,
        empleado: data.empleado_nombres,
        hora: horaFormateada,
        estado: estadoTexto,
      });
    } catch {
      mostrarAlertaTemporal({
        tipo: "error",
        titulo: "ERROR DE CONEXIÓN",
        estado: "No se pudo conectar con el servidor de asistencia",
      });
    } finally {
      setProcesando(false);
    }
  };

  // CAH-32: Listener global para escáner USB (captura caracteres + Enter)
  useEffect(() => {
    const manejarTecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === "Enter") {
        const codigo = bufferRef.current;
        bufferRef.current = "";
        procesarCodigo(codigo);
        return;
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
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
      <header className="kiosco-header">
        <h1>GRIFO EL HUAMANGUINO — CONTROL DE ASISTENCIA</h1>
        <div className="kiosco-reloj">
          {ahora.toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
        <div className="kiosco-fecha">
          {ahora.toLocaleDateString("es-PE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </header>

      <section className="kiosco-centro">
        {!alerta ? (
          <div className="escaner-box">
            <div className="escaner-icono">📷</div>
            <h2>Acerque su fotocheck o DNI al escáner</h2>
            <p>El registro se realizará de forma automática</p>
          </div>
        ) : alerta.tipo === "exito" ? (
          <div className="alerta-card alerta-verde" role="alert">
            <p className="alerta-titulo">✓ {alerta.titulo}</p>
            <p className="alerta-empleado">{alerta.empleado}</p>
            <p className="alerta-detalle">Hora exacta: {alerta.hora}</p>
            <p className="alerta-detalle">Estado: {alerta.estado}</p>
          </div>
        ) : (
          <div className="alerta-card alerta-roja" role="alert">
            <p className="alerta-titulo">✕ {alerta.titulo}</p>
            <p className="alerta-detalle">{alerta.estado}</p>
          </div>
        )}
      </section>

      <footer className="kiosco-footer">
        <span>Modo Estación de Marcaje Activo</span>
        <button
          type="button"
          className="btn-fullscreen"
          onClick={alternarPantallaCompleta}
        >
          Pantalla Completa
        </button>
      </footer>
    </main>
  );
}