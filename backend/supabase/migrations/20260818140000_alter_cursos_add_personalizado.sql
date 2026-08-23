-- 5.5 · Cursos personalizados con profesor (ej. clases 1 a 1 de guitarra con
-- Pedro) — pre-análisis en readme_guia.md, 2026-08-18. Construcción genérica
-- y aditiva sobre `cursos` en vez de una tabla `profesores` nueva, todavía sin
-- especificaciones reales: `profesor_nombre` solo se usa cuando
-- `es_personalizado = true`, validado a mano en cursos.js (no vía constraint,
-- mismo criterio ya usado para otras reglas cruzadas del proyecto).
alter table cursos
  add column es_personalizado boolean not null default false,
  add column profesor_nombre text;
