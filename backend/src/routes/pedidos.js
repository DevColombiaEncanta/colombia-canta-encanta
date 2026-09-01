import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { limiterEstricto } from '../middleware/rateLimiters.js';
import { logAudit } from '../lib/auditLog.js';
import { stripUndefined } from '../lib/zodMultipart.js';
import { errorGenerico } from '../lib/errores.js';
import { paginacionSchema, aplicarRango, empaquetarPagina } from '../lib/paginacion.js';

const ESTADOS = ['pendiente', 'pagado', 'cancelado', 'enviado'];

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

function traducirError(error) {
  if (error.code === '23503') {
    const err = new Error('Uno de los productos indicados ya no existe');
    err.status = 400;
    return err;
  }
  return errorGenerico(error, 'pedidos.js traducirError');
}

async function obtenerPedidoCompleto(id) {
  const { data } = await supabase
    .from('pedidos')
    .select('*, pedido_items(*)')
    .eq('id', id)
    .single();
  return data;
}

// ── Router público: recepción de pedidos desde el carrito de Tienda ──
// El precio SIEMPRE se recalcula server-side a partir de `producto_variantes`
// + `productos` — el cliente solo manda `variante_id`/`cantidad`, nunca precio
// ni nombre (mismo principio que ya se aplica en reservas.js con `evento`).
export const pedidosPublicRouter = Router();

const itemSchema = z
  .object({
    variante_id: z.string().uuid('variante_id debe ser un uuid válido'),
    cantidad: z.coerce.number().int('cantidad debe ser un entero').positive('cantidad debe ser mayor a 0'),
  })
  .strict();

const publicSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Ingresa tu nombre completo'),
    celular: z.string().trim().min(7, 'Ingresa un número de celular válido'),
    email: z.string().trim().email('Ingresa un correo electrónico válido'),
    direccion: z.string().trim().min(5, 'Ingresa una dirección de envío válida'),
    ciudad: z.string().trim().min(2, 'Ingresa una ciudad válida'),
    direccion_adicional: z.string().trim().min(1).nullable().optional(),
    items: z.array(itemSchema).min(1, 'El pedido debe tener al menos un producto'),
    acepta_terminos: z.literal(true, { message: 'Debes aceptar los términos y condiciones' }),
  })
  .strict();

