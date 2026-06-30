import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BASE_URL, OG_IMAGE } from '../utils/seo';
import { noticias } from '../data/noticias';
import NoticiaDetalle from '../components/NoticiaDetalle/NoticiaDetalle';

export default function NoticiaDetallePage() {
  const { slug } = useParams();
  const noticia = noticias.find(n => n.slug === slug);
  if (!noticia) return <Navigate to="/404" />;

  const title = `${noticia.titulo} | Colombia Canta y Encanta`;
  const description = noticia.desc;

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
      <NoticiaDetalle noticia={noticia} />
    </>
  );
}
