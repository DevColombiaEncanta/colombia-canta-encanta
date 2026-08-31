alter table audit_log drop constraint audit_log_entidad_check;

alter table audit_log add constraint audit_log_entidad_check check (entidad in (
  'hero_slides', 'noticias', 'eventos', 'eventos_fijos', 'colecciones',
  'categorias_producto', 'productos', 'niveles',
  'cursos', 'inscripciones', 'admins', 'reservas', 'pedidos'
));
