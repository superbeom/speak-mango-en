-- Migration: Optimize Search Queries (2026-01-19)
-- Description: 
-- 1. Add a generated column `meaning_text` to store the stringified version of the `meaning` JSONB column.
--    This allows us to perform efficient text searches across all languages using a single index.
-- 2. Create a GIN Trigram index on the `meaning_text` column to support ILIKE queries.

-- 1. Add Generated Column
ALTER TABLE speak_mango_en.expressions
ADD COLUMN IF NOT EXISTS meaning_text TEXT
GENERATED ALWAYS AS (meaning::text) STORED;

-- 2. Create Index
CREATE INDEX IF NOT EXISTS idx_expressions_meaning_text_trgm
ON speak_mango_en.expressions
USING GIN (meaning_text gin_trgm_ops);

-- Note: The existing 'idx_expressions_expression_trgm' already handles the 'expression' column.
-- This new index complements it by handling the 'meaning' column efficiently.
