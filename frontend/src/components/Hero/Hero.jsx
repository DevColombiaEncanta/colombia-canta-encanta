import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useHero } from "../../hooks/useHero";
import { useEventos } from "../../hooks/useEventos";
import "./Hero.css";

export default function Hero() {
  const { slides, cargando, error } = useHero();
  const { eventos } = useEventos();
  const [active, setActive] = useState(0);
  // ⭐ Pedido del usuario (2026-08-15): el carrusel seguía avanzando solo
  // mientras alguien leía la descripción o apuntaba a un botón — molesto en
  // especial con textos largos. Se pausa con el mouse encima, y también con
  // el foco de teclado (alguien tabulando hasta un botón del CTA tiene el
  // mismo problema que alguien con el mouse encima, solo que sin hover).
  const [pausado, setPausado] = useState(false);

  const goTo = (idx) => setActive(idx);
  const next = () => setActive((a) => (slides.length ? (a + 1) % slides.length : 0));
  const prev = () => setActive((a) => (slides.length ? (a - 1 + slides.length) % slides.length : 0));

  useEffect(() => {
    if (slides.length === 0 || pausado) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % slides.length);
    }, 8000);
    return () => clearInterval(id);
  }, [slides.length, pausado]);

  const eventoDestacado = eventos.find((e) => e.destacadoHero);

  if (cargando) {
    return (
      <section className="hero-carousel hero-carousel--estado">
        <p className="hero-estado-mensaje">Cargando…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="hero-carousel hero-carousel--estado">
        <p className="hero-estado-mensaje">No se pudo cargar el contenido. Intenta de nuevo más tarde.</p>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="hero-carousel hero-carousel--estado">
        <p className="hero-estado-mensaje">Muy pronto, contenido nuevo.</p>
      </section>
    );
  }

  const activeSlide = slides[active];

  return (
    <section
      className="hero-carousel"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPausado(false);
      }}
    >
      {/* ── Imagen — derecha, difuminada hacia el fondo (crossfade) ── */}
      <div className="hero-imagen-area" aria-hidden="true">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`hero-bg${active === i ? " hero-bg--activo" : ""}`}
          >
            <img
              src={slide.imagen}
              alt=""
              className="hero-bg-img"
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
          {activeSlide.ctas?.map((cta) => (
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

      {/* ── Franja próximo evento — solo si hay un evento real marcado como destacado ── */}
      {eventoDestacado && (
        <div className="hero-anuncio-evento">
          <span className="hero-anuncio-label">Próximo gran evento</span>
          <span className="hero-anuncio-diamante">◆</span>
          <span className="hero-anuncio-nombre">{eventoDestacado.titulo}</span>
          <span className="hero-anuncio-sep">·</span>
          <span className="hero-anuncio-fecha">{eventoDestacado.fecha} · {eventoDestacado.ciudad}</span>
          <Link to={`/eventos/${eventoDestacado.slug}`} className="hero-anuncio-cta">
            {eventoDestacado.cta || "Ver evento"} →
          </Link>
        </div>
      )}
    </section>
  );
}
