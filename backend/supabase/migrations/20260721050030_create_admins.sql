create table admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  rol text not null check (rol in ('admin', 'admin_maestro')),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index admins_user_id_unique on admins (user_id);
create unique index admins_admin_maestro_unique on admins (rol) where rol = 'admin_maestro';

alter table admins enable row level security;

grant select, insert, update, delete on table admins to service_role;
