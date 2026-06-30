import { Helmet } from 'react-helmet-async';
import ContactoSection from '../components/Contacto/Contacto';
import Footer from '../components/Footer/Footer';
import { BASE_URL, OG_IMAGE } from '../utils/seo';
import '../styles/main.css';

const PAGE_TITLE = 'Elenco Artístico | Colombia Canta y Encanta';
const PAGE_DESC = 'Conoce a los artistas, músicos y bailarines que conforman el elenco de Colombia Canta y Encanta, llevando la música tradicional colombiana al mundo.';

const BASE = import.meta.env.BASE_URL;

const grupos = [
  {
    id: 'semillero',
    label: 'Semillero',
    labelColor: 'label-rojo',
    titulo: 'Semillero Artístico',
    descripcion:
      'El Semillero es el programa de iniciación artística enfocado en la primera infancia. Aquí se trabaja la iniciación rítmica y la expresión corporal mediante el juego, la danza y el movimiento.',
    imagen: `${BASE}elenco-opt/elenco-danza.webp`,
    alt: 'Semillero artístico de Colombia Canta y Encanta',
  },
  {
    id: 'juvenil',
    label: 'Elenco Juvenil',
    labelColor: 'label-azul',
    titulo: 'Elenco Juvenil',
    descripcion:
      'Reunimos a las niñas y niños mayores de 13 años que han tenido una trayectoria en nuestra escuela. Con ellos realizamos la mayoría de shows, musicales, eventos y giras. Nuestro semillero también está presente en algunos momentos de encuentro con el público.',
    imagen: `${BASE}elenco-opt/elenco-juvenil.webp`,
    alt: 'Elenco Juvenil de Colombia Canta y Encanta',
  },
  {
    id: 'seniors',
    label: 'Artistas Seniors',
    labelColor: 'label-amarillo',
    titulo: 'Artistas Seniors',
    descripcion:
      'Los Seniors son un grupo de jóvenes apasionados por las músicas colombianas, cuya historia comenzó desde los 5 y 6 años en nuestra Escuela. Desde entonces, la música ha sido la banda sonora de sus vidas, acompañando no solo su formación artística, sino también el crecimiento de amistades que hoy se reflejan en el escenario.',
    imagen: `${BASE}elenco-opt/artistas-senior.webp`,
    alt: 'Artistas Seniors de Colombia Canta y Encanta',
  },
];

export default function Elenco() {
  return (
    <main>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#/elenco`} />
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
            <span className="page-header-label">Talento · Pasión · Identidad</span>
            <h1>Elenco Artístico</h1>
          </div>
          <div className="page-header-divisor" />
        </div>
      </div>

      <section className="elenco-grupos-section">
        <div className="elenco-cita-wrap">
          <p className="elenco-cita">Inspiramos vidas con sonidos de país</p>
        </div>
        {grupos.map((grupo, i) => (
          <div
            key={grupo.id}
            className={`elenco-grupo${i % 2 === 1 ? ' elenco-grupo--reverse' : ''}`}
          >
            <div className="elenco-grupo-img-wrap">
              <img
                src={grupo.imagen}
                alt={grupo.alt}
                className="elenco-grupo-img"
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
            <div className="elenco-grupo-texto">
              <span className={`label-seccion ${grupo.labelColor}`}>{grupo.label}</span>
              <h2 className="elenco-grupo-titulo">{grupo.titulo}</h2>
              <p className="elenco-grupo-desc">{grupo.descripcion}</p>
            </div>
          </div>
        ))}
      </section>

      <ContactoSection />
      <Footer />
    </main>
  );
}
