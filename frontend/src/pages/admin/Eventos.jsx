import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useListaDinamica } from '../../hooks/useListaDinamica';
import { useScrollAlSeleccionar } from '../../hooks/useScrollAlSeleccionar';
import { formatearFechaEvento } from '../../utils/formato';
import AdminLayout from '../../components/admin/ui/AdminLayout';
import Card from '../../components/admin/ui/Card';
import FormField from '../../components/admin/ui/FormField';
import Checkbox from '../../components/admin/ui/Checkbox';
import Button from '../../components/admin/ui/Button';
import ImageUploadField from '../../components/admin/ui/ImageUploadField';
import GaleriaUploadField from '../../components/admin/ui/GaleriaUploadField';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import HelpTooltip from '../../components/admin/ui/HelpTooltip';
import './Eventos.css';

// Ajuste 2026-08-16 (pedido del usuario): `tipo` pasó a ser texto libre en el
// backend (la lista real de tipos puede crecer) — estos 3 quedan solo como
// sugerencias iniciales de un `<datalist>`, no como las únicas opciones.
const TIPOS_SUGERIDOS = ['Gira USA', 'Sede', 'Festival'];
const LIMITE_CTA = 35;
const LIMITE_CTA_WA = 18;

function hoyISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

// 5.3a · Selector guiado en vez de exponer `accion_tipo` crudo (decisión con
// el usuario, 2026-08-15) — cada camino real confirmado contra ejemplos
// reales del sitio (ver pre-análisis en readme_guia.md): 'libre' conecta a
// reservas reales, 'festival' usa un link externo (confirmado con el
// Festival Nacional real, que linkea a un Google Form), 'proximamente' deja
// el botón deshabilitado. El camino 'pago' sigue simulado hasta que exista
// Mercado Pago (4.6b) — ese aviso se sacó de acá a pedido del usuario
// (2026-08-16, no confundir al admin con un detalle técnico interno) y queda
// solo anotado como pendiente en `readme_guia.md`, Fase 6.
const CAMINOS_RESERVA = [
  { valor: 'libre', titulo: 'Gratis', descripcion: 'Se conecta a una reserva real y gratuita.' },
  { valor: 'pago', titulo: 'De pago', descripcion: 'Con precio y zonas disponibles.' },
  { valor: 'festival', titulo: 'Convocatoria', descripcion: 'Usa un formulario externo (ej. Google Forms) en vez de reservar aquí.' },
  { valor: 'proximamente', titulo: 'Próximamente', descripcion: 'Todavía no se puede reservar — el botón queda deshabilitado.' },
];

// Precio "de vitrina" que ya espera el sitio público para los 3 caminos que
// no cobran de verdad (ver ReservaModal.jsx: compara `evento.precio` contra
// estos 3 textos exactos para decidir si mostrar "Continuar al pago" o no) —
// se autocompletan y se bloquean para que el admin no pueda escribir algo
// fuera de esa convención (antes se podía escribir cualquier cosa ahí, ej.
// "5fg", hallazgo real del usuario 2026-08-16).
const PRECIO_AUTOMATICO = {
  libre: 'Entrada libre',
  proximamente: 'Próximamente',
  festival: 'Convocatoria abierta',
};

// Ajuste 2026-08-16 (pedido del usuario, tras ver un precio escrito como
// "5fg"): el precio en "De pago" deja de ser texto libre — pasa a ser un
// monto numérico (el `<input type="number">` ya hace imposible escribir
// letras) + una moneda elegida, por defecto pesos colombianos. Alcance de
// monedas confirmado con el usuario: Colombia, USD y el resto de LATAM se
// decide más adelante (Fase 6, junto con Mercado Pago) — acá se cubren las
// 2 monedas que ya aparecen en datos reales/históricos del sitio.
const MONEDAS = [
  { valor: 'COP', label: 'COP', sufijo: '' },
  { valor: 'USD', label: 'USD', sufijo: ' USD' },
];

function formatearMonto(monto, moneda) {
  const numero = Number(monto);
  if (!monto || Number.isNaN(numero) || numero <= 0) return '';
  const m = MONEDAS.find((x) => x.valor === moneda) || MONEDAS[0];
  return `$${numero.toLocaleString('es-CO')}${m.sufijo}`;
}

// Para precargar el monto/moneda al editar un evento cuyo precio ya quedó
// guardado como texto compuesto (ej. "$45.000" o "Desde $35,99 USD").
//
// ⭐ Hallazgo real (auditoría 5.3, 2026-08-16): la versión anterior sacaba
// TODOS los dígitos con `replace(/[^0-9]/g, '')`, sin distinguir el punto de
// miles de la coma decimal que pone `formatearMonto` (formato es-CO) — un
// precio con centavos como "$35,99 USD" se convertía en monto "3599" al
// releerlo (perdía la coma Y el orden de magnitud), corrompiendo lo que el
// admin acababa de escribir en cada tecleo (el campo de monto se recalcula
// desde `form.precio` en cada render). Ahora se conserva el primer tramo
// numérico completo (dígitos + separadores) y se invierte el formato es-CO
// (`.` = miles, `,` = decimales) al revés de como lo arma `formatearMonto`.
function parsePrecioCompuesto(texto) {
  if (!texto) return { monto: '', moneda: 'COP' };
  const moneda = /usd/i.test(texto) ? 'USD' : 'COP';
  const tramoNumerico = texto.match(/[\d.,]+/)?.[0] || '';
  const monto = tramoNumerico.replace(/\./g, '').replace(',', '.');
  return { monto, moneda };
}

