import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useListaDinamica } from '../../hooks/useListaDinamica';
import { useScrollAlSeleccionar } from '../../hooks/useScrollAlSeleccionar';
import AdminLayout from '../../components/admin/ui/AdminLayout';
import Card from '../../components/admin/ui/Card';
import FormField from '../../components/admin/ui/FormField';
import Button from '../../components/admin/ui/Button';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import HelpTooltip from '../../components/admin/ui/HelpTooltip';
import { soloDigitos, formatMiles, formatearFechaHora } from '../../utils/formato';
import './Inscripciones.css';

const ESTADOS = ['pendiente', 'confirmada', 'cancelada'];
const ESTADOS_CUOTA = ['pendiente', 'pagado', 'mora'];
const METODOS_PAGO_SUGERIDOS = ['Transferencia', 'Efectivo'];

function cuotaDesdeBackend(pago) {
  return { numeroCuota: pago.numero_cuota, monto: pago.monto ?? '', estado: pago.estado, fechaPago: pago.fecha_pago || '', metodoPago: pago.metodo_pago || '' };
}

// La duración del curso es texto libre (ej. "6 meses") — se usa solo como
// sugerencia para generar las cuotas de un tirón, tomando el primer número
// que aparezca; si no hay ninguno, el admin arma las cuotas a mano con
// "+ Agregar cuota" (mismo respaldo que ya usa este proyecto para otros
// textos libres que a veces se parsean, ej. precio de Eventos).
function mesesDesdeDuracion(duracion) {
  const match = duracion?.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function contarCuotasPagadas(pagos) {
  const total = pagos?.length || 0;
  const pagadas = (pagos || []).filter((p) => p.estado === 'pagado').length;
  return { pagadas, total };
}

// Panel de detalle/edición, montado con `key` por inscripción seleccionada
// (mismo criterio que Eventos/Productos/Cursos — el estado se reinicia solo
// al cambiar de selección). No hay "crear" acá: las inscripciones solo llegan
// desde el formulario público (POST /api/inscripciones, ver Inscripciones.jsx).
function InscripcionForm({ inscripcion, nivelesDelCurso, onGuardado, onBorrado, onAviso, aviso, adminFetch }) {
  const [nivelId, setNivelId] = useState(inscripcion.nivel_id || '');
  const [estado, setEstado] = useState(inscripcion.estado);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const cuotas = useListaDinamica((inscripcion.inscripcion_pagos || []).slice().sort((a, b) => a.numero_cuota - b.numero_cuota).map(cuotaDesdeBackend));

  const duracionCurso = inscripcion.cursos?.duracion || '';
  const precioMensual = inscripcion.cursos?.precio_numerico ?? '';
  const mesesSugeridos = mesesDesdeDuracion(duracionCurso);

  function generarCuotasAutomaticas() {
    const filas = Array.from({ length: mesesSugeridos }, (_, i) => ({
      numeroCuota: i + 1, monto: precioMensual, estado: 'pendiente', fechaPago: '', metodoPago: '',
    }));
    cuotas.setItems(filas);
  }

  function agregarCuota() {
    const numeroMax = cuotas.items.reduce((max, c) => Math.max(max, Number(c.numeroCuota) || 0), 0);
    cuotas.agregar({ numeroCuota: numeroMax + 1, monto: precioMensual, estado: 'pendiente', fechaPago: '', metodoPago: '' });
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setErrorGeneral('');
    try {
      const body = {
        nivel_id: nivelId || null,
        estado,
        cuotas: cuotas.items.map((c) => ({
          numero_cuota: Number(c.numeroCuota),
          monto: c.monto === '' ? null : Number(c.monto),
          estado: c.estado,
          fecha_pago: c.fechaPago || null,
          metodo_pago: c.metodoPago.trim() || null,
        })),
      };
      const data = await adminFetch(`/api/admin/inscripciones/${inscripcion.id}`, { method: 'PATCH', body });
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
      await adminFetch(`/api/admin/inscripciones/${inscripcion.id}`, { method: 'DELETE' });
      onBorrado();
      onAviso('Inscripción borrada.');
      setConfirmandoBorrar(false);
    } catch (err) {
      setErrorGeneral(err.message);
      setConfirmandoBorrar(false);
    } finally {
      setBorrando(false);
    }
  }

  const esMenor = inscripcion.estudiante_edad < 18;

  return (
    <Card>
      <form onSubmit={guardar} noValidate>
        <h2 className="insadmin-form-titulo">{inscripcion.estudiante_nombre}</h2>
        <p className="insadmin-form-sub">
          Inscrito en <strong>{inscripcion.cursos?.nombre || '—'}</strong> · {formatearFechaHora(inscripcion.creado_en)}
        </p>

        {/* ── Datos recibidos (solo lectura) ── */}
        <h3 className="insadmin-seccion-titulo">Datos del estudiante</h3>
        <div className="insadmin-datos-grid">
          <div><span className="insadmin-dato-label">Documento</span><span>{inscripcion.estudiante_documento}</span></div>
          <div><span className="insadmin-dato-label">Edad</span><span>{inscripcion.estudiante_edad} años</span></div>
          <div><span className="insadmin-dato-label">Email</span><span>{inscripcion.estudiante_email || '—'}</span></div>
          <div><span className="insadmin-dato-label">Teléfono</span><span>{inscripcion.estudiante_telefono || '—'}</span></div>
          <div><span className="insadmin-dato-label">Horario preferido</span><span>{inscripcion.horario_preferencia}</span></div>
          <div><span className="insadmin-dato-label">Barrio</span><span>{inscripcion.barrio || '—'}</span></div>
        </div>

        {esMenor && (
          <>
            <h3 className="insadmin-seccion-titulo">Datos del acudiente</h3>
            <div className="insadmin-datos-grid">
              <div><span className="insadmin-dato-label">Nombre</span><span>{inscripcion.acudiente_nombre || '—'}</span></div>
              <div><span className="insadmin-dato-label">Parentesco</span><span>{inscripcion.acudiente_parentesco || '—'}</span></div>
              <div><span className="insadmin-dato-label">Contacto</span><span>{inscripcion.acudiente_contacto || '—'}</span></div>
              <div><span className="insadmin-dato-label">Email</span><span>{inscripcion.acudiente_email || '—'}</span></div>
            </div>
          </>
        )}

        {/* ── Gestión del admin ── */}
        <h3 className="insadmin-seccion-titulo">Gestión</h3>
        <div className="admin-field-fila">
          <FormField label="Nivel" hint={nivelesDelCurso.length === 0 ? 'este curso no tiene niveles asociados' : undefined}>
            <select value={nivelId} onChange={(e) => setNivelId(e.target.value)} disabled={nivelesDelCurso.length === 0}>
              <option value="">Sin asignar</option>
              {nivelesDelCurso.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
            </select>
          </FormField>
          <FormField label="Estado">
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </FormField>
        </div>

        {/* ── Pagos por cuota mensual ── */}
        <h3 className="insadmin-seccion-titulo">
          Pagos
          <HelpTooltip texto="Una fila por cada mes de la duración del curso — el admin la marca como pagado, en mora o pendiente a medida que el estudiante paga." />
        </h3>

        {duracionCurso && <p className="insadmin-duracion-nota">Duración del curso: <strong>{duracionCurso}</strong></p>}

        {cuotas.items.length === 0 ? (
          <div className="insadmin-cuotas-vacio">
            <p>Todavía no hay cuotas generadas para esta inscripción.</p>
            {mesesSugeridos ? (
              <Button type="button" variant="secundario" onClick={generarCuotasAutomaticas}>
                Generar {mesesSugeridos} cuota{mesesSugeridos === 1 ? '' : 's'} automáticas
              </Button>
            ) : (
              <Button type="button" variant="secundario" onClick={agregarCuota}>+ Agregar cuota</Button>
            )}
          </div>
        ) : (
          <div className="insadmin-cuotas">
            {cuotas.items.map((c, idx) => (
              // `role="group"` + `aria-label` (2026-08-19, auditoría 5.5): sin esto,
              // un lector de pantalla anuncia "Estado"/"Monto"/... N veces idénticas
              // sin decir a qué mes pertenece cada una.
              <div className="insadmin-cuota-fila" key={idx} role="group" aria-label={`Cuota del mes ${c.numeroCuota}`}>
                <span className="insadmin-cuota-num">
                  Mes {c.numeroCuota}
                  <span className="insadmin-cuota-sub">Cuota {c.numeroCuota}/{cuotas.items.length}</span>
                </span>
                <FormField label="Estado">
                  <select value={c.estado} onChange={(e) => cuotas.actualizar(idx, 'estado', e.target.value)}>
                    {ESTADOS_CUOTA.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </FormField>
                <FormField label="Monto">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatMiles(c.monto)}
                    onChange={(e) => cuotas.actualizar(idx, 'monto', soloDigitos(e.target.value))}
                  />
                </FormField>
                <FormField label="Fecha de pago">
                  <input type="date" value={c.fechaPago} onChange={(e) => cuotas.actualizar(idx, 'fechaPago', e.target.value)} />
                </FormField>
                <FormField label="Método de pago">
                  <input
                    type="text"
                    list="insadmin-metodos-pago"
                    placeholder="Transferencia, Efectivo…"
                    value={c.metodoPago}
                    onChange={(e) => cuotas.actualizar(idx, 'metodoPago', e.target.value)}
                  />
                </FormField>
                <button type="button" className="admin-fila-quitar" onClick={() => cuotas.quitar(idx)} aria-label={`Quitar cuota del mes ${c.numeroCuota}`}>×</button>
              </div>
            ))}
            <datalist id="insadmin-metodos-pago">
              {METODOS_PAGO_SUGERIDOS.map((m) => <option key={m} value={m} />)}
            </datalist>
            <Button type="button" variant="secundario" onClick={agregarCuota}>+ Agregar cuota</Button>
          </div>
        )}

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
            Borrar inscripción
          </Button>
        </div>
      </form>

      <ConfirmDialog
        abierto={confirmandoBorrar}
        titulo="¿Borrar esta inscripción?"
        mensaje={`Se va a borrar la inscripción de "${inscripcion.estudiante_nombre}" de forma permanente, junto con sus cuotas de pago. Para cerrar un caso sin perder el registro, usa el estado "cancelada" en su lugar.`}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setConfirmandoBorrar(false)}
        confirmando={borrando}
      />
    </Card>
  );
}

export default function Inscripciones() {
  const { adminFetch } = useAdminAuth();
  const [inscripciones, setInscripciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState(undefined); // undefined = ninguna
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const formPanelRef = useScrollAlSeleccionar(seleccionadoId, !cargando);

  const inscripcionSeleccionada = inscripciones.find((i) => i.id === seleccionadoId) || null;

  const cargarTodo = useCallback((cancelObj) => {
    Promise.all([
      adminFetch('/api/admin/inscripciones'),
      adminFetch('/api/admin/cursos'),
    ])
      .then(([ins, cur]) => {
        if (cancelObj?.cancelado) return;
        setInscripciones(ins.data);
        setCursos(cur.data);
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

  const inscripcionesFiltradas = useMemo(() => {
    return inscripciones.filter((i) => {
      const coincideTexto = i.estudiante_nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCurso = filtroCurso === 'todos' || i.curso_id === filtroCurso;
      const coincideEstado = filtroEstado === 'todos' || i.estado === filtroEstado;
      return coincideTexto && coincideCurso && coincideEstado;
    });
  }, [inscripciones, busqueda, filtroCurso, filtroEstado]);

  // Niveles asignables para la inscripción seleccionada: solo los que el
  // curso correspondiente tiene asociados (curso_niveles) — evita que el
  // admin le asigne a un estudiante un nivel que ese curso ni siquiera ofrece.
  const nivelesDelCursoSeleccionado = useMemo(() => {
    if (!inscripcionSeleccionada) return [];
    const curso = cursos.find((c) => c.id === inscripcionSeleccionada.curso_id);
    return curso?.niveles || [];
  }, [cursos, inscripcionSeleccionada]);

  function seleccionar(id) {
    setSeleccionadoId(id);
    setAviso('');
  }

  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(timer);
  }, [aviso]);

  function manejarGuardado(inscripcionGuardada) {
    setInscripciones((prev) => prev.map((i) => (i.id === inscripcionGuardada.id ? inscripcionGuardada : i)));
  }

  function manejarBorrado() {
    setInscripciones((prev) => prev.filter((i) => i.id !== seleccionadoId));
    setSeleccionadoId(undefined);
  }

  return (
    <AdminLayout>
      <div className="insadmin-panel-header">
        <div>
          <h1 className="admin-page-titulo">Inscripciones</h1>
          <p className="admin-page-sub">Revisa las inscripciones recibidas, asigna nivel, cambia el estado y gestiona el pago mes a mes.</p>
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
        <div className="insadmin-layout">
          <div className="insadmin-lista-panel">
            <div className="insadmin-filtros">
              <input
                type="text"
                placeholder="🔎 Buscar por estudiante…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <select value={filtroCurso} onChange={(e) => setFiltroCurso(e.target.value)}>
                <option value="todos">Todos los cursos</option>
                {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="todos">Todos los estados</option>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <p className="insadmin-contador">Inscripciones encontradas ({inscripcionesFiltradas.length})</p>

            {inscripcionesFiltradas.length === 0 && (
              <p className="insadmin-vacio">
                {inscripciones.length === 0 ? 'Todavía no hay inscripciones recibidas.' : 'No hay inscripciones que coincidan con los filtros.'}
              </p>
            )}

            <div className="insadmin-panel-lista">
              {inscripcionesFiltradas.map((i) => {
                const { pagadas, total } = contarCuotasPagadas(i.inscripcion_pagos);
                return (
                  <button
                    key={i.id}
                    className={`insadmin-item${i.id === seleccionadoId ? ' activo' : ''}`}
                    onClick={() => seleccionar(i.id)}
                  >
                    <span className="insadmin-item-titulo">{i.estudiante_nombre}</span>
                    <span className="insadmin-item-meta">
                      {i.cursos?.nombre || '—'} · <span className={`insadmin-estado insadmin-estado-${i.estado}`}>{i.estado}</span>
                    </span>
                    <span className="insadmin-item-meta">
                      {formatearFechaHora(i.creado_en)}{i.niveles?.nombre ? ` · ${i.niveles.nombre}` : ''}
                      {total > 0 ? ` · ${pagadas}/${total} cuotas pagadas` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="insadmin-form-panel" ref={formPanelRef}>
            {inscripcionSeleccionada ? (
              <InscripcionForm
                key={seleccionadoId}
                inscripcion={inscripcionSeleccionada}
                nivelesDelCurso={nivelesDelCursoSeleccionado}
                adminFetch={adminFetch}
                onGuardado={manejarGuardado}
                onBorrado={manejarBorrado}
                onAviso={setAviso}
                aviso={aviso}
              />
            ) : (
              <Card className="insadmin-form-vacio">
                {aviso ? (
                  <p className="admin-form-aviso" role="status">
                    <span aria-hidden="true">✓</span> {aviso}
                  </p>
                ) : (
                  <p>Selecciona una inscripción de la lista para gestionarla.</p>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
