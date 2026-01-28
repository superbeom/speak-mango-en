-- Migration: Create Vocabulary System Tables
-- Created: 2026-01-28
-- Description: Adds tables for managing user vocabulary lists (wordbooks) and items.

set search_path to speak_mango_en;

-- 1. Create vocabulary_lists table
create table if not exists vocabulary_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for faster lookup by user
create index if not exists idx_vocabulary_lists_user_id on vocabulary_lists(user_id);
-- Composite index for listing user's wordbooks by creation date
create index if not exists idx_vocabulary_lists_user_created on vocabulary_lists(user_id, created_at desc);

-- 2. Create vocabulary_items table
create table if not exists vocabulary_items (
  list_id uuid not null references vocabulary_lists(id) on delete cascade,
  expression_id uuid references expressions(id) on delete cascade,
  custom_card_id uuid, -- Placeholder for future custom cards table
  created_at timestamptz default now(),
  
  -- Constraint: Either expression_id or custom_card_id must be present
  constraint chk_vocabulary_item_content check (
    (expression_id is not null and custom_card_id is null) or
    (expression_id is null and custom_card_id is not null)
  ),

  -- Unique constraint to prevent duplicate items in the same list
  primary key (list_id, expression_id) -- Note: Will need adjustment when custom_card_id is used mixedly
);

-- Index for finding which lists contain a specific expression (e.g., for "Saved" check)
create index if not exists idx_vocabulary_items_expression_id on vocabulary_items(expression_id);
-- Composite index for looking up items in a list sorted by creation date
create index if not exists idx_vocabulary_items_list_created on vocabulary_items(list_id, created_at desc);

-- 3. RLS Policies

-- Enable RLS
alter table vocabulary_lists enable row level security;
alter table vocabulary_items enable row level security;

-- Policies for vocabulary_lists
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

-- Policies for vocabulary_items
-- We check if the parent list belongs to the user
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

-- 4. Initial System Data Logic (Trigger)
-- When a new user is created, should we create a default "Saved" list?
-- For now, we will handle this at the application level (lazy creation) or via a trigger on auth.users.
-- Let's stick to Application Level Lazy Creation for simplicity in this phase.
