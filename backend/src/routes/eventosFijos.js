import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { logAudit } from '../lib/auditLog.js';
import { uploadMiddleware, validarWebpReal, procesarYSubirImagen, borrarImagenPorUrl } from '../lib/imageUpload.js';
import { jsonArrayField } from '../lib/zodMultipart.js';
import { toCamelCase } from '../lib/camelCase.js';
import { errorGenerico } from '../lib/errores.js';

const router = Router();
const CARPETA_GALERIA = 'eventos-fijos/galeria';
const MAX_SHOWS = 20; // tope razonable de shows en una programación mensual

const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fechaISO debe tener formato YYYY-MM-DD');

const showSchema = z.object({
  dia: z.string().trim().min(1, 'programacion[].dia es obligatorio'),
  hora: z.string().trim().min(1, 'programacion[].hora es obligatoria'),
  nombre: z.string().trim().min(1, 'programacion[].nombre es obligatorio'),
  descripcion: z.string().trim().min(1, 'programacion[].descripcion es obligatoria'),
  fechaISO,
});

// El panel solo puede tocar mes/programación (y, a partir de ahora, la galería que
// acompaña a cada show — ver nota abajo). El resto del contenido (título, fotos de
// portada, descripciones, pills, fases...) queda fijo. .strict() rechaza cualquier
// otro campo que se intente mandar, en vez de ignorarlo en silencio.
const updateSchema = z
  .object({
    mes: z.string().trim().optional(),
    programacion: jsonArrayField(showSchema).optional(),
  })
  .strict();

const uploadImagenes = uploadMiddleware.array('imagenes', MAX_SHOWS);

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

// GET / — listar las 2 experiencias (contenido completo, de solo lectura desde acá)
router.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('eventos_fijos')
    .select('*')
    .order('creado_en', { ascending: true });

  if (error) {
    return next(errorGenerico(error, 'GET /api/admin/eventos-fijos'));
  }

  res.json({ ok: true, data });
});

// PATCH /:id — mes/programación (multipart/form-data). Si se manda una programación
// nueva, hay que subir EXACTAMENTE una foto por show, en el mismo orden — esas fotos
// pasan a ser la `galeria` de la fila, reemplazando la anterior. El frontend real ya
// muestra la foto de un show buscando `galeria[posición_del_show % cantidad_de_fotos]`;
// con la misma cantidad de fotos que de shows, esa cuenta deja de repetir nada y cada
// show queda con su foto real — no hace falta ningún cambio de frontend.
// No hay POST ni DELETE a propósito: estas 2 filas no se crean ni se borran desde el
// panel (ver hallazgo en EventosFijos.jsx — la página está hardcodeada para exactamente 2).
router.patch('/:id', requireCsrf, uploadImagenes, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase
    .from('eventos_fijos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !actual) {
    const err = new Error('Experiencia no encontrada');
    err.status = 404;
    return next(err);
  }

  const result = updateSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }

  const archivos = req.files || [];
  const updates = {};
  let galeriaVieja = null;

  if (result.data.mes !== undefined) {
    updates.mes = result.data.mes;
  }

  if (result.data.programacion !== undefined) {
    const programacion = result.data.programacion;

    if (archivos.length !== programacion.length) {
      const err = new Error(
        `Debés subir exactamente ${programacion.length} foto(s) — una por cada show de la programación (recibidas: ${archivos.length})`
      );
      err.status = 400;
      return next(err);
    }

    // Validar TODAS las fotos antes de subir ninguna.
    for (const archivo of archivos) {
      await validarWebpReal(archivo.buffer);
    }

    const urls = [];
    for (const archivo of archivos) {
      const { url } = await procesarYSubirImagen(archivo.buffer, CARPETA_GALERIA);
      urls.push(url);
    }

    updates.programacion = programacion;
    updates.galeria = urls;
    galeriaVieja = actual.galeria;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('eventos_fijos').update(updates).eq('id', id);

    if (error) {
      if (updates.galeria) {
        for (const url of updates.galeria) await borrarImagenPorUrl(url);
      }
      return next(errorGenerico(error, 'PATCH /api/admin/eventos-fijos/:id'));
    }

    if (galeriaVieja) {
      for (const url of galeriaVieja) await borrarImagenPorUrl(url);
    }

    await logAudit({
      actor: req.admin,
      accion: 'editar',
      entidad: 'eventos_fijos',
      entidadId: id,
      detalle: { mes: updates.mes, cantidadShows: updates.programacion?.length },
    });
  }

  const { data } = await supabase.from('eventos_fijos').select('*').eq('id', id).single();
  res.json({ ok: true, data });
});

// Router público de solo lectura — sin requireAdmin ni requireCsrf, en camelCase.
// Filtra activo:true por consistencia con el resto (aunque hoy el PATCH de admin no
// expone ese campo — ver nota de la corrección hecha antes de construir esto).
export const eventosFijosPublicoRouter = Router();

eventosFijosPublicoRouter.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('eventos_fijos')
    .select('*')
    .eq('activo', true)
    .order('creado_en', { ascending: true });

  if (error) {
    return next(errorGenerico(error, 'GET /api/eventos-fijos'));
  }

  res.json({ ok: true, data: toCamelCase(data) });
});

export default router;
