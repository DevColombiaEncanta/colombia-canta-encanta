import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { logAudit } from '../lib/auditLog.js';
import { uploadMiddleware, validarWebpReal, procesarYSubirImagen, borrarImagenPorUrl } from '../lib/imageUpload.js';
import { booleanFromString, jsonArrayField, stripUndefined } from '../lib/zodMultipart.js';
import { toCamelCase } from '../lib/camelCase.js';

const router = Router();
const CARPETA = 'cursos';

const horarioSchema = z.object({
  dia: z.string().trim().min(1, 'horarios[].dia es obligatorio'),
  hora: z.string().trim().min(1, 'horarios[].hora es obligatoria'),
});

const nivelesArraySchema = jsonArrayField(z.string().uuid('cada nivel debe ser un uuid válido'))
  .optional()
  .refine((arr) => !arr || new Set(arr).size === arr.length, {
    message: 'No puede haber un mismo nivel repetido en la lista',
  });

const baseCursoSchema = z.object({
  nombre: z.string().trim().min(1, 'nombre es obligatorio'),
  tagline: z.string().trim().optional(),
  color: z.string().trim().optional(),
  descripcion: z.string().trim().min(1, 'descripcion es obligatoria'),
  instrumentos: jsonArrayField(z.string().min(1)).optional(),
  horarios: jsonArrayField(horarioSchema).optional(),
  duracion: z.string().trim().optional(),
  precio: z.string().trim().optional(),
  precio_numerico: z.coerce.number().positive('precio_numerico debe ser mayor a 0').optional(),
  orden: z.coerce.number().int('orden debe ser un entero'),
  niveles: nivelesArraySchema,
});

const createCursoSchema = baseCursoSchema;
const updateCursoSchema = baseCursoSchema.partial().extend({
  activo: booleanFromString.optional(),
});

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

// 23503 = foreign_key_violation. Al crear/editar significa un nivel_id que no existe;
// al borrar significa que hay inscripciones referenciando este curso (ON DELETE RESTRICT).
function traducirErrorCurso(error, esBorrado = false) {
  if (error.code === '23503') {
    if (esBorrado) {
      const err = new Error('No se puede borrar — hay inscripciones que dependen de este curso');
      err.status = 409;
      return err;
    }
    const err = new Error('Uno de los niveles no existe');
    err.status = 400;
    return err;
  }
  const err = new Error(error.message);
  err.status = 400;
  return err;
}

// Se confirma que todos los nivel_id existan ANTES de tocar curso_niveles — si se
// hiciera al revés (borrar primero, insertar después), un nivel_id inválido dejaría
// el curso sin niveles: la validación ya rechaza la petición, pero el borrado previo
// ya se habría aplicado (no hay transacción multi-tabla real vía PostgREST).
async function validarNivelesExisten(niveles) {
  if (!niveles || niveles.length === 0) return;
  const { data, error } = await supabase.from('niveles').select('id').in('id', niveles);
  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  if (data.length !== niveles.length) {
    const err = new Error('Uno de los niveles no existe');
    err.status = 400;
    throw err;
  }
}

function aplanarNiveles(curso) {
  const { curso_niveles, ...resto } = curso;
  const niveles = (curso_niveles || []).map((cn) => cn.niveles).filter(Boolean);
  return { ...resto, niveles };
}

async function obtenerCursoCompleto(id) {
  const { data } = await supabase
    .from('cursos')
    .select('*, curso_niveles(niveles(*))')
    .eq('id', id)
    .single();
  return aplanarNiveles(data);
}

// GET / — listar todos los cursos con sus niveles asociados
router.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('cursos')
    .select('*, curso_niveles(niveles(*))')
    .order('orden', { ascending: true });

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    return next(err);
  }

  res.json({ ok: true, data: data.map(aplanarNiveles) });
});

// POST / — crear curso + relaciones con niveles (multipart/form-data: campos + archivo "icono")
router.post('/', requireCsrf, uploadMiddleware.single('icono'), async (req, res, next) => {
  if (!req.file) {
    const err = new Error('icono es obligatorio');
    err.status = 400;
    return next(err);
  }

  const result = createCursoSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }
  const { niveles, ...camposCurso } = result.data;

  await validarNivelesExisten(niveles);
  await validarWebpReal(req.file.buffer);
  const { url } = await procesarYSubirImagen(req.file.buffer, CARPETA);

  const { data: curso, error: cursoError } = await supabase
    .from('cursos')
    .insert({ ...camposCurso, icono: url })
    .select()
    .single();

  if (cursoError) {
    await borrarImagenPorUrl(url);
    return next(traducirErrorCurso(cursoError));
  }

  if (niveles && niveles.length > 0) {
    const filas = niveles.map((nivel_id) => ({ curso_id: curso.id, nivel_id }));
    const { error: relError } = await supabase.from('curso_niveles').insert(filas);

    if (relError) {
      // El curso ya se creó — si las relaciones fallan (ej. un nivel_id inexistente),
      // no dejamos un curso a medias: se revierte, mismo criterio que Productos.
      await supabase.from('cursos').delete().eq('id', curso.id);
      await borrarImagenPorUrl(url);
      return next(traducirErrorCurso(relError));
    }
  }

  await logAudit({
    actor: req.admin,
    accion: 'crear',
    entidad: 'cursos',
    entidadId: curso.id,
    detalle: { nombre: curso.nombre },
  });

  res.status(201).json({ ok: true, data: await obtenerCursoCompleto(curso.id) });
});

