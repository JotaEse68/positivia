alter table feedback
  add column if not exists issue_categories text[] not null default '{}',
  add column if not exists contact_info text;

alter table business_rating_settings
  add column if not exists visual_theme text not null default 'sunrise',
  add column if not exists logo_display text not null default 'large';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'business_rating_settings_visual_theme_check'
  ) then
    alter table business_rating_settings
      add constraint business_rating_settings_visual_theme_check
      check (visual_theme in ('sunrise', 'hope', 'coral'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'business_rating_settings_logo_display_check'
  ) then
    alter table business_rating_settings
      add constraint business_rating_settings_logo_display_check
      check (logo_display in ('large', 'compact'));
  end if;
end $$;
