import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { limiterGeneral } from './middleware/rateLimiters.js';
import { requireAdmin } from './middleware/requireAdmin.js';
import { requireRole } from './middleware/requireRole.js';
import sessionRouter from './routes/session.js';
import adminsRouter from './routes/admins.js';
import heroRouter, { heroPublicoRouter } from './routes/hero.js';
import noticiasRouter, { noticiasPublicoRouter } from './routes/noticias.js';
import coleccionesRouter, { coleccionesPublicoRouter } from './routes/colecciones.js';
import categoriasProductoRouter, { categoriasProductoPublicoRouter } from './routes/categoriasProducto.js';
import productosRouter, { productosPublicoRouter } from './routes/productos.js';
import nivelesRouter from './routes/niveles.js';
import cursosRouter, { cursosPublicoRouter } from './routes/cursos.js';
import eventosRouter, { eventosPublicoRouter } from './routes/eventos.js';
import eventosFijosRouter, { eventosFijosPublicoRouter } from './routes/eventosFijos.js';
import inscripcionesRouter, { inscripcionesPublicRouter } from './routes/inscripciones.js';
import reservasRouter, { reservasPublicRouter } from './routes/reservas.js';
import pedidosRouter, { pedidosPublicRouter } from './routes/pedidos.js';
import auditLogRouter from './routes/auditLog.js';
import perfilRouter from './routes/perfil.js';

dotenv.config();

const app = express();
// ⭐ Bug real de producción (2026-08-31, encontrado por el usuario intentando
// iniciar sesión en Render): sin esto, Express no confía en el
// `X-Forwarded-For` que pone el proxy de Render delante del backend —
// `express-rate-limit` rechaza la petición entera con
// `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` en vez de solo advertir, porque sin
// saber en cuál proxy confiar, cualquiera podría falsificar ese header para
// saltarse el límite de intentos. `1` = confiar en el primer salto de proxy
// (el de Render) — correcto acá porque el backend nunca se expone directo a
// internet, siempre pasa por esa única capa. En desarrollo local no hay
// proxy de por medio, así que esto no cambia nada ahí.
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true, // necesario para que el navegador mande/reciba las cookies httpOnly de sesión (2.5)
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(limiterGeneral);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/admin/session', sessionRouter);
app.use('/api/admin/admins', requireAdmin, adminsRouter);
app.use('/api/admin/hero', requireAdmin, heroRouter);
app.use('/api/admin/noticias', requireAdmin, noticiasRouter);
app.use('/api/admin/colecciones', requireAdmin, coleccionesRouter);
app.use('/api/admin/categorias-producto', requireAdmin, categoriasProductoRouter);
app.use('/api/admin/productos', requireAdmin, productosRouter);
app.use('/api/admin/niveles', requireAdmin, nivelesRouter);
app.use('/api/admin/cursos', requireAdmin, cursosRouter);
app.use('/api/admin/eventos', requireAdmin, eventosRouter);
app.use('/api/admin/eventos-fijos', requireAdmin, eventosFijosRouter);
app.use('/api/admin/inscripciones', requireAdmin, inscripcionesRouter);
app.use('/api/admin/reservas', requireAdmin, reservasRouter);
app.use('/api/admin/pedidos', requireAdmin, pedidosRouter);
// A pedido del usuario (2026-08-31): el historial completo de acciones (quién
// hizo qué en todo el panel) queda restringido al maestro, mismo criterio que
// ya usa Administradores — un admin normal no necesita ver la actividad del
// resto, solo la propia.
app.use('/api/admin/audit-log', requireAdmin, requireRole('admin_maestro'), auditLogRouter);
// Sin `requireAdmin`: este router valida su propio JWT de Supabase por ruta
// (ver perfil.js) — se llama ANTES de que exista la cookie de sesión propia
// del panel, durante el onboarding en Bienvenida.jsx.
app.use('/api/admin/perfil', perfilRouter);

// Endpoints públicos (sin sesión) de solo lectura — Fase 4.0, para que el sitio real
// (visitantes anónimos) pueda leer el contenido ya publicado. Cada uno filtra solo
// `activo: true` dentro de su propio router (ver src/routes/*.js). `niveles` no tiene
// versión pública — el sitio nunca lista niveles sueltos, solo embebidos en cada curso.
app.use('/api/hero', heroPublicoRouter);
app.use('/api/noticias', noticiasPublicoRouter);
app.use('/api/colecciones', coleccionesPublicoRouter);
app.use('/api/categorias-producto', categoriasProductoPublicoRouter);
app.use('/api/productos', productosPublicoRouter);
app.use('/api/cursos', cursosPublicoRouter);
app.use('/api/eventos', eventosPublicoRouter);
app.use('/api/eventos-fijos', eventosFijosPublicoRouter);

// Endpoints públicos de ESCRITURA — van después de limiterGeneral (línea 42) y
// además llevan su propio limiterEstricto (ver inscripciones.js/reservas.js).
app.use('/api/inscripciones', inscripcionesPublicRouter);
app.use('/api/reservas', reservasPublicRouter);
app.use('/api/pedidos', pedidosPublicRouter);

// Multer usa mensajes genéricos en inglés (ej. "Unexpected field" cuando se supera
// el límite de archivos) — se traducen los códigos más comunes a algo legible.
// ⭐ Pedido del usuario (2026-08-15): las fotos RAW de cámara (Canon .CR2, etc.)
// suelen pesar 20-45MB — muy por encima del límite de 8MB — así que en la
// práctica la mayoría choca acá, con el tamaño, antes de siquiera llegar a la
// validación de formato de `imageUpload.js` (que si detecta el archivo
// completo, da un mensaje más específico). Este mensaje no puede saber con
// certeza que es RAW (multer corta el archivo a mitad de camino, no llega a
// verse completo), así que solo lo sugiere como causa probable.
const MENSAJES_MULTER = {
  LIMIT_FILE_SIZE: 'El archivo supera el tamaño máximo permitido (8MB). Si es una foto tomada directo de una cámara, puede estar en formato RAW (mucho más pesado que un JPG) — expórtala como JPG desde la cámara o el celular y vuelve a intentar',
  LIMIT_UNEXPECTED_FILE: 'Se superó la cantidad máxima de archivos permitida',
};

app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    const mensaje = MENSAJES_MULTER[err.code] || err.message;
    return res.status(400).json({ error: mensaje });
  }
  const status = err.status || err.statusCode || (err.message === 'No permitido por CORS' ? 403 : 500);
  res.status(status).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
