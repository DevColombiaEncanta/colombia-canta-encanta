import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { limiterEstricto } from '../middleware/rateLimiters.js';
import { logAudit } from '../lib/auditLog.js';
import { stripUndefined } from '../lib/zodMultipart.js';
import { errorGenerico } from '../lib/errores.js';

const ESTADOS = ['pendiente', 'confirmada', 'cancelada'];
const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_pago debe tener formato YYYY-MM-DD');

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

// 23503 = foreign_key_violation (curso_id o nivel_id inexistente).
function traducirError(error) {
  if (error.code === '23503') {
    const err = new Error('El curso o el nivel indicado no existe');
    err.status = 400;
    return err;
  }
  return errorGenerico(error, 'inscripciones.js traducirError');
}

// ⭐ Hallazgo real (auditoría 5.5, 2026-08-19): el panel ya restringe el
// selector de Nivel a los que el curso tiene asociados (`curso_niveles`),
// pero el backend no lo confirmaba — una llamada directa a la API (sin pasar
// por la UI) podía asignarle a un estudiante un nivel que ese curso ni
// siquiera ofrece. Mismo criterio que `validarNivelesExisten` en cursos.js.
async function validarNivelDelCurso(nivelId, cursoId) {
  if (!nivelId) return; // desasignar (null) siempre es válido
  const { data, error } = await supabase
    .from('curso_niveles')
    .select('nivel_id')
    .eq('curso_id', cursoId)
    .eq('nivel_id', nivelId)
    .maybeSingle();
  if (error) {
    throw errorGenerico(error, 'inscripciones.js validarNivelDelCurso');
  }
  if (!data) {
    const err = new Error('El nivel indicado no está asociado al curso de esta inscripción');
    err.status = 400;
    throw err;
  }
}

async function obtenerInscripcionCompleta(id) {
  const { data } = await supabase
    .from('inscripciones')
    .select('*, cursos(nombre, duracion, precio_numerico), niveles(nombre), inscripcion_pagos(*)')
    .eq('id', id)
    .single();
  return data;
}

// ── Router público: recepción de inscripciones desde el formulario del sitio ──
// Sin sesión de admin (no aplica CSRF), pero es la primera escritura pública real
// del proyecto: limiterEstricto es la defensa principal contra spam/abuso.
export const inscripcionesPublicRouter = Router();

const publicSchema = z
  .object({
    curso_id: z.string().uuid('curso_id debe ser un uuid válido'),
    estudiante_nombre: z.string().trim().min(1, 'estudiante_nombre es obligatorio'),
    estudiante_documento: z.string().trim().min(1, 'estudiante_documento es obligatorio'),
    estudiante_edad: z.coerce.number().int('estudiante_edad debe ser un entero').positive('estudiante_edad debe ser mayor a 0'),
    estudiante_email: z.string().trim().email('estudiante_email debe ser un correo válido').optional(),
    estudiante_telefono: z.string().trim().optional(),
    acudiente_nombre: z.string().trim().optional(),
    acudiente_contacto: z.string().trim().optional(),
    acudiente_email: z.string().trim().email('acudiente_email debe ser un correo válido').optional(),
    acudiente_parentesco: z.string().trim().optional(),
    horario_preferencia: z.string().trim().min(1, 'horario_preferencia es obligatoria'),
    barrio: z.string().trim().optional(),
    acepta_terminos: z.literal(true, { errorMap: () => ({ message: 'Debés aceptar los términos' }) }),
  })
  .strict()
  .refine(
    (d) =>
      d.estudiante_edad >= 18 ||
      (d.acudiente_nombre && d.acudiente_contacto && d.acudiente_parentesco),
    {
      message: 'Si el estudiante es menor de edad, los datos del acudiente son obligatorios',
      path: ['acudiente_nombre'],
    }
  );

// POST / — recepción pública. nivel_id/estado/pago quedan siempre fuera del alcance
// del público (.strict() los rechaza si alguien intenta mandarlos) — eso lo define
// el admin después, al evaluar al estudiante y registrar el pago.
inscripcionesPublicRouter.post('/', limiterEstricto, async (req, res, next) => {
  const result = publicSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }

  const { data: curso, error: cursoError } = await supabase
    .from('cursos')
    .select('id')
    .eq('id', result.data.curso_id)
    .eq('activo', true)
    .maybeSingle();

  if (cursoError || !curso) {
    const err = new Error('El curso indicado no existe o ya no está activo');
    err.status = 400;
    return next(err);
  }

  const { data, error } = await supabase.from('inscripciones').insert(result.data).select().single();

  if (error) {
    return next(traducirError(error));
  }

  res.status(201).json({ ok: true, data });
});

// ── Router admin: gestión (montado en /api/admin/inscripciones con requireAdmin) ──
const router = Router();

const ESTADOS_CUOTA = ['pendiente', 'pagado', 'mora'];

