import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Footer from "../components/Footer/Footer";
import { redesSociales } from "../data/redesSociales";
import { BASE_URL, OG_IMAGE } from "../utils/seo";

const PAGE_TITLE = "Contacto | Colombia Canta y Encanta";
const PAGE_DESC =
  "Visítanos en el Sector Estadio de Medellín o escríbenos por WhatsApp y email. Centro cultural Colombia Canta y Encanta.";

const BASE = import.meta.env.BASE_URL;

const WaIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const MailIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
    <rect x="2" y="4" width="20" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 6L12 13 2 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PinIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const infoItems = [
  {
    icono: WaIcon,
    label: "Escríbenos por WhatsApp",
    detalle: (
      <a href="https://wa.me/573015315119" className="contacto-info-link">
        +57 301 531 5119
      </a>
    ),
  },
  {
    icono: MailIcon,
    label: "Envíanos un correo",
    detalle: (
      <a href="mailto:info@colombiacanta.org" className="contacto-info-link">
        info@colombiacanta.org
      </a>
    ),
  },
  {
    icono: PinIcon,
    label: "Visita nuestra sede",
    detalle: "Calle 49 76a 65, Sector Estadio, Medellín, Colombia",
  },
];

export default function Contacto() {
  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "" });
  const [enviado, setEnviado] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setEnviado(true);
  };

  return (
    <main>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#/contacto`} />
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
            <span className="page-header-label">Medellín, Colombia</span>
            <h1>Hablemos</h1>
          </div>
          <div className="page-header-divisor" />
        </div>
      </div>

      {/* ── Información de contacto ───────────────────────────── */}
      <section className="contacto-info-section">
        <div className="container">
          <div className="contacto-info-header">
            <div className="contacto-info-header-texto">
              <h2 className="contacto-info-titulo">
                Diferentes maneras de encontrarnos
              </h2>
              <p className="contacto-info-desc">
                Elige el canal que más te acomode: te respondemos por
                WhatsApp, correo electrónico o puedes visitarnos en nuestra
                sede en Medellín.
              </p>
            </div>
            <div className="contacto-info-header-img-col">
              <img
                src={`${BASE}contacto/contacto-corazon-estrella.webp`}
                alt=""
                className="contacto-info-header-img"
              />
            </div>
          </div>

          <div className="contacto-info-grid">
            {infoItems.map((item) => (
              <div key={item.label} className="contacto-info-item">
                <div className="contacto-info-icono">{item.icono}</div>
                <strong className="contacto-info-label">{item.label}</strong>
                <span className="contacto-info-detalle">{item.detalle}</span>
              </div>
            ))}
          </div>

          <div className="contacto-redes-franja">
            <span className="contacto-redes-franja-titulo">Visita nuestras redes</span>
            <div className="contacto-redes-horizontales">
              {redesSociales.map((red) => (
                <a
                  key={red.label}
                  href={red.href}
                  className="contacto-red-icono"
                  style={{ "--red-color": red.color }}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={red.label}
                >
                  {red.svg}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Formulario + ubicación ─────────────────────────────── */}
      <section className="contacto-bottom-section">
        <div className="container">
          <div className="grid-2col-contacto">
            {/* Formulario — tarjeta oscura */}
            <div className="contacto-form-card">
              {enviado ? (
                <div className="contacto-enviado">
                  <div className="contacto-enviado-icono">✅</div>
                  <h3 className="contacto-enviado-titulo">
                    ¡Mensaje enviado!
                  </h3>
                  <p className="contacto-enviado-desc">
                    Nos pondremos en contacto contigo pronto.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contacto-form">
                  <div className="contacto-form-intro">
                    <h3 className="contacto-form-titulo">
                      ¡Contáctanos para más información!
                    </h3>
                    <p className="contacto-form-desc">
                      Escríbenos y nuestro equipo se pondrá en contacto
                      contigo.
                    </p>
                  </div>

                  <div className="contacto-form-grid">
                    <div className="contacto-form-group">
                      <label className="contacto-form-label" htmlFor="nombre">
                        Nombre completo
                      </label>
                      <input
                        id="nombre"
                        type="text"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                        className="contacto-form-input"
                      />
                    </div>
                    <div className="contacto-form-group">
                      <label className="contacto-form-label" htmlFor="email">
                        Correo electrónico
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="contacto-form-input"
                      />
                    </div>
                  </div>

                  <div className="contacto-form-group">
                    <label className="contacto-form-label" htmlFor="mensaje">
                      Mensaje
                    </label>
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      value={form.mensaje}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="contacto-form-textarea"
                    />
                  </div>

                  <button type="submit" className="contacto-form-btn">
                    Enviar mensaje
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="16"
                      height="16"
                    >
                      <path
                        d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </form>
              )}
            </div>

            {/* Ubicación */}
            <div className="contacto-ubicacion-col">
              <h2 className="contacto-ubicacion-titulo">Nuestra ubicación</h2>
              <p className="contacto-ubicacion-desc">
                Visítanos en nuestra sede en el Sector Estadio de Medellín,
                el lugar donde se forman las nuevas generaciones del folclor
                colombiano.
              </p>

              <iframe
                className="contacto-mapa"
                title="Mapa de nuestra sede"
                src={`https://www.google.com/maps?q=${encodeURIComponent("Calle 49 76a 65, Sector Estadio, Medellín, Colombia")}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
