-- ============================================================
-- PositivIA — Schema Supabase
-- SaaS multi-tenant de gestión de reputación online.
-- Un cliente = una fila en `businesses`. Nunca un deploy aparte.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
-- ============================================================

-- ---------- Enums ----------
create type plan_type as enum ('starter', 'pro');
create type plan_status_type as enum ('trial', 'active', 'cancelled');
create type feedback_status_type as enum ('public_redirected', 'private_captured');
create type urgency_type as enum ('low', 'medium', 'high');
create type admin_role_type as enum ('owner', 'staff');

-- ---------- businesses ----------
-- Cada negocio (o local de una cadena). Los locales adicionales
-- se agrupan bajo un Pro base vía parent_business_id.
create table businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  logo_url text,
  color_primary text default '#16a34a' check (color_primary ~ '^#[0-9a-fA-F]{6}$'),
  google_review_link text,
  whatsapp_owner text,
  email_owner text,
  plan plan_type not null default 'starter',
  plan_status plan_status_type not null default 'trial',
  parent_business_id uuid references businesses(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_businesses_slug on businesses (slug);
create index idx_businesses_parent on businesses (parent_business_id)
  where parent_business_id is not null;

-- ---------- business_rating_settings ----------
-- Textos configurables de la experiencia QR. Son públicos porque se renderizan
-- en la pantalla que escanea el cliente final; solo service role escribe.
create table business_rating_settings (
  business_id uuid primary key references businesses(id) on delete cascade,
  visual_theme text not null default 'sunrise'
    check (visual_theme in ('sunrise', 'hope', 'coral')),
  logo_display text not null default 'large'
    check (logo_display in ('large', 'compact')),
  incentive_text text,
  issue_options text,
  positive_redirect_title text,
  positive_redirect_body text,
  private_prompt_title text,
  private_prompt_body text,
  private_submit_label text,
  private_thanks_title text,
  private_thanks_body text,
  recovery_hint text,
  appreciation_note text,
  updated_at timestamptz not null default now()
);

-- ---------- feedback ----------
create table feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  status feedback_status_type not null,
  ai_urgency urgency_type,           -- solo plan Pro
  ai_summary_theme text,             -- tema detectado por IA
  suggested_reply text,              -- borrador de respuesta (IA, solo Pro)
  issue_categories text[] not null default '{}',
  contact_info text,
  reply_sent boolean not null default false,
  discount_code text,                -- fase 2 de incentivos (preparado, sin lógica aún)
  created_at timestamptz not null default now()
);

create index idx_feedback_business_created on feedback (business_id, created_at desc);
create index idx_feedback_business_status on feedback (business_id, status);

-- ---------- admin_users ----------
-- Vincula usuarios de Supabase Auth con el negocio que administran.
-- `clerk_user_id` es el nombre heredado de la columna; ahora guarda
-- auth.users.id y el RLS usa auth.jwt()->>'sub' para aislar datos.
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  clerk_user_id text not null,
  role admin_role_type not null default 'owner',
  created_at timestamptz not null default now(),
  unique (business_id, clerk_user_id)
);

create index idx_admin_users_clerk on admin_users (clerk_user_id);

-- ---------- weekly_summaries ----------
create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  summary_text text not null,
  positive_count integer not null default 0,
  negative_count integer not null default 0,
  top_theme text,
  created_at timestamptz not null default now(),
  unique (business_id, week_start)
);

create index idx_weekly_summaries_business on weekly_summaries (business_id, week_start desc);

-- ---------- notification_events ----------
-- Registro operativo de alertas enviadas o fallidas. Ayuda a responder
-- incidencias de entrega sin depender solo de logs efímeros de Vercel.
create table notification_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  feedback_id uuid references feedback(id) on delete set null,
  event_type text not null check (event_type in ('complaint_alert', 'weekly_summary')),
  channel text not null check (channel in ('whatsapp', 'email', 'none')),
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notification_events_business_created
  on notification_events (business_id, created_at desc);
create index idx_notification_events_feedback
  on notification_events (feedback_id)
  where feedback_id is not null;

-- ============================================================
-- Row Level Security
--
-- Modelo de acceso:
--   * Cliente final (anon): solo lee lo mínimo de `businesses` para
--     renderizar la landing pública. Nunca lee feedback. Inserta
--     feedback únicamente a través de la API (service role).
--   * Dueño (authenticated): ve su negocio y su feedback. Si su
--     negocio es padre de otros locales (parent_business_id), ve
--     también los de sus locales hijos.
--   * Superadmin (el fundador): opera con service role key desde
--     el panel superadmin — bypassa RLS por definición.
-- ============================================================

alter table businesses enable row level security;
alter table business_rating_settings enable row level security;
alter table feedback enable row level security;
alter table admin_users enable row level security;
alter table weekly_summaries enable row level security;
alter table notification_events enable row level security;

-- Negocios a los que el usuario autenticado tiene acceso:
-- los suyos directos + los locales hijos de los suyos.
create or replace function accessible_business_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select b.id
  from businesses b
  where b.id in (select business_id from admin_users where clerk_user_id = auth.jwt()->>'sub')
     or b.parent_business_id in (select business_id from admin_users where clerk_user_id = auth.jwt()->>'sub');
$$;

-- businesses: lectura pública mínima (la landing /r/[slug] la necesita);
-- los dueños ven las suyas; nadie escribe salvo service role.
create policy "public can read active businesses"
  on businesses for select
  to anon
  using (plan_status <> 'cancelled');

create policy "owners can read their businesses"
  on businesses for select
  to authenticated
  using (id in (select accessible_business_ids()));

create policy "public can read rating settings"
  on business_rating_settings for select
  to anon, authenticated
  using (true);

-- feedback: solo dueños leen; actualizan solo campos de gestión
-- (reply_sent, suggested_reply editado). Inserción vía service role.
create policy "owners can read their feedback"
  on feedback for select
  to authenticated
  using (business_id in (select accessible_business_ids()));

create policy "owners can update their feedback"
  on feedback for update
  to authenticated
  using (business_id in (select accessible_business_ids()))
  with check (business_id in (select accessible_business_ids()));

-- admin_users: cada usuario ve solo sus propias filas.
create policy "users can read own admin rows"
  on admin_users for select
  to authenticated
  using (clerk_user_id = auth.jwt()->>'sub');

-- weekly_summaries: solo lectura para dueños. Escritura vía service role
-- (el job semanal corre server-side).
create policy "owners can read their summaries"
  on weekly_summaries for select
  to authenticated
  using (business_id in (select accessible_business_ids()));

-- notification_events: solo lectura para dueños. Escritura vía service role.
create policy "owners can read their notification events"
  on notification_events for select
  to authenticated
  using (business_id in (select accessible_business_ids()));

-- ============================================================
-- Storage: bucket público para logos de negocios
-- (lo sube el panel superadmin; lo muestra la landing anónima)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152,
        array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do update set public = true;

drop policy if exists "public read logos" on storage.objects;
create policy "public read logos" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'logos');
