import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { logAudit } from '../lib/auditLog.js';
import { uploadMiddleware, validarImagenReal, procesarYSubirImagen, borrarImagenPorUrl } from '../lib/imageUpload.js';
import { booleanFromString, jsonArrayField, nullableNumberFromString, stripUndefined } from '../lib/zodMultipart.js';
import { generarSlugUnico } from '../lib/slug.js';
import { toCamelCase } from '../lib/camelCase.js';
import { errorGenerico } from '../lib/errores.js';

const router = Router();
const CARPETA_IMG = 'eventos/img';
const CARPETA_GALERIA = 'eventos/galeria';
const MAX_GALERIA = 10;

const ACCION_TIPOS = ['libre', 'pago', 'festival', 'proximamente'];
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'debe ser un color hex válido (ej: #1A56DB)');
const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'debe tener formato YYYY-MM-DD');

// ⭐ Hallazgo real (revisión crítica 5.3a, 2026-08-16): `z.string().url()` en
// esta versión de Zod valida FORMA, no seguridad — acepta cualquier esquema
// con esa forma, incluido `javascript:alert(1)` (verificado: `new URL(...)`
// no tira error con ese valor, así que Zod tampoco). `wa_link`/
// `inscripcion_link`/`bases` se renderizan tal cual como `href` de un `<a>`
// en el sitio público (EventoDetalle.jsx) — mismo riesgo de XSS guardado ya
// encontrado y corregido en el CTA del Hero (ver `esRutaInternaValida` en
// hero.js). Acá la ruta correcta es la opuesta (una URL externa real, no una
// interna) — se exige explícitamente que empiece con http(s), en vez de
// confiar en que "parece una URL" sea suficiente.
function urlSegura(mensaje) {
  return z.string().trim().url(mensaje).refine((v) => /^https?:\/\//i.test(v), {
    message: `${mensaje} (debe empezar con http:// o https://)`,
  });
}

const pillSchema = z.object({
  icono: z.string().trim().optional(),
  texto: z.string().trim().min(1, 'pills[].texto es obligatorio'),
});
const zonaSchema = z.object({
  nombre: z.string().trim().min(1, 'zonas[].nombre es obligatorio'),
  precio: z.string().trim().min(1, 'zonas[].precio es obligatorio'),
});
const testimonioSchema = z.object({
  texto: z.string().trim().min(1, 'testimonios[].texto es obligatorio'),
  nombre: z.string().trim().min(1, 'testimonios[].nombre es obligatorio'),
  ciudad: z.string().trim().optional(),
});

