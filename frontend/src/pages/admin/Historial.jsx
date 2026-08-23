import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from '../../components/admin/ui/AdminLayout';
import FormField from '../../components/admin/ui/FormField';
import Button from '../../components/admin/ui/Button';
import { formatearFechaHoraCompleta } from '../../utils/formato';
import './Historial.css';

const ENTIDADES = [
  'hero_slides', 'noticias', 'eventos', 'eventos_fijos', 'colecciones',
  'categorias_producto', 'productos', 'niveles', 'cursos', 'inscripciones',
  'admins', 'reservas',
];
const ACCIONES = ['crear', 'editar', 'borrar'];

const ENTIDAD_LABELS = {
  hero_slides: 'Carrusel (Hero)',
  noticias: 'Noticias',
  eventos: 'Eventos',
  eventos_fijos: 'Eventos Fijos',
  colecciones: 'Colecciones',
  categorias_producto: 'Categorías de producto',
  productos: 'Productos',
  niveles: 'Niveles',
  cursos: 'Cursos',
  inscripciones: 'Inscripciones',
  admins: 'Administradores',
  reservas: 'Reservas',
};

const ACCION_LABELS = { crear: 'Creado', editar: 'Editado', borrar: 'Borrado' };

const FILTROS_VACIOS = { entidad: 'todas', accion: 'todas', email: '', desde: '', hasta: '' };

// 5.6 · A diferencia del resto del panel (donde se trae toda la lista y se
// filtra en el cliente, porque los catálogos son chicos por naturaleza), acá
// filtros y paginación son server-side desde el día uno — `audit_log` crece
// sin límite con el uso real (ver pre-análisis 5.6, 2026-08-20, y
// backend/src/routes/auditLog.js). Por eso entidad/acción se aplican al
// tiro (son selects, cambian poco), pero email/fechas quedan en un
// "borrador" separado y solo disparan una petición al enviar el formulario
// — si se aplicaran letra por letra, cada tecla sería un fetch nuevo.
function construirParams(filtros, offset) {
  const params = new URLSearchParams();
  if (filtros.entidad !== 'todas') params.set('entidad', filtros.entidad);
  if (filtros.accion !== 'todas') params.set('accion', filtros.accion);
  if (filtros.email) params.set('usuario_email', filtros.email);
  if (filtros.desde) params.set('desde', filtros.desde);
  if (filtros.hasta) params.set('hasta', filtros.hasta);
  params.set('offset', String(offset));
  return params.toString();
}

