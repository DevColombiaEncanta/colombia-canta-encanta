create table hero_slides (
  id uuid primary key default gen_random_uuid(),
  orden integer not null,
  label text not null,
  titulo text not null,
  descripcion text,
  ctas jsonb,
  imagen text not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table hero_slides enable row level security;

grant select, insert, update, delete on table hero_slides to service_role;
