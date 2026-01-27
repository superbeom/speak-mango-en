-- Migration: Remove 'like' from action_type enum
-- Created: 2026-01-27
-- Description: Updates action_type enum to remove 'like' option as it is no longer supported.

set search_path to speak_mango_en;

-- 1. Remove existing 'like' actions
-- Since the new enum will not support 'like', we must remove these records first
delete from user_actions where action_type::text = 'like';

-- 2. Rename the existing type
alter type action_type rename to action_type_old;

-- 3. Create the new type
create type action_type as enum ('save', 'learn');

-- 4. Update the table to use the new type
-- We cast to text first, then to the new enum type
alter table user_actions 
  alter column action_type type action_type 
  using action_type::text::action_type;

-- 5. Drop the old type
drop type action_type_old;

-- Note: The toggle_user_action function uses 'text' as input parameter, 
-- so it does not need modification, but calling it with 'like' will now fail 
-- (which is the intended behavior).
