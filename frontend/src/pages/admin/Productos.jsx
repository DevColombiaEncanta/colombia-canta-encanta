import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useListaDinamica } from '../../hooks/useListaDinamica';
import { useScrollAlSeleccionar } from '../../hooks/useScrollAlSeleccionar';
import { formatCOP, soloDigitos, formatMiles } from '../../utils/formato';
import AdminLayout from '../../components/admin/ui/AdminLayout';
import Card from '../../components/admin/ui/Card';
import FormField from '../../components/admin/ui/FormField';
import Checkbox from '../../components/admin/ui/Checkbox';
import Button from '../../components/admin/ui/Button';
import HelpTooltip from '../../components/admin/ui/HelpTooltip';
import GaleriaUploadField from '../../components/admin/ui/GaleriaUploadField';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import CatalogoSimpleModal from '../../components/admin/ui/CatalogoSimpleModal';
import './Productos.css';

const ASPECTO_IMAGEN = 1; // 1:1, decisión ya tomada en el CSS público (tarjeta y modal de la Tienda)
const MAX_IMAGENES = 6; // mismo tope que el backend (uploadMiddleware.array('imagenes', 6))
const TALLAS_PREDEFINIDAS = ['S', 'M', 'L', 'XL', 'XXL'];
const LIMITE_TAG = 20; // es una badge chiquita sobre la tarjeta (ver Tienda.jsx), no un texto largo

function limpiarEntero(digitos) {
  if (digitos === '' || digitos === null || digitos === undefined) return '';
  return String(Number(digitos));
}

// Colores por defecto para un producto nuevo — cualquier par de colores del
// diseño ya usado en el sitio, el admin los cambia si quiere.
const BG_INICIO_DEFAULT = '#E8341A';
const BG_FIN_DEFAULT = '#1A56DB';