const baseEventoSchema = z.object({
  titulo: z.string().trim().min(1, 'titulo es obligatorio'),
  // 5.3a permitía solo 3 valores fijos (`z.enum`) — a pedido del usuario
  // (2026-08-16) pasa a ser texto libre, porque la lista real de tipos de
  // evento puede crecer con el tiempo (giras nuevas, formatos nuevos) y no
  // tiene sentido tocar el backend cada vez. El panel sigue sugiriendo los
  // tipos ya usados vía `<datalist>`, pero no restringe.
  tipo: z.string().trim().min(1, 'tipo es obligatorio').max(60, 'tipo es demasiado largo'),
  fecha: z.string().trim().min(1, 'fecha es obligatoria'),
  fecha_iso: fechaISO,
  fecha_iso_fin: fechaISO.optional(),
  fecha_completa: z.string().trim().min(1, 'fecha_completa es obligatoria'),
  ciudad: z.string().trim().min(1, 'ciudad es obligatoria'),
  lugar: z.string().trim().min(1, 'lugar es obligatorio'),
  hora: z.string().trim().optional(),
  puertas: z.string().trim().optional(),
  direccion: z.string().trim().min(1, 'direccion es obligatoria'),
  pills: jsonArrayField(pillSchema).optional(),
  descripcion: z.string().trim().min(1, 'descripcion es obligatoria'),
  descripcion_larga: z.string().trim().min(1, 'descripcion_larga es obligatoria'),
  programa: jsonArrayField(z.string().min(1)).optional(),
  precio: z.string().trim().min(1, 'precio es obligatorio'),
  precio_detalle: z.string().trim().optional(),
  zonas: jsonArrayField(zonaSchema).optional(),
  // ⭐ Bug real encontrado en auditoría (2026-08-31): con solo `.optional()`,
  // el frontend no puede volver a borrar el límite una vez puesto (si no se
  // manda la clave, `stripUndefined` la descarta y el valor viejo queda
  // pegado) -- mismo problema ya resuelto en cursos.js con `precio_numerico`/
  // `matricula_numerico`. Acá esta ruta es multipart (por la imagen), así que
  // se usa `nullableNumberFromString` en vez del `z.union` directo que usa
  // cursos.js (JSON real) -- ver `zodMultipart.js`.
  max_entradas: nullableNumberFromString(z.coerce.number().int('max_entradas debe ser un entero').positive('max_entradas debe ser mayor a 0')).optional(),
  cta: z.string().trim().min(1, 'cta es obligatorio').max(35, 'cta no puede pasar de 35 caracteres'),
  cta_wa: z.string().trim().max(18, 'cta_wa no puede pasar de 18 caracteres').optional(),
  color: hexColor,
  color_hero: hexColor,
  // Opcional a pedido del usuario (2026-08-16): no todos los caminos de
  // reserva dependen de WhatsApp (festival usa `inscripcion_link`,
  // proximamente no reserva nada), y el sitio público ya tiene un número de
  // WhatsApp de respaldo cuando `waLink` viene vacío (ver EventoDetalle.jsx).
  wa_link: urlSegura('wa_link debe ser una URL válida').optional(),
  testimonios: jsonArrayField(testimonioSchema).optional(),
  inscripcion_cerrada: booleanFromString.optional(),
  inscripcion_link: urlSegura('inscripcion_link debe ser una URL válida').optional(),
  bases: urlSegura('bases debe ser una URL válida').optional(),
  destacado_hero: booleanFromString.optional(),
  accion_tipo: z.enum(ACCION_TIPOS),
});

const createEventoSchema = baseEventoSchema;
const updateEventoSchema = baseEventoSchema.partial().extend({
  activo: booleanFromString.optional(),
});

const uploadFields = uploadMiddleware.fields([
  { name: 'img', maxCount: 1 },
  { name: 'galeria', maxCount: MAX_GALERIA },
]);

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

// Desmarca cualquier otro evento destacado — el índice único parcial en `eventos`
// solo permite un `destacado_hero = true` a la vez. Sin esto, marcar uno nuevo
// como destacado violaría ese índice si ya había otro.
async function limpiarOtrosDestacados(idExcluido) {
  let query = supabase.from('eventos').update({ destacado_hero: false }).eq('destacado_hero', true);
  if (idExcluido) query = query.neq('id', idExcluido);
  const { error } = await query;
  if (error) {
    throw errorGenerico(error, 'eventos.js limpiarOtrosDestacados');
  }
}

// GET / — listar todos los eventos
router.get('/', async (req, res, next) => {
  // ⭐ Hallazgo real (2026-08-16): ordenar solo por `fecha_iso` no define qué
  // pasa entre 2 eventos con la misma fecha — Postgres no garantiza ningún
  // orden entre filas "empatadas" si no hay un segundo criterio explícito.
  // Se agrega `creado_en` ascendente como desempate, para que el evento
  // creado primero aparezca primero cuando 2 comparten fecha (pedido del
  // usuario). El `.sort()` de JS que hace el sitio público (`CarruselEventos.jsx`)
  // es estable, así que respeta este orden de desempate tal cual llega.
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .order('fecha_iso', { ascending: false })
    .order('creado_en', { ascending: true });

  if (error) {
    return next(errorGenerico(error, 'GET /api/admin/eventos'));
  }

  res.json({ ok: true, data });
});

