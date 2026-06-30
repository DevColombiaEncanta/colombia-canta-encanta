import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { noticias } from '../data/noticias';
import ContactoSection from '../components/Contacto/Contacto';
import Footer from '../components/Footer/Footer';
import '../styles/main.css';
import { BASE_URL, OG_IMAGE } from '../utils/seo';

const PAGE_TITLE = 'Noticias | Colombia Canta y Encanta';
const PAGE_DESC = 'Últimas noticias, crónicas y novedades de Colombia Canta y Encanta. Entérate de todo lo que sucede en nuestra escuela y en el mundo de la música tradicional colombiana.';

const CATEGORIAS = ['Todos', ...new Set(noticias.map(n => n.categoria))];

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

export default function NoticiasPage() {
  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  const filtradas = useMemo(() =>
    noticias.filter(n => {
      const matchCat = filtro === 'Todos' || n.categoria === filtro;
      const query = busqueda.toLowerCase();
      const matchSearch =
        !query ||
        n.titulo.toLowerCase().includes(query) ||
        n.desc.toLowerCase().includes(query);
      return matchCat && matchSearch;
    }),
    [filtro, busqueda]
  );

  return (
    <main>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#/noticias`} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESC} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:locale" content="es_CO" />
        <meta property="og:site_name" content="Colombia Canta y Encanta" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESC} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>

      {/* Hero */}
      <div className="page-header">
        <div className="container">
          <div className="page-header-inner">
            <span className="page-header-label">Actualidad · Cultura · Eventos</span>
            <h1>Noticias</h1>
          </div>
          <div className="page-header-divisor" />
          <p className="page-header-sub">Últimas novedades de Colombia Canta y Encanta</p>
        </div>
      </div>

      <section className="noticias-page-section">
        <div className="container">

          {/* Controles: búsqueda + filtros */}
          <div className="noticias-page-controls">
            <div className="noticias-page-busqueda">
              <span className="noticias-page-search-icon"><SearchIcon /></span>
              <input
                type="text"
                placeholder="Buscar noticias..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="noticias-page-input"
              />
              {busqueda && (
                <button
                  className="noticias-page-clear"
                  onClick={() => setBusqueda('')}
                  aria-label="Limpiar búsqueda"
                >
                  ×
                </button>
              )}
            </div>
            <div className="noticias-page-filtros">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat}
                  className={`noticias-page-filtro${filtro === cat ? ' active' : ''}`}
                  onClick={() => setFiltro(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Resultado */}
          {filtradas.length > 0 ? (
            <div className="noticias-page-grid">
              {filtradas.map(n => (
                <Link to={`/noticias/${n.slug}`} key={n.id} className="noticias-page-card">
                  <div className="noticias-page-card-img" style={{ background: n.gradiente }}>
                    {n.banner && (
                      <img src={n.banner} alt={n.titulo} className="noticias-page-card-banner" loading="lazy" decoding="async" />
                    )}
                    {!n.banner && <span className="noticias-page-card-emoji">{n.emoji}</span>}
                    <span className="noticias-page-card-cat">{n.categoria}</span>
                  </div>
                  <div className="noticias-page-card-body">
                    <span className="noticias-page-card-fecha">{n.fechaCompleta}</span>
                    <h3 className="noticias-page-card-titulo">{n.titulo}</h3>
                    <p className="noticias-page-card-desc">{n.desc}</p>
                  </div>
                  <div className="noticias-page-card-linea" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="noticias-page-empty">
              <p>No se encontraron noticias para <strong>"{busqueda}"</strong></p>
              <button className="btn btn-outline-oscuro" onClick={() => { setBusqueda(''); setFiltro('Todos'); }}>
                Ver todas
              </button>
            </div>
          )}

        </div>
      </section>

      <ContactoSection />
      <Footer />
    </main>
  );
}
