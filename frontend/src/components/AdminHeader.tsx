import AdminLayout from './AdminLayout';

interface AdminHeaderProps {
  paginaActiva: 'turnos' | 'empleados';
}

/**
 * @deprecated Prefer usar <AdminLayout paginaActiva="..."> directamente para englobar el contenido.
 */
export default function AdminHeader({ paginaActiva }: AdminHeaderProps) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <AdminLayout paginaActiva={paginaActiva}>{null}</AdminLayout>
    </div>
  );
}
