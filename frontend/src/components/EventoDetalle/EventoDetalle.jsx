import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import EventCard from '../CarruselEventos/EventCard';
import ContactoSection from '../Contacto/Contacto';
import Footer from '../Footer/Footer';
import ReservaModal from '../ReservaModal/ReservaModal';
import { fechaLocalDesdeISO } from '../../utils/formato';
import './EventoDetalle.css';
import '../CarruselEventos/CarruselEventos.css';

// ⭐ Bug real (auditoría 2026-08-30): `new Date(fechaISO)` interpreta una
// fecha "YYYY-MM-DD" como medianoche UTC — en Colombia (UTC-5) eso muestra el
// día anterior durante buena parte del día real. Mismo hallazgo que ya se
// había resuelto en `utils/formato.js` (`fechaLocalDesdeISO`) para el resto
// del sitio, pero no se reusó acá al escribir el fix de "primer show
// futuro" — reproducía el bug que estaba corrigiendo. Comparación a nivel de
// DÍA (no de instante exacto), mismo criterio que `hoyColombia()` en el
// backend: un show de HOY sigue siendo válido a cualquier hora del día.
function esFechaPasada(fechaISO) {
  if (!fechaISO) return false;
  const hoyMedianoche = new Date();
  hoyMedianoche.setHours(0, 0, 0, 0);
  return fechaLocalDesdeISO(fechaISO) < hoyMedianoche;
}

// Hallazgo real (2026-08-16, encontrado tocando este archivo por otra razón):
// estaban declarados DENTRO del componente — se recreaban en cada render, lo
// que React marca como anti-patrón real (pierden cualquier estado propio en
// cada render, aunque acá no tuvieran ninguno). Movidos afuera.
const WaIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FormIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

