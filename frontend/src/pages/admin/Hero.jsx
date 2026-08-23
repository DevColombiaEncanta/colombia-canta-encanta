import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from '../../components/admin/ui/AdminLayout';
import Card from '../../components/admin/ui/Card';
import FormField from '../../components/admin/ui/FormField';
import Checkbox from '../../components/admin/ui/Checkbox';
import Button from '../../components/admin/ui/Button';
import ImageUploadField from '../../components/admin/ui/ImageUploadField';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import HelpTooltip from '../../components/admin/ui/HelpTooltip';
import './Hero.css';

const CTA_VACIO = () => ({ label: '', to: '', primario: false });

// ⭐ Pedido del usuario (2026-08-15): nada impedía antes escribir una URL
// externa completa en "a dónde lleva" — <Link to={cta.to}> (react-router) la
// trataría como una ruta interna rota en vez de navegar afuera, así que el
// botón simplemente no funcionaría, sin ningún aviso de por qué. Se valida
// acá para explicarlo antes de guardar, no después de que falle en silencio.
//
// ⭐ Hallazgo real (revisión crítica, 2026-08-15): la primera versión de este
// chequeo solo reconocía el patrón "esquema://" (http://, https://) — un
// valor como "javascript:alert(1)" (sin "//") no coincidía, así que cualquier
// esquema sin barras dobles (`javascript:`, `data:`, `mailto:`, etc.) se
// hubiera colado con el mensaje genérico de "debe empezar con /" en vez de
// ser reconocido como peligroso. La regla real de seguridad es la lista
// blanca de abajo (`esRutaInternaValida`, también espejada en el backend en
// `routes/hero.js` — el front nunca es la única barrera): cualquier valor que
// no empiece con exactamente un "/" queda afuera, sea cual sea el motivo.
function pareceUrlAbsoluta(to) {
  return /^[a-z][a-z0-9+.-]*:/i.test(to) || to.startsWith('//');
}

function formularioDesdeSlide(slide, ordenSugerido) {
  if (!slide) {
    return { label: '', titulo: '', descripcion: '', orden: ordenSugerido, activo: true, ctas: [] };
  }
  return {
    label: slide.label,
    titulo: slide.titulo,
    descripcion: slide.descripcion || '',
    orden: slide.orden,
    activo: slide.activo,
    ctas: Array.isArray(slide.ctas) ? slide.ctas : [],
  };
}

