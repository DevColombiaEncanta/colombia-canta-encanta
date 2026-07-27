create table curso_niveles (
  curso_id uuid not null references cursos(id) on delete cascade,
  nivel_id uuid not null references niveles(id) on delete restrict,
  primary key (curso_id, nivel_id)
);

alter table curso_niveles enable row level security;

grant select, insert, update, delete on table curso_niveles to service_role;
