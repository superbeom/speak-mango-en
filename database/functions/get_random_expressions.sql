--
-- Name: get_random_expressions(int); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: Efficiently fetches a random set of expressions from the database.
--              Currently uses ORDER BY RANDOM() which is sufficient and accurate for
--              dataset sizes up to ~100k rows.
--              For larger datasets, consider switching to TABLESAMPLE approaches.
--
-- Parameters:
-- limit_cnt: The maximum number of expressions to return.
--
-- Returns: setof expressions - A set of expression rows.
--
create or replace function speak_mango_en.get_random_expressions(limit_cnt int)
returns setof speak_mango_en.expressions
language sql
as $$
  select * from speak_mango_en.expressions
  order by random()
  limit limit_cnt;
$$;
