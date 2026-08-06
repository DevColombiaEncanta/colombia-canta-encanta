import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { limiterEstricto } from '../middleware/rateLimiters.js';
import { logAudit } from '../lib/auditLog.js';
import { stripUndefined } from '../lib/zodMultipart.js';
import { errorGenerico } from '../lib/errores.js';

const ESTADOS = ['pendiente', 'pagada', 'cancelada', 'libre'];

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

// 23503 = foreign_key_violation (evento_id/evento_fijo_id inexistente).
function traducirError(error) {
  if (error.code === '23503') {
    const err = new Error('El evento indicado no existe');
    err.status = 400;
    return err;
  }
  return errorGenerico(error, 'reservas.js traducirError');
}

async function obtenerReservaCompleta(id) {
  const { data } = await supabase
    .from('reservas')
    .select('*, eventos(titulo, slug, fecha, fecha_iso), eventos_fijos(titulo, slug)')
    .eq('id', id)
    .single();
  return data;
}

// ── Router público: recepción de reservas desde ReservaModal ──
// Dos formas mutuamente excluyentes (igual que el CHECK de la tabla): evento_id
// (accion_tipo:'libre') o evento_fijo_id+show_seleccionado (Salas/Enamoras, que no
// tienen accion_tipo — sus reservas son siempre gratuitas, no hay campo de precio
// estructurado en su esquema). Eventos de pago quedan fuera de este alcance.
export const reservasPublicRouter = Router();

const datosComprador = {
  nombre: z.string().trim().min(2, 'Ingresa tu nombre completo'),
  celular: z.string().trim().min(7, 'Ingresa un número de celular válido'),
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  cantidad: z.coerce.number().int('cantidad debe ser un entero').positive('cantidad debe ser mayor a 0'),
};

const showSeleccionadoSchema = z.object({
  dia: z.string(),
  hora: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable().optional(),
  fecha_iso: z.string(),
});

const eventoSchema = z
  .object({
    evento_id: z.string().uuid('evento_id debe ser un uuid válido'),
    zona_seleccionada: z.object({ nombre: z.string(), precio: z.number() }).nullable().optional(),
    ...datosComprador,
  })
  .strict();

const eventoFijoSchema = z
  .object({
    evento_fijo_id: z.string().uuid('evento_fijo_id debe ser un uuid válido'),
    show_seleccionado: showSeleccionadoSchema.nullable().optional(),
    ...datosComprador,
  })
  .strict();

const publicSchema = z.union([eventoSchema, eventoFijoSchema]);

