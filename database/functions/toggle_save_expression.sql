--
-- Name: toggle_save_expression(uuid); Type: FUNCTION; Schema: speak_mango_en
--
-- Description: 표현의 저장 상태를 단일 트랜잭션으로 토글합니다.
--              기존의 toggleUserAction + addToVocabularyList/removeFromVocabularyList를 하나로 통합.
--              user_actions(save)를 사용하지 않고 vocabulary_items만으로 저장 여부를 판단합니다.
--              최신 단어장 목록(item_count 포함)을 JSON으로 반환하여 SWR 리페치를 대체합니다.
--
-- 동작:
--   1. vocabulary_items에서 해당 표현의 저장 여부 확인
--   2a. 이미 저장됨 → 모든 단어장에서 제거
--   2b. 저장 안 됨 → 기본 단어장에 추가
--   3. 최신 단어장 목록(item_count 포함)을 JSON으로 반환
--
-- Usage: 저장 버튼 클릭 시 단일 POST로 저장/해제 + 단어장 데이터 갱신을 처리합니다.
--
-- Parameters:
--   p_expression_id: 대상 표현의 UUID.
--
-- Returns: json (단어장 목록 배열: id, title, is_default, item_count)
--

create or replace function speak_mango_en.toggle_save_expression(
  p_expression_id uuid
)
returns json
language plpgsql
security definer
set search_path = speak_mango_en
as $$
declare
  v_user_id uuid = auth.uid();
  v_is_saved boolean;
  v_default_list_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. 저장 여부 확인 (vocabulary_items 기반)
  select exists (
    select 1 from vocabulary_items vi
    join vocabulary_lists vl on vl.id = vi.list_id
    where vl.user_id = v_user_id and vi.expression_id = p_expression_id
  ) into v_is_saved;

  if v_is_saved then
    -- 2a. 해제: 모든 단어장에서 제거
    delete from vocabulary_items
    where expression_id = p_expression_id
      and list_id in (
        select id from vocabulary_lists where user_id = v_user_id
      );
  else
    -- 2b. 저장: 기본 단어장에 추가
    select id into v_default_list_id
    from vocabulary_lists
    where user_id = v_user_id and is_default = true
    limit 1;

    if v_default_list_id is not null then
      insert into vocabulary_items (list_id, expression_id)
      values (v_default_list_id, p_expression_id)
      on conflict (list_id, expression_id) do nothing;
    end if;
  end if;

  -- 3. 최신 단어장 데이터 반환 (SWR 리페치 대체)
  return (
    select coalesce(json_agg(row_to_json(t)), '[]'::json)
    from (
      select vl.id, vl.title, vl.is_default,
             count(vi.expression_id)::int as item_count
      from vocabulary_lists vl
      left join vocabulary_items vi on vi.list_id = vl.id
      where vl.user_id = v_user_id
      group by vl.id, vl.title, vl.is_default
      order by vl.is_default desc, vl.created_at asc
    ) t
  );
end;
$$;
