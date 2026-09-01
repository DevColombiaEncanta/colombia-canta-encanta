import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../context/AdminAuthContext';

// 5.2 · Decisión del usuario (2026-08-14): el menú solo muestra secciones que
// ya existen de verdad — nada de links "próximamente" a Eventos/Tienda/etc.
// Se agrega una entrada acá mismo cuando la pantalla real quede construida.
const SECCIONES = [
  { to: '/admin/hero', label: 'Carrusel (Hero)', emoji: '🖼️' },
  { to: '/admin/noticias', label: 'Noticias', emoji: '📰' },
  { to: '/admin/eventos', label: 'Eventos', emoji: '🎪' },
  { to: '/admin/eventos-fijos', label: 'Eventos Fijos', emoji: '📅' },
  { to: '/admin/productos', label: 'Productos', emoji: '🛍️' },
  { to: '/admin/cursos', label: 'Cursos', emoji: '🎓' },
  { to: '/admin/inscripciones', label: 'Inscripciones', emoji: '📝' },
  { to: '/admin/reservas', label: 'Reservas', emoji: '🎟️' },
  { to: '/admin/pedidos', label: 'Pedidos', emoji: '📦' },
];

// 5.7 · Aparte del array de arriba porque estas entradas no son para todos los
// admins. Administradores: solo el maestro puede invitar/desactivar/resetear
// MFA de otros. Historial (agregado 2026-08-31, a pedido del usuario): ve la
// actividad de TODOS los admins, no solo la propia, así que se restringe al
// mismo criterio (también reforzado server-side, ver `requireRole` en
// `backend/src/index.js` — esto no es solo un ajuste visual).
const SECCIONES_MAESTRO = [
  { to: '/admin/administradores', label: 'Administradores', emoji: '👤' },
  { to: '/admin/historial', label: 'Historial', emoji: '🕓' },
];

// ⭐ Ajuste 5.2 (2026-08-14, pedido tras probar el panel real): en tablet/
// mobile (≤1024px, mismo corte que ya usa el Navbar del sitio público — ver
// Navbar.css) el menú lateral fijo de 240px ya no cabe junto al contenido.
// Se convierte en un panel deslizable con el mismo patrón que el drawer del
// Navbar público (fondo oscuro + `aside` que entra desde la izquierda) para
// que la interacción le resulte familiar a alguien no técnico que ya usó el
// menú del sitio — no un patrón nuevo que aprender.
export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [abierto, setAbierto] = useState(false);

  // ⭐ Hallazgo real (revisión crítica 5.2, 2026-08-15): el `<aside>` solo se
  // comporta como drawer colapsable en ≤1024px (ver AdminLayout.css) — en
  // desktop es un menú fijo siempre visible, `abierto` nunca pasa a `true`
  // ahí porque el botón hamburguesa que lo cambia ni se muestra. Marcar
  // `aria-hidden={!abierto}` sin este chequeo habría escondido el menú
  // COMPLETO de lectores de pantalla en desktop, todo el tiempo — hace falta
  // saber si estamos en modo drawer antes de usar `abierto` para eso.
  const [esDrawer, setEsDrawer] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const escuchar = (e) => setEsDrawer(e.matches);
    mq.addEventListener('change', escuchar);
    return () => mq.removeEventListener('change', escuchar);
  }, []);

  // Cierra el drawer al navegar (link, atrás/adelante del navegador, o
  // navigate() programático) — ajustado durante el render en vez de en un
  // efecto (mismo criterio que ya usa este proyecto, ver Hero.jsx/Noticias.jsx
  // y https://react.dev/learn/you-might-not-need-an-effect), para no violar
  // react-hooks/set-state-in-effect con un setState síncrono.
  const [ultimaLocationKey, setUltimaLocationKey] = useState(location.key);
  if (location.key !== ultimaLocationKey) {
    setUltimaLocationKey(location.key);
    setAbierto(false);
  }

  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [abierto]);

  async function manejarLogout() {
    await logout();
    navigate('/admin/login');
  }

  return (
    <>
      <div className="admin-topbar">
        <button
          className="admin-topbar-hamburger"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú del panel"
          aria-expanded={abierto}
          aria-controls="admin-sidebar-drawer"
        >
          <span />
          <span />
          <span />
        </button>
        <p className="admin-topbar-titulo">Panel de control</p>
      </div>

      <div
        className={`admin-sidebar-backdrop${abierto ? ' abierto' : ''}`}
        onClick={() => setAbierto(false)}
        aria-hidden="true"
      />

      {/* ⭐ Hallazgo real (revisión crítica 5.2, 2026-08-15): el comentario de
         arriba decía "mismo patrón que el drawer del Navbar público" pero
         faltaba justamente el `aria-hidden` que ese drawer sí tiene (ver
         Navbar.jsx) — sin esto, un lector de pantalla podía anunciar los
         links del menú como disponibles aunque estuvieran fuera de pantalla
         (con `transform`, no `display:none`) mientras el drawer está cerrado. */}
      <aside id="admin-sidebar-drawer" aria-hidden={esDrawer && !abierto} className={`admin-sidebar${abierto ? ' abierto' : ''}`}>
        <div className="admin-sidebar-header">
          <p className="admin-sidebar-titulo">Panel de control</p>
          <button
            className="admin-sidebar-cerrar"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>
        <nav className="admin-sidebar-nav">
          {SECCIONES.map((s) => {
            const activo = location.pathname.startsWith(s.to);
            return (
              <Link key={s.to} to={s.to} className={`admin-sidebar-link${activo ? ' activo' : ''}`}>
                <span className="admin-sidebar-emoji" aria-hidden="true">{s.emoji}</span>
                {s.label}
              </Link>
            );
          })}
          {admin?.rol === 'admin_maestro' && SECCIONES_MAESTRO.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className={`admin-sidebar-link${location.pathname.startsWith(s.to) ? ' activo' : ''}`}
            >
              <span className="admin-sidebar-emoji" aria-hidden="true">{s.emoji}</span>
              {s.label}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          {/* 2026-08-31, a pedido del usuario: saludo persistente y visible
             mientras se navega el panel — el email queda como respaldo para
             las cuentas que todavía no tienen `nombre` guardado (ver
             Bienvenida.jsx) y como tooltip completo en cualquier caso. */}
          <p className="admin-sidebar-usuario" title={admin?.email}>
            {admin?.nombre ? `¡Hola, ${admin.nombre}!` : admin?.email}
          </p>
          <button className="admin-sidebar-logout" onClick={manejarLogout}>Cerrar sesión</button>
        </div>
      </aside>
    </>
  );
}
