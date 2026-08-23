import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { errorGenerico } from '../lib/errores.js';

// 5.6 · Pantalla de Historial. A diferencia del resto de rutas admin (que
// traen toda la lista y filtran del lado del cliente, porque sus catálogos
// son chicos por naturaleza — nadie carga 500 productos de prueba),
// `audit_log` crece sin límite con cada crear/editar/borrar de las 12
// entidades del sistema y nadie lo "gestiona" ni lo limpia. Filtros y
// paginación van server-side desde el día uno (decisión con el usuario,
// pre-análisis 5.6, 2026-08-20) para no reconstruir esto bajo presión más
// adelante, cuando ya tenga meses de uso real acumulados.
const ENTIDADES = [
  'hero_slides', 'noticias', 'eventos', 'eventos_fijos', 'colecciones',
  'categorias_producto', 'productos', 'niveles', 'cursos', 'inscripciones',
  'admins', 'reservas',
];
const ACCIONES = ['crear', 'editar', 'borrar'];
const LIMITE_DEFECTO = 50;
const LIMITE_MAXIMO = 200;
const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'debe tener formato YYYY-MM-DD');

const querySchema = z.object({
  entidad: z.enum(ENTIDADES).optional(),
  accion: z.enum(ACCIONES).optional(),
  usuario_email: z.string().trim().min(1).optional(),
  desde: fechaISO.optional(),
  hasta: fechaISO.optional(),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
  limit: z.coerce.number().int().positive().max(LIMITE_MAXIMO).optional().default(LIMITE_DEFECTO),
});

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

const router = Router();

// GET / — historial paginado con filtros server-side. Se pide `limit + 1`
// filas (vía `.range`) para saber si hay una página siguiente sin pagar el
// costo de un COUNT(*) aparte sobre una tabla que solo crece.
router.get('/', async (req, res, next) => {
  const result = querySchema.safeParse(req.query);
  if (!result.success) {
    return next(zodError(result));
  }
  const { entidad, accion, usuario_email, desde, hasta, offset, limit } = result.data;

  let query = supabase
    .from('audit_log')
    .select('*')
    .order('creado_en', { ascending: false })
    .range(offset, offset + limit);

  if (entidad) query = query.eq('entidad', entidad);
  if (accion) query = query.eq('accion', accion);
  if (usuario_email) query = query.ilike('usuario_email', `%${usuario_email}%`);
  if (desde) query = query.gte('creado_en', `${desde}T00:00:00`);
  if (hasta) query = query.lte('creado_en', `${hasta}T23:59:59`);

  const { data, error } = await query;
  if (error) {
    return next(errorGenerico(error, 'GET /api/admin/audit-log'));
  }

  const hayMas = data.length > limit;
  res.json({ ok: true, data: hayMas ? data.slice(0, limit) : data, hayMas });
});

export default router;
