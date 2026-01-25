-- 1. Rename columns to snake_case (DB Standard) safely
-- Uses anonymous code block to check if rename is needed/possible
-- This handles cases where columns might already be renamed or exist as "CamelCase"

DO $$
BEGIN
    -- Users: emailverified -> email_verified
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'speak_mango_en' AND table_name = 'users' AND column_name = 'emailverified') THEN
        ALTER TABLE speak_mango_en.users RENAME COLUMN emailverified TO email_verified;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'speak_mango_en' AND table_name = 'users' AND column_name = 'emailVerified') THEN
        ALTER TABLE speak_mango_en.users RENAME COLUMN "emailVerified" TO email_verified;
    END IF;

    -- Accounts: userid -> user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'speak_mango_en' AND table_name = 'accounts' AND column_name = 'userid') THEN
        ALTER TABLE speak_mango_en.accounts RENAME COLUMN userid TO user_id;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'speak_mango_en' AND table_name = 'accounts' AND column_name = 'userId') THEN
        ALTER TABLE speak_mango_en.accounts RENAME COLUMN "userId" TO user_id;
    END IF;

    -- Accounts: provideraccountid -> provider_account_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'speak_mango_en' AND table_name = 'accounts' AND column_name = 'provideraccountid') THEN
        ALTER TABLE speak_mango_en.accounts RENAME COLUMN provideraccountid TO provider_account_id;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'speak_mango_en' AND table_name = 'accounts' AND column_name = 'providerAccountId') THEN
        ALTER TABLE speak_mango_en.accounts RENAME COLUMN "providerAccountId" TO provider_account_id;
    END IF;

    -- Sessions: sessiontoken -> session_token
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'speak_mango_en' AND table_name = 'sessions' AND column_name = 'sessiontoken') THEN
        ALTER TABLE speak_mango_en.sessions RENAME COLUMN sessiontoken TO session_token;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'speak_mango_en' AND table_name = 'sessions' AND column_name = 'sessionToken') THEN
         ALTER TABLE speak_mango_en.sessions RENAME COLUMN "sessionToken" TO session_token;
    END IF;

    -- Sessions: userid -> user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'speak_mango_en' AND table_name = 'sessions' AND column_name = 'userid') THEN
        ALTER TABLE speak_mango_en.sessions RENAME COLUMN userid TO user_id;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'speak_mango_en' AND table_name = 'sessions' AND column_name = 'userId') THEN
        ALTER TABLE speak_mango_en.sessions RENAME COLUMN "userId" TO user_id;
    END IF;
END $$;

-- Re-create indexes with snake_case names (Idempotent drop)
drop index if exists idx_sessions_sessiontoken;
drop index if exists idx_sessions_userid;
drop index if exists idx_accounts_userid;
drop index if exists idx_sessions_session_token; -- Drop if exists to recreate clean
drop index if exists idx_sessions_user_id;
drop index if exists idx_accounts_user_id;

create index idx_sessions_session_token on speak_mango_en.sessions(session_token);
create index idx_sessions_user_id on speak_mango_en.sessions(user_id);
create index idx_accounts_user_id on speak_mango_en.accounts(user_id);


-- 2. Create 'speak_mango_en_next_auth' Schema and Views
-- We use a Namespaced Schema to avoid conflicts in a shared Supabase project.

create schema if not exists speak_mango_en_next_auth;
grant usage on schema speak_mango_en_next_auth to service_role;
grant all on all tables in schema speak_mango_en_next_auth to service_role;

-- Users View
create or replace view speak_mango_en_next_auth.users as
select
  id,
  name,
  email,
  email_verified as "emailVerified",
  image
from speak_mango_en.users;

-- Accounts View
create or replace view speak_mango_en_next_auth.accounts as
select
  id,
  user_id as "userId",
  type,
  provider,
  provider_account_id as "providerAccountId",
  refresh_token,
  access_token,
  expires_at,
  token_type,
  scope,
  id_token,
  session_state
from speak_mango_en.accounts;

-- Sessions View
create or replace view speak_mango_en_next_auth.sessions as
select
  id,
  session_token as "sessionToken",
  user_id as "userId",
  expires
from speak_mango_en.sessions;

-- Grant permissions for the View to work effectively via API (if exposed)
-- Important: View requires access to underlying table. service_role has it.
grant select, insert, update, delete on speak_mango_en_next_auth.users to service_role;
grant select, insert, update, delete on speak_mango_en_next_auth.accounts to service_role;
grant select, insert, update, delete on speak_mango_en_next_auth.sessions to service_role;
