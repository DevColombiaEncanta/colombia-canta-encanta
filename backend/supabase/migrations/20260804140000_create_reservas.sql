-- Reservas de entradas para eventos. Esquema acordado desde Fase 1 (ver CLAUDE.md,
-- seccion "Eventos - arquitectura confirmada"): referencia al evento (eventos o
-- eventos_fijos + show especifico, mutuamente excluyentes), snapshot de la zona
-- elegida (no una referencia viva - si el admin edita/borra la zona despues, la
-- reserva historica no cambia), datos del comprador, estado y referencia de pago.
--
-- Construida completa aunque hoy (4.6, parte "eventos libres") solo se use el lado
-- de evento_id con estado 'libre' - evento_fijo_id/show_seleccionado y el flujo de
-- pago quedan listos para cuando se conecten Salas y Mercado Pago, sin necesitar
-- otra migracion.
create table reservas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references eventos(id) on delete restrict,
  evento_fijo_id uuid references eventos_fijos(id) on delete restrict,
  show_seleccionado jsonb,
  zona_seleccionada jsonb,
  nombre text not null,
  celular text not null,
  email text not null,
  cantidad integer not null default 1 check (cantidad > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagada', 'cancelada', 'libre')),
  referencia_mp text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint reservas_un_solo_evento check (
    (evento_id is not null)::int + (evento_fijo_id is not null)::int = 1
  )
);

create index reservas_evento_id_idx on reservas(evento_id);
create index reservas_evento_fijo_id_idx on reservas(evento_fijo_id);

alter table reservas enable row level security;

grant select, insert, update, delete on table reservas to service_role;
