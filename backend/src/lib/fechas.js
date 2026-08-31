// Fecha de "hoy" en la zona horaria de Colombia (America/Bogotá, UTC-5, sin
// horario de verano) — el servidor puede correr en cualquier zona horaria (ej.
// UTC en Render), así que nunca hay que usar `new Date().toISOString()`
// directamente para comparar contra columnas `date` (que no llevan hora):
// cerca de la medianoche UTC eso puede adelantar o atrasar el día un día
// completo respecto a Colombia, dando falsos positivos/negativos de "ya pasó".
export function hoyColombia() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}
