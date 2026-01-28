--
-- Trigger: update_vocab_updated_at
-- Schema: speak_mango_en
--
-- Description: Automatically updates the 'updated_at' column in the 'vocabulary_lists' table
--              whenever a list record is modified.
--
-- Attached to: speak_mango_en.vocabulary_lists
-- Event: BEFORE UPDATE
-- Scope: FOR EACH ROW
--
-- Usage: Run this script directly to create or update the trigger.
--

set search_path to speak_mango_en;

-- Drop trigger if exists to ensure idempotency (re-runnable)
drop trigger if exists update_vocab_updated_at on vocabulary_lists;

create trigger update_vocab_updated_at
    before update on vocabulary_lists
    for each row
    execute function update_updated_at_column();
