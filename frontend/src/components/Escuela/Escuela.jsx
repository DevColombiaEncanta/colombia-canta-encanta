import { Link } from 'react-router-dom';
import './Escuela.css';

const cursos = ['Canto', 'Teatro', 'Piano', 'Guitarra', 'Danza'];

const BASE = import.meta.env.BASE_URL;
const imagenes = [
  { src: `${BASE}escuela-musica/img-quienessomos.webp`, alt: 'Estudiantes de Colombia Canta y Encanta' },
  { src: `${BASE}escuela-musica/img_4177.webp`,         alt: 'Estudiantes aprendiendo instrumentos' },
  { src: `${BASE}escuela-musica/img_3216.webp`,         alt: 'Formación musical colombiana' },
];

export default function Escuela() {
  return (
    <section className="escuela-section">
      <span className="escuela-seccion-label label-seccion label-amarillo">Escuela de Música</span>

      {/* Contenido izquierda */}
      <div className="escuela-contenido">
        <h2>Aprende el arte que representa a Colombia</h2>
        <p>Aprende música, danza y expresión artística de la mano de maestros especializados en folclor colombiano. Desde tus primeros pasos hasta niveles avanzados, te acompañamos en un proceso que fortalece tu talento y conecta con nuestras raíces.</p>
        <div className="escuela-pills">
          {cursos.map(c => (
            <span key={c} className="escuela-pill">{c}</span>
          ))}
        </div>
        <Link to="/inscripciones" className="btn btn-amarillo">Explora nuestros programas →</Link>
      </div>

      {/* Mosaico de imágenes */}
      <div className="escuela-imagenes">
        <div className="escuela-img-grande">
          <img src={imagenes[0].src} alt={imagenes[0].alt} className="escuela-img" style={{ objectPosition: '25% center' }} loading="lazy" decoding="async" />
        </div>
        <div className="escuela-img-chica">
          <img src={imagenes[1].src} alt={imagenes[1].alt} className="escuela-img" loading="lazy" decoding="async" />
        </div>
        <div className="escuela-img-chica">
          <img src={imagenes[2].src} alt={imagenes[2].alt} className="escuela-img" style={{ objectPosition: '10% center' }} loading="lazy" decoding="async" />
        </div>
      </div>
    </section>
  );
}
