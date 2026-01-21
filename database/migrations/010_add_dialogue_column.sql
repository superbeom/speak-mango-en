-- [010] Add Dialogue Column
-- Description: dialogue 데이터를 content에서 분리하여 최상위 컬럼으로 이동합니다.
--              중복 데이터를 제거하고 오디오/영어 원문 관리를 효율화하기 위함입니다.
-- Created at: 2026-01-11

-- 1. Add 'dialogue' column
ALTER TABLE speak_mango_en.expressions
ADD COLUMN dialogue jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN speak_mango_en.expressions.dialogue IS '대화문 원문 및 오디오 (예: [{"role": "A", "en": "...", "audio_url": "...", "translations": {"ko": "..."}}])';
