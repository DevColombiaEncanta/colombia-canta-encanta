import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useCursos } from "../hooks/useCursos";
import Footer from "../components/Footer/Footer";
import "../styles/main.css";
import { BASE_URL, OG_IMAGE } from "../utils/seo";
import { apiFetch } from "../utils/api";

const PAGE_TITLE = "Inscripciones | Colombia Canta y Encanta";
const PAGE_DESC =
  "Inscríbete en la escuela de música de Colombia Canta y Encanta. Cursos vocales, teatro musical, instrumento personalizado e iniciación musical en Medellín.";

const WHATSAPP_NUMERO = "573015315119";

const pasos = [
  {
    num: "1",
    titulo: "Elige tu curso",
    desc: "Revisa los cursos disponibles y selecciona el que más te interese según tu nivel y horario.",
  },
  {
    num: "2",
    titulo: "Completa el formulario",
    desc: "Llena el formulario de inscripción aquí mismo, paso a paso, con los datos del estudiante.",
  },
  {
    num: "3",
    titulo: "Realiza el pago",
    desc: "Recibe las instrucciones de pago y completa tu matrícula fácilmente.",
  },
  {
    num: "4",
    titulo: "Recibe confirmación",
    desc: "Te enviamos la confirmación de tu inscripción con todos los detalles del curso.",
  },
];

