-- [008] Rename Schema to Speak Mango
-- Description: 프로젝트 명칭 변경에 따라 스키마 이름을 daily_english에서 speak_mango_en으로 변경하고 권한을 재설정합니다.
-- Created at: 2026-01-02

-- 1. Rename Schema
ALTER SCHEMA daily_english RENAME TO speak_mango_en;

-- 2. Grant Permissions (API Access)
-- 스키마 이름이 변경되었으므로 권한을 다시 부여해야 합니다.
GRANT USAGE ON SCHEMA speak_mango_en TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA speak_mango_en TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA speak_mango_en TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA speak_mango_en TO anon, authenticated, service_role;

-- 3. Update Comments
COMMENT ON TABLE speak_mango_en.expressions IS 'Speak Mango (EN) - 영어 표현 및 AI 콘텐츠 테이블';
