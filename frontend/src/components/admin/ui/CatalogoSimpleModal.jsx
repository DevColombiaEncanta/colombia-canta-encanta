import { useEffect, useRef, useState } from 'react';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';
import HelpTooltip from './HelpTooltip';

// 5.4 · Panel compacto reutilizable para "catálogos simples" (nombre único +
// activo, con emoji/orden opcionales por tabla) — Colecciones y Categorías de
// Productos hoy, Niveles (5.5) más adelante con las mismas 4 rutas de
// `lib/tablaSimpleRouter.js` del lado del backend. Decisión con el usuario:
// en vez de 2-3 pantallas casi idénticas con su propia entrada en el menú
// lateral, este panel se abre desde un botón junto al selector que lo usa
// (ej. "Colección" en el formulario de Producto), edita en línea, y al
// cerrar le devuelve al padre la lista ya actualizada (no hace falta que el
// padre vuelva a pedirla aparte).
//
// Cada fila se guarda de forma independiente (igual que cada experiencia fija
// en EventosFijos.jsx) — no hay un "Guardar todo" al final, cada POST/PATCH/
// DELETE es su propia llamada real, con su propio error si algo falla (ej.
// nombre duplicado, o borrar algo que un producto todavía usa).
function filaDesdeBackend(row) {
  return { id: row.id, nombre: row.nombre, emoji: row.emoji || '', orden: row.orden ?? 0, activo: row.activo, guardando: false, error: '', esNueva: false };
}

function filaVacia(ordenSugerido) {
  return { id: null, nombre: '', emoji: '', orden: ordenSugerido, activo: true, guardando: false, error: '', esNueva: true };
}

