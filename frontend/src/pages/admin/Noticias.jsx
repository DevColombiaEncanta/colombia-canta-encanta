import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useScrollAlSeleccionar } from '../../hooks/useScrollAlSeleccionar';
import AdminLayout from '../../components/admin/ui/AdminLayout';
import Card from '../../components/admin/ui/Card';
import FormField from '../../components/admin/ui/FormField';
import Checkbox from '../../components/admin/ui/Checkbox';
import Button from '../../components/admin/ui/Button';
import ImageUploadField from '../../components/admin/ui/ImageUploadField';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import './Noticias.css';

const CATEGORIAS = ['Giras', 'Escuela', 'Eventos', 'Logro', 'Prensa', 'General'];

function formularioDesdeNoticia(noticia) {
  if (!noticia) {
    return {
      titulo: '', categoria: CATEGORIAS[0], resumen: '', contenido: [''],
      colorInicio: '#1A56DB', colorFin: '#FF5C8D',
      fechaPublicacion: new Date().toISOString().slice(0, 10), activa: true,
    };
  }
  return {
    titulo: noticia.titulo,
    categoria: noticia.categoria,
    resumen: noticia.resumen,
    contenido: noticia.contenido?.length ? noticia.contenido : [''],
    colorInicio: noticia.color_inicio,
    colorFin: noticia.color_fin,
    fechaPublicacion: noticia.fecha_publicacion,
    activa: noticia.activo,
  };
}

