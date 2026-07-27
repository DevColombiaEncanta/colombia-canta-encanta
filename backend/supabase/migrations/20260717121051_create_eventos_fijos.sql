create table eventos_fijos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  subtitulo text,
  tipo text not null check (tipo in ('Programación mensual', 'Turismo Cultural')),
  tipo_icono text,
  img text not null,
  galeria jsonb,
  color text not null,
  color_hero text not null,
  descripcion_corta text not null,
  descripcion_larga text not null,
  pills jsonb,
  fases jsonb,
  invertido boolean not null default false,
  lugar text not null,
  ciudad text not null,
  cta text not null,
  wa_link text not null,
  precio text,
  mes text,
  programacion jsonb,
  tripadvisor_link text,
  max_entradas integer not null default 5,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table eventos_fijos enable row level security;

grant select, insert, update, delete on table eventos_fijos to service_role;
