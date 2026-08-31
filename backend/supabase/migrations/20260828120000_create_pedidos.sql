-- Pedidos de Tienda. Mismo esquema pensado y documentado en readme_guia.md
-- (Fase 6, "Sin depender de las credenciales de Mercado Pago") - snapshot de la
-- compra, no referencias vivas: si un producto cambia de precio o se borra
-- despues, el pedido historico no cambia.
--
-- A diferencia de `reservas` (que guarda zona_seleccionada/show_seleccionado
-- como jsonb, porque cada reserva tiene A LO SUMO un show/zona), un pedido
-- tiene VARIAS lineas -- una por cada producto/talla/color distinto del
-- carrito. Esa es una relacion uno-a-muchos real, asi que se modela como tabla
-- propia (`pedido_items`), mismo criterio que ya se uso para
-- `producto_variantes` en vez de un array dentro de `productos`.
--
-- `estado` en masculino (pedido, no reserva): pendiente/pagado/cancelado/enviado.
-- `enviado` existe para cuando el pedido ya se despacho fisicamente, distinto
-- de "pagado" (Tienda vende objetos fisicos, a diferencia de Eventos).
--
-- El descuento de `producto_variantes.stock` al confirmarse el pago queda
-- pendiente de definir (ver readme_guia.md) -- depende de como se conecte el
-- webhook real de Mercado Pago, que todavia no existe. Por ahora solo se
-- valida que haya stock suficiente AL MOMENTO de crear el pedido, sin
-- reservarlo.
create table pedidos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  celular text not null,
  email text not null,
  direccion text not null,
  ciudad text not null,
  direccion_adicional text,
  total integer not null check (total > 0),
  acepta_terminos boolean not null default false,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'cancelado', 'enviado')),
  referencia_mp text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- `producto_id`/`producto_variante_id` con ON DELETE SET NULL (no RESTRICT
-- como eventos->reservas): un pedido ya facturado es un registro historico
-- (nombre/talla/color/precio ya estan guardados aca mismo) - borrar un
-- producto descontinuado despues no deberia bloquearse por pedidos viejos.
create table pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid references productos(id) on delete set null,
  producto_variante_id uuid references producto_variantes(id) on delete set null,
  nombre text not null,
  talla text,
  color_nombre text,
  precio integer not null check (precio > 0),
  cantidad integer not null check (cantidad > 0)
);

create index pedido_items_pedido_id_idx on pedido_items(pedido_id);

alter table pedidos enable row level security;
alter table pedido_items enable row level security;

grant select, insert, update, delete on table pedidos to service_role;
grant select, insert, update, delete on table pedido_items to service_role;
