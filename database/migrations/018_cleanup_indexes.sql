-- Remove redundant/duplicate indexes identified in temp.json
-- These are likely left over from previous migrations or renames

set search_path to speak_mango_en;

-- Remove old CamelCase-ish named indexes (now redundant)
drop index if exists idx_accounts_userid;
drop index if exists idx_sessions_userid;
drop index if exists idx_sessions_sessiontoken;

-- Verify we are keeping the snake_case ones:
-- idx_accounts_user_id
-- idx_sessions_user_id
-- idx_sessions_session_token
