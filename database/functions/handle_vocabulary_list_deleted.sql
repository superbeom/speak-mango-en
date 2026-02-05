--
-- Name: handle_vocabulary_list_deleted(); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Handles the scenario where a user deletes their 'Default' vocabulary list.
--              It automatically promotes the oldest remaining list to be the new default,
--              ensuring the user always has a default list for one-tap saving.
--
-- Usage: Attach this function to vocabulary_lists' AFTER DELETE trigger.
--
-- Returns: trigger
--
create or replace function speak_mango_en.handle_vocabulary_list_deleted()
returns trigger
language plpgsql
security definer
set search_path = speak_mango_en
as $$
declare
    new_default_id uuid;
begin
    -- Only proceed if the deleted list was the default one
    if old.is_default then
        -- Find the oldest remaining list for the user (First Created)
        select id into new_default_id
        from speak_mango_en.vocabulary_lists
        where user_id = old.user_id
        order by created_at asc
        limit 1;

        -- If a list exists, make it the new default
        if new_default_id is not null then
            update speak_mango_en.vocabulary_lists
            set is_default = true
            where id = new_default_id;
        end if;
    end if;

    return old;
end;
$$;

--
-- Trigger: on_vocabulary_list_deleted
--
-- Description: Trigger to execute handle_vocabulary_list_deleted after a list deletion.
--
-- Attached to: speak_mango_en.vocabulary_lists
-- Event: AFTER DELETE
--
drop trigger if exists on_vocabulary_list_deleted on speak_mango_en.vocabulary_lists;

create trigger on_vocabulary_list_deleted
    after delete
    on speak_mango_en.vocabulary_lists
    for each row
    execute function speak_mango_en.handle_vocabulary_list_deleted();