// Ajuste 2026-08-16 (pedido del usuario): sugerencias de texto de botón para
// los caminos que no son "De pago" — se completan solas pero se pueden
// seguir editando (a diferencia de "Próximamente", que sí se bloquea porque
// el sitio público ignora ese texto de todos modos, ver más abajo).
const CTA_SUGERIDO = {
  libre: 'Reservar',
  festival: 'Inscribirme', // mismo texto que ya usa EventoDetalle.jsx como respaldo
};

function formularioDesdeEvento(evento) {
  if (!evento) {
    return {
      titulo: '', tipo: '', ciudad: '', lugar: '', direccion: '',
      fechaIso: '', fechaIsoFin: '', hora: '', puertas: '', fecha: '', fechaCompleta: '',
      descripcion: '', descripcionLarga: '',
      accionTipo: '', cta: '', ctaWa: '', waLink: '', precio: '', precioDetalle: '',
      inscripcionLink: '', inscripcionCerrada: false, bases: '',
      color: '#1A56DB', colorHero: '#0F3A9E', maxEntradas: '', destacadoHero: false, activo: true,
    };
  }
  return {
    titulo: evento.titulo, tipo: evento.tipo, ciudad: evento.ciudad, lugar: evento.lugar, direccion: evento.direccion,
    fechaIso: evento.fecha_iso || '', fechaIsoFin: evento.fecha_iso_fin || '', hora: evento.hora || '', puertas: evento.puertas || '',
    fecha: evento.fecha || '', fechaCompleta: evento.fecha_completa || '',
    descripcion: evento.descripcion, descripcionLarga: evento.descripcion_larga,
    accionTipo: evento.accion_tipo, cta: evento.cta, ctaWa: evento.cta_wa || '', waLink: evento.wa_link || '',
    precio: evento.precio, precioDetalle: evento.precio_detalle || '',
    inscripcionLink: evento.inscripcion_link || '', inscripcionCerrada: evento.inscripcion_cerrada || false, bases: evento.bases || '',
    color: evento.color, colorHero: evento.color_hero, maxEntradas: evento.max_entradas || '',
    destacadoHero: evento.destacado_hero || false, activo: evento.activo,
  };
}

