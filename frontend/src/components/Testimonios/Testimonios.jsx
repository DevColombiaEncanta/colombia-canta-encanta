import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Testimonios.css';

const BASE = import.meta.env.BASE_URL;

// Pedido del usuario (2026-09-02): no hay autorización de nombre/rol para
// estos testimonios en video, así que se omiten por completo — cada uno
// queda identificado solo por su número dentro de la comunidad (ver
// `.tc-badge` en Testimonios.css), sin perder protagonismo visual.
const testimonios = [
  {
    src: `${BASE}testimonios-videos/testimonio-1.mp4`,
    cita: 'La experiencia Colombia Canta y Encanta fue magnífica, no solo por el espectáculo que presentan, sino por los aprendizajes que nos dan. Nos llegan a nuestros corazones y a nuestro conocimiento. Es algo que no se pueden perder. De verdad es algo que nos eriza la piel.',
  },
  {
    src: `${BASE}testimonios-videos/testimonio-2.mp4`,
    cita: 'Estoy sorprendida de esta muestra tan espectacular que hicieron. Sobre todo porque muestran algo que a diario lo evidenciamos las personas que vivimos en Medellín o en Colombia. Es nuestra rutina del día a día. Ver a todos estos artistas manifestando cada situación o cada momento es espectacular. (...) Espectacular. Digno de mostrar no solo acá sino de exportar. Hay que venir.',
  },
  {
    src: `${BASE}testimonios-videos/testimonio-3.mp4`,
    cita: 'Muy feliz. Este show sin duda alguna es de otro mundo. Figuramos y gozamos con la cultura colombiana. Gozamos con toda esa muestra de talento que tienen estos artistas. Grandes en calidad. (...) La invitación es a que vengan.',
  },
  {
    src: `${BASE}testimonios-videos/testimonio-4.mp4`,
    cita: 'Realmente es un show de exportación. […] Se nota el compromiso, la dedicación, el amor. La música brota y nos hacen sentir que esa Colombia querida, la tenemos que querer cada día más y más porque definitivamente vale la pena.',
  },
  {
    src: `${BASE}testimonios-videos/testimonio-5.mp4`,
    cita: 'Estuvo súper chévere. Me gustaría invitar a más jóvenes para que vengan y se enamoren de Colombia. Estos escenarios son muy espectaculares.',
  },
];

export default function Testimonios() {
  const videoRef    = useRef(null);
  const [idx, setIdx]             = useState(0);
  const [slideClass, setSlideClass] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const goTo = (newIdx) => {
    if (newIdx < 0 || newIdx >= testimonios.length || newIdx === idx) return;
    const dir = newIdx > idx ? 'next' : 'prev';

    setSlideClass(`saliendo-${dir}`);

    setTimeout(() => {
      videoRef.current?.pause();
      setIsPlaying(false);
      setIdx(newIdx);
      setSlideClass(`entrando-${dir}`);
      setTimeout(() => setSlideClass(''), 360);
    }, 260);
  };

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setIsPlaying(true); }
    else            { vid.pause(); setIsPlaying(false); }
  };

  const t = testimonios[idx];

  return (
    <section className="testimonios-section">
      <div className="container">

        <div className="testimonios-divider">
          <h2 className="testimonios-divider-titulo">Nuestra Comunidad</h2>
        </div>

        <div className="tc-wrapper">
          <div className="tc-slide-wrap">

            <button className="tc-nav tc-nav-prev" onClick={() => goTo(idx - 1)} disabled={idx === 0} aria-label="Testimonio anterior">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            <div className={`tc-slide${slideClass ? ` ${slideClass}` : ''}`}>

              <div className="tc-video-col" onClick={togglePlay}>
                <video
                  key={idx}
                  ref={videoRef}
                  src={t.src}
                  className="tc-video"
                  playsInline
                  preload="metadata"
                  onEnded={() => setIsPlaying(false)}
                />
                <div className={`tc-play-btn${isPlaying ? ' oculto' : ''}`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>

              <div className="tc-content-col">
                <span className="tc-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                    <path d="M23 19a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    <path d="M13 21v-1a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v1" />
                    <circle cx="7" cy="7" r="4" />
                  </svg>
                  Voz de nuestra comunidad
                </span>

                <blockquote className="tc-cita">{t.cita}</blockquote>

                <Link to="/eventos" className="tc-cta-btn">
                  Ver próximos eventos
                </Link>
              </div>

            </div>

            <button className="tc-nav tc-nav-next" onClick={() => goTo(idx + 1)} disabled={idx === testimonios.length - 1} aria-label="Testimonio siguiente">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

          </div>

          <div className="tc-dots">
            {testimonios.map((_, i) => (
              <button key={i} className={`tc-dot${i === idx ? ' activo' : ''}`} onClick={() => goTo(i)} aria-label={`Testimonio ${i + 1}`} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
