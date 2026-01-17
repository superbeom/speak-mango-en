-- Migration: Add unique constraint to expression column
-- Description: Enforce uniqueness on the 'expression' column to prevent duplicate entries at the database level.
-- Created: 2026-01-17

-- 1. Add unique constraint
-- This will automatically create a unique B-Tree index on the 'expression' column.
-- If duplicate values already exist, this command will fail and you must clean up duplicates first.
ALTER TABLE speak_mango_en.expressions 
ADD CONSTRAINT unique_expression UNIQUE (expression);

-- 2. Add comment for documentation
COMMENT ON CONSTRAINT unique_expression ON speak_mango_en.expressions IS 'Enforces uniqueness of English expressions to prevent duplicates';
