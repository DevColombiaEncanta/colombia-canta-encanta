import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCarrito } from '../context/CarritoContext';
import Footer from '../components/Footer/Footer';
import { BASE_URL, OG_IMAGE } from '../utils/seo';
import './Carrito.css';

const PAGE_TITLE = 'Carrito | Colombia Canta y Encanta';
const PAGE_DESC = 'Revisa tu pedido y procede al pago de los productos oficiales de Colombia Canta y Encanta.';

const parsePrecio = (precio) => parseInt(precio.replace(/\D/g, ''), 10);
const formatPrecio = (num) => '$' + num.toLocaleString('es-CO');

export default function Carrito() {
  const { items, actualizarCantidad, eliminar } = useCarrito();
  const subtotal = items.reduce((sum, item) => sum + parsePrecio(item.precio) * item.cantidad, 0);

  return (
    <main>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#/tienda/carrito`} />
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
            <span className="page-header-label">Tu pedido</span>
            <h1>Carrito</h1>
          </div>
          <div className="page-header-divisor" />
        </div>
      </div>

      <section style={{ padding: '56px 0 80px', background: 'var(--bg-body)' }}>
        <div className="container">
          {items.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 24px',
              maxWidth: '480px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '72px', marginBottom: '24px' }}>🛒</div>
              <h2 style={{
                fontFamily: 'var(--font-titulo)',
                fontSize: '28px',
                marginBottom: '12px',
                color: 'var(--texto-principal)'
              }}>
                Tu carrito está vacío
              </h2>
              <p style={{
                color: 'var(--texto-secundario)',
                fontSize: '16px',
                marginBottom: '32px',
                lineHeight: '1.6'
              }}>
                Aún no has agregado productos. Explora nuestra tienda y encuentra el merch oficial de Colombia Canta y Encanta.
              </p>
              <Link to="/tienda" className="btn btn-azul">
                Ver tienda →
              </Link>
            </div>
          ) : (
            <div className="carrito-grid">
              {/* Lista de productos */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-sutil)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--border-sutil)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{ fontFamily: 'var(--font-titulo)', fontSize: '18px', margin: 0 }}>
                    {items.length} {items.length === 1 ? 'producto' : 'productos'}
                  </h2>
                  <Link to="/tienda" style={{
                    color: 'var(--coral)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}>
                    ← Seguir comprando
                  </Link>
                </div>

                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="carrito-item"
                    style={{
                      borderBottom: index < items.length - 1 ? '1px solid var(--border-sutil)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '10px',
                      background: item.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      flexShrink: 0
                    }}>
                      {item.emoji}
                    </div>

                    <div>
                      <div style={{
                        fontFamily: 'var(--font-titulo)',
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '4px',
                        color: 'var(--texto-principal)'
                      }}>
                        {item.nombre}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--texto-secundario)',
                        marginBottom: '12px'
                      }}>
                        {item.categoria}
                        {item.talla && ` · Talla: ${item.talla}`}
                        {item.color && ` · ${item.color.nombre}`}
                        {` · ${item.precio} c/u`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          onClick={() => actualizarCantidad(item.id, -1)}
                          style={{
                            width: '32px', height: '32px',
                            border: '1.5px solid var(--border-media)',
                            borderRight: 'none',
                            borderRadius: '8px 0 0 8px',
                            background: 'var(--bg-surface)',
                            color: 'var(--texto-principal)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-cuerpo)',
                            lineHeight: 1
                          }}
                        >
                          −
                        </button>
                        <span style={{
                          width: '40px', height: '32px',
                          border: '1.5px solid var(--border-media)',
                          borderLeft: 'none', borderRight: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '15px', fontWeight: '600',
                          background: 'var(--bg-card)',
                          color: 'var(--texto-principal)'
                        }}>
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => actualizarCantidad(item.id, 1)}
                          style={{
                            width: '32px', height: '32px',
                            border: '1.5px solid var(--border-media)',
                            borderLeft: 'none',
                            borderRadius: '0 8px 8px 0',
                            background: 'var(--bg-surface)',
                            color: 'var(--texto-principal)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-cuerpo)',
                            lineHeight: 1
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="carrito-item-acciones" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '12px'
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-titulo)',
                        fontSize: '17px',
                        fontWeight: '700',
                        color: 'var(--coral)'
                      }}>
                        {formatPrecio(parsePrecio(item.precio) * item.cantidad)}
                      </span>
                      <button
                        onClick={() => eliminar(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--texto-secundario)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          padding: '4px 0',
                          fontFamily: 'var(--font-cuerpo)',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px'
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen del pedido */}
              <div className="carrito-resumen" style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-sutil)',
                padding: '24px'
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-titulo)',
                  fontSize: '18px',
                  marginBottom: '20px',
                  color: 'var(--texto-principal)'
                }}>
                  Resumen del pedido
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                    <span style={{ color: 'var(--texto-secundario)' }}>Subtotal</span>
                    <span style={{ fontWeight: '600', color: 'var(--texto-principal)' }}>{formatPrecio(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                    <span style={{ color: 'var(--texto-secundario)' }}>Envío</span>
                    <span style={{ color: 'var(--texto-secundario)', fontSize: '13px' }}>A coordinar</span>
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-sutil)',
                  paddingTop: '16px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontFamily: 'var(--font-titulo)', fontSize: '17px', fontWeight: '700', color: 'var(--texto-principal)' }}>
                    Total
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-titulo)',
                    fontSize: '22px',
                    fontWeight: '700',
                    color: 'var(--coral)'
                  }}>
                    {formatPrecio(subtotal)}
                  </span>
                </div>

                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface)',
                    border: '1.5px solid var(--border-media)',
                    color: 'var(--texto-secundario)',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'not-allowed',
                    fontFamily: 'var(--font-cuerpo)',
                    marginBottom: '12px'
                  }}
                >
                  Proceder al pago
                </button>
                <p style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--texto-secundario)',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  💳 Pagos disponibles próximamente
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
