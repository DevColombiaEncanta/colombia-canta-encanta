import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import ContactoSection from "../components/Contacto/Contacto";
import Footer from "../components/Footer/Footer";
import InstagramWidget from "../components/InstagramWidget/InstagramWidget";
import SpotifyWidget from "../components/SpotifyWidget/SpotifyWidget";
import TripAdvisorWidget from "../components/TripAdvisorWidget/TripAdvisorWidget";
import "../styles/main.css";
import { BASE_URL, OG_IMAGE } from "../utils/seo";

const PAGE_TITLE = "Quiénes Somos | Colombia Canta y Encanta";
const PAGE_DESC =
  "Conoce la historia de Silvia Zapata y la misión de Colombia Canta y Encanta, centro cultural y escuela de música tradicional en Medellín.";

const BASE = import.meta.env.BASE_URL;

const stats = [
  { num: "+20", label: "años de historia" },
  { num: "+1000", label: "estudiantes formados" },
  { num: "5", label: "ritmos colombianos" },
];

const hoySomos = [
  { icono: "🎶", texto: "Programación Artística Permanente" },
  { icono: "🎓", texto: "Centro de Formación Artística" },
  { icono: "🏆", texto: "Festival Nacional" },
  { icono: "✨", texto: "Producción de Experiencias Artísticas" },
];

const fundadoraFotoQuote = {
  src: `${BASE}nosotros-fundadora/fundadora-escenario.webp`,
  alt: "Silvia Zapata Durango cantando en el escenario de Colombia Canta y Encanta",
};

const fundadoraFotoGuitarra = {
  src: `${BASE}nosotros-fundadora/fundadora-guitarra.webp`,
  alt: "Silvia Zapata Durango tocando guitarra",
};

/* Solo visible en tablet/mobile: une las fotos de la fundadora (hoy
   separadas en dos secciones distintas) en un único bloque — lado a
   lado en tablet, carrusel deslizable en mobile. */
