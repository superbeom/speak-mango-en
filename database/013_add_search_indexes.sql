-- Search Performance Optimization
-- Add indexes for efficient multilingual search

-- GIN index for JSONB meaning field (supports all language keys)
-- This enables efficient queries on meaning->>lang fields
CREATE INDEX IF NOT EXISTS idx_expressions_meaning_gin 
ON speak_mango_en.expressions 
USING GIN (meaning);

-- Trigram index for expression field (enables efficient ILIKE queries)
-- Requires pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_expressions_expression_trgm 
ON speak_mango_en.expressions 
USING GIN (expression gin_trgm_ops);
