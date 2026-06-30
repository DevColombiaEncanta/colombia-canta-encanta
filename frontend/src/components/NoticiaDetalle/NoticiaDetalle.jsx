import { Link } from 'react-router-dom';
import { noticias } from '../../data/noticias';
import ContactoSection from '../Contacto/Contacto';
import Footer from '../Footer/Footer';
import './NoticiaDetalle.css';

export default function NoticiaDetalle({ noticia }) {
  const otras = noticias.filter(n => n.id !== noticia.id);

  return (
    <>
      {/* HERO */}
      <div className="noticia-hero" style={{ background: noticia.gradiente }}>
        <div className="noticia-hero-overlay" />
        <div className="noticia-hero-content container">
          <Link to="/noticias" className="noticia-volver">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver a noticias
          </Link>
          <h1 className="noticia-hero-titulo">{noticia.titulo}</h1>
          <div className="noticia-hero-meta">
            <span className="noticia-hero-chip">{noticia.categoria}</span>
            <p className="noticia-hero-fecha">{noticia.fechaCompleta}</p>
          </div>
        </div>
        <div className="noticia-hero-emoji">{noticia.emoji}</div>
        <div className="franja-bandera" />
      </div>

      {/* CUERPO */}
      <div className="noticia-cuerpo container">
        <div className="noticia-articulo">
          <p className="noticia-lead">{noticia.desc}</p>
          {noticia.contenido.map((parrafo, i) => (
            <p key={i} className="noticia-parrafo">{parrafo}</p>
          ))}
        </div>

        <aside className="noticia-aside">
          <div className="noticia-aside-card">
            <p className="noticia-aside-label">Categoría</p>
            <span className="noticia-aside-chip">{noticia.categoria}</span>
          </div>
          <div className="noticia-aside-card">
            <p className="noticia-aside-label">Fecha</p>
            <p className="noticia-aside-valor">{noticia.fechaCompleta}</p>
          </div>
          <div className="noticia-aside-card">
            <p className="noticia-aside-label">Compartir</p>
            <div className="noticia-compartir">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(noticia.titulo + ' — Colombia Canta y Encanta')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="noticia-compartir-btn"
                title="Compartir por WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* OTRAS NOTICIAS */}
      <section className="noticia-otras">
        <div className="container">
          <div className="noticia-otras-header">
            <span className="label-seccion label-rojo">Más noticias</span>
            <Link to="/noticias" className="noticia-otras-link">Ver todas →</Link>
          </div>
          <div className="noticia-otras-grid">
            {otras.map(n => (
              <Link to={`/noticias/${n.slug}`} key={n.id} className="noticia-mini-card">
                <div className="noticia-mini-icono" style={{ background: n.gradiente }}>
                  {n.img
                    ? <img src={n.img} alt={n.titulo} className="noticia-mini-img" loading="lazy" decoding="async" />
                    : <span>{n.emoji}</span>
                  }
                </div>
                <div className="noticia-mini-body">
                  <span className="noticia-mini-chip">{n.categoria}</span>
                  <p className="noticia-mini-titulo">{n.titulo}</p>
                  <p className="noticia-mini-fecha">{n.fechaCompleta}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ContactoSection />
      <Footer />
    </>
  );
}
