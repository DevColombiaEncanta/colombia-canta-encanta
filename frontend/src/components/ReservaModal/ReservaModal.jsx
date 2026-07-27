import { useEffect, useRef, useState } from 'react';
import './ReservaModal.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const formatCOP = n => '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function validateField(field, value) {
  if (field === 'nombre')  return value.trim().length < 2  ? 'Ingresa tu nombre completo' : '';
  if (field === 'celular') return value.replace(/\D/g, '').length < 7 ? 'Ingresa un número válido' : '';
  if (field === 'email')   return EMAIL_RE.test(value.trim()) ? '' : 'Ingresa un correo electrónico válido';
  return '';
}

export default function ReservaModal({ evento, itemSeleccionado, onClose }) {
  const [form, setForm] = useState({ nombre: '', celular: '', email: '', cantidad: 1 });
  const [zonaSeleccionada, setZonaSeleccionada] = useState(() => evento.zonas?.[0] ?? null);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  const esPago = evento.precio &&
    !['Entrada libre', 'Próximamente', 'Convocatoria abierta'].includes(evento.precio);

  const maxEntradas = evento.maxEntradas ?? 20;

  const precioNumerico = zonaSeleccionada
    ? parseInt(zonaSeleccionada.precio.replace(/[^0-9]/g, ''), 10)
    : null;
  const totalStr = precioNumerico
    ? formatCOP(precioNumerico * form.cantidad)
    : null;

  const priceBadge = zonaSeleccionada
    ? `${zonaSeleccionada.nombre} · ${zonaSeleccionada.precio}`
    : (evento.precio ?? 'Reserva gratuita');
  const eventoNombre = itemSeleccionado ? itemSeleccionado.nombre : evento.titulo;
  const eventoFecha  = itemSeleccionado
    ? `${itemSeleccionado.dia} · ${itemSeleccionado.hora}`
    : (evento.fechaCompleta ?? evento.fecha ?? '');
  const eventoLugar  = evento.lugar ?? evento.ciudad;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleOverlay = e => { if (e.target === overlayRef.current) onClose(); };

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (touched[field]) setErrors(e => ({ ...e, [field]: validateField(field, val) }));
  };

  const handleBlur = field => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(e => ({ ...e, [field]: validateField(field, form[field]) }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const allTouched = { nombre: true, celular: true, email: true };
    const allErrors  = {
      nombre:  validateField('nombre',  form.nombre),
      celular: validateField('celular', form.celular),
      email:   validateField('email',   form.email),
    };
    setTouched(allTouched);
    setErrors(allErrors);
    if (Object.values(allErrors).some(Boolean)) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1200);
  };

  const canSubmit = !Object.values(errors).some(Boolean)
    && form.nombre.trim() && form.celular.trim() && form.email.trim();

  return (
    <div className="rm-overlay" ref={overlayRef} onClick={handleOverlay}>
      <div className="rm-modal" ref={panelRef} role="dialog" aria-modal="true">
        <button className="rm-close" onClick={onClose} aria-label="Cerrar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="rm-panel">
          {submitted ? (
            <SuccessView email={form.email} onClose={onClose} />
          ) : (
            <>
              <span className="rm-badge">{priceBadge}</span>
              <h2 className="rm-titulo">Datos de Reserva</h2>
              <p className="rm-subtitulo">
                {esPago
                  ? 'Ingresa tus datos para continuar con el pago y emitir tu entrada.'
                  : 'Por favor ingresa tus datos para emitir tu entrada digital.'}
              </p>

              {itemSeleccionado && (
                <div className="rm-show-badge">
                  <span className="rm-show-nombre">{itemSeleccionado.nombre}</span>
                  <span className="rm-show-meta">{itemSeleccionado.dia} · {itemSeleccionado.hora}</span>
                </div>
              )}

              {evento.zonas?.length > 0 && (
                <div className="rm-zonas">
                  <span className="rm-zonas-label">Selecciona tu zona</span>
                  <div className="rm-zonas-btns">
                    {evento.zonas.map(z => (
                      <button
                        key={z.nombre}
                        type="button"
                        className={`rm-zona-btn${zonaSeleccionada?.nombre === z.nombre ? ' rm-zona-btn--activo' : ''}`}
                        onClick={() => setZonaSeleccionada(z)}
                      >
                        {z.nombre} · {z.precio}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form className="rm-form" onSubmit={handleSubmit} noValidate>
                <div className="rm-field">
                  <label className="rm-label">Nombre completo</label>
                  <input
                    className={`rm-input${touched.nombre && errors.nombre ? ' rm-input--error' : ''}`}
                    type="text"
                    placeholder="Tu nombre"
                    value={form.nombre}
                    onChange={e => set('nombre', e.target.value)}
                    onBlur={() => handleBlur('nombre')}
                    autoComplete="name"
                  />
                  {touched.nombre && errors.nombre && (
                    <span className="rm-field-error">{errors.nombre}</span>
                  )}
                </div>

                <div className="rm-field">
                  <label className="rm-label">Número de celular</label>
                  <input
                    className={`rm-input${touched.celular && errors.celular ? ' rm-input--error' : ''}`}
                    type="tel"
                    placeholder="+57 300 000 0000"
                    value={form.celular}
                    onChange={e => set('celular', e.target.value)}
                    onBlur={() => handleBlur('celular')}
                    autoComplete="tel"
                  />
                  {touched.celular && errors.celular && (
                    <span className="rm-field-error">{errors.celular}</span>
                  )}
                </div>

                <div className="rm-field">
                  <label className="rm-label">Correo electrónico</label>
                  <input
                    className={`rm-input${touched.email && errors.email ? ' rm-input--error' : ''}`}
                    type="email"
                    placeholder="tu@correo.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    autoComplete="email"
                  />
                  {touched.email && errors.email ? (
                    <span className="rm-field-error">{errors.email}</span>
                  ) : (
                    <span className="rm-field-hint">Aquí recibirás tu entrada digital</span>
                  )}
                </div>

                <div className="rm-field">
                  <label className="rm-label">Cantidad de entradas</label>
                  <div className="rm-stepper">
                    <button
                      type="button"
                      className="rm-stepper-btn"
                      onClick={() => set('cantidad', Math.max(1, form.cantidad - 1))}
                      disabled={form.cantidad <= 1}
                      aria-label="Reducir cantidad"
                    >−</button>
                    <span className="rm-stepper-val">{form.cantidad}</span>
                    <button
                      type="button"
                      className="rm-stepper-btn"
                      onClick={() => set('cantidad', Math.min(maxEntradas, form.cantidad + 1))}
                      disabled={form.cantidad >= maxEntradas}
                      aria-label="Aumentar cantidad"
                    >+</button>
                    {maxEntradas <= 5 && (
                      <span className="rm-stepper-max">máx. {maxEntradas}</span>
                    )}
                  </div>
                  {totalStr && (
                    <div className="rm-total">
                      <span className="rm-total-label">Total estimado</span>
                      <span className="rm-total-valor">{totalStr}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="rm-btn-submit"
                  disabled={loading || !canSubmit}
                >
                  {loading
                    ? <span className="rm-spinner" />
                    : esPago
                      ? 'Continuar al pago →'
                      : 'Emitir entrada'}
                </button>
              </form>

              <p className="rm-legal">Tus datos están protegidos y no serán compartidos con terceros.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessView({ email, onClose }) {
  return (
    <div className="rm-success">
      <div className="rm-success-ico">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h3>¡Reserva recibida!</h3>
      <p>Te enviaremos la confirmación a</p>
      <strong className="rm-success-email">{email}</strong>
      <p className="rm-success-sub">Recibirás tu entrada digital en breve. Revisa también tu carpeta de spam.</p>
      <button className="rm-btn-submit" onClick={onClose}>Listo</button>
    </div>
  );
}
