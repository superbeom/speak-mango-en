--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Automatically updates the 'updated_at' timestamp column to the current time
--              whenever a row is modified. This ensures accurate tracking of record modifications.
--
-- Usage: Attach this function to a table's BEFORE UPDATE trigger.
--
-- Example:
--   CREATE TRIGGER update_users_updated_at
--   BEFORE UPDATE ON speak_mango_en.users
--   FOR EACH ROW
--   EXECUTE FUNCTION speak_mango_en.update_updated_at_column();
--
-- Returns: trigger - The modified NEW record with updated 'updated_at' field.
--
create or replace function speak_mango_en.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    -- Set the updated_at column to the current timestamp
    new.updated_at = now();
    return new;
end;
$$;

--
-- Trigger: update_users_updated_at
--
-- Description: Automatically updates the 'updated_at' column in the 'users' table
--              whenever a user record is modified.
--
-- Attached to: speak_mango_en.users
-- Event: BEFORE UPDATE
-- Scope: FOR EACH ROW
--
create trigger update_users_updated_at
before update on speak_mango_en.users
for each row
execute function speak_mango_en.update_updated_at_column();
