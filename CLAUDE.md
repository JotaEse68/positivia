# PositivIA — Contexto del proyecto

PositivIA es un SaaS multi-tenant de gestión de reputación para negocios locales
(hostelería, hoteles, tiendas, spas, centros clínicos/estéticos).

## Stack

Next.js 16 (App Router) · TypeScript · Supabase (Postgres + Auth + RLS) · Tailwind ·
Anthropic (Claude Haiku) · Stripe · Twilio/Resend · Vercel.

## Arquitectura de dominio

- La app corre en https://app.positivia.net (este repo).
- La landing comercial vive en https://positivia.net (WordPress, OTRO sitio, no se
  toca nada de landing aquí).
- Toda URL generada en código (QR, redirects, callbacks, Stripe) usa
  `NEXT_PUBLIC_SITE_URL = https://app.positivia.net`.

## Convenciones del repo (respétalas)

- Stripe se llama vía REST con `fetch` a `api.stripe.com`, **NO** con el SDK. Ver
  `lib/stripe-billing.ts` y `app/api/admin/billing/checkout/route.ts` como referencia.
- Supabase:
  - `lib/supabase-server.ts` → `createServerSupabase()` (con sesión).
  - `lib/supabase.ts` → `supabaseAdmin()` (service role) y `supabaseAnon()` (público).
- Superadmin: gate por `SUPERADMIN_EMAIL` vía `lib/superadmin.ts` (`isSuperadminUser`).
- RLS aísla negocios: un dueño solo ve/edita lo suyo. No lo rompas.
- Ninguna respuesta de IA se envía automáticamente sin aprobación humana.
- La demo (`lib/demo.ts`, slugs demo) no debe romperse: hay `getDemoBusiness()` en
  varias rutas; mantén ese camino intacto.

## Reglas de trabajo

- Cambios mínimos y tipados. Nada de refactors no pedidos.
- Al terminar cada tarea: `npm run build` y `npm run lint` deben pasar.
- Si una columna/tabla no existe y hace falta, crea una migración en
  `supabase/migrations/` con numeración correlativa; no dependas de fallbacks nuevos.
- Si una tarea toca base de datos, corre su migración en Supabase **antes** de
  desplegar el código que la usa.

## Despliegue

- El deploy va por GitHub → Vercel (proyecto `jsantospro/positivia`). Cada push a una
  rama genera un *preview*; producción es `app.positivia.net`.
- Trabaja en ramas con Pull Request; revisa el preview antes de promover a producción.