export default function Historial() {
  const { adminFetch } = useAdminAuth();
  const [entradas, setEntradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [hayMas, setHayMas] = useState(false);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [borrador, setBorrador] = useState({ email: '', desde: '', hasta: '' });

  useEffect(() => {
    const cancelObj = { cancelado: false };
    adminFetch(`/api/admin/audit-log?${construirParams(filtros, 0)}`)
      .then((data) => {
        if (cancelObj.cancelado) return;
        setEntradas(data.data);
        setHayMas(data.hayMas);
      })
      .catch((err) => { if (!cancelObj.cancelado) setErrorCarga(err.message); })
      .finally(() => { if (!cancelObj.cancelado) setCargando(false); });
    return () => { cancelObj.cancelado = true; };
  }, [adminFetch, filtros]);

  const cargarMas = useCallback(async () => {
    setCargandoMas(true);
    try {
      const data = await adminFetch(`/api/admin/audit-log?${construirParams(filtros, entradas.length)}`);
      setEntradas((prev) => [...prev, ...data.data]);
      setHayMas(data.hayMas);
    } catch (err) {
      setErrorCarga(err.message);
    } finally {
      setCargandoMas(false);
    }
  }, [adminFetch, filtros, entradas.length]);

  // `cargando`/`errorCarga` se resetean acá, en el manejador que dispara el
  // cambio — no dentro del efecto que reacciona a `filtros` (ESLint
  // `react-hooks/set-state-in-effect`: un `setState` síncrono al cuerpo de un
  // efecto encadena renders; el efecto solo debe reaccionar al fetch async).
  function cambiarFiltro(cambios) {
    setCargando(true);
    setErrorCarga('');
    setFiltros((f) => ({ ...f, ...cambios }));
  }

  function aplicarFiltros(e) {
    e.preventDefault();
    cambiarFiltro(borrador);
  }

  function limpiarFiltros() {
    setBorrador({ email: '', desde: '', hasta: '' });
    cambiarFiltro(FILTROS_VACIOS);
  }

  function reintentar() {
    cambiarFiltro({});
  }

  return (
    <AdminLayout>
      <div className="histadmin-panel-header">
        <h1 className="admin-page-titulo">Historial</h1>
        <p className="admin-page-sub">Registro de cada acción de crear, editar o borrar realizada desde el panel, con quién y cuándo la hizo.</p>
      </div>

      <form className="histadmin-filtros" onSubmit={aplicarFiltros}>
        <FormField label="Sección">
          <select value={filtros.entidad} onChange={(e) => cambiarFiltro({ entidad: e.target.value })}>
            <option value="todas">Todas</option>
            {ENTIDADES.map((ent) => <option key={ent} value={ent}>{ENTIDAD_LABELS[ent]}</option>)}
          </select>
        </FormField>
        <FormField label="Acción">
          <select value={filtros.accion} onChange={(e) => cambiarFiltro({ accion: e.target.value })}>
            <option value="todas">Todas</option>
            {ACCIONES.map((a) => <option key={a} value={a}>{ACCION_LABELS[a]}</option>)}
          </select>
        </FormField>
        <FormField label="Admin" hint="email, opcional">
          <input type="text" value={borrador.email} onChange={(e) => setBorrador((b) => ({ ...b, email: e.target.value }))} placeholder="correo@…" />
        </FormField>
        <FormField label="Desde">
          <input type="date" value={borrador.desde} onChange={(e) => setBorrador((b) => ({ ...b, desde: e.target.value }))} />
        </FormField>
        <FormField label="Hasta">
          <input type="date" value={borrador.hasta} onChange={(e) => setBorrador((b) => ({ ...b, hasta: e.target.value }))} />
        </FormField>
        <div className="histadmin-filtros-acciones">
          <Button type="submit">Filtrar</Button>
          <Button type="button" variant="secundario" onClick={limpiarFiltros}>Limpiar</Button>
        </div>
      </form>

      {cargando && <p>Cargando…</p>}
      {errorCarga && (
        <p className="admin-page-error">
          No se pudo cargar: {errorCarga}{' '}
          <button onClick={reintentar}>Reintentar</button>
        </p>
      )}

      {!cargando && !errorCarga && (
        <>
          {entradas.length === 0 && <p className="histadmin-vacio">No hay ninguna acción registrada que coincida con estos filtros.</p>}

          <div className="histadmin-lista">
            {entradas.map((entrada) => (
              <div className="histadmin-entrada" key={entrada.id}>
                <div className="histadmin-entrada-cabecera">
                  <span className={`histadmin-accion histadmin-accion-${entrada.accion}`}>{ACCION_LABELS[entrada.accion] || entrada.accion}</span>
                  <span className="histadmin-entidad">{ENTIDAD_LABELS[entrada.entidad] || entrada.entidad}</span>
                  <span className="histadmin-fecha">{formatearFechaHoraCompleta(entrada.creado_en)}</span>
                </div>
                <p className="histadmin-usuario">
                  {entrada.usuario_email} <span className="histadmin-id">· ID {entrada.entidad_id}</span>
                </p>
                {entrada.detalle && (
                  <details className="histadmin-detalle">
                    <summary>Ver detalle</summary>
                    <pre>{JSON.stringify(entrada.detalle, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {hayMas && (
            <div className="histadmin-cargar-mas">
              <Button type="button" variant="secundario" onClick={cargarMas} disabled={cargandoMas}>
                {cargandoMas ? 'Cargando…' : 'Cargar más'}
              </Button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
