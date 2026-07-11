-- Constraint unico sobre businesses.slug para el asistente de onboarding
-- (el dueno reclama su slug tras el alta via Stripe, sin colisiones).
create unique index if not exists idx_businesses_slug_unique
  on businesses (slug);
