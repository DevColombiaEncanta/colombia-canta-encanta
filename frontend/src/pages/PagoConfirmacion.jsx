import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer/Footer';

export default function PagoConfirmacion() {
  const [params] = useSearchParams();

  // Mercado Pago envía estos params en el redirect de vuelta
  const status          = params.get('collection_status') ?? params.get('status');
  const paymentId       = params.get('collection_id') ?? params.get('payment_id');
  const paymentType     = params.get('payment_type');
  const externalRef     = params.get('external_reference');

  const isPending = status === 'pending' || status === 'in_process';

  return (
    <>
      <Helmet>
        <title>
          {isPending ? 'Pago en proceso' : '¡Pago confirmado!'} | Colombia Canta y Encanta
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="pc-page">
        <div className="pc-card">

          {isPending ? (
            <PendingView paymentId={paymentId} externalRef={externalRef} />
          ) : (
            <SuccessView paymentId={paymentId} paymentType={paymentType} externalRef={externalRef} />
          )}

        </div>
      </main>

      <Footer />

      <style>{`
        .pc-page {
          min-height: 100vh;
          background: var(--bg-body);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 108px 24px 60px;
        }
        .pc-card {
          background: var(--bg-card);
          border: 1px solid var(--border-sutil);
          border-radius: 20px;
          box-shadow: 0 8px 40px var(--sombra-media);
          padding: 52px 44px;
          max-width: 480px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }
        .pc-ico {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          flex-shrink: 0;
        }
        .pc-ico--ok      { background: #16a34a; color: #fff; }
        .pc-ico--pending { background: var(--amarillo, #f59e0b); color: #000; }
        .pc-title {
          font-family: var(--font-titulo);
          font-size: 26px;
          font-weight: 700;
          color: var(--texto-principal);
          margin: 0;
        }
        .pc-sub {
          font-size: 15px;
          color: var(--texto-secundario);
          line-height: 1.6;
          margin: 0;
        }
        .pc-divider {
          width: 100%;
          height: 1px;
          background: var(--border-sutil);
          margin: 8px 0;
        }
        .pc-detail {
          font-size: 12px;
          color: var(--texto-secundario);
          opacity: 0.6;
          margin: 0;
        }
        .pc-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-top: 8px;
        }
        .pc-btn-primary {
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
        .pc-btn-primary:hover { opacity: 0.88; }
        .pc-btn-secondary {
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
        .pc-btn-secondary:hover { background: var(--bg-hover); }
        @media (max-width: 1024px) {
          .pc-page { padding-top: 96px; }
        }
        @media (max-width: 599px) {
          .pc-page { padding: 88px 16px 48px; align-items: flex-start; }
          .pc-card { padding: 36px 20px; }
          .pc-title { font-size: 22px; }
        }
      `}</style>
    </>
  );
}

function SuccessView({ paymentId, paymentType, externalRef }) {
  return (
    <>
      <div className="pc-ico pc-ico--ok">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="pc-title">¡Pago confirmado!</h1>
      <p className="pc-sub">
        Tu entrada está en camino. En los próximos minutos recibirás un correo con tu boleta digital.
        Revisa también tu carpeta de spam.
      </p>

      <div className="pc-divider" />

      {paymentId && (
        <p className="pc-detail">N.° de pago: {paymentId}</p>
      )}
      {paymentType && (
        <p className="pc-detail">Método: {PAYMENT_TYPE_LABEL[paymentType] ?? paymentType}</p>
      )}
      {externalRef && (
        <p className="pc-detail">Referencia: {externalRef}</p>
      )}

      <div className="pc-btns">
        <Link to="/eventos" className="pc-btn-primary">Ver más eventos →</Link>
        <Link to="/" className="pc-btn-secondary">Volver al inicio</Link>
      </div>
    </>
  );
}

function PendingView({ paymentId, externalRef }) {
  return (
    <>
      <div className="pc-ico pc-ico--pending">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h1 className="pc-title">Pago en proceso</h1>
      <p className="pc-sub">
        Tu pago está siendo verificado. Te notificaremos por correo electrónico
        cuando se confirme. Esto puede tardar unos minutos.
      </p>

      <div className="pc-divider" />

      {paymentId && <p className="pc-detail">N.° de pago: {paymentId}</p>}
      {externalRef && <p className="pc-detail">Referencia: {externalRef}</p>}

      <div className="pc-btns">
        <Link to="/eventos" className="pc-btn-primary">Ver más eventos →</Link>
        <Link to="/" className="pc-btn-secondary">Volver al inicio</Link>
      </div>
    </>
  );
}

const PAYMENT_TYPE_LABEL = {
  credit_card:  'Tarjeta de crédito',
  debit_card:   'Tarjeta débito',
  bank_transfer: 'Transferencia bancaria',
  ticket:       'Efectivo',
  pse:          'PSE',
  nequi:        'Nequi',
  bancolombia_qr: 'QR Bancolombia',
};