// 5.5 · Rediseño de pagos a pedido del usuario (2026-08-19): en vez de un
// único registro de pago, cada inscripción tiene 1 cuota por mes de la
// duración del curso — se reemplazan completas (Opción A, mismo criterio que
// curso_niveles/producto_variantes) cada vez que el campo `cuotas` viene en
// el body, así el admin puede generar/editar/borrar filas libremente desde
// el panel sin necesitar 4 endpoints nuevos por cuota individual.
const cuotaSchema = z.object({
  numero_cuota: z.coerce.number().int('numero_cuota debe ser un entero').positive('numero_cuota debe ser mayor a 0'),
  monto: z.coerce.number().nonnegative('monto no puede ser negativo').nullable().optional(),
  estado: z.enum(ESTADOS_CUOTA).optional().default('pendiente'),
  fecha_pago: fechaISO.nullable().optional(),
  metodo_pago: z.string().trim().nullable().optional(),
});
const cuotasArraySchema = z.array(cuotaSchema)
  .max(60, 'no puede haber más de 60 cuotas (5 años)')
  .optional()
  .refine((arr) => !arr || new Set(arr.map((c) => c.numero_cuota)).size === arr.length, {
    message: 'No puede haber 2 cuotas con el mismo número de mes',
  });

const updateSchema = z
  .object({
    curso_id: z.string().uuid().optional(),
    nivel_id: z.string().uuid().nullable().optional(),
    estudiante_nombre: z.string().trim().min(1).optional(),
    estudiante_documento: z.string().trim().min(1).optional(),
    estudiante_edad: z.coerce.number().int().positive().optional(),
    estudiante_email: z.string().trim().email().nullable().optional(),
    estudiante_telefono: z.string().trim().nullable().optional(),
    acudiente_nombre: z.string().trim().nullable().optional(),
    acudiente_contacto: z.string().trim().nullable().optional(),
    acudiente_email: z.string().trim().email().nullable().optional(),
    acudiente_parentesco: z.string().trim().nullable().optional(),
    horario_preferencia: z.string().trim().min(1).optional(),
    barrio: z.string().trim().nullable().optional(),
    acepta_terminos: z.boolean().optional(),
    estado: z.enum(ESTADOS).optional(),
    cuotas: cuotasArraySchema,
  })
  .strict();

// GET / — listar todas las inscripciones, con el nombre de curso/nivel y las cuotas ya embebidas
router.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('inscripciones')
    .select('*, cursos(nombre, duracion, precio_numerico), niveles(nombre), inscripcion_pagos(*)')
    .order('creado_en', { ascending: false });

  if (error) {
    return next(errorGenerico(error, 'GET /api/admin/inscripciones'));
  }

  res.json({ ok: true, data });
});

// PATCH /:id — el admin puede corregir cualquier dato, cambiar estado, asignar nivel
// y registrar el pago manualmente. curso_id/nivel_id inexistentes se traducen (23503).
router.patch('/:id', requireCsrf, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase
    .from('inscripciones')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !actual) {
    const err = new Error('Inscripción no encontrada');
    err.status = 404;
    return next(err);
  }

  const result = updateSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }

  const { cuotas, ...camposParciales } = result.data;
  const updates = stripUndefined(camposParciales);

  if (updates.nivel_id !== undefined) {
    const cursoIdResultante = updates.curso_id ?? actual.curso_id;
    await validarNivelDelCurso(updates.nivel_id, cursoIdResultante);
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('inscripciones').update(updates).eq('id', id);

    if (error) {
      return next(traducirError(error));
    }
  }

  // Cuotas: reemplazo completo si se manda el campo, igual que curso_niveles/
  // producto_variantes — el admin genera/edita/borra filas libremente en el
  // panel y siempre se manda la lista completa, no cambios puntuales.
  if (cuotas !== undefined) {
    const { error: deleteError } = await supabase.from('inscripcion_pagos').delete().eq('inscripcion_id', id);
    if (deleteError) {
      return next(errorGenerico(deleteError, 'PATCH /api/admin/inscripciones/:id (inscripcion_pagos delete)'));
    }

    if (cuotas.length > 0) {
      const filas = cuotas.map((c) => ({
        inscripcion_id: id,
        numero_cuota: c.numero_cuota,
        monto: c.monto ?? null,
        estado: c.estado,
        fecha_pago: c.fecha_pago ?? null,
        metodo_pago: c.metodo_pago ?? null,
      }));
      const { error: insertError } = await supabase.from('inscripcion_pagos').insert(filas);
      if (insertError) {
        return next(errorGenerico(insertError, 'PATCH /api/admin/inscripciones/:id (inscripcion_pagos insert)'));
      }
    }
  }

  if (Object.keys(updates).length > 0 || cuotas !== undefined) {
    await logAudit({
      actor: req.admin,
      accion: 'editar',
      entidad: 'inscripciones',
      entidadId: id,
      detalle: { ...updates, cuotasActualizadas: cuotas !== undefined },
    });
  }

  res.json({ ok: true, data: await obtenerInscripcionCompleta(id) });
});

// DELETE /:id — se permite (ej. duplicados o envíos erróneos), pero queda anotado en
// audit_log como cualquier otra escritura sensible; para simplemente cerrar un caso sin
// perder el registro, el admin puede usar PATCH { estado: 'cancelada' } en su lugar.
router.delete('/:id', requireCsrf, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase
    .from('inscripciones')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !actual) {
    const err = new Error('Inscripción no encontrada');
    err.status = 404;
    return next(err);
  }

  const { error } = await supabase.from('inscripciones').delete().eq('id', id);
  if (error) {
    return next(errorGenerico(error, 'DELETE /api/admin/inscripciones/:id'));
  }

  await logAudit({
    actor: req.admin,
    accion: 'borrar',
    entidad: 'inscripciones',
    entidadId: id,
    detalle: { estudianteNombre: actual.estudiante_nombre, curso_id: actual.curso_id },
  });

  res.json({ ok: true });
});

export default router;
