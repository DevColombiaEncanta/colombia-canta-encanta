import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { requireRole } from '../middleware/requireRole.js';
import { limiterEstricto } from '../middleware/rateLimiters.js';
import { logAudit } from '../lib/auditLog.js';
import { errorGenerico } from '../lib/errores.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 5.7 · Único punto de entrada real para aceptar una invitación o recuperar una
// contraseña — Supabase le agrega el token real por su cuenta al hacer clic en
// el link del correo. `FRONTEND_URL` puede traer varios orígenes separados por
// coma (mismo formato que ya usa el CORS de index.js) — se usa el primero.
function urlBienvenida() {
  const primerOrigen = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean)[0];
  return `${primerOrigen}/#/admin/bienvenida`;
}

// GET / — listar admins para la pantalla de gestión. Restringido al maestro,
// igual criterio que crear/activar: el resto de los admins no necesita ver
// quiénes son los demás administradores.
router.get('/', requireRole('admin_maestro'), async (req, res, next) => {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, rol, activo, creado_en')
    .order('creado_en', { ascending: true });

  if (error) {
    return next(errorGenerico(error, 'GET /api/admin/admins'));
  }

  res.json({ ok: true, data });
});

// POST / — invita a un admin nuevo de verdad (5.7, reemplaza el bootstrap por
// contraseña temporal de 2.1/2.8). `inviteUserByEmail` crea el usuario en
// auth.users Y le manda el correo con el link en un solo paso — la persona
// invitada elige su propia contraseña y configura su MFA en /admin/bienvenida,
// nadie más ve ni transporta esa contraseña.
router.post('/', requireCsrf, requireRole('admin_maestro'), limiterEstricto, async (req, res, next) => {
  const { email } = req.body || {};

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    const err = new Error('Email inválido');
    err.status = 400;
    return next(err);
  }

  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: urlBienvenida(),
  });

  if (inviteError) {
    // ⭐ Hallazgo real (probado con un dominio inexistente): a diferencia de
    // `createUser` (usado antes acá), `inviteUserByEmail` sí intenta mandar un
    // correo real y valida que el dominio pueda recibirlo — un typo en el
    // dominio da este código específico. Mostrarlo tal cual, en vez del
    // mensaje genérico, evita que el maestro piense que el servidor falló
    // cuando en realidad escribió mal el correo.
    if (inviteError.code === 'email_address_invalid') {
      const err = new Error('Ese correo no es válido o su dominio no existe — revisa que esté bien escrito.');
      err.status = 400;
      return next(err);
    }
    // ⭐ Hallazgo real (probado en desarrollo, sin proveedor SMTP propio
    // configurado): Supabase limita la cantidad de correos que su servidor
    // compartido puede mandar por hora — invitar a varios admins seguidos (o
    // reintentar rápido tras un typo) puede chocar con esto. Antes de producción
    // real, considerar conectar un proveedor SMTP propio (ver Resend en
    // CLAUDE.md, ya evaluado para los correos transaccionales de Fase 6).
    if (inviteError.code === 'over_email_send_rate_limit') {
      const err = new Error('Se alcanzó el límite de correos que se pueden enviar en este momento. Espera unos minutos e intenta de nuevo.');
      err.status = 429;
      return next(err);
    }
    // ⭐ Hallazgo real (auditoría 5.7): re-invitar un correo que ya existe en
    // Supabase (typo que coincide con un admin real, o un reintento) caía en
    // el mensaje genérico de "error inesperado" — mismo criterio que los 2
    // casos de arriba, mostrar algo accionable en vez de eso.
    if (inviteError.code === 'email_exists') {
      const err = new Error('Ya existe una cuenta con ese correo.');
      err.status = 409;
      return next(err);
    }
    return next(errorGenerico(inviteError, 'POST /api/admin/admins (inviteUserByEmail)'));
  }

  const { data: adminRow, error: insertError } = await supabase
    .from('admins')
    .insert({ user_id: invited.user.id, email, rol: 'admin' })
    .select()
    .single();

  if (insertError) {
    // El usuario en auth.users ya se creó — si no revertimos, queda huérfano (una
    // invitación real mandada, sin fila en `admins` que la respalde). La borramos
    // antes de responder con el error, para no dejar registros sucios.
    const { error: cleanupError } = await supabase.auth.admin.deleteUser(invited.user.id);
    if (cleanupError) {
      console.error(
        'POST /api/admin/admins: fallo el insert en admins Y la limpieza del usuario huérfano -',
        cleanupError.message,
        '- user_id a revisar a mano:',
        invited.user.id
      );
    }
    return next(errorGenerico(insertError, 'POST /api/admin/admins (insert admins)'));
  }

  await logAudit({
    actor: req.admin,
    accion: 'crear',
    entidad: 'admins',
    entidadId: adminRow.id,
    detalle: { email, rol: 'admin' },
  });

  res.status(201).json({ ok: true, admin: adminRow });
});

