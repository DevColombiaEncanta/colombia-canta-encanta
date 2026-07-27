import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer/Footer';

export default function PagoCancelado() {
  const [params] = useSearchParams();

  // Mercado Pago puede enviar el slug del evento como external_reference
  // para saber a qué evento redirigir al usuario en "Intentar de nuevo"
  const externalRef = params.get('external_reference');
  const eventoSlug  = params.get('evento');

  const backToEvento = eventoSlug ? `/eventos/${eventoSlug}` : '/eventos';

  return (
    <>
      <Helmet>
        <title>Pago cancelado | Colombia Canta y Encanta</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="px-page">
        <div className="px-card">

          <div className="px-ico">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>

          <h1 className="px-title">Pago no completado</h1>
          <p className="px-sub">
            No se realizó ningún cobro. Puedes intentarlo nuevamente cuando quieras.
          </p>

          <div className="px-divider" />

          <p className="px-note">
            Si el problema persiste, contáctanos por WhatsApp y te ayudamos a completar tu reserva.
          </p>

          <div className="px-btns">
            <Link to={backToEvento} className="px-btn-primary">
              Intentar de nuevo
            </Link>
            <a
              href="https://wa.me/573015315119?text=Hola%2C+tuve+un+problema+al+pagar+mi+entrada+y+necesito+ayuda."
              target="_blank"
              rel="noopener noreferrer"
              className="px-btn-wa"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar por WhatsApp
            </a>
            <Link to="/eventos" className="px-btn-secondary">Ver todos los eventos</Link>
          </div>

          {externalRef && (
            <p className="px-detail">Referencia: {externalRef}</p>
          )}

        </div>
      </main>

      <Footer />

      <style>{`
        .px-page {
          min-height: 100vh;
          background: var(--bg-body);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 108px 24px 60px;
        }
        .px-card {
          background: var(--bg-card);
          border: 1px solid var(--border-sutil);
          border-radius: 20px;
          box-shadow: 0 8px 40px var(--sombra-media);
          padding: 52px 44px;
          max-width: 460px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }
        .px-ico {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--bg-hover);
          border: 2px solid var(--border-media);
          color: var(--texto-secundario);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          flex-shrink: 0;
        }
        .px-title {
          font-family: var(--font-titulo);
          font-size: 26px;
          font-weight: 700;
          color: var(--texto-principal);
          margin: 0;
        }
        .px-sub {
          font-size: 15px;
          color: var(--texto-secundario);
          line-height: 1.6;
          margin: 0;
        }
        .px-divider {
          width: 100%;
          height: 1px;
          background: var(--border-sutil);
          margin: 4px 0;
        }
        .px-note {
          font-size: 13px;
          color: var(--texto-secundario);
          line-height: 1.55;
          margin: 0;
        }
        .px-detail {
          font-size: 11px;
          color: var(--texto-secundario);
          opacity: 0.5;
          margin: 4px 0 0;
        }
        .px-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-top: 8px;
        }
        .px-btn-primary {
          display: block;
          width: 100%;
          padding: 14px 24px;
          border-radius: 100px;
          background: var(--coral);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          text-align: center;
          transition: opacity 0.2s ease;
        }
        .px-btn-primary:hover { opacity: 0.88; }
        .px-btn-wa {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 13px 24px;
          border-radius: 100px;
          background: #25D366;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          text-align: center;
          transition: opacity 0.2s ease;
        }
        .px-btn-wa:hover { opacity: 0.88; }
        .px-btn-secondary {
          display: block;
          width: 100%;
          padding: 13px 24px;
          border-radius: 100px;
          border: 1.5px solid var(--border-media);
          background: transparent;
          color: var(--texto-principal);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          text-align: center;
          transition: background 0.15s ease;
        }
        .px-btn-secondary:hover { background: var(--bg-hover); }
        @media (max-width: 1024px) {
          .px-page { padding-top: 96px; }
        }
        @media (max-width: 599px) {
          .px-page { padding: 88px 16px 48px; align-items: flex-start; }
          .px-card { padding: 36px 20px; }
          .px-title { font-size: 22px; }
        }
      `}</style>
    </>
  );
}
