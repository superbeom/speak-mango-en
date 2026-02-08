--
-- Name: get_vocabulary_list_details(uuid); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Retrieves detailed information for a specific vocabulary list,
--              including its metadata and associated expression items with pagination.
--              Enforces ownership check using auth.uid().
--
-- Returns: JSON object containing list details and nested items array.
--
create or replace function speak_mango_en.get_vocabulary_list_details(
  p_list_id uuid,
  p_page int default 1,        -- Current page number
  p_page_size int default 24   -- Number of items per page
)
returns json
language plpgsql
security definer
set search_path = speak_mango_en
as $$
declare
  v_result json;
  v_total_count bigint;
  v_offset int;
begin
  -- Calculate offset
  v_offset := (p_page - 1) * p_page_size;

  -- Get total count of items in the list
  select count(*)
  into v_total_count
  from vocabulary_items
  where list_id = p_list_id;

  select json_build_object(
    'id', vl.id,
    'title', vl.title,
    'is_default', vl.is_default,
    'created_at', vl.created_at,
    'total_count', v_total_count,
    'items', coalesce(
      (
        select json_agg(e.* order by vi.created_at desc)
        from (
          select expression_id, created_at
          from vocabulary_items
          where list_id = vl.id
          order by created_at desc
          limit p_page_size
          offset v_offset
        ) vi
        join expressions e on vi.expression_id = e.id
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
