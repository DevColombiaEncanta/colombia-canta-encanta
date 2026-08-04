import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BASE_URL, OG_IMAGE } from '../utils/seo';
import { useNoticias } from '../hooks/useNoticias';
import NoticiaDetalle from '../components/NoticiaDetalle/NoticiaDetalle';

export default function NoticiaDetallePage() {
  const { slug } = useParams();
  const { noticias, cargando, error } = useNoticias();

  if (cargando) {
    return (
      <main>
        <div className="container">
          <div className="noticias-page-empty">
            <p>Cargando noticia…</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <div className="container">
          <div className="noticias-page-empty">
            <p>No se pudo cargar la noticia. Intenta de nuevo más tarde.</p>
          </div>
        </div>
      </main>
    );
  }

  const noticia = noticias.find(n => n.slug === slug);
  if (!noticia) return <Navigate to="/404" />;

  const title = `${noticia.titulo} | Colombia Canta y Encanta`;
  const description = noticia.resumen;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${BASE_URL}/#/noticias/${noticia.slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:locale" content="es_CO" />
        <meta property="og:site_name" content="Colombia Canta y Encanta" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>
      <NoticiaDetalle noticia={noticia} otras={noticias.filter(n => n.id !== noticia.id)} />
    </>
  );
}
