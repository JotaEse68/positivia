alter table business_rating_settings
  add column if not exists incentive_text text,
  add column if not exists issue_options text;
