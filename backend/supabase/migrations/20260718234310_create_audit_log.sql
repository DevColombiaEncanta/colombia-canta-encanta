create table audit_log (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users(id) on delete set null,
  usuario_email text not null,
  accion text not null check (accion in ('crear', 'editar', 'borrar')),
  entidad text not null check (entidad in (
    'hero_slides', 'noticias', 'eventos', 'eventos_fijos', 'colecciones',
    'categorias_producto', 'productos', 'producto_variantes', 'niveles',
    'cursos', 'inscripciones'
  )),
  entidad_id uuid not null,
  detalle jsonb,
  creado_en timestamptz not null default now()
);

alter table audit_log enable row level security;

grant select, insert on table audit_log to service_role;