pedidosPublicRouter.post('/', limiterEstricto, async (req, res, next) => {
  const result = publicSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }

  const datos = result.data;

  // ⭐ Bug real (auditoría 2026-08-30): el chequeo de stock corría por cada
  // línea del body por separado — 2 líneas con el mismo `variante_id` (ej.
  // 5+5 contra un stock de 6) pasaban las 2 validaciones individuales aunque
  // pidieran 10 en total. Se agrupa por `variante_id` ANTES de validar, así
  // el pedido nunca tiene 2 líneas para la misma variante ni una forma de
  // sobrepasar el stock partiendo la cantidad en varias entradas del body.
  const cantidadesPorVariante = new Map();
  for (const item of datos.items) {
    cantidadesPorVariante.set(item.variante_id, (cantidadesPorVariante.get(item.variante_id) || 0) + item.cantidad);
  }
  const itemsAgrupados = [...cantidadesPorVariante.entries()].map(([variante_id, cantidad]) => ({ variante_id, cantidad }));

  const varianteIds = [...cantidadesPorVariante.keys()];
  const { data: variantes, error: variantesError } = await supabase
    .from('producto_variantes')
    .select('id, talla, color_nombre, stock, productos(id, nombre, precio, activo)')
    .in('id', varianteIds);

  if (variantesError) {
    return next(errorGenerico(variantesError, 'POST /api/pedidos (variantes)'));
  }

  const items = [];
  let total = 0;

  for (const item of itemsAgrupados) {
    const variante = variantes.find((v) => v.id === item.variante_id);

    if (!variante || !variante.productos?.activo) {
      const err = new Error('Uno de los productos de tu carrito ya no está disponible. Actualiza tu carrito e intenta de nuevo.');
      err.status = 400;
      return next(err);
    }

    if (item.cantidad > variante.stock) {
      const err = new Error(
        `Ya no hay stock suficiente de "${variante.productos.nombre}"${variante.talla ? ` (talla ${variante.talla})` : ''}. Disponible: ${variante.stock}.`,
      );
      err.status = 400;
      return next(err);
    }

    const precio = variante.productos.precio;
    items.push({
      producto_id: variante.productos.id,
      producto_variante_id: variante.id,
      nombre: variante.productos.nombre,
      talla: variante.talla,
      color_nombre: variante.color_nombre,
      precio,
      cantidad: item.cantidad,
    });
    total += precio * item.cantidad;
  }

  // ⭐ Bug real corregido (auditoría Fase 5, 2026-08-31/09-01): el chequeo de
  // arriba (`item.cantidad > variante.stock`) es solo una validación rápida
  // con el dato leído hace un instante — nunca restaba nada de verdad, así
  // que 2 compras casi simultáneas podían las 2 pasar esa validación y
  // sobrevender. `descontar_stock_pedido` (ver migración) hace el descuento
  // real de forma atómica en la base para TODOS los items del pedido a la
  // vez — si cualquiera ya no tiene stock suficiente en ese instante exacto,
  // aborta sin dejar ningún item a medio descontar.
  const { error: stockError } = await supabase.rpc('descontar_stock_pedido', {
    p_items: itemsAgrupados,
  });
  if (stockError) {
    const err = new Error('Uno de los productos de tu carrito ya no tiene stock suficiente — alguien más lo compró justo antes. Actualiza tu carrito e intenta de nuevo.');
    err.status = 409;
    return next(err);
  }

  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert({
      nombre: datos.nombre,
      celular: datos.celular,
      email: datos.email,
      direccion: datos.direccion,
      ciudad: datos.ciudad,
      direccion_adicional: datos.direccion_adicional ?? null,
      total,
      acepta_terminos: true,
      estado: 'pendiente',
    })
    .select()
    .single();

  if (pedidoError) {
    // El stock ya se descontó — si el pedido no se puede crear, hay que
    // devolverlo (compensación manual: no hay una transacción real que
    // envuelva el RPC de arriba y este insert, son 2 llamadas separadas a
    // PostgREST).
    await supabase.rpc('restaurar_stock_pedido', { p_items: itemsAgrupados });
    return next(traducirError(pedidoError));
  }

  const filas = items.map((it) => ({ ...it, pedido_id: pedido.id }));
  const { error: itemsError } = await supabase.from('pedido_items').insert(filas);

  if (itemsError) {
    // El pedido ya se creó — si las líneas fallan, no dejamos un pedido sin
    // items (mismo criterio que productos.js con producto+variantes). Mismo
    // criterio de compensación que arriba para el stock ya descontado.
    await supabase.from('pedidos').delete().eq('id', pedido.id);
    await supabase.rpc('restaurar_stock_pedido', { p_items: itemsAgrupados });
    return next(errorGenerico(itemsError, 'POST /api/pedidos (items)'));
  }

  res.status(201).json({ ok: true, data: await obtenerPedidoCompleto(pedido.id) });
});

// ── Router admin: gestión (montado en /api/admin/pedidos con requireAdmin) ──
const router = Router();

const updateSchema = z
  .object({
    nombre: z.string().trim().min(2).optional(),
    celular: z.string().trim().min(7).optional(),
    email: z.string().trim().email().optional(),
    direccion: z.string().trim().min(5).optional(),
    ciudad: z.string().trim().min(2).optional(),
    direccion_adicional: z.string().trim().nullable().optional(),
    estado: z.enum(ESTADOS).optional(),
    referencia_mp: z.string().trim().nullable().optional(),
  })
  .strict();