// Mismo criterio que HeroForm (5.2): formulario en su propio componente,
// montado con `key` distinta por noticia seleccionada — el estado se reinicia
// solo, sin useEffect de sincronización. El aviso de éxito vive en el padre
// (mismo hallazgo real de Hero: acá también se cambia de selección al crear).
function NoticiaForm({ noticia, onGuardado, onBorrado, onAviso, aviso, adminFetch }) {
  const [form, setForm] = useState(() => formularioDesdeNoticia(noticia));
  const [archivoImg, setArchivoImg] = useState(null);
  const [archivoBanner, setArchivoBanner] = useState(null);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  function actualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function actualizarParrafo(idx, valor) {
    setForm((f) => ({ ...f, contenido: f.contenido.map((p, i) => (i === idx ? valor : p)) }));
  }

  function agregarParrafo() {
    setForm((f) => ({ ...f, contenido: [...f.contenido, ''] }));
  }

  function quitarParrafo(idx) {
    setForm((f) => ({ ...f, contenido: f.contenido.filter((_, i) => i !== idx) }));
  }

  function validar() {
    const nuevosErrores = {};
    if (!form.titulo.trim()) nuevosErrores.titulo = 'El título es obligatorio';
    if (!form.resumen.trim()) nuevosErrores.resumen = 'El resumen es obligatorio';
    if (!form.contenido.some((p) => p.trim())) nuevosErrores.contenido = 'Agrega al menos un párrafo con texto';
    if (!form.fechaPublicacion) nuevosErrores.fechaPublicacion = 'La fecha es obligatoria';
    if (!noticia && !archivoImg) nuevosErrores.img = 'La imagen principal es obligatoria';
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
      fd.append('titulo', form.titulo);
      fd.append('categoria', form.categoria);
      fd.append('resumen', form.resumen);
      fd.append('contenido', JSON.stringify(form.contenido.filter((p) => p.trim())));
      fd.append('color_inicio', form.colorInicio);
      fd.append('color_fin', form.colorFin);
      fd.append('fecha_publicacion', form.fechaPublicacion);
      if (noticia) fd.append('activo', String(form.activa));
      if (archivoImg) fd.append('img', archivoImg);
      if (archivoBanner) fd.append('banner', archivoBanner);

      if (noticia) {
        const data = await adminFetch(`/api/admin/noticias/${noticia.id}`, { method: 'PATCH', body: fd });
        onGuardado(data.noticia, false);
        onAviso('Cambios guardados.');
      } else {
        const data = await adminFetch('/api/admin/noticias', { method: 'POST', body: fd });
        onGuardado(data.noticia, true);
        onAviso('Noticia creada.');
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
      await adminFetch(`/api/admin/noticias/${noticia.id}`, { method: 'DELETE' });
      onBorrado();
      onAviso('Noticia borrada.');
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
        <h2 className="noticias-form-titulo">{noticia ? 'Editar noticia' : '+ Crear nueva noticia'}</h2>

        {noticia && (
          <div className="admin-form-top">
            <Checkbox
              label="Noticia visible en el sitio (activa)"
              checked={form.activa}
              onChange={(e) => actualizarCampo('activa', e.target.checked)}
            />
          </div>
        )}
        {noticia && <p className="noticias-slug">URL: /noticias/{noticia.slug}</p>}

        <FormField label="Título" error={errores.titulo}>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => actualizarCampo('titulo', e.target.value)}
            className={errores.titulo ? 'invalido' : ''}
          />
        </FormField>

        <div className="admin-field-fila">
          <FormField label="Categoría">
            <select value={form.categoria} onChange={(e) => actualizarCampo('categoria', e.target.value)}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Fecha de publicación" error={errores.fechaPublicacion}>
            <input
              type="date"
              value={form.fechaPublicacion}
              onChange={(e) => actualizarCampo('fechaPublicacion', e.target.value)}
              className={errores.fechaPublicacion ? 'invalido' : ''}
            />
          </FormField>
        </div>

        <FormField label="Resumen" hint="se muestra en las tarjetas de vista previa" error={errores.resumen}>
          <textarea
            value={form.resumen}
            onChange={(e) => actualizarCampo('resumen', e.target.value)}
            className={errores.resumen ? 'invalido' : ''}
          />
        </FormField>

        <div className="noticias-contenido">
          <p className="admin-field-label-texto">Contenido (párrafo por párrafo)</p>
          {errores.contenido && <span className="admin-field-error" role="alert">{errores.contenido}</span>}
          {form.contenido.map((parrafo, idx) => (
            <div className="noticias-parrafo-fila" key={idx}>
              <textarea
                value={parrafo}
                onChange={(e) => actualizarParrafo(idx, e.target.value)}
                placeholder={`Párrafo ${idx + 1}`}
              />
              <button type="button" className="admin-fila-quitar" onClick={() => quitarParrafo(idx)} aria-label="Quitar párrafo">×</button>
            </div>
          ))}
          <Button type="button" variant="secundario" onClick={agregarParrafo}>+ Agregar párrafo</Button>
        </div>

        <div className="admin-field-fila">
          <FormField label="Color de inicio" hint="degradado del fondo">
            <input type="color" value={form.colorInicio} onChange={(e) => actualizarCampo('colorInicio', e.target.value)} />
          </FormField>
          <FormField label="Color de fin" hint="degradado del fondo">
            <input type="color" value={form.colorFin} onChange={(e) => actualizarCampo('colorFin', e.target.value)} />
          </FormField>
        </div>

        <div className="admin-field-fila">
          <ImageUploadField
            label="Imagen principal"
            recomendado="1200×675px, 16:9"
            aspecto={16 / 9}
            valorActual={noticia?.img}
            archivo={archivoImg}
            onChange={setArchivoImg}
            error={errores.img}
            requerido={!noticia}
          />
          <ImageUploadField
            label="Imagen de banner"
            hint="opcional"
            recomendado="1200×675px, 16:9"
            aspecto={16 / 9}
            valorActual={noticia?.banner}
            archivo={archivoBanner}
            onChange={setArchivoBanner}
          />
        </div>

        {errorGeneral && <p className="admin-page-error">{errorGeneral}</p>}

        {aviso && (
          <p className="admin-form-aviso" role="status">
            <span aria-hidden="true">✓</span> {aviso}
          </p>
        )}

        <div className="admin-form-acciones">
          <Button type="submit" className="admin-btn-ancho" disabled={guardando}>
            {guardando ? 'Guardando…' : noticia ? 'Guardar cambios' : 'Crear noticia'}
          </Button>
          {noticia && (
            <Button type="button" variant="peligro" onClick={() => setConfirmandoBorrar(true)} disabled={guardando}>
              Borrar noticia
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        abierto={confirmandoBorrar}
        titulo="¿Borrar esta noticia?"
        mensaje={`Se va a borrar "${noticia?.titulo}" del sitio. Esta acción no se puede deshacer.`}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setConfirmandoBorrar(false)}
        confirmando={borrando}
      />
    </Card>
  );
}

export default function Noticias() {
  const { adminFetch } = useAdminAuth();
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState(undefined); // undefined = ninguna, null = "nueva"
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const formPanelRef = useScrollAlSeleccionar(seleccionadoId, !cargando);

  const noticiaSeleccionada = noticias.find((n) => n.id === seleccionadoId) || null;

  const cargarNoticias = useCallback((cancelObj) => {
    adminFetch('/api/admin/noticias')
      .then((data) => { if (!cancelObj?.cancelado) { setNoticias(data.noticias); setErrorCarga(''); } })
      .catch((err) => { if (!cancelObj?.cancelado) setErrorCarga(err.message); })
      .finally(() => { if (!cancelObj?.cancelado) setCargando(false); });
  }, [adminFetch]);

  useEffect(() => {
    const cancelObj = { cancelado: false };
    cargarNoticias(cancelObj);
    return () => { cancelObj.cancelado = true; };
  }, [cargarNoticias]);

  const noticiasFiltradas = useMemo(() => {
    return noticias.filter((n) => {
      const coincideTexto = n.titulo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = filtroCategoria === 'todas' || n.categoria === filtroCategoria;
      return coincideTexto && coincideCategoria;
    });
  }, [noticias, busqueda, filtroCategoria]);

  function seleccionar(id) {
    setSeleccionadoId(id);
    setAviso('');
  }

  // ⭐ Ajuste 2026-08-15 (pedido del usuario, mismo criterio que Hero.jsx): el
  // aviso se dibuja pegado a los botones de acción en vez de arriba de la
  // página, y se autodescarta solo tras un rato en vez de quedarse ahí.
  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(timer);
  }, [aviso]);

  function manejarGuardado(noticiaGuardada, esNueva) {
    setNoticias((prev) => (esNueva ? [noticiaGuardada, ...prev] : prev.map((n) => (n.id === noticiaGuardada.id ? noticiaGuardada : n))));
    if (esNueva) setSeleccionadoId(noticiaGuardada.id);
  }

  function manejarBorrado() {
    setNoticias((prev) => prev.filter((n) => n.id !== seleccionadoId));
    setSeleccionadoId(undefined);
  }

  return (
    <AdminLayout>
      <div className="noticias-panel-header">
        <div className="noticias-panel-header-textos">
          <h1 className="admin-page-titulo">Gestión de Noticias</h1>
          <p className="admin-page-sub">Crea, edita y filtra las noticias del sitio libremente.</p>
        </div>
        <Button onClick={() => seleccionar(null)}>+ Nueva noticia</Button>
      </div>

      {cargando && <p>Cargando…</p>}
      {errorCarga && (
        <p className="admin-page-error">
          No se pudo cargar: {errorCarga}{' '}
          <button onClick={() => { setCargando(true); cargarNoticias(); }}>Reintentar</button>
        </p>
      )}

      {!cargando && !errorCarga && (
        <>
          <div className="noticias-layout">
            <div className="noticias-lista-panel">
              <div className="noticias-filtros">
                <input
                  type="text"
                  placeholder="🔎 Buscar por título…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                  <option value="todas">Todas las categorías</option>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <p className="noticias-contador">Noticias encontradas ({noticiasFiltradas.length})</p>

              {noticiasFiltradas.length === 0 && (
                <p className="noticias-vacio">No hay noticias que coincidan con los filtros.</p>
              )}

              <div className="noticias-panel-lista">
                {noticiasFiltradas.map((n) => (
                  <button
                    key={n.id}
                    className={`noticias-item${n.id === seleccionadoId ? ' activo' : ''}`}
                    onClick={() => seleccionar(n.id)}
                  >
                    <span className="noticias-item-titulo">{n.titulo}</span>
                    <span className="noticias-item-meta">
                      {n.categoria} · {n.fecha_publicacion}
                      {!n.activo && <span className="admin-inactivo-tag"> (oculta)</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="noticias-form-panel" ref={formPanelRef}>
              {seleccionadoId !== undefined && (
                <NoticiaForm
                  key={seleccionadoId ?? 'nueva'}
                  noticia={noticiaSeleccionada}
                  adminFetch={adminFetch}
                  onGuardado={manejarGuardado}
                  onBorrado={manejarBorrado}
                  onAviso={setAviso}
                  aviso={aviso}
                />
              )}
              {seleccionadoId === undefined && (
                <Card className="noticias-form-vacio">
                  {aviso ? (
                    <p className="admin-form-aviso" role="status">
                      <span aria-hidden="true">✓</span> {aviso}
                    </p>
                  ) : (
                    <p>Selecciona una noticia de la lista para editarla, o crea una nueva.</p>
                  )}
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
