-- Checkbox de "Acepto los términos y condiciones" para ReservaModal (Eventos de
-- pago, Eventos gratis y Salas/Enamoras — los 3 comparten este mismo modal).
-- Mismo criterio que `pedidos.acepta_terminos` (Fase 6): se guarda el hecho de
-- que la persona aceptó, `creado_en` ya sirve como la fecha (respaldo legal).
alter table reservas add column acepta_terminos boolean not null default false;
