--
-- Name: get_vocabulary_lists_with_counts(); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Retrieves all vocabulary lists for the authenticated user along with
--              the count of items in each list.
--              Includes security definer to respect RLS but is filtered by auth.uid().
--
-- Returns: Table (id uuid, title text, item_count bigint, is_default boolean)
--
create or replace function speak_mango_en.get_vocabulary_lists_with_counts()
returns table (
  id uuid,
  title text,
  item_count bigint,
  is_default boolean
) 
language plpgsql
security definer
set search_path = speak_mango_en
as $$
begin
  return query
  select
    vl.id,
    vl.title,
    count(vi.expression_id)::bigint as item_count,
    vl.is_default
  from
    vocabulary_lists vl
    left join vocabulary_items vi on vl.id = vi.list_id
  where
    vl.user_id = auth.uid()
  group by
    vl.id
  order by
    vl.is_default desc,
    vl.created_at asc;
end;
$$;
