import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { EmpleadoResponse } from './empleado.types';
import './empleados.css';

interface Props {
  empleado: EmpleadoResponse;
  onCerrar: () => void;
  titulo?: string;
  badgeTexto?: string;
}

export default function FotocheckCard({
  empleado,
  onCerrar,
  titulo = 'Fotocheck Generado',
  badgeTexto = '✅ Registro Exitoso',
}: Props) {
  const credencialRef = useRef<HTMLDivElement>(null);

  // ── Impresión directa ───────────────────────────────────────────────────────
  const manejarImprimir = () => {
    window.print();
  };

  // ── Descarga PNG oficial cargando la plantilla en Canvas ───────────────────
  const manejarDescargarPNG = async () => {
    const W = 1696;
    const H = 2528;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Cargar la plantilla oficial de fondo
    const imgTemplate = new Image();
    imgTemplate.crossOrigin = 'anonymous';
    imgTemplate.src = '/model-fotocheck.jpg';

    await new Promise<void>((resolve, reject) => {
      imgTemplate.onload = () => resolve();
      imgTemplate.onerror = () => {
        // Fallback a .png si el servidor lo requiere
        imgTemplate.src = '/model-fotocheck.png';
        imgTemplate.onload = () => resolve();
        imgTemplate.onerror = reject;
      };
    });

    ctx.drawImage(imgTemplate, 0, 0, W, H);

    // 2. Elemento 1: Nombre del empleado (centrado, mayúsculas, blanco, negrita)
    const nombreUpper = empleado.nombres.trim().toUpperCase();
    let fontSize = 62;
    if (nombreUpper.length > 28) fontSize = 44;
    else if (nombreUpper.length > 22) fontSize = 52;

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(nombreUpper, W / 2, 1025);

    // 3. Elemento 2: Cargo / Ocupación en píldora naranja-dorada
    const cargoUpper = empleado.cargo.trim().toUpperCase();
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    const metrics = ctx.measureText(cargoUpper);
    const pillW = metrics.width + 90;
    const pillH = 68;
    const pillX = (W - pillW) / 2;
    const pillY = 1210 - pillH / 2;

    ctx.save();
    const grad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY + pillH);
    grad.addColorStop(0, '#c98528');
    grad.addColorStop(1, '#e5a33c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (typeof (ctx as unknown as { roundRect?: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect === 'function') {
      (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(pillX, pillY, pillW, pillH, 34);
    } else {
      ctx.rect(pillX, pillY, pillW, pillH);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cargoUpper, W / 2, 1210);
    ctx.restore();

    // 4. Elemento 3: Código QR encajado en el recuadro blanco oficial (508, 1398, 682, 674)
    const svgEl = credencialRef.current?.querySelector('svg');
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = svgUrl;
      });

      const qrPadding = 16;
      ctx.drawImage(
        qrImg,
        508 + qrPadding,
        1398 + qrPadding,
        682 - qrPadding * 2,
        674 - qrPadding * 2
      );
      URL.revokeObjectURL(svgUrl);
    }

    // 5. Elemento 4: Código de marcaje puro en dorado debajo del cuadro QR
    ctx.font = 'bold 52px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(empleado.codigo_qr, W / 2, 2189);

    // 6. Descargar imagen
    const link = document.createElement('a');
    const nombreSlug = empleado.nombres
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    link.download = `fotocheck-${empleado.dni}-${nombreSlug}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div className="emp-fotocheck-container">
      {/* ── Encabezado de la ventana modal (solo pantalla) ── */}
      <div className="emp-fotocheck-ui-header no-print">
        <div>
          <div className="emp-fotocheck-ui-badge">{badgeTexto}</div>
          <div className="emp-fotocheck-ui-title">{titulo}</div>
        </div>
        <button
          className="emp-fotocheck-ui-close"
          onClick={onCerrar}
          title="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TARJETA DE FOTOCHECK OFICIAL
          Fondo: /model-fotocheck.jpg con proporción vertical exacta
          Superpuesto: ÚNICAMENTE los 4 elementos requeridos
          ═══════════════════════════════════════════════════════════════ */}
      <div
        id="fotocheck-imprimible"
        ref={credencialRef}
        className="emp-fotocheck-card"
      >
        {/* 1. Nombre completo */}
        <div className="emp-fotocheck-card__nombre">
          {empleado.nombres}
        </div>

        {/* 2. Cargo / Ocupación (píldora naranja-dorada) */}
        <div className="emp-fotocheck-card__cargo">
          {empleado.cargo.toUpperCase()}
        </div>

        {/* 3. Código QR encajado en el recuadro blanco */}
        <div className="emp-fotocheck-card__qr">
          <QRCodeSVG
            value={empleado.codigo_qr}
            size={250}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#000000"
            marginSize={1}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* 4. Código de marcaje puro en dorado */}
        <div className="emp-fotocheck-card__codigo">
          {empleado.codigo_qr}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CONTROLES Y DATOS ADMINISTRATIVOS EXTERNOS (no-print)
          Tarifa por hora + Botones de acción
          ═══════════════════════════════════════════════════════════════ */}
      <div className="emp-fotocheck-controles no-print">
        {/* Tarifa confidencial del trabajador */}
        <div className="emp-fotocheck-tarifa-box">
          <span className="emp-fotocheck-tarifa-label">Tarifa por hora:</span>
          <strong className="emp-fotocheck-tarifa-monto">S/ {empleado.tarifa_hora.toFixed(2)}</strong>
        </div>

        {/* Botones de acción */}
        <div className="emp-fotocheck-btn-group">
          <button
            type="button"
            className="emp-fotocheck-btn emp-fotocheck-btn--print"
            onClick={manejarImprimir}
            title="Imprimir Fotocheck en tamaño credencial"
          >
            🖨️ Imprimir
          </button>
          <button
            type="button"
            className="emp-fotocheck-btn emp-fotocheck-btn--download"
            onClick={manejarDescargarPNG}
            title="Descargar Fotocheck en alta resolución (PNG)"
          >
            ⬇️ Descargar PNG
          </button>
        </div>

        <p className="emp-fotocheck-help">
          Usa la opción de impresión para carnet físico (85×135mm) o descarga el PNG para enviar al empleado.
        </p>
      </div>
    </div>
  );
}
