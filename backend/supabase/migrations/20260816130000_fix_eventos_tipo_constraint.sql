-- 2026-08-16 · Corrige un error real de la migración anterior
-- (20260816120000_alter_eventos_tipo_libre_walink_opcional.sql).
--
-- Esa migración buscaba el constraint de `tipo` con
-- `pg_get_constraintdef(oid) ilike '%tipo%'` — pero esa condición también
-- matchea el constraint de `accion_tipo` (contiene la palabra "tipo" como
-- substring). Como el `select ... into` de PL/pgSQL no falla con más de una
-- fila (toma la primera, sin orden garantizado), terminó borrando el
-- constraint de `accion_tipo` en vez del de `tipo` — dejando `accion_tipo`
-- sin ninguna validación a nivel de base de datos (el schema de Zod lo sigue
-- validando en el backend, así que no era explotable desde el panel, pero sí
-- una capa de defensa real que se perdió por un bypass directo a la API).
--
-- Esta migración: 1) restaura el constraint de `accion_tipo` tal cual estaba
-- (ver `20260717115743_create_eventos.sql`), y 2) borra el constraint real de
-- `tipo` — esta vez por su nombre exacto, confirmado de forma empírica (el
-- mensaje de error de Postgres al intentar insertar un `tipo` nuevo lo
-- reveló tal cual: "violates check constraint eventos_tipo_check"), no
-- adivinado ni buscado por texto.
alter table eventos
  add constraint eventos_accion_tipo_check
  check (accion_tipo in ('libre', 'pago', 'festival', 'proximamente'));

alter table eventos drop constraint if exists eventos_tipo_check;
