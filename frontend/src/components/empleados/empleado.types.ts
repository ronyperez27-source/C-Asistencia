// ─── types/empleado.ts ───────────────────────────────────────────────────────
// Tipos compartidos entre los subcomponentes del módulo de empleados.

import { API_BASE_URL } from '../../config/api';

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

export const API_EMPLEADOS = `${API_BASE_URL}/empleados/`;
