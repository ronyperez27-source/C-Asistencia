import React from 'react';
import { Clock, Users, Wallet, Monitor, LogOut } from 'lucide-react';
import './AdminLayout.css';

interface AdminLayoutProps {
  paginaActiva: 'turnos' | 'empleados' | 'planilla';
  titulo?: string;
  subtitulo?: string;
  children: React.ReactNode;
}

export default function AdminLayout({
  paginaActiva,
  titulo,
  subtitulo,
  children,
}: AdminLayoutProps) {
  const cerrarSesion = () => {
    localStorage.removeItem('token_admin');
    window.location.href = '/';
  };

  return (
    <div className="admin-layout">
      {/* ── Navbar Unificada ── */}
      <header className="admin-navbar no-print">
        <div className="admin-navbar__inner">
          {/* Marca / Logotipo oficial */}
          <div className="admin-navbar__brand">
            <div className="admin-navbar__logo-badge" title="Grifo El Huamanguino">
              <img
                src="/logo-huamanguino.svg"
                alt="Grifo El Huamanguino"
                className="admin-navbar__logo-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-huamanguino.jpg';
                }}
              />
            </div>
            <div className="admin-navbar__brand-text">
              <span className="admin-navbar__title">GRIFO EL HUAMANGUINO</span>
              <span className="admin-navbar__subtitle">Estación de Servicio EESS — Ayacucho</span>
            </div>
          </div>

          {/* Navegación de pestañas */}
          <nav className="admin-navbar__nav" aria-label="Navegación del panel">
            <a
              href="/admin/turnos"
              className={`admin-tab ${
                paginaActiva === 'turnos' ? 'admin-tab--active' : 'admin-tab--inactive'
              }`}
            >
              <Clock size={16} />
              <span>Turnos</span>
            </a>
            <a
              href="/admin/empleados"
              className={`admin-tab ${
                paginaActiva === 'empleados' ? 'admin-tab--active' : 'admin-tab--inactive'
              }`}
            >
              <Users size={16} />
              <span>Empleados</span>
            </a>
            <a
              href="/admin/planilla"
              className={`admin-tab ${
                paginaActiva === 'planilla' ? 'admin-tab--active' : 'admin-tab--inactive'
              }`}
            >
              <Wallet size={16} />
              <span>Planilla</span>
            </a>
          </nav>

          {/* Acciones del sistema */}
          <div className="admin-navbar__actions">
            <a href="/marcaje" className="admin-btn-action admin-btn-kiosco" title="Ir a Kiosco de Marcaje">
              <Monitor size={15} />
              <span>Ir a Kiosco</span>
            </a>
            <button
              onClick={cerrarSesion}
              className="admin-btn-action admin-btn-logout"
              title="Cerrar sesión administrativa"
            >
              <LogOut size={15} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenido de la Página ── */}
      <main className="admin-content">
        {(titulo || subtitulo) && (
          <div className="admin-page-header no-print">
            <div>
              {titulo && <h1 className="admin-page-header__title">{titulo}</h1>}
              {subtitulo && <p className="admin-page-header__subtitle">{subtitulo}</p>}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
