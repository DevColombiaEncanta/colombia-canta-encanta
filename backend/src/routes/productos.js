import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { requireCsrf } from '../middleware/requireCsrf.js';
import { logAudit } from '../lib/auditLog.js';
import { uploadMiddleware, validarWebpReal, procesarYSubirImagen, borrarImagenPorUrl } from '../lib/imageUpload.js';
import { booleanFromString, jsonArrayField, stripUndefined } from '../lib/zodMultipart.js';
import { toCamelCase } from '../lib/camelCase.js';
import { errorGenerico } from '../lib/errores.js';

const router = Router();
const CARPETA = 'productos';
const MAX_IMAGENES = 6;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color_hex debe ser un color hex válido (ej: #E8341A)');

const varianteSchema = z.object({
  talla: z.string().trim().optional(),
  color_nombre: z.string().trim().optional(),
  color_hex: hexColor.optional(),
  stock: z.coerce.number().int('stock debe ser un entero').min(0, 'stock no puede ser negativo').optional().default(0),
});

// Opción A (decidida con el usuario): al editar, la lista de variantes que llega
// REEMPLAZA por completo a la anterior — no se hace diff de agregar/quitar/editar.
const variantesArraySchema = jsonArrayField(varianteSchema)
  .optional()
  .refine(
    (arr) => {
      if (!arr) return true;
      const claves = arr.map((v) => `${v.talla ?? ''}|${v.color_nombre ?? ''}`);
      return new Set(claves).size === claves.length;
    },
    { message: 'No puede haber dos variantes con la misma combinación de talla y color' }
  );

const baseProductoSchema = z.object({
  nombre: z.string().trim().min(1, 'nombre es obligatorio'),
  descripcion: z.string().trim().optional(),
  precio: z.coerce.number().positive('precio debe ser mayor a 0'),
  coleccion_id: z.string().uuid('coleccion_id debe ser un uuid válido'),
  categoria_id: z.string().uuid('categoria_id debe ser un uuid válido'),
  tag: z.string().trim().optional(),
  bg: z.string().trim().optional(),
  emoji: z.string().trim().optional(),
  variantes: variantesArraySchema,
});

const createProductoSchema = baseProductoSchema;
const updateProductoSchema = baseProductoSchema.partial().extend({
  activo: booleanFromString.optional(),
});

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

// 23503 = foreign_key_violation — acá siempre significa coleccion_id/categoria_id
// inexistente (productos es el lado que referencia, no el referenciado).
function traducirErrorProducto(error) {
  if (error.code === '23503') {
    const err = new Error('coleccion_id o categoria_id no existe');
    err.status = 400;
    return err;
  }
  return errorGenerico(error, 'productos.js traducirErrorProducto');
}

function calcularEnStock(producto) {
  return { ...producto, en_stock: (producto.variantes || []).some((v) => v.stock > 0) };
}

async function obtenerProductoCompleto(id) {
  const { data } = await supabase
    .from('productos')
    .select('*, variantes:producto_variantes(*)')
    .eq('id', id)
    .single();
  return calcularEnStock(data);
}

// GET / — listar todos los productos con sus variantes y el stock calculado
router.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*, variantes:producto_variantes(*)')
    .order('creado_en', { ascending: false });

  if (error) {
    return next(errorGenerico(error, 'GET /api/admin/productos'));
  }

  res.json({ ok: true, data: data.map(calcularEnStock) });
});

// POST / — crear producto + variantes (multipart/form-data: campos + hasta 6 archivos "imagenes")
router.post('/', requireCsrf, uploadMiddleware.array('imagenes', MAX_IMAGENES), async (req, res, next) => {
  const archivos = req.files || [];

  const result = createProductoSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }
  const { variantes, ...camposProducto } = result.data;

  // Validar TODOS los archivos antes de subir ninguno (mismo criterio que Noticias).
  for (const archivo of archivos) {
    await validarWebpReal(archivo.buffer);
  }

  const urls = [];
  for (const archivo of archivos) {
    const { url } = await procesarYSubirImagen(archivo.buffer, CARPETA);
    urls.push(url);
  }

  const { data: producto, error: productoError } = await supabase
    .from('productos')
    .insert({ ...camposProducto, imagenes: urls.length > 0 ? urls : null })
    .select()
    .single();

  if (productoError) {
    for (const url of urls) await borrarImagenPorUrl(url);
    return next(traducirErrorProducto(productoError));
  }

  if (variantes && variantes.length > 0) {
    const filas = variantes.map((v) => ({ ...v, producto_id: producto.id }));
    const { error: variantesError } = await supabase.from('producto_variantes').insert(filas);

    if (variantesError) {
      // El producto ya se creó — si las variantes fallan, no dejamos un producto
      // "fantasma" sin tallas/colores: se revierte todo, igual que el cleanup de
      // auth.users huérfano en Fase 2.
      await supabase.from('productos').delete().eq('id', producto.id);
      for (const url of urls) await borrarImagenPorUrl(url);
      return next(errorGenerico(variantesError, 'POST /api/admin/productos (variantes)'));
    }
  }

  await logAudit({
    actor: req.admin,
    accion: 'crear',
    entidad: 'productos',
    entidadId: producto.id,
    detalle: { nombre: producto.nombre },
  });

  res.status(201).json({ ok: true, data: await obtenerProductoCompleto(producto.id) });
});

