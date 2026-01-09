# Database Schema Documentation

이 문서는 프로젝트에서 사용하는 데이터베이스 스키마와 테이블의 상세 명세를 관리합니다.
모든 SQL 변경 사항은 `database/` 폴더의 마이그레이션 파일뿐만 아니라, 이 문서에도 반영되어야 합니다.

## Schema: `speak_mango_en`

**Description**: Speak Mango 프로젝트 전용 격리 스키마. 다른 프로젝트와 DB를 공유하기 위해 데이터를 분리합니다.

### Tables

#### 1. `expressions`

영어 표현과 예문을 저장하는 핵심 테이블입니다.

| Column Name    | Type        | Key | Default             | Description                              |
| -------------- | ----------- | --- | ------------------- | ---------------------------------------- |
| `id`           | UUID        | PK  | `gen_random_uuid()` | 표현 고유 식별자                         |
| `created_at`   | TIMESTAMPTZ |     | `now()`             | 데이터 생성 일시                         |
| `published_at` | TIMESTAMPTZ |     | `now()`             | 표현이 게시된 일시 (정렬 기준)           |
| `domain`       | TEXT        |     | 'conversation'      | 대분류 (예: conversation, test, voca)    |
| `category`     | TEXT        |     | 'daily'             | 소분류 (예: business, travel, shopping)  |
| `expression`   | TEXT        |     | -                   | 영어 표현 (예: "Break a leg")            |
| `meaning`      | JSONB       |     | -                   | 다국어 뜻 (예: `{"ko": "..."}`)          |
| `content`      | JSONB       |     | `'{}'::jsonb`       | 다국어 상세 콘텐츠 (예: `{"ko": {...}}`) |
| `tags`         | TEXT[]      |     | `NULL`              | 태그 배열 (예: business, daily)          |

**Indexes**:

- `idx_expressions_published_at`: 최신순 정렬 조회 성능 최적화.
- `idx_expressions_domain`: 대분류별 필터링 성능 최적화.
- `idx_expressions_category`: 소분류별 필터링 성능 최적화.
- `idx_expressions_tags`: 태그별 필터링 성능 최적화 (GIN).
- `idx_expressions_content`: JSONB 내부 데이터 검색 최적화 (GIN).

### Dual-Category System

다양한 학습 요구에 대응하기 위해 2단계 분류 체계를 사용합니다.

1. **Domain (대분류)**: 콘텐츠의 큰 성격 (`conversation`, `test`, `vocabulary` 등)
2. **Category (소분류)**: 구체적인 상황이나 주제 (`travel`, `business`, `shopping`, `toeic` 등)

### Content JSONB Structure (i18n)

`content` 컬럼은 언어 코드를 최상위 키로 갖는 구조입니다.
내부 `dialogue` 배열에서는 `translation`이라는 통일된 키를 사용하여 다국어 확장을 용이하게 합니다. 또한 음성 지원을 위해 `audio_url` 필드를 포함하며, 여기에는 **스토리지 내부 상대 경로**를 저장합니다.

```json
{
  "ko": {
    "situation": "이 표현이 쓰이는 구체적인 상황이나 감정을 아주 친근하고 재미있게 묘사해주세요",
    "dialogue": [
      { 
        "en": "영어 대화문 A", 
        "translation": "한국어 A 해석",
        "audio_url": "expressions/{uuid}/0.wav"
      },
      { 
        "en": "영어 대화문 B", 
        "translation": "한국어 B 해석",
        "audio_url": "expressions/{uuid}/1.wav"
      }
    ],
    "tip": "뉘앙스 차이, 주의할 점, 또는 유사 표현을 꿀팁처럼 알려주세요",
    "quiz": { "question": "간단하고 재미있는 퀴즈 문제", "answer": "정답" }
  }
}
```
