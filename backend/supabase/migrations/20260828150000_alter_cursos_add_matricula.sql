-- Contenido real de matrículas 2026 compartido por el usuario (2026-08-28):
-- la matrícula anual es un cobro aparte del precio del semestre (que ya se
-- paga en cuotas mensuales vía `precio_numerico` + `inscripcion_pagos`) — no
-- había ningún campo para guardarlo como dato estructurado hasta ahora.
alter table cursos
  add column matricula_numerico numeric;
