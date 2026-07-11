-- RLS solo filtra filas, no columnas: con el SELECT amplio que Supabase
-- concede por defecto a "anon", cualquiera con la anon key publica podia
-- pedir por API directa email_owner, whatsapp_owner, stripe_customer_id o
-- stripe_subscription_id de cualquier negocio activo. La app (app/r/[slug])
-- solo necesita estas columnas para renderizar la landing publica.
revoke select on businesses from anon;

grant select (
  id,
  slug,
  name,
  logo_url,
  banner_url,
  color_primary,
  google_review_link,
  plan_status
) on businesses to anon;
