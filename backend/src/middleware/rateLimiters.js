import rateLimit from 'express-rate-limit';

// ⭐ Hallazgo real (2026-08-14, uso real del panel): 100 peticiones/15min por IP
// es un límite pensado para frenar abuso, pero se aplica a TODO (index.js:44),
// incluidos los GET públicos de solo lectura del sitio y las revisiones de
// sesión del panel. Una sola carga del home ya dispara ~4 peticiones (hero,
// eventos, eventos-fijos, noticias), y en desarrollo React StrictMode las
// duplica; navegar unas cuantas pantallas del panel agotaba el cupo en minutos
// y dejaba al admin bloqueado con 429 en TODO, incluida su propia sesión.
export const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta de nuevo en unos minutos.' },
});

export const limiterEstricto = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, intenta de nuevo en unos minutos.' },
});
