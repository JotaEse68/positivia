-- Provisión automática tras pago en Stripe: el negocio se crea sin slug
-- (lo reclama el dueño en el onboarding), por eso slug deja de ser obligatorio.
alter table businesses
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

alter table businesses
  alter column slug drop not null;

create unique index if not exists idx_businesses_stripe_subscription
  on businesses (stripe_subscription_id);
