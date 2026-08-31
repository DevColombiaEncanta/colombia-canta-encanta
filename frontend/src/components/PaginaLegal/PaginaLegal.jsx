import { Helmet } from "react-helmet-async";
import Footer from "../Footer/Footer";
import { BASE_URL, OG_IMAGE } from "../../utils/seo";
import "./PaginaLegal.css";

export default function PaginaLegal({ documento, ruta }) {
  const pageTitle = `${documento.titulo} | Colombia Canta y Encanta`;
  const pageDesc = `${documento.titulo} de Colombia Canta y Encanta.`;

  return (
    <main>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#${ruta}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:locale" content="es_CO" />
        <meta property="og:site_name" content="Colombia Canta y Encanta" />
      </Helmet>

      <div className="page-header">
        <div className="container">
          <div className="page-header-inner">
            <span className="page-header-label">Colombia Canta y Encanta</span>
            <h1>{documento.titulo}</h1>
          </div>
          <div className="page-header-divisor" />
        </div>
      </div>

      <section className="legal-doc-section">
        <div className="container legal-doc-container">
          {documento.secciones.map((seccion) => (
            <div key={seccion.numero} className="legal-seccion">
              <h2 className="legal-seccion-titulo">
                {seccion.numero}. {seccion.titulo}
              </h2>
              {seccion.parrafos?.map((parrafo, i) => (
                <p key={i} className="legal-parrafo">{parrafo}</p>
              ))}
              {seccion.lista && (
                <ul className="legal-lista">
                  {seccion.lista.map((item, i) => (
                    <li key={i}>
                      {typeof item === "string" ? (
                        item
                      ) : (
                        <>
                          <strong>{item.termino}</strong> {item.texto}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {seccion.parrafosFinales?.map((parrafo, i) => (
                <p key={i} className="legal-parrafo">{parrafo}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
