alter table business_rating_settings
  add column if not exists reward_enabled boolean not null default false,
  add column if not exists reward_text text;
