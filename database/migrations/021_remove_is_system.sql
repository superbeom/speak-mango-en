-- Remove is_system column from vocabulary_lists table
set search_path to speak_mango_en;

ALTER TABLE vocabulary_lists DROP COLUMN IF EXISTS is_system;
