-- [003] Remove origin_url Column
-- Description: AI 기반 생성 방식으로 전환됨에 따라 더 이상 필요하지 않은 origin_url 컬럼을 삭제합니다.
-- Created at: 2025-12-31

-- 1. Remove Column
-- daily_english.expressions 테이블에서 origin_url 컬럼을 삭제합니다.
alter table daily_english.expressions drop column if exists origin_url;
