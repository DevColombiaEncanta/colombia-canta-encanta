import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { logAudit } from '../lib/auditLog.js';
import { uploadMiddleware, validarImagenReal, procesarYSubirImagen, borrarImagenPorUrl } from '../lib/imageUpload.js';
import { booleanFromString, jsonArrayField, stripUndefined } from '../lib/zodMultipart.js';
import { generarSlugUnico } from '../lib/slug.js';
import { toCamelCase } from '../lib/camelCase.js';
import { errorGenerico } from '../lib/errores.js';

const router = Router();
const CARPETA_IMG = 'noticias/img';
const CARPETA_BANNER = 'noticias/banner';

const CATEGORIAS = ['Giras', 'Escuela', 'Eventos', 'Logro', 'Prensa', 'General'];
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'debe ser un color hex válido (ej: #1A56DB)');
const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_publicacion debe tener formato YYYY-MM-DD');

const baseNoticiaSchema = z.object({
  titulo: z.string().trim().min(1, 'titulo es obligatorio'),
  categoria: z.enum(CATEGORIAS),
  resumen: z.string().trim().min(1, 'resumen es obligatorio'),
  contenido: jsonArrayField(z.string().min(1)).refine((arr) => arr.length > 0, {
    message: 'contenido debe tener al menos un párrafo',
  }),
  color_inicio: hexColor,
  color_fin: hexColor,
  fecha_publicacion: fechaISO,
});

const createNoticiaSchema = baseNoticiaSchema;
const updateNoticiaSchema = baseNoticiaSchema.partial().extend({
  activo: booleanFromString.optional(),
});

const uploadFields = uploadMiddleware.fields([
  { name: 'img', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
]);

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

// GET / — listar todas las noticias (incluye inactivas, es vista de admin), más reciente primero
router.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .order('fecha_publicacion', { ascending: false });

  if (error) {
    return next(errorGenerico(error, 'GET /api/admin/noticias'));
  }

  res.json({ ok: true, noticias: data });
});

// POST / — crear noticia (multipart/form-data: campos + archivos "img" (obligatorio) y "banner" (opcional))
router.post('/', requireCsrf, uploadFields, async (req, res, next) => {
  const imgFile = req.files?.img?.[0];
  const bannerFile = req.files?.banner?.[0];

  if (!imgFile) {
    const err = new Error('img es obligatoria');
    err.status = 400;
    return next(err);
  }

  const result = createNoticiaSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }
  const { titulo, categoria, resumen, contenido, color_inicio, color_fin, fecha_publicacion } = result.data;

  // Se validan los DOS archivos (magic bytes) antes de subir ninguno — si img se subiera
  // primero y banner fallara después, img quedaría huérfana en Storage sin fila que la use.
  await validarImagenReal(imgFile.buffer);
  if (bannerFile) await validarImagenReal(bannerFile.buffer);

  const slug = await generarSlugUnico('noticias', titulo);
  const { url: imgUrl } = await procesarYSubirImagen(imgFile.buffer, CARPETA_IMG);
  const bannerUrl = bannerFile
    ? (await procesarYSubirImagen(bannerFile.buffer, CARPETA_BANNER)).url
    : null;

  const { data, error } = await supabase
    .from('noticias')
    .insert({
      slug,
      titulo,
      categoria,
      resumen,
      contenido,
      img: imgUrl,
      banner: bannerUrl,
      color_inicio,
      color_fin,
      fecha_publicacion,
    })
    .select()
    .single();

  if (error) {
    // Ya se subieron los archivos a Storage antes de este punto — si el insert falla,
    // hay que revertir esa subida para no dejarlos huérfanos (mismo criterio que el
    // cleanup de auth.users en POST /api/admin/admins, Fase 2).
    await borrarImagenPorUrl(imgUrl);
    if (bannerUrl) await borrarImagenPorUrl(bannerUrl);
    return next(errorGenerico(error, 'POST /api/admin/noticias'));
  }

  await logAudit({
    actor: req.admin,
    accion: 'crear',
    entidad: 'noticias',
    entidadId: data.id,
    detalle: { titulo: data.titulo, slug: data.slug },
  });

  res.status(201).json({ ok: true, noticia: data });
});

