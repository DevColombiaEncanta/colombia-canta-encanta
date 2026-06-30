import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Página no encontrada | Colombia Canta y Encanta</title>
        <meta name="robots" content="noindex" />
      </Helmet>
    <div style={{
      minHeight: '100vh',
      background: 'var(--crema)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 24px'
    }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'var(--amarillo)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '40px', marginBottom: '24px'
      }}>🎵</div>

      <h1 style={{
        fontFamily: 'var(--font-titulo)',
        fontSize: '80px',
        color: 'var(--azul-oscuro)',
        lineHeight: '1',
        marginBottom: '8px'
      }}>404</h1>

      <p style={{
        fontFamily: 'var(--font-titulo)',
        fontSize: '22px',
        color: 'var(--texto-principal)',
        marginBottom: '8px'
      }}>
        Esta página no existe, pero la música sigue.
      </p>

      <p style={{
        fontSize: '15px',
        color: 'var(--texto-secundario)',
        marginBottom: '40px'
      }}>
        Colombia Canta y Encanta · Medellín, Colombia
      </p>

      <Link to="/" className="btn btn-azul">Volver al Inicio</Link>
    </div>
    </>
  );
}
