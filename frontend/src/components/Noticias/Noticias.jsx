import { Link } from 'react-router-dom';
import { noticias } from '../../data/noticias';
import InstagramWidget from '../InstagramWidget/InstagramWidget';
import './Noticias.css';

const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function Noticias() {
  return (
    <section id="noticias" className="noticias-section">
      <div className="container">
        <div className="noticias-header">
          <div className="noticias-intro">
            <span className="label-seccion label-amarillo">Noticias</span>
          </div>
          <Link to="/noticias" className="noticias-ver-todas">
            VER TODAS <ArrowIcon />
          </Link>
        </div>

        <div className="noticias-con-ig">
          <div className="noticias-lista">
            {noticias.map((n) => (
              <Link to={`/noticias/${n.slug}`} key={n.id} className="noticias-fila">
                <div className="noticias-fila-contenido">
                  <div className="noticias-fila-meta">
                    <span className="noticias-fila-fecha">{n.fecha}</span>
                    <span className="noticias-fila-chip">{n.categoria}</span>
                  </div>
                  <h3 className="noticias-fila-titulo">{n.titulo}</h3>
                </div>
                <div className="noticias-fila-thumb" style={{ background: n.gradiente }}>
                  {n.img
                    ? <img src={n.img} alt={n.titulo} className="noticias-fila-img" loading="lazy" decoding="async" />
                    : <span className="noticias-fila-emoji">{n.emoji}</span>
                  }
                </div>
              </Link>
            ))}
          </div>

          <aside className="noticias-ig-sidebar">
            <InstagramWidget />
          </aside>
        </div>
      </div>
    </section>
  );
}
