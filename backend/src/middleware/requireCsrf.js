import { CSRF_COOKIE, CSRF_HEADER } from '../lib/sessionCookies.js';
import { csrfTokensMatch } from '../lib/csrf.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!csrfTokensMatch(cookieToken, headerToken)) {
    console.error('requireCsrf: acceso rechazado - token CSRF ausente o no coincide');
    const err = new Error('No autorizado');
    err.status = 403;
    return next(err);
  }

  next();
}
