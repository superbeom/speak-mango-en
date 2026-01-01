-- [005] Add Domain and Category Columns
-- Description: 콘텐츠 확장을 위해 대분류(domain)와 소분류(category) 컬럼을 추가하고, 기존 데이터는 기본값으로 초기화합니다.
-- Created at: 2026-01-01

-- 1. Add Columns
ALTER TABLE daily_english.expressions
ADD COLUMN domain TEXT DEFAULT 'conversation', -- 'conversation', 'test', 'vocabulary'
ADD COLUMN category TEXT DEFAULT 'general';    -- 'business', 'travel', 'shopping', etc.

-- 2. Update Existing Data
-- 기존 데이터는 모두 회화/데일리로 간주
UPDATE daily_english.expressions
SET domain = 'conversation', category = 'daily'
WHERE category = 'general';

-- 3. Add Indexes (필터링 성능 향상)
CREATE INDEX idx_expressions_domain ON daily_english.expressions(domain);
CREATE INDEX idx_expressions_category ON daily_english.expressions(category);

COMMENT ON COLUMN daily_english.expressions.domain IS '대분류 (예: conversation, test, vocabulary)';
COMMENT ON COLUMN daily_english.expressions.category IS '소분류 (예: business, travel, shopping)';
