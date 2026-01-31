--
-- Name: get_vocabulary_list_details(uuid); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Retrieves detailed information for a specific vocabulary list,
--              including its metadata and all associated expression items.
--              Enforces ownership check using auth.uid().
--
-- Returns: JSON object containing list details and nested items array.
--
create or replace function speak_mango_en.get_vocabulary_list_details(p_list_id uuid)
returns json
language plpgsql
security definer
set search_path = speak_mango_en
as $$
declare
  v_result json;
begin
  select json_build_object(
    'id', vl.id,
    'title', vl.title,
    'is_default', vl.is_default,
    'created_at', vl.created_at,
    'items', coalesce(
      (
        select json_agg(e.* order by vi.created_at desc)
        from vocabulary_items vi
        join expressions e on vi.expression_id = e.id
        where vi.list_id = vl.id
      ),
      '[]'::json
    )
  ) into v_result
  from vocabulary_lists vl
  where vl.id = p_list_id
    and vl.user_id = auth.uid();

  return v_result;
end;
$$;
