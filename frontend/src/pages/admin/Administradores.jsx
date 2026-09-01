import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from '../../components/admin/ui/AdminLayout';
import Card from '../../components/admin/ui/Card';
import FormField from '../../components/admin/ui/FormField';
import Button from '../../components/admin/ui/Button';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import { EMAIL_REGEX } from '../../utils/validacion';
import { formatearFechaHora } from '../../utils/formato';
import './Administradores.css';

const ROL_LABELS = { admin_maestro: 'Maestro', admin: 'Admin' };

export default function Administradores() {
  const { adminFetch, admin } = useAdminAuth();
  const esMaestro = admin?.rol === 'admin_maestro';

  const [admins, setAdmins] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [aviso, setAviso] = useState('');

  const [emailInvitar, setEmailInvitar] = useState('');
  const [invitando, setInvitando] = useState(false);
  const [errorInvitar, setErrorInvitar] = useState('');

  const [confirmandoAccion, setConfirmandoAccion] = useState(null); // { tipo: 'reset'|'desactivar'|'activar'|'reenviar'|'borrar', fila } | null
  const [procesando, setProcesando] = useState(false);
  const [errorFila, setErrorFila] = useState('');

  const cargar = useCallback((cancelObj) => {
    adminFetch('/api/admin/admins')
      .then((data) => {
        if (cancelObj?.cancelado) return;
        setAdmins(data.data);
        setErrorCarga('');
      })
      .catch((err) => { if (!cancelObj?.cancelado) setErrorCarga(err.message); })
      .finally(() => { if (!cancelObj?.cancelado) setCargando(false); });
  }, [adminFetch]);

  // Si no es maestro, el componente corta antes con un `return` propio (ver
  // abajo) sin llegar nunca a renderizar el bloque que usa `cargando` — no
  // hace falta tocar el estado acá para ese caso.
  useEffect(() => {
    if (!esMaestro) return;
    const cancelObj = { cancelado: false };
    cargar(cancelObj);
    return () => { cancelObj.cancelado = true; };
  }, [cargar, esMaestro]);

  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(timer);
  }, [aviso]);

  async function invitar(e) {
    e.preventDefault();
    setErrorInvitar('');
    if (!EMAIL_REGEX.test(emailInvitar.trim())) {
      setErrorInvitar('Ingresa un correo válido');
      return;
    }
    setInvitando(true);
    try {
      const data = await adminFetch('/api/admin/admins', { method: 'POST', body: { email: emailInvitar.trim() } });
      setAdmins((prev) => [...prev, data.admin]);
      setEmailInvitar('');
      setAviso(`Invitación enviada a ${data.admin.email}.`);
    } catch (err) {
      setErrorInvitar(err.message);
    } finally {
      setInvitando(false);
    }
  }

  function pedirConfirmacion(tipo, fila) {
    setErrorFila('');
    setConfirmandoAccion({ tipo, fila });
  }

  async function confirmarAccion() {
    const { tipo, fila } = confirmandoAccion;
    setProcesando(true);
    try {
      if (tipo === 'reset') {
        // ⭐ Hallazgo real (auditoría 5.7): si la persona ya no tenía ningún
        // MFA activo (nunca terminó de inscribirlo, o ya se le había
        // reseteado antes), el backend igual responde "ok" — pero avisar
        // "se reseteó el MFA" ahí sería engañoso, no hubo nada que resetear.
        const data = await adminFetch(`/api/admin/admins/${fila.id}/mfa`, { method: 'DELETE' });
        setAviso(data.factoresBorrados > 0
          ? `Se reseteó el MFA de ${fila.email} — va a tener que configurarlo de nuevo en su próximo inicio de sesión.`
          : `${fila.email} ya no tenía ningún MFA activo — nada que resetear.`);
      } else if (tipo === 'reenviar') {
        // El id cambia (por dentro se borra el usuario sin confirmar y se crea
        // uno nuevo) — se reemplaza la fila vieja por la nueva en su lugar.
        const data = await adminFetch(`/api/admin/admins/${fila.id}/reenviar`, { method: 'POST' });
        setAdmins((prev) => prev.map((a) => (a.id === fila.id ? data.admin : a)));
        setAviso(`Se reenvió la invitación a ${fila.email}.`);
      } else if (tipo === 'borrar') {
        await adminFetch(`/api/admin/admins/${fila.id}`, { method: 'DELETE' });
        setAdmins((prev) => prev.filter((a) => a.id !== fila.id));
        setAviso(`${fila.email} fue borrado de la lista de administradores.`);
      } else {
        const activo = tipo === 'activar';
        const data = await adminFetch(`/api/admin/admins/${fila.id}`, { method: 'PATCH', body: { activo } });
        setAdmins((prev) => prev.map((a) => (a.id === fila.id ? data.admin : a)));
        setAviso(activo ? `${fila.email} fue reactivado.` : `${fila.email} fue desactivado.`);
      }
      setConfirmandoAccion(null);
    } catch (err) {
      setErrorFila(err.message);
      setConfirmandoAccion(null);
    } finally {
      setProcesando(false);
    }
  }

  const TITULOS_CONFIRMACION = {
    reset: (f) => `¿Resetear el MFA de ${f.email}?`,
    desactivar: (f) => `¿Desactivar a ${f.email}?`,
    activar: (f) => `¿Reactivar a ${f.email}?`,
    reenviar: (f) => `¿Reenviar la invitación a ${f.email}?`,
    borrar: (f) => `¿Borrar a ${f.email}?`,
  };
  const MENSAJES_CONFIRMACION = {
    reset: (f) => `${f.email} va a perder el acceso con su código actual y va a tener que configurar uno nuevo la próxima vez que inicie sesión. Úsalo solo si esa persona de verdad perdió su celular o app de autenticación.`,
    desactivar: (f) => `${f.email} no va a poder iniciar sesión en el panel hasta que se lo reactive.`,
    activar: (f) => `${f.email} va a poder volver a iniciar sesión en el panel.`,
    reenviar: (f) => `El link de invitación anterior de ${f.email} queda inválido y se manda uno nuevo. Solo funciona si esa persona todavía no inició sesión ni una vez.`,
    borrar: (f) => `Esta acción no se puede deshacer. ${f.email} desaparece por completo de la lista de administradores — si más adelante necesita volver a tener acceso, hay que invitarlo de nuevo desde cero.`,
  };
  // Este diálogo nació para borrados ("Sí, borrar") — solo la acción "borrar"
  // usa de verdad ese texto por default; el resto lo pisa por tipo.
  const TEXTOS_BOTON_CONFIRMAR = {
    reset: { confirmar: 'Sí, resetear', confirmando: 'Reseteando…' },
    desactivar: { confirmar: 'Sí, desactivar', confirmando: 'Desactivando…' },
    activar: { confirmar: 'Sí, reactivar', confirmando: 'Reactivando…' },
    reenviar: { confirmar: 'Sí, reenviar', confirmando: 'Reenviando…' },
    borrar: { confirmar: 'Sí, borrar', confirmando: 'Borrando…' },
  };

  if (!esMaestro) {
    return (
      <AdminLayout>
        <h1 className="admin-page-titulo">Administradores</h1>
        <p className="admin-page-sub">Esta sección solo está disponible para el admin maestro.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="admin-page-titulo">Administradores</h1>
      <p className="admin-page-sub">Invita nuevos administradores, gestiona su acceso, y resetea su MFA si pierden el celular.</p>

      <Card className="adminsadmin-invitar">
        <h3 className="adminsadmin-seccion-titulo">Invitar un admin nuevo</h3>
        <form onSubmit={invitar} className="adminsadmin-invitar-form">
          <FormField label="Correo">
            <input
              type="email"
              value={emailInvitar}
              onChange={(e) => setEmailInvitar(e.target.value)}
              placeholder="persona@colombiacanta.org"
            />
          </FormField>
          <Button type="submit" disabled={invitando}>{invitando ? 'Enviando…' : 'Enviar invitación'}</Button>
        </form>
        {errorInvitar && <p className="admin-page-error" role="alert">{errorInvitar}</p>}
      </Card>

      {aviso && (
        <p className="admin-form-aviso" role="status">
          <span aria-hidden="true">✓</span> {aviso}
        </p>
      )}
      {errorFila && <p className="admin-page-error" role="alert">{errorFila}</p>}

      {cargando && <p>Cargando…</p>}
      {errorCarga && (
        <p className="admin-page-error">
          No se pudo cargar: {errorCarga}{' '}
          <button onClick={() => { setCargando(true); cargar(); }}>Reintentar</button>
        </p>
      )}

      {!cargando && !errorCarga && (
        <div className="adminsadmin-lista">
          {admins.map((a) => (
            <div className="adminsadmin-fila" key={a.id}>
              <div className="adminsadmin-fila-info">
                <span className="adminsadmin-email" title={a.nombre ? `${a.nombre} · ${a.email}` : a.email}>
                  {a.nombre ? `${a.nombre} · ${a.email}` : a.email}
                </span>
                <span className="adminsadmin-meta">
                  <span className={`adminsadmin-rol adminsadmin-rol-${a.rol}`}>{ROL_LABELS[a.rol] || a.rol}</span>
                  {' · '}
                  <span className={a.activo ? 'adminsadmin-activo' : 'adminsadmin-inactivo'}>{a.activo ? 'Activo' : 'Desactivado'}</span>
                  {' · desde '}{formatearFechaHora(a.creado_en)}
                </span>
              </div>
              {a.rol !== 'admin_maestro' && (
                <div className="adminsadmin-fila-acciones">
                  <Button type="button" variant="secundario" onClick={() => pedirConfirmacion('reenviar', a)}>Reenviar invitación</Button>
                  <Button type="button" variant="secundario" onClick={() => pedirConfirmacion('reset', a)}>Resetear MFA</Button>
                  {a.activo ? (
                    <Button type="button" variant="peligro" onClick={() => pedirConfirmacion('desactivar', a)}>Desactivar</Button>
                  ) : (
                    <>
                      <Button type="button" variant="secundario" onClick={() => pedirConfirmacion('activar', a)}>Reactivar</Button>
                      <Button type="button" variant="peligro" onClick={() => pedirConfirmacion('borrar', a)}>Borrar</Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmandoAccion && (
        <ConfirmDialog
          abierto={!!confirmandoAccion}
          titulo={TITULOS_CONFIRMACION[confirmandoAccion.tipo](confirmandoAccion.fila)}
          mensaje={MENSAJES_CONFIRMACION[confirmandoAccion.tipo](confirmandoAccion.fila)}
          textoConfirmar={TEXTOS_BOTON_CONFIRMAR[confirmandoAccion.tipo].confirmar}
          textoConfirmando={TEXTOS_BOTON_CONFIRMAR[confirmandoAccion.tipo].confirmando}
          onConfirmar={confirmarAccion}
          onCancelar={() => setConfirmandoAccion(null)}
          confirmando={procesando}
        />
      )}
    </AdminLayout>
  );
}
