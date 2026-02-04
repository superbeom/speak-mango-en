-- Migration: Fix Vocabulary RLS Policy
-- Created: 2026-02-04
-- Description: Fix permission denied error by recreating the insert policy for vocabulary_lists.

set search_path to speak_mango_en;

-- 1. Drop existing policy securely
drop policy if exists "Users can insert their own lists" on vocabulary_lists;

-- 2. Recreate policy with 'to authenticated'
create policy "Users can insert their own lists"
  on vocabulary_lists for insert
  to authenticated
  with check (
    auth.uid() = user_id
  );

-- 3. Ensure RLS is enabled
alter table vocabulary_lists enable row level security;
