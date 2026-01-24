--
-- Name: toggle_user_action(uuid, text); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Atomically toggles a user action (like, save, learn) for an expression.
--              If the action exists, it is removed (toggle off).
--              If it does not exist, it is created (toggle on).
--              This ensures atomicity and reduces network roundtrips.
--
-- Parameters:
-- p_expression_id: The UUID of the expression.
-- p_action_type: The type of action ('like', 'save', 'learn').
--
-- Returns: void
--
create or replace function speak_mango_en.toggle_user_action(
  p_expression_id uuid,
  p_action_type text
)
returns void
language plpgsql
security definer
set search_path = speak_mango_en, public
as $$
declare
  -- auth.uid() returns the ID of the user executing the function via Supabase Client
  v_user_id uuid = auth.uid();
begin
  -- Validate input
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1 from user_actions
    where user_id = v_user_id
      and expression_id = p_expression_id
      and action_type = p_action_type
  ) then
    -- If exists, delete (Toggle Off)
    delete from user_actions
    where user_id = v_user_id
      and expression_id = p_expression_id
      and action_type = p_action_type;
  else
    -- If not exists, insert (Toggle On)
    insert into user_actions (user_id, expression_id, action_type)
    values (v_user_id, p_expression_id, p_action_type);
  end if;
end;
$$;
