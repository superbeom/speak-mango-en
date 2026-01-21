-- [011] Migrate Dialogue Data
-- Description: 기존 content 내부의 dialogue 데이터를 최상위 dialogue 컬럼으로 마이그레이션하고,
--              content 내부에서는 dialogue를 제거합니다.
-- Created at: 2026-01-11

WITH data AS (
    SELECT
        id,
        content
    FROM speak_mango_en.expressions
    WHERE content IS NOT NULL
      AND content->'ko'->'dialogue' IS NOT NULL -- 한국어 데이터 기반으로 구조 잡음
),
migrated_dialogue AS (
    SELECT
        id,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'role', elem->>'role',
                    'en', elem->>'en',
                    'audio_url', elem->>'audio_url',
                    'translations', jsonb_strip_nulls(jsonb_build_object(
                        'ko', elem->>'translation',
                        'ja', (content->'ja'->'dialogue'->(ord - 1)::int)->>'translation',
                        'es', (content->'es'->'dialogue'->(ord - 1)::int)->>'translation'
                    ))
                )
            )
            FROM jsonb_array_elements(content->'ko'->'dialogue') WITH ORDINALITY AS t(elem, ord)
        ) as new_dialogue
    FROM data
)
UPDATE speak_mango_en.expressions e
SET
    dialogue = md.new_dialogue,
    content = (
        SELECT jsonb_object_agg(
            key,
            CASE
                WHEN jsonb_typeof(value) = 'object' THEN value - 'dialogue'
                ELSE value
            END
        )
        FROM jsonb_each(e.content)
    )
FROM migrated_dialogue md
WHERE e.id = md.id
  AND (e.dialogue IS NULL OR jsonb_array_length(e.dialogue) = 0); -- 이미 마이그레이션 된 데이터 보호
