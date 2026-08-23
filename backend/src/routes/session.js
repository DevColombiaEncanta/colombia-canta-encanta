import { Router } from 'express';
import { supabase, createScopedAuthClient } from '../config/supabaseClient.js';
import { verifyAdminToken } from '../lib/verifyAdminToken.js';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  CSRF_COOKIE,
  baseCookieOptions,
  accessCookieOptions,
  refreshCookieOptions,
  csrfCookieOptions,
} from '../lib/sessionCookies.js';
import { generateCsrfToken } from '../lib/csrf.js';
import { requireCsrf } from '../middleware/requireCsrf.js';

const router = Router();

function unauthorized(next, motivo) {
  console.error('session route: rechazado -', motivo);
  const err = new Error('No autorizado');
  err.status = 401;
  next(err);
}

// 5.1 · Chequeo liviano de sesión — para cuando el panel recarga la página y necesita
// saber si las cookies httpOnly ya puestas siguen siendo válidas, sin tener que
// intentar un login ni un refresh a ciegas. Reutiliza verifyAdminToken, igual que
// requireAdmin.js y el resto de esta ruta.
router.get('/', async (req, res, next) => {
  const accessToken = req.cookies?.[ACCESS_COOKIE];
  if (!accessToken) {
    return unauthorized(next, 'sin cookie de acceso');
  }

  const { admin, reason } = await verifyAdminToken(accessToken);
  if (!admin) {
    return unauthorized(next, reason);
  }

  const csrfToken = req.cookies?.[CSRF_COOKIE];
  res.json({ ok: true, admin, csrfToken });
});

router.post('/', async (req, res, next) => {
  const { access_token, refresh_token } = req.body || {};

  if (!access_token || !refresh_token) {
    const err = new Error('Faltan access_token o refresh_token');
    err.status = 400;
    return next(err);
  }

  const { admin, reason } = await verifyAdminToken(access_token);
  if (!admin) {
    return unauthorized(next, reason);
  }

  const csrfToken = generateCsrfToken();

  res.cookie(ACCESS_COOKIE, access_token, accessCookieOptions);
  res.cookie(REFRESH_COOKIE, refresh_token, refreshCookieOptions);
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions);

  res.json({ ok: true, admin, csrfToken });
});

// 2.7 · Renovar la sesión — el frontend ya no puede hacerlo solo (el refresh token
// vive en una cookie httpOnly), así que este endpoint lo hace por él.
router.post('/refresh', requireCsrf, async (req, res, next) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!refreshToken) {
    return unauthorized(next, 'falta la cookie de refresh token');
  }

  // Cliente aislado a propósito (ver nota en supabaseClient.js) — refreshSession() muta
  // el estado interno de sesión de quien lo llama, y no queremos que eso contamine al
  // `supabase` compartido que el resto del backend usa como service_role.
  const scopedClient = createScopedAuthClient();
  const { data: refreshed, error: refreshError } = await scopedClient.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (refreshError || !refreshed?.session) {
    return unauthorized(next, refreshError?.message || 'refresh token inválido o expirado');
  }

  const { access_token, refresh_token } = refreshed.session;

  // Revalida contra `admins` con el token ya renovado — si desactivaron a este admin
  // justo antes de que expirara su sesión, la renovación también debe bloquearlo.
  const { admin, reason } = await verifyAdminToken(access_token);
  if (!admin) {
    return unauthorized(next, `revalidación post-refresh falló - ${reason}`);
  }

  // El token CSRF también se rota en cada renovación — no es obligatorio, pero acorta
  // la ventana de vida de cualquier valor viejo.
  const csrfToken = generateCsrfToken();

  res.cookie(ACCESS_COOKIE, access_token, accessCookieOptions);
  res.cookie(REFRESH_COOKIE, refresh_token, refreshCookieOptions);
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions);

  res.json({ ok: true, admin, csrfToken });
});

// 2.7 · Logout — revoca la sesión del lado de Supabase (no solo borra las cookies
// locales), para que el access/refresh token dejen de ser válidos de verdad.
router.delete('/', requireCsrf, async (req, res) => {
  const accessToken = req.cookies?.[ACCESS_COOKIE];

  if (accessToken) {
    const { error } = await supabase.auth.admin.signOut(accessToken, 'local');
    if (error) {
      // No bloqueamos el logout local por esto — igual limpiamos las cookies del navegador.
      console.error('DELETE /api/admin/session: no se pudo revocar en Supabase -', error.message);
    }
  }

  res.clearCookie(ACCESS_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions);
  res.clearCookie(CSRF_COOKIE, { ...baseCookieOptions, httpOnly: false });

  res.json({ ok: true });
});

export default router;
