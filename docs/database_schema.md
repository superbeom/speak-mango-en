# Database Schema Documentation

이 문서는 프로젝트에서 사용하는 데이터베이스 스키마와 테이블의 상세 명세를 관리합니다.
모든 SQL 변경 사항은 `database/` 폴더의 마이그레이션 파일뿐만 아니라, 이 문서에도 반영되어야 합니다.

## Schema: `daily_english`

**Description**: Daily English 프로젝트 전용 격리 스키마. 다른 프로젝트와 DB를 공유하기 위해 데이터를 분리합니다.

### Tables

#### 1. `expressions`

영어 표현과 예문을 저장하는 핵심 테이블입니다.

| Column Name    | Type        | Key | Default             | Description                             |
| -------------- | ----------- | --- | ------------------- | --------------------------------------- |
| `id`           | UUID        | PK  | `gen_random_uuid()` | 표현 고유 식별자                        |
| `created_at`   | TIMESTAMPTZ |     | `now()`             | 데이터 생성 일시                        |
| `published_at` | TIMESTAMPTZ |     | `now()`             | 표현이 게시된 일시 (정렬 기준)          |
| `expression`   | TEXT        |     | -                   | 영어 표현 (예: "Break a leg")           |
| `meaning`      | TEXT        |     | -                   | 한국어 뜻                               |
| `content`      | JSONB       |     | `'{}'::jsonb`       | 상세 콘텐츠 (상황, 대화문, 팁, 퀴즈 등) |
| `tags`         | TEXT[]      |     | `NULL`              | 태그 배열 (예: business, daily)         |

**Indexes**:

- `idx_expressions_published_at`: 최신순 정렬 조회 성능 최적화.
- `idx_expressions_tags`: 태그별 필터링 성능 최적화 (GIN).
- `idx_expressions_content`: JSONB 내부 데이터 검색 최적화 (GIN).

### Content JSONB Structure

`content` 컬럼의 JSON 구조 예시입니다.

```json
{
  "situation": "이 표현이 쓰이는 구체적인 상황이나 감정을 아주 친근하고 재미있게 묘사해주세요",
  "dialogue": [
    { "en": "영어 대화문 A", "kr": "A 해석" },
    { "en": "영어 대화문 B", "kr": "B 해석" }
  ],
  "tip": "뉘앙스 차이, 주의할 점, 또는 유사 표현을 꿀팁처럼 알려주세요",
  "quiz": { "question": "간단하고 재미있는 퀴즈 문제", "answer": "정답" }
}
```
