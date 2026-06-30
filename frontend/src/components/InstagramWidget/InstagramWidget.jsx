import './InstagramWidget.css';

const BASE = import.meta.env.BASE_URL;
const IG_URL = 'https://www.instagram.com/colombia_canta';

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const BookmarkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export default function InstagramWidget() {
  return (
    <div className="ig-widget">

      {/* Header */}
      <div className="ig-widget-header">
        <div className="ig-widget-header-top">
          <span className="ig-por">Publicaciones por</span>
          <span className="ig-logo-text">Instagram</span>
        </div>
        <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="ig-handle-link">
          @colombia_canta
        </a>
      </div>

      {/* Post image */}
      <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="ig-img-link">
        <img
          src={`${BASE}hero-slides/eventos.webp`}
          alt="Colombia Canta y Encanta en Instagram"
          className="ig-post-img"
          loading="lazy"
          decoding="async"
        />
      </a>

      {/* Post body */}
      <div className="ig-post-body">

        {/* Actions */}
        <div className="ig-actions">
          <div className="ig-actions-left">
            <button className="ig-icon-btn" aria-label="Me gusta"><HeartIcon /></button>
            <button className="ig-icon-btn" aria-label="Comentar"><CommentIcon /></button>
            <button className="ig-icon-btn" aria-label="Compartir"><SendIcon /></button>
          </div>
          <button className="ig-icon-btn" aria-label="Guardar"><BookmarkIcon /></button>
        </div>

        {/* Likes */}
        <p className="ig-likes">87 me gusta</p>

        {/* Caption */}
        <p className="ig-caption">
          <span className="ig-caption-date">2026-06-01</span>
          {' '}Nuestra pasión por la música colombiana en cada presentación 🎶 Cada show, una nueva historia de nuestro folclor.
        </p>

        {/* Profile row */}
        <div className="ig-profile-row">
          <img
            src={`${BASE}Col_Logo.png`}
            alt="colombia_canta"
            className="ig-avatar"
          />
          <span className="ig-username">colombia_canta</span>
        </div>

        {/* Instagram gradient bar */}
        <div className="ig-gradient-bar" />

        {/* Footer */}
        <div className="ig-footer">
          <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="ig-ver-link">
            ver en instagram
          </a>
        </div>

      </div>
    </div>
  );
}
