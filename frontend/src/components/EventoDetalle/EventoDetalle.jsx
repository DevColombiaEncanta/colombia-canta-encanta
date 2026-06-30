import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventos } from '../../data/eventos';
import { eventosFijos } from '../../data/eventosFijos';
import EventCard from '../CarruselEventos/EventCard';
import ContactoSection from '../Contacto/Contacto';
import Footer from '../Footer/Footer';
import './EventoDetalle.css';
import '../CarruselEventos/CarruselEventos.css';

export default function EventoDetalle({ evento }) {
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const esProximamente = evento.precio === 'Próximamente';
  const ctaColor = '#25D366';
  const pillLibre = evento.pills?.find(p => p.texto.toLowerCase().includes('libre'));

  const waLabel     = evento.ctaWa ?? (esProximamente ? 'Recibir información' : evento.cta);
  const waLabelCorto = evento.ctaWa ?? (esProximamente ? 'Recibir info' : evento.cta);

  const waLink = evento.waLink ?? `https://wa.me/573015315119?text=Hola%2C+quiero+informaci%C3%B3n+sobre+${encodeURIComponent(evento.titulo)}.`;

  const otrosEventos = [
    ...eventos.map(e => ({ ...e, _permanente: false })),
    ...eventosFijos.map(e => ({
      ...e,
      _permanente: true,
      descripcion: e.descripcionCorta,
      precio: e.pills.find(p => p.texto.toLowerCase().includes('libre'))?.texto ?? 'Consultar',
    })),
  ].filter(e => e.slug !== evento.slug).slice(0, 3);

  const WaIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );

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
      <div className={`sticky-cta-bar${stickyVisible ? ' visible' : ''}`}>
        <span className="sticky-titulo">{evento.titulo}</span>
        <span className="sticky-meta">
          {evento.fecha ? `${evento.fecha} · ${evento.lugar}` : evento.ciudad}
        </span>
        {evento.precio && <span className="sticky-precio">{evento.precio}</span>}
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="sticky-btn" style={{ background: ctaColor }}>
          <WaIcon size={15} /> {waLabelCorto}
        </a>
      </div>

      {/* BLOQUE 3 — CUERPO */}
      <div className="evento-cuerpo">
        {/* Columna izquierda */}
        <div className="evento-col-izq">
          <section className="evento-sec-descripcion">
            <h2>Sobre el evento</h2>
            {String(evento.descripcionLarga).split('\n\n').map((p, i) => (
              <p key={i} className="evento-descripcion">{p}</p>
            ))}
          </section>

          {evento.galeria?.length > 0 && (
            <section className="evento-sec-galeria">
              <h2>Galería</h2>
              <div className="evento-galeria-grid">
                {evento.galeria.map((img, i) => (
                  <img key={i} src={img} alt={`${evento.titulo} ${i + 1}`} className="evento-galeria-img" loading="lazy" />
                ))}
              </div>
            </section>
          )}

          {evento.programa?.length > 0 && (
            <section>
              <h2>Programa</h2>
              <div className="programa-pills">
                {evento.programa.map(item => (
                  <span key={item} className="programa-pill">🎵 {item}</span>
                ))}
              </div>
            </section>
          )}

          {evento.fases?.length > 0 && (
            <section>
              <h2>¿Cómo es la experiencia?</h2>
              <div className="evento-fases">
                {evento.fases.map((f, i) => (
                  <div key={i} className="evento-fase">
                    <div className="evento-fase-num-ico">
                      <div className="evento-fase-num">{String(i + 1).padStart(2, '0')}</div>
                      <div className="evento-fase-ico">{f.icono}</div>
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
            </section>
          )}

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

        {/* Columna derecha — card de compra */}
        <div className="compra-card-wrap">
          <div className="compra-card">
            <div className="compra-card-header">
              <div className="compra-card-titulo">{evento.titulo}</div>
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
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="compra-btn" style={{ background: ctaColor }}>
                <WaIcon /> {waLabel}
              </a>
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
                <a href={waLink} className="compra-contacto-btn compra-contacto-btn--wa"><WaIcon size={14} /> WhatsApp</a>
                <a href="mailto:info@colombiacanta.org" className="compra-contacto-btn">✉️ Email</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA fijo */}
      <div className="mobile-cta-fixed">
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="compra-btn" style={{ background: ctaColor }}>
          <WaIcon /> {waLabelCorto}{evento.precio ? ` · ${evento.precio}` : ''}
        </a>
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

      <ContactoSection />
      <Footer />
    </>
  );
}
