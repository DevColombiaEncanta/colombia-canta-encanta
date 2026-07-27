import { crearRouterTablaSimple } from '../lib/tablaSimpleRouter.js';

const { router, routerPublico } = crearRouterTablaSimple('colecciones', {
  conEmoji: true,
  conOrden: true,
  etiqueta: 'colección',
});

export default router;
export { routerPublico as coleccionesPublicoRouter };
