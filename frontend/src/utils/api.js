const API_URL = import.meta.env.VITE_API_URL;

// Wrapper mínimo para los fetch de solo lectura de Fase 4 (endpoints públicos, sin
// credenciales) — 4.1 en adelante lo reutiliza en vez de repetir la URL base y el
// manejo de errores en cada componente.
export async function apiFetch(path) {
  const res = await fetch(`${API_URL}${path}`);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.error || `Error ${res.status} al conectar con la API`);
  }

  return body;
}
