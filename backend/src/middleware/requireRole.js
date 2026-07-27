// Debe montarse SIEMPRE después de requireAdmin (necesita req.admin ya cargado).
export function requireRole(rolRequerido) {
  return function requireRoleMiddleware(req, res, next) {
    if (!req.admin || req.admin.rol !== rolRequerido) {
      console.error(
        'requireRole: acceso rechazado - se requiere rol',
        rolRequerido,
        'y el admin tiene',
        req.admin?.rol
      );
      const err = new Error('No autorizado');
      err.status = 403;
      return next(err);
    }
    next();
  };
}
