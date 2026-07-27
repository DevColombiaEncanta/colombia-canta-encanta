import crypto from 'crypto';

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function csrfTokensMatch(cookieToken, headerToken) {
  if (!cookieToken || !headerToken) return false;

  const cookieBuf = Buffer.from(cookieToken);
  const headerBuf = Buffer.from(headerToken);

  if (cookieBuf.length !== headerBuf.length) return false;

  return crypto.timingSafeEqual(cookieBuf, headerBuf);
}
