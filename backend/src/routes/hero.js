import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { logAudit } from '../lib/auditLog.js';
import { uploadMiddleware, validarImagenReal, procesarYSubirImagen, borrarImagenPorUrl } from '../lib/imageUpload.js';
import { booleanFromString, jsonArrayField, stripUndefined } from '../lib/zodMultipart.js';
import { toCamelCase } from '../lib/camelCase.js';
import { errorGenerico } from '../lib/errores.js';

const router = Router();
const CARPETA = 'hero-slides';

// ⭐ Hallazgo real (revisión crítica 5.2, 2026-08-15): el front (Hero.jsx)
// valida que `to` sea una ruta interna — pero esa validación vivía SOLO ahí.
// Cualquiera que hablara directo con la API (curl, un fetch manual) podía
// guardar cualquier string en `to`, incluido un esquema `javascript:` — que
// <Link to={cta.to}> del Hero público renderiza tal cual como `href` de un
// `<a>`, un vector real de XSS-guardado (no solo un link roto). Se repite acá
// la misma regla de lista blanca del front, como la barrera de verdad — la
// del cliente es solo para dar feedback rápido, nunca la única.
function esRutaInternaValida(to) {
  if (!to) return true; // vacío: fila decorativa sin link, válida
  return to.startsWith('/') && !to.startsWith('//');
}

const ctaSchema = z.object({
  label: z.string().optional(),
  to: z.string().optional().refine(esRutaInternaValida, {
    message: 'El destino de un botón debe ser una ruta interna que empiece con "/", no una página externa',
  }),
  primario: z.boolean().optional(),
});

const baseHeroSchema = z.object({
  label: z.string().trim().min(1, 'label es obligatorio'),
  titulo: z.string().trim().min(1, 'titulo es obligatorio'),
  descripcion: z.string().optional(),
  orden: z.coerce.number().int('orden debe ser un entero'),
  ctas: jsonArrayField(ctaSchema).optional(),
});

const createHeroSchema = baseHeroSchema;
const updateHeroSchema = baseHeroSchema.partial().extend({
  activo: booleanFromString.optional(),
});

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

// GET / — listar todos los slides (incluye inactivos, es vista de admin)
router.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    return next(errorGenerico(error, 'GET /api/admin/hero'));
  }

  res.json({ ok: true, slides: data });
});

// POST / — crear slide (multipart/form-data: campos + archivo "imagen")
router.post('/', requireCsrf, uploadMiddleware.single('imagen'), async (req, res, next) => {
  if (!req.file) {
    const err = new Error('La imagen es obligatoria');
    err.status = 400;
    return next(err);
  }

  const result = createHeroSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }
  const { label, titulo, descripcion, orden, ctas } = result.data;

  await validarImagenReal(req.file.buffer);
  const { url } = await procesarYSubirImagen(req.file.buffer, CARPETA);

  const { data, error } = await supabase
    .from('hero_slides')
    .insert({
      orden,
      label,
      titulo,
      descripcion: descripcion || null,
      imagen: url,
      ctas: ctas ?? null,
    })
    .select()
    .single();

  if (error) {
    return next(errorGenerico(error, 'POST /api/admin/hero'));
  }

  await logAudit({
    actor: req.admin,
    accion: 'crear',
    entidad: 'hero_slides',
    entidadId: data.id,
    detalle: { label: data.label },
  });

  res.status(201).json({ ok: true, slide: data });
});

// PATCH /:id — editar (imagen opcional; si no se manda, se conserva la actual)
router.patch('/:id', requireCsrf, uploadMiddleware.single('imagen'), async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !actual) {
    const err = new Error('Slide no encontrado');
    err.status = 404;
    return next(err);
  }

  const result = updateHeroSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }

  const updates = stripUndefined(result.data);
  if ('descripcion' in updates) {
    updates.descripcion = updates.descripcion || null;
  }

  let imagenVieja = null;
  if (req.file) {
    await validarImagenReal(req.file.buffer);
    const { url } = await procesarYSubirImagen(req.file.buffer, CARPETA);
    updates.imagen = url;
    imagenVieja = actual.imagen;
  }

  // Solo se llama a update() si hay algo que cambiar — un UPDATE con objeto vacío
  // hace que PostgREST devuelva 0 filas, y .single() lanza un error aunque la fila exista.
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('hero_slides').update(updates).eq('id', id);

    if (error) {
      if (imagenVieja) {
        // la imagen nueva ya se subió — si el update falla, no dejarla huérfana
        await borrarImagenPorUrl(updates.imagen);
      }
      return next(errorGenerico(error, 'PATCH /api/admin/hero/:id'));
    }

    if (imagenVieja) {
      await borrarImagenPorUrl(imagenVieja);
    }

    await logAudit({
      actor: req.admin,
      accion: 'editar',
      entidad: 'hero_slides',
      entidadId: id,
      detalle: updates,
    });
  }

  const { data } = await supabase.from('hero_slides').select('*').eq('id', id).single();
  res.json({ ok: true, slide: data });
});

// DELETE /:id — borra la fila y la imagen asociada en Storage
router.delete('/:id', requireCsrf, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !actual) {
    const err = new Error('Slide no encontrado');
    err.status = 404;
    return next(err);
  }

  const { error } = await supabase.from('hero_slides').delete().eq('id', id);

  if (error) {
    return next(errorGenerico(error, 'DELETE /api/admin/hero/:id'));
  }

  await borrarImagenPorUrl(actual.imagen);

  await logAudit({
    actor: req.admin,
    accion: 'borrar',
    entidad: 'hero_slides',
    entidadId: id,
    detalle: { label: actual.label },
  });

  res.json({ ok: true });
});

// Router público de solo lectura — sin requireAdmin ni requireCsrf, solo los slides
// activos, en camelCase. Pensado para que el sitio real (Fase 4) lea esto sin sesión.
export const heroPublicoRouter = Router();

heroPublicoRouter.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) {
    return next(errorGenerico(error, 'GET /api/hero'));
  }

  res.json({ ok: true, slides: toCamelCase(data) });
});

export default router;