// Formulario en su propio componente, montado con `key` por evento seleccionado
// (mismo criterio ya usado en Hero/Noticias, 5.2 — el estado se reinicia solo
// al cambiar de selección, sin useEffect de sincronización).
function EventoForm({ evento, tiposSugeridos, onGuardado, onBorrado, onAviso, aviso, adminFetch }) {
  const [form, setForm] = useState(() => formularioDesdeEvento(evento));
  const [archivoImg, setArchivoImg] = useState(null);
  const [archivosGaleria, setArchivosGaleria] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);
  // Moneda compartida entre el precio general y las zonas (un evento no
  // debería tener zonas en 2 monedas distintas) — se precarga del precio ya
  // guardado si se está editando.
  const [monedaPrecio, setMonedaPrecio] = useState(() => parsePrecioCompuesto(evento?.precio).moneda);

  const pills = useListaDinamica(evento?.pills || []);
  const zonas = useListaDinamica(evento?.zonas || []);
  const testimonios = useListaDinamica(evento?.testimonios || []);
  const programa = useListaDinamica(evento?.programa || []);

  function actualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  // Ajuste 2026-08-16 (pedido del usuario): antes se podían escribir a mano
  // (con un botón "Regenerar" para volver a autogenerar). Ahora se calculan
  // siempre solas al elegir la fecha — sin escape hatch manual, porque el
  // caso que lo justificaba (fechas multi-día tipo "23-26 Jul 2026") ya lo
  // cubre `formatearFechaEvento()` automáticamente.
  function actualizarFechaIso(valor) {
    setForm((f) => {
      const { corta, completa } = formatearFechaEvento(valor, f.fechaIsoFin);
      return { ...f, fechaIso: valor, fecha: corta, fechaCompleta: completa };
    });
  }

  function actualizarFechaIsoFin(valor) {
    setForm((f) => {
      const { corta, completa } = formatearFechaEvento(f.fechaIso, valor);
      return { ...f, fechaIsoFin: valor, fecha: corta, fechaCompleta: completa };
    });
  }

  function agregarPillsAutomaticas() {
    if (form.fechaCompleta) pills.agregar({ icono: '📅', texto: form.fechaCompleta });
    if (form.hora) pills.agregar({ icono: '🕐', texto: form.hora });
    if (form.lugar || form.ciudad) {
      pills.agregar({ icono: '📍', texto: form.lugar ? `${form.lugar} · ${form.ciudad}` : form.ciudad });
    }
  }

  // Ajuste 2026-08-16 (pedido del usuario): las 3 etiquetas de fecha/hora/
  // lugar quedan predefinidas solas apenas hay suficiente info para armarlas
  // en un evento NUEVO — el admin las sigue pudiendo editar o borrar después
  // (el botón "+ Etiquetas de fecha/hora/lugar" de abajo queda como respaldo
  // manual, por si la hora se completa más tarde). En edición no se toca
  // nada de lo que ya tiene el evento.
  const pillsAutoAgregadas = useRef(false);
  useEffect(() => {
    if (evento || pillsAutoAgregadas.current) return;
    if (pills.items.length > 0) return;
    if (!form.fechaCompleta || !(form.lugar || form.ciudad)) return;
    pillsAutoAgregadas.current = true;
    agregarPillsAutomaticas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento, form.fechaCompleta, form.hora, form.lugar, form.ciudad]);

  // Ajuste 2026-08-16 (pedido del usuario): "Entrada libre"/"Próximamente"/
  // "Convocatoria abierta" son valores de vitrina, no texto libre — se
  // autocompletan y el campo queda bloqueado salvo en "De pago" (ver
  // PRECIO_AUTOMATICO arriba). Lo mismo para el texto del botón (y su
  // versión corta) en "Próximamente": el sitio público ya ignora `cta`/
  // `ctaWa` y siempre muestra "Próximamente" ahí (ver `esProximamente` en
  // EventoDetalle.jsx), así que editarlos no tenía ningún efecto visible —
  // se autocompletan y se bloquean. Para "Gratis"/"Convocatoria" el texto
  // del botón se sugiere solo (`CTA_SUGERIDO`) pero queda editable, y solo si
  // el campo estaba vacío (no pisa algo que el admin ya haya escrito). Se
  // hace directo en el click (no en un `useEffect` reaccionando al cambio de
  // `accionTipo`) para no encadenar un setState dentro de un efecto.
  function seleccionarCamino(valor) {
    setForm((f) => {
      let cta = f.cta;
      if (valor === 'proximamente') cta = 'Próximamente';
      else if (!f.cta.trim() && CTA_SUGERIDO[valor]) cta = CTA_SUGERIDO[valor];
      return {
        ...f,
        accionTipo: valor,
        precio: PRECIO_AUTOMATICO[valor] ?? f.precio,
        cta,
        ctaWa: valor === 'proximamente' ? 'Próximamente' : f.ctaWa,
      };
    });
  }

  function cambiarMonedaPrecio(nuevaMoneda) {
    setMonedaPrecio(nuevaMoneda);
    const montoActual = parsePrecioCompuesto(form.precio).monto;
    if (montoActual) actualizarCampo('precio', formatearMonto(montoActual, nuevaMoneda));
  }

  function cambiarMontoPrecio(nuevoMonto) {
    actualizarCampo('precio', formatearMonto(nuevoMonto, monedaPrecio));
  }

  // Sugerencia manual (no automática/continua, para no pisar una redacción
  // propia como "Boletas desde $45.000") — toma el precio más bajo entre las
  // zonas cargadas. Responde a la pregunta del usuario sobre si el precio
  // general se puede derivar de las zonas: sí, como sugerencia con un clic.
  function sugerirPrecioDesdeZonas() {
    const montos = zonas.items
      .map((z) => Number(parsePrecioCompuesto(z.precio).monto))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (montos.length === 0) return;
    const minimo = formatearMonto(Math.min(...montos), monedaPrecio);
    if (minimo) actualizarCampo('precio', `Desde ${minimo}`);
  }

  function validar() {
    const nuevosErrores = {};
    if (!form.titulo.trim()) nuevosErrores.titulo = 'El título es obligatorio';
    if (!form.tipo.trim()) nuevosErrores.tipo = 'El tipo es obligatorio';
    if (!form.ciudad.trim()) nuevosErrores.ciudad = 'La ciudad es obligatoria';
    if (!form.lugar.trim()) nuevosErrores.lugar = 'El lugar es obligatorio';
    if (!form.direccion.trim()) nuevosErrores.direccion = 'La dirección es obligatoria';
    if (!form.fechaIso) {
      nuevosErrores.fechaIso = 'La fecha es obligatoria';
    } else if (form.fechaIso < hoyISO()) {
      nuevosErrores.fechaIso = 'No puedes elegir una fecha pasada';
    }
    if (form.fechaIsoFin && form.fechaIso && form.fechaIsoFin < form.fechaIso) {
      nuevosErrores.fechaIsoFin = 'No puede ser antes de la fecha de inicio';
    }
    if (!form.descripcion.trim()) nuevosErrores.descripcion = 'La descripción corta es obligatoria';
    if (!form.descripcionLarga.trim()) nuevosErrores.descripcionLarga = 'La descripción larga es obligatoria';
    if (!form.accionTipo) nuevosErrores.accionTipo = 'Selecciona cómo se reserva este evento';
    if (!form.cta.trim()) nuevosErrores.cta = 'El texto del botón es obligatorio';
    if (!form.precio.trim()) nuevosErrores.precio = 'El precio es obligatorio (ej. "Entrada libre")';
    if (!evento && !archivoImg) nuevosErrores.img = 'La imagen es obligatoria';

    // ⭐ Hallazgo real (revisión crítica 5.3a, 2026-08-16): una fila con SOLO
    // uno de los 2 campos requeridos lleno (ej. nombre de zona sin precio) se
    // descartaba en silencio al guardar — el admin perdía lo que ya había
    // escrito sin ningún aviso. Las filas totalmente vacías se siguen
    // ignorando sin drama (son el estado inicial de "+ Agregar"); solo las
    // filas a medio llenar bloquean el guardado, mismo criterio que ya usa
    // el CTA del Hero.
    if (form.accionTipo === 'pago') {
      const zonaErrores = {};
      zonas.items.forEach((z, idx) => {
        const tieneAlgo = z.nombre.trim() || z.precio.trim();
        const completo = z.nombre.trim() && z.precio.trim();
        if (tieneAlgo && !completo) zonaErrores[idx] = 'Completa nombre y precio, o borra la fila';
      });
      if (Object.keys(zonaErrores).length > 0) nuevosErrores.zonas = zonaErrores;
    }
    const testimonioErrores = {};
    testimonios.items.forEach((t, idx) => {
      const tieneAlgo = t.texto.trim() || t.nombre.trim();
      const completo = t.texto.trim() && t.nombre.trim();
      if (tieneAlgo && !completo) testimonioErrores[idx] = 'Completa el testimonio y el nombre, o borra la fila';
    });
    if (Object.keys(testimonioErrores).length > 0) nuevosErrores.testimonios = testimonioErrores;

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function guardar(e) {
    e.preventDefault();
    if (!validar()) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      const fd = new FormData();
      fd.append('titulo', form.titulo);
      fd.append('tipo', form.tipo);
      fd.append('ciudad', form.ciudad);
      fd.append('lugar', form.lugar);
      fd.append('direccion', form.direccion);
      fd.append('fecha_iso', form.fechaIso);
      if (form.fechaIsoFin) fd.append('fecha_iso_fin', form.fechaIsoFin);
      if (form.hora) fd.append('hora', form.hora);
      if (form.puertas) fd.append('puertas', form.puertas);
      fd.append('fecha', form.fecha || form.fechaIso);
      fd.append('fecha_completa', form.fechaCompleta || form.fecha || form.fechaIso);
      fd.append('descripcion', form.descripcion);
      fd.append('descripcion_larga', form.descripcionLarga);
      fd.append('accion_tipo', form.accionTipo);
      fd.append('cta', form.cta);
      if (form.ctaWa) fd.append('cta_wa', form.ctaWa);
      if (form.waLink) fd.append('wa_link', form.waLink);
      fd.append('precio', form.precio);
      if (form.accionTipo === 'pago' && form.precioDetalle) fd.append('precio_detalle', form.precioDetalle);
      if (form.accionTipo === 'festival') {
        if (form.inscripcionLink) fd.append('inscripcion_link', form.inscripcionLink);
        fd.append('inscripcion_cerrada', String(form.inscripcionCerrada));
        if (form.bases) fd.append('bases', form.bases);
      }
      fd.append('color', form.color);
      fd.append('color_hero', form.colorHero);
      // Convocatoria y Próximamente no reservan entradas acá adentro (pedido
      // del usuario, 2026-08-16) — no tiene sentido mandar un límite que
      // nunca se usa.
      if (form.maxEntradas && (form.accionTipo === 'libre' || form.accionTipo === 'pago')) {
        fd.append('max_entradas', String(form.maxEntradas));
      }
      fd.append('destacado_hero', String(form.destacadoHero));
      if (evento) fd.append('activo', String(form.activo));

      const pillsLimpias = pills.items.filter((p) => p.texto.trim());
      if (pillsLimpias.length > 0) fd.append('pills', JSON.stringify(pillsLimpias));
      const zonasLimpias = (form.accionTipo === 'pago' ? zonas.items : []).filter((z) => z.nombre.trim() && z.precio.trim());
      if (zonasLimpias.length > 0) fd.append('zonas', JSON.stringify(zonasLimpias));
      const testimoniosLimpios = testimonios.items.filter((t) => t.texto.trim() && t.nombre.trim());
      if (testimoniosLimpios.length > 0) fd.append('testimonios', JSON.stringify(testimoniosLimpios));
      const programaLimpio = programa.items.filter((p) => p.trim());
      if (programaLimpio.length > 0) fd.append('programa', JSON.stringify(programaLimpio));

      if (archivoImg) fd.append('img', archivoImg);
      archivosGaleria.forEach((archivo) => fd.append('galeria', archivo));

      if (evento) {
        const data = await adminFetch(`/api/admin/eventos/${evento.id}`, { method: 'PATCH', body: fd });
        onGuardado(data.data, false);
        onAviso('Cambios guardados.');
      } else {
        const data = await adminFetch('/api/admin/eventos', { method: 'POST', body: fd });
        onGuardado(data.data, true);
        onAviso('Evento creado.');
      }
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    setBorrando(true);
    try {
      await adminFetch(`/api/admin/eventos/${evento.id}`, { method: 'DELETE' });
      onBorrado();
      onAviso('Evento borrado.');
      setConfirmandoBorrar(false);
    } catch (err) {
      setErrorGeneral(err.message);
      setConfirmandoBorrar(false);
    } finally {
      setBorrando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={guardar} noValidate>
        <h2 className="eventos-form-titulo">{evento ? 'Editar evento' : '+ Crear nuevo evento'}</h2>

        {evento && (
          <div className="admin-form-top">
            <Checkbox
              label="Evento visible en el sitio (activo)"
              checked={form.activo}
              onChange={(e) => actualizarCampo('activo', e.target.checked)}
            />
          </div>
        )}

        {/* ── Datos básicos ── */}
        <h3 className="eventos-seccion-titulo">Datos básicos</h3>
        <FormField label="Título" error={errores.titulo}>
          <input type="text" value={form.titulo} onChange={(e) => actualizarCampo('titulo', e.target.value)} className={errores.titulo ? 'invalido' : ''} />
        </FormField>
        <div className="admin-field-fila">
          <FormField label="Tipo" error={errores.tipo}>
            <input
              type="text"
              list="eventos-tipos-sugeridos"
              value={form.tipo}
              onChange={(e) => actualizarCampo('tipo', e.target.value)}
              className={errores.tipo ? 'invalido' : ''}
              placeholder="Ej. Gira USA"
            />
            <datalist id="eventos-tipos-sugeridos">
              {tiposSugeridos.map((t) => <option key={t} value={t} />)}
            </datalist>
          </FormField>
          <FormField label="Ciudad" error={errores.ciudad}>
            <input type="text" value={form.ciudad} onChange={(e) => actualizarCampo('ciudad', e.target.value)} className={errores.ciudad ? 'invalido' : ''} />
          </FormField>
        </div>
        <div className="admin-field-fila">
          <FormField
            label="Lugar"
            error={errores.lugar}
            ayuda="El recinto o espacio donde se realiza el evento."
            ayudaEjemplo="Teatro Metropolitano, Parque de las Luces, Complejo Ferial Nashville"
          >
            <input type="text" value={form.lugar} onChange={(e) => actualizarCampo('lugar', e.target.value)} className={errores.lugar ? 'invalido' : ''} />
          </FormField>
          <FormField label="Dirección" error={errores.direccion}>
            <input type="text" value={form.direccion} onChange={(e) => actualizarCampo('direccion', e.target.value)} className={errores.direccion ? 'invalido' : ''} />
          </FormField>
        </div>

        {/* ── Fecha y hora ── */}
        <h3 className="eventos-seccion-titulo">Fecha y hora</h3>
        <div className="admin-field-fila">
          <FormField label="Fecha" error={errores.fechaIso}>
            <input type="date" min={hoyISO()} value={form.fechaIso} onChange={(e) => actualizarFechaIso(e.target.value)} className={errores.fechaIso ? 'invalido' : ''} />
          </FormField>
          <FormField label="Fecha de fin" hint="opcional, solo si dura varios días" error={errores.fechaIsoFin}>
            <input type="date" min={form.fechaIso || hoyISO()} value={form.fechaIsoFin} onChange={(e) => actualizarFechaIsoFin(e.target.value)} className={errores.fechaIsoFin ? 'invalido' : ''} />
          </FormField>
        </div>
        <div className="admin-field-fila">
          <FormField label="Hora" hint="opcional">
            <input type="time" value={form.hora} onChange={(e) => actualizarCampo('hora', e.target.value)} />
          </FormField>
          <FormField label="Apertura de puertas" hint="opcional">
            <input type="time" value={form.puertas} onChange={(e) => actualizarCampo('puertas', e.target.value)} />
          </FormField>
        </div>
        {form.fechaCompleta && (
          <p className="eventos-fecha-preview">
            Se va a mostrar como <strong>{form.fecha}</strong> (tarjetas) y <strong>{form.fechaCompleta}</strong> (detalle) — se calcula solo desde la fecha de arriba.
          </p>
        )}

        {/* ── Contenido ── */}
        <h3 className="eventos-seccion-titulo">Contenido</h3>
        <FormField
          label="Descripción corta"
          hint="se muestra en las tarjetas de vista previa"
          error={errores.descripcion}
          ayuda="Un resumen de 1-2 frases: qué es el evento y por qué ir."
          ayudaEjemplo="Los equipos de baile que participan, el estilo musical, o qué hace especial a este evento"
        >
          <textarea value={form.descripcion} onChange={(e) => actualizarCampo('descripcion', e.target.value)} className={errores.descripcion ? 'invalido' : ''} />
        </FormField>
        <FormField
          label="Descripción larga"
          hint="se muestra en el detalle del evento — usa un párrafo en blanco para separar en varios bloques"
          error={errores.descripcionLarga}
          ayuda="El detalle completo: qué va a encontrar el público."
          ayudaEjemplo="Equipos o artistas invitados, actividades incluidas, recomendaciones (ropa, llegar temprano), qué esperar si es primera vez"
        >
          <textarea value={form.descripcionLarga} onChange={(e) => actualizarCampo('descripcionLarga', e.target.value)} className={errores.descripcionLarga ? 'invalido' : ''} style={{ minHeight: 140 }} />
        </FormField>

        <ListaDinamicaSimple
          titulo="Programa (opcional)"
          ayuda="Elementos sueltos que se muestran como etiquetas, ej. los ritmos o actividades del evento."
          ejemplo="Bambuco, Pasillo, Cumbia"
          placeholder="Ej. Bambuco"
          items={programa.items}
          onActualizar={programa.actualizarSimple}
          onAgregar={() => programa.agregar('')}
          onQuitar={programa.quitar}
        />

        <div className="eventos-pills">
          <p className="admin-field-label-texto">
            Etiquetas destacadas (pills, opcional)
            <HelpTooltip texto="Se muestran como etiquetas cortas con ícono arriba del título, en la página del evento." ejemplo="📅 Sábado 18 de abril · 🕐 8:00 PM · 📍 Teatro Trail" />
          </p>
          {pills.items.map((pill, idx) => (
            <div className="eventos-pill-fila" key={idx}>
              <input type="text" placeholder="Emoji" aria-label="Ícono de la etiqueta" maxLength={4} value={pill.icono || ''} onChange={(e) => pills.actualizar(idx, 'icono', e.target.value)} className="eventos-pill-icono" />
              <input type="text" placeholder="Texto de la etiqueta" aria-label="Texto de la etiqueta" value={pill.texto} onChange={(e) => pills.actualizar(idx, 'texto', e.target.value)} />
              <button type="button" className="admin-fila-quitar" onClick={() => pills.quitar(idx)} aria-label="Quitar etiqueta">×</button>
            </div>
          ))}
          <div className="eventos-pills-acciones">
            <Button type="button" variant="secundario" onClick={() => pills.agregar({ icono: '', texto: '' })}>+ Agregar etiqueta</Button>
            <Button type="button" variant="secundario" onClick={agregarPillsAutomaticas}>+ Etiquetas de fecha/hora/lugar</Button>
          </div>
        </div>

        {/* ── Cómo se reserva ── */}
        <h3 className="eventos-seccion-titulo">
          Cómo se reserva
          {errores.accionTipo && <span className="admin-field-error" role="alert"> — {errores.accionTipo}</span>}
        </h3>
        <div className="eventos-camino-selector" role="group" aria-label="Cómo se reserva este evento">
          {CAMINOS_RESERVA.map((c) => (
            <button
              key={c.valor}
              type="button"
              className={`eventos-camino-opcion${form.accionTipo === c.valor ? ' activo' : ''}`}
              onClick={() => seleccionarCamino(c.valor)}
              aria-pressed={form.accionTipo === c.valor}
            >
              <span className="eventos-camino-titulo">{c.titulo}</span>
              <span className="eventos-camino-desc">{c.descripcion}</span>
            </button>
          ))}
        </div>

        <div className="admin-field-fila">
          <FormField label="Texto del botón" error={errores.cta} hint={`${form.cta.length}/${LIMITE_CTA}`}>
            <input
              type="text"
              placeholder="Ej. Reservar, Comprar entrada"
              maxLength={LIMITE_CTA}
              value={form.cta}
              onChange={(e) => actualizarCampo('cta', e.target.value)}
              className={errores.cta ? 'invalido' : ''}
              disabled={form.accionTipo === 'proximamente'}
            />
          </FormField>
          <FormField
            label="Texto corto"
            hint={`opcional · ${form.ctaWa.length}/${LIMITE_CTA_WA}`}
            ayuda="Se usa en el botón flotante que aparece fijo abajo en la pantalla, en celular — ahí no entra un texto largo."
            ayudaEjemplo="Reservar, Comprar"
          >
            <input
              type="text"
              maxLength={LIMITE_CTA_WA}
              value={form.ctaWa}
              onChange={(e) => actualizarCampo('ctaWa', e.target.value)}
              disabled={form.accionTipo === 'proximamente'}
            />
          </FormField>
        </div>
        <div className="admin-field-fila">
          <FormField
            label="Precio"
            hint={form.accionTipo === 'pago' ? 'moneda + monto' : 'automático según cómo se reserva'}
            error={errores.precio}
          >
            {form.accionTipo === 'pago' ? (
              <div className="eventos-precio-compuesto">
                <select value={monedaPrecio} onChange={(e) => cambiarMonedaPrecio(e.target.value)} aria-label="Moneda">
                  {MONEDAS.map((m) => <option key={m.valor} value={m.valor}>{m.label}</option>)}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="45000"
                  aria-label="Monto"
                  value={parsePrecioCompuesto(form.precio).monto}
                  onChange={(e) => cambiarMontoPrecio(e.target.value)}
                  className={errores.precio ? 'invalido' : ''}
                />
              </div>
            ) : (
              <input type="text" value={form.precio} disabled readOnly />
            )}
          </FormField>
          <FormField label="Link de WhatsApp" hint="opcional — para preguntas o reservas" error={errores.waLink}>
            <input type="url" placeholder="https://wa.me/..." value={form.waLink} onChange={(e) => actualizarCampo('waLink', e.target.value)} className={errores.waLink ? 'invalido' : ''} />
          </FormField>
        </div>

        {form.accionTipo === 'pago' && (
          <>
            <FormField
              label="Detalle del precio"
              hint="opcional"
              ayuda="Una aclaración corta sobre el precio, si hace falta."
              ayudaEjemplo="Diferentes zonas disponibles, precio incluye refrigerio, grupos de 5+ tienen descuento"
            >
              <input type="text" placeholder="Ej. Diferentes zonas disponibles" value={form.precioDetalle} onChange={(e) => actualizarCampo('precioDetalle', e.target.value)} />
            </FormField>
            <div className="eventos-zonas">
              <p className="admin-field-label-texto">
                Zonas de precio (opcional)
                <HelpTooltip texto={`Los montos de las zonas se guardan en la misma moneda elegida arriba para el precio (hoy: ${MONEDAS.find((m) => m.valor === monedaPrecio)?.label}).`} />
              </p>
              {zonas.items.map((zona, idx) => (
                <div key={idx}>
                  <div className="eventos-zona-fila">
                    <input type="text" placeholder="Nombre (ej. General)" aria-label="Nombre de la zona" aria-invalid={!!errores.zonas?.[idx]} value={zona.nombre} onChange={(e) => zonas.actualizar(idx, 'nombre', e.target.value)} className={errores.zonas?.[idx] ? 'invalido' : ''} />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="45000"
                      aria-label="Precio de la zona"
                      aria-invalid={!!errores.zonas?.[idx]}
                      value={parsePrecioCompuesto(zona.precio).monto}
                      onChange={(e) => zonas.actualizar(idx, 'precio', formatearMonto(e.target.value, monedaPrecio))}
                      className={errores.zonas?.[idx] ? 'invalido' : ''}
                    />
                    <button type="button" className="admin-fila-quitar" onClick={() => zonas.quitar(idx)} aria-label="Quitar zona">×</button>
                  </div>
                  {errores.zonas?.[idx] && <span className="admin-field-error" role="alert">{errores.zonas[idx]}</span>}
                </div>
              ))}
              <div className="eventos-pills-acciones">
                <Button type="button" variant="secundario" onClick={() => zonas.agregar({ nombre: '', precio: '' })}>+ Agregar zona</Button>
                {zonas.items.length > 0 && (
                  <Button type="button" variant="secundario" onClick={sugerirPrecioDesdeZonas}>↺ Sugerir precio desde zonas</Button>
                )}
              </div>
            </div>
          </>
        )}

        {form.accionTipo === 'festival' && (
          <>
            <FormField label="Link del formulario de inscripción" hint="opcional — Google Forms u otro" error={errores.inscripcionLink}>
              <input type="url" value={form.inscripcionLink} onChange={(e) => actualizarCampo('inscripcionLink', e.target.value)} />
            </FormField>
            <div className="admin-form-top">
              <Checkbox
                label="Inscripciones cerradas"
                checked={form.inscripcionCerrada}
                onChange={(e) => actualizarCampo('inscripcionCerrada', e.target.checked)}
              />
            </div>
            <FormField label="Bases del concurso" hint="opcional — link a un PDF o documento">
              <input type="url" value={form.bases} onChange={(e) => actualizarCampo('bases', e.target.value)} />
            </FormField>
          </>
        )}

        {/* ── Imágenes ── */}
        <h3 className="eventos-seccion-titulo">Imágenes</h3>
        <ImageUploadField
          label="Imagen de portada"
          recomendado="1400×800px, horizontal (se usa como miniatura en tarjetas)"
          aspecto={7 / 4}
          valorActual={evento?.img}
          archivo={archivoImg}
          onChange={setArchivoImg}
          error={errores.img}
          requerido={!evento}
        />
        <GaleriaUploadField
          label="Galería"
          recomendado="1200×800px, 3:2"
          aspecto={3 / 2}
          valorActual={evento?.galeria}
          archivos={archivosGaleria}
          onChange={setArchivosGaleria}
        />

        {/* ── Testimonios ── */}
        <div className="eventos-testimonios">
          <p className="admin-field-label-texto">Testimonios (opcional)</p>
          {testimonios.items.map((t, idx) => (
            <div className="eventos-testimonio-fila" key={idx}>
              <textarea placeholder="Testimonio" aria-label="Texto del testimonio" aria-invalid={!!errores.testimonios?.[idx]} value={t.texto} onChange={(e) => testimonios.actualizar(idx, 'texto', e.target.value)} className={errores.testimonios?.[idx] ? 'invalido' : ''} />
              <div className="eventos-testimonio-datos">
                <input type="text" placeholder="Nombre" aria-label="Nombre de quien da el testimonio" aria-invalid={!!errores.testimonios?.[idx]} value={t.nombre} onChange={(e) => testimonios.actualizar(idx, 'nombre', e.target.value)} className={errores.testimonios?.[idx] ? 'invalido' : ''} />
                <input type="text" placeholder="Ciudad (opcional)" aria-label="Ciudad de quien da el testimonio" value={t.ciudad || ''} onChange={(e) => testimonios.actualizar(idx, 'ciudad', e.target.value)} />
                <button type="button" className="admin-fila-quitar" onClick={() => testimonios.quitar(idx)} aria-label="Quitar testimonio">×</button>
              </div>
              {errores.testimonios?.[idx] && <span className="admin-field-error" role="alert">{errores.testimonios[idx]}</span>}
            </div>
          ))}
          <Button type="button" variant="secundario" onClick={() => testimonios.agregar({ texto: '', nombre: '', ciudad: '' })}>+ Agregar testimonio</Button>
        </div>

        {/* ── Otros ajustes ── */}
        <h3 className="eventos-seccion-titulo">Otros ajustes</h3>
        <div className="admin-field-fila">
          <FormField label="Color" hint="acento del evento">
            <input type="color" value={form.color} onChange={(e) => actualizarCampo('color', e.target.value)} />
          </FormField>
          <FormField label="Color del encabezado" hint="fondo del detalle del evento">
            <input type="color" value={form.colorHero} onChange={(e) => actualizarCampo('colorHero', e.target.value)} />
          </FormField>
        </div>
        {(form.accionTipo === 'libre' || form.accionTipo === 'pago') && (
          <FormField label="Máximo de entradas por reserva" hint="opcional, default 5">
            <input type="number" min="1" value={form.maxEntradas} onChange={(e) => actualizarCampo('maxEntradas', e.target.value)} />
          </FormField>
        )}
        <div className="admin-form-top">
          <Checkbox
            label="Mostrar en la portada como evento destacado"
            checked={form.destacadoHero}
            onChange={(e) => actualizarCampo('destacadoHero', e.target.checked)}
          />
          <HelpTooltip texto="Solo un evento puede estar destacado a la vez — marcar este desmarca automáticamente cualquier otro que lo estuviera." />
        </div>

        {errorGeneral && <p className="admin-page-error">{errorGeneral}</p>}

        {aviso && (
          <p className="admin-form-aviso" role="status">
            <span aria-hidden="true">✓</span> {aviso}
          </p>
        )}

        <div className="admin-form-acciones">
          <Button type="submit" className="admin-btn-ancho" disabled={guardando}>
            {guardando ? 'Guardando…' : evento ? 'Guardar cambios' : 'Crear evento'}
          </Button>
          {evento && (
            <Button type="button" variant="peligro" onClick={() => setConfirmandoBorrar(true)} disabled={guardando}>
              Borrar evento
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        abierto={confirmandoBorrar}
        titulo="¿Borrar este evento?"
        mensaje={`Se va a borrar "${evento?.titulo}" del sitio. Esta acción no se puede deshacer.`}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setConfirmandoBorrar(false)}
        confirmando={borrando}
      />
    </Card>
  );
}

// Lista dinámica de strings simples (usada por `programa`) — separada de los
// bloques de pills/zonas/testimonios porque esos son listas de objetos.
function ListaDinamicaSimple({ titulo, ayuda, ejemplo, placeholder, items, onActualizar, onAgregar, onQuitar }) {
  return (
    <div className="eventos-lista-simple">
      <p className="admin-field-label-texto">
        {titulo}
        {ayuda && <HelpTooltip texto={ayuda} ejemplo={ejemplo} />}
      </p>
      {items.map((valor, idx) => (
        <div className="eventos-lista-simple-fila" key={idx}>
          <input type="text" placeholder={placeholder} value={valor} onChange={(e) => onActualizar(idx, e.target.value)} />
          <button type="button" className="admin-fila-quitar" onClick={() => onQuitar(idx)} aria-label="Quitar">×</button>
        </div>
      ))}
      <Button type="button" variant="secundario" onClick={onAgregar}>+ Agregar</Button>
    </div>
  );
}

export default function Eventos() {
  const { adminFetch } = useAdminAuth();
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState(undefined); // undefined = ninguno, null = "nuevo"
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const formPanelRef = useScrollAlSeleccionar(seleccionadoId, !cargando);

  const eventoSeleccionado = eventos.find((e) => e.id === seleccionadoId) || null;

  const cargarEventos = useCallback((cancelObj) => {
    adminFetch('/api/admin/eventos')
      .then((data) => { if (!cancelObj?.cancelado) { setEventos(data.data); setErrorCarga(''); } })
      .catch((err) => { if (!cancelObj?.cancelado) setErrorCarga(err.message); })
      .finally(() => { if (!cancelObj?.cancelado) setCargando(false); });
  }, [adminFetch]);

  useEffect(() => {
    const cancelObj = { cancelado: false };
    cargarEventos(cancelObj);
    return () => { cancelObj.cancelado = true; };
  }, [cargarEventos]);

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      const coincideTexto = e.titulo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideTipo = filtroTipo === 'todos' || e.tipo === filtroTipo;
      return coincideTexto && coincideTipo;
    });
  }, [eventos, busqueda, filtroTipo]);

  // `tipo` es texto libre (2026-08-16) — el filtro y las sugerencias del
  // formulario se arman con los tipos que ya están en uso de verdad, no con
  // una lista fija, para no perder de vista variantes reales que el admin
  // ya haya escrito.
  const tiposEnUso = useMemo(() => {
    const combinados = new Set([...TIPOS_SUGERIDOS, ...eventos.map((e) => e.tipo).filter(Boolean)]);
    return Array.from(combinados).sort();
  }, [eventos]);

  function seleccionar(id) {
    setSeleccionadoId(id);
    setAviso('');
  }

  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(timer);
  }, [aviso]);

  function manejarGuardado(eventoGuardado, esNuevo) {
    setEventos((prev) => (esNuevo ? [eventoGuardado, ...prev] : prev.map((e) => (e.id === eventoGuardado.id ? eventoGuardado : e))));
    if (esNuevo) setSeleccionadoId(eventoGuardado.id);
  }

  function manejarBorrado() {
    setEventos((prev) => prev.filter((e) => e.id !== seleccionadoId));
    setSeleccionadoId(undefined);
  }

  return (
    <AdminLayout>
      <div className="eventos-panel-header">
        <div className="eventos-panel-header-textos">
          <h1 className="admin-page-titulo">Gestión de Eventos</h1>
          <p className="admin-page-sub">Crea, edita y filtra los eventos del sitio libremente.</p>
        </div>
        <Button onClick={() => seleccionar(null)}>+ Nuevo evento</Button>
      </div>

      {cargando && <p>Cargando…</p>}
      {errorCarga && (
        <p className="admin-page-error">
          No se pudo cargar: {errorCarga}{' '}
          <button onClick={() => { setCargando(true); cargarEventos(); }}>Reintentar</button>
        </p>
      )}

      {!cargando && !errorCarga && (
        <div className="eventos-layout">
          <div className="eventos-lista-panel">
            <div className="eventos-filtros">
              <input
                type="text"
                placeholder="🔎 Buscar por título…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="todos">Todos los tipos</option>
                {tiposEnUso.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <p className="eventos-contador">Eventos encontrados ({eventosFiltrados.length})</p>

            {eventosFiltrados.length === 0 && (
              <p className="eventos-vacio">
                {eventos.length === 0 ? 'Todavía no hay eventos cargados.' : 'No hay eventos que coincidan con los filtros.'}
              </p>
            )}

            <div className="eventos-panel-lista">
              {eventosFiltrados.map((e) => (
                <button
                  key={e.id}
                  className={`eventos-item${e.id === seleccionadoId ? ' activo' : ''}`}
                  onClick={() => seleccionar(e.id)}
                >
                  <span className="eventos-item-titulo">
                    {e.titulo}
                    {e.destacado_hero && <span className="eventos-item-destacado" title="Evento destacado">★</span>}
                  </span>
                  <span className="eventos-item-meta">
                    {e.tipo} · {e.fecha} · {e.ciudad}
                    {!e.activo && <span className="admin-inactivo-tag"> (oculto)</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="eventos-form-panel" ref={formPanelRef}>
            {seleccionadoId !== undefined && (
              <EventoForm
                key={seleccionadoId ?? 'nuevo'}
                evento={eventoSeleccionado}
                tiposSugeridos={tiposEnUso}
                adminFetch={adminFetch}
                onGuardado={manejarGuardado}
                onBorrado={manejarBorrado}
                onAviso={setAviso}
                aviso={aviso}
              />
            )}
            {seleccionadoId === undefined && (
              <Card className="eventos-form-vacio">
                {aviso ? (
                  <p className="admin-form-aviso" role="status">
                    <span aria-hidden="true">✓</span> {aviso}
                  </p>
                ) : (
                  <p>Selecciona un evento de la lista para editarlo, o crea uno nuevo.</p>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
