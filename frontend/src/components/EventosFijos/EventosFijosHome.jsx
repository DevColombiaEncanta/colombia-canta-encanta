import { useState } from 'react';
import { Link } from 'react-router-dom';
import { eventosFijos } from '../../data/eventosFijos';
import './EventosFijosHome.css';

function TripAdvisorBadge({ link }) {
  return (
    <div
      className="efh-tripadvisor"
      onClick={e => { e.preventDefault(); window.open(link, '_blank', 'noopener,noreferrer'); }}
      title="Ver reseñas en TripAdvisor"
    >
      <svg className="efh-ta-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a3 3 0 110 6 3 3 0 010-6zm0 14.5c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      </svg>
      <span>Ver reseñas</span>
    </div>
  );
}

/* Carrusel de imágenes para el panel de media de las cards "zigzag".
   Con 0 imágenes muestra el placeholder degradado; con 1, la imagen fija;
   con 2+, agrega flechas y dots de navegación. */
function MediaCarousel({ images, alt, color, colorHero }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className="efh-zigzag-img efh-zigzag-img--vacia"
        style={{ background: `linear-gradient(140deg, ${color} 0%, ${colorHero} 100%)` }}
      >
        <span className="efh-deco">🇨🇴</span>
        <span className="efh-zigzag-placeholder-label">Próximamente</span>
      </div>
    );
  }

  const navegar = (delta, e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(prev => (prev + delta + images.length) % images.length);
  };

  const irA = (i, e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(i);
  };

  return (
    <>
      <img
        src={images[index]}
        alt={alt}
        className="efh-zigzag-img"
        decoding="async"
      />
      {images.length > 1 && (
        <>
          <button type="button" className="efh-carousel-arrow efh-carousel-arrow--prev" onClick={e => navegar(-1, e)} aria-label="Imagen anterior">‹</button>
          <button type="button" className="efh-carousel-arrow efh-carousel-arrow--next" onClick={e => navegar(1, e)} aria-label="Imagen siguiente">›</button>
          <div className="efh-carousel-dots">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`efh-carousel-dot${i === index ? ' is-active' : ''}`}
                onClick={e => irA(i, e)}
                aria-label={`Ver imagen ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function EventosFijosHome({ variant = 'hero' }) {
  if (variant === 'zigzag') {
    return (
      <div className="efh-grid efh-grid--zigzag">
        {eventosFijos.map((ev, idx) => {
          const imagenes = ev.galeria ?? (ev.img ? [ev.img] : []);

          return (
            <Link key={ev.id} to={`/eventos/${ev.slug}`} className={`efh-card efh-card--zigzag${ev.invertido ? ' efh-card--zigzag-reverse' : ''}`}>
              <div className="efh-zigzag-body">
                <span className="efh-zigzag-num">{String(idx + 1).padStart(2, '0')}</span>
                <span className="efh-zigzag-eyebrow">
                  {ev.tipoIcono} {ev.tipo}
                </span>
                <span className="efh-zigzag-accent" style={{ background: ev.color }} />
                <h3 className="efh-zigzag-titulo">{ev.titulo}</h3>
                <p className="efh-zigzag-desc">{ev.descripcionCorta}</p>

                {ev.fases ? (
                  <div className="efh-zigzag-fases">
                    {ev.fases.map(f => (
                      <div key={f.titulo} className="efh-zigzag-fase">
                        <span className="efh-zigzag-fase-icono" style={{ background: `${ev.color}1a` }}>{f.icono}</span>
                        <span className="efh-zigzag-fase-titulo">{f.titulo}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="efh-zigzag-pills">
                    {ev.pills.map(p => (
                      <span key={p.texto} className="efh-zigzag-pill">
                        <span className="efh-zigzag-pill-icono" style={{ background: `${ev.color}1a` }}>{p.icono}</span>
                        <span className="efh-zigzag-pill-texto">{p.texto}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="efh-zigzag-footer">
                  {ev.tripadvisorLink && (
                    <button
                      type="button"
                      className="efh-zigzag-tripadvisor"
                      onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(ev.tripadvisorLink, '_blank', 'noopener,noreferrer'); }}
                    >
                      <svg className="efh-zigzag-ta-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a3 3 0 110 6 3 3 0 010-6zm0 14.5c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                      Ver opiniones en TripAdvisor
                    </button>
                  )}
                  <span className="efh-zigzag-cta">
                    {ev.cta} <span className="efh-arrow">→</span>
                  </span>
                </div>
              </div>

              <div className="efh-zigzag-media">
                <MediaCarousel images={imagenes} alt={ev.titulo} color={ev.color} colorHero={ev.colorHero} />
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="efh-grid">
      {eventosFijos.map(ev => (
        <Link
          key={ev.id}
          to={`/eventos/${ev.slug}`}
          className="efh-card"
          style={!ev.img
            ? { background: `linear-gradient(140deg, ${ev.color} 0%, ${ev.colorHero} 100%)` }
            : undefined
          }
        >
          {ev.img && (
            <img
              src={ev.img}
              alt={ev.titulo}
              className="efh-bg-img"
              loading="lazy"
              decoding="async"
            />
          )}

          {!ev.img && <span className="efh-deco">🇨🇴</span>}

          <div className="efh-overlay" />

          <div className="efh-top">
            <span className="efh-chip">
              {ev.tipo}
            </span>
            {ev.tripadvisorLink && <TripAdvisorBadge link={ev.tripadvisorLink} />}
          </div>

          <div className="efh-bottom">
            <span className="efh-accent" style={{ background: ev.color }} />
            <h3 className="efh-titulo">{ev.titulo}</h3>
            <p className="efh-desc">{ev.descripcionCorta}</p>
            <div className="efh-pills">
              {ev.pills.slice(0, 3).map(p => (
                <span key={p.texto} className="efh-pill">
                  {p.icono} {p.texto}
                </span>
              ))}
            </div>
            <span className="efh-cta">
              {ev.cta} <span className="efh-arrow">→</span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
