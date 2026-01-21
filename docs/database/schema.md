# Database Schema Documentation

이 문서는 프로젝트에서 사용하는 데이터베이스 스키마와 테이블의 상세 명세를 관리합니다.
모든 SQL 변경 사항은 `database/migrations` 및 `database/functions` 폴더의 SQL 파일뿐만 아니라, 이 문서에도 반영되어야 합니다.

## Schema: `speak_mango_en`

**Description**: Speak Mango 프로젝트 전용 격리 스키마. 다른 프로젝트와 DB를 공유하기 위해 데이터를 분리합니다.

### Tables

#### 1. `expressions`

영어 표현과 예문을 저장하는 핵심 테이블입니다.

| Column Name    | Type        | Key | Default              | Description                                 |
| -------------- | ----------- | --- | -------------------- | ------------------------------------------- |
| `id`           | UUID        | PK  | `gen_random_uuid()`  | 표현 고유 식별자                            |
| `created_at`   | TIMESTAMPTZ |     | `now()`              | 데이터 생성 일시                            |
| `published_at` | TIMESTAMPTZ |     | `now()`              | 표현이 게시된 일시 (정렬 기준)              |
| `domain`       | TEXT        |     | 'conversation'       | 대분류 (예: conversation, test, voca)       |
| `category`     | TEXT        |     | 'daily'              | 소분류 (예: business, travel, shopping)     |
| `expression`   | TEXT        | UK  | -                    | 영어 표현 (예: "Break a leg")               |
| `meaning`      | JSONB       |     | -                    | 다국어 뜻 (예: `{"ko": "..."}`)             |
| `content`      | JSONB       |     | `'{}'::jsonb`        | 다국어 상세 콘텐츠 (예: `{"ko": {...}}`)    |
| `dialogue`     | JSONB       |     | `'[]'::jsonb`        | 다국어 대화문 및 오디오 (예: `[{...}]`)     |
| `tags`         | TEXT[]      |     | `NULL`               | 태그 배열 (예: business, daily)             |
| `meaning_text` | TEXT        |     | `GENERATED(meaning)` | 검색 최적화를 위한 meaning의 TEXT 변환 컬럼 |

### Index Strategy & Configuration

데이터베이스 성능 최적화를 위해 컬럼의 특성에 맞춰 **B-Tree**와 **GIN** 인덱스를 전략적으로 사용합니다.

#### Index Types

- **B-Tree (Balanced Tree)**:
  - **용도**: 정확한 값 일치(`=`)나 범위 검색(`>`, `<`), 정렬(`ORDER BY`)에 사용.
  - **적용**: `id`, `published_at`, `domain`, `category` 등 스칼라 값.
- **GIN (Generalized Inverted Index)**:
  - **용도**: JSONB 내부의 포함 여부(`@>`)나 배열 요소 검색에 특화.
  - **적용**: `content`, `dialogue`, `tags`, `meaning` 등 복합 데이터 구조.
- **Trigram (GIN with pg_trgm)**:
  - **용도**: 부분 문자열 검색(`LIKE`, `ILIKE`)을 빠르게 처리. 문자열을 3글자씩 나눈 조각으로 인덱싱.
  - **적용**: `expression` 필드의 `%검색어%` 패턴 검색.
  - **특징**: 오타 허용 검색, 유사도 검색, 자동완성에도 활용 가능.

#### Current Indexes

| Index Name                          | Type          | Target              | Description                         |
| :---------------------------------- | :------------ | :------------------ | :---------------------------------- |
| `expressions_pkey`                  | B-Tree        | `id`                | Primary Key (Unique)                |
| `idx_expressions_published_at`      | B-Tree        | `published_at DESC` | 최신순 정렬 및 조회                 |
| `idx_expressions_domain`            | B-Tree        | `domain`            | 대분류 필터링                       |
| `idx_expressions_category`          | B-Tree        | `category`          | 소분류 필터링                       |
| `idx_expressions_tags`              | GIN           | `tags`              | 태그 기반 검색                      |
| `idx_expressions_content`           | GIN           | `content`           | 상세 콘텐츠(Jsonb) 내부 검색        |
| `idx_expressions_dialogue`          | GIN           | `dialogue`          | 대화문(Jsonb) 내부 텍스트/화자 검색 |
| `idx_expressions_meaning_gin`       | GIN           | `meaning`           | 다국어 뜻(JSONB) 검색 (9개 언어)    |
| `idx_expressions_expression_trgm`   | GIN (Trigram) | `expression`        | 부분 문자열 검색 최적화             |
| `idx_expressions_meaning_text_trgm` | GIN (Trigram) | `meaning_text`      | 뜻(Meaning) 전체 텍스트 검색 최적화 |
| `unique_expression`                 | B-Tree        | `expression`        | 표현 중복 방지 (Unique Constraint)  |

