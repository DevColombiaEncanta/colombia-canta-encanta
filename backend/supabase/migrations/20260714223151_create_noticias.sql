create table noticias (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  categoria text not null check (categoria in ('Giras', 'Escuela', 'Eventos', 'Logro', 'Prensa', 'General')),
  resumen text not null,
  contenido jsonb not null,
  img text not null,
  banner text,
  color_inicio text not null,
  color_fin text not null,
  fecha_publicacion date not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table noticias enable row level security;

grant select, insert, update, delete on table noticias to service_role;
