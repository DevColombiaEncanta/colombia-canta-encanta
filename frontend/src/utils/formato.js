const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// `new Date('2026-04-18')` (sin hora) se interpreta como medianoche UTC — en
// zonas horarias con offset negativo (América) eso puede mostrar el día
// anterior. Se parsean los números a mano y se construye la fecha en hora
// local, para que el día de la semana calculado sea siempre el correcto.
export function fechaLocalDesdeISO(fechaISO) {
  const [anio, mes, dia] = fechaISO.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

// 5.3a · Panel admin de Eventos — evita que un admin no técnico tenga que
// escribir a mano 2-3 variantes de la misma fecha, coherentes entre sí
// (`fecha` corta y `fecha_completa` larga en español). Se autogeneran a
// partir de `fecha_iso`/`fecha_iso_fin`, dejando el resultado en un campo de
// texto editable por si hace falta un formato no estándar.
export function formatearFechaEvento(fechaISO, fechaISOFin) {
  if (!fechaISO) return { corta: '', completa: '' };

  const inicio = fechaLocalDesdeISO(fechaISO);
  const diaInicio = inicio.getDate();
  const mesInicio = inicio.getMonth();
  const anioInicio = inicio.getFullYear();

  if (!fechaISOFin || fechaISOFin === fechaISO) {
    return {
      corta: `${diaInicio} ${MESES_CORTOS[mesInicio]} ${anioInicio}`,
      completa: `${DIAS_SEMANA[inicio.getDay()]} ${diaInicio} de ${MESES_LARGOS[mesInicio].toLowerCase()} de ${anioInicio}`,
    };
  }

  const fin = fechaLocalDesdeISO(fechaISOFin);
  const diaFin = fin.getDate();
  const mesFin = fin.getMonth();
  const anioFin = fin.getFullYear();

  // Mismo mes y año — el caso real más común (ej. Festival: 23-26 jul 2026).
  if (mesInicio === mesFin && anioInicio === anioFin) {
    return {
      corta: `${diaInicio}-${diaFin} ${MESES_CORTOS[mesInicio]} ${anioInicio}`,
      completa: `Del ${diaInicio} al ${diaFin} de ${MESES_LARGOS[mesInicio].toLowerCase()} de ${anioInicio}`,
    };
  }

  // Cruza de mes o año — caso raro, se arma explícito en vez de forzar el formato de arriba.
  const { corta: cortaFin, completa: completaFin } = formatearFechaEvento(fechaISOFin);
  const cortaInicio = `${diaInicio} ${MESES_CORTOS[mesInicio]} ${anioInicio}`;
  const completaInicio = `${DIAS_SEMANA[inicio.getDay()]} ${diaInicio} de ${MESES_LARGOS[mesInicio].toLowerCase()} de ${anioInicio}`;
  return {
    corta: `${cortaInicio} - ${cortaFin}`,
    completa: `Del ${completaInicio} al ${completaFin}`,
  };
}

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

// El backend guarda producto.precio como número real (COP) — el frontend solo
// necesita formatearlo para mostrarlo, ya no parsearlo desde un string.
export function formatCOP(numero) {
  return '$' + numero.toLocaleString('es-CO');
}

// 5.4 segunda ronda — bug real reportado por el usuario: `<input type="number">`
// usa "." como separador DECIMAL (nunca de miles), así que escribir "30.000"
// (formato colombiano de miles) se guardaba como 30. Ese mismo input también
// deja escribir notación científica ("e"). Se reemplaza por texto + limpieza
// manual: solo dígitos, sin trampas de locale ni notación científica posible.
// Extraído acá en la auditoría de 5.5 (2026-08-19) — vivía copiado a mano,
// idéntico, en Productos.jsx/Cursos.jsx/Inscripciones.jsx (admin).
export function soloDigitos(valor) {
  return valor.replace(/\D/g, '');
}
export function formatMiles(digitos) {
  if (!digitos && digitos !== 0) return '';
  return Number(digitos).toLocaleString('es-CO');
}

// 5.5 · Extraído acá (vivía solo en Inscripciones.jsx admin) — 5.6 lo reutiliza
// en Reservas e Historial. Pese al nombre, muestra solo la fecha (día/mes/año);
// se mantiene así para no tocar las pantallas que ya dependen de este formato.
export function formatearFechaHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

// 5.6 · Reservas: `formatearFechaHora` de arriba está pensado para timestamps
// completos (`creado_en`, con hora y offset real) — usarlo tal cual sobre una
// fecha "pura" (`fecha_iso` de eventos, sin hora) reproduce el mismo bug de
// zona horaria que `fechaLocalDesdeISO` ya resuelve arriba (`new Date('2026-09-15')`
// se interpreta como medianoche UTC y en Colombia, UTC-5, muestra el 14).
export function formatearFechaSolo(fechaISO) {
  if (!fechaISO) return '—';
  return fechaLocalDesdeISO(fechaISO).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

// 5.6 · Historial: a diferencia del resto del panel, acá sí importa la hora
// exacta — dos ediciones sobre la misma entidad el mismo día necesitan poder
// distinguirse cronológicamente en la lista.
export function formatearFechaHoraCompleta(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
