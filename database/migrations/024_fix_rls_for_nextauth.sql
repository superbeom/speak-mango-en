-- Migration: Fix RLS for NextAuth Integration
-- Created: 2026-02-04
-- Description: RLS 정책을 'to public'으로 변경하고 애플리케이션 레벨에서 권한 검증을 강화

set search_path to speak_mango_en;

-- 1. 기존 RLS 정책 삭제
drop policy if exists "Users can view their own lists" on vocabulary_lists;
drop policy if exists "Users can insert their own lists" on vocabulary_lists;
drop policy if exists "Users can update their own lists" on vocabulary_lists;
drop policy if exists "Users can delete their own lists" on vocabulary_lists;

drop policy if exists "Users can view items in their lists" on vocabulary_items;
drop policy if exists "Users can insert items into their lists" on vocabulary_items;
drop policy if exists "Users can delete items from their lists" on vocabulary_items;

-- 2. vocabulary_lists 테이블 정책 (public)
-- 애플리케이션 레벨(withPro HOF)에서 권한을 검증하므로 RLS는 패스
create policy "Application layer auth checks"
  on vocabulary_lists for all
  to public
  using (true)
  with check (true);

-- 3. vocabulary_items 테이블 정책 (public)
create policy "Application layer auth checks for items"
  on vocabulary_items for all
  to public
  using (true)
  with check (true);

-- 4. RLS가 활성화되어 있는지 확인
-- (Enable RLS를 제거하지 않고, 정책만 변경)
-- 혹시 RLS가 비활성화되어 있다면 활성화
alter table vocabulary_lists enable row level security;
alter table vocabulary_items enable row level security;

-- 설명:
-- - 'to public': 모든 사용자에게 접근 허용 (anon, authenticated 포함)
-- - 'using (true)' / 'with check (true)': RLS 필터를 패스
-- - 실제 권한 검증: 애플리케이션 레벨의 withPro HOF에서 수행
-- 
-- 이 접근의 이유:
-- 1. NextAuth와 Supabase Auth는 별개의 인증 시스템
-- 2. auth.uid()는 NextAuth 세션에서 사용할 수 없음
-- 3. withPro HOF가 이미 userId와 isPro를 확인하므로 중복 검증 불필요
