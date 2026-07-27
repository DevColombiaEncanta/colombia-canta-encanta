create table niveles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden integer not null default 0,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table niveles enable row level security;

grant select, insert, update, delete on table niveles to service_role;
