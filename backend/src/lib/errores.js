// Mensaje genérico para cualquier error de base de datos que no se haya traducido
// ya a algo específico (ver traducirError() en cada ruta) — nunca se debe devolver
// el mensaje crudo de Postgres al cliente, porque puede revelar nombres reales de
// tablas, columnas o restricciones internas. El error real siempre queda en el log
// del servidor (con el código/detalle completo de Postgres) para poder diagnosticarlo.
export function errorGenerico(error, contexto, status = 400) {
  console.error(`${contexto}:`, error);
  const err = new Error('Ocurrió un error inesperado. Intenta de nuevo más tarde.');
  err.status = status;
  return err;
}