// POST /:id/reenviar — 5.7, optimización real (2026-08-29): no existía forma de
// reenviar una invitación a alguien que no la completó (ej. nunca le llegó el
// correo, o se trabó a mitad de camino) — reintentar con el mismo email desde
// "Invitar un admin nuevo" siempre fallaba con "Ya existe una cuenta con ese
// correo" (`email_exists`). `inviteUserByEmail` rechaza con ese mismo código
// SIEMPRE que el email ya tenga un usuario en Supabase, sin importar si llegó
// a confirmar algo — no hay ningún método nativo para "reenviar" sobre un
// usuario existente.
//
// ⭐ Hallazgo real (probado con Playwright, no asumido): un primer diseño que
// borraba el usuario viejo ANTES de re-invitar dejaba a la persona sin ningún
// admin — ni el viejo ni uno nuevo — si `inviteUserByEmail` fallaba después
// (límite de correos, dominio inválido). Se corrigió con un paso intermedio
// reversible: primero se LIBERA el email real cambiándolo a uno temporal
// (`updateUserById`, sin borrar nada todavía), se intenta invitar sobre el
// email real ya libre, y solo si eso funciona se borra el usuario viejo (ya
// con el email temporal) y se crea la fila nueva. Si la invitación falla, se
// revierte el email temporal al real y el admin pendiente queda exactamente
// como estaba antes de intentar el reenvío — nunca se pierde.
router.post('/:id/reenviar', requireCsrf, requireRole('admin_maestro'), limiterEstricto, async (req, res, next) => {
  const { id } = req.params;

  const { data: targetAdmin, error: fetchError } = await supabase
    .from('admins')
    .select('id, email, rol, activo, user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !targetAdmin) {
    const err = new Error('Admin no encontrado');
    err.status = 404;
    return next(err);
  }

  if (targetAdmin.rol === 'admin_maestro') {
    const err = new Error('No se puede reenviar una invitación al admin maestro');
    err.status = 403;
    return next(err);
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(targetAdmin.user_id);
  if (userError) {
    return next(errorGenerico(userError, 'POST /api/admin/admins/:id/reenviar (getUserById)'));
  }

  // Si ya inició sesión alguna vez, ya tiene contraseña y MFA propios reales —
  // reenviar acá lo dejaría sin acceso a su cuenta actual sin necesidad. El
  // camino correcto para esa persona es "¿Olvidaste tu contraseña?" del login.
  if (userData.user.last_sign_in_at) {
    const err = new Error('Esta persona ya inició sesión antes — no se puede reenviar la invitación. Si perdió el acceso, tiene que usar "¿Olvidaste tu contraseña?" en el login.');
    err.status = 409;
    return next(err);
  }

  const emailTemporal = `expirado-${targetAdmin.user_id}@invalido.colombiacanta.local`;
  const { error: renameError } = await supabase.auth.admin.updateUserById(targetAdmin.user_id, { email: emailTemporal });
  if (renameError) {
    return next(errorGenerico(renameError, 'POST /api/admin/admins/:id/reenviar (liberar email)'));
  }

  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(targetAdmin.email, {
    redirectTo: urlBienvenida(),
  });

  if (inviteError) {
    // Revertir: el usuario viejo recupera su email real, sigue existiendo tal
    // cual estaba — no se perdió nada por este intento fallido.
    const { error: revertError } = await supabase.auth.admin.updateUserById(targetAdmin.user_id, { email: targetAdmin.email });
    if (revertError) {
      console.error(
        'POST /api/admin/admins/:id/reenviar: la re-invitación falló Y no se pudo revertir el email temporal -',
        revertError.message,
        '- user_id a revisar a mano:',
        targetAdmin.user_id
      );
    }
    if (inviteError.code === 'email_address_invalid') {
      const err = new Error('No se pudo reenviar: ese correo ya no es válido o su dominio no existe.');
      err.status = 400;
      return next(err);
    }
    if (inviteError.code === 'over_email_send_rate_limit') {
      const err = new Error('Se alcanzó el límite de correos que se pueden enviar en este momento. La invitación pendiente de esta persona no se tocó — espera unos minutos e intenta reenviar de nuevo.');
      err.status = 429;
      return next(err);
    }
    // ⭐ Hallazgo real (auditoría 2026-08-30): 2 reenvíos casi simultáneos
    // sobre el mismo admin (doble clic en 2 pestañas, o 2 sesiones de
    // maestro) pasan igual el chequeo de `last_sign_in_at` y ambos liberan el
    // mismo email temporal — recién acá, en `inviteUserByEmail`, Supabase
    // hace de árbitro real (unicidad de email) y el que pierde la carrera
    // recibe `email_exists`, no por un typo. Sin este caso, caía en el
    // mensaje genérico de error inesperado para algo que en realidad es
    // benigno (el otro intento ya lo resolvió). El email temporal ya se
    // revirtió arriba, así que el admin pendiente sigue intacto.
    if (inviteError.code === 'email_exists') {
      const err = new Error('Ya se generó una invitación nueva para este correo (probablemente desde otra pestaña o sesión) — revisa la lista, puede que ya se haya actualizado.');
      err.status = 409;
      return next(err);
    }
    return next(errorGenerico(inviteError, 'POST /api/admin/admins/:id/reenviar (inviteUserByEmail)'));
  }

  // Recién acá es seguro borrar el usuario viejo — ya hay uno nuevo, real e
  // invitado, con el email de verdad.
  const { error: deleteError } = await supabase.auth.admin.deleteUser(targetAdmin.user_id);
  if (deleteError) {
    console.error(
      'POST /api/admin/admins/:id/reenviar: la re-invitación funcionó pero no se pudo borrar el usuario viejo (con email temporal) -',
      deleteError.message,
      '- user_id a revisar a mano:',
      targetAdmin.user_id
    );
  }

  const { data: adminRow, error: insertError } = await supabase
    .from('admins')
    .insert({ user_id: invited.user.id, email: targetAdmin.email, rol: targetAdmin.rol, activo: targetAdmin.activo })
    .select()
    .single();

  if (insertError) {
    const { error: cleanupError } = await supabase.auth.admin.deleteUser(invited.user.id);
    if (cleanupError) {
      console.error(
        'POST /api/admin/admins/:id/reenviar: fallo el insert en admins Y la limpieza del usuario huérfano -',
        cleanupError.message,
        '- user_id a revisar a mano:',
        invited.user.id
      );
    }
    return next(errorGenerico(insertError, 'POST /api/admin/admins/:id/reenviar (insert admins)'));
  }

  await logAudit({
    actor: req.admin,
    accion: 'editar',
    entidad: 'admins',
    entidadId: adminRow.id,
    detalle: { email: targetAdmin.email, reenviado: true, idAnterior: id },
  });

  res.json({ ok: true, admin: adminRow });
});

// PATCH /:id — Desactivar/reactivar un admin. Solo acepta { activo }, nada más. Nunca al admin_maestro.
router.patch('/:id', requireCsrf, requireRole('admin_maestro'), limiterEstricto, async (req, res, next) => {
  const { id } = req.params;
  const body = req.body || {};
  const bodyKeys = Object.keys(body);

  if (bodyKeys.length !== 1 || bodyKeys[0] !== 'activo' || typeof body.activo !== 'boolean') {
    const err = new Error('El body solo puede tener { activo: boolean }');
    err.status = 400;
    return next(err);
  }

  const { data: targetAdmin, error: fetchError } = await supabase
    .from('admins')
    .select('id, rol, activo')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !targetAdmin) {
    const err = new Error('Admin no encontrado');
    err.status = 404;
    return next(err);
  }

  if (targetAdmin.rol === 'admin_maestro') {
    const err = new Error('No se puede desactivar al admin maestro');
    err.status = 403;
    return next(err);
  }

  const { data: updatedAdmin, error: updateError } = await supabase
    .from('admins')
    .update({ activo: body.activo })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return next(errorGenerico(updateError, 'PATCH /api/admin/admins/:id'));
  }

  await logAudit({
    actor: req.admin,
    accion: 'editar',
    entidad: 'admins',
    entidadId: id,
    detalle: { activo: body.activo },
  });

  res.json({ ok: true, admin: updatedAdmin });
});

