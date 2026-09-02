import { useEffect, useState } from 'react';
import './TiendaHero.css';

// Extraído de Tienda.jsx (2026-09-01) — el usuario pidió reusar el mismo
// banner de la página principal de la tienda arriba de la página de detalle
// de producto. Vive en su propio componente (en vez de duplicar el JSX/CSS/
// estado en las 2 páginas) para no tener 2 copias que mantener sincronizadas.
const heroSlides = [
  {
    img: 'tienda-hero/sonidos-que-nos-unen.webp',
    tagline: 'SONIDOS QUE NOS UNEN',
    parrafo: 'Piezas que cuentan historias, inspiradas en lo que somos, en nuestra gente y en la música que nos mueve.',
  },
  {
    img: 'tienda-hero/viste-lo-que-sientes-1.webp',
    tagline: 'VISTE LO QUE SIENTES',
    parrafo: 'Diseños únicos para llevar contigo tu orgullo, a donde quiera que vayas.',
  },
  {
    img: 'tienda-hero/viste-lo-que-sientes-2.webp',
    tagline: 'VISTE LO QUE SIENTES',
    parrafo: 'Diseños únicos para llevar contigo tu orgullo, a donde quiera que vayas.',
  },
];

const visteImgs = [
  'tienda-hero/viste-lo-que-sientes-1.webp',
  'tienda-hero/viste-lo-que-sientes-2.webp',
];

export default function TiendaHero() {
  const [heroSlideActivo, setHeroSlideActivo] = useState(0);
  const [visteActivo, setVisteActivo] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroSlideActivo(i => (i + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setVisteActivo(i => (i + 1) % visteImgs.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Hero editorial asimétrico — desktop */}
      <section className="tienda-editorial-hero">
        <div
          className="hero-col-izq"
          style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.65) 15%, transparent 60%), url(${import.meta.env.BASE_URL}tienda-hero/sonidos-que-nos-unen.webp)` }}
        >
          <div className="hero-editorial-contenido">
            <h2 className="hero-ed-tagline">SONIDOS QUE NOS UNEN</h2>
            <p className="hero-ed-parrafo">Piezas que cuentan historias, inspiradas en lo que somos, en nuestra gente y en la música que nos mueve.</p>
          </div>
        </div>
        <div className="hero-col-der">
          {visteImgs.map((img, i) => (
            <div
              key={i}
              className="hero-col-der-bg"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.65) 15%, transparent 60%), url(${import.meta.env.BASE_URL}${img})`,
                opacity: i === visteActivo ? 1 : 0,
              }}
            />
          ))}
          <div className="hero-editorial-contenido">
            <h2 className="hero-ed-tagline">VISTE LO QUE SIENTES</h2>
            <p className="hero-ed-parrafo">Diseños únicos para llevar contigo tu orgullo, a donde quiera que vayas.</p>
          </div>
        </div>
      </section>

      {/* Hero como carrusel único — solo tablet/mobile */}
      <section className="tienda-hero-carrusel">
        <div
          className="hero-carrusel-slide"
          style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.65) 15%, transparent 60%), url(${import.meta.env.BASE_URL}${heroSlides[heroSlideActivo].img})` }}
        >
          <div className="hero-editorial-contenido">
            <h2 className="hero-ed-tagline">{heroSlides[heroSlideActivo].tagline}</h2>
            <p className="hero-ed-parrafo">{heroSlides[heroSlideActivo].parrafo}</p>
          </div>
        </div>
        <div className="hero-carrusel-dots">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              className={`hero-carrusel-dot${i === heroSlideActivo ? ' activo' : ''}`}
              onClick={() => setHeroSlideActivo(i)}
              aria-label={`Ver imagen ${i + 1}`}
            />
          ))}
        </div>
      </section>
    </>
  );
}
