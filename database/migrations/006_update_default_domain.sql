-- [006] Update Default Domain to 'general'
-- Description: 추후 다양한 도메인 확장을 고려하여 domain 컬럼의 기본값을 'conversation'에서 'general'로 변경합니다.
-- Created at: 2026-01-01

ALTER TABLE daily_english.expressions
ALTER COLUMN domain SET DEFAULT 'general';

COMMENT ON COLUMN daily_english.expressions.domain IS '대분류 (기본값: general, 예: conversation, test, vocabulary)';
