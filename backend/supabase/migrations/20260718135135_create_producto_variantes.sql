create table producto_variantes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id) on delete cascade,
  talla text,
  color_nombre text,
  color_hex text,
  stock integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (producto_id, talla, color_nombre)
);

alter table producto_variantes enable row level security;

grant select, insert, update, delete on table producto_variantes to service_role;
