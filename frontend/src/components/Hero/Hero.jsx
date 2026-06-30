import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

const base = import.meta.env.BASE_URL;

const slides = [
  {
    id: "bienvenida",
    label: "Inicio",
    titulo: (
      <>
        Donde Colombia canta, baila y{" "}
        <span className="hero-titulo-acento">encanta</span>
      </>
    ),
    descripcion:
      "Somos una comunidad artística que preserva y proyecta el folclor colombiano a través de la formación, los escenarios y experiencias que conectan generaciones alrededor del mundo.",
    ctas: [
      { label: "Contáctanos", to: "/contacto", primario: true },
      { label: "Descubrir más", to: "/nosotros", primario: false },
    ],
    imagen: "hero-slides/bienvenida.webp",
  },
  {
    id: "quienes-somos",
    label: "Escuela",
    titulo: (
      <>
        Tu camino artístico <span className="hero-titulo-acento">comienza</span>{" "}
        aquí
      </>
    ),
    descripcion:
      "No importa si estás empezando o quieres fortalecer tu talento. Aquí encontrarás un espacio para aprender, crecer y disfrutar la música colombiana.",
    ctas: [
      { label: "Inscríbete ahora", to: "/inscripciones", primario: true },
      { label: "Ver programas", to: "/inscripciones", primario: false },
    ],
    imagen: "hero-slides/quienes-somos.webp",
  },
  {
    id: "eventos",
    label: "Nuestra historia",
    titulo: (
      <>
        La historia detrás de un{" "}
        <span className="hero-titulo-acento">legado</span> que sigue creciendo
      </>
    ),
    descripcion:
      "Silvia Zapata transformó su pasión por el folclor en una experiencia que conecta talento, tradición e identidad.",
    ctas: [
      { label: "Conoce nuestra historia", to: "/nosotros", primario: true },
    ],
    imagen: "hero-slides/eventos.webp",
  },
  {
    id: "escuela",
    label: "Eventos",
    titulo: (
      <>
        Vive la magia de nuestros{" "}
        <span className="hero-titulo-acento">eventos</span>
      </>
    ),
    descripcion:
      "Festivales, galas y presentaciones que llevan la esencia de Colombia a los escenarios más importantes del país y el mundo.",
    ctas: [
      { label: "Explorar eventos", to: "/eventos", primario: true },
      { label: "Conocer elenco", to: "/elenco", primario: false },
    ],
    imagen: "hero-slides/escuela.webp",
  },
  {
    id: "tienda",
    label: "Tienda",
    titulo: (
      <>
        Tejiendo <br /> <span className="hero-titulo-acento">música</span>
      </>
    ),
    descripcion:
      "Estamos creando un espacio donde el arte, la tradición y la identidad colombiana se transforman en piezas únicas.",
    ctas: [{ label: "Descubre próximamente", to: "/tienda", primario: true }],
    imagen: "hero-slides/tienda.webp",
  },
  {
    id: "noticias",
    label: "Festival",
    titulo: (
      <>
        Una celebración que nos{" "}
        <span className="hero-titulo-acento">conecta</span>
      </>
    ),
    descripcion:
      "El Festival Nacional Colombia Canta y Encanta reúne generaciones alrededor de la música colombiana, creando escenarios para compartir, aprender y celebrar nuestro talento.",
    ctas: [
      {
        label: "Ver Festival",
        to: "/eventos/festival-nacional",
        primario: true,
      },
      { label: "Escríbenos", to: "/contacto", primario: false },
    ],
    imagen: "hero-slides/noticias.webp",
  },
  {
    id: "contacto",
    label: "Medellín",
    titulo: (
      <>
        Una experiencia cultural imperdible en tu visita a{" "}
        <span className="hero-titulo-acento">Medellín</span>
      </>
    ),
    descripcion:
      "Recorre espacios llenos de encanto y vive un show cultural que ha llevado nuestra esencia a escenarios internacionales.",
    ctas: [
      {
        label: "Explora la experiencia",
        to: "/eventos/colombia-me-enamoras",
        primario: true,
      },
    ],
    imagen: "hero-slides/contacto.webp",
  },
];

export default function Hero() {
  const [active, setActive] = useState(0);

  const goTo = (idx) => setActive(idx);
  const next = () => setActive((a) => (a + 1) % slides.length);
  const prev = () => setActive((a) => (a - 1 + slides.length) % slides.length);

  useEffect(() => {
    const id = setInterval(next, 8000);
    return () => clearInterval(id);
  }, [active]);

  const activeSlide = slides[active];

  return (
    <section className="hero-carousel">
      {/* ── Imagen — derecha, difuminada hacia el fondo (crossfade) ── */}
      <div className="hero-imagen-area" aria-hidden="true">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`hero-bg${active === i ? " hero-bg--activo" : ""}`}
          >
            <img
              src={`${base}${slide.imagen}`}
              alt=""
              className={`hero-bg-img hero-img--${slide.id}`}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}
      </div>

      {/* ── Contenido izquierdo — key=active fuerza remount y reactiva animaciones ── */}
      <div key={active} className="hero-slide-contenido">
        <h1 className="hero-titulo">{activeSlide.titulo}</h1>
        <p className="hero-desc">{activeSlide.descripcion}</p>
        <div className="hero-ctas">
          {activeSlide.ctas.map((cta) => (
            <Link
              key={cta.label}
              to={cta.to}
              className={
                cta.primario ? "hero-btn-primario" : "hero-btn-secundario"
              }
            >
              {cta.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Dots + flechas — navegación del carrusel ── */}
      <div className="hero-dots-nav">
        <button
          className="hero-nav-arrow"
          onClick={prev}
          aria-label="Slide anterior"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <div
          className="hero-dots"
          role="tablist"
          aria-label="Secciones del carrusel"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              className={`hero-dot${active === i ? " hero-dot--activo" : ""}`}
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={active === i}
              aria-label={slide.label}
            />
          ))}
        </div>
        <button
          className="hero-nav-arrow"
          onClick={next}
          aria-label="Slide siguiente"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* ── Franja próximo evento — siempre visible ── */}
      <div className="hero-anuncio-evento">
        <span className="hero-anuncio-label">Próximo gran evento</span>
        <span className="hero-anuncio-diamante">◆</span>
        <span className="hero-anuncio-nombre">
          Festival Colombia Canta y Encanta
        </span>
        <span className="hero-anuncio-sep">·</span>
        <span className="hero-anuncio-fecha">23-26 Jul 2026 · Medellín</span>
        <Link to="/eventos/festival-nacional" className="hero-anuncio-cta">
          Inscríbete →
        </Link>
      </div>
    </section>
  );
}
