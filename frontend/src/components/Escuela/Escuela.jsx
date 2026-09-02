import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Escuela.css';

const BASE = import.meta.env.BASE_URL;
const imagenes = [
  { src: `${BASE}escuela-musica/img-quienessomos.webp`, alt: 'Estudiantes de Colombia Canta y Encanta' },
  { src: `${BASE}escuela-musica/img_4177.webp`,         alt: 'Estudiantes aprendiendo instrumentos' },
  { src: `${BASE}escuela-musica/img_3216.webp`,         alt: 'Formación musical colombiana' },
];

export default function Escuela() {
  // Pedido del usuario (2026-09-02): en tablet/mobile el mosaico fijo se
  // reemplaza por un carrusel autorrotable de a una foto (desktop conserva
  // el mosaico de 3, sin cambios) — mismo criterio que el carrusel de
  // Historia.jsx.
  const [esCompacto, setEsCompacto] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches
  );
  const [activo, setActivo] = useState(0);
  const trackRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    setEsCompacto(mq.matches);
    const onChange = (e) => setEsCompacto(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!esCompacto) return;
    const timer = setInterval(() => {
      setActivo((i) => (i + 1) % imagenes.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [esCompacto]);

  useEffect(() => {
    if (!trackRef.current) return;
    const slide = trackRef.current.children[activo];
    if (slide) {
      trackRef.current.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
    }
  }, [activo]);

  return (
    <section className="escuela-section">
      <span className="escuela-seccion-label label-seccion label-amarillo">Escuela de Música</span>

      {/* Contenido izquierda */}
      <div className="escuela-contenido">
        <h2>Aprende el arte que representa a Colombia</h2>
        <p>Aprende música, danza y expresión artística de la mano de maestros especializados en folclor colombiano. Desde tus primeros pasos hasta niveles avanzados, te acompañamos en un proceso que fortalece tu talento y conecta con nuestras raíces.</p>
        <Link to="/inscripciones" className="btn btn-amarillo">Explora nuestros programas</Link>
      </div>

      {esCompacto ? (
        <div className="escuela-carrusel">
          <div className="escuela-track" ref={trackRef}>
            {imagenes.map((img, i) => (
              <div key={i} className="escuela-slide">
                <img src={img.src} alt={img.alt} className="escuela-slide-img" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="escuela-imagenes">
          <div className="escuela-img-grande">
            <img src={imagenes[0].src} alt={imagenes[0].alt} className="escuela-img" style={{ objectPosition: '25% center' }} loading="lazy" decoding="async" />
          </div>
          <div className="escuela-img-chica">
            <img src={imagenes[1].src} alt={imagenes[1].alt} className="escuela-img" loading="lazy" decoding="async" />
          </div>
          <div className="escuela-img-chica">
            <img src={imagenes[2].src} alt={imagenes[2].alt} className="escuela-img" style={{ objectPosition: '10% center' }} loading="lazy" decoding="async" />
          </div>
        </div>
      )}
    </section>
  );
}
