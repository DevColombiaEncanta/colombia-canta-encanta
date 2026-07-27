import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { limiterEstricto } from '../middleware/rateLimiters.js';
import { logAudit } from '../lib/auditLog.js';
import { stripUndefined } from '../lib/zodMultipart.js';

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
  const err = new Error(error.message);
  err.status = 400;
  return err;
}

async function obtenerInscripcionCompleta(id) {
  const { data } = await supabase
    .from('inscripciones')
    .select('*, cursos(nombre), niveles(nombre)')
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
    monto_pagado: z.coerce.number().nonnegative().nullable().optional(),
    fecha_pago: fechaISO.nullable().optional(),
    metodo_pago: z.string().trim().nullable().optional(),
    notas_pago: z.string().trim().nullable().optional(),
  })
  .strict();

// GET / — listar todas las inscripciones, con el nombre de curso/nivel ya embebido
router.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('inscripciones')
    .select('*, cursos(nombre), niveles(nombre)')
    .order('creado_en', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    return next(err);
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

  const updates = stripUndefined(result.data);

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('inscripciones').update(updates).eq('id', id);

    if (error) {
      return next(traducirError(error));
    }

    await logAudit({
      actor: req.admin,
      accion: 'editar',
      entidad: 'inscripciones',
      entidadId: id,
      detalle: updates,
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
    const err = new Error(error.message);
    err.status = 400;
    return next(err);
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
