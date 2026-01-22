-- [012] Add Index for Dialogue
-- Description: dialogue 컬럼에 GIN 인덱스를 추가하여 대화문 내용 검색 성능을 최적화합니다.
-- Created at: 2026-01-11

CREATE INDEX idx_expressions_dialogue ON speak_mango_en.expressions USING gin (dialogue);

COMMENT ON INDEX speak_mango_en.idx_expressions_dialogue IS '대화문(JSONB) 내부 검색을 위한 GIN 인덱스';
