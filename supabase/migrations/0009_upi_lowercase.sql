-- UPI IDs are case-insensitive; keep one canonical lowercase form, raw ID only (the strict format check from 0008 already forbids "upi://" links).
update payment_handles set upi_id = lower(upi_id) where upi_id is not null;
alter table payment_handles add constraint upi_lowercase check (upi_id is null or upi_id = lower(upi_id));
