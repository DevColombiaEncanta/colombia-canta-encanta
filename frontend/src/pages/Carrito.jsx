import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCarrito } from '../context/CarritoContext';
import Footer from '../components/Footer/Footer';
import { apiFetch } from '../utils/api';
import { EMAIL_REGEX } from '../utils/validacion';
import { formatCOP as formatPrecio } from '../utils/formato';
import { BASE_URL, OG_IMAGE } from '../utils/seo';
import './Carrito.css';

const PAGE_TITLE = 'Carrito | Colombia Canta y Encanta';
const PAGE_DESC = 'Revisa tu pedido y procede al pago de los productos oficiales de Colombia Canta y Encanta.';

function validateField(field, value) {
  if (field === 'nombre') return value.trim().length < 2 ? 'Ingresa tu nombre completo' : '';
  if (field === 'celular') return value.replace(/\D/g, '').length < 7 ? 'Ingresa un número válido' : '';
  if (field === 'email') return EMAIL_REGEX.test(value.trim()) ? '' : 'Ingresa un correo electrónico válido';
  if (field === 'direccion') return value.trim().length < 5 ? 'Ingresa tu dirección de envío' : '';
  if (field === 'ciudad') return value.trim().length < 2 ? 'Ingresa tu ciudad' : '';
  return '';
}

const CAMPOS_REQUERIDOS = ['nombre', 'celular', 'email', 'direccion', 'ciudad'];

