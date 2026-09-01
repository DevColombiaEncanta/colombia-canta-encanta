import { z } from 'zod';

// ⭐ Extraído en la auditoría general de Fase 5 (2026-09-01): `auditLog.js` ya
// paginaba (offset/limit reales, con un tope máximo) porque `audit_log` crece
// sin límite con el uso real del panel y nadie la "gestiona" ni la limpia —
// el mismo razonamiento aplica a `inscripciones`, `reservas` y `pedidos`
// (las 3 se alimentan de envíos públicos, no de contenido que el admin cargue
// a mano como Cursos/Productos/Eventos). Se comparte acá en vez de repetir la
// misma lógica 4 veces.
export const LIMITE_DEFECTO = 50;
export const LIMITE_MAXIMO = 200;

export const paginacionSchema = z.object({
  offset: z.coerce.number().int().nonnegative().optional().default(0),
  limit: z.coerce.number().int().positive().max(LIMITE_MAXIMO).optional().default(LIMITE_DEFECTO),
});

// Pide `limit + 1` filas vía `.range()` para saber si hay una página
// siguiente sin pagar el costo de un `COUNT(*)` aparte sobre una tabla que
// solo crece.
export function aplicarRango(query, offset, limit) {
  return query.range(offset, offset + limit);
}

export function empaquetarPagina(data, limit) {
  const hayMas = data.length > limit;
  return { data: hayMas ? data.slice(0, limit) : data, hayMas };
}
