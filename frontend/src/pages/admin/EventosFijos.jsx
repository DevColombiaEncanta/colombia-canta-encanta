import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useListaDinamica } from '../../hooks/useListaDinamica';
import AdminLayout from '../../components/admin/ui/AdminLayout';
import Card from '../../components/admin/ui/Card';
import FormField from '../../components/admin/ui/FormField';
import Button from '../../components/admin/ui/Button';
import HelpTooltip from '../../components/admin/ui/HelpTooltip';
import ImageUploadField from '../../components/admin/ui/ImageUploadField';
import './EventosFijos.css';

// Mismas fotos que se muestran en el detalle de evento (`EventoDetalle.jsx`,
// `.evento-galeria-frame`) — 3:2, ver nota completa en Eventos.jsx/readme_guia.md.
const ASPECTO_FOTO_SHOW = 3 / 2;

// 2026-08-16 · Único slug cuya programación es una lista de shows DISTINTOS
// (nombre/descripción propios, como Salas Colombia Canta). Decisión con el
// usuario tras probar el panel real: "Colombia me Enamoras" es siempre la
// misma experiencia — solo hacen falta las fechas/horarios en que se hace
// este mes, sin pedir un nombre/descripción que sería igual en cada fila.
const SLUG_PROGRAMACION_COMPLETA = 'salas-colombia-canta';

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// El día corto (ej. "Vie 07") se muestra en el sitio público separado del
// resto — antes se escribía a mano, con el riesgo real de no coincidir con
// la fecha (pedido del usuario, mismo criterio que ya se usa en Eventos:
// autogenerar en vez de confiar en que alguien lo escriba bien).
function diaCortoDesdeISO(fechaISO) {
  if (!fechaISO) return '';
  const [anio, mes, dia] = fechaISO.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return `${DIAS_CORTOS[fecha.getDay()]} ${String(dia).padStart(2, '0')}`;
}

