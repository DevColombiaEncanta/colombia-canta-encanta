import { Link } from 'react-router-dom';
import { eventosFijos } from '../../data/eventosFijos';
import './EventosFijos.css';

function EfCard({ evento }) {
  return (
    <Link to={`/eventos/${evento.slug}`} className="ef-card">
      <div className="ef-card-img-wrap">
        <img
          src={evento.img}
          alt={evento.titulo}
          className="ef-card-img"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="ef-card-body">
        <div className="ef-card-top">
          <h4 className="ef-card-titulo">{evento.titulo}</h4>
          <p className="ef-card-lugar">📍 {evento.lugar} · {evento.ciudad}</p>
          <p className="ef-card-desc">{evento.descripcionCorta}</p>
        </div>
        <div className="ef-card-bottom">
          <div className="ef-card-tags">
            {evento.pills.slice(0, 3).map(p => (
              <span key={p.texto} className="ef-card-tag">
                <span className="ef-tag-ico">{p.icono}</span>
                <span className="ef-tag-txt">{p.texto}</span>
              </span>
            ))}
          </div>
          <span className="ef-card-btn">Ver más</span>
        </div>
      </div>
    </Link>
  );
}

function EfCardPlaceholder({ evento }) {
  return (
    <Link
      to={`/eventos/${evento.slug}`}
      className="ef-card ef-card--dark"
      style={{ background: `linear-gradient(145deg, ${evento.color} 0%, ${evento.colorHero} 100%)` }}
    >
      <div className="ef-card-ph">
        <span className="ef-card-ph-flag">🇨🇴</span>
        <span className="ef-card-ph-label">{evento.titulo}</span>
        <span className="ef-card-ph-sub">Imágenes próximamente</span>
      </div>
      <div className="ef-card-body">
        <div className="ef-card-top">
          <h4 className="ef-card-titulo ef-w">{evento.titulo}</h4>
          <p className="ef-card-lugar ef-w50">📍 {evento.lugar} · {evento.ciudad}</p>
          <p className="ef-card-desc ef-w75">{evento.descripcionCorta}</p>
        </div>
        <div className="ef-card-bottom">
          <div className="ef-card-tags">
            {evento.pills.slice(0, 3).map(p => (
              <span key={p.texto} className="ef-card-tag ef-card-tag--w">
                <span className="ef-tag-ico">{p.icono}</span>
                <span className="ef-tag-txt">{p.texto}</span>
              </span>
            ))}
          </div>
          <span className="ef-card-btn ef-card-btn--w">Ver más</span>
        </div>
      </div>
    </Link>
  );
}

export default function EventosFijos() {
  const [salas, enamoras] = eventosFijos;

  return (
    <div className="ef-section">

      {/* ── Salas Colombia Canta: contenido izq · card der ── */}
      <div className="ef-item">
        <div className="ef-content">
          <span className="label-seccion label-rojo">{salas.tipo}</span>
          <h3 className="ef-titulo">{salas.titulo}</h3>
          <p className="ef-desc">{salas.descripcionCorta}</p>
          <div className="ef-pills">
            {salas.pills.map(p => (
              <span key={p.texto} className="ef-pill">
                {p.icono} {p.texto}
              </span>
            ))}
          </div>
          <div className="ef-prog">
            <span className="ef-prog-label">Programación · {salas.mes}</span>
            <div className="ef-prog-lista">
              {salas.programacion.map((ev, i) => (
                <div key={i} className="ef-prog-row">
                  <div className="ef-prog-chip">
                    <b>{ev.dia}</b>
                    <span>{ev.hora}</span>
                  </div>
                  <span className="ef-prog-nombre">{ev.nombre}</span>
                </div>
              ))}
            </div>
          </div>
          <Link to={`/eventos/${salas.slug}`} className="btn btn-rojo">{salas.cta} →</Link>
        </div>
        <div className="ef-card-col">
          <EfCard evento={salas} />
        </div>
      </div>

      {/* ── Colombia me Enamoras: card izq · contenido der ── */}
      <div className="ef-item ef-item--reverse">
        <div className="ef-card-col">
          <EfCardPlaceholder evento={enamoras} />
        </div>
        <div className="ef-content">
          <span className="label-seccion label-azul">{enamoras.tipo}</span>
          <h3 className="ef-titulo">{enamoras.titulo}</h3>
          <p className="ef-desc">{enamoras.descripcionCorta}</p>
          <div className="ef-pills">
            {enamoras.pills.map(p => (
              <span key={p.texto} className="ef-pill">
                {p.icono} {p.texto}
              </span>
            ))}
          </div>
          <div className="ef-fases">
            {enamoras.fases.map((f, i) => (
              <div key={i} className="ef-fase">
                <span className="ef-fase-ico">{f.icono}</span>
                <div>
                  <b className="ef-fase-titulo">{f.titulo}</b>
                  <p className="ef-fase-desc">{f.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to={`/eventos/${enamoras.slug}`} className="btn btn-azul">{enamoras.cta} →</Link>
        </div>
      </div>

    </div>
  );
}
