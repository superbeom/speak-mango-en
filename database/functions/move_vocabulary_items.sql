--
-- Name: move_vocabulary_items(uuid, uuid, uuid[]); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Moves a set of expressions from a source vocabulary list to a target vocabulary list.
--              It acts atomically: first adding to the target (ignoring duplicates),
--              and then removing from the source.
--
-- Parameters:
-- p_source_list_id: UUID of the list to move items FROM.
-- p_target_list_id: UUID of the list to move items TO.
-- p_expression_ids: Array of expression UUIDs to move.
--
-- Returns: void
--
create or replace function speak_mango_en.move_vocabulary_items(
  p_source_list_id uuid,
  p_target_list_id uuid,
  p_expression_ids uuid[]
)
returns void
language plpgsql
security invoker
as $$
begin
  -- 1. Insert into target list (Ignore duplicates via ON CONFLICT)
  insert into speak_mango_en.vocabulary_items (list_id, expression_id)
  select p_target_list_id, id
  from unnest(p_expression_ids) as id
  on conflict (list_id, expression_id) do nothing;

  -- 2. Delete from source list
  delete from speak_mango_en.vocabulary_items
  where list_id = p_source_list_id
    and expression_id = any(p_expression_ids);
end;
$$;