// La hora real ya guardada viene como "6:00 PM" (formato libre, de antes de
// este ajuste) — se parsea a 24h una vez, al cargar, para poder usar un
// selector de hora real (`type="time"`) en vez de texto libre.
function horaA24h(hora) {
  if (!hora) return '';
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(hora.trim());
  if (!m) return /^\d{2}:\d{2}$/.test(hora.trim()) ? hora.trim() : '';
  let h = parseInt(m[1], 10);
  if (/pm/i.test(m[3]) && h !== 12) h += 12;
  if (/am/i.test(m[3]) && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

// Al guardar se vuelve a convertir a "6:00 PM" — mantiene el mismo formato
// amigable que ya se ve en el sitio público, el selector de hora es solo
// para que el admin no tenga que escribirlo a mano.
function horaDesde24h(hora24) {
  if (!hora24) return '';
  const [hStr, min] = hora24.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}`;
}

function showVacio() {
  return { hora: '', fechaISO: '', nombre: '', descripcion: '', foto: '', archivoNuevo: null };
}

// Traduce un show ya guardado (formato del backend) al formato que usa el
// formulario — separado para poder recargarlo igual después de guardar.
function showDesdeBackend(s) {
  return {
    hora: horaA24h(s.hora || ''),
    fechaISO: s.fechaISO || '',
    nombre: s.nombre || '',
    descripcion: s.descripcion || '',
    foto: s.foto || '',
    archivoNuevo: null,
  };
}

function tieneAlgo(s) {
  return !!(s.hora.trim() || s.fechaISO.trim() || s.nombre.trim() || s.descripcion.trim() || s.foto || s.archivoNuevo);
}

function showCompleto(s, modoCompleto) {
  const base = !!(s.hora.trim() && s.fechaISO.trim() && (s.foto || s.archivoNuevo));
  return modoCompleto ? base && !!(s.nombre.trim() && s.descripcion.trim()) : base;
}

// Una tarjeta por experiencia, con 2 acciones de guardado independientes
// (mismo criterio que Hero/Eventos: cada sección se guarda con su propio
// PATCH, sin necesitar tocar el resto). El `mes` se puede guardar solo.
//
// 2026-08-16 · Rediseño pedido por el usuario: cada show guarda su propia
// foto (antes había que resubir la foto de TODOS los shows con cualquier
// cambio, aunque fuera agregar o borrar uno solo — ver hallazgo completo en
// readme_guia.md). Ahora se puede agregar/editar/borrar un show sin tocar
// las fotos de los demás.
function ExperienciaFija({ experiencia, adminFetch, onActualizado }) {
  const modoCompleto = experiencia.slug === SLUG_PROGRAMACION_COMPLETA;

  const [mes, setMes] = useState(experiencia.mes || '');
  const [guardandoMes, setGuardandoMes] = useState(false);
  const [avisoMes, setAvisoMes] = useState('');
  const [errorMes, setErrorMes] = useState('');

  const shows = useListaDinamica((experiencia.programacion || []).map(showDesdeBackend));
  const [erroresShows, setErroresShows] = useState({});
  const [errorProg, setErrorProg] = useState('');
  const [avisoProg, setAvisoProg] = useState('');
  const [guardandoProg, setGuardandoProg] = useState(false);

  useEffect(() => {
    if (!avisoMes) return;
    const t = setTimeout(() => setAvisoMes(''), 3500);
    return () => clearTimeout(t);
  }, [avisoMes]);

  useEffect(() => {
    if (!avisoProg) return;
    const t = setTimeout(() => setAvisoProg(''), 3500);
    return () => clearTimeout(t);
  }, [avisoProg]);

  async function guardarMes(e) {
    e.preventDefault();
    setGuardandoMes(true);
    setErrorMes('');
    try {
      const fd = new FormData();
      fd.append('mes', mes);
      const data = await adminFetch(`/api/admin/eventos-fijos/${experiencia.id}`, { method: 'PATCH', body: fd });
      onActualizado(data.data);
      setAvisoMes('Mes guardado.');
    } catch (err) {
      setErrorMes(err.message);
    } finally {
      setGuardandoMes(false);
    }
  }

  // Mismo criterio que el CTA del Hero y las zonas/testimonios de Eventos
  // (5.2/5.3a): una fila a medio llenar bloquea el guardado con un mensaje
  // claro en vez de perderse en silencio. Las filas totalmente vacías (el
  // estado inicial de "+ Agregar") se ignoran sin drama.
  function validarProgramacion() {
    const errores = {};
    shows.items.forEach((s, idx) => {
      if (tieneAlgo(s) && !showCompleto(s, modoCompleto)) {
        errores[idx] = modoCompleto
          ? 'Completa fecha, hora, nombre, descripción y la foto, o borra la fila'
          : 'Completa fecha, hora y la foto, o borra la fila';
      }
    });
    setErroresShows(errores);
    return Object.keys(errores).length === 0;
  }

  async function guardarProgramacion(e) {
    e.preventDefault();
    setErrorProg('');
    if (!validarProgramacion()) return;

    const showsLimpios = shows.items.filter(tieneAlgo);
    const fotosIndices = [];
    const archivosNuevos = [];
    const programacionFinal = showsLimpios.map((s, idx) => {
      const item = { dia: diaCortoDesdeISO(s.fechaISO), hora: horaDesde24h(s.hora), fechaISO: s.fechaISO };
      if (modoCompleto) {
        item.nombre = s.nombre.trim();
        item.descripcion = s.descripcion.trim();
      }
      if (s.archivoNuevo) {
        fotosIndices.push(idx);
        archivosNuevos.push(s.archivoNuevo);
      } else {
        item.foto = s.foto;
      }
      return item;
    });

    setGuardandoProg(true);
    try {
      const fd = new FormData();
      fd.append('programacion', JSON.stringify(programacionFinal));
      fd.append('fotosIndices', JSON.stringify(fotosIndices));
      archivosNuevos.forEach((f) => fd.append('fotos', f));
      const data = await adminFetch(`/api/admin/eventos-fijos/${experiencia.id}`, { method: 'PATCH', body: fd });
      onActualizado(data.data);
      shows.setItems((data.data.programacion || []).map(showDesdeBackend));
      setErrorProg('');
      setAvisoProg('Programación guardada.');
    } catch (err) {
      setErrorProg(err.message);
    } finally {
      setGuardandoProg(false);
    }
  }

  return (
    <Card className="evfijos-card">
      <h2 className="evfijos-titulo">{experiencia.titulo}</h2>
      <p className="evfijos-nota">
        El resto del contenido de esta experiencia (fotos de portada, descripciones, etiquetas, fases) es fijo y no se edita desde aquí.
      </p>

      <form onSubmit={guardarMes} className="evfijos-form-mes">
        <FormField label="Mes" hint='ej. "Agosto 2026" — se muestra junto a la programación'>
          <input type="text" value={mes} onChange={(e) => setMes(e.target.value)} />
        </FormField>
        {errorMes && <p className="admin-page-error">{errorMes}</p>}
        {avisoMes && (
          <p className="admin-form-aviso" role="status">
            <span aria-hidden="true">✓</span> {avisoMes}
          </p>
        )}
        <Button type="submit" variant="secundario" disabled={guardandoMes}>
          {guardandoMes ? 'Guardando…' : 'Guardar mes'}
        </Button>
      </form>

      <div className="evfijos-programacion">
        <h3 className="evfijos-subtitulo">
          {modoCompleto ? 'Programación' : 'Fechas'}
          <HelpTooltip
            texto={
              modoCompleto
                ? 'Cada show tiene su propia foto y su propio nombre/descripción — puedes agregar, editar o borrar uno sin tocar los demás.'
                : 'Como siempre es la misma experiencia, aquí solo se anotan las fechas y horarios en que se hace — sin nombre ni descripción por fecha.'
            }
          />
        </h3>

        {shows.items.map((s, idx) => (
          <div className="evfijos-show-fila" key={idx}>
            <div className="evfijos-show-foto">
              <ImageUploadField
                label="Foto"
                recomendado="1200×800px, 3:2"
                aspecto={ASPECTO_FOTO_SHOW}
                valorActual={s.foto}
                archivo={s.archivoNuevo}
                onChange={(archivo) => shows.actualizar(idx, 'archivoNuevo', archivo)}
              />
            </div>
            <div className="evfijos-show-campos">
              <div className="evfijos-show-fila-datos">
                <input type="date" aria-label="Fecha del show" value={s.fechaISO} onChange={(e) => shows.actualizar(idx, 'fechaISO', e.target.value)} className={erroresShows[idx] ? 'invalido' : ''} />
                <input type="time" aria-label="Hora" value={s.hora} onChange={(e) => shows.actualizar(idx, 'hora', e.target.value)} className={erroresShows[idx] ? 'invalido' : ''} />
                {s.fechaISO && <span className="evfijos-show-dia-preview">{diaCortoDesdeISO(s.fechaISO)}</span>}
              </div>
              {modoCompleto && (
                <>
                  <input type="text" placeholder="Nombre del show" aria-label="Nombre del show" value={s.nombre} onChange={(e) => shows.actualizar(idx, 'nombre', e.target.value)} className={erroresShows[idx] ? 'invalido' : ''} />
                  <textarea placeholder="Descripción" aria-label="Descripción del show" value={s.descripcion} onChange={(e) => shows.actualizar(idx, 'descripcion', e.target.value)} className={erroresShows[idx] ? 'invalido' : ''} />
                </>
              )}
              {erroresShows[idx] && <span className="admin-field-error" role="alert">{erroresShows[idx]}</span>}
            </div>
            <button type="button" className="admin-fila-quitar" onClick={() => shows.quitar(idx)} aria-label={`Quitar ${modoCompleto ? 'show' : 'fecha'} ${idx + 1}`}>×</button>
          </div>
        ))}
        <Button type="button" variant="secundario" onClick={() => shows.agregar(showVacio())}>
          {modoCompleto ? '+ Agregar show' : '+ Agregar fecha'}
        </Button>

        {errorProg && <p className="admin-page-error">{errorProg}</p>}
        {avisoProg && (
          <p className="admin-form-aviso" role="status">
            <span aria-hidden="true">✓</span> {avisoProg}
          </p>
        )}

        <div className="evfijos-guardar-prog">
          <Button type="button" onClick={guardarProgramacion} disabled={guardandoProg}>
            {guardandoProg ? 'Guardando…' : modoCompleto ? 'Guardar programación' : 'Guardar fechas'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function EventosFijos() {
  const { adminFetch } = useAdminAuth();
  const [experiencias, setExperiencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const cargar = useCallback((cancelObj) => {
    adminFetch('/api/admin/eventos-fijos')
      .then((data) => { if (!cancelObj?.cancelado) { setExperiencias(data.data); setErrorCarga(''); } })
      .catch((err) => { if (!cancelObj?.cancelado) setErrorCarga(err.message); })
      .finally(() => { if (!cancelObj?.cancelado) setCargando(false); });
  }, [adminFetch]);

  useEffect(() => {
    const cancelObj = { cancelado: false };
    cargar(cancelObj);
    return () => { cancelObj.cancelado = true; };
  }, [cargar]);

  function manejarActualizado(experienciaActualizada) {
    setExperiencias((prev) => prev.map((e) => (e.id === experienciaActualizada.id ? experienciaActualizada : e)));
  }

  return (
    <AdminLayout>
      <div className="evfijos-panel-header">
        <div className="evfijos-panel-header-textos">
          <h1 className="admin-page-titulo">Eventos Fijos</h1>
          <p className="admin-page-sub">Edita el mes y la programación de las experiencias fijas.</p>
        </div>
      </div>

      {cargando && <p>Cargando…</p>}
      {errorCarga && (
        <p className="admin-page-error">
          No se pudo cargar: {errorCarga}{' '}
          <button onClick={() => { setCargando(true); cargar(); }}>Reintentar</button>
        </p>
      )}

      {!cargando && !errorCarga && (
        <div className="evfijos-lista">
          {experiencias.map((exp) => (
            <ExperienciaFija key={exp.id} experiencia={exp} adminFetch={adminFetch} onActualizado={manejarActualizado} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