// Formulario de datos del comprador — desplegado dentro de la misma pestaña
// del carrito (no un modal aparte, a diferencia de Eventos/ReservaModal),
// según lo acordado con el usuario: se completa antes de mostrar cualquier
// opción de medio de pago. Incluye dirección de envío (Tienda despacha
// productos físicos, a diferencia de una reserva de evento) y el checkbox de
// términos y condiciones.
function CompradorForm({ items, subtotal, onVolver, onExito }) {
  const [form, setForm] = useState({
    nombre: '', celular: '', email: '', direccion: '', ciudad: '', direccionAdicional: '',
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);

  const set = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (touched[field]) setErrors((e) => ({ ...e, [field]: validateField(field, val) }));
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validateField(field, form[field]) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(CAMPOS_REQUERIDOS.map((f) => [f, true]));
    const allErrors = Object.fromEntries(CAMPOS_REQUERIDOS.map((f) => [f, validateField(f, form[f])]));
    setTouched(allTouched);
    setErrors(allErrors);
    if (Object.values(allErrors).some(Boolean) || !aceptaTerminos) return;

    setErrorEnvio(null);
    setLoading(true);

    try {
      const { data } = await apiFetch('/api/pedidos', {
        method: 'POST',
        body: {
          nombre: form.nombre.trim(),
          celular: form.celular.trim(),
          email: form.email.trim(),
          direccion: form.direccion.trim(),
          ciudad: form.ciudad.trim(),
          direccion_adicional: form.direccionAdicional.trim() || null,
          items: items.map((item) => ({ variante_id: item.id, cantidad: item.cantidad })),
          acepta_terminos: true,
        },
      });
      onExito(data);
    } catch (err) {
      setErrorEnvio(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !Object.values(errors).some(Boolean)
    && CAMPOS_REQUERIDOS.every((f) => form[f].trim()) && aceptaTerminos;

  return (
    <div className="cf-panel">
      <h3 className="cf-titulo">Datos de envío</h3>
      <p className="cf-subtitulo">Completa tus datos para coordinar el pago y el envío de tu pedido.</p>

      <form className="cf-form" onSubmit={handleSubmit} noValidate>
        <div className="cf-field-fila">
          <div className="cf-field">
            <label className="cf-label">Nombre completo</label>
            <input
              className={`cf-input${touched.nombre && errors.nombre ? ' cf-input--error' : ''}`}
              type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
              onBlur={() => handleBlur('nombre')} autoComplete="name"
            />
            {touched.nombre && errors.nombre && <span className="cf-field-error">{errors.nombre}</span>}
          </div>
          <div className="cf-field">
            <label className="cf-label">Celular</label>
            <input
              className={`cf-input${touched.celular && errors.celular ? ' cf-input--error' : ''}`}
              type="tel" value={form.celular} onChange={(e) => set('celular', e.target.value)}
              onBlur={() => handleBlur('celular')} autoComplete="tel"
            />
            {touched.celular && errors.celular && <span className="cf-field-error">{errors.celular}</span>}
          </div>
        </div>

        <div className="cf-field">
          <label className="cf-label">Correo electrónico</label>
          <input
            className={`cf-input${touched.email && errors.email ? ' cf-input--error' : ''}`}
            type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
            onBlur={() => handleBlur('email')} autoComplete="email"
          />
          {touched.email && errors.email ? (
            <span className="cf-field-error">{errors.email}</span>
          ) : (
            <span className="cf-field-hint">Aquí recibirás la confirmación de tu pedido</span>
          )}
        </div>

        <div className="cf-field">
          <label className="cf-label">Dirección de envío</label>
          <input
            className={`cf-input${touched.direccion && errors.direccion ? ' cf-input--error' : ''}`}
            type="text" placeholder="Calle, número" value={form.direccion} onChange={(e) => set('direccion', e.target.value)}
            onBlur={() => handleBlur('direccion')} autoComplete="street-address"
          />
          {touched.direccion && errors.direccion && <span className="cf-field-error">{errors.direccion}</span>}
        </div>

        <div className="cf-field-fila">
          <div className="cf-field">
            <label className="cf-label">Ciudad</label>
            <input
              className={`cf-input${touched.ciudad && errors.ciudad ? ' cf-input--error' : ''}`}
              type="text" value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)}
              onBlur={() => handleBlur('ciudad')} autoComplete="address-level2"
            />
            {touched.ciudad && errors.ciudad && <span className="cf-field-error">{errors.ciudad}</span>}
          </div>
          <div className="cf-field">
            <label className="cf-label">Apto / referencia <span className="cf-opcional">(opcional)</span></label>
            <input
              className="cf-input" type="text" value={form.direccionAdicional}
              onChange={(e) => set('direccionAdicional', e.target.value)} autoComplete="address-line2"
            />
          </div>
        </div>

        <div className="cf-total">
          <span className="cf-total-label">Total del pedido</span>
          <span className="cf-total-valor">{formatPrecio(subtotal)}</span>
        </div>

        <label className="cf-checkbox">
          <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} />
          <span>
            He leído y acepto los{' '}
            <Link to="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer">Términos y Condiciones</Link>.
          </span>
        </label>

        {errorEnvio && <p className="cf-field-error" role="alert">{errorEnvio}</p>}

        <div className="cf-acciones">
          <button type="button" className="cf-btn-volver" onClick={onVolver} disabled={loading}>← Volver al carrito</button>
          <button type="submit" className="cf-btn-submit" disabled={loading || !canSubmit}>
            {loading ? <span className="cf-spinner" /> : 'Confirmar pedido'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PedidoExito({ pedido, onCerrar }) {
  return (
    <div className="cf-panel cf-exito">
      <div className="cf-exito-ico">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h3>¡Pedido recibido!</h3>
      <p>Te contactaremos a</p>
      <strong className="cf-exito-email">{pedido.email}</strong>
      <p className="cf-exito-sub">para coordinar el pago y el envío de tu pedido. Revisa también tu carpeta de spam.</p>
      <Link to="/tienda" className="cf-btn-submit" onClick={onCerrar}>Seguir comprando</Link>
    </div>
  );
}

export default function Carrito() {
  const { items, actualizarCantidad, eliminar, vaciar } = useCarrito();
  const [paso, setPaso] = useState('carrito'); // 'carrito' | 'datos' | 'listo'
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const subtotal = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const manejarExito = (pedido) => {
    setPedidoCreado(pedido);
    vaciar();
    setPaso('listo');
  };

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
          {paso === 'listo' ? (
            <div className="carrito-grid-solo">
              <PedidoExito pedido={pedidoCreado} onCerrar={() => setPaso('carrito')} />
            </div>
          ) : items.length === 0 ? (
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
                    <div
                      className="carrito-item-thumb"
                      style={{
                        // Bug real encontrado en 5.4 tercera ronda: `background` (shorthand)
                        // y `backgroundImage` en el mismo objeto de estilo chocan — si
                        // `backgroundImage` queda en `undefined`, React limpia esa
                        // propiedad después de que `background` ya la había definido,
                        // dejando el degradado invisible. Usar solo `backgroundImage`
                        // (una URL o, si no hay foto, el degradado — un gradiente CSS
                        // también es un valor válido de `background-image`) evita el
                        // choque Y deja que `background-size: cover` de Carrito.css siga
                        // aplicando — el shorthand `background` reinicia ese valor a su
                        // default cuando no lo especifica, que fue justo lo que dejaba la
                        // foto sin recortar (se veía como una esquina en blanco).
                        backgroundImage: item.imagenes?.[0] ? `url(${item.imagenes[0]})` : item.bg,
                      }}
                    >
                      {!item.imagenes?.[0] && item.emoji}
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
                        {item.categoriaNombre}
                        {item.talla && ` · Talla: ${item.talla}`}
                        {item.colorNombre && ` · ${item.colorNombre}`}
                        {` · ${formatPrecio(item.precio)} c/u`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          onClick={() => actualizarCantidad(item.id, -1)}
                          disabled={paso === 'datos'}
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
                          disabled={paso === 'datos'}
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
                        {formatPrecio(item.precio * item.cantidad)}
                      </span>
                      {paso !== 'datos' && (
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
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen del pedido / formulario de datos */}
              <div className="carrito-resumen" style={paso === 'carrito' ? {
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-sutil)',
                padding: '24px'
              } : undefined}>
                {paso === 'datos' ? (
                  <CompradorForm
                    items={items}
                    subtotal={subtotal}
                    onVolver={() => setPaso('carrito')}
                    onExito={manejarExito}
                  />
                ) : (
                  <>
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
                      onClick={() => setPaso('datos')}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'var(--coral)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '15px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-cuerpo)',
                      }}
                    >
                      Continuar →
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
