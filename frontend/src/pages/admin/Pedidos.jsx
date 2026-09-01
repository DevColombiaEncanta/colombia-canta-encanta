import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useScrollAlSeleccionar } from '../../hooks/useScrollAlSeleccionar';
import AdminLayout from '../../components/admin/ui/AdminLayout';
import Card from '../../components/admin/ui/Card';
import FormField from '../../components/admin/ui/FormField';
import Button from '../../components/admin/ui/Button';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import { formatearFechaHora, formatCOP } from '../../utils/formato';
import { EMAIL_REGEX } from '../../utils/validacion';
import './Pedidos.css';

const ESTADOS = ['pendiente', 'pagado', 'cancelado', 'enviado'];

// Fecha (solo el día, para el filtro) a partir de `creado_en` — un pedido no
// tiene fecha de evento como las reservas, la fecha relevante es cuándo se hizo.
function fechaPedido(pedido) {
  return pedido.creado_en?.slice(0, 10) || null;
}

// Panel de detalle/edición, montado con `key` por pedido seleccionado (mismo
// criterio que Reservas). No hay "crear" acá: los pedidos solo llegan desde
// el formulario público del carrito (POST /api/pedidos, ver pages/Carrito.jsx).
function PedidoForm({ pedido, onGuardado, onBorrado, onAviso, aviso, adminFetch }) {
  const [nombre, setNombre] = useState(pedido.nombre);
  const [celular, setCelular] = useState(pedido.celular);
  const [email, setEmail] = useState(pedido.email);
  const [direccion, setDireccion] = useState(pedido.direccion);
  const [ciudad, setCiudad] = useState(pedido.ciudad);
  const [direccionAdicional, setDireccionAdicional] = useState(pedido.direccion_adicional || '');
  const [estado, setEstado] = useState(pedido.estado);
  const [referenciaMp, setReferenciaMp] = useState(pedido.referencia_mp || '');
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  // ⭐ Bug real (auditoría Fase 5, 2026-08-31): mismo hallazgo que en
  // Reservas.jsx — `noValidate` + `required`/`minLength` decorativos sin
  // ningún `validar()` real detrás.
  function validar() {
    const nuevosErrores = {};
    if (nombre.trim().length < 2) nuevosErrores.nombre = 'Ingresa el nombre completo';
    if (celular.trim().length < 7) nuevosErrores.celular = 'Ingresa un número de celular válido';
    if (!EMAIL_REGEX.test(email.trim())) nuevosErrores.email = 'Ingresa un correo electrónico válido';
    if (direccion.trim().length < 5) nuevosErrores.direccion = 'Ingresa una dirección de envío válida';
    if (ciudad.trim().length < 2) nuevosErrores.ciudad = 'Ingresa una ciudad válida';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function guardar(e) {
    e.preventDefault();
    if (!validar()) return;
    setGuardando(true);
    setErrorGeneral('');
    try {
      const body = {
        nombre: nombre.trim(),
        celular: celular.trim(),
        email: email.trim(),
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        direccion_adicional: direccionAdicional.trim() || null,
        estado,
        referencia_mp: referenciaMp.trim() || null,
      };
      const data = await adminFetch(`/api/admin/pedidos/${pedido.id}`, { method: 'PATCH', body });
      onGuardado(data.data);
      onAviso('Cambios guardados.');
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    setBorrando(true);
    try {
      await adminFetch(`/api/admin/pedidos/${pedido.id}`, { method: 'DELETE' });
      onBorrado();
      onAviso('Pedido borrado.');
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
        <h2 className="pedadmin-form-titulo">{pedido.nombre}</h2>
        <p className="pedadmin-form-sub">
          {formatCOP(pedido.total)} · {formatearFechaHora(pedido.creado_en)}
        </p>

        {/* ── Productos del pedido (solo lectura) ── */}
        <h3 className="pedadmin-seccion-titulo">Productos</h3>
        <div className="pedadmin-items-lista">
          {(pedido.pedido_items || []).map((it) => (
            <div key={it.id} className="pedadmin-item-linea">
              <span className="pedadmin-item-nombre">
                {it.nombre}
                {it.talla && ` · Talla: ${it.talla}`}
                {it.color_nombre && ` · ${it.color_nombre}`}
              </span>
              <span className="pedadmin-item-cantidad">×{it.cantidad}</span>
              <span className="pedadmin-item-precio">{formatCOP(it.precio * it.cantidad)}</span>
            </div>
          ))}
        </div>

        {/* ── Gestión del admin ── */}
        <h3 className="pedadmin-seccion-titulo">Datos del comprador</h3>
        <div className="admin-field-fila">
          <FormField label="Nombre" error={errores.nombre}>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={errores.nombre ? 'invalido' : ''} />
          </FormField>
          <FormField label="Celular" error={errores.celular}>
            <input type="text" value={celular} onChange={(e) => setCelular(e.target.value)} className={errores.celular ? 'invalido' : ''} />
          </FormField>
        </div>
        <div className="admin-field-fila">
          <FormField label="Email" error={errores.email}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={errores.email ? 'invalido' : ''} />
          </FormField>
          <FormField label="Ciudad" error={errores.ciudad}>
            <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} className={errores.ciudad ? 'invalido' : ''} />
          </FormField>
        </div>
        <div className="admin-field-fila">
          <FormField label="Dirección de envío" error={errores.direccion}>
            <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className={errores.direccion ? 'invalido' : ''} />
          </FormField>
          <FormField label="Apto / referencia" hint="opcional">
            <input type="text" value={direccionAdicional} onChange={(e) => setDireccionAdicional(e.target.value)} />
          </FormField>
        </div>

        <h3 className="pedadmin-seccion-titulo">Estado y pago</h3>
        <div className="admin-field-fila">
          <FormField label="Estado">
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </FormField>
          <FormField label="Referencia de pago" hint="opcional">
            <input type="text" value={referenciaMp} onChange={(e) => setReferenciaMp(e.target.value)} placeholder="ID de Mercado Pago…" />
          </FormField>
        </div>

        {errorGeneral && <p className="admin-page-error">{errorGeneral}</p>}

        {aviso && (
          <p className="admin-form-aviso" role="status">
            <span aria-hidden="true">✓</span> {aviso}
          </p>
        )}

        <div className="admin-form-acciones">
          <Button type="submit" className="admin-btn-ancho" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="peligro" onClick={() => setConfirmandoBorrar(true)} disabled={guardando}>
            Borrar pedido
          </Button>
        </div>
      </form>

      <ConfirmDialog
        abierto={confirmandoBorrar}
        titulo="¿Borrar este pedido?"
        mensaje={`Se va a borrar el pedido de "${pedido.nombre}" de forma permanente. Para cerrar un caso sin perder el registro, usa el estado "cancelado" en su lugar.`}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setConfirmandoBorrar(false)}
        confirmando={borrando}
      />
    </Card>
  );
}

export default function Pedidos() {
  const { adminFetch } = useAdminAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState(undefined); // undefined = ninguno
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('');
  // ⭐ Paginación real agregada (auditoría Fase 5, 2026-09-01): mismo criterio
  // que Reservas.jsx/Inscripciones.jsx — el backend ya no trae la tabla
  // entera (ver pedidos.js). Los filtros de abajo siguen siendo del lado del
  // cliente sobre lo ya cargado; "Cargar más" trae pedidos más viejos.
  const [hayMas, setHayMas] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const formPanelRef = useScrollAlSeleccionar(seleccionadoId, !cargando);

  const pedidoSeleccionado = pedidos.find((p) => p.id === seleccionadoId) || null;

  const cargar = useCallback((cancelObj) => {
    adminFetch('/api/admin/pedidos')
      .then((data) => {
        if (cancelObj?.cancelado) return;
        setPedidos(data.data);
        setHayMas(data.hayMas);
        setErrorCarga('');
      })
      .catch((err) => { if (!cancelObj?.cancelado) setErrorCarga(err.message); })
      .finally(() => { if (!cancelObj?.cancelado) setCargando(false); });
  }, [adminFetch]);

  useEffect(() => {
    const cancelObj = { cancelado: false };
    cargar(cancelObj);
    return () => { cancelObj.cancelado = true; };
  }, [cargar]);

  const cargarMas = useCallback(async () => {
    setCargandoMas(true);
    try {
      const data = await adminFetch(`/api/admin/pedidos?offset=${pedidos.length}`);
      setPedidos((prev) => [...prev, ...data.data]);
      setHayMas(data.hayMas);
    } catch (err) {
      setErrorCarga(err.message);
    } finally {
      setCargandoMas(false);
    }
  }, [adminFetch, pedidos.length]);

  const pedidosFiltrados = pedidos.filter((p) => {
    const textoBuscado = busqueda.toLowerCase();
    const coincideTexto = p.nombre.toLowerCase().includes(textoBuscado)
      || p.email.toLowerCase().includes(textoBuscado);
    const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const coincideFecha = !filtroFecha || fechaPedido(p) === filtroFecha;
    return coincideTexto && coincideEstado && coincideFecha;
  });

  function seleccionar(id) {
    setSeleccionadoId(id);
    setAviso('');
  }

  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(timer);
  }, [aviso]);

  function manejarGuardado(pedidoGuardado) {
    setPedidos((prev) => prev.map((p) => (p.id === pedidoGuardado.id ? pedidoGuardado : p)));
  }

  function manejarBorrado() {
    setPedidos((prev) => prev.filter((p) => p.id !== seleccionadoId));
    setSeleccionadoId(undefined);
  }

  return (
    <AdminLayout>
      <div className="pedadmin-panel-header">
        <div>
          <h1 className="admin-page-titulo">Pedidos</h1>
          <p className="admin-page-sub">Consulta los pedidos de la Tienda, corrige datos del comprador y gestiona el estado del pago y envío.</p>
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
        <div className="pedadmin-layout">
          <div className="pedadmin-lista-panel">
            <div className="pedadmin-filtros">
              <input
                type="text"
                placeholder="🔎 Buscar por comprador o email…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="todos">Todos los estados</option>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              <FormField label="Fecha del pedido" hint="opcional" className="pedadmin-filtro-fecha">
                <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} />
              </FormField>
            </div>

            <p className="pedadmin-contador">Pedidos encontrados ({pedidosFiltrados.length})</p>

            {pedidosFiltrados.length === 0 && (
              <p className="pedadmin-vacio">
                {pedidos.length === 0 ? 'Todavía no hay pedidos recibidos.' : 'No hay pedidos que coincidan con los filtros.'}
              </p>
            )}

            <div className="pedadmin-panel-lista">
              {pedidosFiltrados.map((p) => (
                <button
                  key={p.id}
                  className={`pedadmin-item${p.id === seleccionadoId ? ' activo' : ''}`}
                  onClick={() => seleccionar(p.id)}
                >
                  <span className="pedadmin-item-titulo">{p.nombre}</span>
                  <span className="pedadmin-item-meta">
                    {formatCOP(p.total)} · <span className={`pedadmin-estado pedadmin-estado-${p.estado}`}>{p.estado}</span>
                  </span>
                  <span className="pedadmin-item-meta">
                    {formatearFechaHora(p.creado_en)} · {(p.pedido_items || []).length} producto{(p.pedido_items || []).length === 1 ? '' : 's'}
                  </span>
                </button>
              ))}
            </div>

            {hayMas && (
              <div className="pedadmin-cargar-mas">
                <Button type="button" variant="secundario" onClick={cargarMas} disabled={cargandoMas}>
                  {cargandoMas ? 'Cargando…' : 'Cargar más'}
                </Button>
              </div>
            )}
          </div>

          <div className="pedadmin-form-panel" ref={formPanelRef}>
            {pedidoSeleccionado ? (
              <PedidoForm
                key={seleccionadoId}
                pedido={pedidoSeleccionado}
                adminFetch={adminFetch}
                onGuardado={manejarGuardado}
                onBorrado={manejarBorrado}
                onAviso={setAviso}
                aviso={aviso}
              />
            ) : (
              <Card className="pedadmin-form-vacio">
                {aviso ? (
                  <p className="admin-form-aviso" role="status">
                    <span aria-hidden="true">✓</span> {aviso}
                  </p>
                ) : (
                  <p>Selecciona un pedido de la lista para gestionarlo.</p>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