// DELETE /:id/mfa — 5.7, resuelve el caso "un admin normal pierde su MFA" desde
// el panel, sin tocar Supabase (ver contradicción resuelta en readme_guia.md,
// 2026-08-20). Nunca sobre el admin maestro — nadie tiene rango para resetear
// el suyo, ese caso sigue siendo manual vía dashboard de Supabase a propósito.
// `supabase.auth.admin.mfa` está marcado "experimental" por Supabase — es la
// única vía disponible en el SDK hoy para esto, no hay alternativa estable.
router.delete('/:id/mfa', requireCsrf, requireRole('admin_maestro'), limiterEstricto, async (req, res, next) => {
  const { id } = req.params;

  const { data: targetAdmin, error: fetchError } = await supabase
    .from('admins')
    .select('id, rol, email, user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !targetAdmin) {
    const err = new Error('Admin no encontrado');
    err.status = 404;
    return next(err);
  }

  if (targetAdmin.rol === 'admin_maestro') {
    const err = new Error('No se puede resetear el MFA del admin maestro desde el panel');
    err.status = 403;
    return next(err);
  }

  const { data: factoresData, error: listError } = await supabase.auth.admin.mfa.listFactors({ userId: targetAdmin.user_id });
  if (listError) {
    return next(errorGenerico(listError, 'DELETE /api/admin/admins/:id/mfa (listFactors)'));
  }

  for (const factor of factoresData.factors) {
    const { error: deleteError } = await supabase.auth.admin.mfa.deleteFactor({ id: factor.id, userId: targetAdmin.user_id });
    if (deleteError) {
      return next(errorGenerico(deleteError, 'DELETE /api/admin/admins/:id/mfa (deleteFactor)'));
    }
  }

  await logAudit({
    actor: req.admin,
    accion: 'editar',
    entidad: 'admins',
    entidadId: id,
    detalle: { mfaReseteado: true, email: targetAdmin.email, factoresBorrados: factoresData.factors.length },
  });

  res.json({ ok: true, factoresBorrados: factoresData.factors.length });
});

