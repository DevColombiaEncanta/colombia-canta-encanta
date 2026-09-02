import { Link } from 'react-router-dom';
import { useNoticias } from '../../hooks/useNoticias';
import { formatearFecha, gradienteDiagonal } from '../../utils/formato';
import InstagramWidget from '../InstagramWidget/InstagramWidget';
import './Noticias.css';

export default function Noticias() {
  const { noticias, cargando, error } = useNoticias();

  return (
    <section id="noticias" className="noticias-section">
      <div className="container">
        <div className="noticias-header">
          <div className="noticias-intro">
            <span className="label-seccion label-amarillo">Noticias</span>
            <h2 className="noticias-titulo">Lo último de nuestra comunidad</h2>
          </div>
        </div>

        <div className="noticias-con-ig">
          <div className="noticias-lista">
            {cargando && <p className="noticias-estado">Cargando noticias…</p>}
            {!cargando && error && <p className="noticias-estado">No se pudieron cargar las noticias.</p>}
            {!cargando && !error && noticias.length === 0 && (
              <p className="noticias-estado">Aún no hay noticias publicadas.</p>
            )}
            {!cargando && !error && noticias.map((n) => (
              <Link to={`/noticias/${n.slug}`} key={n.id} className="noticias-fila">
                <div className="noticias-fila-contenido">
                  <div className="noticias-fila-meta">
                    <span className="noticias-fila-fecha">{formatearFecha(n.fechaPublicacion).corta}</span>
                    <span className="noticias-fila-chip">{n.categoria}</span>
                  </div>
                  <h3 className="noticias-fila-titulo">{n.titulo}</h3>
                </div>
                <div className="noticias-fila-thumb" style={{ background: gradienteDiagonal(n.colorInicio, n.colorFin) }}>
                  <img src={n.img} alt={n.titulo} className="noticias-fila-img" loading="lazy" decoding="async" />
                </div>
              </Link>
            ))}
          </div>

          <aside className="noticias-ig-sidebar">
            <InstagramWidget />
          </aside>
        </div>
      </div>
    </section>
  );
}
