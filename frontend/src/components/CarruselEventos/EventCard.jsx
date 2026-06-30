import { useNavigate } from 'react-router-dom';

export default function EventCard({ evento, pasado = false, permanente = false }) {
  const navigate = useNavigate();
  const esPago = evento.precio && !['Entrada libre', 'Próximamente'].includes(evento.precio);

  return (
    <div
      className={`event-card${pasado ? ' event-card-pasado' : ''}${permanente ? ' event-card--permanente' : ''}`}
      style={permanente ? { borderTop: `3px solid ${evento.color}` } : undefined}
      onClick={() => navigate(`/eventos/${evento.slug}`)}
    >
      <div
        className="event-card-img"
        style={evento.img ? {
          backgroundImage: `linear-gradient(135deg, ${evento.colorHero}cc, rgba(0,0,0,0.45)), url(${evento.img})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {
          background: `linear-gradient(135deg, ${evento.colorHero}, rgba(0,0,0,0.5))`,
        }}
      >
        {permanente
          ? <span className="chip-permanente">Siempre en cartelera</span>
          : <span className="chip-fecha">{evento.fecha}</span>
        }
        <span className="chip-tipo">{evento.tipo}</span>
        {pasado && <span className="chip-finalizado">Finalizado</span>}
      </div>
      <div className="event-card-body">
        <div className="event-card-titulo">{evento.titulo}</div>
        <div className="event-card-desc">{evento.descripcion}</div>
        <div className="event-card-meta">
          <span>📍</span>
          <span>{evento.ciudad}</span>
          {evento.hora && evento.hora !== 'Por confirmar' && (
            <>
              <span>·</span>
              <span>{evento.hora}</span>
            </>
          )}
        </div>
        <div className="event-card-divider" />
        <div className="event-card-footer">
          <span className={`event-card-precio${!esPago ? ' libre' : ''}`}>
            {evento.precio}
          </span>
          {esPago ? (
            <button className="event-card-btn primario">{evento.cta}</button>
          ) : (
            <button className="event-card-btn secundario">{evento.cta}</button>
          )}
        </div>
      </div>
    </div>
  );
}
