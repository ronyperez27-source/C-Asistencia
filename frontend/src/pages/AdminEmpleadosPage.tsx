import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, QrCode } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import EmpleadoForm from '../components/empleados/EmpleadoForm';
import FotocheckCard from '../components/empleados/FotocheckCard';
import EmpleadosTable from '../components/empleados/EmpleadosTable';
import type { EmpleadoResponse, FormData, FormErrors } from '../components/empleados/empleado.types';
import { FORM_INICIAL, API_EMPLEADOS } from '../components/empleados/empleado.types';
import '../components/empleados/empleados.css';

// ─── Tipos internos ───────────────────────────────────────────────────────────

type AlertaKind = 'exito' | 'dni_dup' | 'error' | null;

interface Alerta {
  kind: AlertaKind;
  mensaje?: string;
}

// ─── Helpers de autenticación ─────────────────────────────────────────────────

function buildHeaders(): HeadersInit {
  const token = localStorage.getItem('token_admin');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ─── Página orquestadora ──────────────────────────────────────────────────────

export default function AdminEmpleadosPage() {
  const [empleados, setEmpleados] = useState<EmpleadoResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState<FormData>(FORM_INICIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [alerta, setAlerta] = useState<Alerta>({ kind: null });
  const [fotocheckEmpleado, setFotocheckEmpleado] = useState<EmpleadoResponse | null>(null);

  // ── Carga de empleados ────────────────────────────────────────────────────

  const cargarEmpleados = async () => {
    try {
      const res = await fetch(API_EMPLEADOS, { headers: buildHeaders() });
      if (res.ok) {
        const data: EmpleadoResponse[] = await res.json();
        setEmpleados(data);
      }
    } catch (err) {
      console.error('Error al cargar empleados:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  // ── Validación cliente ────────────────────────────────────────────────────

  const validar = (): boolean => {
    const e: FormErrors = {};
    if (!form.nombres.trim() || form.nombres.trim().length < 3) {
      e.nombres = 'Mínimo 3 caracteres requeridos.';
    }
    if (!/^\d{8}$/.test(form.dni)) {
      e.dni = 'El DNI debe tener exactamente 8 dígitos numéricos.';
    }
    if (!form.cargo) {
      e.cargo = 'Selecciona un cargo.';
    }
    const tarifa = parseFloat(form.tarifa_hora);
    if (isNaN(tarifa) || tarifa <= 0) {
      e.tarifa_hora = 'La tarifa debe ser un número mayor a 0.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Handlers de formulario ────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Solo dígitos y teclas de navegación en el campo DNI
  const handleDniKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (nav.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  // ── Envío POST ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlerta({ kind: null });
    if (!validar()) return;

    setEnviando(true);
    try {
      const payload = {
        nombres: form.nombres.trim(),
        dni: form.dni,
        cargo: form.cargo,
        tarifa_hora: parseFloat(form.tarifa_hora),
      };

      const res = await fetch(API_EMPLEADOS, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.status === 201 || res.status === 200) {
        const nuevo: EmpleadoResponse = await res.json();
        setForm(FORM_INICIAL);
        setErrors({});
        setFotocheckEmpleado(nuevo);
        setAlerta({ kind: 'exito', mensaje: `Empleado "${nuevo.nombres}" registrado exitosamente.` });
        await cargarEmpleados();
      } else if (res.status === 400 || res.status === 409) {
        let detalle = 'El DNI ya se encuentra registrado';
        try {
          const errData = await res.json();
          if (typeof errData?.detail === 'string' && !errData.detail.toLowerCase().includes('dni')) {
            detalle = errData.detail;
          }
        } catch { /* usa mensaje por defecto */ }
        setAlerta({ kind: 'dni_dup', mensaje: detalle });
        setFotocheckEmpleado(null);
      } else {
        setAlerta({ kind: 'error', mensaje: 'Ocurrió un error inesperado. Intenta de nuevo.' });
        setFotocheckEmpleado(null);
      }
    } catch {
      setAlerta({ kind: 'error', mensaje: 'No se pudo conectar con el servidor.' });
      setFotocheckEmpleado(null);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AdminLayout
      paginaActiva="empleados"
      titulo="Gestión de Personal Operativo"
      subtitulo="Registro de trabajadores, asignación de código QR y emisión oficial de fotochecks"
    >
      {/* ── Alertas visuales con iconografía fina ── */}
      {alerta.kind === 'exito' && (
        <div className="emp-alerta emp-alerta--exito">
          <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
          <span>{alerta.mensaje}</span>
        </div>
      )}
      {alerta.kind === 'dni_dup' && (
        <div className="emp-alerta emp-alerta--dni-dup">
          <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
          <span>{alerta.mensaje}</span>
        </div>
      )}
      {alerta.kind === 'error' && (
        <div className="emp-alerta emp-alerta--error">
          <AlertCircle size={18} style={{ color: '#ea580c', flexShrink: 0 }} />
          <span>{alerta.mensaje}</span>
        </div>
      )}

      {/* ── Grid Principal: Formulario + Tarjeta Fotocheck ── */}
      <div className="emp-page__grid">
        <EmpleadoForm
          form={form}
          errors={errors}
          enviando={enviando}
          onChange={handleChange}
          onDniKeyDown={handleDniKeyDown}
          onSubmit={handleSubmit}
        />

        <div>
          {fotocheckEmpleado ? (
            <FotocheckCard
              empleado={fotocheckEmpleado}
              onCerrar={() => setFotocheckEmpleado(null)}
            />
          ) : (
            <div className="emp-fotocheck-placeholder">
              <div className="emp-fotocheck-placeholder__icon">
                <QrCode size={48} strokeWidth={1.5} />
              </div>
              <p className="emp-fotocheck-placeholder__text">
                El fotocheck oficial con código QR se generará aquí tras el registro del trabajador.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabla de Personal ── */}
      <EmpleadosTable empleados={empleados} cargando={cargando} />
    </AdminLayout>
  );
}