export default function CatalogoSimpleModal({ titulo, endpoint, etiqueta, descripcion, conEmoji = false, conOrden = false, conActivo = true, adminFetch, onCerrar }) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [pendienteBorrar, setPendienteBorrar] = useState(null); // { idx, id, nombre } | null
  const [borrando, setBorrando] = useState(false);
  const cerrarRef = useRef(null);

  useEffect(() => {
    cerrarRef.current?.focus();
  }, []);

  function manejarTecla(e) {
    if (e.key === 'Escape' && !pendienteBorrar) cerrar();
  }

  // ⭐ Hallazgo real (5.5, 2026-08-18, reproducido con Playwright): sin guardia
  // contra respuestas fuera de orden, el doble montaje de StrictMode dispara 2
  // GET en paralelo — si el de la primera pasada (ya "limpiada") resuelve
  // DESPUÉS del segundo, su `setFilas` pisaba en silencio cualquier fila
  // creada/guardada mientras tanto con una foto vieja de la lista. Mismo
  // patrón `cancelObj` ya usado en Eventos.jsx/Productos.jsx para esto mismo.
  async function cargar(cancelObj) {
    setCargando(true);
    setErrorCarga('');
    try {
      const data = await adminFetch(endpoint);
      if (cancelObj?.cancelado) return;
      setFilas(data.data.map(filaDesdeBackend));
    } catch (err) {
      if (!cancelObj?.cancelado) setErrorCarga(err.message);
    } finally {
      if (!cancelObj?.cancelado) setCargando(false);
    }
  }

  useEffect(() => {
    const cancelObj = { cancelado: false };
    cargar(cancelObj);
    return () => { cancelObj.cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  function actualizarFila(idx, campo, valor) {
    setFilas((prev) => prev.map((f, i) => (i === idx ? { ...f, [campo]: valor } : f)));
  }

  function agregarFila() {
    const ordenMax = filas.reduce((max, f) => Math.max(max, Number(f.orden) || 0), -1);
    setFilas((prev) => [...prev, filaVacia(ordenMax + 1)]);
  }

  async function guardarFila(idx) {
    const fila = filas[idx];
    if (!fila.nombre.trim()) {
      actualizarFila(idx, 'error', 'El nombre es obligatorio');
      return;
    }
    actualizarFila(idx, 'guardando', true);
    actualizarFila(idx, 'error', '');

    // ⭐ Hallazgo real (2026-08-17, reportado por el usuario): el checkbox
    // "activa" cambiaba el estado local pero nunca se mandaba en el PATCH —
    // desmarcar y guardar no tenía ningún efecto real en el servidor.
    const body = { nombre: fila.nombre.trim() };
    if (conActivo) body.activo = fila.activo;
    if (conEmoji) body.emoji = fila.emoji;
    if (conOrden) body.orden = Number(fila.orden) || 0;

    try {
      const data = fila.esNueva
        ? await adminFetch(endpoint, { method: 'POST', body })
        : await adminFetch(`${endpoint}/${fila.id}`, { method: 'PATCH', body });
      setFilas((prev) => prev.map((f, i) => (i === idx ? filaDesdeBackend(data.data) : f)));
    } catch (err) {
      setFilas((prev) => prev.map((f, i) => (i === idx ? { ...f, guardando: false, error: err.message } : f)));
    }
  }

  function pedirBorrar(idx) {
    const fila = filas[idx];
    if (fila.esNueva) {
      // Fila todavía sin guardar — quitarla no borra nada real, no hace falta confirmar.
      setFilas((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    setPendienteBorrar({ idx, id: fila.id, nombre: fila.nombre });
  }

  async function confirmarBorrado() {
    setBorrando(true);
    const { idx, id } = pendienteBorrar;
    try {
      await adminFetch(`${endpoint}/${id}`, { method: 'DELETE' });
      setFilas((prev) => prev.filter((_, i) => i !== idx));
      setPendienteBorrar(null);
    } catch (err) {
      setFilas((prev) => prev.map((f, i) => (i === idx ? { ...f, error: err.message } : f)));
      setPendienteBorrar(null);
    } finally {
      setBorrando(false);
    }
  }

  // Al cerrar, se vuelve a pedir la lista real (no la copia local, que puede
  // tener filas nuevas nunca guardadas) — el padre recibe exactamente lo que
  // quedó persistido, sin tener que pedirla de nuevo por su cuenta.
  async function cerrar() {
    try {
      const data = await adminFetch(endpoint);
      onCerrar(data.data);
    } catch {
      onCerrar(filas.filter((f) => !f.esNueva).map(({ id, nombre, emoji, orden, activo }) => ({ id, nombre, emoji, orden, activo })));
    }
  }

  return (
    <div className="admin-dialog-fondo" onClick={cerrar}>
      <div
        className="admin-dialog catalogo-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalogo-dialog-titulo"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={manejarTecla}
      >
        <h3 id="catalogo-dialog-titulo">
          {titulo}
          {descripcion && <HelpTooltip texto={descripcion} ejemplo={conOrden ? '"orden" define en qué posición aparece cada una — 0 es la primera.' : undefined} />}
        </h3>

        {cargando && <p>Cargando…</p>}
        {errorCarga && <p className="admin-page-error">No se pudo cargar: {errorCarga}</p>}

        {!cargando && !errorCarga && (
          <div className="catalogo-lista">
            {filas.length === 0 && <p className="catalogo-vacio">Todavía no hay ninguna.</p>}
            {filas.map((f, idx) => (
              <div className="catalogo-fila" key={f.id ?? `nueva-${idx}`}>
                <div className="catalogo-fila-campos">
                  {conEmoji && (
                    <input
                      type="text"
                      className="catalogo-emoji"
                      maxLength={4}
                      aria-label="Emoji"
                      value={f.emoji}
                      onChange={(e) => actualizarFila(idx, 'emoji', e.target.value)}
                    />
                  )}
                  <input
                    type="text"
                    className="catalogo-nombre"
                    aria-label="Nombre"
                    placeholder={`Nombre de la ${etiqueta}`}
                    value={f.nombre}
                    onChange={(e) => actualizarFila(idx, 'nombre', e.target.value)}
                  />
                  {conOrden && (
                    <input
                      type="number"
                      className="catalogo-orden"
                      aria-label="Orden"
                      value={f.orden}
                      onChange={(e) => actualizarFila(idx, 'orden', e.target.value)}
                    />
                  )}
                  {conActivo && (
                    <label className="catalogo-activo">
                      <input type="checkbox" checked={f.activo} onChange={(e) => actualizarFila(idx, 'activo', e.target.checked)} disabled={f.esNueva} />
                      activa
                    </label>
                  )}
                </div>
                <div className="catalogo-fila-acciones">
                  <Button type="button" variant="secundario" onClick={() => guardarFila(idx)} disabled={f.guardando}>
                    {f.guardando ? 'Guardando…' : 'Guardar'}
                  </Button>
                  <button type="button" className="admin-fila-quitar" onClick={() => pedirBorrar(idx)} aria-label={`Borrar ${f.nombre || 'esta fila'}`}>×</button>
                </div>
                {f.error && <span className="admin-field-error" role="alert">{f.error}</span>}
              </div>
            ))}
            <Button type="button" variant="secundario" onClick={agregarFila}>+ Agregar</Button>
          </div>
        )}

        <div className="admin-dialog-acciones">
          <Button ref={cerrarRef} type="button" onClick={cerrar}>Listo</Button>
        </div>
      </div>

      {pendienteBorrar && (
        <ConfirmDialog
          abierto={!!pendienteBorrar}
          titulo={`¿Borrar esta ${etiqueta}?`}
          // ⭐ Hallazgo real (auditoría 5.5, 2026-08-19): decía "productos" a
          // secas, escrito cuando este panel solo servía a Colecciones/
          // Categorías (5.4) — reutilizado tal cual para Niveles (5.5), donde
          // lo que en verdad la usa son Cursos, no Productos. Genérico ahora,
          // válido para cualquier tabla que use este componente en el futuro.
          advertencia={`Puede haber otros registros usando esta ${etiqueta} en este momento.`}
          mensaje={`Se va a borrar "${pendienteBorrar.nombre}" de forma permanente. Si algo todavía la usa, el borrado se va a rechazar.`}
          onConfirmar={confirmarBorrado}
          onCancelar={() => setPendienteBorrar(null)}
          confirmando={borrando}
        />
      )}
    </div>
  );
}