// GET / — listar pedidos (paginados), con sus líneas embebidas. ⭐ Paginación
// real agregada (auditoría Fase 5, 2026-09-01) — igual criterio que
// inscripciones/reservas: se alimenta de compras públicas, crece sin límite.
router.get('/', async (req, res, next) => {
  const result = paginacionSchema.safeParse(req.query);
  if (!result.success) {
    return next(zodError(result));
  }
  const { offset, limit } = result.data;

  const query = supabase
    .from('pedidos')
    .select('*, pedido_items(*)')
    .order('creado_en', { ascending: false });

  const { data, error } = await aplicarRango(query, offset, limit);

  if (error) {
    return next(errorGenerico(error, 'GET /api/admin/pedidos'));
  }

  res.json({ ok: true, ...empaquetarPagina(data, limit) });
});

// PATCH /:id — el admin corrige datos del comprador/envío, cambia estado
// (ej. pagado/enviado) o registra una referencia de pago manual.
router.patch('/:id', requireCsrf, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase
    .from('pedidos')
    .select('*, pedido_items(producto_variante_id, cantidad)')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !actual) {
    const err = new Error('Pedido no encontrado');
    err.status = 404;
    return next(err);
  }

  const result = updateSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }

  const updates = stripUndefined(result.data);

  // ⭐ Ajuste real (auditoría Fase 5, 2026-08-31/09-01): el stock se descuenta
  // de verdad al crear el pedido (ver POST de arriba) -- acá se le da la
  // vuelta al cambiar el estado hacia/desde "cancelado", para que un pedido
  // cancelado le devuelva su stock al catálogo, y uno que se "descancela"
  // vuelva a descontarlo (puede fallar si ya no queda stock mientras tanto,
  // en cuyo caso se rechaza el cambio de estado en vez de dejar el stock en
  // negativo).
  const itemsParaStock = (actual.pedido_items || []).map((it) => ({ variante_id: it.producto_variante_id, cantidad: it.cantidad }));
  if (updates.estado && updates.estado !== actual.estado) {
    if (updates.estado === 'cancelado') {
      await supabase.rpc('restaurar_stock_pedido', { p_items: itemsParaStock });
    } else if (actual.estado === 'cancelado') {
      const { error: stockError } = await supabase.rpc('descontar_stock_pedido', { p_items: itemsParaStock });
      if (stockError) {
        const err = new Error('No se puede reactivar este pedido — ya no hay stock suficiente de uno o más productos.');
        err.status = 409;
        return next(err);
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('pedidos').update(updates).eq('id', id);

    if (error) {
      return next(traducirError(error));
    }

    await logAudit({
      actor: req.admin,
      accion: 'editar',
      entidad: 'pedidos',
      entidadId: id,
      detalle: updates,
    });
  }

  res.json({ ok: true, data: await obtenerPedidoCompleto(id) });
});

// DELETE /:id — se permite (ej. duplicados o envíos erróneos), igual criterio
// que Reservas; para solo cerrar un caso sin perder el registro, usar
// PATCH { estado: 'cancelado' } en su lugar.
router.delete('/:id', requireCsrf, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase
    .from('pedidos')
    .select('*, pedido_items(producto_variante_id, cantidad)')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !actual) {
    const err = new Error('Pedido no encontrado');
    err.status = 404;
    return next(err);
  }

  const { error } = await supabase.from('pedidos').delete().eq('id', id);
  if (error) {
    return next(errorGenerico(error, 'DELETE /api/admin/pedidos/:id'));
  }

  // ⭐ Ajuste real (auditoría Fase 5): si el pedido borrado no estaba ya
  // cancelado, su stock nunca se había devuelto -- devolverlo acá (ej. un
  // duplicado o un pedido cargado por error, ver el comentario de esta ruta).
  // Si ya estaba cancelado, el stock ya se restauró en el PATCH que lo canceló.
  if (actual.estado !== 'cancelado') {
    const itemsParaStock = (actual.pedido_items || []).map((it) => ({ variante_id: it.producto_variante_id, cantidad: it.cantidad }));
    await supabase.rpc('restaurar_stock_pedido', { p_items: itemsParaStock });
  }

  await logAudit({
    actor: req.admin,
    accion: 'borrar',
    entidad: 'pedidos',
    entidadId: id,
    detalle: { nombre: actual.nombre, total: actual.total },
  });

  res.json({ ok: true });
});

export default router;
