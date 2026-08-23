-- 5.5 · Ajuste a pedido del usuario (2026-08-19): la subida de una imagen
-- real para el ícono del curso se reemplaza por un emoji simple (mismo
-- patrón ya usado en Productos/Eventos como respaldo visual) — en la
-- práctica es poco probable que el staff suba fotos para esto, y una
-- "galería" de íconos reales sería la misma complejidad de subida de imagen
-- sin resolver el problema real. `icono` (url de Storage) queda sin uso.
alter table cursos
  drop column icono,
  add column emoji text;
