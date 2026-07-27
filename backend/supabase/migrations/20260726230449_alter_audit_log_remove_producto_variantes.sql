-- 'producto_variantes' nunca se usa como entidad real en audit_log — los cambios a
-- variantes se registran bajo 'productos' (junto con la edición del producto), no aparte.
-- Se saca de la lista de valores permitidos por no reflejar ningún uso real del código.
alter table audit_log drop constraint audit_log_entidad_check;

alter table audit_log add constraint audit_log_entidad_check check (entidad in (
  'hero_slides', 'noticias', 'eventos', 'eventos_fijos', 'colecciones',
  'categorias_producto', 'productos', 'niveles',
  'cursos', 'inscripciones', 'admins'
));
