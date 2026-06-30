import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BASE_URL, OG_IMAGE } from '../utils/seo';
import Hero from '../components/Hero/Hero';

const PAGE_TITLE = 'Colombia Canta y Encanta | Asociación Cultural en Medellín';
const PAGE_DESC = 'Asociación cultural colombiana en Medellín. Escuela de música, eventos y folclor: bambuco, pasillo, cumbia y más. Sede en el Sector Estadio.';
import CarruselEventos from '../components/CarruselEventos/CarruselEventos';
import Historia from '../components/Historia/Historia';
import Escuela from '../components/Escuela/Escuela';
import Testimonios from '../components/Testimonios/Testimonios';
import ContactoSection from '../components/Contacto/Contacto';
import Noticias from '../components/Noticias/Noticias';
import Footer from '../components/Footer/Footer';

export default function Inicio() {
  const { state } = useLocation();

  useEffect(() => {
    if (state?.scrollTo) {
      const el = document.getElementById(state.scrollTo);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [state]);

  return (
    <main>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/`} />
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
      <Hero />
      <Historia />
      <CarruselEventos />
      <Escuela />
      <Testimonios />
      <Noticias />
      <ContactoSection />
      <Footer />
    </main>
  );
}
