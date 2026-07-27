create table cursos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tagline text,
  icono text,
  color text,
  descripcion text not null,
  instrumentos jsonb,
  horarios jsonb,
  duracion text,
  precio text,
  precio_numerico numeric,
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table cursos enable row level security;

grant select, insert, update, delete on table cursos to service_role;
