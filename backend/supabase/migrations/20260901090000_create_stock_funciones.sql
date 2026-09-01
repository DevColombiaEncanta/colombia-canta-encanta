-- ⭐ Fase 5, auditoría 2026-08-31/09-01: hasta ahora `pedidos.js` validaba que
-- hubiera stock suficiente AL MOMENTO de crear el pedido, pero nunca lo
-- restaba de verdad -- dos compras casi simultáneas podían sobrevender el
-- mismo producto sin que nada lo impidiera (el chequeo siempre leía el mismo
-- número). Estas 2 funciones hacen el descuento/restauración de forma
-- atómica en la base (no vía "leer stock, restar en JS, escribir") para que
-- una carrera real entre 2 pedidos no pueda dejar el stock en negativo:
-- `stock >= cantidad` en el WHERE hace que el UPDATE simplemente no afecte
-- ninguna fila si ya no alcanza, sin importar cuántos pedidos lleguen a la vez.

-- Descuenta stock para TODOS los items de un pedido de una sola vez. Si
-- cualquier item no tiene stock suficiente, aborta con una excepción -- como
-- las funciones de Postgres corren en una transacción implícita, eso deshace
-- automáticamente los descuentos de los items anteriores del mismo llamado
-- (no puede quedar un pedido con 2 de 3 productos ya descontados).
create or replace function descontar_stock_pedido(p_items jsonb)
returns void
language plpgsql
as $$
declare
  item record;
  filas_afectadas integer;
begin
  for item in select * from jsonb_to_recordset(p_items) as x(variante_id uuid, cantidad integer)
  loop
    update producto_variantes
    set stock = stock - item.cantidad
    where id = item.variante_id and stock >= item.cantidad;

    get diagnostics filas_afectadas = row_count;
    if filas_afectadas = 0 then
      raise exception 'stock_insuficiente: %', item.variante_id;
    end if;
  end loop;
end;
$$;

-- Devuelve stock (pedido cancelado o borrado) -- sin el mismo candado de
-- `stock >= cantidad` porque acá siempre es válido sumar de vuelta.
create or replace function restaurar_stock_pedido(p_items jsonb)
returns void
language plpgsql
as $$
declare
  item record;
begin
  for item in select * from jsonb_to_recordset(p_items) as x(variante_id uuid, cantidad integer)
  loop
    update producto_variantes
    set stock = stock + item.cantidad
    where id = item.variante_id;
  end loop;
end;
$$;

grant execute on function descontar_stock_pedido(jsonb) to service_role;
grant execute on function restaurar_stock_pedido(jsonb) to service_role;
