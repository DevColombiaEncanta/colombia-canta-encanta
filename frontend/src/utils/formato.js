const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// El backend solo guarda una fecha real (fecha_publicacion, YYYY-MM-DD); el frontend
// necesita dos variantes ya formateadas en español ("Mar 2026" / "Marzo 2026").
export function formatearFecha(fechaISO) {
  const [anio, mes] = fechaISO.split('-');
  const i = Number(mes) - 1;
  return {
    corta: `${MESES_CORTOS[i]} ${anio}`,
    larga: `${MESES_LARGOS[i]} ${anio}`,
  };
}

export function gradienteDiagonal(colorInicio, colorFin) {
  return `linear-gradient(135deg, ${colorInicio} 0%, ${colorFin} 100%)`;
}
