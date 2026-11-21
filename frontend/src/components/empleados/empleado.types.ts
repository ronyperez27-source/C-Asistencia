// ─── types/empleado.ts ───────────────────────────────────────────────────────
// Tipos compartidos entre los subcomponentes del módulo de empleados.

export interface EmpleadoResponse {
  id: number;
  dni: string;
  nombres: string;
  cargo: string;
  tarifa_hora: number;
  codigo_qr: string;
  activo: boolean;
}

export interface FormData {
  nombres: string;
  dni: string;
  cargo: string;
  tarifa_hora: string;
}

export interface FormErrors {
  nombres?: string;
  dni?: string;
  cargo?: string;
  tarifa_hora?: string;
}

export const FORM_INICIAL: FormData = {
  nombres: '',
  dni: '',
  cargo: '',
  tarifa_hora: '',
};

export const CARGOS_OPERATIVOS = ['Empleado', 'Supervisor'] as const;

export const API_EMPLEADOS = 'http://localhost:8000/api/v1/empleados/';