// POST / — recepción pública. estado/referencia_mp quedan siempre fuera del alcance
// público (.strict() los rechaza) — estado se fuerza a 'libre' en el servidor.
reservasPublicRouter.post('/', limiterEstricto, async (req, res, next) => {
  const result = publicSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }

  const datos = result.data;

  if ('evento_id' in datos) {
    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .select('id, max_entradas')
      .eq('id', datos.evento_id)
      .eq('activo', true)
      .eq('accion_tipo', 'libre')
      .maybeSingle();

    if (eventoError || !evento) {
      const err = new Error('El evento indicado no existe, no está activo, o no acepta reservas gratuitas');
      err.status = 400;
      return next(err);
    }

    const maxEntradas = evento.max_entradas ?? 20;
    if (datos.cantidad > maxEntradas) {
      const err = new Error(`La cantidad máxima de entradas por reserva para este evento es ${maxEntradas}`);
      err.status = 400;
      return next(err);
    }

    const { data, error } = await supabase
      .from('reservas')
      .insert({ ...datos, estado: 'libre' })
      .select()
      .single();

    if (error) return next(traducirError(error));
    return res.status(201).json({ ok: true, data });
  }

  // evento_fijo_id — Salas/Enamoras.
  const { data: eventoFijo, error: eventoFijoError } = await supabase
    .from('eventos_fijos')
    .select('id, max_entradas, programacion')
    .eq('id', datos.evento_fijo_id)
    .eq('activo', true)
    .maybeSingle();

  if (eventoFijoError || !eventoFijo) {
    const err = new Error('El evento indicado no existe o no está activo');
    err.status = 400;
    return next(err);
  }

  const tieneProgramacion = (eventoFijo.programacion?.length ?? 0) > 0;

  // Si el evento fijo tiene programación (Salas), hay que elegir un show real de esa
  // lista — nunca se confía en el snapshot que manda el cliente sin cruzarlo contra
  // la programación vigente. Si no tiene programación (Enamoras), la reserva es
  // general y no debe traer ningún show.
  // Nota: dentro del jsonb de `programacion` la clave real es `fechaISO` (camelCase),
  // no `fecha_iso` — así quedó sembrada la data real (confirmado contra la base),
  // aunque el contrato público de este endpoint sí usa snake_case como el resto.
  if (tieneProgramacion) {
    const coincide = datos.show_seleccionado && eventoFijo.programacion.some(
      (p) => p.fechaISO === datos.show_seleccionado.fecha_iso && p.nombre === datos.show_seleccionado.nombre
    );
    if (!coincide) {
      const err = new Error('El show seleccionado no existe en la programación actual de este evento');
      err.status = 400;
      return next(err);
    }
  } else if (datos.show_seleccionado) {
    const err = new Error('Este evento no tiene programación — no debe indicarse un show');
    err.status = 400;
    return next(err);
  }

  const maxEntradas = eventoFijo.max_entradas ?? 20;
  if (datos.cantidad > maxEntradas) {
    const err = new Error(`La cantidad máxima de entradas por reserva para este evento es ${maxEntradas}`);
    err.status = 400;
    return next(err);
  }

  const { data, error } = await supabase
    .from('reservas')
    .insert({ ...datos, estado: 'libre' })
    .select()
    .single();

  if (error) return next(traducirError(error));
  res.status(201).json({ ok: true, data });
});

// ── Router admin: gestión (montado en /api/admin/reservas con requireAdmin) ──
const router = Router();

const updateSchema = z
  .object({
    nombre: z.string().trim().min(2).optional(),
    celular: z.string().trim().min(7).optional(),
    email: z.string().trim().email().optional(),
    cantidad: z.coerce.number().int().positive().optional(),
    estado: z.enum(ESTADOS).optional(),
    referencia_mp: z.string().trim().nullable().optional(),
  })
  .strict();

// GET / — listar todas las reservas, con el evento ya embebido
router.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('reservas')
    .select('*, eventos(titulo, slug, fecha, fecha_iso), eventos_fijos(titulo, slug)')
    .order('creado_en', { ascending: false });

  if (error) {
    return next(errorGenerico(error, 'GET /api/admin/reservas'));
  }

  res.json({ ok: true, data });
});

// PATCH /:id — el admin puede corregir datos del comprador, cambiar estado
// (ej. cancelar) o registrar una referencia de pago manual.
router.patch('/:id', requireCsrf, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase
    .from('reservas')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !actual) {
    const err = new Error('Reserva no encontrada');
    err.status = 404;
    return next(err);
  }

  const result = updateSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }

  const updates = stripUndefined(result.data);

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('reservas').update(updates).eq('id', id);

    if (error) {
      return next(traducirError(error));
    }

    await logAudit({
      actor: req.admin,
      accion: 'editar',
      entidad: 'reservas',
      entidadId: id,
      detalle: updates,
    });
  }

  res.json({ ok: true, data: await obtenerReservaCompleta(id) });
});

// DELETE /:id — se permite (ej. duplicados o envíos erróneos), igual criterio que
// Inscripciones; para solo cerrar un caso sin perder el registro, usar
// PATCH { estado: 'cancelada' } en su lugar.
router.delete('/:id', requireCsrf, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase
    .from('reservas')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !actual) {
    const err = new Error('Reserva no encontrada');
    err.status = 404;
    return next(err);
  }

  const { error } = await supabase.from('reservas').delete().eq('id', id);
  if (error) {
    return next(errorGenerico(error, 'DELETE /api/admin/reservas/:id'));
  }

  await logAudit({
    actor: req.admin,
    accion: 'borrar',
    entidad: 'reservas',
    entidadId: id,
    detalle: { nombre: actual.nombre, evento_id: actual.evento_id, evento_fijo_id: actual.evento_fijo_id },
  });

  res.json({ ok: true });
});

export default router;
