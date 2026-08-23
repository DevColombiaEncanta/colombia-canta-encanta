import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { logAudit } from '../lib/auditLog.js';
import { uploadMiddleware, validarImagenReal, procesarYSubirImagen, borrarImagenPorUrl } from '../lib/imageUpload.js';
import { jsonArrayField } from '../lib/zodMultipart.js';
import { toCamelCase } from '../lib/camelCase.js';
import { errorGenerico } from '../lib/errores.js';

const router = Router();
const CARPETA_GALERIA = 'eventos-fijos/galeria';
const MAX_SHOWS = 20; // tope razonable de shows en una programación mensual

const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fechaISO debe tener formato YYYY-MM-DD');

// 2026-08-16 · Rediseño pedido por el usuario, reemplaza el esquema anterior
// (galería aparte, ligada a cada show solo por posición en la lista — ver
// git history de este archivo). Cada show ahora guarda su propia `foto`
// dentro del mismo objeto — se puede agregar/editar/borrar un show sin
// tener que volver a mandar la foto de los demás. `nombre`/`descripcion`
// quedan opcionales porque "Colombia me Enamoras" no los necesita (siempre
// es la misma experiencia, solo cambian las fechas) — el frontend público
// usa el título de la experiencia como respaldo cuando faltan.
const showSchema = z.object({
  dia: z.string().trim().min(1, 'programacion[].dia es obligatorio'),
  hora: z.string().trim().min(1, 'programacion[].hora es obligatoria'),
  nombre: z.string().trim().optional(),
  descripcion: z.string().trim().optional(),
  fechaISO,
  // Opcional a nivel de Zod a propósito: un show con foto nueva llega SIN
  // esta clave (se completa más abajo con la URL recién subida, según
  // `fotosIndices`) — la obligatoriedad real (todo show necesita alguna
  // foto, vieja o nueva) se valida aparte, no acá.
  foto: z.string().trim().url('programacion[].foto debe ser una URL válida').optional(),
});

// El panel solo puede tocar mes/programación. El resto del contenido (título,
// foto de portada, galería de la tarjeta de inicio, descripciones, pills,
// fases...) queda fijo. .strict() rechaza cualquier otro campo que se
// intente mandar, en vez de ignorarlo en silencio.
const updateSchema = z
  .object({
    mes: z.string().trim().optional(),
    programacion: jsonArrayField(showSchema).optional(),
    // Índices (dentro de `programacion`) que traen una foto NUEVA en este
    // envío, en el mismo orden que los archivos subidos — ej. `[0, 2]`
    // significa "el primer archivo es la foto de programacion[0], el
    // segundo es la de programacion[2]". Los shows no listados acá ya
    // deben traer su `foto` (una URL existente) en el propio objeto.
    fotosIndices: jsonArrayField(z.number().int().nonnegative()).optional(),
  })
  .strict();

const uploadImagenes = uploadMiddleware.array('fotos', MAX_SHOWS);

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

// PATCH /:id — mes/programación (multipart/form-data). Cada show de
// `programacion` necesita una `foto`: o ya la trae (URL existente, sin
// cambios) o su índice aparece en `fotosIndices` con un archivo nuevo en el
// mismo orden. No hay POST ni DELETE a propósito: estas 2 filas no se crean
// ni se borran desde el panel (ver hallazgo en EventosFijos.jsx — la página
// está hardcodeada para exactamente 2).
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
  let fotosViejasHuerfanas = [];

  if (result.data.mes !== undefined) {
    updates.mes = result.data.mes;
  }

  if (result.data.programacion !== undefined) {
    const programacion = result.data.programacion;
    const fotosIndices = result.data.fotosIndices || [];

    if (archivos.length !== fotosIndices.length) {
      const err = new Error(
        `Se esperaban ${fotosIndices.length} foto(s) nueva(s) pero llegaron ${archivos.length}`
      );
      err.status = 400;
      return next(err);
    }

    const indicesConFotoNueva = new Set(fotosIndices);
    const idxSinFoto = programacion.findIndex((show, idx) => !indicesConFotoNueva.has(idx) && !show.foto);
    if (idxSinFoto !== -1) {
      const err = new Error(`programacion[${idxSinFoto}] necesita una foto`);
      err.status = 400;
      return next(err);
    }

    // Validar TODAS las fotos antes de subir ninguna.
    for (const archivo of archivos) {
      await validarImagenReal(archivo.buffer);
    }

    const urlsNuevas = [];
    for (const archivo of archivos) {
      const { url } = await procesarYSubirImagen(archivo.buffer, CARPETA_GALERIA);
      urlsNuevas.push(url);
    }

    fotosIndices.forEach((idxShow, idxArchivo) => {
      programacion[idxShow].foto = urlsNuevas[idxArchivo];
    });

    // Fotos que ya no queda ninguna referencia en la programación nueva
    // (show borrado, o su foto fue reemplazada) — se borran de Storage
    // recién si el guardado sale bien.
    const fotosNuevasSet = new Set(programacion.map((s) => s.foto));
    fotosViejasHuerfanas = (actual.programacion || [])
      .map((s) => s.foto)
      .filter((url) => url && !fotosNuevasSet.has(url));

    updates.programacion = programacion;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('eventos_fijos').update(updates).eq('id', id);

    if (error) {
      // Las fotos recién subidas en este intento quedarían huérfanas si el
      // UPDATE falla — se identifican como las que no estaban ya en la fila
      // actual antes de este PATCH.
      if (updates.programacion) {
        const fotosViejas = new Set((actual.programacion || []).map((s) => s.foto));
        for (const show of updates.programacion) {
          if (show.foto && !fotosViejas.has(show.foto)) await borrarImagenPorUrl(show.foto);
        }
      }
      return next(errorGenerico(error, 'PATCH /api/admin/eventos-fijos/:id'));
    }

    for (const url of fotosViejasHuerfanas) await borrarImagenPorUrl(url);

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