// `bg` se guarda como un solo texto (`productos.bg`, decidido en Fase 1.4) —
// pero los ~26 productos reales de referencia usan siempre el mismo formato
// exacto: `linear-gradient(135deg, #COLOR1, #COLOR2)` (confirmado leyendo el
// catálogo real recuperado de git, ver pre-análisis 5.4 en readme_guia.md).
// El panel edita esto como 2 selectores de color en vez de texto libre —
// mismo criterio que el precio compuesto de Eventos, pero más simple: acá los
// 2 colores viven en su propio estado (no se re-parsean desde el string
// compuesto en cada tecleo), así que no hay riesgo de repetir el bug de
// redondeo que tuvo el precio de Eventos (ver auditoría 5.3).
function coloresDesdeBg(bg) {
  const encontrados = bg?.match(/#[0-9a-fA-F]{6}/g);
  if (encontrados?.length >= 2) return { inicio: encontrados[0], fin: encontrados[1] };
  return { inicio: BG_INICIO_DEFAULT, fin: BG_FIN_DEFAULT };
}

function componerBg(inicio, fin) {
  return `linear-gradient(135deg, ${inicio}, ${fin})`;
}

function varianteVacia() {
  // stock arranca en '' (no 0): el 5.4 segunda ronda pide que el stock sea
  // obligatorio de llenar a mano, incluso si el valor final es 0 — un default
  // silencioso no cuenta como "lo llenó el admin".
  return { talla: '', tallaOtra: false, color_nombre: '', color_hex: '#000000', stock: '' };
}

// Producto público asume SIEMPRE al menos 1 fila en `producto_variantes` para
// calcular `en_stock` (ver ProductoModal.jsx) — un producto nuevo arranca con
// 1 fila ya puesta, no en 0 (ver pre-análisis 5.4).
function variantesDesdeProducto(producto) {
  if (!producto?.variantes?.length) return [varianteVacia()];
  return producto.variantes.map((v) => ({
    talla: v.talla || '',
    // `tallaOtra` es solo de UI (no se manda al backend, ver guardar()) — si
    // el producto ya tenía una talla que no está en la lista predefinida
    // (dato viejo o cargado por script), el selector arranca en modo "Otra".
    tallaOtra: !!(v.talla && !TALLAS_PREDEFINIDAS.includes(v.talla)),
    color_nombre: v.color_nombre || '',
    color_hex: v.color_hex || '#000000',
    stock: String(v.stock ?? ''),
  }));
}

function formularioDesdeProducto(producto) {
  if (!producto) {
    return { nombre: '', descripcion: '', precio: '', coleccionId: '', categoriaId: '', tag: '', emoji: '', activo: true };
  }
  return {
    nombre: producto.nombre,
    descripcion: producto.descripcion || '',
    precio: String(producto.precio ?? ''),
    coleccionId: producto.coleccion_id || '',
    categoriaId: producto.categoria_id || '',
    tag: producto.tag || '',
    emoji: producto.emoji || '',
    activo: producto.activo,
  };
}

function ProductoForm({ producto, colecciones, categorias, onGuardado, onBorrado, onAviso, aviso, adminFetch, onAbrirCatalogo }) {
  const [form, setForm] = useState(() => formularioDesdeProducto(producto));
  const [bgInicio, setBgInicio] = useState(() => coloresDesdeBg(producto?.bg).inicio);
  const [bgFin, setBgFin] = useState(() => coloresDesdeBg(producto?.bg).fin);
  const [archivosGaleria, setArchivosGaleria] = useState([]);
  const [imagenesABorrar, setImagenesABorrar] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const variantes = useListaDinamica(variantesDesdeProducto(producto));

  function actualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function validar() {
    const nuevosErrores = {};
    if (!form.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio';
    if (!form.precio || Number(form.precio) <= 0) nuevosErrores.precio = 'El precio es obligatorio y debe ser mayor a 0';
    if (!form.coleccionId) nuevosErrores.coleccionId = 'Selecciona una colección';
    if (!form.categoriaId) nuevosErrores.categoriaId = 'Selecciona una categoría';
    // ⭐ Regla real encontrada en ProductoModal.jsx (sitio público, no estaba
    // en la guía de diseño): sin ninguna fila en `producto_variantes` el
    // producto queda "agotado" para siempre, sin forma de cargarle stock
    // después — no hace falta que talla/color estén completos, pero tiene
    // que haber al menos 1 fila.
    if (variantes.items.length === 0) {
      nuevosErrores.variantes = 'Necesita al menos 1 fila de variante (puedes dejar talla y color vacíos, pero hace falta alguna para poder cargar el stock)';
    }

    // Punto 17 (5.4 tercera ronda, pedido explícito del usuario): la imagen
    // pasa a ser obligatoria — cuenta lo que quede de la galería existente
    // (menos lo marcado para borrar) más las fotos nuevas todavía no subidas.
    const totalFotosFinal = (producto?.imagenes?.length || 0) - imagenesABorrar.length + archivosGaleria.length;
    if (totalFotosFinal <= 0) {
      nuevosErrores.imagenes = 'El producto necesita al menos 1 foto';
    }

    // Punto 10 (5.4 segunda ronda): el stock ya no tiene default silencioso —
    // cada fila lo tiene que llenar el admin a mano (0 es un valor válido, en
    // blanco no).
    const erroresStock = {};
    variantes.items.forEach((v, idx) => {
      if (v.stock === '') erroresStock[idx] = 'El stock es obligatorio (puede ser 0)';
    });
    if (Object.keys(erroresStock).length > 0) nuevosErrores.variantesStock = erroresStock;

    // Punto 11: si el producto usa tallas, no se puede mezclar filas con y sin
    // talla — es justo la mezcla que rompía el selector de tallas en la
    // Tienda pública (ver ProductoModal.jsx, tallaTieneStock/colorTieneStock).
    const algunaFilaConTalla = variantes.items.some((v) => v.talla.trim());
    if (algunaFilaConTalla) {
      const erroresTalla = {};
      variantes.items.forEach((v, idx) => {
        if (!v.talla.trim()) erroresTalla[idx] = 'Si el producto usa tallas, completa la talla en todas las filas';
      });
      if (Object.keys(erroresTalla).length > 0) nuevosErrores.variantesTalla = erroresTalla;
    }

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
      fd.append('nombre', form.nombre);
      if (form.descripcion) fd.append('descripcion', form.descripcion);
      fd.append('precio', form.precio);
      fd.append('coleccion_id', form.coleccionId);
      fd.append('categoria_id', form.categoriaId);
      if (form.tag) fd.append('tag', form.tag);
      if (form.emoji) fd.append('emoji', form.emoji);
      fd.append('bg', componerBg(bgInicio, bgFin));
      if (producto) fd.append('activo', String(form.activo));

      fd.append('variantes', JSON.stringify(variantes.items.map((v) => ({
        talla: v.talla.trim(),
        color_nombre: v.color_nombre.trim(),
        color_hex: v.color_hex,
        stock: Number(v.stock), // validar() ya garantiza que no llega vacío
      }))));

      archivosGaleria.forEach((archivo) => fd.append('imagenes', archivo));
      if (producto && imagenesABorrar.length > 0) fd.append('imagenesEliminar', JSON.stringify(imagenesABorrar));

      if (producto) {
        const data = await adminFetch(`/api/admin/productos/${producto.id}`, { method: 'PATCH', body: fd });
        onGuardado(data.data, false);
        onAviso('Cambios guardados.');
      } else {
        const data = await adminFetch('/api/admin/productos', { method: 'POST', body: fd });
        onGuardado(data.data, true);
        onAviso('Producto creado.');
      }
      // Bug real encontrado en 5.4 tercera ronda: este formulario NO se
      // remonta entre un guardado y el siguiente (misma `key={seleccionadoId}`
      // en Productos()) — sin este reseteo, un archivo ya subido se quedaba en
      // `archivosGaleria` y se volvía a mandar (duplicado) en el próximo
      // guardado si el admin seguía editando el mismo producto sin salir del
      // formulario.
      setArchivosGaleria([]);
      setImagenesABorrar([]);
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    setBorrando(true);
    try {
      await adminFetch(`/api/admin/productos/${producto.id}`, { method: 'DELETE' });
      onBorrado();
      onAviso('Producto borrado.');
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
        <h2 className="prod-form-titulo">{producto ? 'Editar producto' : '+ Crear nuevo producto'}</h2>

        {producto && (
          <div className="admin-form-top">
            <Checkbox
              label="Producto visible en la tienda (activo)"
              checked={form.activo}
              onChange={(e) => actualizarCampo('activo', e.target.checked)}
            />
          </div>
        )}

        <FormField label="Nombre" error={errores.nombre}>
          <input type="text" value={form.nombre} onChange={(e) => actualizarCampo('nombre', e.target.value)} className={errores.nombre ? 'invalido' : ''} />
        </FormField>

        <FormField label="Descripción" hint="opcional">
          <textarea value={form.descripcion} onChange={(e) => actualizarCampo('descripcion', e.target.value)} />
        </FormField>

        <div className="admin-field-fila">
          <FormField label="Precio" hint="pesos colombianos, solo números" error={errores.precio}>
            <input
              type="text"
              inputMode="numeric"
              value={formatMiles(form.precio)}
              onChange={(e) => actualizarCampo('precio', soloDigitos(e.target.value))}
              className={errores.precio ? 'invalido' : ''}
            />
          </FormField>
          <FormField label="Etiqueta" hint={`opcional, ej. "Nuevo" · ${form.tag.length}/${LIMITE_TAG}`}>
            <input type="text" maxLength={LIMITE_TAG} value={form.tag} onChange={(e) => actualizarCampo('tag', e.target.value)} />
          </FormField>
        </div>

        <div className="admin-field-fila">
          {/* ⭐ Pedido del usuario (2026-08-17): crear una Colección es demasiado
             relevante como para vivir "de paso" adentro del formulario de
             Producto — se saca a un botón propio en el encabezado de la
             página (ver Productos()), antes de cargar cualquier producto.
             Categoría sí se queda acá, confirmado explícitamente. */}
          <FormField
            label="Colección"
            error={errores.coleccionId}
            hint={colecciones.length === 0 ? 'todavía no hay ninguna — usa "+ Colección" arriba' : undefined}
          >
            <select value={form.coleccionId} onChange={(e) => actualizarCampo('coleccionId', e.target.value)} className={errores.coleccionId ? 'invalido' : ''}>
              <option value="">Selecciona una colección</option>
              {colecciones.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}{!c.activo ? ' (inactiva)' : ''}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Categoría" error={errores.categoriaId}>
            <div className="prod-selector-fila">
              <select value={form.categoriaId} onChange={(e) => actualizarCampo('categoriaId', e.target.value)} className={errores.categoriaId ? 'invalido' : ''}>
                <option value="">Selecciona una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}{!c.activo ? ' (inactiva)' : ''}</option>
                ))}
              </select>
              <Button type="button" variant="secundario" onClick={() => onAbrirCatalogo('categorias')}>+ Categoría</Button>
            </div>
          </FormField>
        </div>

        {/* ── Respaldo visual (sin foto todavía) ── */}
        <h3 className="prod-seccion-titulo">
          Respaldo visual
          <HelpTooltip
            texto="Este degradado es el fondo detrás de la foto en la tarjeta de la tienda, en el modal de detalle y en el carrito. Mientras el producto no tenga ninguna foto subida, es lo único que se ve (junto con el emoji) — apenas subes la primera foto, queda tapado."
            ejemplo="ej. rojo a azul, como usa el resto de productos de referencia"
          />
        </h3>
        <p className="prod-seccion-nota">Se ve mientras el producto no tenga ninguna foto subida (tarjeta, modal y carrito).</p>
        <div className="admin-field-fila">
          <FormField label="Fondo (degradado)">
            <div className="prod-bg-fila">
              <input type="color" aria-label="Color inicial" value={bgInicio} onChange={(e) => setBgInicio(e.target.value)} />
              <input type="color" aria-label="Color final" value={bgFin} onChange={(e) => setBgFin(e.target.value)} />
              <div className="prod-bg-preview" style={{ background: componerBg(bgInicio, bgFin) }} />
            </div>
          </FormField>
          <FormField label="Emoji" hint="opcional">
            <input type="text" maxLength={4} value={form.emoji} onChange={(e) => actualizarCampo('emoji', e.target.value)} />
          </FormField>
        </div>

        {/* ── Imágenes ── */}
        <h3 className="prod-seccion-titulo">
          Imágenes
          {errores.imagenes && <span className="admin-field-error" role="alert"> — {errores.imagenes}</span>}
        </h3>
        <GaleriaUploadField
          label="Fotos del producto"
          recomendado="cuadrada, ideal 1000×1000px"
          aspecto={ASPECTO_IMAGEN}
          max={MAX_IMAGENES}
          valorActual={producto?.imagenes}
          imagenesABorrar={imagenesABorrar}
          onEliminarExistente={(url) => setImagenesABorrar((prev) => [...prev, url])}
          archivos={archivosGaleria}
          onChange={setArchivosGaleria}
        />

        {/* ── Variantes (talla / color / stock) ── */}
        <h3 className="prod-seccion-titulo">
          Tallas, colores y stock
          {errores.variantes && <span className="admin-field-error" role="alert"> — {errores.variantes}</span>}
        </h3>
        <div className="prod-variantes">
          {variantes.items.map((v, idx) => {
            const errorFila = errores.variantesTalla?.[idx] || errores.variantesStock?.[idx];
            return (
              <div key={idx}>
                <div className="prod-variante-fila">
                  <div className="prod-variante-talla">
                    <select
                      aria-label="Talla"
                      aria-invalid={!!errores.variantesTalla?.[idx]}
                      value={v.tallaOtra ? 'otra' : v.talla}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'otra') {
                          variantes.actualizar(idx, 'tallaOtra', true);
                          variantes.actualizar(idx, 'talla', '');
                        } else {
                          variantes.actualizar(idx, 'tallaOtra', false);
                          variantes.actualizar(idx, 'talla', val);
                        }
                      }}
                      className={errores.variantesTalla?.[idx] ? 'invalido' : ''}
                    >
                      <option value="">Sin talla</option>
                      {TALLAS_PREDEFINIDAS.map((t) => <option key={t} value={t}>{t}</option>)}
                      <option value="otra">Otra…</option>
                    </select>
                    {v.tallaOtra && (
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="Escribe la talla"
                        aria-label="Talla personalizada"
                        value={v.talla}
                        onChange={(e) => variantes.actualizar(idx, 'talla', e.target.value)}
                        className={errores.variantesTalla?.[idx] ? 'invalido' : ''}
                      />
                    )}
                  </div>
                  <input type="text" maxLength={20} placeholder="Color (opcional)" aria-label="Nombre del color" value={v.color_nombre} onChange={(e) => variantes.actualizar(idx, 'color_nombre', e.target.value)} />
                  <input type="color" aria-label="Color (muestra)" value={v.color_hex} onChange={(e) => variantes.actualizar(idx, 'color_hex', e.target.value)} />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Stock"
                    aria-label="Stock"
                    aria-invalid={!!errores.variantesStock?.[idx]}
                    value={limpiarEntero(v.stock)}
                    onChange={(e) => variantes.actualizar(idx, 'stock', soloDigitos(e.target.value))}
                    className={errores.variantesStock?.[idx] ? 'invalido' : ''}
                  />
                  <button type="button" className="admin-fila-quitar" onClick={() => variantes.quitar(idx)} aria-label={`Quitar variante ${idx + 1}`}>×</button>
                </div>
                {errorFila && <span className="admin-field-error" role="alert">{errorFila}</span>}
              </div>
            );
          })}
          <Button type="button" variant="secundario" onClick={() => variantes.agregar(varianteVacia())}>+ Agregar variante</Button>
        </div>

        {errorGeneral && <p className="admin-page-error">{errorGeneral}</p>}

        {aviso && (
          <p className="admin-form-aviso" role="status">
            <span aria-hidden="true">✓</span> {aviso}
          </p>
        )}

        <div className="admin-form-acciones">
          <Button type="submit" className="admin-btn-ancho" disabled={guardando}>
            {guardando ? 'Guardando…' : producto ? 'Guardar cambios' : 'Crear producto'}
          </Button>
          {producto && (
            <Button type="button" variant="peligro" onClick={() => setConfirmandoBorrar(true)} disabled={guardando}>
              Borrar producto
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        abierto={confirmandoBorrar}
        titulo="¿Borrar este producto?"
        mensaje={`Se va a borrar "${producto?.nombre}" de la tienda. Esta acción no se puede deshacer.`}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setConfirmandoBorrar(false)}
        confirmando={borrando}
      />
    </Card>
  );
}