// POST / — crear evento (multipart/form-data: campos + "img" (obligatoria) + "galeria" (0 a 10))
router.post('/', requireCsrf, uploadFields, async (req, res, next) => {
  const imgFile = req.files?.img?.[0];
  const galeriaFiles = req.files?.galeria || [];

  if (!imgFile) {
    const err = new Error('img es obligatoria');
    err.status = 400;
    return next(err);
  }

  const result = createEventoSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }
  const { destacado_hero, ...camposEvento } = result.data;

  // Validar TODOS los archivos antes de subir ninguno.
  await validarImagenReal(imgFile.buffer);
  for (const archivo of galeriaFiles) {
    await validarImagenReal(archivo.buffer);
  }

  const { url: imgUrl } = await procesarYSubirImagen(imgFile.buffer, CARPETA_IMG);
  const galeriaUrls = [];
  for (const archivo of galeriaFiles) {
    const { url } = await procesarYSubirImagen(archivo.buffer, CARPETA_GALERIA);
    galeriaUrls.push(url);
  }

  const slug = await generarSlugUnico('eventos', camposEvento.titulo);

  // destacado_hero NUNCA se manda en el insert inicial (queda en false por default) —
  // si se pidió true, se aplica en un paso aparte DESPUÉS de crear la fila, para que
  // un fallo del insert no deje el sitio sin ningún evento destacado.
  const { data: evento, error: eventoError } = await supabase
    .from('eventos')
    .insert({ ...camposEvento, slug, img: imgUrl, galeria: galeriaUrls.length > 0 ? galeriaUrls : null })
    .select()
    .single();

  if (eventoError) {
    await borrarImagenPorUrl(imgUrl);
    for (const url of galeriaUrls) await borrarImagenPorUrl(url);
    return next(errorGenerico(eventoError, 'POST /api/admin/eventos'));
  }

  if (destacado_hero) {
    await limpiarOtrosDestacados(evento.id);
    await supabase.from('eventos').update({ destacado_hero: true }).eq('id', evento.id);
    evento.destacado_hero = true;
  }

  await logAudit({
    actor: req.admin,
    accion: 'crear',
    entidad: 'eventos',
    entidadId: evento.id,
    detalle: { titulo: evento.titulo, slug: evento.slug },
  });

  res.status(201).json({ ok: true, data: evento });
});

