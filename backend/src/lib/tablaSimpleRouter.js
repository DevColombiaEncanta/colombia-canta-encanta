import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { logAudit } from './auditLog.js';
import { booleanFromString, stripUndefined } from './zodMultipart.js';
import { toCamelCase } from './camelCase.js';
import { errorGenerico } from './errores.js';

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

// Postgres 23505 = unique_violation, 23503 = foreign_key_violation.
// Mensajes en género neutro a propósito — esta función es genérica para varias
// tablas ("colección", "categoría", "nivel") y evitar la concordancia de género
// es más simple que mantener un mapa de artículos por palabra.
function traducirError(error, etiqueta, esBorrado = false) {
  if (error.code === '23505') {
    const err = new Error(`El nombre ya está en uso (${etiqueta})`);
    err.status = 409;
    return err;
  }
  if (esBorrado && error.code === '23503') {
    const err = new Error(`No se puede borrar — hay registros que dependen de este valor (${etiqueta})`);
    err.status = 409;
    return err;
  }
  return errorGenerico(error, `tablaSimpleRouter (${etiqueta}) traducirError`);
}

// Fábrica de CRUD para tablas "de catálogo simple": nombre único + activo,
// con emoji y/u orden opcionales. Reutilizada por colecciones, categorias_producto
// y niveles — mismas 4 rutas, misma validación, mismo manejo de errores.
export function crearRouterTablaSimple(tabla, { conEmoji = false, conOrden = false, etiqueta = tabla } = {}) {
  const router = Router();

  const shape = {
    nombre: z.string().trim().min(1, 'nombre es obligatorio'),
  };
  if (conEmoji) shape.emoji = z.string().trim().optional();
  if (conOrden) shape.orden = z.coerce.number().int('orden debe ser un entero');

  const createSchema = z.object(shape);
  const updateSchema = createSchema.partial().extend({ activo: booleanFromString.optional() });

  router.get('/', async (req, res, next) => {
    let query = supabase.from(tabla).select('*');
    query = conOrden ? query.order('orden', { ascending: true }) : query.order('nombre', { ascending: true });

    const { data, error } = await query;
    if (error) {
      return next(errorGenerico(error, `GET /api/admin/${tabla}`));
    }

    res.json({ ok: true, data });
  });

  router.post('/', requireCsrf, async (req, res, next) => {
    const result = createSchema.safeParse(req.body);
    if (!result.success) return next(zodError(result));

    const { data, error } = await supabase.from(tabla).insert(result.data).select().single();
    if (error) return next(traducirError(error, etiqueta));

    await logAudit({
      actor: req.admin,
      accion: 'crear',
      entidad: tabla,
      entidadId: data.id,
      detalle: { nombre: data.nombre },
    });

    res.status(201).json({ ok: true, data });
  });

  router.patch('/:id', requireCsrf, async (req, res, next) => {
    const { id } = req.params;

    const { data: actual, error: fetchError } = await supabase.from(tabla).select('*').eq('id', id).maybeSingle();
    if (fetchError || !actual) {
      const err = new Error(`No se encontró: ${etiqueta}`);
      err.status = 404;
      return next(err);
    }

    const result = updateSchema.safeParse(req.body);
    if (!result.success) return next(zodError(result));
    const updates = stripUndefined(result.data);

    // Solo se llama a update() si hay algo que cambiar — un UPDATE con objeto vacío
    // hace que PostgREST devuelva 0 filas, y encadenar .select().single() sobre eso
    // lanza PGRST116 aunque la fila exista (mismo bug ya corregido en el resto de
    // Fase 3 — ver Eventos/Hero/Noticias/Cursos/Productos — que esta fábrica compartida
    // no había recibido).
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from(tabla).update(updates).eq('id', id);
      if (error) return next(traducirError(error, etiqueta));

      await logAudit({
        actor: req.admin,
        accion: 'editar',
        entidad: tabla,
        entidadId: id,
        detalle: updates,
      });
    }

    const { data } = await supabase.from(tabla).select('*').eq('id', id).single();
    res.json({ ok: true, data });
  });

  router.delete('/:id', requireCsrf, async (req, res, next) => {
    const { id } = req.params;

    const { data: actual, error: fetchError } = await supabase.from(tabla).select('*').eq('id', id).maybeSingle();
    if (fetchError || !actual) {
      const err = new Error(`No se encontró: ${etiqueta}`);
      err.status = 404;
      return next(err);
    }

    const { error } = await supabase.from(tabla).delete().eq('id', id);
    if (error) return next(traducirError(error, etiqueta, true));

    await logAudit({
      actor: req.admin,
      accion: 'borrar',
      entidad: tabla,
      entidadId: id,
      detalle: { nombre: actual.nombre },
    });

    res.json({ ok: true });
  });

  // Router público de solo lectura — sin requireAdmin ni requireCsrf (no hay sesión
  // que proteger), solo GET, y solo lo activo. Pensado para que el sitio real (Fase 4)
  // pueda leer este catálogo sin autenticarse como admin.
  const routerPublico = Router();

  routerPublico.get('/', async (req, res, next) => {
    let query = supabase.from(tabla).select('*').eq('activo', true);
    query = conOrden ? query.order('orden', { ascending: true }) : query.order('nombre', { ascending: true });

    const { data, error } = await query;
    if (error) {
      return next(errorGenerico(error, `GET /api/${tabla}`));
    }

    res.json({ ok: true, data: toCamelCase(data) });
  });

  return { router, routerPublico };
}
