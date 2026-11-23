import React, { useEffect, useRef, useState } from 'react';
import { Clock, Users, Wallet, Monitor, LogOut, Menu, X } from 'lucide-react';
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
  const [menuAbierto, setMenuAbierto] = useState(false);
  const botonMenuRef = useRef<HTMLButtonElement>(null);

  const cerrarSesion = () => {
    localStorage.removeItem('token_admin');
    window.location.href = '/';
  };

  const cerrarMenu = () => setMenuAbierto(false);

  useEffect(() => {
    if (!menuAbierto) return;

    const alPresionarEscape = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return;
      setMenuAbierto(false);
      botonMenuRef.current?.focus();
    };

    document.addEventListener('keydown', alPresionarEscape);
    return () => document.removeEventListener('keydown', alPresionarEscape);
  }, [menuAbierto]);

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

          {/* Botón de menú para tablet y móvil */}
          <button
            ref={botonMenuRef}
            type="button"
            className="admin-navbar__toggle"
            aria-label={menuAbierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            aria-expanded={menuAbierto}
            aria-controls="admin-navbar-menu"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            {menuAbierto ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>

          {/* Navegación y acciones del sistema */}
          <div
            id="admin-navbar-menu"
            className={`admin-navbar__menu${
              menuAbierto ? ' admin-navbar__menu--abierto' : ''
            }`}
          >
            <nav className="admin-navbar__nav" aria-label="Navegación del panel">
              <a
                href="/admin/turnos"
                className={`admin-tab ${
                  paginaActiva === 'turnos' ? 'admin-tab--active' : 'admin-tab--inactive'
                }`}
                aria-current={paginaActiva === 'turnos' ? 'page' : undefined}
                onClick={cerrarMenu}
              >
                <Clock size={16} aria-hidden="true" />
                <span>Turnos</span>
              </a>
              <a
                href="/admin/empleados"
                className={`admin-tab ${
                  paginaActiva === 'empleados' ? 'admin-tab--active' : 'admin-tab--inactive'
                }`}
                aria-current={paginaActiva === 'empleados' ? 'page' : undefined}
                onClick={cerrarMenu}
              >
                <Users size={16} aria-hidden="true" />
                <span>Empleados</span>
              </a>
              <a
                href="/admin/planilla"
                className={`admin-tab ${
                  paginaActiva === 'planilla' ? 'admin-tab--active' : 'admin-tab--inactive'
                }`}
                aria-current={paginaActiva === 'planilla' ? 'page' : undefined}
                onClick={cerrarMenu}
              >
                <Wallet size={16} aria-hidden="true" />
                <span>Planilla</span>
              </a>
            </nav>

            <div className="admin-navbar__actions">
              <a
                href="/marcaje"
                className="admin-btn-action admin-btn-kiosco"
                title="Ir a Kiosco de Marcaje"
                onClick={cerrarMenu}
              >
                <Monitor size={15} aria-hidden="true" />
                <span>Ir a Kiosco</span>
              </a>
              <button
                onClick={cerrarSesion}
                className="admin-btn-action admin-btn-logout"
                title="Cerrar sesión administrativa"
              >
                <LogOut size={15} aria-hidden="true" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Contenido de la Página ── */}
      <main className="admin-content">
        {(titulo || subtitulo) && (
          <div className="admin-page-header no-print">
            <div className="admin-page-header__text">
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
