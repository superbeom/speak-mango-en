--
-- Name: set_default_vocabulary_list(uuid); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Sets a specific vocabulary list as the default for the current user.
--              Automatically unsets any existing default list.
--
-- Parameters:
--   p_list_id: The UUID of the vocabulary list to set as default.
--
-- Returns: void
--

create or replace function speak_mango_en.set_default_vocabulary_list(p_list_id uuid)
returns void
language plpgsql
security definer
set search_path = speak_mango_en
as $$
declare
  v_user_id uuid;
  v_owner_id uuid;
begin
  v_user_id := auth.uid();

  -- Verify ownership
  select user_id into v_owner_id
  from vocabulary_lists
  where id = p_list_id;

  if v_owner_id is null or v_owner_id != v_user_id then
    raise exception 'List not found or permission denied';
  end if;

  -- Update transaction
  -- 1. Unset existing default
  update vocabulary_lists
  set is_default = false
  where user_id = v_user_id
  and is_default = true;

  -- 2. Set new default
  update vocabulary_lists
  set is_default = true
  where id = p_list_id;

end;
$$;
