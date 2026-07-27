// Traduce las respuestas de la API (snake_case, como vive en Postgres) al camelCase
// que ya usa todo el frontend real (fechaISO, colorHero, waLink...) — una sola capa
// compartida por los endpoints públicos de Fase 4, en vez de reescribir cada
// componente del frontend para consumir snake_case directo.

function snakeToCamel(key) {
  return key
    .replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
    // "iso" es la única sigla real que usa el frontend (fechaISO, no fechaIso) —
    // confirmado revisando todo frontend/src antes de escribir esto.
    .replace(/Iso(?=[A-Z]|$)/g, 'ISO');
}

function esObjetoPlano(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

export function toCamelCase(value) {
  if (Array.isArray(value)) {
    return value.map(toCamelCase);
  }
  if (esObjetoPlano(value)) {
    const resultado = {};
    for (const [key, val] of Object.entries(value)) {
      resultado[snakeToCamel(key)] = toCamelCase(val);
    }
    return resultado;
  }
  return value;
}
