import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Historia.css";

const imagenes = [
  {
    src: "nuestra-historia/dsc03185-6.webp",
    alt: "Colombia Canta y Encanta en escenario",
  },
  {
    src: "nuestra-historia/dsc03897-2.webp",
    alt: "Presentación artística Colombia Canta",
  },
  {
    src: "nuestra-historia/dsc04280-4.webp",
    alt: "Elenco de Colombia Canta y Encanta",
  },
  {
    src: "nuestra-historia/img_78741-2.webp",
    alt: "Artistas de Colombia Canta y Encanta",
  },
];

export default function Historia() {
  const [activo, setActivo] = useState(0);
  const trackRef = useRef(null);
  const esMobileRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 599px)");
    esMobileRef.current = mq.matches;
    const onChange = (e) => { esMobileRef.current = e.matches; };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const paso = esMobileRef.current ? 1 : 2;
      setActivo((i) => (i + paso) % imagenes.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!trackRef.current) return;
    const slide = trackRef.current.children[activo];
    if (slide) {
      trackRef.current.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
    }
  }, [activo]);

  return (
    <section className="historia-section">
      {/* Header full-width */}
      <span className="historia-seccion-label label-seccion label-rojo">Quiénes Somos</span>

      {/* Carrusel — izquierda en desktop, arriba en mobile */}
      <div className="historia-carrusel">
        <div className="historia-track" ref={trackRef}>
          {imagenes.map((img, i) => (
            <div key={i} className="historia-slide">
              {img.src ? (
                <img
                  src={`${import.meta.env.BASE_URL}${img.src}`}
                  alt={img.alt}
                  className="historia-slide-img"
                />
              ) : (
                <div
                  className="historia-slide-ph"
                  style={{ background: img.bg }}
                >
                  <span>{img.label}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Texto — derecha en desktop, abajo en mobile */}
      <div className="historia-contenido">
        <h2>
          De Medellín para los escenarios del <span>mundo</span>
        </h2>
        <p>
          Nacimos con la misión de preservar y proyectar la riqueza del
          folclor colombiano. Hoy, somos una comunidad artística reconocida
          por formar talentos que llevan nuestra música y nuestras
          tradiciones a escenarios nacionales e internacionales.
        </p>
        <div className="historia-reconocimiento">
          <span className="historia-reconocimiento-icono">
            <img
              src={`${import.meta.env.BASE_URL}nuestra-historia/icono-trofeo.webp`}
              alt=""
              className="reconocimiento-icono-img"
            />
          </span>
          <span>
            Reconocidos por el Ministerio de Cultura como una de las
            escuelas de música más destacadas de Colombia.
          </span>
        </div>
        <div className="historia-stats">
          <div className="stat-item">
            <span className="stat-numero">20+</span>
            <span className="stat-label">Años preservando el folclor colombiano</span>
          </div>
          <div className="stat-item">
            <span className="stat-numero">1000+</span>
            <span className="stat-label">Artistas formados</span>
          </div>
          <div className="stat-item">
            <span className="stat-numero">6</span>
            <span className="stat-label">Países impactados</span>
          </div>
          <div className="stat-item">
            <span className="stat-numero">Miles</span>
            <span className="stat-label">de espectadores alcanzados</span>
          </div>
        </div>
        <Link to="/nosotros" className="btn btn-azul">
          Conoce nuestra historia →
        </Link>
      </div>
    </section>
  );
}
