import { crearRouterTablaSimple } from '../lib/tablaSimpleRouter.js';

// niveles no necesita router público — el sitio real nunca lista niveles sueltos,
// solo los ve embebidos dentro de cada curso (ver 4.0.5).
export default crearRouterTablaSimple('niveles', {
  conEmoji: false,
  conOrden: true,
  etiqueta: 'nivel',
}).router;
