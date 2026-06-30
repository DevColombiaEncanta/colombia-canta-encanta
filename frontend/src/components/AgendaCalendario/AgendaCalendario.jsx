import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { eventos } from '../../data/eventos';
import { eventosFijos } from '../../data/eventosFijos';
import './AgendaCalendario.css';

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const INSTAGRAM_URL = 'https://www.instagram.com/colombia_canta';

function parseFecha(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatFechaCorta(fecha) {
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()].toLowerCase()}`;
}

function agruparPorMes(lista) {
  const map = new Map();
  lista.forEach(item => {
    const k = `${item.fecha.getFullYear()}-${item.fecha.getMonth()}`;
    if (!map.has(k)) {
      map.set(k, {
        key: k,
        label: `${MESES[item.fecha.getMonth()]} ${item.fecha.getFullYear()}`,
        items: [],
      });
    }
    map.get(k).items.push(item);
  });
  return [...map.values()];
}

export default function AgendaCalendario() {
  const [abierto, setAbierto] = useState(null);

  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { gruposProximos, gruposPasados, proximoKey } = useMemo(() => {
    const todos = [];

    eventosFijos.forEach(ef => {
      if (!ef.programacion) return;
      ef.programacion.forEach(p => {
        if (!p.fechaISO) return;
        const fecha = parseFecha(p.fechaISO);
        todos.push({
          key: `ef-${p.fechaISO}-${p.nombre}`,
          fecha,
          hora: p.hora,
          nombre: p.nombre,
          tipo: ef.titulo,
          color: ef.color,
          link: `/eventos/${ef.slug}`,
          lugar: ef.lugar,
          img: ef.img,
          descripcion: ef.descripcionCorta,
          waLink: ef.waLink,
          esPasado: fecha < hoy,
        });
      });
    });

    eventos.forEach(ev => {
      if (!ev.fechaISO) return;
      const fecha = parseFecha(ev.fechaISO);
      todos.push({
        key: `ev-${ev.id}`,
        fecha,
        hora: ev.hora,
        nombre: ev.titulo,
        tipo: ev.tipo,
        color: ev.color,
        link: `/eventos/${ev.slug}`,
        lugar: ev.ciudad ? `${ev.lugar} · ${ev.ciudad}` : ev.lugar,
        img: ev.img,
        descripcion: ev.descripcion,
        waLink: ev.waLink,
        esPasado: fecha < hoy,
      });
    });

    todos.sort((a, b) => a.fecha - b.fecha);

    const proximos = todos.filter(i => !i.esPasado).sort((a, b) => b.fecha - a.fecha);
    const pasados  = todos.filter(i => i.esPasado).sort((a, b) => b.fecha - a.fecha);

    return {
      gruposProximos: agruparPorMes(proximos),
      gruposPasados:  agruparPorMes(pasados),
      proximoKey: proximos.length > 0 ? proximos[proximos.length - 1].key : null,
    };
  }, [hoy]);

  const toggle = (key) => setAbierto(prev => prev === key ? null : key);

  const mesActualKey = `${hoy.getFullYear()}-${hoy.getMonth()}`;
  const [mesesAbiertos, setMesesAbiertos] = useState(() => {
    const keys = new Set([mesActualKey]);
    gruposProximos.forEach(g => keys.add(g.key));
    return keys;
  });
  const toggleMes = (key) => setMesesAbiertos(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  const renderFila = (item) => {
    const estaAbierto = abierto === item.key;
    const dia       = item.fecha.getDate();
    const diaSemana = DIAS[item.fecha.getDay()];

    return (
      <div
        key={item.key}
        className={`agenda-item${item.esPasado ? ' agenda-item--pasado' : ''}${item.key === proximoKey ? ' agenda-item--proximo' : ''}`}
      >
        <div
          className={`agenda-fila${estaAbierto ? ' agenda-fila--abierto' : ''}`}
          onClick={() => toggle(item.key)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && toggle(item.key)}
        >
          <div className="agenda-fecha" style={{ borderLeftColor: item.color }}>
            <span className="agenda-dia-num">{String(dia).padStart(2, '0')}</span>
            <span className="agenda-dia-sem">{diaSemana}</span>
          </div>

          <div className="agenda-info">
            <span className="agenda-nombre">{item.nombre}</span>
            <div className="agenda-meta">
              {item.key === proximoKey && (
                <span className="agenda-chip agenda-chip--proximo">Próximo evento</span>
              )}
              <span
                className="agenda-chip"
                style={{
                  background: `${item.color}18`,
                  color: item.color,
                  borderColor: `${item.color}40`,
                }}
              >
                {item.tipo}
              </span>
              {item.esPasado && (
                <span className="agenda-chip agenda-chip--finalizado">Finalizado</span>
              )}
              {item.lugar && (
                <span className="agenda-lugar">📍 {item.lugar}</span>
              )}
            </div>
          </div>

          <div className="agenda-hora">
            <span className="agenda-hora-texto">{item.hora}</span>
            <span className={`agenda-expand-ico${estaAbierto ? ' agenda-expand-ico--abierto' : ''}`}>
              +
            </span>
          </div>
        </div>

        <div className={`agenda-panel${estaAbierto ? ' agenda-panel--abierto' : ''}`}>
          <div className="agenda-panel-inner" style={{ borderLeftColor: item.color }}>
            {item.img && (
              <div className="agenda-panel-img-wrap">
                <img
                  src={item.img}
                  alt={item.nombre}
                  className="agenda-panel-img"
                  loading="lazy"
                />
              </div>
            )}
            <div className="agenda-panel-contenido">
              <p className="agenda-panel-desc">{item.descripcion}</p>

              <div className="agenda-panel-chips">
                <span className="agenda-panel-chip">
                  <span className="agenda-panel-chip-icono" style={{ background: `${item.color}1a` }}>📅</span>
                  {formatFechaCorta(item.fecha)}
                </span>
                <span className="agenda-panel-chip">
                  <span className="agenda-panel-chip-icono" style={{ background: `${item.color}1a` }}>🕒</span>
                  {item.hora}
                </span>
                {item.lugar && (
                  <span className="agenda-panel-chip">
                    <span className="agenda-panel-chip-icono" style={{ background: `${item.color}1a` }}>📍</span>
                    {item.lugar}
                  </span>
                )}
              </div>

              <div className="agenda-panel-footer">
                <Link to={item.link} className="agenda-panel-cta">
                  Ver evento completo
                  <span className="agenda-panel-cta-arrow">→</span>
                </Link>
                <div className="agenda-panel-social">
                  {item.waLink && (
                    <a
                      href={item.waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="agenda-panel-social-btn agenda-panel-social-btn--wa"
                      aria-label="Reservar por WhatsApp"
                      title="Reservar por WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.84.5 3.59 1.41 5.12L2 22l5.2-1.49a9.86 9.86 0 0 0 4.84 1.24h.01c5.46 0 9.91-4.45 9.91-9.91A9.86 9.86 0 0 0 12.04 2zm5.81 14.06c-.24.69-1.42 1.32-1.96 1.4-.5.08-1.13.11-1.83-.12-.42-.13-.96-.31-1.65-.61-2.91-1.26-4.81-4.19-4.96-4.39-.15-.2-1.18-1.57-1.18-2.99 0-1.42.74-2.12 1.01-2.41.27-.29.58-.36.78-.36.2 0 .39.002.56.01.18.008.42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.33.02.53-.1.2-.15.32-.3.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.45.3.15.47.13.65-.07.18-.21.74-.86.94-1.16.2-.3.4-.25.66-.15.27.1 1.69.8 1.98.94.29.15.48.21.55.34.07.14.07.79-.17 1.48z"/>
                      </svg>
                    </a>
                  )}
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="agenda-panel-social-btn agenda-panel-social-btn--ig"
                    aria-label="Síguenos en Instagram"
                    title="Síguenos en Instagram"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.97.24 2.43.4.6.23 1.03.51 1.48.96.45.45.73.88.96 1.48.16.46.35 1.26.4 2.43.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.97-.4 2.43-.23.6-.51 1.03-.96 1.48-.45.45-.88.73-1.48.96-.46.16-1.26.35-2.43.4-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.97-.24-2.43-.4-.6-.23-1.03-.51-1.48-.96-.45-.45-.73-.88-.96-1.48-.16-.46-.35-1.26-.4-2.43C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.24-1.97.4-2.43.23-.6.51-1.03.96-1.48.45-.45.88-.73 1.48-.96.46-.16 1.26-.35 2.43-.4C8.42 2.17 8.8 2.16 12 2.16zm0 1.8c-3.14 0-3.5.01-4.74.07-.97.04-1.5.21-1.84.34-.46.18-.79.39-1.14.74-.35.35-.56.68-.74 1.14-.13.34-.3.87-.34 1.84-.06 1.24-.07 1.6-.07 4.74s.01 3.5.07 4.74c.04.97.21 1.5.34 1.84.18.46.39.79.74 1.14.35.35.68.56 1.14.74.34.13.87.3 1.84.34 1.24.06 1.6.07 4.74.07s3.5-.01 4.74-.07c.97-.04 1.5-.21 1.84-.34.46-.18.79-.39 1.14-.74.35-.35.56-.68.74-1.14.13-.34.3-.87.34-1.84.06-1.24.07-1.6.07-4.74s-.01-3.5-.07-4.74c-.04-.97-.21-1.5-.34-1.84-.18-.46-.39-.79-.74-1.14-.35-.35-.68-.56-1.14-.74-.34-.13-.87-.3-1.84-.34-1.24-.06-1.6-.07-4.74-.07zm0 4.32a4.72 4.72 0 1 1 0 9.44 4.72 4.72 0 0 1 0-9.44zm0 1.8a2.92 2.92 0 1 0 0 5.84 2.92 2.92 0 0 0 0-5.84zm5.84-2.16a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMes = (grupo, pasado = false) => {
    const estaAbierto = mesesAbiertos.has(grupo.key);
    return (
      <div key={grupo.key} className="agenda-mes">
        <div
          className={`agenda-mes-header${pasado ? ' agenda-mes-header--pasado' : ''}`}
          onClick={() => toggleMes(grupo.key)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && toggleMes(grupo.key)}
        >
          <h3 className="agenda-mes-titulo">{grupo.label}</h3>
          <div className="agenda-mes-meta">
            <span className="agenda-mes-count">
              {grupo.items.length} {grupo.items.length === 1 ? 'evento' : 'eventos'}
            </span>
            <span className={`agenda-mes-expand-ico${estaAbierto ? ' agenda-mes-expand-ico--abierto' : ''}`}>
              +
            </span>
          </div>
        </div>
        <div className={`agenda-mes-body${estaAbierto ? ' agenda-mes-body--abierto' : ''}`}>
          <div className="agenda-mes-body-inner">
            <div className="agenda-lista">
              {grupo.items.map(renderFila)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (gruposProximos.length === 0 && gruposPasados.length === 0) {
    return (
      <div className="agenda-vacio">
        <span className="agenda-vacio-ico">📅</span>
        <p>Próximamente anunciaremos nuevas fechas.</p>
      </div>
    );
  }

  return (
    <div className="agenda-calendario">

      {/* ── Próximos ── */}
      {gruposProximos.map(grupo => renderMes(grupo, false))}

      {/* ── Pasados ── */}
      {gruposPasados.length > 0 && (
        <>
          <div className="agenda-pasados-divider">
            <h3 className="agenda-pasados-titulo">Ediciones anteriores</h3>
          </div>
          {gruposPasados.map(grupo => renderMes(grupo, true))}
        </>
      )}

    </div>
  );
}
