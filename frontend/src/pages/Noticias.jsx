import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useNoticias } from '../hooks/useNoticias';
import { formatearFecha, gradienteDiagonal } from '../utils/formato';
import ContactoSection from '../components/Contacto/Contacto';
import Footer from '../components/Footer/Footer';
import '../styles/main.css';
import { BASE_URL, OG_IMAGE } from '../utils/seo';

const PAGE_TITLE = 'Noticias | Colombia Canta y Encanta';
const PAGE_DESC = 'Últimas noticias, crónicas y novedades de Colombia Canta y Encanta. Entérate de todo lo que sucede en nuestra escuela y en el mundo de la música tradicional colombiana.';

function getCardsPorPagina() {
  if (window.innerWidth <= 599) return 2;
  if (window.innerWidth <= 1024) return 4;
  return 6;
}

function generarPaginas(actual, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (actual <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (actual >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', actual - 1, actual, actual + 1, '…', total];
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

export default function NoticiasPage() {
  const { noticias, cargando, error } = useNoticias();
  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cardsPorPagina, setCardsPorPagina] = useState(getCardsPorPagina);

  useEffect(() => {
    const update = () => setCardsPorPagina(getCardsPorPagina());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const CATEGORIAS = useMemo(
    () => ['Todos', ...new Set(noticias.map(n => n.categoria))],
    [noticias]
  );

  const filtradas = useMemo(() =>
    noticias.filter(n => {
      const matchCat = filtro === 'Todos' || n.categoria === filtro;
      const query = busqueda.toLowerCase();
      const matchSearch =
        !query ||
        n.titulo.toLowerCase().includes(query) ||
        n.resumen.toLowerCase().includes(query);
      return matchCat && matchSearch;
    }),
    [noticias, filtro, busqueda]
  );

  useEffect(() => { setPagina(1); }, [filtro, busqueda]);
  useEffect(() => { setPagina(1); }, [cardsPorPagina]);

  const totalPaginas = Math.ceil(filtradas.length / cardsPorPagina);
  const paginaEfectiva = Math.min(pagina, totalPaginas || 1);
  const paginadas = filtradas.slice((paginaEfectiva - 1) * cardsPorPagina, paginaEfectiva * cardsPorPagina);
  const paginas = generarPaginas(paginaEfectiva, totalPaginas);

  const irAPagina = (p) => {
    setPagina(p);
    document.querySelector('.noticias-page-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
          <p className="page-header-sub noticias-header-sub">Últimas novedades de Colombia Canta y Encanta</p>
        </div>
      </div>

      <section className="noticias-page-section">
        <div className="container">

          {cargando && (
            <div className="noticias-page-empty">
              <p>Cargando noticias…</p>
            </div>
          )}

          {!cargando && error && (
            <div className="noticias-page-empty">
              <p>No se pudieron cargar las noticias. Intenta de nuevo más tarde.</p>
            </div>
          )}

          {!cargando && !error && noticias.length === 0 && (
            <div className="noticias-page-empty">
              <p>Aún no hay noticias publicadas. Vuelve pronto.</p>
            </div>
          )}

          {!cargando && !error && noticias.length > 0 && (
          <>
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
            <>
              <div className="noticias-page-grid">
                {paginadas.map(n => (
                  <Link to={`/noticias/${n.slug}`} key={n.id} className="noticias-page-card">
                    <div className="noticias-page-card-img" style={{ background: gradienteDiagonal(n.colorInicio, n.colorFin) }}>
                      {n.banner && (
                        <img src={n.banner} alt={n.titulo} className="noticias-page-card-banner" loading="lazy" decoding="async" />
                      )}
                      <span className="noticias-page-card-cat">{n.categoria}</span>
                    </div>
                    <div className="noticias-page-card-body">
                      <span className="noticias-page-card-fecha">{formatearFecha(n.fechaPublicacion).larga}</span>
                      <h3 className="noticias-page-card-titulo">{n.titulo}</h3>
                      <p className="noticias-page-card-desc">{n.resumen}</p>
                    </div>
                    <div className="noticias-page-card-linea" />
                  </Link>
                ))}
              </div>

              {totalPaginas > 1 && (
                <nav className="noticias-paginador" aria-label="Paginación de noticias">
                  {paginas.map((p, i) =>
                    p === '…' ? (
                      <span key={`sep-${i}`} className="noticias-paginador-sep">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`noticias-paginador-btn${paginaEfectiva === p ? ' active' : ''}`}
                        onClick={() => irAPagina(p)}
                        aria-label={`Página ${p}`}
                        aria-current={paginaEfectiva === p ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="noticias-page-empty">
              <p>No se encontraron noticias para <strong>"{busqueda}"</strong></p>
              <button className="btn btn-outline-oscuro" onClick={() => { setBusqueda(''); setFiltro('Todos'); }}>
                Ver todas
              </button>
            </div>
          )}
          </>
          )}

        </div>
      </section>

      <ContactoSection />
      <Footer />
    </main>
  );
}
