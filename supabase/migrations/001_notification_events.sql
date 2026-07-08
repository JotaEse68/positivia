create table if not exists notification_events (
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

create index if not exists idx_notification_events_business_created
  on notification_events (business_id, created_at desc);

create index if not exists idx_notification_events_feedback
  on notification_events (feedback_id)
  where feedback_id is not null;

alter table notification_events enable row level security;

drop policy if exists "owners can read their notification events"
  on notification_events;

create policy "owners can read their notification events"
  on notification_events for select
  to authenticated
  using (business_id in (select accessible_business_ids()));
