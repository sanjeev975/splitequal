-- PostgreSQL regex repetition counts are capped at 255, so the {2,256} in 0008 made every UPI save fail with
-- "invalid regular expression: invalid repetition count(s)". Replace it with a valid bound (local part 2-100 chars).
alter table payment_handles drop constraint if exists upi_fmt;
alter table payment_handles add constraint upi_fmt check (upi_id is null or upi_id ~ '^[a-zA-Z0-9._-]{2,100}@[a-zA-Z][a-zA-Z0-9]{1,63}$');
