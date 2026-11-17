-- Enable pg_cron if not enabled
create extension if not exists pg_cron;

-- Table to store funny reminder messages
create table reminder_templates (
  id serial primary key,
  message text not null,
  active boolean default true
);

-- Seed with some funny messages
insert into reminder_templates (message) values
  ('Bhai, pesa hi pesa! But please settle your dues. 💸'),
  ('Your friends are waiting... for their money. Don''t be that person! 😂'),
  ('Knock knock! It''s your friendly debt collector. Please settle up! ❤️'),
  ('Account balance: Low. Friendship status: Dependent on this settlement. 😜'),
  ('Don''t make me come over there! Please settle your group expenses. 🏃‍♂️');

-- Function to send daily reminders
create or replace function send_repayment_reminders() returns void
language plpgsql security definer set search_path = public as $$
declare
  r record;
  msg text;
begin
  -- Loop through users who owe money (net_minor < 0)
  for r in
    select user_id, group_id, sum(net_minor) as total_owed, currency
    from group_net_balances
    where net_minor < 0
    group by user_id, group_id, currency
  loop
    -- Check if reminder was already sent today for this user+group+currency
    if not exists (
      select 1 from notifications
      where user_id = r.user_id
      and group_id = r.group_id
      and type = 'repayment_reminder'
      and created_at > now() - interval '20 hours'
    ) then
      -- Pick a random message
      select message into msg from reminder_templates where active = true order by random() limit 1;

      -- Send notification using your existing notify() function
      perform notify(
        r.user_id,
        r.group_id,
        'repayment_reminder',
        'Friendly Reminder',
        msg,
        '/groups/' || r.group_id,
        'reminder:' || r.group_id || ':' || to_char(now(), 'YYYY-MM-DD')
      );
    end if;
  end loop;
end $$;

-- Schedule to run every day at 11:16 PM (23:16)
select cron.schedule('daily-repayment-reminders', '16 23 * * *', 'select send_repayment_reminders()');
