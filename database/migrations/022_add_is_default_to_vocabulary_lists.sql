-- Migration: Add is_default column to vocabulary_lists
-- Created: 2026-01-30
-- Description: Adds is_default column to explicity mark the default list.

set search_path to speak_mango_en;

-- 1. Add is_default column
alter table vocabulary_lists 
add column if not exists is_default boolean default false;

-- 2. Backfill: Set the oldest list as default for each user
with ranked_lists as (
  select 
    id,
    row_number() over (partition by user_id order by created_at asc) as rn
  from vocabulary_lists
)
update vocabulary_lists
set is_default = true
where id in (
  select id from ranked_lists where rn = 1
);

-- 3. Add partial unique index to ensure only one default list per user
create unique index if not exists idx_vocabulary_lists_user_default
on vocabulary_lists (user_id)
where (is_default = true);
