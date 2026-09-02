import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useCarrito } from '../../context/CarritoContext';
import { useEventosFijos } from '../../hooks/useEventosFijos';
import './Navbar.css';

const IconoBase = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mobile-drawer-icon" aria-hidden="true">
    {children}
  </svg>
);

const IconoInicio = () => (
  <IconoBase>
    <path d="M3 9.5 12 3l9 6.5" />
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
  </IconoBase>
);

const IconoNosotros = () => (
  <IconoBase>
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </IconoBase>
);

const IconoEventos = () => (
  <IconoBase>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </IconoBase>
);

const IconoTienda = () => (
  <IconoBase>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </IconoBase>
);

const IconoInscripciones = () => (
  <IconoBase>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 12h6M9 16h6" />
  </IconoBase>
);

const IconoContacto = () => (
  <IconoBase>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6 12 13 2 6" />
  </IconoBase>
);

const IconoAdmin = () => (
  <IconoBase>
    <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" />
    <path d="M9.5 12 11 13.5 15 9.5" />
  </IconoBase>
);

const IconoCerrar = () => (
  <IconoBase>
    <path d="M18 6 6 18M6 6l12 12" />
  </IconoBase>
);

const IconoChevron = ({ abierto }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`mobile-drawer-chevron${abierto ? ' abierto' : ''}`} aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { totalItems } = useCarrito();
  const { eventosFijos } = useEventosFijos();

  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  let navClass = 'navbar';
  if (isHome) {
    if (scrolled) {
      navClass += ' navbar--white navbar--flotante';
    } else {
      navClass += ' navbar--transparent';
    }
  } else {
    navClass += ' navbar--sticky navbar--flotante';
  }

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const toggleMobile = (section) => {
    setMobileExpanded(prev => prev === section ? null : section);
  };

  return (
    <>
      <nav className={navClass}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Colombia Canta y Encanta" className="logo-img" />
          </Link>

          {/* Desktop links */}
          <div className="navbar-links">
            {/* Nosotros */}
            <div className="nav-group">
              <Link to="/nosotros" className={`nav-link${isActive('/nosotros') ? ' active' : ''}`}>
                Nosotros <span className="nav-chevron">▾</span>
              </Link>
              <div className="dropdown dropdown-simple">
                <Link to="/nosotros#quienes-somos">Quiénes somos</Link>
                <Link to="/elenco">Elenco artístico</Link>
                <Link to="/noticias">Noticias</Link>
                <Link to="/contacto">Contacto</Link>
              </div>
            </div>

            {/* Eventos — pedido del usuario (2026-09-02): el desplegable con
               tarjetas de imagen se sentía fuera de tono al lado de los
               demás links (Nosotros/Inscripciones, texto plano); mismo
               formato `dropdown-simple` acá. */}
            <div className="nav-group">
              <Link to="/eventos" className={`nav-link${isActive('/eventos') ? ' active' : ''}`}>
                Eventos <span className="nav-chevron">▾</span>
              </Link>
              <div className="dropdown dropdown-simple">
                {eventosFijos.map(ev => (
                  <Link to={`/eventos/${ev.slug}`} key={ev.id}>{ev.titulo}</Link>
                ))}
                <Link to="/eventos">Ver todos los eventos</Link>
              </div>
            </div>

            {/* Tienda — sin desplegable a propósito (pedido del usuario,
               2026-09-02): antes mostraba categorías (Camisetas, Hoodies,
               Bags, Otros) que en realidad llevaban todas al mismo lugar
               (/tienda) — ahora un click directo. */}
            <Link to="/tienda" className={`nav-link${isActive('/tienda') ? ' active' : ''}`}>
              Tienda
            </Link>

            {/* Inscripciones */}
            <div className="nav-group">
              <Link to="/inscripciones" className={`nav-link${isActive('/inscripciones') ? ' active' : ''}`}>
                Inscripciones <span className="nav-chevron">▾</span>
              </Link>
              <div className="dropdown dropdown-simple">
                <Link to="/inscripciones#cursos">Nuestros cursos</Link>
                <Link to="/inscripciones#como-inscribirse">Cómo inscribirse</Link>
                <Link to="/inscripciones#faq">Preguntas frecuentes</Link>
              </div>
            </div>

            <Link to="/contacto" className="btn-contacto">Contacto</Link>

            <Link to="/admin" className={`nav-link${isActive('/admin') ? ' active' : ''}`}>
              Admin
            </Link>
          </div>

          {/* Utilidades: siempre visibles en desktop y mobile */}
          <div className="navbar-utils">
            <button className="btn-tema" onClick={toggle} aria-label="Cambiar tema">
              <img
                src={`${import.meta.env.BASE_URL}${theme === 'dark' ? 'iconos-modo/icono-sol.webp' : 'iconos-modo/icono-luna.webp'}`}
                alt=""
                className="tema-icono-img"
              />
            </button>
            <button className="btn-carrito" onClick={() => navigate('/tienda/carrito')}>
              <img
                src={`${import.meta.env.BASE_URL}${theme === 'dark' ? 'carrito-de-compras.png' : 'carrito-de-compras (1).png'}`}
                alt="Carrito"
                className="carrito-icono-img"
              />
              {totalItems > 0 && <span className="carrito-badge">{totalItems}</span>}
            </button>
          </div>

          {/* Hamburger */}
          <button className={`navbar-hamburger${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(o => !o)} aria-label="Menú">
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            {totalItems > 0 && <span className="hamburger-badge">{totalItems}</span>}
          </button>
        </div>
      </nav>

      {/* Fondo oscuro detrás del panel lateral */}
      <div
        className={`mobile-backdrop${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Panel lateral (drawer) */}
      <aside className={`mobile-drawer${mobileOpen ? ' open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="mobile-drawer-header">
          <Link to="/" className="mobile-drawer-logo" onClick={() => setMobileOpen(false)}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Colombia Canta y Encanta" />
          </Link>
          <button className="mobile-drawer-cerrar" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
            <IconoCerrar />
          </button>
        </div>

        <nav className="mobile-drawer-nav">
          <Link to="/" className="mobile-drawer-link">
            <span className="mobile-drawer-link-left"><IconoInicio /> Inicio</span>
          </Link>

          <div className="mobile-drawer-group">
            <button className="mobile-drawer-link mobile-drawer-link--toggle" onClick={() => toggleMobile('nosotros')}>
              <span className="mobile-drawer-link-left"><IconoNosotros /> Nosotros</span>
              <IconoChevron abierto={mobileExpanded === 'nosotros'} />
            </button>
            {mobileExpanded === 'nosotros' && (
              <div className="mobile-drawer-submenu">
                <Link to="/nosotros#quienes-somos">Quiénes somos</Link>
                <Link to="/elenco">Elenco artístico</Link>
                <Link to="/noticias">Noticias</Link>
              </div>
            )}
          </div>

          <div className="mobile-drawer-group">
            <button className="mobile-drawer-link mobile-drawer-link--toggle" onClick={() => toggleMobile('eventos')}>
              <span className="mobile-drawer-link-left"><IconoEventos /> Eventos</span>
              <IconoChevron abierto={mobileExpanded === 'eventos'} />
            </button>
            {mobileExpanded === 'eventos' && (
              <div className="mobile-drawer-submenu">
                {eventosFijos.map(ev => (
                  <Link to={`/eventos/${ev.slug}`} key={ev.id}>{ev.titulo}</Link>
                ))}
                <Link to="/eventos">Ver todos →</Link>
              </div>
            )}
          </div>

          <Link to="/tienda" className="mobile-drawer-link">
            <span className="mobile-drawer-link-left"><IconoTienda /> Tienda</span>
          </Link>

          <button className="mobile-drawer-link" onClick={() => { setMobileOpen(false); navigate('/tienda/carrito'); }}>
            <span className="mobile-drawer-link-left">
              <img
                src={`${import.meta.env.BASE_URL}${theme === 'dark' ? 'carrito-de-compras.png' : 'carrito-de-compras (1).png'}`}
                alt=""
                className="mobile-drawer-icon mobile-drawer-icon-img"
              />
              Carrito
            </span>
            {totalItems > 0 && <span className="mobile-carrito-badge">{totalItems}</span>}
          </button>

          <Link to="/inscripciones" className="mobile-drawer-link">
            <span className="mobile-drawer-link-left"><IconoInscripciones /> Inscripciones</span>
          </Link>

          <Link to="/contacto" className="mobile-drawer-link">
            <span className="mobile-drawer-link-left"><IconoContacto /> Contacto</span>
          </Link>

          <Link to="/admin" className="mobile-drawer-link">
            <span className="mobile-drawer-link-left"><IconoAdmin /> Panel administrativo</span>
          </Link>
        </nav>

        <div className="mobile-drawer-footer">
          <button className="mobile-drawer-tema" onClick={toggle}>
            <img
              src={`${import.meta.env.BASE_URL}${theme === 'dark' ? 'iconos-modo/icono-sol.webp' : 'iconos-modo/icono-luna.webp'}`}
              alt=""
            />
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <Link to="/inscripciones" className="mobile-drawer-cta" onClick={() => setMobileOpen(false)}>
            Inscríbete ahora →
          </Link>
        </div>
      </aside>
    </>
  );
}
