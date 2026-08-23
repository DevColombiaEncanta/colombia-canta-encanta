-- ⚠️ El bloque `do $$ ... $$` de acá abajo tenía un bug real: buscaba el
-- constraint de `tipo` por texto (`ilike '%tipo%'`), que también matchea el
-- de `accion_tipo` — terminó borrando el constraint equivocado. Corregido en
-- `20260816130000_fix_eventos_tipo_constraint.sql` (restaura `accion_tipo` y
-- borra el de `tipo` de verdad, buscándolo por columna exacta). Este archivo
-- se deja tal cual quedó aplicado, como registro histórico.
--
-- 2026-08-16 · Ajustes pedidos por el usuario en el panel de Eventos:
-- 1) `tipo` pasa a ser texto libre (antes solo 'Gira USA'/'Sede'/'Festival') —
--    la lista real de tipos puede crecer, y ya no tiene sentido tocar el
--    backend cada vez que se agrega uno nuevo.
-- 2) `wa_link` pasa a ser opcional — no todos los caminos de reserva
--    dependen de WhatsApp (festival usa `inscripcion_link`, proximamente no
--    reserva nada), y el sitio público ya tiene un número de respaldo.
-- Se busca el nombre real del constraint en vez de asumir el default de
-- Postgres (`eventos_tipo_check`) para que esto no quede como un no-op
-- silencioso si el nombre autogenerado resultó distinto.
do $$
declare
  nombre_constraint text;
begin
  select conname into nombre_constraint
  from pg_constraint
  where conrelid = 'eventos'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%tipo%';

  if nombre_constraint is not null then
    execute format('alter table eventos drop constraint %I', nombre_constraint);
  end if;
end $$;

alter table eventos alter column wa_link drop not null;
