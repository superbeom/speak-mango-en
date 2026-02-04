-- Migration: Secure RLS with NextAuth (Custom JWT)
-- Created: 2026-02-04
-- Description: RLS 정책을 auth.uid() 기반으로 다시 강화하여 보안을 확보합니다.
--              이 정책이 올바르게 작동하려면, 애플리케이션에서 올바른 SUPABASE_JWT_SECRET으로 서명된 Custom JWT를 보내야 합니다.

set search_path to speak_mango_en;

-- 1. vocabulary_lists 정책 강화 (기존 'Application layer...' 정책 제거)
drop policy if exists "Application layer auth checks" on vocabulary_lists;

-- 2. 새로운 엄격한 정책 적용 (auth.uid() 필수)
create policy "Users can view their own lists"
  on vocabulary_lists for select
  using (auth.uid() = user_id);

create policy "Users can insert their own lists"
  on vocabulary_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own lists"
  on vocabulary_lists for update
  using (auth.uid() = user_id);

create policy "Users can delete their own lists"
  on vocabulary_lists for delete
  using (auth.uid() = user_id);


-- 3. vocabulary_items 정책 강화
drop policy if exists "Application layer auth checks for items" on vocabulary_items;

create policy "Users can view items in their lists"
  on vocabulary_items for select
  using (
    exists (
      select 1 from vocabulary_lists
      where id = vocabulary_items.list_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert items into their lists"
  on vocabulary_items for insert
  with check (
    exists (
      select 1 from vocabulary_lists
      where id = vocabulary_items.list_id
      and user_id = auth.uid()
    )
  );

create policy "Users can delete items from their lists"
  on vocabulary_items for delete
  using (
    exists (
      select 1 from vocabulary_lists
      where id = vocabulary_items.list_id
      and user_id = auth.uid()
    )
  );

-- 4. (참고) Grant 권한은 025번 마이그레이션에서 이미 부여되었으므로 유지됩니다.
-- 이제 Grant(입장) + RLS(열람제한) + App Logic(withPro) 3중 보안이 완성됩니다.
