create table colecciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  emoji text,
  orden integer not null default 0,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table colecciones enable row level security;

grant select, insert, update, delete on table colecciones to service_role;
