--
-- Name: on_vocabulary_list_created(); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Checks if the newly created vocabulary list is the user's first list.
--              If so, it automatically sets 'is_default' to true.
--
-- Usage: Attach this function to vocabulary_lists' AFTER INSERT trigger.
--
-- Returns: trigger
--
create or replace function speak_mango_en.on_vocabulary_list_created()
returns trigger
language plpgsql
security definer
set search_path = speak_mango_en
as $$
declare
  list_count int;
begin
  -- Check how many lists the user already has (including the one just inserted)
  select count(*) into list_count
  from vocabulary_lists
  where user_id = NEW.user_id;

  -- If this is the only list (count=1), update it to be default
  if list_count = 1 then
    update vocabulary_lists
    set is_default = true
    where id = NEW.id;
  end if;

  return NEW;
end;
$$;

--
-- Trigger: set_vocabulary_list_first_default
--
-- Description: Trigger to execute on_vocabulary_list_created after a new list insert.
--
-- Attached to: speak_mango_en.vocabulary_lists
-- Event: AFTER INSERT
--
drop trigger if exists set_vocabulary_list_first_default on speak_mango_en.vocabulary_lists;
create trigger set_vocabulary_list_first_default
after insert on speak_mango_en.vocabulary_lists
for each row
execute function speak_mango_en.on_vocabulary_list_created();