// DELETE /:id — borra definitivamente a un admin ya desactivado, a pedido del
// usuario (2026-08-31): antes solo se podía desactivar/reactivar, sin forma
// de sacar del todo a alguien que ya no debería aparecer en la lista (ej. una
// persona que dejó el equipo). Solo se permite sobre alguien ya desactivado
// -- un candado extra a propósito, no solo una comprobación técnica: evita
// borrar por error a un admin todavía activo sin pasar primero por
// "Desactivar" (con su propio diálogo de confirmación).
//
// `deleteUser` borra el usuario real de `auth.users`, y la fila de `admins`
// cae sola por el `on delete cascade` de la FK (ver 20260721050030_create_
// admins.sql) -- no hace falta un delete aparte a la tabla `admins`.
router.delete('/:id', requireCsrf, requireRole('admin_maestro'), limiterEstricto, async (req, res, next) => {
  const { id } = req.params;

  const { data: targetAdmin, error: fetchError } = await supabase
    .from('admins')
    .select('id, rol, email, activo, user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !targetAdmin) {
    const err = new Error('Admin no encontrado');
    err.status = 404;
    return next(err);
  }

  if (targetAdmin.rol === 'admin_maestro') {
    const err = new Error('No se puede borrar al admin maestro');
    err.status = 403;
    return next(err);
  }

  if (targetAdmin.activo) {
    const err = new Error('Solo se puede borrar a un admin ya desactivado — desactívalo primero.');
    err.status = 409;
    return next(err);
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(targetAdmin.user_id);
  if (deleteError) {
    return next(errorGenerico(deleteError, 'DELETE /api/admin/admins/:id (deleteUser)'));
  }

  await logAudit({
    actor: req.admin,
    accion: 'borrar',
    entidad: 'admins',
    entidadId: id,
    detalle: { email: targetAdmin.email },
  });

  res.json({ ok: true });
});

export default router;