function FundadoraGaleria({ fotos }) {
  const [activo, setActivo] = useState(0);
  const trackRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivo((i) => (i + 1) % fotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [fotos.length]);

  useEffect(() => {
    if (!trackRef.current) return;
    const slide = trackRef.current.children[activo];
    if (slide) {
      trackRef.current.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
    }
  }, [activo]);

  return (
    <div className="nosotros-fundadora-galeria">
      <div className="nosotros-fundadora-galeria-track" ref={trackRef}>
        {fotos.map((f, i) => (
          <div key={i} className="nosotros-fundadora-galeria-slide">
            <img src={f.src} alt={f.alt} className="nosotros-fundadora-galeria-img" />
          </div>
        ))}
      </div>
      <div className="nosotros-fundadora-galeria-dots">
        {fotos.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`nosotros-fundadora-galeria-dot${i === activo ? " activo" : ""}`}
            onClick={() => setActivo(i)}
            aria-label={`Ver foto ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Nosotros() {
  return (
    <main>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#/nosotros`} />
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
            <span className="page-header-label">
              Cultura · Identidad · Legado
            </span>
            <h1>Nosotros</h1>
          </div>
          <div className="page-header-divisor" />
        </div>
      </div>

      {/* ── Quiénes somos ─────────────────────────────────────── */}
      <section id="quienes-somos" className="nosotros-seccion">
        <div className="container">
          {/* Bloque 1 — intro */}
          <div className="nosotros-qs-grid">
            <div className="nosotros-qs-texto">
              <span className="label-seccion label-rojo">Quiénes somos</span>
              <h2 className="nosotros-h2">
                Un proyecto cultural que
                <br />
                nació en Medellín
              </h2>
              <p className="nosotros-bajada">
                Más de veinte años preservando el patrimonio musical de
                Colombia.
              </p>
              <p className="nosotros-parrafo">
                Colombia Canta y Encanta es una organización cultural dedicada a
                la formación musical de niños y jóvenes en música tradicional
                colombiana. Con sede en el Sector Estadio de Medellín, llevamos
                más de dos décadas preservando y difundiendo el patrimonio
                musical de nuestra nación.
              </p>
              <p className="nosotros-parrafo">
                Nuestra misión es conectar a las nuevas generaciones con las
                raíces del bambuco, el pasillo, la guabina, la cumbia y el
                currulao, llevando esa riqueza cultural a escenarios de todo el
                mundo.
              </p>
            </div>

            <div className="nosotros-qs-foto-col">
              <img
                src={`${BASE}nosotros-historia/nosotros-historia-quienes-somos.webp`}
                alt="Elenco de Colombia Canta y Encanta bailando con sombreros vueltiaos"
                className="nosotros-qs-foto"
              />
            </div>
          </div>

          {/* Bloque 2 — nuestros inicios (zigzag) */}
          <div className="nosotros-qs-grid nosotros-qs-grid--reversa">
            <div className="nosotros-qs-foto-col">
              <img
                src={`${BASE}nosotros-historia/nosotros-historia-festival.webp`}
                alt="Elenco de Colombia Canta y Encanta en una presentación de danza folclórica"
                className="nosotros-qs-foto"
              />
            </div>

            <div className="nosotros-qs-texto">
              <p className="nosotros-destacado">
                Somos un movimiento cultural que, desde Medellín, transforma
                vidas a través de la música tradicional colombiana, articulando
                formación artística, circulación y experiencias que fortalecen
                la identidad y conectan a Colombia con el mundo.
              </p>
              <p className="nosotros-parrafo">
                En el año 2003, nuestra fundadora Silvia Zapata, luego de una
                carrera de 20 años interpretando las músicas folclóricas y
                representando a nuestro país, decidió crear Colombia Canta y
                Encanta: un espacio donde las familias encuentran, a través de
                las artes escénicas, experiencias de calidad que potencian su
                crecimiento personal, su conexión con las raíces y el trabajo en
                equipo.
              </p>
              <p className="nosotros-parrafo nosotros-parrafo-fuerte">
                Hoy somos un Centro Cultural con:
              </p>
              <div className="nosotros-hoy-grid">
                {hoySomos.map((item) => (
                  <div key={item.texto} className="nosotros-hoy-item">
                    <span className="nosotros-hoy-icono">{item.icono}</span>
                    <span>{item.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bloque 3 — trayectoria internacional */}
          <div className="nosotros-qs-grid">
            <div className="nosotros-qs-texto">
              <p className="nosotros-parrafo">
                Hemos ganado mención del Ministerio de Cultura como Mejor
                Escuela de Música Privada. Nuestros alumnos han sido ganadores
                de los principales festivales de música en Colombia y hemos
                estado presentes en todas las temporadas de La Voz Kids
                Colombia.
              </p>
              <p className="nosotros-parrafo">
                Desde hace 12 años realizamos giras internacionales
                representando a nuestro país en escenarios de Austria,
                Eslovenia, Italia, Roma, México y Estados Unidos.
              </p>
              <p className="nosotros-destacado">
                Pero nuestro mejor premio es el crecimiento personal que niños,
                jóvenes y familias experimentan con nuestra formación artística,
                en un ambiente cultural con contenidos de alto impacto.
              </p>
            </div>

            <div className="nosotros-qs-foto-col">
              <img
                src={`${BASE}nosotros-historia/nosotros-historia-disney.webp`}
                alt="Elenco de Colombia Canta y Encanta en Disney Imagination Campus"
                className="nosotros-qs-foto"
              />
            </div>
          </div>

          {/* Cifras */}
          <div className="nosotros-stats-strip">
            {stats.map((s) => (
              <div key={s.label} className="nosotros-stats-item">
                <div className="nosotros-stats-num">{s.num}</div>
                <div className="nosotros-stats-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="nosotros-divisor" />
        </div>
      </section>

      {/* ── Cita puente ────────────────────────────────────────── */}
      <div className="nosotros-quote-puente">
        <div className="container">
          <div className="nosotros-fundadora-header">
            <span className="label-seccion label-amarillo">
              Nuestra Fundadora
            </span>
            <h2 className="nosotros-fundadora-rol">
              Cantante · Directora · Visionaria
            </h2>
          </div>

          <FundadoraGaleria fotos={[fundadoraFotoQuote, fundadoraFotoGuitarra]} />

          <div className="nosotros-quote-puente-grid">
            <div className="nosotros-quote-puente-foto-col">
              <img
                src={fundadoraFotoQuote.src}
                alt={fundadoraFotoQuote.alt}
                className="nosotros-quote-puente-foto"
              />
            </div>
            <div className="nosotros-quote-puente-texto-col">
              <p className="nosotros-quote-puente-texto">
                Yo quería mantener vivo un legado que recibí y que me sirvió
                para todas las áreas de mi vida. Quería sembrar esto en las
                nuevas generaciones, para que pudieran conectar con sus talentos
                al tiempo que abrazan el amor por Colombia y por las historias
                que hay detrás de las músicas folclóricas.
              </p>
              <p className="nosotros-quote-puente-autor">
                Silvia Zapata Durango · Fundadora
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fundadora ──────────────────────────────────────────── */}
      <section id="fundadora" className="nosotros-fundadora-section">
        <div className="container">
          <div className="nosotros-fundadora-grid nosotros-fundadora-grid--reversa">
            <div className="nosotros-fundadora-contenido">
              <p className="nosotros-parrafo">
                Hace dos décadas, Silvia Zapata Durango buscó la manera de que
                las nuevas generaciones conocieran el legado de la música
                colombiana y fundó Colombia Canta y Encanta. Hoy, en su vigésimo
                aniversario, la organización lleva los sonidos del bambuco, el
                pasillo y la cumbia a Estados Unidos y Brasil, reconectando a
                los colombianos en el exterior con sus raíces.
              </p>

              <p className="nosotros-parrafo">
                Su trayectoria ha sido respaldada por el Ministerio de Cultura,
                el Congreso de la República, la Gobernación de Antioquia y el
                Concejo de Medellín, instituciones que han reconocido el impacto
                social y cultural de este proyecto en la formación de cientos de
                niños, jóvenes y familias.
              </p>

              <div className="nosotros-bienal">
                <span className="nosotros-bienal-icono">🏆</span>
                <div className="nosotros-bienal-texto">
                  <span className="nosotros-bienal-label">Seleccionada</span>
                  <strong>
                    Bienal de los 100 Proyectos Culturales de Interés Nacional
                  </strong>
                </div>
              </div>
            </div>

            <div className="nosotros-fundadora-foto-col">
              <img
                src={fundadoraFotoGuitarra.src}
                alt={fundadoraFotoGuitarra.alt}
                className="nosotros-fundadora-foto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Pilares ────────────────────────────────────────────── */}
      <section id="inspiracion" className="nosotros-pilares-section">
        <div className="container">
          <div className="nosotros-pilares-header">
            <span className="label-seccion label-amarillo">
              Inspiración y comunidad
            </span>
            <h2 className="nosotros-pilares-titulo">
              La música como puente cultural
            </h2>
            <p className="nosotros-pilares-desc">
              Cada bambuco, cada pasillo, cada tonada guarda la historia de un
              pueblo y la identidad de una nación. Nuestra labor es asegurarnos
              de que esa historia siga viva.
            </p>
          </div>

          <div className="grid-3col">
            <SpotifyWidget />
            <InstagramWidget />
            <TripAdvisorWidget />
          </div>

          <div className="nosotros-pilares-cta">
            <Link to="/elenco" className="btn btn-rojo">
              Conocer el elenco →
            </Link>
          </div>
        </div>
      </section>

      <ContactoSection />
      <Footer />
    </main>
  );
}