// PATCH /:id — editar (el slug NO se recalcula; destacado_hero se aplica al final, ver nota en POST)
router.patch('/:id', requireCsrf, uploadFields, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase.from('eventos').select('*').eq('id', id).maybeSingle();
  if (fetchError || !actual) {
    const err = new Error('Evento no encontrado');
    err.status = 404;
    return next(err);
  }

  const result = updateEventoSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }
  const { destacado_hero, ...camposParciales } = result.data;
  const camposEvento = stripUndefined(camposParciales);

  const imgFile = req.files?.img?.[0];
  const galeriaFiles = req.files?.galeria || [];
  let imgVieja = null;
  let galeriaVieja = null;

  if (imgFile) await validarImagenReal(imgFile.buffer);
  for (const archivo of galeriaFiles) await validarImagenReal(archivo.buffer);

  if (imgFile) {
    const { url } = await procesarYSubirImagen(imgFile.buffer, CARPETA_IMG);
    camposEvento.img = url;
    imgVieja = actual.img;
  }
  if (galeriaFiles.length > 0) {
    const urls = [];
    for (const archivo of galeriaFiles) {
      const { url } = await procesarYSubirImagen(archivo.buffer, CARPETA_GALERIA);
      urls.push(url);
    }
    camposEvento.galeria = urls;
    galeriaVieja = actual.galeria;
  }

  // Solo se llama a update() si hay algo que cambiar — un UPDATE con objeto vacío
  // (ej. un PATCH que solo trae destacado_hero) hace que PostgREST devuelva 0 filas,
  // y encadenar .single() sobre eso lanza un error aunque la fila sí exista.
  if (Object.keys(camposEvento).length > 0) {
    const { error: updateError } = await supabase.from('eventos').update(camposEvento).eq('id', id);

    if (updateError) {
      if (camposEvento.img) await borrarImagenPorUrl(camposEvento.img);
      if (camposEvento.galeria) for (const url of camposEvento.galeria) await borrarImagenPorUrl(url);
      return next(errorGenerico(updateError, 'PATCH /api/admin/eventos/:id'));
    }

    if (imgVieja) await borrarImagenPorUrl(imgVieja);
    if (galeriaVieja) for (const url of galeriaVieja) await borrarImagenPorUrl(url);
  }

  // destacado_hero al final — el contenido del evento ya se guardó bien antes de tocarlo.
  if (destacado_hero !== undefined) {
    if (destacado_hero) {
      await limpiarOtrosDestacados(id);
      await supabase.from('eventos').update({ destacado_hero: true }).eq('id', id);
    } else {
      await supabase.from('eventos').update({ destacado_hero: false }).eq('id', id);
    }
  }

  // Solo se registra si de verdad cambió algo — un PATCH totalmente vacío no debe
  // dejar una entrada de "editar" en audit_log sin ningún cambio real detrás.
  if (Object.keys(camposEvento).length > 0 || destacado_hero !== undefined) {
    await logAudit({
      actor: req.admin,
      accion: 'editar',
      entidad: 'eventos',
      entidadId: id,
      detalle: { ...camposEvento, destacadoHeroActualizado: destacado_hero !== undefined },
    });
  }

  const { data: eventoFinal } = await supabase.from('eventos').select('*').eq('id', id).single();
  res.json({ ok: true, data: eventoFinal });
});

// DELETE /:id — borra el evento y sus imágenes (img + galería)
router.delete('/:id', requireCsrf, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase.from('eventos').select('*').eq('id', id).maybeSingle();
  if (fetchError || !actual) {
    const err = new Error('Evento no encontrado');
    err.status = 404;
    return next(err);
  }

  const { error } = await supabase.from('eventos').delete().eq('id', id);
  if (error) {
    // ⭐ Bug real (auditoría Fase 5, 2026-08-31): `reservas.evento_id` tiene
    // `on delete restrict` (20260804140000_create_reservas.sql) — sin esto,
    // borrar un evento con reservas reales caía en el mensaje genérico de
    // `errorGenerico` en vez de explicar por qué. Mismo criterio ya usado en
    // cursos.js (`traducirErrorCurso`) para su propio 23503 al borrar.
    if (error.code === '23503') {
      const err = new Error('No se puede borrar — hay reservas que dependen de este evento');
      err.status = 409;
      return next(err);
    }
    return next(errorGenerico(error, 'DELETE /api/admin/eventos/:id'));
  }

  await borrarImagenPorUrl(actual.img);
  if (actual.galeria) {
    for (const url of actual.galeria) await borrarImagenPorUrl(url);
  }

  await logAudit({
    actor: req.admin,
    accion: 'borrar',
    entidad: 'eventos',
    entidadId: id,
    detalle: { titulo: actual.titulo, slug: actual.slug },
  });

  res.json({ ok: true });
});

// Router público de solo lectura — sin requireAdmin ni requireCsrf, solo los
// eventos activos, en camelCase. Mismo orden que el admin (fecha_iso descendente).
export const eventosPublicoRouter = Router();

eventosPublicoRouter.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('activo', true)
    .order('fecha_iso', { ascending: false })
    .order('creado_en', { ascending: true });

  if (error) {
    return next(errorGenerico(error, 'GET /api/eventos'));
  }

  res.json({ ok: true, data: toCamelCase(data) });
});

export default router;
