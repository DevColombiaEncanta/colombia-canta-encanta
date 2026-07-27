import { crearRouterTablaSimple } from '../lib/tablaSimpleRouter.js';

const { router, routerPublico } = crearRouterTablaSimple('categorias_producto', {
  conEmoji: false,
  conOrden: false,
  etiqueta: 'categoría',
});

export default router;
export { routerPublico as categoriasProductoPublicoRouter };
