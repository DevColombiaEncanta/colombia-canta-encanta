const isProd = process.env.NODE_ENV === 'production';

export const ACCESS_COOKIE = 'sb_access_token';
export const REFRESH_COOKIE = 'sb_refresh_token';

// TODO (2.5, 2026-07-21): sameSite pasa a 'lax' en cuanto panel.colombiacanta.org /
// api.colombiacanta.org estén verificados y funcionando (frontend y backend dejan
// de ser cross-site) — ver nota en CLAUDE.md, sección Fase 2.
export const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

export const accessCookieOptions = {
  ...baseCookieOptions,
  maxAge: 60 * 60 * 1000, // 1 hora, igual que el access_token de Supabase
};

export const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
};

// CSRF (2.6): a diferencia de las otras dos, esta cookie NO es httpOnly a propósito —
// el frontend tiene que poder leerla con JS para reenviarla como header en cada
// petición que modifique datos (patrón "double submit cookie").
export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

export const csrfCookieOptions = {
  ...baseCookieOptions,
  httpOnly: false,
  // Ojo (corregido 2026-07-21, antes de construir 2.7): NO usar la misma duración que
  // el access_token (1h) — el refresh se llama justo cuando ese token está por vencer,
  // y si el CSRF expirara al mismo tiempo, bloquearía la propia renovación. Dura lo
  // mismo que el refresh_token, para seguir viva durante toda la sesión real.
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días, igual que refreshCookieOptions
};
