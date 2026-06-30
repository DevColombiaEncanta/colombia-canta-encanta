import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BASE_URL, OG_IMAGE } from '../utils/seo';
import { eventos } from '../data/eventos';
import { eventosFijos } from '../data/eventosFijos';
import EventoDetalle from '../components/EventoDetalle/EventoDetalle';

export default function EventoDetallePage() {
  const { slug } = useParams();
  const evento = [...eventos, ...eventosFijos].find(e => e.slug === slug);
  if (!evento) return <Navigate to="/404" />;

  const title = `${evento.titulo} | Colombia Canta y Encanta`;
  const descripcionBase = evento.descripcion ?? evento.descripcionCorta;
  const description = evento.fechaCompleta
    ? `${descripcionBase} — ${evento.fechaCompleta}. ${evento.lugar}, ${evento.ciudad}.`
    : `${descripcionBase} ${evento.lugar}, ${evento.ciudad}.`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#/eventos/${evento.slug}`} />
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
      <EventoDetalle evento={evento} />
    </>
  );
}