export default function EventoDetalle({ evento, eventos, eventosFijos }) {
  const [searchParams] = useSearchParams();
  const [stickyVisible, setStickyVisible] = useState(false);
  const [galIdx, setGalIdx] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [carruselIdx, setCarruselIdx] = useState(() => {
    const prog = evento.programacion;
    if (!prog?.length) return null;
    const fechaParam = searchParams.get('fecha');
    if (fechaParam) {
      const idx = prog.findIndex(p => p.fechaISO === fechaParam);
      if (idx >= 0) return idx;
    }
    // ⭐ Hallazgo real del usuario (2026-08-28): antes siempre arrancaba en el
    // show de la posición 0, sin importar si ya había pasado — dejaba
    // preseleccionada (y reservable) una función vieja. Ahora busca el primer
    // show que NO haya pasado; si no encuentra ninguno (toda la programación
    // quedó en el pasado), no preselecciona nada.
    const primerFuturo = prog.findIndex(p => !esFechaPasada(p.fechaISO));
    return primerFuturo >= 0 ? primerFuturo : null;
  });
  const trackRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (carruselIdx === null) return;
    const card = cardRefs.current[carruselIdx];
    const track = trackRef.current;
    if (!card || !track) return;
    const cardLeft = card.offsetLeft;
    const cardWidth = card.offsetWidth;
    const trackWidth = track.offsetWidth;
    track.scrollTo({ left: cardLeft - (trackWidth - cardWidth) / 2, behavior: 'smooth' });
  }, [carruselIdx]);

  // `accionTipo` solo existe en `eventos` (no en `eventos_fijos`, que no tiene esa
  // columna) — se usa cuando está disponible, con el viejo chequeo de texto como
  // respaldo para no romper el caso de eventos_fijos.
  const esProximamente = evento.accionTipo
    ? evento.accionTipo === 'proximamente'
    : evento.precio === 'Próximamente';
  const pillLibre = evento.pills?.find(p => p.texto.toLowerCase().includes('libre'));

  const ctaLabel      = esProximamente ? 'Próximamente' : (evento.cta ?? 'Reservar');
  const ctaLabelCorto = esProximamente ? 'Próximamente' : (evento.ctaWa ?? evento.cta ?? 'Reservar');
  const waLink = evento.waLink ?? `https://wa.me/573015315119?text=Hola%2C+quiero+informaci%C3%B3n+sobre+${encodeURIComponent(evento.titulo)}.`;

  const esPasado = esFechaPasada(evento.fechaISO);
  const galTotal = evento.galeria?.length ?? 0;
  const galPrev = () => setGalIdx(i => (i - 1 + galTotal) % galTotal);
  const galNext = () => setGalIdx(i => (i + 1) % galTotal);
  const hasProg = (evento.programacion?.length ?? 0) > 0;
  // Programación (Salas) con TODOS sus shows ya pasados — el default de
  // `carruselIdx` de arriba solo cae en `null` cuando no encontró ningún show
  // futuro (nunca por falta de programación, ese caso ya está cubierto por
  // `!prog?.length` antes). Distinto de `esPasado` (que es para eventos con
  // una sola fecha propia, no aplica a eventos_fijos).
  const sinFuncionesFuturas = hasProg && carruselIdx === null;
  const noDisponible = esPasado || sinFuncionesFuturas;
  const itemSeleccionado = hasProg && carruselIdx !== null
    ? evento.programacion[carruselIdx]
    : null;
  // 2026-08-16 · Rediseño pedido por el usuario: cada show de `programacion`
  // guarda su propia `foto` (antes se elegía por posición dentro de
  // `galeria`, `galeria[i % galTotal]` — se podía agregar/editar/borrar un
  // show sin resubir las fotos de los demás recién con este cambio).
  const currentGalSrc = hasProg && carruselIdx !== null
    ? evento.programacion[carruselIdx]?.foto
    : (galTotal > 0 ? evento.galeria[galIdx] : undefined);
  const progPrev = () => setCarruselIdx(i => (i !== null && i > 0 ? i - 1 : i));
  const progNext = () => setCarruselIdx(i => {
    const next = (i ?? -1) + 1;
    return next < (evento.programacion?.length ?? 0) ? next : i;
  });

  // `nombre` es opcional por show (2026-08-16 — experiencias como "Colombia
  // me Enamoras" repiten siempre el mismo contenido, solo cambian las
  // fechas) — el título de la experiencia sirve de respaldo cuando falta.
  const nombreShowSeleccionado = itemSeleccionado?.nombre || evento.titulo;

  const waLinkEfectivo = itemSeleccionado
    ? `https://wa.me/573015315119?text=Hola%2C+quiero+reservar+para+%22${encodeURIComponent(nombreShowSeleccionado)}%22+el+${encodeURIComponent(itemSeleccionado.dia)}+a+las+${encodeURIComponent(itemSeleccionado.hora)}.`
    : waLink;
  const ctaLabelEfectivo      = itemSeleccionado ? 'Reservar este show' : ctaLabel;
  const ctaLabelCortoEfectivo = itemSeleccionado ? 'Reservar' : ctaLabelCorto;

  const inscripcionLink    = evento.inscripcionLink ?? null;
  const inscripcionLabel   = evento.cta ?? 'Inscribirme';
  const inscripcionLabelCorto = evento.cta ?? 'Inscribirme';
  const inscripcionCerrada = evento.inscripcionCerrada ?? false;

  const otrosEventos = [
    ...eventos.map(e => ({ ...e, _permanente: false })),
    ...eventosFijos.map(e => ({
      ...e,
      _permanente: true,
      descripcion: e.descripcionCorta,
      precio: e.pills?.find(p => p.texto.toLowerCase().includes('libre'))?.texto ?? 'Consultar',
    })),
  ]
    .filter(e => e.slug !== evento.slug)
    .filter(e => !e.fechaISO || !esFechaPasada(e.fechaISO))
    .slice(0, 3);

  return (
    <>
      {/* BLOQUE 1 — HERO */}
      <div className="evento-hero" style={{ background: evento.colorHero }}>
        <div className="evento-hero-overlay" />
        <div className="evento-hero-content">
          <Link to="/eventos" className="evento-volver">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver a eventos
          </Link>
          <h1>{evento.titulo}</h1>
          {evento.subtitulo && (
            <p className="evento-hero-sub">{evento.subtitulo}</p>
          )}
          {evento.pills?.length > 0 && (
            <div className="evento-hero-pills">
              {evento.pills.map(p => (
                <span key={p.texto} className="evento-hero-pill">{p.icono} {p.texto}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BLOQUE 2 — STICKY BAR */}
      {!noDisponible && (
        <div className={`sticky-cta-bar${stickyVisible ? ' visible' : ''}`}>
          <span className="sticky-titulo">{evento.titulo}</span>
          <span className="sticky-meta">
            {evento.fecha ? `${evento.fecha} · ${evento.lugar}` : evento.ciudad}
          </span>
          {evento.precio && <span className="sticky-precio">{evento.precio}</span>}
          {inscripcionCerrada ? (
            <button className="sticky-btn sticky-btn--cerrado" disabled>Inscripciones cerradas</button>
          ) : inscripcionLink ? (
            <a href={inscripcionLink} target="_blank" rel="noopener noreferrer" className="sticky-btn sticky-btn--form">
              <FormIcon size={15} /> {inscripcionLabelCorto}
            </a>
          ) : (
            <button className="sticky-btn sticky-btn--form" onClick={() => setModalAbierto(true)} disabled={esProximamente}>
              {ctaLabelCortoEfectivo}
            </button>
          )}
        </div>
      )}

      {/* BLOQUE 3 — CUERPO */}
      <div className="evento-cuerpo">
        {/* Columna izquierda */}
        <div className="evento-col-izq">
          {(galTotal > 0 || hasProg) && (
            <section className="evento-sec-galeria">
              <h2>Galería</h2>
              <div className="evento-galeria-carrusel">
                <div className="evento-galeria-frame">
                  <img
                    src={currentGalSrc}
                    alt={`${evento.titulo} ${(carruselIdx ?? galIdx) + 1}`}
                    className="evento-galeria-img"
                    loading="lazy"
                    key={carruselIdx ?? galIdx}
                  />
                  {!hasProg && galTotal > 1 && (
                    <>
                      <button className="gal-btn gal-btn-prev" onClick={galPrev} aria-label="Anterior">‹</button>
                      <button className="gal-btn gal-btn-next" onClick={galNext} aria-label="Siguiente">›</button>
                    </>
                  )}
                </div>
                {!hasProg && galTotal > 1 && (
                  <div className="gal-dots">
                    {evento.galeria.map((_, i) => (
                      <button key={i} className={`gal-dot${i === galIdx ? ' activo' : ''}`} onClick={() => setGalIdx(i)} aria-label={`Foto ${i + 1}`} />
                    ))}
                  </div>
                )}
              </div>

              {hasProg && (
                <div className="prog-strip">
                  <div className="prog-strip-header">
                    <h2 className="prog-strip-titulo">Programación mensual</h2>
                    {evento.mes && <span className="prog-mes-badge">{evento.mes}</span>}
                  </div>
                  <div className="prog-strip-outer">
                    <button
                      className="prog-strip-arrow"
                      onClick={progPrev}
                      disabled={carruselIdx === null || carruselIdx === 0}
                      aria-label="Evento anterior"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>
                    <div className="prog-strip-track" ref={trackRef}>
                      {evento.programacion.map((item, i) => {
                        const [diaSem, diaNum] = (item.dia ?? '').split(' ');
                        const pasado = esFechaPasada(item.fechaISO);
                        const activo = carruselIdx === i;
                        return (
                          <div
                            key={i}
                            ref={el => { cardRefs.current[i] = el; }}
                            className={`prog-strip-card${activo ? ' prog-strip-card--activo' : ''}${pasado ? ' prog-strip-card--pasado' : ''}`}
                            onClick={() => {
                              if (pasado) return;
                              setCarruselIdx(i);
                              if (window.innerWidth <= 1024) {
                                document.querySelector('.compra-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }
                            }}
                            role={pasado ? undefined : 'button'}
                            tabIndex={pasado ? -1 : 0}
                            onKeyDown={e => !pasado && e.key === 'Enter' && setCarruselIdx(i)}
                            aria-pressed={activo}
                          >
                            <span className="prog-strip-dia">
                              <span className="prog-strip-dia-sem">{diaSem}</span>
                              <span className="prog-strip-dia-num">{diaNum}</span>
                            </span>
                            <span className="prog-strip-info">
                              <span className="prog-strip-nombre">{item.nombre || evento.titulo}</span>
                              <span className="prog-strip-hora">{item.hora}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      className="prog-strip-arrow"
                      onClick={progNext}
                      disabled={carruselIdx === (evento.programacion?.length ?? 0) - 1}
                      aria-label="Evento siguiente"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="evento-sec-descripcion">
            <h2>Sobre el evento</h2>
            {String(evento.descripcionLarga).split('\n\n').map((p, i) => (
              <p key={i} className="evento-descripcion">{p}</p>
            ))}
            {evento.programa?.length > 0 && (
              <div className="programa-pills" style={{ marginTop: '20px' }}>
                {evento.programa.map(item => (
                  <span key={item} className="programa-pill">🎵 {item}</span>
                ))}
              </div>
            )}
            {evento.fases?.length > 0 && (
              <div className="evento-descripcion-fases">
                <div className="evento-fases">
                  {evento.fases.map((f, i) => (
                    <div key={i} className="evento-fase">
                      <div className="evento-fase-ico">
                        {f.iconoSrc
                          ? <img src={f.iconoSrc} alt="" aria-hidden="true" className="evento-fase-ico-img" />
                          : f.icono}
                      </div>
                      <div className="evento-fase-contenido">
                        <h3 className="evento-fase-titulo">{f.titulo}</h3>
                        <p className="evento-fase-desc">{f.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="evento-visitantes">
                  Haz parte del 100% de invitados que llegan de Colombia o del mundo y quedan enamorados con nuestra experiencia cultural.
                </p>
              </div>
            )}
          </section>


        </div>

        {/* El lugar — sección propia para poder reordenarse en tablet/mobile */}
        <section className="evento-sec-lugar">
          <h2>El lugar</h2>
          <div className="lugar-grid">
            <div className="lugar-datos">
              <h3>{evento.lugar}</h3>
              <p><span>📍</span> {evento.direccion ?? evento.ciudad}</p>
            </div>
            <iframe
              className="lugar-mapa"
              title={`Mapa de ${evento.lugar}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(`${evento.lugar}, ${evento.direccion ?? evento.ciudad}`)}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        {/* Columna derecha — card de compra o aviso de finalizado */}
        <div className="compra-card-wrap">
          {noDisponible ? (
            <div className="compra-card compra-card--finalizado">
              <div className="compra-card-fin-icono">🎶</div>
              <h3 className="compra-card-fin-titulo">
                {esPasado ? 'Este evento ya finalizó' : 'No hay próximas funciones programadas'}
              </h3>
              <p className="compra-card-fin-desc">
                {esPasado
                  ? 'Gracias a todos los que fueron parte de esta experiencia. Mantente atento a nuestros próximos eventos.'
                  : 'Todavía no se cargó la próxima fecha de esta experiencia. Vuelve pronto o escríbenos para más información.'}
              </p>
              <Link to="/eventos" className="btn btn-azul compra-card-fin-btn">Ver próximos eventos →</Link>
            </div>
          ) : (
          <div className="compra-card">
            <div className="compra-card-header">
              <div className="compra-card-titulo">{evento.titulo}</div>
              {/* Sin `nombre` distinto (ej. Colombia me Enamoras, siempre la misma
                 experiencia) repetiría el título de arriba sin decir nada nuevo —
                 el día/hora elegido ya se muestra debajo, alcanza con eso. */}
              {itemSeleccionado?.nombre && (
                <div className="compra-card-evento-sel">
                  <span className="compra-card-evento-nombre">{itemSeleccionado.nombre}</span>
                  <button className="compra-card-evento-clear" onClick={() => setCarruselIdx(null)} aria-label="Deseleccionar evento">×</button>
                </div>
              )}
              {itemSeleccionado ? (
                <div className="compra-card-meta">
                  <span>📅</span>
                  <span>{itemSeleccionado.dia} · {itemSeleccionado.hora}</span>
                </div>
              ) : (
                <>
                  {evento.fechaCompleta && (
                    <div className="compra-card-meta">
                      <span>📅</span><span>{evento.fechaCompleta}</span>
                    </div>
                  )}
                  {evento.hora && (
                    <div className="compra-card-meta">
                      <span>🕐</span><span>{evento.hora}</span>
                    </div>
                  )}
                  {evento.programacion?.length > 0 && (
                    <div className="compra-prog-hint">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Seleccioná una fecha de la programación para personalizar tu reserva
                    </div>
                  )}
                </>
              )}
              <div className="compra-card-meta">
                <span>📍</span><span>{evento.lugar}</span>
              </div>
            </div>
            <div className="compra-card-body">
              <div className="compra-precio">
                {evento.precio ?? (pillLibre ? 'Entrada libre' : 'Reserva tu lugar')}
              </div>
              {evento.precioDetalle && (
                <div className="compra-precio-detalle">{evento.precioDetalle}</div>
              )}
              {inscripcionCerrada ? (
                <button className="compra-btn compra-btn--cerrado" disabled>Inscripciones cerradas</button>
              ) : inscripcionLink ? (
                <a href={inscripcionLink} target="_blank" rel="noopener noreferrer" className="compra-btn compra-btn--form">
                  <FormIcon /> {inscripcionLabel}
                </a>
              ) : (
                <button
                  className="compra-btn compra-btn--form"
                  onClick={() => setModalAbierto(true)}
                  disabled={esProximamente}
                >
                  <span className="compra-btn-txt">
                    {ctaLabelEfectivo}
                    {itemSeleccionado?.nombre && <span className="compra-btn-evt">{itemSeleccionado.nombre}</span>}
                  </span>
                </button>
              )}
              {evento.bases && (
                <a href={evento.bases} target="_blank" rel="noopener noreferrer" className="compra-bases-btn">
                  📄 Conoce las bases del concurso
                </a>
              )}
              <div className="compra-garantias">
                <div className="compra-garantia">
                  <span className="compra-garantia-check">✓</span>
                  <span>Respuesta inmediata</span>
                </div>
                <div className="compra-garantia">
                  <span className="compra-garantia-check">✓</span>
                  <span>Confirmación directa</span>
                </div>
                <div className="compra-garantia">
                  <span className="compra-garantia-check">✓</span>
                  <span>Soporte en español</span>
                </div>
              </div>
            </div>
            <div className="compra-card-footer">
              <p>¿Tienes preguntas?</p>
              <div className="compra-contacto-btns">
                <a href={waLinkEfectivo} className="compra-contacto-btn compra-contacto-btn--wa"><WaIcon size={14} /> WhatsApp</a>
                <a href="mailto:info@colombiacanta.org" className="compra-contacto-btn">✉️ Email</a>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>


      {/* BLOQUE 4 — OTROS EVENTOS */}
      <section className="otros-eventos">
        <div className="container">
          <div className="otros-eventos-header">
            <span className="label-seccion label-muted">Otros eventos</span>
            <Link to="/eventos" className="btn btn-outline-oscuro" style={{ fontSize: '13px', padding: '8px 18px' }}>
              Ver todos →
            </Link>
          </div>
          <div className="otros-eventos-grid">
            {otrosEventos.map(ev => (
              <EventCard key={ev.slug} evento={ev} permanente={ev._permanente} />
            ))}
          </div>
        </div>
      </section>

      {!noDisponible && (
        <div className="mobile-cta-fixed">
          {inscripcionCerrada ? (
            <button className="compra-btn compra-btn--cerrado" disabled>Inscripciones cerradas</button>
          ) : inscripcionLink ? (
            <a href={inscripcionLink} target="_blank" rel="noopener noreferrer" className="compra-btn compra-btn--form">
              <FormIcon size={17} /> {inscripcionLabelCorto}
            </a>
          ) : (
            <button
              className="compra-btn compra-btn--form"
              onClick={() => setModalAbierto(true)}
              disabled={esProximamente}
            >
              <span className="compra-btn-txt">
                {ctaLabelCortoEfectivo}
                {itemSeleccionado?.nombre && <span className="compra-btn-evt">{itemSeleccionado.nombre}</span>}
              </span>
            </button>
          )}
        </div>
      )}

      <ContactoSection />
      <Footer />
      {!noDisponible && <div className="mobile-cta-fixed-spacer" />}

      {modalAbierto && (
        <ReservaModal
          evento={evento}
          itemSeleccionado={itemSeleccionado}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </>
  );
}
