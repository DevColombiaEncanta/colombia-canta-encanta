import { Helmet } from 'react-helmet-async';
import AgendaCalendario from '../components/AgendaCalendario/AgendaCalendario';
import EventosFijosHome from '../components/EventosFijos/EventosFijosHome';
import ContactoSection from '../components/Contacto/Contacto';
import Footer from '../components/Footer/Footer';
import './Eventos.css';
import { BASE_URL, OG_IMAGE } from '../utils/seo';

const PAGE_TITLE = 'Eventos | Colombia Canta y Encanta';
const PAGE_DESC = 'Agenda de eventos de Colombia Canta y Encanta en Medellín y gira USA 2026. Conciertos, festivales y eventos de música colombiana.';

export default function Eventos() {
  return (
    <main>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#/eventos`} />
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

      <div className="page-header">
        <div className="container">
          <div className="page-header-inner">
            <span className="page-header-label">Agenda · 2026</span>
            <h1>Eventos</h1>
          </div>
          <div className="page-header-divisor" />
        </div>
      </div>

      {/* ── Programas permanentes ── */}
      <section className="eventos-programas-section">
        <div className="container">
          <div className="ev-divider ev-divider--sin-lineas">
            <h2 className="ev-divider-titulo">Programas</h2>
          </div>
          <p className="ev-sub">Experiencias que puedes vivir cualquier semana del año</p>
        </div>
        <EventosFijosHome variant="zigzag" />
      </section>

      {/* ── Agenda ── */}
      <section id="agenda" className="eventos-page-section">
        <div className="container">
          <div className="ev-divider ev-divider--agenda">
            <h2 className="ev-divider-titulo">Próxima agenda</h2>
          </div>
          <AgendaCalendario />
        </div>
      </section>

      <ContactoSection />
      <Footer />
    </main>
  );
}
