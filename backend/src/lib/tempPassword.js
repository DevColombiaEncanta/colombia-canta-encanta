import crypto from 'crypto';

// Mismo método usado a mano en 2.1 para el admin_maestro: temporal, hasta que exista
// una vía real de invitación/reset (necesita una página del panel para recibir el link).
export function generateTempPassword() {
  return crypto
    .randomBytes(18)
    .toString('base64')
    .replace(/[+/=]/g, (c) => ({ '+': 'A', '/': 'b', '=': '9' }[c]));
}