const faqs = [
  {
    q: "¿Necesito experiencia previa?",
    r: "No. Tenemos cursos para todos los niveles, desde principiantes absolutos hasta estudiantes avanzados.",
  },
  {
    q: "¿Cuánto duran los cursos?",
    r: "Los cursos tienen una duración de 6 meses, con clases de 1 a 2 horas según la modalidad.",
  },
  {
    q: "¿Cuál es el costo de los cursos?",
    r: "El valor varía según el instrumento y el nivel. Escríbenos al WhatsApp para información actualizada.",
  },
  {
    q: "¿Hay descuentos para estudiantes?",
    r: (
      <>
        <p>Sí, contamos con los siguientes descuentos disponibles:</p>
        <ul className="inscr-faq-descuentos-lista">
          <li>
            <span>Hijos de empleados del <strong>Grupo EPM</strong></span>
            <span className="inscr-faq-descuento-pct">20% de descuento</span>
          </li>
          <li>
            <span>Hijos de empleados de la <strong>Alcaldía de Medellín</strong></span>
            <span className="inscr-faq-descuento-pct">15% de descuento</span>
          </li>
          <li>
            <span>Afiliados a <strong>Comfama</strong></span>
            <span className="inscr-faq-descuento-pct">10% de descuento</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    q: "¿Dónde son las clases?",
    r: "En nuestra sede del Sector Estadio, Calle 49 76a 65, Medellín.",
  },
];

const FORM_DATA_INICIAL = {
  cursoId: "",
  cursoNombre: "",
  estudianteNombre: "",
  estudianteDocumento: "",
  estudianteEdad: "",
  estudianteEmail: "",
  estudianteTelefono: "",
  acudienteNombre: "",
  acudienteContacto: "",
  acudienteParentesco: "",
  acudienteEmail: "",
  horarioPreferencia: "",
  barrio: "",
  aceptaTerminos: false,
};

const WAIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function Inscripciones() {
  const { cursos, cargando, error } = useCursos();
  const [openFaq, setOpenFaq] = useState(null);
  const [pasoIdx, setPasoIdx] = useState(0);
  const [cursoCarruselIdx, setCursoCarruselIdx] = useState(0);

  // ── Flujo de inscripción: ver detalles de un curso, o llenar el formulario ──
  const [vistaDetalle, setVistaDetalle] = useState(null);
  const [formInscripcion, setFormInscripcion] = useState(null);
  const [pasoForm, setPasoForm] = useState(1);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [formData, setFormData] = useState(FORM_DATA_INICIAL);

  const esMenor = Number(formData.estudianteEdad) < 18;
  const cursoIdx = vistaDetalle ? cursos.findIndex((c) => c.id === vistaDetalle.id) : -1;

  const scrollAComoInscribirse = () => {
    document.getElementById("como-inscribirse")?.scrollIntoView({ behavior: "smooth" });
  };

  const manejarVerDetalles = (curso) => {
    setFormInscripcion(null);
    setVistaDetalle(curso);
    scrollAComoInscribirse();
  };

  const iniciarInscripcion = (curso) => {
    setVistaDetalle(null);
    setFormInscripcion(curso);
    setFormData((prev) => ({ ...prev, cursoId: curso.id, cursoNombre: curso.nombre }));
    setPasoForm(1);
    setEnviado(false);
    scrollAComoInscribirse();
  };

  const cancelarFormulario = () => {
    setFormInscripcion(null);
    setFormData(FORM_DATA_INICIAL);
    setErrorEnvio(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const siguientePaso = () => {
    setPasoForm((prev) => (prev === 1 && !esMenor ? 3 : prev + 1));
  };

  const anteriorPaso = () => {
    setPasoForm((prev) => (prev === 3 && !esMenor ? 1 : prev - 1));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setErrorEnvio(null);
    setEnviando(true);

    const payload = {
      curso_id: formData.cursoId,
      estudiante_nombre: formData.estudianteNombre,
      estudiante_documento: formData.estudianteDocumento,
      estudiante_edad: Number(formData.estudianteEdad),
      horario_preferencia: formData.horarioPreferencia,
      acepta_terminos: formData.aceptaTerminos,
    };
    if (formData.estudianteEmail) payload.estudiante_email = formData.estudianteEmail;
    if (formData.estudianteTelefono) payload.estudiante_telefono = formData.estudianteTelefono;
    if (formData.barrio) payload.barrio = formData.barrio;
    if (esMenor) {
      payload.acudiente_nombre = formData.acudienteNombre;
      payload.acudiente_contacto = formData.acudienteContacto;
      payload.acudiente_parentesco = formData.acudienteParentesco;
      if (formData.acudienteEmail) payload.acudiente_email = formData.acudienteEmail;
    }

    try {
      await apiFetch("/api/inscripciones", { method: "POST", body: payload });
      setEnviado(true);
    } catch (err) {
      setErrorEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const urlWhatsAppConsulta = (cursoNombre) => {
    const texto = `¡Hola! Estoy viendo los detalles del curso *${cursoNombre}* en la página web y me gustaría recibir más información sobre horarios y costos.`;
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
  };

  const urlWhatsAppInscripcion = () => {
    const lineas = [
      `¡Hola! Me acabo de inscribir en el curso *${formData.cursoNombre}*.`,
      `Estudiante: ${formData.estudianteNombre} (${formData.estudianteEdad} años)`,
    ];
    if (esMenor) {
      lineas.push(`Acudiente: ${formData.acudienteNombre} · ${formData.acudienteParentesco}`);
    }
    lineas.push(`Horario preferido: ${formData.horarioPreferencia}`);
    if (formData.barrio) lineas.push(`Barrio: ${formData.barrio}`);
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(lineas.join("\n"))}`;
  };

  // Reutilizada por el grid (tablet/desktop) y el carrusel (mobile, <600px) —
  // misma tarjeta, sin duplicar el markup entre los 2 layouts.
  const renderTarjetaCurso = (c) => (
    <div className="inscr-card">
      <div className="inscr-card-header">
        <span className="inscr-card-icono" aria-hidden="true">{c.emoji || "🎵"}</span>
        <span className="inscr-card-tagline">{c.tagline}</span>
      </div>

      <div className="inscr-card-body">
        <h3 className="inscr-card-nombre">{c.nombre}</h3>
        {c.esPersonalizado && (
          <span className="inscr-card-personalizado">
            👤 Clases personalizadas{c.profesorNombre ? ` · ${c.profesorNombre}` : ''}
          </span>
        )}
        <ul className="inscr-card-lista">
          {(c.instrumentos || []).slice(0, 4).map((i) => (
            <li key={i}>{i}</li>
          ))}
          {(c.instrumentos || []).length > 4 && (
            <li className="inscr-card-mas">
              +{c.instrumentos.length - 4} más
            </li>
          )}
        </ul>
        <div className="inscr-card-acciones">
          <button
            type="button"
            className="inscr-card-btn"
            onClick={() => manejarVerDetalles(c)}
          >
            Ver detalles
          </button>
          <button
            type="button"
            className="inscr-card-btn inscr-card-btn-solido"
            onClick={() => iniciarInscripcion(c)}
          >
            Inscribirme
          </button>
        </div>
      </div>
    </div>
  );

  // Franjas reales del curso ya configuradas por el admin, para que el
  // horario sea seleccionable en vez de un texto libre o 3 opciones fijas
  // genéricas (2026-08-19, pedido del usuario). Solo si no hay ninguna franja
  // cargada (personalizado sin horario fijo) queda el texto libre de respaldo.
  const opcionesHorario = (formInscripcion?.horarios || []).map((h) => `${h.dia} · ${h.hora}`);

  return (
    <main>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#/inscripciones`} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESC} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:locale" content="es_CO" />
        <meta property="og:site_name" content="Colombia Canta y Encanta" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESC} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>

      <div className="page-header">
        <div className="container">
          <div className="page-header-inner">
            <span className="page-header-label">Escuela de Música</span>
            <h1>Inscripciones</h1>
          </div>
          <div className="page-header-divisor" />
        </div>
      </div>

      {/* ── Cursos ── */}
      <section id="cursos" className="inscr-seccion">
        <div className="container">
          <h2 className="inscr-titulo">Elige tu camino</h2>
          <p className="inscr-subtitulo">
            Formación musical para todas las edades y niveles.
          </p>

          {cargando && <p className="inscr-estado">Cargando cursos…</p>}
          {!cargando && error && <p className="inscr-estado">No se pudieron cargar los cursos. Intenta de nuevo más tarde.</p>}
          {!cargando && !error && cursos.length === 0 && (
            <p className="inscr-estado">Aún no hay cursos publicados. Vuelve pronto.</p>
          )}

          {!cargando && !error && cursos.length > 0 && (
          <>
          {/* Tablet/Desktop: grid */}
          <div className="inscr-cursos-grid">
            {cursos.map((c) => <div key={c.id}>{renderTarjetaCurso(c)}</div>)}
          </div>

          {/* Mobile (<600px): carrusel — mismo formato visual de tarjeta, sin la lista larga hacia abajo */}
          <div className="inscr-cursos-carrusel">
            <button
              className="inscr-pasos-nav inscr-pasos-nav-prev"
              onClick={() => setCursoCarruselIdx((i) => Math.max(0, i - 1))}
              disabled={cursoCarruselIdx === 0}
              aria-label="Curso anterior"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            {renderTarjetaCurso(cursos[cursoCarruselIdx])}

            <button
              className="inscr-pasos-nav inscr-pasos-nav-next"
              onClick={() => setCursoCarruselIdx((i) => Math.min(cursos.length - 1, i + 1))}
              disabled={cursoCarruselIdx === cursos.length - 1}
              aria-label="Siguiente curso"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            <div className="inscr-pasos-dots">
              {cursos.map((c, i) => (
                <button
                  key={c.id}
                  className={`inscr-pasos-dot${i === cursoCarruselIdx ? ' activo' : ''}`}
                  onClick={() => setCursoCarruselIdx(i)}
                  aria-label={`Ver curso ${i + 1}: ${c.nombre}`}
                />
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      </section>

      {/* ── Cómo inscribirse — guía / detalle del curso / formulario ── */}
      <section
        id="como-inscribirse"
        className="inscr-seccion inscr-seccion-foto"
        style={{
          backgroundImage: `linear-gradient(rgba(10,15,30,0.62), rgba(10,15,30,0.82)), url(${import.meta.env.BASE_URL}Nuestra_Historia.avif)`,
        }}
      >
        <div className="container">
          {!vistaDetalle && !formInscripcion && (
            <>
              <span className="label-seccion label-rojo">Proceso</span>
              <h2 className="inscr-titulo">Cómo inscribirse</h2>
              <p className="inscr-subtitulo inscr-subtitulo-claro">
                Cuatro pasos simples para comenzar tu formación musical.
              </p>
              {/* Desktop: grid de 4 columnas */}
              <div className="grid-4col inscr-pasos">
                {pasos.map((p) => (
                  <div key={p.num} className="inscr-paso">
                    <div className="inscr-paso-num">{p.num}</div>
                    <h3 className="inscr-paso-titulo">{p.titulo}</h3>
                    <p className="inscr-paso-desc">{p.desc}</p>
                  </div>
                ))}
              </div>

              {/* Tablet/Mobile: carrusel */}
              <div className="inscr-pasos-carrusel">
                <button
                  className="inscr-pasos-nav inscr-pasos-nav-prev"
                  onClick={() => setPasoIdx(i => Math.max(0, i - 1))}
                  disabled={pasoIdx === 0}
                  aria-label="Paso anterior"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>

                <div className="inscr-pasos-card">
                  <div className="inscr-paso-num">{pasos[pasoIdx].num}</div>
                  <h3 className="inscr-paso-titulo">{pasos[pasoIdx].titulo}</h3>
                  <p className="inscr-paso-desc">{pasos[pasoIdx].desc}</p>
                </div>

                <button
                  className="inscr-pasos-nav inscr-pasos-nav-next"
                  onClick={() => setPasoIdx(i => Math.min(pasos.length - 1, i + 1))}
                  disabled={pasoIdx === pasos.length - 1}
                  aria-label="Paso siguiente"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>

                <div className="inscr-pasos-dots">
                  {pasos.map((_, i) => (
                    <button
                      key={i}
                      className={`inscr-pasos-dot${i === pasoIdx ? ' activo' : ''}`}
                      onClick={() => setPasoIdx(i)}
                      aria-label={`Paso ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {vistaDetalle && !formInscripcion && (
            <div className="inscr-detalle-wrapper">
              <button
                className="inscr-nav-curso inscr-nav-lateral"
                onClick={() => setVistaDetalle(cursos[cursoIdx - 1])}
                disabled={cursoIdx <= 0}
                aria-label="Curso anterior"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>

              <div className="inscr-detalle">
                <div className="inscr-detalle-header">
                  <button
                    className="inscr-detalle-cerrar"
                    onClick={() => setVistaDetalle(null)}
                    aria-label="Cerrar detalle"
                  >
                    ✕
                  </button>
                  <span className="inscr-detalle-icono" aria-hidden="true">{vistaDetalle.emoji || "🎵"}</span>
                  <div className="inscr-detalle-header-texto">
                    <span className="inscr-detalle-tagline">{vistaDetalle.tagline}</span>
                    <h3 className="inscr-detalle-nombre">{vistaDetalle.nombre}</h3>
                  </div>
                </div>

                <div className="inscr-detalle-body">
                  <p className="inscr-detalle-desc">{vistaDetalle.descripcion}</p>

                  {vistaDetalle.esPersonalizado && (
                    <div className="inscr-detalle-grupo">
                      <span className="inscr-detalle-grupo-label">Profesor</span>
                      <p className="inscr-detalle-profesor">
                        👤 {vistaDetalle.profesorNombre || 'Se coordina al inscribirte'} · clases personalizadas 1 a 1
                      </p>
                    </div>
                  )}

                  {vistaDetalle.instrumentos?.length > 0 && (
                    <div className="inscr-detalle-grupo">
                      <span className="inscr-detalle-grupo-label">Modalidades</span>
                      <div className="inscr-detalle-chips">
                        {vistaDetalle.instrumentos.map((i) => (
                          <span key={i} className="inscr-detalle-chip inscr-detalle-chip-outline">
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="inscr-detalle-grupo inscr-detalle-grupo-niveles">
                    <span className="inscr-detalle-grupo-label">Niveles disponibles</span>
                    <div className="inscr-detalle-chips">
                      {[...vistaDetalle.niveles].sort((a, b) => a.orden - b.orden).map((n) => (
                        <span key={n.id} className="inscr-detalle-chip inscr-detalle-chip-outline">
                          {n.nombre}
                        </span>
                      ))}
                    </div>
                  </div>

                  {vistaDetalle.horarios?.length > 0 && (
                    <div className="inscr-detalle-grupo">
                      <span className="inscr-detalle-grupo-label">Horarios</span>
                      <div className="inscr-detalle-horarios">
                        {vistaDetalle.horarios.map((h, i) => (
                          <div key={i} className="inscr-detalle-horario-fila">
                            <span className="inscr-detalle-dia">{h.dia}</span>
                            <span className="inscr-detalle-hora">{h.hora}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="inscr-detalle-meta">
                    <div className="inscr-detalle-meta-item">
                      <span className="inscr-detalle-meta-label">Duración</span>
                      <span className="inscr-detalle-meta-valor">{vistaDetalle.duracion}</span>
                    </div>
                    <div className="inscr-detalle-meta-item">
                      <span className="inscr-detalle-meta-label">Inversión</span>
                      <span className="inscr-detalle-meta-valor">{vistaDetalle.precio}</span>
                    </div>
                  </div>

                  <div className="inscr-detalle-acciones">
                    <a
                      href={urlWhatsAppConsulta(vistaDetalle.nombre)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-oscuro"
                    >
                      <WAIcon /> Preguntar por WhatsApp
                    </a>
                    <button
                      type="button"
                      className="btn btn-solido-oscuro"
                      onClick={() => iniciarInscripcion(vistaDetalle)}
                    >
                      Inscribirme ahora →
                    </button>
                  </div>
                </div>
              </div>

              <button
                className="inscr-nav-curso inscr-nav-lateral"
                onClick={() => setVistaDetalle(cursos[cursoIdx + 1])}
                disabled={cursoIdx >= cursos.length - 1}
                aria-label="Siguiente curso"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>

              <div className="inscr-nav-mobile-row">
                <button
                  className="inscr-nav-curso"
                  onClick={() => setVistaDetalle(cursos[cursoIdx - 1])}
                  disabled={cursoIdx <= 0}
                  aria-label="Curso anterior"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button
                  className="inscr-nav-curso"
                  onClick={() => setVistaDetalle(cursos[cursoIdx + 1])}
                  disabled={cursoIdx >= cursos.length - 1}
                  aria-label="Siguiente curso"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {formInscripcion && (
            <div className="inscr-form">
              <div className="inscr-form-header">
                <span className="inscr-form-badge">{formInscripcion.nombre}</span>
                {!enviado && (
                  <button type="button" className="inscr-form-cerrar" onClick={cancelarFormulario}>
                    ✕ Cancelar
                  </button>
                )}
              </div>

              {!enviado ? (
                <form onSubmit={manejarEnvio} className="inscr-form-body">
                  <div className="inscr-stepper-progress">
                    <span className={`inscr-step-pill${pasoForm >= 1 ? " activo" : ""}`}>1. Datos</span>
                    {esMenor && (
                      <span className={`inscr-step-pill${pasoForm >= 2 ? " activo" : ""}`}>2. Acudiente</span>
                    )}
                    <span className={`inscr-step-pill${pasoForm >= 3 ? " activo" : ""}`}>
                      {esMenor ? "3" : "2"}. Horario
                    </span>
                  </div>

                  {pasoForm === 1 && (
                    <div className="inscr-form-paso">
                      <h3>Información del estudiante</h3>
                      <div className="inscr-form-grupo">
                        <label>Nombre completo *</label>
                        <input
                          type="text"
                          name="estudianteNombre"
                          required
                          value={formData.estudianteNombre}
                          onChange={handleChange}
                          placeholder="Ej. Juan Pérez"
                        />
                      </div>
                      <div className="inscr-form-fila">
                        <div className="inscr-form-grupo">
                          <label>Documento *</label>
                          <input
                            type="text"
                            name="estudianteDocumento"
                            required
                            value={formData.estudianteDocumento}
                            onChange={handleChange}
                            placeholder="TI / CC"
                          />
                        </div>
                        <div className="inscr-form-grupo">
                          <label>Edad *</label>
                          <input
                            type="number"
                            name="estudianteEdad"
                            required
                            min="1"
                            max="120"
                            value={formData.estudianteEdad}
                            onChange={handleChange}
                            placeholder="Años"
                          />
                        </div>
                      </div>
                      <div className="inscr-form-fila">
                        <div className="inscr-form-grupo">
                          <label>Email</label>
                          <input
                            type="email"
                            name="estudianteEmail"
                            value={formData.estudianteEmail}
                            onChange={handleChange}
                            placeholder="correo@ejemplo.com"
                          />
                        </div>
                        <div className="inscr-form-grupo">
                          <label>Teléfono</label>
                          <input
                            type="tel"
                            name="estudianteTelefono"
                            value={formData.estudianteTelefono}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="inscr-form-acciones">
                        <button
                          type="button"
                          className="btn btn-solido-oscuro"
                          disabled={!formData.estudianteNombre || !formData.estudianteDocumento || !formData.estudianteEdad}
                          onClick={siguientePaso}
                        >
                          Continuar →
                        </button>
                      </div>
                    </div>
                  )}

                  {pasoForm === 2 && esMenor && (
                    <div className="inscr-form-paso">
                      <h3>Datos del acudiente</h3>
                      <div className="inscr-form-grupo">
                        <label>Nombre del acudiente *</label>
                        <input
                          type="text"
                          name="acudienteNombre"
                          required
                          value={formData.acudienteNombre}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="inscr-form-fila">
                        <div className="inscr-form-grupo">
                          <label>Teléfono *</label>
                          <input
                            type="tel"
                            name="acudienteContacto"
                            required
                            value={formData.acudienteContacto}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="inscr-form-grupo">
                          <label>Parentesco *</label>
                          <select
                            name="acudienteParentesco"
                            required
                            value={formData.acudienteParentesco}
                            onChange={handleChange}
                          >
                            <option value="">Selecciona...</option>
                            <option value="Madre">Madre</option>
                            <option value="Padre">Padre</option>
                            <option value="Tutor legal">Tutor legal</option>
                          </select>
                        </div>
                      </div>
                      <div className="inscr-form-grupo">
                        <label>Email del acudiente</label>
                        <input
                          type="email"
                          name="acudienteEmail"
                          value={formData.acudienteEmail}
                          onChange={handleChange}
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                      <div className="inscr-form-acciones">
                        <button type="button" className="btn btn-outline-oscuro" onClick={anteriorPaso}>
                          ← Atrás
                        </button>
                        <button
                          type="button"
                          className="btn btn-solido-oscuro"
                          disabled={!formData.acudienteNombre || !formData.acudienteContacto || !formData.acudienteParentesco}
                          onClick={siguientePaso}
                        >
                          Continuar →
                        </button>
                      </div>
                    </div>
                  )}

                  {pasoForm === 3 && (
                    <div className="inscr-form-paso">
                      <h3>Preferencias de horario</h3>
                      <div className="inscr-form-fila">
                        <div className="inscr-form-grupo">
                          <label>{opcionesHorario.length > 0 ? 'Horario *' : 'Horario a coordinar *'}</label>
                          {opcionesHorario.length > 0 ? (
                            <select
                              name="horarioPreferencia"
                              required
                              value={formData.horarioPreferencia}
                              onChange={handleChange}
                            >
                              <option value="">Selecciona una opción...</option>
                              {opcionesHorario.map((h) => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              name="horarioPreferencia"
                              required
                              value={formData.horarioPreferencia}
                              onChange={handleChange}
                              placeholder="Ej. Martes en la tarde, o el horario que te sirva"
                            />
                          )}
                        </div>
                        <div className="inscr-form-grupo">
                          <label>Barrio</label>
                          <input
                            type="text"
                            name="barrio"
                            value={formData.barrio}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <label className="inscr-checkbox-label">
                        <input
                          type="checkbox"
                          name="aceptaTerminos"
                          required
                          checked={formData.aceptaTerminos}
                          onChange={handleChange}
                        />
                        Acepto los términos y la política de datos personales.
                      </label>

                      {errorEnvio && (
                        <p className="inscr-form-error">{errorEnvio}</p>
                      )}

                      <div className="inscr-form-acciones">
                        <button type="button" className="btn btn-outline-oscuro" onClick={anteriorPaso} disabled={enviando}>
                          ← Atrás
                        </button>
                        <button
                          type="submit"
                          className="btn btn-solido-oscuro"
                          disabled={!formData.horarioPreferencia || !formData.aceptaTerminos || enviando}
                        >
                          {enviando ? "Enviando…" : "Finalizar inscripción ✓"}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <div className="inscr-exito">
                  <span className="inscr-exito-icono">🎉</span>
                  <h3>¡Inscripción registrada!</h3>
                  <p>
                    Hola <strong>{formData.estudianteNombre}</strong>, dejamos registrado tu cupo para{" "}
                    <strong>{formData.cursoNombre}</strong>. Para confirmarlo, escríbenos por WhatsApp con
                    un solo clic.
                  </p>
                  <div className="inscr-exito-acciones">
                    <a
                      href={urlWhatsAppInscripcion()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-solido-oscuro"
                    >
                      <WAIcon /> Confirmar por WhatsApp
                    </a>
                    <button type="button" className="btn btn-outline-oscuro" onClick={cancelarFormulario}>
                      Volver a los cursos
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="inscr-seccion">
        <div className="container inscr-faq-container">
          <span className="label-seccion label-rojo">Preguntas frecuentes</span>
          <h2 className="inscr-titulo">¿Tienes dudas?</h2>
          <p className="inscr-subtitulo">
            Todo lo que necesitas saber antes de inscribirte.
          </p>
          <div className="inscr-faq-lista">
            {faqs.map((faq, i) => (
              <div key={i} className="inscr-faq-item">
                <button
                  className="inscr-faq-pregunta"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <span
                    className={`inscr-faq-chevron${openFaq === i ? " abierto" : ""}`}
                  >
                    ▾
                  </span>
                </button>
                {openFaq === i && (
                  <div className="inscr-faq-respuesta">{faq.r}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
