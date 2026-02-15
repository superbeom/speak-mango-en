--
-- Name: get_saved_expression_ids(); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: 사용자가 저장한 모든 표현 ID를 반환합니다.
--              user_actions 테이블 대신 vocabulary_items를 조인하여 저장 상태를 파생합니다.
--              기존의 getUserActions("save") 서버 쿼리를 대체합니다.
--
-- Usage: 초기 로드 시 useUserActionStore.savedIds를 시딩하기 위해 사용합니다.
--
-- Parameters: 없음 (auth.uid()를 사용하여 현재 사용자를 식별합니다)
--
-- Returns: setof uuid (저장된 expression_id 목록)
--

create or replace function speak_mango_en.get_saved_expression_ids()
returns setof uuid
language sql
security definer
stable
set search_path = speak_mango_en
as $$
  select distinct vi.expression_id
  from vocabulary_items vi
  join vocabulary_lists vl on vl.id = vi.list_id
  where vl.user_id = auth.uid();
$$;
