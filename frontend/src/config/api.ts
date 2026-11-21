// URL base de la API. Se puede sobreescribir por entorno con VITE_API_URL.
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
).replace(/\/+$/, '');