// Formulario aislado en su propio componente, montado con una `key` distinta
// por cada slide seleccionada (ver uso más abajo) — así el estado del
// formulario se reinicia solo al cambiar de slide, sin necesitar un useEffect
// que "sincronice" el formulario con la selección (patrón recomendado por
// React para este caso: https://react.dev/learn/you-might-not-need-an-effect).
// ⭐ Hallazgo real (2026-08-14, encontrado por Playwright, no a simple vista):
// el aviso de "Slide creada." vivía como estado local de este componente —
// pero crear una slide dispara justo el cambio de `key` que remonta este
// mismo componente (para pasar a modo edición), así que el mensaje
// desaparecía antes de que nadie pudiera llegar a verlo. Se sube al padre
// (`Hero`, que no se remonta) vía `onAviso`, en vez de guardarlo acá.
function HeroForm({ slide, ordenSugerido, onGuardado, onBorrado, onAviso, aviso, adminFetch }) {
  const [form, setForm] = useState(() => formularioDesdeSlide(slide, ordenSugerido));
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  function actualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function actualizarCta(idx, campo, valor) {
    setForm((f) => ({ ...f, ctas: f.ctas.map((c, i) => (i === idx ? { ...c, [campo]: valor } : c)) }));
  }

  function agregarCta() {
    setForm((f) => ({ ...f, ctas: [...f.ctas, CTA_VACIO()] }));
  }

  function quitarCta(idx) {
    setForm((f) => ({ ...f, ctas: f.ctas.filter((_, i) => i !== idx) }));
  }

  function validar() {
    const nuevosErrores = {};
    if (!form.label.trim()) nuevosErrores.label = 'El antetítulo es obligatorio';
    if (!form.titulo.trim()) nuevosErrores.titulo = 'El título es obligatorio';
    if (!Number.isInteger(Number(form.orden))) nuevosErrores.orden = 'El orden debe ser un número entero';
    if (!slide && !archivoImagen) nuevosErrores.imagen = 'La imagen es obligatoria';

    const ctaErrores = {};
    form.ctas.forEach((cta, idx) => {
      const to = cta.to.trim();
      if (!to) return; // fila sin destino: se descarta al guardar, no hace falta validarla
      if (pareceUrlAbsoluta(to)) {
        ctaErrores[idx] = 'Debe ser una ruta dentro de este sitio, no una página externa';
      } else if (!to.startsWith('/')) {
        ctaErrores[idx] = 'Debe empezar con "/" (ej. /eventos)';
      }
    });
    if (Object.keys(ctaErrores).length > 0) nuevosErrores.ctas = ctaErrores;

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function guardar(e) {
    e.preventDefault();
    if (!validar()) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      const fd = new FormData();
      fd.append('label', form.label);
      fd.append('titulo', form.titulo);
      fd.append('descripcion', form.descripcion);
      fd.append('orden', String(form.orden));
      fd.append('ctas', JSON.stringify(form.ctas.filter((c) => c.label || c.to)));
      if (slide) fd.append('activo', String(form.activo));
      if (archivoImagen) fd.append('imagen', archivoImagen);

      if (slide) {
        const data = await adminFetch(`/api/admin/hero/${slide.id}`, { method: 'PATCH', body: fd });
        onGuardado(data.slide, false);
        onAviso('Cambios guardados.');
      } else {
        const data = await adminFetch('/api/admin/hero', { method: 'POST', body: fd });
        onGuardado(data.slide, true);
        onAviso('Slide creada.');
      }
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    setBorrando(true);
    try {
      await adminFetch(`/api/admin/hero/${slide.id}`, { method: 'DELETE' });
      onBorrado();
      onAviso('Slide borrada.');
      setConfirmandoBorrar(false);
    } catch (err) {
      setErrorGeneral(err.message);
      setConfirmandoBorrar(false);
    } finally {
      setBorrando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={guardar} noValidate>
        {slide && (
          <div className="admin-form-top">
            <Checkbox
              label="Mostrar slide en rotación (activa)"
              checked={form.activo}
              onChange={(e) => actualizarCampo('activo', e.target.checked)}
            />
          </div>
        )}

        <div className="admin-field-fila">
          <FormField label="Label / Antetítulo" error={errores.label}>
            <input
              type="text"
              value={form.label}
              onChange={(e) => actualizarCampo('label', e.target.value)}
              className={errores.label ? 'invalido' : ''}
            />
          </FormField>
          <FormField label="Posición de orden">
            <input
              type="number"
              value={form.orden}
              onChange={(e) => actualizarCampo('orden', e.target.value)}
              className={errores.orden ? 'invalido' : ''}
            />
          </FormField>
        </div>

        <FormField label="Título principal" error={errores.titulo}>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => actualizarCampo('titulo', e.target.value)}
            className={errores.titulo ? 'invalido' : ''}
          />
        </FormField>

        <FormField label="Descripción" hint="texto largo opcional">
          <textarea
            value={form.descripcion}
            onChange={(e) => actualizarCampo('descripcion', e.target.value)}
          />
        </FormField>

        <div className="hero-cta-lista">
          <p className="admin-field-label-texto">
            Botones de esta slide (CTA)
            <HelpTooltip
              texto="En 'a dónde lleva' escribe solo la ruta dentro de este mismo sitio (no una dirección web completa)."
              ejemplo="/eventos o /tienda"
            />
          </p>
          {form.ctas.length > 0 && (
            <div className="hero-cta-fila hero-cta-encabezados" aria-hidden="true">
              <span className="admin-field-label-texto">Texto del botón</span>
              <span className="admin-field-label-texto">A dónde lleva</span>
            </div>
          )}
          {form.ctas.map((cta, idx) => (
            <div className="hero-cta-fila" key={idx}>
              <input
                type="text"
                placeholder="Ej. Ver detalles"
                aria-label="Texto del botón"
                value={cta.label}
                onChange={(e) => actualizarCta(idx, 'label', e.target.value)}
              />
              <div className="hero-cta-destino">
                <input
                  type="text"
                  placeholder="Ej. /eventos"
                  aria-label="A dónde lleva el botón"
                  aria-invalid={!!errores.ctas?.[idx]}
                  value={cta.to}
                  onChange={(e) => actualizarCta(idx, 'to', e.target.value)}
                  className={errores.ctas?.[idx] ? 'invalido' : ''}
                />
                {errores.ctas?.[idx] && <span className="admin-field-error">{errores.ctas[idx]}</span>}
              </div>
              <label className="hero-cta-primario">
                <input
                  type="checkbox"
                  checked={!!cta.primario}
                  onChange={(e) => actualizarCta(idx, 'primario', e.target.checked)}
                />
                Principal
              </label>
              <button type="button" className="admin-fila-quitar" onClick={() => quitarCta(idx)} aria-label="Quitar botón">×</button>
            </div>
          ))}
          <Button type="button" variant="secundario" onClick={agregarCta}>+ Agregar botón</Button>
        </div>

        <ImageUploadField
          label="Imagen de fondo"
          recomendado="1600×700px, panorámica (no se recorta, pero se ve chica si es muy angosta o muy vertical)"
          valorActual={slide?.imagen}
          archivo={archivoImagen}
          onChange={setArchivoImagen}
          error={errores.imagen}
          requerido={!slide}
        />

        {errorGeneral && <p className="admin-page-error">{errorGeneral}</p>}

        {aviso && (
          <p className="admin-form-aviso" role="status">
            <span aria-hidden="true">✓</span> {aviso}
          </p>
        )}

        <div className="admin-form-acciones">
          <Button type="submit" className="admin-btn-ancho" disabled={guardando}>
            {guardando ? 'Guardando…' : slide ? 'Guardar cambios del slide' : 'Crear slide'}
          </Button>
          {slide && (
            <Button type="button" variant="peligro" onClick={() => setConfirmandoBorrar(true)} disabled={guardando}>
              Borrar esta slide
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        abierto={confirmandoBorrar}
        titulo="¿Borrar esta slide?"
        mensaje={`Se va a borrar "${slide?.titulo}" del carrusel. Esta acción no se puede deshacer.`}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setConfirmandoBorrar(false)}
        confirmando={borrando}
      />
    </Card>
  );
}

export default function Hero() {
  const { adminFetch } = useAdminAuth();
  const [slides, setSlides] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState(null); // null = "nueva"
  const [aviso, setAviso] = useState('');

  const slideSeleccionado = slides.find((s) => s.id === seleccionadoId) || null;

  function seleccionar(id) {
    setSeleccionadoId(id);
    setAviso('');
  }

  // ⭐ Ajuste 2026-08-15 (pedido del usuario): el aviso ahora se dibuja pegado
  // a los botones de acción (ver HeroForm) en vez de arriba de la página —
  // para que no se quede ahí para siempre, se autodescarta solo tras un rato.
  // El estado sigue viviendo acá (no se remonta al crear/borrar); el timer se
  // dispara desde un efecto porque está sincronizando con un timer externo
  // real (setTimeout), no "ajustando estado a partir de una prop" — ese es
  // justamente el caso que react-hooks/set-state-in-effect no penaliza,
  // porque el setState va dentro del callback del timer, no en el cuerpo
  // síncrono del efecto.
  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(timer);
  }, [aviso]);

  const cargarSlides = useCallback((cancelObj) => {
    adminFetch('/api/admin/hero')
      .then((data) => { if (!cancelObj?.cancelado) { setSlides(data.slides); setErrorCarga(''); } })
      .catch((err) => { if (!cancelObj?.cancelado) setErrorCarga(err.message); })
      .finally(() => { if (!cancelObj?.cancelado) setCargando(false); });
  }, [adminFetch]);

  useEffect(() => {
    const cancelObj = { cancelado: false };
    cargarSlides(cancelObj);
    return () => { cancelObj.cancelado = true; };
  }, [cargarSlides]);

  function manejarGuardado(slideGuardada, esNueva) {
    setSlides((prev) => (esNueva ? [...prev, slideGuardada] : prev.map((s) => (s.id === slideGuardada.id ? slideGuardada : s))));
    if (esNueva) setSeleccionadoId(slideGuardada.id);
  }

  function manejarBorrado() {
    setSlides((prev) => prev.filter((s) => s.id !== seleccionadoId));
    setSeleccionadoId(null);
  }

  return (
    <AdminLayout>
      <h1 className="admin-page-titulo">Carrusel del inicio (Hero)</h1>
      <p className="admin-page-sub">Las slides que rotan en la portada del sitio, en el orden que definas aquí.</p>

      {cargando && <p>Cargando…</p>}
      {errorCarga && (
        <p className="admin-page-error">
          No se pudo cargar: {errorCarga}{' '}
          <button onClick={() => { setCargando(true); cargarSlides(); }}>Reintentar</button>
        </p>
      )}

      {!cargando && !errorCarga && (
        <>
          <div className="hero-selector">
            {slides.map((s) => (
              <button
                key={s.id}
                className={`hero-selector-tab${s.id === seleccionadoId ? ' activo' : ''}`}
                onClick={() => seleccionar(s.id)}
              >
                {s.label} {!s.activo && <span className="admin-inactivo-tag">(oculta)</span>}
              </button>
            ))}
            <button
              className={`hero-selector-tab hero-selector-nueva${seleccionadoId === null ? ' activo' : ''}`}
              onClick={() => seleccionar(null)}
            >
              + Nueva slide
            </button>
          </div>

          <HeroForm
            key={seleccionadoId ?? 'nueva'}
            slide={slideSeleccionado}
            ordenSugerido={slides.length + 1}
            adminFetch={adminFetch}
            onGuardado={manejarGuardado}
            onBorrado={manejarBorrado}
            onAviso={setAviso}
            aviso={aviso}
          />
        </>
      )}
    </AdminLayout>
  );
}
