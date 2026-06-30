import { useEffect } from 'react';
import './ArtistaModal.css';

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
    <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

export default function ArtistaModal({ artista, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="artista-overlay" onClick={onClose}>
      <div className="artista-modal" onClick={e => e.stopPropagation()}>

        {/* ── Columna poster ── */}
        <div className="artista-modal-poster" style={{ background: artista.gradiente }}>
          {artista.img
            ? <img src={artista.img} alt={artista.nombre} className="artista-modal-foto" />
            : <span className="artista-modal-emoji">{artista.emoji}</span>
          }
          <div className="artista-modal-poster-footer">
            <span className="artista-modal-cat-chip">{artista.categoria}</span>
            <h2 className="artista-modal-nombre">{artista.nombre}</h2>
            <p className="artista-modal-rol">{artista.rol}</p>
          </div>
        </div>

        {/* ── Columna info ── */}
        <div className="artista-modal-info">
          <div className="artista-modal-header">
            <button className="artista-modal-cerrar" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>

          <p className="artista-modal-desc">{artista.descripcion}</p>

          {artista.especialidades?.length > 0 && (
            <div className="artista-modal-grupo">
              <span className="artista-modal-grupo-label">Especialidades</span>
              <div className="artista-modal-chips">
                {artista.especialidades.map(e => (
                  <span key={e} className="artista-chip artista-chip-amarillo">{e}</span>
                ))}
              </div>
            </div>
          )}

          {artista.instrumentos?.length > 0 && (
            <div className="artista-modal-grupo">
              <span className="artista-modal-grupo-label">Instrumentos / Disciplina</span>
              <div className="artista-modal-chips">
                {artista.instrumentos.map(i => (
                  <span key={i} className="artista-chip artista-chip-outline">{i}</span>
                ))}
              </div>
            </div>
          )}

          <div className="artista-modal-acciones">
            {artista.youtube && (
              <a
                href={artista.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-rojo artista-modal-btn"
              >
                <YouTubeIcon /> Ver en YouTube
              </a>
            )}
            {artista.instagram && (
              <a
                href={artista.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-oscuro artista-modal-btn"
              >
                <InstagramIcon /> Instagram
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
