import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { eventos } from '../../data/eventos';
import EventosFijosHome from '../EventosFijos/EventosFijosHome';
import './CarruselEventos.css';

function parseFecha(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function CarruselEventos() {
  const ventana = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ordenados = [...eventos]
      .filter(e => e.fechaISO)
      .sort((a, b) => parseFecha(a.fechaISO) - parseFecha(b.fechaISO));

    const idxProximo = ordenados.findIndex(e => parseFecha(e.fechaISO) >= hoy);

    let start, end;
    if (idxProximo === -1) {
      end = ordenados.length;
      start = Math.max(0, end - 5);
    } else {
      start = Math.max(0, idxProximo - 2);
      end = start + 5;
      if (end > ordenados.length) {
        end = ordenados.length;
        start = Math.max(0, end - 5);
      }
    }

    const hoyTs = hoy.getTime();
    return ordenados.slice(start, end).reverse().map(ev => ({
      ...ev,
      pasado: parseFecha(ev.fechaISO).getTime() < hoyTs,
    }));
  }, []);

  return (
    <section className="eventos-ac-section">
      <div className="container">
        <div className="eventos-ac-header">
          <div className="eventos-ac-intro">
            <span className="label-seccion label-rojo">Eventos</span>
          </div>
          <Link to="/eventos" className="eventos-ac-ver-todos">
            Ver todos <span className="eventos-ac-flecha">→</span>
          </Link>
        </div>
      </div>

      <EventosFijosHome />

      <div className="container">
        <div className="eventos-ac-destacados-header">
          <h2 className="eventos-ac-destacados-titulo">Eventos destacados</h2>
        </div>

        <div className="eventos-ac-acordeon">
          {ventana.map(ev => (
            <Link
              to={`/eventos/${ev.slug}`}
              key={ev.id}
              className={`evento-ac-card${ev.pasado ? ' evento-ac-card--pasado' : ''}`}
              style={ev.img ? {
                backgroundImage: `linear-gradient(160deg, ${ev.color}${ev.pasado ? '88' : 'bb'} 0%, rgba(0,0,0,${ev.pasado ? '0.80' : '0.72'}) 100%), url(${ev.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {
                background: `linear-gradient(160deg, ${ev.color}${ev.pasado ? '88' : ''} 0%, rgba(0,0,0,0.88) 100%)`,
              }}
            >
              {ev.pasado && (
                <div className="evento-ac-pasado-badge">Edición pasada</div>
              )}

              {/* Estado colapsado */}
              <div className="evento-ac-collapsed">
                <span className="evento-ac-tipo-rotado">{ev.tipo}</span>
                <span className="evento-ac-fecha-chip">
                  {ev.fecha.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>

              {/* Estado expandido */}
              <div className="evento-ac-expanded">
                <span className="evento-ac-chip">{ev.tipo}</span>
                <h3 className="evento-ac-nombre">{ev.titulo}</h3>
                <p className="evento-ac-ciudad">📍 {ev.ciudad}</p>
                <p className="evento-ac-fecha-texto">{ev.fecha}</p>
                <span className="evento-ac-cta">Ver evento →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
