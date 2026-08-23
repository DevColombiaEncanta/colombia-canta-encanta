import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useScrollAlSeleccionar } from '../../hooks/useScrollAlSeleccionar';
import AdminLayout from '../../components/admin/ui/AdminLayout';
import Card from '../../components/admin/ui/Card';
import FormField from '../../components/admin/ui/FormField';
import Button from '../../components/admin/ui/Button';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import { formatearFechaHora, formatearFechaSolo } from '../../utils/formato';
import './Reservas.css';

const ESTADOS = ['pendiente', 'pagada', 'cancelada', 'libre'];

// El evento/show al que corresponde la reserva es siempre uno de dos: un
// `evento` (con `fecha_iso` propio) o un `evento_fijo` (Salas/Enamoras, sin
// fecha única — la fecha real, si la hay, viene del show puntual elegido
// dentro de su programación, snapshot en `show_seleccionado`). Se calcula acá
// una única "fecha efectiva" para mostrar y filtrar, sin importar de cuál de
// los dos casos venga.
function fechaEfectiva(reserva) {
  return reserva.eventos?.fecha_iso || reserva.show_seleccionado?.fecha_iso || null;
}

function claveEvento(reserva) {
  return reserva.evento_id ? `evento:${reserva.evento_id}` : `fijo:${reserva.evento_fijo_id}`;
}

function nombreEvento(reserva) {
  return reserva.eventos?.titulo || reserva.eventos_fijos?.titulo || '—';
}

// Panel de detalle/edición, montado con `key` por reserva seleccionada (mismo
// criterio que Inscripciones). No hay "crear" acá: las reservas solo llegan
// desde el formulario público (POST /api/reservas, ver pages/Eventos.jsx).
function ReservaForm({ reserva, onGuardado, onBorrado, onAviso, aviso, adminFetch }) {
  const [nombre, setNombre] = useState(reserva.nombre);
  const [celular, setCelular] = useState(reserva.celular);
  const [email, setEmail] = useState(reserva.email);
  const [cantidad, setCantidad] = useState(reserva.cantidad);
  const [estado, setEstado] = useState(reserva.estado);
  const [referenciaMp, setReferenciaMp] = useState(reserva.referencia_mp || '');
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setErrorGeneral('');
    try {
      const body = {
        nombre: nombre.trim(),
        celular: celular.trim(),
        email: email.trim(),
        cantidad: Number(cantidad),
        estado,
        referencia_mp: referenciaMp.trim() || null,
      };
      const data = await adminFetch(`/api/admin/reservas/${reserva.id}`, { method: 'PATCH', body });
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
      await adminFetch(`/api/admin/reservas/${reserva.id}`, { method: 'DELETE' });
      onBorrado();
      onAviso('Reserva borrada.');
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
        <h2 className="resadmin-form-titulo">{reserva.nombre}</h2>
        <p className="resadmin-form-sub">
          {nombreEvento(reserva)} · {formatearFechaHora(reserva.creado_en)}
        </p>

        {/* ── Datos recibidos (solo lectura) ── */}
        <h3 className="resadmin-seccion-titulo">Detalle de la reserva</h3>
        <div className="resadmin-datos-grid">
          <div><span className="resadmin-dato-label">Evento</span><span>{nombreEvento(reserva)}</span></div>
          <div><span className="resadmin-dato-label">Fecha</span><span>{formatearFechaSolo(fechaEfectiva(reserva))}</span></div>
          {reserva.zona_seleccionada && (
            <div><span className="resadmin-dato-label">Zona</span><span>{reserva.zona_seleccionada.nombre} — ${Number(reserva.zona_seleccionada.precio).toLocaleString('es-CO')}</span></div>
          )}
          {reserva.show_seleccionado && (
            <div><span className="resadmin-dato-label">Show</span><span>{reserva.show_seleccionado.nombre} · {reserva.show_seleccionado.dia} {reserva.show_seleccionado.hora}</span></div>
          )}
        </div>

        {/* ── Gestión del admin ── */}
        <h3 className="resadmin-seccion-titulo">Datos del comprador</h3>
        <div className="admin-field-fila">
          <FormField label="Nombre">
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
          </FormField>
          <FormField label="Celular">
            <input type="text" value={celular} onChange={(e) => setCelular(e.target.value)} required minLength={7} />
          </FormField>
        </div>
        <div className="admin-field-fila">
          <FormField label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FormField>
          <FormField label="Cantidad de entradas">
            <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
          </FormField>
        </div>

        <h3 className="resadmin-seccion-titulo">Estado y pago</h3>
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
            Borrar reserva
          </Button>
        </div>
      </form>

      <ConfirmDialog
        abierto={confirmandoBorrar}
        titulo="¿Borrar esta reserva?"
        mensaje={`Se va a borrar la reserva de "${reserva.nombre}" de forma permanente. Para cerrar un caso sin perder el registro, usa el estado "cancelada" en su lugar.`}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setConfirmandoBorrar(false)}
        confirmando={borrando}
      />
    </Card>
  );
}

