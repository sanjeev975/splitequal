create table user_consents (
  user_id uuid references profiles on delete cascade,
  consent_type text not null, -- 'terms_privacy' or 'marketing'
  consented_at timestamptz not null default now(),
  policy_version text not null default '1.0',
  signup_channel text not null default 'web',
  primary key (user_id, consent_type)
);

alter table user_consents enable row level security;
create policy p_self on user_consents for all using (user_id = auth.uid()) with check (user_id = auth.uid());
