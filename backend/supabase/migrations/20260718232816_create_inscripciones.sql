create table inscripciones (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references cursos(id) on delete restrict,
  nivel_id uuid references niveles(id) on delete restrict,
  estudiante_nombre text not null,
  estudiante_documento text not null,
  estudiante_edad integer not null,
  estudiante_email text,
  estudiante_telefono text,
  acudiente_nombre text,
  acudiente_contacto text,
  acudiente_email text,
  acudiente_parentesco text,
  horario_preferencia text not null,
  barrio text,
  acepta_terminos boolean not null default false,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmada', 'cancelada')),
  monto_pagado numeric,
  fecha_pago date,
  metodo_pago text,
  notas_pago text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table inscripciones enable row level security;

grant select, insert, update, delete on table inscripciones to service_role;
