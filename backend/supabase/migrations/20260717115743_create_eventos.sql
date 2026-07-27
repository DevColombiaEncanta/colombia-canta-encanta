create table eventos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  tipo text not null check (tipo in ('Gira USA', 'Sede', 'Festival')),
  img text not null,
  galeria jsonb,
  fecha text not null,
  fecha_iso date not null,
  fecha_iso_fin date,
  fecha_completa text not null,
  ciudad text not null,
  lugar text not null,
  hora text,
  puertas text,
  direccion text not null,
  pills jsonb,
  descripcion text not null,
  descripcion_larga text not null,
  programa jsonb,
  precio text not null,
  precio_detalle text,
  zonas jsonb,
  max_entradas integer,
  cta text not null,
  cta_wa text,
  color text not null,
  color_hero text not null,
  wa_link text not null,
  testimonios jsonb,
  inscripcion_cerrada boolean not null default false,
  inscripcion_link text,
  bases text,
  destacado_hero boolean not null default false,
  accion_tipo text not null check (accion_tipo in ('libre', 'pago', 'festival', 'proximamente')),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index eventos_destacado_hero_unique on eventos (destacado_hero) where destacado_hero = true;

alter table eventos enable row level security;

grant select, insert, update, delete on table eventos to service_role;
