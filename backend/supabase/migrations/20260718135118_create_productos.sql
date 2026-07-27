create table productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric not null,
  imagenes jsonb,
  bg text,
  emoji text,
  coleccion_id uuid not null references colecciones(id) on delete restrict,
  categoria_id uuid not null references categorias_producto(id) on delete restrict,
  tag text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table productos enable row level security;

grant select, insert, update, delete on table productos to service_role;
