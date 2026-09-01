import { z } from 'zod';

// multer deja todos los campos que no son archivo como texto plano — estos helpers
// traducen ese texto al tipo real antes de que Zod lo valide. Reutilizable por
// cualquier ruta que reciba multipart/form-data (subida de imagen + campos).

export const booleanFromString = z.preprocess((raw) => {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw;
}, z.boolean());

export function jsonArrayField(itemSchema) {
  return z.preprocess((raw) => {
    if (raw === undefined || raw === null || raw === '') return undefined;
    if (typeof raw !== 'string') return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return raw; // deja que z.array() falle con un mensaje claro de tipo inválido
    }
  }, z.array(itemSchema));
}

// ⭐ Agregado en auditoría de Fase 5 (2026-08-31): mismo problema que ya se
// resolvió en `cursos.js` (`precio_numerico`/`matricula_numerico`, ahí con
// JSON real, `null` nativo) pero para rutas multipart, donde TODO llega como
// texto — no existe un `null` real que mandar, solo strings. Sin este
// preprocess, mandar `''` para "borrar el límite" caía en `z.coerce.number()`
// (`Number('') === 0`, falla `.positive()`) en vez de matchear `z.null()`.
// Convierte `''`/`null` crudo a `null` real ANTES de que el `z.union` decida,
// dejando `undefined` (campo ausente del todo) pasar tal cual.
export function nullableNumberFromString(numberSchema) {
  return z.preprocess((raw) => {
    if (raw === undefined) return undefined;
    if (raw === null || raw === '') return null;
    return raw;
  }, z.union([z.null(), numberSchema]));
}

// Elimina claves con valor `undefined` de un objeto ya parseado por un schema `.partial()` —
// Zod puede materializar una clave opcional ausente como `{ clave: undefined }` en vez de
// omitirla del todo, y eso rompe la semántica de PATCH (solo tocar lo que el body sí mandó).
export function stripUndefined(obj) {
  const limpio = { ...obj };
  Object.keys(limpio).forEach((k) => {
    if (limpio[k] === undefined) delete limpio[k];
  });
  return limpio;
}
