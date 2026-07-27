import { verifyAdminToken } from '../lib/verifyAdminToken.js';
import { ACCESS_COOKIE } from '../lib/sessionCookies.js';

export async function requireAdmin(req, res, next) {
  const unauthorized = (motivo) => {
    console.error('requireAdmin: acceso rechazado -', motivo);
    const err = new Error('No autorizado');
    err.status = 401;
    next(err);
  };

  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) {
    return unauthorized('falta la cookie de sesión');
  }

  const { admin, reason } = await verifyAdminToken(token);
  if (!admin) {
    return unauthorized(reason);
  }

  req.admin = admin;
  next();
}
