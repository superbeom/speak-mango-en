-- [004] Update Schema for i18n Support
-- Description: 다국어 확장을 위해 meaning 컬럼 타입을 변경하고 content 구조를 개편합니다.
--              또한 content 내부의 'kr' 키를 중립적인 'translation'으로 변경합니다.
-- Created at: 2025-12-31

-- 1. Migrate 'meaning' column
-- TEXT 타입이었던 meaning을 JSONB로 변환합니다.
-- 기존 데이터가 있다면 {"ko": "기존값"} 형태로 변환하여 보존합니다.
ALTER TABLE daily_english.expressions
ALTER COLUMN meaning TYPE jsonb
USING jsonb_build_object('ko', meaning);

-- 2. Migrate 'content' column
-- 단계 2-1: dialogue 내부의 'kr' 키를 'translation'으로 변경
-- (PostgreSQL의 replace 기능을 활용하여 JSON 텍스트 내의 "kr": 을 "translation": 으로 일괄 치환)
-- 주의: 이 방식은 "kr"이라는 문자열이 키가 아닌 값(value)에 포함될 경우에도 바뀔 수 있으나,
--       현재 데이터 구조상 안전하다고 판단됨. 더 정교한 처리가 필요하면 jsonb 로직을 사용해야 함.
UPDATE daily_english.expressions
SET content = (
    replace(content::text, '"kr":', '"translation":')
)::jsonb
WHERE content::text LIKE '%"kr":%';

-- 단계 2-2: 구조 계층화 (Wrapper)
-- 기존: { "situation": ... }
-- 변경: { "ko": { "situation": ... } }
UPDATE daily_english.expressions
SET content = jsonb_build_object('ko', content)
WHERE content->>'ko' IS NULL; -- 이미 마이그레이션 된 데이터는 제외

-- 3. Add Comments
COMMENT ON COLUMN daily_english.expressions.meaning IS '다국어 뜻 (예: {"ko": "...", "ja": "..."})';
COMMENT ON COLUMN daily_english.expressions.content IS '다국어 상세 콘텐츠 (예: {"ko": {...}, "ja": {...}})';