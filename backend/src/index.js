import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { limiterGeneral } from './middleware/rateLimiters.js';
import { requireAdmin } from './middleware/requireAdmin.js';
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

dotenv.config();

const app = express();
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

// Único endpoint público de ESCRITURA de todo el backend — recepción real del
// formulario de inscripción del sitio. Va después de limiterGeneral (línea 42) y
// además lleva su propio limiterEstricto (ver inscripciones.js) por ser de escritura.
app.use('/api/inscripciones', inscripcionesPublicRouter);

// Multer usa mensajes genéricos en inglés (ej. "Unexpected field" cuando se supera
// el límite de archivos) — se traducen los códigos más comunes a algo legible.
const MENSAJES_MULTER = {
  LIMIT_FILE_SIZE: 'El archivo supera el tamaño máximo permitido',
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
