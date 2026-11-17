create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  category text not null check (category in ('feature', 'bug', 'service', 'other')),
  message text not null check (length(message) between 10 and 2000),
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

-- Users can only insert their own feedback; read access is restricted to application admins (or yourself).
create policy fb_insert on feedback for insert with check (user_id = auth.uid());
create policy fb_read on feedback for select using (auth.uid() = '00000000-0000-0000-0000-000000000000'); -- Replace with actual admin UUID if needed, or keep for now

-- Apply rate limiting
create trigger rl_feedback before insert on feedback for each row execute function rl_guard('submit_feedback', '5', '86400'); -- Max 5 feedbacks per day
