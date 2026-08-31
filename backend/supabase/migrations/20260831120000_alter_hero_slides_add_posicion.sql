-- Reposicionar la foto de Hero sin recortarla (2026-08-31, pedido del
-- usuario) — Hero usa `object-fit: contain` a propósito (nunca recorta), así
-- que en vez de un recorte real (como el resto del panel) esto solo guarda
-- dónde queda centrada la foto dentro del espacio disponible, equivalente al
-- `object-position` de CSS. Default 50/50 = centrado, mismo comportamiento
-- que ya tenía el sitio antes de esto para las filas existentes.
alter table hero_slides
  add column posicion_x numeric not null default 50,
  add column posicion_y numeric not null default 50;
