import './TripAdvisorWidget.css';

const BASE = import.meta.env.BASE_URL;
const TA_URL = 'https://www.tripadvisor.es/Attraction_Review-g297478-d23933011-Reviews-Colombia_Canta_Y_Encanta-Medellin_Antioquia_Department.html';

const fotos = [
  `${BASE}tripadvisor/tripadvisor-1.webp`,
  `${BASE}tripadvisor/tripadvisor-2.webp`,
  `${BASE}tripadvisor/tripadvisor-3.webp`,
];

const TripAdvisorIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 100 20A10 10 0 0012 2zM8 10.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm8 0a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM8 12.75a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zm8 0a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" />
  </svg>
);

export default function TripAdvisorWidget() {
  return (
    <div className="ta-widget">

      {/* Header */}
      <div className="ta-widget-header">
        <div className="ta-widget-header-top">
          <span className="ta-por">Opiniones en</span>
          <span className="ta-logo">
            <TripAdvisorIcon />
            Tripadvisor
          </span>
        </div>
        <div className="ta-rating">
          <span className="ta-rating-num">5.0</span>
          <div className="ta-bubbles">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="ta-bubble" />
            ))}
          </div>
          <span className="ta-rating-label">Excelente</span>
        </div>
      </div>

      {/* Fotos */}
      <div className="ta-fotos">
        {fotos.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Colombia Canta y Encanta - foto ${i + 1}`}
            className="ta-foto"
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>

      {/* Reseña destacada */}
      <div className="ta-review">
        <p className="ta-review-titulo">"Un espectáculo que te llega al alma"</p>
        <p className="ta-review-texto">
          La energía, el color y el talento de los artistas hacen de cada
          presentación una experiencia inolvidable. Totalmente recomendado
          si quieres conocer la cultura colombiana de verdad.
        </p>
        <div className="ta-review-autor">
          <span className="ta-review-nombre">María G.</span>
          <span className="ta-review-fecha">hace 2 semanas</span>
        </div>
      </div>

      {/* Footer */}
      <div className="ta-footer">
        <a href={TA_URL} target="_blank" rel="noopener noreferrer" className="ta-ver-link">
          ver en tripadvisor
        </a>
      </div>

    </div>
  );
}
