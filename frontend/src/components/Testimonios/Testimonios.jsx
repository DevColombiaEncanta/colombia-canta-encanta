import './Testimonios.css';

const BASE = import.meta.env.BASE_URL;

const testimonios = [
  {
    texto: 'Llevo dos años en la escuela de canto y ha sido una experiencia transformadora. Los profesores no solo enseñan técnica, te conectan con la música colombiana de una manera muy especial.',
    nombre: 'María Fernanda',
    rol: 'Alumna de Canto',
    img: `${BASE}testimonios-retratos/testimonio-maria-fernanda.webp`,
    color: 'var(--coral)',
  },
  {
    texto: 'Enseñar aquí es un privilegio. Cada estudiante llega con ilusión y se va con amor por el folclor. Ver ese proceso es lo que me hace volver cada día con más energía.',
    nombre: 'Luis Armando',
    rol: 'Profesor de Guitarra',
    img: `${BASE}testimonios-retratos/testimonio-luis-armando.webp`,
    color: 'var(--azul)',
  },
  {
    texto: 'Mi hijo entró sin saber nada de música y hoy toca piano con una seguridad que nos sorprende a todos. El ambiente es cálido, familiar y muy profesional al mismo tiempo.',
    nombre: 'Sandra Milena',
    rol: 'Madre de Alumno',
    img: `${BASE}testimonios-retratos/testimonio-sandra-milena.webp`,
    color: 'var(--amarillo)',
  },
  {
    texto: 'La danza folclórica me enseñó a conocer mi propia cultura. Cada ensayo es una celebración. Nunca pensé que aprender danza me daría tanto orgullo por ser colombiano.',
    nombre: 'Sebastián Torres',
    rol: 'Alumno de Danza',
    img: `${BASE}testimonios-retratos/testimonio-sebastian-torres.webp`,
    color: 'var(--rojo)',
  },
];

export default function Testimonios() {
  return (
    <section className="testimonios-section">
      <div className="container">

        <div className="testimonios-divider">
          <h2 className="testimonios-divider-titulo">Nuestra Comunidad</h2>
        </div>

        <div className="testimonios-grid">
          {testimonios.map((t, i) => (
            <div key={i} className="testimonio-card">
              <div className="testimonio-avatar" style={{ borderColor: t.color }}>
                <img src={t.img} alt={t.nombre} className="testimonio-avatar-img" loading="lazy" decoding="async" />
              </div>
              <div className="testimonio-contenido">
                <p className="testimonio-nombre">{t.nombre}</p>
                <p className="testimonio-rol">{t.rol}</p>
                <p className="testimonio-texto">{t.texto}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