#### Future Recommendations

- **Full Text Search (FTS)**: 추후 영어 표현(`expression`)이나 의미(`meaning`)에 대한 자연어 검색이 필요해지면 `tsvector` 기반의 GIN 인덱스 추가 고려.

### Database Functions (RPC)

서버 사이드 로직 수행 및 성능 최적화를 위해 Stored Procedure (RPC)를 사용합니다.

#### 1. `get_random_expressions`

- **Description**: `expressions` 테이블에서 무작위로 지정된 개수만큼의 행을 효율적으로 반환합니다.
- **Usage**: Random Quiz 기능에서 사용됩니다. 클라이언트에서 전체 ID를 조회하는 비효율을 방지합니다.
- **Parameters**:
  - `limit_cnt` (int): 반환할 행의 최대 개수.
- **Returns**: `setof speak_mango_en.expressions`
- **SQL Definition**:
  ```sql
  create or replace function speak_mango_en.get_random_expressions(limit_cnt int)
  returns setof speak_mango_en.expressions
  language sql
  as $$
    select * from speak_mango_en.expressions
    order by random()
    limit limit_cnt;
  $$;
  ```

### Dual-Category System

다양한 학습 요구에 대응하기 위해 2단계 분류 체계를 사용합니다.

1. **Domain (대분류)**: 콘텐츠의 큰 성격 (`conversation`, `test`, `vocabulary` 등)
2. **Category (소분류)**: 구체적인 상황이나 주제 (`travel`, `business`, `shopping`, `toeic` 등)

### JSONB Structures

#### 1. Content (i18n)

`content` 컬럼은 언어 코드를 최상위 키로 갖는 구조입니다. 각 언어별 학습 콘텐츠(상황, 팁, 퀴즈)를 포함합니다.

```json
{
  "ko": {
    "situation": "이 표현이 쓰이는 구체적인 상황이나 감정을 아주 친근하고 재미있게 묘사해주세요",
    "tip": "뉘앙스 차이, 주의할 점, 또는 유사 표현을 꿀팁처럼 알려주세요",
    "quiz": { "question": "간단하고 재미있는 퀴즈 문제", "answer": "정답" }
  }
}
```

#### 2. Dialogue (i18n)

`dialogue` 컬럼은 최상위 레벨에 위치하며, 대화의 흐름(순서)을 보장하는 배열 구조입니다. 영어 원문과 오디오는 공통으로 관리하고, 번역만 `translations` 객체에 분리, 저장하여 다국어 확장을 용이하게 합니다. 또한 음성 지원을 위해 `audio_url` 필드를 포함하며, 여기에는 **스토리지 내부 상대 경로**를 저장합니다.

```json
[
  {
    "role": "A",
    "en": "How are you?",
    "audio_url": "expressions/{uuid}/0.wav",
    "translations": {
      "ko": "잘 지내?",
      "ja": "元気？",
      "fr": "Comment allez-vous ?",
      "de": "Wie geht es Ihnen?",
      "ru": "Как дела?",
      "zh": "你好吗？",
      "ar": "كيف حالك؟"
    }
  },
  {
    "role": "B",
    "en": "I'm fine, thank you.",
    "audio_url": "expressions/{uuid}/1.wav",
    "translations": {
      "ko": "잘 지내고 있어.",
      "ja": "元気だよ。",
      "fr": "Je vais bien, merci.",
      "de": "Mir geht es gut, danke.",
      "ru": "Я в порядке, спасибо.",
      "zh": "我很好，谢谢。",
      "ar": "أنا بخير شكرا لك."
    }
  },
  { ... }
]
```
