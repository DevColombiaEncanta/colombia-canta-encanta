const API_URL = import.meta.env.VITE_API_URL;

// Wrapper mínimo para los fetch de Fase 4 (endpoints públicos, sin credenciales) —
// GET de solo lectura desde 4.1, y desde 4.5 también POST con body JSON (ej.
// inscripciones) — misma URL base y manejo de errores en un solo lugar.
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const responseBody = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(responseBody.error || `Error ${res.status} al conectar con la API`);
  }

  return responseBody;
}
