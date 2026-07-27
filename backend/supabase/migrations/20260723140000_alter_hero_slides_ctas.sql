alter table hero_slides drop column cta_label;
alter table hero_slides drop column cta_url;
alter table hero_slides add column ctas jsonb;
