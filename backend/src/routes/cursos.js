import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { logAudit } from '../lib/auditLog.js';
import { stripUndefined } from '../lib/zodMultipart.js';
import { toCamelCase } from '../lib/camelCase.js';
import { errorGenerico } from '../lib/errores.js';

const router = Router();

const horarioSchema = z.object({
  dia: z.string().trim().min(1, 'horarios[].dia es obligatorio'),
  hora: z.string().trim().min(1, 'horarios[].hora es obligatoria'),
  // Opcional (2026-08-28, contenido real compartido por el usuario): rango de
  // edad de esa franja puntual, ej. "6 a 8 años" — un mismo curso grupal puede
  // ofrecer horarios distintos según la edad del estudiante.
  edad: z.string().trim().max(40, 'horarios[].edad no puede superar 40 caracteres').optional().nullable(),
});

const nivelesArraySchema = z.array(z.string().uuid('cada nivel debe ser un uuid válido'))
  .max(50, 'no puede haber más de 50 niveles asociados')
  .optional()
  .refine((arr) => !arr || new Set(arr).size === arr.length, {
    message: 'No puede haber un mismo nivel repetido en la lista',
  });

// 5.5 · Ajuste a pedido del usuario (2026-08-19): sin subida de imagen, este
// router recibe JSON normal (ya no multipart/form-data) — los arrays/booleans
// llegan con su tipo real, sin necesidad de los helpers `jsonArrayField`/
// `booleanFromString` (esos son solo para cuando multer deja todo como texto).
// ⭐ Hallazgo real (auditoría 5.5, 2026-08-19): estos campos opcionales
// aceptan `null` además de `undefined` — el frontend los manda siempre como
// `null` al editar un curso (nunca los omite), para poder BORRAR un valor ya
// guardado. Antes, un campo vacío simplemente no se mandaba, así que una vez
// puesto un tagline/duración/precio/emoji, nunca se podía volver a limpiar
// desde el panel. `precio_numerico` necesita `z.union` en vez de solo
// `.nullable()` porque `z.coerce.number()` convierte `null` a `0` antes de
// llegar a `.positive()` — sin el union, mandar `null` fallaría la validación
// en vez de limpiar el campo.
const baseCursoSchema = z.object({
  nombre: z.string().trim().min(1, 'nombre es obligatorio'),
  tagline: z.string().trim().optional().nullable(),
  color: z.string().trim().optional(),
  descripcion: z.string().trim().min(1, 'descripcion es obligatoria'),
  instrumentos: z.array(z.string().min(1)).max(20, 'no puede haber más de 20 instrumentos').optional(),
  // Obligatorio (mínimo 1) para un curso grupal, opcional para uno
  // personalizado — esa regla cruzada se valida a mano más abajo
  // (validarHorariosRequeridos), no acá, por el mismo motivo que
  // profesor_nombre: `.refine()` sobre el objeto completo rompería el
  // `.partial()` que arma updateCursoSchema.
  horarios: z.array(horarioSchema).max(20, 'no puede haber más de 20 horarios').optional(),
  duracion: z.string().trim().optional().nullable(),
  precio: z.string().trim().optional().nullable(),
  precio_numerico: z.union([z.null(), z.coerce.number().positive('precio_numerico debe ser mayor a 0')]).optional(),
  // Cobro aparte del precio/cuotas del semestre (2026-08-28, contenido real
  // compartido por el usuario) — mismo union que precio_numerico y mismo
  // motivo: `z.coerce.number()` convertiría `null` en 0 antes de `.positive()`.
  matricula_numerico: z.union([z.null(), z.coerce.number().positive('matricula_numerico debe ser mayor a 0')]).optional(),
  orden: z.coerce.number().int('orden debe ser un entero'),
  niveles: nivelesArraySchema,
  // 5.5 · Cursos personalizados con profesor (ej. clases 1 a 1 de guitarra) —
  // pre-análisis en readme_guia.md, 2026-08-18. `profesor_nombre` solo tiene
  // sentido cuando `es_personalizado` es true; validado a mano más abajo
  // (validarProfesorPersonalizado), mismo motivo que arriba.
  es_personalizado: z.boolean().optional(),
  profesor_nombre: z.string().trim().max(80, 'profesor_nombre no puede superar 80 caracteres').optional().nullable(),
  // Reemplaza la subida de ícono real (2026-08-19, pedido del usuario: poco
  // realista que el staff suba fotos acá) — mismo respaldo visual liviano ya
  // usado en Productos/Eventos.
  emoji: z.string().trim().max(4, 'emoji no puede superar 4 caracteres').optional().nullable(),
});

const createCursoSchema = baseCursoSchema;
const updateCursoSchema = baseCursoSchema.partial().extend({
  activo: z.boolean().optional(),
});

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