// PATCH /:id — editar. Icono: si se manda archivo nuevo, reemplaza el actual.
// Niveles: reemplazo completo si se manda el campo (Opción A, igual que Productos).
router.patch('/:id', requireCsrf, uploadMiddleware.single('icono'), async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase.from('cursos').select('*').eq('id', id).maybeSingle();
  if (fetchError || !actual) {
    const err = new Error('Curso no encontrado');
    err.status = 404;
    return next(err);
  }

  const result = updateCursoSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }
  const { niveles, ...camposParciales } = result.data;
  const camposCurso = stripUndefined(camposParciales);

  await validarNivelesExisten(niveles);

  let iconoViejo = null;
  if (req.file) {
    await validarWebpReal(req.file.buffer);
    const { url } = await procesarYSubirImagen(req.file.buffer, CARPETA);
    camposCurso.icono = url;
    iconoViejo = actual.icono;
  }

  // Niveles ANTES que el update del curso — si esto falla, el curso todavía no se tocó.
  if (niveles !== undefined) {
    const { error: deleteError } = await supabase.from('curso_niveles').delete().eq('curso_id', id);
    if (deleteError) {
      if (camposCurso.icono) await borrarImagenPorUrl(camposCurso.icono);
      const err = new Error(deleteError.message);
      err.status = 400;
      return next(err);
    }

    if (niveles.length > 0) {
      const filas = niveles.map((nivel_id) => ({ curso_id: id, nivel_id }));
      const { error: insertError } = await supabase.from('curso_niveles').insert(filas);
      if (insertError) {
        if (camposCurso.icono) await borrarImagenPorUrl(camposCurso.icono);
        return next(traducirErrorCurso(insertError));
      }
    }
  }

  const { error: updateError } = await supabase.from('cursos').update(camposCurso).eq('id', id);
  if (updateError) {
    return next(traducirErrorCurso(updateError));
  }

  if (iconoViejo) {
    await borrarImagenPorUrl(iconoViejo);
  }

  await logAudit({
    actor: req.admin,
    accion: 'editar',
    entidad: 'cursos',
    entidadId: id,
    detalle: { ...camposCurso, nivelesActualizados: niveles !== undefined },
  });

  res.json({ ok: true, data: await obtenerCursoCompleto(id) });
});

// DELETE /:id — borra el curso (curso_niveles se va solo por ON DELETE CASCADE) + su icono.
// Rechazado si hay inscripciones referenciando este curso (ON DELETE RESTRICT).
router.delete('/:id', requireCsrf, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase.from('cursos').select('*').eq('id', id).maybeSingle();
  if (fetchError || !actual) {
    const err = new Error('Curso no encontrado');
    err.status = 404;
    return next(err);
  }

  const { error } = await supabase.from('cursos').delete().eq('id', id);
  if (error) {
    return next(traducirErrorCurso(error, true));
  }

  if (actual.icono) {
    await borrarImagenPorUrl(actual.icono);
  }

  await logAudit({
    actor: req.admin,
    accion: 'borrar',
    entidad: 'cursos',
    entidadId: id,
    detalle: { nombre: actual.nombre },
  });

  res.json({ ok: true });
});

// Router público de solo lectura — sin requireAdmin ni requireCsrf, solo cursos
// activos, en camelCase. Los niveles embebidos también se filtran por su propio
// `activo` — un nivel desactivado no debe seguir apareciendo como opción disponible
// en un curso público, aunque la relación curso_niveles siga existiendo.
export const cursosPublicoRouter = Router();

cursosPublicoRouter.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('cursos')
    .select('*, curso_niveles(niveles(*))')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    return next(err);
  }

  const resultado = data.map((curso) => {
    const aplanado = aplanarNiveles(curso);
    return { ...aplanado, niveles: aplanado.niveles.filter((n) => n.activo) };
  });

  res.json({ ok: true, data: toCamelCase(resultado) });
});

export default router;
