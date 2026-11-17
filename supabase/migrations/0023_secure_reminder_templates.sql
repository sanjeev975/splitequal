-- Enable row level security on the templates table
alter table reminder_templates enable row level security;

-- By not creating any policies, all access (select, insert, update, delete)
-- is denied by default for all database roles (including authenticated and anon).
-- The 'security definer' function 'send_repayment_reminders' will still have
-- access because it runs as the table owner.
