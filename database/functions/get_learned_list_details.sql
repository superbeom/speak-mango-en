--
-- Name: get_learned_list_details(int, int); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Retrieves a paginated list of expressions that the current user has marked as 'learned'.
--              Returns the total count and the list of expressions with their details.
--              Enforces ownership check using auth.uid().
--
-- Returns: JSON object containing 'total_count' and 'items' array.
--
create or replace function speak_mango_en.get_learned_list_details(
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
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  v_offset := (p_page - 1) * p_page_size;

  -- 1. Total Count of learned items
  select count(*)
  into v_total_count
  from user_actions
  where user_id = v_user_id
    and action_type = 'learn';

  -- 2. Build JSON result
  select json_build_object(
    'total_count', v_total_count,
    'items', coalesce(
      (
        select json_agg(e.*)
        from (
            select expression_id, created_at
            from user_actions
            where user_id = v_user_id
              and action_type = 'learn'
            order by created_at desc
            limit p_page_size
            offset v_offset
        ) ua
        join expressions e on ua.expression_id = e.id
      ),
      '[]'::json
    )
  ) into v_result;

  return v_result;
end;
$$;
