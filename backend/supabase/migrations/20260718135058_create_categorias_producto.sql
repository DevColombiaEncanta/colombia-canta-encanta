create table categorias_producto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table categorias_producto enable row level security;

grant select, insert, update, delete on table categorias_producto to service_role;
