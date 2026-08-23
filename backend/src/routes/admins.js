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
      const err = new Error('Se alcanzó el límite de correos que se pueden enviar en este momento. Esperá unos minutos e intentá de nuevo.');
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

export default router;
