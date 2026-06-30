import { Link } from 'react-router-dom';
import { redesSociales } from '../../data/redesSociales';
import './Contacto.css';

export default function ContactoSection() {
  return (
    <div className="contacto-section">
      <div className="container">
        <div className="contacto-divider">
          <h2 className="contacto-divider-titulo">Únete a nuestra comunidad</h2>
        </div>

        <div className="contacto-centrado">
          <div className="contacto-content">
            <h2 className="frase-principal">
              La música colombiana que <span>mueve al mundo</span>
            </h2>
            <p className="subtitulo">Centro cultural · Escuela de música · Medellín, Colombia</p>
            <div className="contacto-btns">
              <Link to="/inscripciones" className="btn btn-rojo">Inscríbete →</Link>
              <Link to="/contacto" className="btn btn-outline-oscuro">Contáctanos</Link>
            </div>
          </div>
          <div className="contacto-imagen">
            <div className="contacto-semicirculo" />
            <div className="contacto-anillo" />
            <div className="contacto-punto" />
            <img
              src={`${import.meta.env.BASE_URL}Contacto.png`}
              alt="Bailarina de folclor colombiano"
              className="contacto-foto"
            />
            <div className="contacto-redes-verticales">
              {redesSociales.map((red) => (
                <a
                  key={red.label}
                  href={red.href}
                  className="contacto-red-icono"
                  style={{ '--red-color': red.color }}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={red.label}
                >
                  {red.svg}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
