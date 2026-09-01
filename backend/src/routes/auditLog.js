import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { errorGenerico } from '../lib/errores.js';
import { paginacionSchema, aplicarRango, empaquetarPagina } from '../lib/paginacion.js';

// 5.6 · Pantalla de Historial. A diferencia del resto de rutas admin (que
// traen toda la lista y filtran del lado del cliente, porque sus catálogos
// son chicos por naturaleza — nadie carga 500 productos de prueba),
// `audit_log` crece sin límite con cada crear/editar/borrar de las 12
// entidades del sistema y nadie lo "gestiona" ni lo limpia. Filtros y
// paginación van server-side desde el día uno (decisión con el usuario,
// pre-análisis 5.6, 2026-08-20) para no reconstruir esto bajo presión más
// adelante, cuando ya tenga meses de uso real acumulados.
// ⭐ Bug real (auditoría Fase 5, 2026-08-31): faltaba 'pedidos' acá aunque el
// constraint real de la tabla (`20260828120500_alter_audit_log_add_pedidos.
// sql`) ya lo permite y `pedidos.js` sí registra ahí sus acciones -- filtrar
// el Historial por esa entidad daba un 400 de Zod en vez de resultados.
const ENTIDADES = [
  'hero_slides', 'noticias', 'eventos', 'eventos_fijos', 'colecciones',
  'categorias_producto', 'productos', 'niveles', 'cursos', 'inscripciones',
  'admins', 'reservas', 'pedidos',
];
const ACCIONES = ['crear', 'editar', 'borrar'];
const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'debe tener formato YYYY-MM-DD');

const querySchema = paginacionSchema.extend({
  entidad: z.enum(ENTIDADES).optional(),
  accion: z.enum(ACCIONES).optional(),
  usuario_email: z.string().trim().min(1).optional(),
  desde: fechaISO.optional(),
  hasta: fechaISO.optional(),
});

function zodError(result) {
  const err = new Error(result.error.issues.map((i) => i.message).join(', '));
  err.status = 400;
  return err;
}

const router = Router();

// GET / — historial paginado con filtros server-side (paginación real vía
// `lib/paginacion.js`, compartida desde 2026-09-01 con inscripciones/
// reservas/pedidos — mismo razonamiento, distintas 3 tablas).
router.get('/', async (req, res, next) => {
  const result = querySchema.safeParse(req.query);
  if (!result.success) {
    return next(zodError(result));
  }
  const { entidad, accion, usuario_email, desde, hasta, offset, limit } = result.data;

  let query = supabase
    .from('audit_log')
    .select('*')
    .order('creado_en', { ascending: false });

  if (entidad) query = query.eq('entidad', entidad);
  if (accion) query = query.eq('accion', accion);
  if (usuario_email) query = query.ilike('usuario_email', `%${usuario_email}%`);
  if (desde) query = query.gte('creado_en', `${desde}T00:00:00`);
  if (hasta) query = query.lte('creado_en', `${hasta}T23:59:59`);

  const { data, error } = await aplicarRango(query, offset, limit);
  if (error) {
    return next(errorGenerico(error, 'GET /api/admin/audit-log'));
  }

  res.json({ ok: true, ...empaquetarPagina(data, limit) });
});

export default router;
