import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { logAudit } from '../lib/auditLog.js';
import { uploadMiddleware, validarWebpReal, procesarYSubirImagen, borrarImagenPorUrl } from '../lib/imageUpload.js';
import { booleanFromString, jsonArrayField, stripUndefined } from '../lib/zodMultipart.js';
import { generarSlugUnico } from '../lib/slug.js';
import { toCamelCase } from '../lib/camelCase.js';

const router = Router();
const CARPETA_IMG = 'eventos/img';
const CARPETA_GALERIA = 'eventos/galeria';
const MAX_GALERIA = 10;

const TIPOS = ['Gira USA', 'Sede', 'Festival'];
const ACCION_TIPOS = ['libre', 'pago', 'festival', 'proximamente'];
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'debe ser un color hex válido (ej: #1A56DB)');
const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'debe tener formato YYYY-MM-DD');

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
  tipo: z.enum(TIPOS),
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
  max_entradas: z.coerce.number().int('max_entradas debe ser un entero').positive('max_entradas debe ser mayor a 0').optional(),
  cta: z.string().trim().min(1, 'cta es obligatorio'),
  cta_wa: z.string().trim().optional(),
  color: hexColor,
  color_hero: hexColor,
  wa_link: z.string().trim().url('wa_link debe ser una URL válida'),
  testimonios: jsonArrayField(testimonioSchema).optional(),
  inscripcion_cerrada: booleanFromString.optional(),
  inscripcion_link: z.string().trim().url('inscripcion_link debe ser una URL válida').optional(),
  bases: z.string().trim().url('bases debe ser una URL válida').optional(),
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
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
}

// GET / — listar todos los eventos
router.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .order('fecha_iso', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    return next(err);
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
  await validarWebpReal(imgFile.buffer);
  for (const archivo of galeriaFiles) {
    await validarWebpReal(archivo.buffer);
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
    const err = new Error(eventoError.message);
    err.status = 400;
    return next(err);
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

  if (imgFile) await validarWebpReal(imgFile.buffer);
  for (const archivo of galeriaFiles) await validarWebpReal(archivo.buffer);

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
      const err = new Error(updateError.message);
      err.status = 400;
      return next(err);
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
    const err = new Error(error.message);
    err.status = 400;
    return next(err);
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
    .order('fecha_iso', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    return next(err);
  }

  res.json({ ok: true, data: toCamelCase(data) });
});

export default router;
