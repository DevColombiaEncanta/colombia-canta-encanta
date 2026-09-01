import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';
import { verifyAdminToken } from '../lib/verifyAdminToken.js';
import { limiterEstricto } from '../middleware/rateLimiters.js';
import { errorGenerico } from '../lib/errores.js';

const router = Router();

// PATCH /nombre — único punto donde un admin recién invitado guarda su propio
// nombre (2026-08-31, a pedido del usuario, para poder mostrar un saludo
// personalizado en el panel). Se llama desde Bienvenida.jsx, ANTES de que
// exista la cookie de sesión propia del panel (esa recién se crea en el login
// normal, ver session.js) — Bienvenida.jsx corre con su propio cliente de
// Supabase en memoria (ver supabaseClient.js, `persistSession: false`), así
// que acá la autenticación es directo contra ESE JWT de Supabase (Authorization:
// Bearer), reusando `verifyAdminToken` — exige aal2, el mismo candado que ya
// protege cualquier cambio sensible de la cuenta, así que solo se puede llamar
// una vez que el MFA está confirmado (o ya estaba activo, en una recuperación).
router.patch('/nombre', limiterEstricto, async (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const { admin, reason } = await verifyAdminToken(token);
  if (!admin) {
    console.error('PATCH /api/admin/perfil/nombre: rechazado -', reason);
    const err = new Error('No autorizado');
    err.status = 401;
    return next(err);
  }

  const { nombre } = req.body || {};
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 80) {
    const err = new Error('Nombre inválido');
    err.status = 400;
    return next(err);
  }

  // Solo la propia fila (`admin.id` sale del JWT ya verificado, no de algo que
  // mande el cliente) — nadie puede tocar el nombre de otro admin desde acá.
  const { error } = await supabase.from('admins').update({ nombre: nombre.trim() }).eq('id', admin.id);
  if (error) {
    return next(errorGenerico(error, 'PATCH /api/admin/perfil/nombre'));
  }

  res.json({ ok: true });
});

export default router;
