create table if not exists business_rating_settings (
  business_id uuid primary key references businesses(id) on delete cascade,
  visual_theme text not null default 'sunrise'
    check (visual_theme in ('sunrise', 'hope', 'coral')),
  logo_display text not null default 'large'
    check (logo_display in ('large', 'compact')),
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

alter table business_rating_settings enable row level security;

drop policy if exists "public can read rating settings" on business_rating_settings;
create policy "public can read rating settings"
  on business_rating_settings for select
  to anon, authenticated
  using (true);
