import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { requireRole } from '../middleware/requireRole.js';
import { limiterEstricto } from '../middleware/rateLimiters.js';
import { logAudit } from '../lib/auditLog.js';
import { generateTempPassword } from '../lib/tempPassword.js';
import { errorGenerico } from '../lib/errores.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 2.8 · El admin_maestro crea nuevos admins. `rol` NUNCA viene del body — siempre 'admin'.
router.post('/', requireCsrf, requireRole('admin_maestro'), limiterEstricto, async (req, res, next) => {
  const { email } = req.body || {};

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    const err = new Error('Email inválido');
    err.status = 400;
    return next(err);
  }

  const tempPassword = generateTempPassword();

  const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createUserError) {
    return next(errorGenerico(createUserError, 'POST /api/admin/admins (createUser)'));
  }

  const { data: adminRow, error: insertError } = await supabase
    .from('admins')
    .insert({ user_id: newUser.user.id, email, rol: 'admin' })
    .select()
    .single();

  if (insertError) {
    // El usuario en auth.users ya se creó — si no revertimos, queda huérfano (una cuenta
    // real, con contraseña, sin fila en `admins` que la respalde). La borramos antes de
    // responder con el error, para no dejar registros sucios.
    const { error: cleanupError } = await supabase.auth.admin.deleteUser(newUser.user.id);
    if (cleanupError) {
      console.error(
        'POST /api/admin/admins: fallo el insert en admins Y la limpieza del usuario huérfano -',
        cleanupError.message,
        '- user_id a revisar a mano:',
        newUser.user.id
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

  res.status(201).json({ ok: true, admin: adminRow, temporaryPassword: tempPassword });
});

// 2.8 · Desactivar/reactivar un admin. Solo acepta { activo }, nada más. Nunca al admin_maestro.
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

export default router;