export default function Reservas() {
  const { adminFetch } = useAdminAuth();
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState(undefined); // undefined = ninguna
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEvento, setFiltroEvento] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('');
  const formPanelRef = useScrollAlSeleccionar(seleccionadoId, !cargando);

  const reservaSeleccionada = reservas.find((r) => r.id === seleccionadoId) || null;

  const cargar = useCallback((cancelObj) => {
    adminFetch('/api/admin/reservas')
      .then((data) => {
        if (cancelObj?.cancelado) return;
        setReservas(data.data);
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

  const eventosDisponibles = useMemo(() => {
    const mapa = new Map();
    reservas.forEach((r) => mapa.set(claveEvento(r), nombreEvento(r)));
    return Array.from(mapa, ([key, titulo]) => ({ key, titulo })).sort((a, b) => a.titulo.localeCompare(b.titulo));
  }, [reservas]);

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((r) => {
      const coincideTexto = r.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEvento = filtroEvento === 'todos' || claveEvento(r) === filtroEvento;
      const coincideEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
      const coincideFecha = !filtroFecha || fechaEfectiva(r) === filtroFecha;
      return coincideTexto && coincideEvento && coincideEstado && coincideFecha;
    });
  }, [reservas, busqueda, filtroEvento, filtroEstado, filtroFecha]);

  function seleccionar(id) {
    setSeleccionadoId(id);
    setAviso('');
  }

  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(timer);
  }, [aviso]);

  function manejarGuardado(reservaGuardada) {
    setReservas((prev) => prev.map((r) => (r.id === reservaGuardada.id ? reservaGuardada : r)));
  }

  function manejarBorrado() {
    setReservas((prev) => prev.filter((r) => r.id !== seleccionadoId));
    setSeleccionadoId(undefined);
  }

  return (
    <AdminLayout>
      <div className="resadmin-panel-header">
        <div>
          <h1 className="admin-page-titulo">Reservas</h1>
          <p className="admin-page-sub">Consulta las entradas reservadas para Eventos, corrige datos del comprador y gestiona el estado del pago.</p>
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
        <div className="resadmin-layout">
          <div className="resadmin-lista-panel">
            <div className="resadmin-filtros">
              <input
                type="text"
                placeholder="🔎 Buscar por comprador…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <select value={filtroEvento} onChange={(e) => setFiltroEvento(e.target.value)}>
                <option value="todos">Todos los eventos</option>
                {eventosDisponibles.map((ev) => <option key={ev.key} value={ev.key}>{ev.titulo}</option>)}
              </select>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="todos">Todos los estados</option>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              <FormField label="Fecha del evento" hint="opcional" className="resadmin-filtro-fecha">
                <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} />
              </FormField>
            </div>

            <p className="resadmin-contador">Reservas encontradas ({reservasFiltradas.length})</p>

            {reservasFiltradas.length === 0 && (
              <p className="resadmin-vacio">
                {reservas.length === 0 ? 'Todavía no hay reservas recibidas.' : 'No hay reservas que coincidan con los filtros.'}
              </p>
            )}

            <div className="resadmin-panel-lista">
              {reservasFiltradas.map((r) => (
                <button
                  key={r.id}
                  className={`resadmin-item${r.id === seleccionadoId ? ' activo' : ''}`}
                  onClick={() => seleccionar(r.id)}
                >
                  <span className="resadmin-item-titulo">{r.nombre}</span>
                  <span className="resadmin-item-meta">
                    {nombreEvento(r)} · <span className={`resadmin-estado resadmin-estado-${r.estado}`}>{r.estado}</span>
                  </span>
                  <span className="resadmin-item-meta">
                    {fechaEfectiva(r) ? formatearFechaSolo(fechaEfectiva(r)) : 'Sin fecha fija'} · {r.cantidad} entrada{r.cantidad === 1 ? '' : 's'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="resadmin-form-panel" ref={formPanelRef}>
            {reservaSeleccionada ? (
              <ReservaForm
                key={seleccionadoId}
                reserva={reservaSeleccionada}
                adminFetch={adminFetch}
                onGuardado={manejarGuardado}
                onBorrado={manejarBorrado}
                onAviso={setAviso}
                aviso={aviso}
              />
            ) : (
              <Card className="resadmin-form-vacio">
                {aviso ? (
                  <p className="admin-form-aviso" role="status">
                    <span aria-hidden="true">✓</span> {aviso}
                  </p>
                ) : (
                  <p>Selecciona una reserva de la lista para gestionarla.</p>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
