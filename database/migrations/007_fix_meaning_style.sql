-- [007] Fix Meaning Style (Remove periods & Polite to Casual)
-- Description: meaning 컬럼의 문장 끝 마침표(.)를 제거하고, 일부 존댓말(마세요, 이에요 등)을 반말 스타일로 교정합니다.

-- 1. Remove trailing periods from 'ko', 'es' (matches literal dot at end)
UPDATE daily_english.expressions
SET meaning = jsonb_set(meaning, '{ko}', to_jsonb(REGEXP_REPLACE(meaning->>'ko', '\.\s*$', '')))
WHERE meaning->>'ko' ~ '\.\s*$';

UPDATE daily_english.expressions
SET meaning = jsonb_set(meaning, '{es}', to_jsonb(REGEXP_REPLACE(meaning->>'es', '\.\s*$', '')))
WHERE meaning->>'es' ~ '\.\s*$';

-- 2. Remove trailing periods from 'ja' (matches dot '.' or Japanese period '。' at end)
UPDATE daily_english.expressions
SET meaning = jsonb_set(meaning, '{ja}', to_jsonb(REGEXP_REPLACE(meaning->>'ja', '[.。]\s*$', '')))
WHERE meaning->>'ja' ~ '[.。]\s*$';

-- 3. Specific Tone Fixes (Polite -> Casual)

-- Case 1: "Don't take it personally"
-- Existing: "너무 마음에 담아두지 마세요. · 개인적으로 받아들이지 마세요."
-- Target:   "너무 마음에 담아두지 마 · 개인적으로 받아들이지 마"
UPDATE daily_english.expressions
SET meaning = jsonb_set(
    jsonb_set(meaning, '{ko}', '"너무 마음에 담아두지 마 · 개인적으로 받아들이지 마"'),
    '{ja}', '"気にしないで · 個人的に受け取らないで"'
)
WHERE meaning->>'ko' LIKE '%받아들이지 마세요%';

-- Case 2: "For real / Seriously"
-- Existing: "진심이에요 · 거짓말 아니에요"
-- Target:   "진심이야 · 거짓말 아니야"
UPDATE daily_english.expressions
SET meaning = jsonb_set(
    jsonb_set(meaning, '{ko}', '"진심이야 · 거짓말 아니야"'),
    '{ja}', '"マジだよ · 嘘じゃないよ"'
)
WHERE meaning->>'ko' LIKE '%거짓말 아니에요%';

-- Case 3: "What a bargain"
-- Existing: "완전 득템이에요! · 거저나 다름없어요!"
-- Target:   "완전 득템이야! · 거저나 다름없어!"
UPDATE daily_english.expressions
SET meaning = jsonb_set(
    jsonb_set(meaning, '{ko}', '"완전 득템이야! · 거저나 다름없어!"'),
    '{ja}', '"めちゃくちゃお得！ · 掘り出し物だね！"'
)
WHERE meaning->>'ko' LIKE '%거저나 다름없어요%';