// Se aplica tanto en POST (con `actual = null`) como en PATCH (con el registro
// ya guardado) para que un PATCH parcial que solo cambia `profesor_nombre` sin
// re-mandar `es_personalizado`, o viceversa, siga viendo el estado real.
function validarProfesorPersonalizado(datosNuevos, actual) {
  const esPersonalizado = datosNuevos.es_personalizado ?? actual?.es_personalizado ?? false;
  const profesorNombre = datosNuevos.profesor_nombre !== undefined ? datosNuevos.profesor_nombre : actual?.profesor_nombre;
  if (esPersonalizado && !profesorNombre?.trim()) {
    const err = new Error('profesor_nombre es obligatorio para un curso personalizado');
    err.status = 400;
    throw err;
  }
}

// Un curso grupal necesita al menos 1 franja horaria real para que el
// formulario público de inscripción pueda ofrecerla como opción seleccionable
// (2026-08-19, pedido del usuario) — un personalizado se coordina directo con
// el profesor, ahí sí puede quedar sin franjas fijas.
function validarHorariosRequeridos(datosNuevos, actual) {
  const esPersonalizado = datosNuevos.es_personalizado ?? actual?.es_personalizado ?? false;
  if (esPersonalizado) return;
  const horarios = datosNuevos.horarios !== undefined ? datosNuevos.horarios : actual?.horarios;
  if (!horarios || horarios.length === 0) {
    const err = new Error('horarios es obligatorio para un curso grupal (al menos 1 franja)');
    err.status = 400;
    throw err;
  }
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
  return errorGenerico(error, 'cursos.js traducirErrorCurso');
}

// Se confirma que todos los nivel_id existan ANTES de tocar curso_niveles — si se
// hiciera al revés (borrar primero, insertar después), un nivel_id inválido dejaría
// el curso sin niveles: la validación ya rechaza la petición, pero el borrado previo
// ya se habría aplicado (no hay transacción multi-tabla real vía PostgREST).
async function validarNivelesExisten(niveles) {
  if (!niveles || niveles.length === 0) return;
  const { data, error } = await supabase.from('niveles').select('id').in('id', niveles);
  if (error) {
    throw errorGenerico(error, 'cursos.js validarNivelesExisten');
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
    return next(errorGenerico(error, 'GET /api/admin/cursos'));
  }

  res.json({ ok: true, data: data.map(aplanarNiveles) });
});

// POST / — crear curso + relaciones con niveles (JSON)
router.post('/', requireCsrf, async (req, res, next) => {
  const result = createCursoSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }
  const { niveles, ...camposCurso } = result.data;

  validarProfesorPersonalizado(camposCurso, null);
  validarHorariosRequeridos(camposCurso, null);
  await validarNivelesExisten(niveles);

  const { data: curso, error: cursoError } = await supabase
    .from('cursos')
    .insert(camposCurso)
    .select()
    .single();

  if (cursoError) {
    return next(traducirErrorCurso(cursoError));
  }

  if (niveles && niveles.length > 0) {
    const filas = niveles.map((nivel_id) => ({ curso_id: curso.id, nivel_id }));
    const { error: relError } = await supabase.from('curso_niveles').insert(filas);

    if (relError) {
      // El curso ya se creó — si las relaciones fallan (ej. un nivel_id inexistente),
      // no dejamos un curso a medias: se revierte, mismo criterio que Productos.
      await supabase.from('cursos').delete().eq('id', curso.id);
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

// PATCH /:id — editar. Niveles: reemplazo completo si se manda el campo (Opción A, igual que Productos).
router.patch('/:id', requireCsrf, async (req, res, next) => {
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

  validarProfesorPersonalizado(camposCurso, actual);
  validarHorariosRequeridos(camposCurso, actual);
  await validarNivelesExisten(niveles);

  // Niveles ANTES que el update del curso — si esto falla, el curso todavía no se tocó.
  if (niveles !== undefined) {
    const { error: deleteError } = await supabase.from('curso_niveles').delete().eq('curso_id', id);
    if (deleteError) {
      return next(errorGenerico(deleteError, 'PATCH /api/admin/cursos/:id (curso_niveles delete)'));
    }

    if (niveles.length > 0) {
      const filas = niveles.map((nivel_id) => ({ curso_id: id, nivel_id }));
      const { error: insertError } = await supabase.from('curso_niveles').insert(filas);
      if (insertError) {
        return next(traducirErrorCurso(insertError));
      }
    }
  }

  if (Object.keys(camposCurso).length > 0) {
    const { error: updateError } = await supabase.from('cursos').update(camposCurso).eq('id', id);
    if (updateError) {
      return next(traducirErrorCurso(updateError));
    }
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

// DELETE /:id — borra el curso (curso_niveles se va solo por ON DELETE CASCADE).
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
    return next(errorGenerico(error, 'GET /api/cursos'));
  }

  const resultado = data.map((curso) => {
    const aplanado = aplanarNiveles(curso);
    return { ...aplanado, niveles: aplanado.niveles.filter((n) => n.activo) };
  });

  res.json({ ok: true, data: toCamelCase(resultado) });
});

export default router;