// PATCH /:id — editar. Imágenes: si se mandan archivos nuevos, reemplazan TODO el array
// (no se agregan/quitan individualmente). Variantes: reemplazo completo (Opción A).
router.patch('/:id', requireCsrf, uploadMiddleware.array('imagenes', MAX_IMAGENES), async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase.from('productos').select('*').eq('id', id).maybeSingle();
  if (fetchError || !actual) {
    const err = new Error('Producto no encontrado');
    err.status = 404;
    return next(err);
  }

  const result = updateProductoSchema.safeParse(req.body);
  if (!result.success) {
    return next(zodError(result));
  }
  const { variantes, ...camposParciales } = result.data;
  const camposProducto = stripUndefined(camposParciales);

  const archivos = req.files || [];
  let imagenesViejas = null;

  if (archivos.length > 0) {
    for (const archivo of archivos) {
      await validarWebpReal(archivo.buffer);
    }
    const urls = [];
    for (const archivo of archivos) {
      const { url } = await procesarYSubirImagen(archivo.buffer, CARPETA);
      urls.push(url);
    }
    camposProducto.imagenes = urls;
    imagenesViejas = actual.imagenes;
  }

  // Variantes ANTES que el update de productos: si esto falla, la fila de
  // productos todavía no se tocó — evita dejarla a medio camino. No es una
  // transacción real (no hay rollback multi-tabla en PostgREST), así que la
  // validación de variantes duplicadas (arriba, en el schema) es la que evita
  // en la práctica que este paso falle.
  if (variantes !== undefined) {
    const { error: deleteError } = await supabase.from('producto_variantes').delete().eq('producto_id', id);
    if (deleteError) {
      if (camposProducto.imagenes) {
        for (const url of camposProducto.imagenes) await borrarImagenPorUrl(url);
      }
      return next(errorGenerico(deleteError, 'PATCH /api/admin/productos/:id (variantes delete)'));
    }

    if (variantes.length > 0) {
      const filas = variantes.map((v) => ({ ...v, producto_id: id }));
      const { error: insertError } = await supabase.from('producto_variantes').insert(filas);
      if (insertError) {
        if (camposProducto.imagenes) {
          for (const url of camposProducto.imagenes) await borrarImagenPorUrl(url);
        }
        return next(errorGenerico(insertError, 'PATCH /api/admin/productos/:id (variantes insert)'));
      }
    }
  }

  const { error: updateError } = await supabase.from('productos').update(camposProducto).eq('id', id);
  if (updateError) {
    return next(traducirErrorProducto(updateError));
  }

  if (imagenesViejas) {
    for (const url of imagenesViejas) await borrarImagenPorUrl(url);
  }

  await logAudit({
    actor: req.admin,
    accion: 'editar',
    entidad: 'productos',
    entidadId: id,
    detalle: { ...camposProducto, variantesActualizadas: variantes !== undefined },
  });

  res.json({ ok: true, data: await obtenerProductoCompleto(id) });
});

// DELETE /:id — borra el producto (las variantes se van solas por ON DELETE CASCADE) + sus imágenes
router.delete('/:id', requireCsrf, async (req, res, next) => {
  const { id } = req.params;

  const { data: actual, error: fetchError } = await supabase.from('productos').select('*').eq('id', id).maybeSingle();
  if (fetchError || !actual) {
    const err = new Error('Producto no encontrado');
    err.status = 404;
    return next(err);
  }

  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) {
    return next(errorGenerico(error, 'DELETE /api/admin/productos/:id'));
  }

  if (actual.imagenes) {
    for (const url of actual.imagenes) await borrarImagenPorUrl(url);
  }

  await logAudit({
    actor: req.admin,
    accion: 'borrar',
    entidad: 'productos',
    entidadId: id,
    detalle: { nombre: actual.nombre },
  });

  res.json({ ok: true });
});

// Router público de solo lectura — sin requireAdmin ni requireCsrf, solo productos
// activos, en camelCase, con variantes embebidas y en_stock calculado (mismo criterio
// que el admin). Las variantes no tienen su propio `activo` — no hace falta filtrarlas.
export const productosPublicoRouter = Router();

productosPublicoRouter.get('/', async (req, res, next) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*, variantes:producto_variantes(*)')
    .eq('activo', true)
    .order('creado_en', { ascending: false });

  if (error) {
    return next(errorGenerico(error, 'GET /api/productos'));
  }

  res.json({ ok: true, data: toCamelCase(data.map(calcularEnStock)) });
});

export default router;