export default function Productos() {
  const { adminFetch } = useAdminAuth();
  const [productos, setProductos] = useState([]);
  const [colecciones, setColecciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState(undefined); // undefined = ninguno, null = "nuevo"
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroColeccion, setFiltroColeccion] = useState('todas');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [catalogoAbierto, setCatalogoAbierto] = useState(null); // 'colecciones' | 'categorias' | null
  const formPanelRef = useScrollAlSeleccionar(seleccionadoId, !cargando);

  const productoSeleccionado = productos.find((p) => p.id === seleccionadoId) || null;

  const cargarTodo = useCallback((cancelObj) => {
    Promise.all([
      adminFetch('/api/admin/productos'),
      adminFetch('/api/admin/colecciones'),
      adminFetch('/api/admin/categorias-producto'),
    ])
      .then(([prod, cols, cats]) => {
        if (cancelObj?.cancelado) return;
        setProductos(prod.data);
        setColecciones(cols.data);
        setCategorias(cats.data);
        setErrorCarga('');
      })
      .catch((err) => { if (!cancelObj?.cancelado) setErrorCarga(err.message); })
      .finally(() => { if (!cancelObj?.cancelado) setCargando(false); });
  }, [adminFetch]);

  useEffect(() => {
    const cancelObj = { cancelado: false };
    cargarTodo(cancelObj);
    return () => { cancelObj.cancelado = true; };
  }, [cargarTodo]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideColeccion = filtroColeccion === 'todas' || p.coleccion_id === filtroColeccion;
      const coincideCategoria = filtroCategoria === 'todas' || p.categoria_id === filtroCategoria;
      return coincideTexto && coincideColeccion && coincideCategoria;
    });
  }, [productos, busqueda, filtroColeccion, filtroCategoria]);

  function nombreColeccion(id) {
    return colecciones.find((c) => c.id === id)?.nombre || '—';
  }
  function nombreCategoria(id) {
    return categorias.find((c) => c.id === id)?.nombre || '—';
  }

  function seleccionar(id) {
    setSeleccionadoId(id);
    setAviso('');
  }

  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(timer);
  }, [aviso]);

  function manejarGuardado(productoGuardado, esNuevo) {
    setProductos((prev) => (esNuevo ? [productoGuardado, ...prev] : prev.map((p) => (p.id === productoGuardado.id ? productoGuardado : p))));
    if (esNuevo) setSeleccionadoId(productoGuardado.id);
  }

  function manejarBorrado() {
    setProductos((prev) => prev.filter((p) => p.id !== seleccionadoId));
    setSeleccionadoId(undefined);
  }

  return (
    <AdminLayout>
      <div className="prod-panel-header">
        <div className="prod-panel-header-textos">
          <h1 className="admin-page-titulo">Gestión de Productos</h1>
          <p className="admin-page-sub">Crea, edita y filtra los productos de la tienda.</p>
        </div>
        <div className="prod-panel-header-acciones">
          <Button variant="secundario" onClick={() => setCatalogoAbierto('colecciones')}>+ Colección</Button>
          <Button onClick={() => seleccionar(null)}>+ Nuevo producto</Button>
        </div>
      </div>

      {cargando && <p>Cargando…</p>}
      {errorCarga && (
        <p className="admin-page-error">
          No se pudo cargar: {errorCarga}{' '}
          <button onClick={() => { setCargando(true); cargarTodo(); }}>Reintentar</button>
        </p>
      )}

      {!cargando && !errorCarga && (
        <div className="prod-layout">
          <div className="prod-lista-panel">
            <div className="prod-filtros">
              <input
                type="text"
                placeholder="🔎 Buscar por nombre…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <select value={filtroColeccion} onChange={(e) => setFiltroColeccion(e.target.value)}>
                <option value="todas">Todas las colecciones</option>
                {colecciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                <option value="todas">Todas las categorías</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <p className="prod-contador">Productos encontrados ({productosFiltrados.length})</p>

            {productosFiltrados.length === 0 && (
              <p className="prod-vacio">
                {productos.length === 0 ? 'Todavía no hay productos cargados.' : 'No hay productos que coincidan con los filtros.'}
              </p>
            )}

            <div className="prod-panel-lista">
              {productosFiltrados.map((p) => (
                <button
                  key={p.id}
                  className={`prod-item${p.id === seleccionadoId ? ' activo' : ''}${!p.activo ? ' inactivo' : ''}`}
                  onClick={() => seleccionar(p.id)}
                >
                  <div className="prod-item-thumb" style={!p.imagenes?.[0] ? { background: p.bg } : undefined}>
                    {p.imagenes?.[0] ? (
                      <img src={p.imagenes[0]} alt="" loading="lazy" />
                    ) : (
                      <span aria-hidden="true">{p.emoji || '🛍️'}</span>
                    )}
                  </div>
                  <div className="prod-item-textos">
                    <span className="prod-item-titulo">{p.nombre}</span>
                    <span className="prod-item-meta">
                      {formatCOP(p.precio)} · {nombreColeccion(p.coleccion_id)} · {nombreCategoria(p.categoria_id)}
                      {!p.activo && <span className="admin-inactivo-tag"> (oculto)</span>}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="prod-form-panel" ref={formPanelRef}>
            {seleccionadoId !== undefined && (
              <ProductoForm
                key={seleccionadoId ?? 'nuevo'}
                producto={productoSeleccionado}
                colecciones={colecciones}
                categorias={categorias}
                adminFetch={adminFetch}
                onGuardado={manejarGuardado}
                onBorrado={manejarBorrado}
                onAviso={setAviso}
                aviso={aviso}
                onAbrirCatalogo={setCatalogoAbierto}
              />
            )}
            {seleccionadoId === undefined && (
              <Card className="prod-form-vacio">
                {aviso ? (
                  <p className="admin-form-aviso" role="status">
                    <span aria-hidden="true">✓</span> {aviso}
                  </p>
                ) : (
                  <p>Selecciona un producto de la lista para editarlo, o crea uno nuevo.</p>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {catalogoAbierto === 'colecciones' && (
        <CatalogoSimpleModal
          titulo="Colecciones"
          descripcion='Las colecciones son los "drops" de mercancía (ej. Drop 1, Kit Me Enamoras) — aparecen como pestañas en la Tienda, cada producto pertenece a una.'
          endpoint="/api/admin/colecciones"
          etiqueta="colección"
          conEmoji
          conOrden
          adminFetch={adminFetch}
          onCerrar={(lista) => { setColecciones(lista); setCatalogoAbierto(null); }}
        />
      )}
      {catalogoAbierto === 'categorias' && (
        <CatalogoSimpleModal
          titulo="Categorías"
          descripcion="Las categorías agrupan productos por tipo (ej. Camisetas, Bags) — aparecen como filtro en la Tienda."
          endpoint="/api/admin/categorias-producto"
          etiqueta="categoría"
          adminFetch={adminFetch}
          onCerrar={(lista) => { setCategorias(lista); setCatalogoAbierto(null); }}
        />
      )}
    </AdminLayout>
  );
}
