import { useState } from "react";
import { Link } from "react-router-dom";
import { redesSociales } from "../../data/redesSociales";
import "./Footer.css";

const navLinks = [
  { label: "Inicio",    to: "/" },
  { label: "Nosotros",  to: "/nosotros" },
  { label: "Eventos",   to: "/eventos" },
  { label: "Escuela",   to: "/inscripciones" },
  { label: "Tienda",    to: "/tienda" },
  { label: "Noticias",  to: "/noticias" },
];

const cols = [
  {
    titulo: "Inicio",
    links: [
      { label: "Página principal", to: "/" },
      { label: "Próximos eventos", to: "/eventos" },
      { label: "Escuela de música", to: "/inscripciones" },
    ],
  },
  {
    titulo: "Nosotros",
    links: [
      { label: "Quiénes somos", to: "/nosotros#quienes-somos" },
      { label: "Elenco artístico", to: "/elenco" },
      { label: "Inspiración", to: "/nosotros#inspiracion" },
      { label: "Noticias", to: "/noticias" },
    ],
  },
  {
    titulo: "Eventos",
    links: [
      { label: "Salas Colombia canta", to: "/eventos/salas-colombia-canta" },
      { label: "Colombia me enamoras", to: "/eventos/colombia-me-enamoras" },
      { label: "Ver todos los eventos", to: "/eventos" },
    ],
  },
  {
    titulo: "Tienda",
    links: [
      { label: "Camisetas", to: "/tienda" },
      { label: "Hoodies", to: "/tienda" },
      { label: "Bags", to: "/tienda" },
      { label: "Otros", to: "/tienda" },
    ],
  },
];

const aliados = [
  { nombre: 'Co·Crea',               img: 'aliados/aliado-cocrea.webp' },
  { nombre: 'Alcaldía de Medellín',  img: 'aliados/aliado-alcaldia.webp', adaptive: true },
  { nombre: 'Comfama',               img: 'aliados/aliado-comfama.webp' },
  { nombre: 'Ministerio de Cultura', img: 'aliados/aliado-mincultural.webp' },
];

export default function Footer() {
  const [openSection, setOpenSection] = useState(null);
  const toggleSection = (titulo) =>
    setOpenSection((prev) => (prev === titulo ? null : titulo));

  return (
    <footer className="footer">

      {/* ── Aliados ── */}
      <div className="footer-aliados">
        <div className="footer-bandera">
          <div className="footer-bandera-amarillo" />
          <div className="footer-bandera-azul" />
          <div className="footer-bandera-rojo" />
        </div>
        <div className="container">
          <p className="aliados-label">Aliados</p>
          <div className="aliados-logos-grid">
            {aliados.map(a => (
              <div key={a.nombre} className="aliado-logo-item">
                <img
                  src={`${import.meta.env.BASE_URL}${a.img}`}
                  alt={a.nombre}
                  className={`aliado-logo-img${a.bright ? ' aliado-logo-bright' : ''}${a.adaptive ? ' aliado-logo-adaptive' : ''}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="footer-contenido">
        <div className="container">

          {/* Banda de marca — full-width centrada */}
          <div className="footer-brand-top">
            <p className="footer-tagline">"Música que une, cultura que trasciende."</p>
            <img
              src={`${import.meta.env.BASE_URL}Fondo_Footer.png`}
              alt="Colombia Canta y Encanta"
              className="footer-logo-img"
            />
            <p className="footer-desc">
              Centro cultural y escuela de música tradicional colombiana con sede en Medellín.
              Formando artistas desde hace más de 20 años.
            </p>
            <div className="footer-redes">
              {redesSociales.map((red) => (
                <a
                  key={red.label}
                  href={red.href}
                  className="footer-red-icono"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={red.label}
                >
                  {red.svg}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-divider" />

          {/* Barra de nav — desktop */}
          <div className="footer-nav-bar">
            <nav className="footer-nav-links">
              {navLinks.map(({ label, to }) => (
                <Link key={label} to={to} className="footer-nav-link">
                  {label}
                </Link>
              ))}
            </nav>
            <span className="footer-nav-bar-sep" aria-hidden="true" />
            <div className="footer-contact-inline">
              <span className="footer-contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
                Sector Estadio, Medellín
              </span>
              <a href="https://wa.me/573015315119" className="footer-contact-item">
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.28-.28.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                3015315119
              </a>
              <a href="mailto:info@colombiacanta.org" className="footer-contact-item">
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                info@colombiacanta.org
              </a>
            </div>
          </div>

          {/* Acordeón — mobile */}
          <div className="footer-accordion-a">
            {cols.map((col) => (
              <div className="footer-col-acc" key={col.titulo}>
                <div
                  className="footer-col-acc-titulo"
                  onClick={() => toggleSection(col.titulo)}
                >
                  <span>{col.titulo}</span>
                  <span className="footer-toggle-icon">
                    {openSection === col.titulo ? "−" : "+"}
                  </span>
                </div>
                <ul className={openSection === col.titulo ? "footer-open" : ""}>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="footer-col-acc">
              <div
                className="footer-col-acc-titulo"
                onClick={() => toggleSection("contacto")}
              >
                <span>Contacto</span>
                <span className="footer-toggle-icon">
                  {openSection === "contacto" ? "−" : "+"}
                </span>
              </div>
              <div className={`footer-contacto-acc${openSection === "contacto" ? " footer-open" : ""}`}>
                <div className="footer-contacto-item">
                  <span>📍</span>
                  <span>Calle 49 76a-65, Sector Estadio, Medellín</span>
                </div>
                <div className="footer-contacto-item">
                  <span>📱</span>
                  <a href="https://wa.me/573015315119">3015315119</a>
                </div>
                <div className="footer-contacto-item">
                  <span>✉️</span>
                  <a href="mailto:info@colombiacanta.org">info@colombiacanta.org</a>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-divider" />

          <div className="footer-bottom">
            <span className="footer-copyright">
              © {new Date().getFullYear()} Colombia Canta y Encanta · Medellín, Colombia
            </span>
            <div className="footer-legal">
              <Link to="#">Términos</Link>
              <Link to="#">Privacidad</Link>
              <Link to="#">Devoluciones</Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
