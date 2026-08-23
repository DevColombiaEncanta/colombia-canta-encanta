import { crearRouterTablaSimple } from '../lib/tablaSimpleRouter.js';

// niveles no necesita router público — el sitio real nunca lista niveles sueltos,
// solo los ve embebidos dentro de cada curso (ver 4.0.5).
// 5.5 · Ajuste a pedido del usuario (2026-08-19): se saca `orden` — un catálogo
// de 3-4 niveles no necesita reordenarse a mano, alfabético alcanza — y
// `activo` deja de mostrarse en el panel (ver `conActivo` en
// CatalogoSimpleModal.jsx): el admin ya ve si un nivel está en uso al
// asignarlo a un curso, no hace falta gestionar un estado aparte para eso.
export default crearRouterTablaSimple('niveles', {
  conEmoji: false,
  conOrden: false,
  etiqueta: 'nivel',
}).router;