// PATCH /:id — editar (el slug NO se recalcula aunque cambie el titulo, para no romper URLs ya compartidas)
router.patch('/:id', requireCsrf, uploadFields, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase
    .from('noticias')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !actual) {
    const err = new Error('Noticia no encontrada');
    err.status = 404;
    return next(err);
  }

  const result = updateNoticiaSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }

  const updates = stripUndefined(result.data);

  const imgFile = req.files?.img?.[0];
  const bannerFile = req.files?.banner?.[0];

  // Validar ambos ANTES de subir ninguno — mismo motivo que en POST.
  if (imgFile) await validarImagenReal(imgFile.buffer);
  if (bannerFile) await validarImagenReal(bannerFile.buffer);

  let imgVieja = null;
  let bannerVieja = null;
  let imgNuevaUrl = null;
  let bannerNuevaUrl = null;

  if (imgFile) {
    const { url } = await procesarYSubirImagen(imgFile.buffer, CARPETA_IMG);
    updates.img = url;
    imgNuevaUrl = url;
    imgVieja = actual.img;
  }
  if (bannerFile) {
    const { url } = await procesarYSubirImagen(bannerFile.buffer, CARPETA_BANNER);
    updates.banner = url;
    bannerNuevaUrl = url;
    bannerVieja = actual.banner;
  }

  // Solo se llama a update() si hay algo que cambiar — un UPDATE con objeto vacío
  // hace que PostgREST devuelva 0 filas, y .single() lanza un error aunque la fila exista.
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('noticias').update(updates).eq('id', id);

    if (error) {
      // Si ya se subió alguna imagen nueva antes de que el update fallara, se revierte
      // esa subida — no dejar el archivo nuevo huérfano si la fila no terminó de guardarse.
      if (imgNuevaUrl) await borrarImagenPorUrl(imgNuevaUrl);
      if (bannerNuevaUrl) await borrarImagenPorUrl(bannerNuevaUrl);
      return next(errorGenerico(error, 'PATCH /api/admin/noticias/:id'));
    }

    if (imgVieja) await borrarImagenPorUrl(imgVieja);
    if (bannerVieja) await borrarImagenPorUrl(bannerVieja);

    await logAudit({
      actor: req.admin,
      accion: 'editar',
      entidad: 'noticias',
      entidadId: id,
      detalle: updates,
    });
  }

  const { data } = await supabase.from('noticias').select('*').eq('id', id).single();
  res.json({ ok: true, noticia: data });
});

// DELETE /:id — borra la fila y sus imágenes asociadas (img siempre, banner si existía)
router.delete('/:id', requireCsrf, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase
    .from('noticias')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !actual) {
    const err = new Error('Noticia no encontrada');
    err.status = 404;
    return next(err);
  }

  const { error } = await supabase.from('noticias').delete().eq('id', id);

  if (error) {
    return next(errorGenerico(error, 'DELETE /api/admin/noticias/:id'));
  }

  await borrarImagenPorUrl(actual.img);
  if (actual.banner) await borrarImagenPorUrl(actual.banner);

  await logAudit({
    actor: req.admin,
    accion: 'borrar',
    entidad: 'noticias',
    entidadId: id,
    detalle: { titulo: actual.titulo, slug: actual.slug },
  });

  res.json({ ok: true });
});

// Router público de solo lectura — sin requireAdmin ni requireCsrf, solo las
// noticias activas, en camelCase. Mismo orden que el admin (más reciente primero).
export const noticiasPublicoRouter = Router();

noticiasPublicoRouter.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('activo', true)
    .order('fecha_publicacion', { ascending: false });

  if (error) {
    return next(errorGenerico(error, 'GET /api/noticias'));
  }

  res.json({ ok: true, noticias: toCamelCase(data) });
});

export default router;
