-- 5.5 · Rediseño de pagos a pedido del usuario (2026-08-19): en vez de un
-- único registro de pago por inscripción, cada inscripción tiene una cuota
-- por cada mes de la duración del curso (ej. "6 meses" -> 6 filas), cada una
-- con su propio estado/monto/fecha/método — el admin las va marcando a
-- medida que el estudiante paga mes a mes. Reemplaza por completo a las 4
-- columnas de pago único que tenía `inscripciones` desde la Fase 1.6/3.
create table inscripcion_pagos (
  id uuid primary key default gen_random_uuid(),
  inscripcion_id uuid not null references inscripciones(id) on delete cascade,
  numero_cuota integer not null,
  monto numeric,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'mora')),
  fecha_pago date,
  metodo_pago text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (inscripcion_id, numero_cuota)
);

alter table inscripcion_pagos enable row level security;

grant select, insert, update, delete on table inscripcion_pagos to service_role;

alter table inscripciones
  drop column monto_pagado,
  drop column fecha_pago,
  drop column metodo_pago,
  drop column notas_pago;
