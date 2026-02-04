-- Migration: Fix Foreign Key Reference for vocabulary_lists
-- Created: 2026-02-04
-- Description: vocabulary_lists의 user_id 참조 대상을 auth.users에서 speak_mango_en.users로 변경

set search_path to speak_mango_en;

-- 1. Remove the incorrect foreign key constraint targeting auth.users
alter table vocabulary_lists
  drop constraint if exists vocabulary_lists_user_id_fkey;

-- 2. Add the correct foreign key constraint targeting speak_mango_en.users
-- This aligns with our custom auth schema strategy using NextAuth
alter table vocabulary_lists
  add constraint vocabulary_lists_user_id_fkey
  foreign key (user_id)
  references speak_mango_en.users(id)
  on delete cascade;

-- Note: This assumes that all user_ids in vocabulary_lists already exist in speak_mango_en.users.
-- Since NextAuth manages the user creation, this should be consistent.
