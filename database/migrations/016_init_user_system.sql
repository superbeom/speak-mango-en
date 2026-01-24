-- Init User System Tables (NextAuth Compatible)

-- Set search path to ensure we are working in the correct schema
set search_path to speak_mango_en;

-- 1. Create Enums
create type user_tier as enum ('free', 'pro');
create type action_type as enum ('like', 'save', 'learn');

-- 2. Users Table
create table if not exists users (
  id uuid not null default gen_random_uuid() primary key,
  name text,
  email text unique,
  emailVerified timestamptz,
  image text,
  
  -- Custom Fields
  tier user_tier not null default 'free',
  subscription_end_date timestamptz,
  trial_usage_count int not null default 0,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Accounts Table (OAuth)
-- Maps to NextAuth 'Account' model
create table if not exists accounts (
  id uuid not null default gen_random_uuid() primary key,
  userId uuid not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  providerAccountId text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  
  unique(provider, providerAccountId)
);

-- 4. Sessions Table
-- Stores refresh tokens for Access/Refresh Token strategy
-- Enables immediate access control and token revocation
create table if not exists sessions (
  id uuid not null default gen_random_uuid() primary key,
  sessionToken text not null unique,
  userId uuid not null references users(id) on delete cascade,
  expires timestamptz not null
);

-- 5. User Actions Table
-- Stores user interactions (Like, Save, Learn)
create table if not exists user_actions (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  expression_id uuid not null references expressions(id) on delete cascade,
  action_type action_type not null,
  created_at timestamptz not null default now(),
  
  -- Prevent duplicate actions (e.g., liking the same expression twice)
  unique(user_id, expression_id, action_type)
);

-- 6. Indexes
create index idx_users_email on users(email);
create index idx_accounts_userId on accounts(userId);
create index idx_sessions_userId on sessions(userId);
create index idx_sessions_sessionToken on sessions(sessionToken);
create index idx_user_actions_user_id on user_actions(user_id);
create index idx_user_actions_expression_id on user_actions(expression_id);
create index idx_user_actions_composite on user_actions(user_id, action_type);

-- 7. Triggers
-- Trigger functions and definitions are managed separately in database/triggers/
-- See: database/triggers/update_users_timestamp.sql
