# Database Schema Documentation

이 문서는 프로젝트에서 사용하는 데이터베이스 스키마와 테이블의 상세 명세를 관리합니다.
모든 SQL 변경 사항은 `database/migrations`, `database/functions`, `database/triggers` 폴더의 SQL 파일뿐만 아니라, 이 문서에도 반영되어야 합니다.

## Schema: `speak_mango_en`

**Description**: Speak Mango 프로젝트 전용 격리 스키마. 다른 프로젝트와 DB를 공유하기 위해 데이터를 분리합니다.

> [!NOTE]
> **NextAuth 연동**:
> 이 스키마는 **Snake Case** 표준을 따릅니다.
> NextAuth와의 연동은 `speak_mango_en_next_auth` 스키마의 **View**를 통해 이루어집니다.
> 따라서 애플리케이션 코드는 `speak_mango_en_next_auth` 스키마를 통해 CamelCase로 접근하지만, 실제 데이터는 이곳에 Snake Case로 저장됩니다.

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

#### 2. `users`

사용자 프로필 및 구독 상태를 관리하는 테이블입니다 (NextAuth 호환).

| Column Name             | Type        | Key | Default             | Description                                 |
| ----------------------- | ----------- | --- | ------------------- | ------------------------------------------- |
| `id`                    | UUID        | PK  | `gen_random_uuid()` | 사용자 고유 식별자                          |
| `name`                  | TEXT        |     | -                   | 이름/닉네임                                 |
| `email`                 | TEXT        | UK  | -                   | 이메일 주소                                 |
| `email_verified`        | TIMESTAMPTZ |     | -                   | 이메일 인증 일시                            |
| `image`                 | TEXT        |     | -                   | 프로필 이미지 URL                           |
| `tier`                  | `user_tier` |     | 'free'              | 사용자 등급 ('free', 'pro')                 |
| `subscription_end_date` | TIMESTAMPTZ |     | -                   | 구독 만료 일시                              |
| `trial_usage_count`     | INT         |     | 0                   | 무료 기능 체험 횟수                         |
| `created_at`            | TIMESTAMPTZ |     | `now()`             | 계정 생성 일시                              |
| `updated_at`            | TIMESTAMPTZ |     | `now()`             | 계정 정보 최종 수정 일시 (Trigger 자동갱신) |

#### 3. `accounts`

NextAuth의 OAuth 계정 연결 정보를 저장하는 테이블입니다.

| Column Name           | Type   | Key  | Default             | Description            |
| --------------------- | ------ | ---- | ------------------- | ---------------------- |
| `id`                  | UUID   | PK   | `gen_random_uuid()` | 고유 식별자            |
| `user_id`             | UUID   | FK   | -                   | `users.id` 참조        |
| `type`                | TEXT   |      | -                   | 계정 타입 (예: oauth)  |
| `provider`            | TEXT   | UK\* | -                   | 제공자 (예: google)    |
| `provider_account_id` | TEXT   | UK\* | -                   | 제공자 할당 ID         |
| `refresh_token`       | TEXT   |      | -                   | OAuth 갱신 토큰        |
| `access_token`        | TEXT   |      | -                   | OAuth 액세스 토큰      |
| `expires_at`          | BIGINT |      | -                   | 액세스 토큰 만료 시간  |
| `token_type`          | TEXT   |      | -                   | 토큰 타입 (예: bearer) |
| `scope`               | TEXT   |      | -                   | 권한 범위              |
| `id_token`            | TEXT   |      | -                   | OIDC ID 토큰           |
| `session_state`       | TEXT   |      | -                   | 세션 상태              |

#### 4. `sessions`

NextAuth의 데이터베이스 세션(Refresh Token)을 관리하는 테이블입니다.

| Column Name     | Type        | Key | Default             | Description                |
| --------------- | ----------- | --- | ------------------- | -------------------------- |
| `id`            | UUID        | PK  | `gen_random_uuid()` | 고유 식별자                |
| `session_token` | TEXT        | UK  | -                   | 세션 토큰 (식별자)         |
| `user_id`       | UUID        | FK  | -                   | `users.id` 참조            |
| `expires`       | TIMESTAMPTZ |     | -                   | 세션 만료 일시 (기본 30일) |

#### 5. `user_actions`

표현에 대한 사용자의 상호작용(좋아요, 저장, 학습 등)을 저장하는 테이블입니다.

| Column Name     | Type          | Key  | Default             | Description                 |
| --------------- | ------------- | ---- | ------------------- | --------------------------- |
| `id`            | UUID          | PK   | `gen_random_uuid()` | 고유 식별자                 |
| `user_id`       | UUID          | FK\* | -                   | `users.id` 참조             |
| `expression_id` | UUID          | FK\* | -                   | `expressions.id` 참조       |
| `action_type`   | `action_type` | UK\* | -                   | 액션 종류 ('save', 'learn') |
| `created_at`    | TIMESTAMPTZ   |      | `now()`             | 액션 발생 일시              |

#### 6. `vocabulary_lists`

사용자가 생성한 단어장(폴더)을 관리하는 테이블입니다.

| Column Name  | Type        | Key | Default             | Description                 |
| ------------ | ----------- | --- | ------------------- | --------------------------- |
| `id`         | UUID        | PK  | `gen_random_uuid()` | 단어장 고유 식별자          |
| `user_id`    | UUID        | FK  | -                   | `users.id` 참조 (소유자)    |
| `title`      | TEXT        |     | -                   | 단어장 이름                 |
| `created_at` | TIMESTAMPTZ |     | `now()`             | 생성 일시                   |
| `updated_at` | TIMESTAMPTZ |     | `now()`             | 수정 일시                   |
| `is_default` | BOOLEAN     |     | `false`             | 기본 단어장 여부 (One-True) |

> **Trigger**: `set_vocabulary_list_first_default` - 사용자가 첫 단어장을 생성하면 자동으로 `is_default`를 `true`로 설정합니다.
> **Constraint**: 사용자당 하나의 `is_default=true` 리스트만 존재하도록 관리합니다(Application Level / Partial Index).

#### 7. `vocabulary_items`

단어장과 표현 간의 다대다(M:N) 관계를 관리하는 매핑 테이블입니다.

| Column Name      | Type        | Key    | Default | Description                       |
| ---------------- | ----------- | ------ | ------- | --------------------------------- |
| `list_id`        | UUID        | PK, FK | -       | `vocabulary_lists.id` 참조        |
| `expression_id`  | UUID        | PK, FK | -       | `expressions.id` 참조 (공식 표현) |
| `custom_card_id` | UUID        | FK     | -       | (To Be) 커스텀 단어 ID            |
| `created_at`     | TIMESTAMPTZ |        | `now()` | 단어장에 추가된 일시              |

> **Constraint**: `chk_vocabulary_item_content` - `expression_id`와 `custom_card_id` 중 하나만 값을 가져야 합니다. (지금은 custom_card 미구현으로 expression_id 필수)

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

##### Table: `expressions`

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

##### Table: `users` & Auth

| Index Name                   | Type   | Target          | Description                |
| :--------------------------- | :----- | :-------------- | :------------------------- |
| `idx_users_email`            | B-Tree | `email`         | 사용자 이메일 조회 최적화  |
| `idx_accounts_user_id`       | B-Tree | `user_id`       | 사용자별 계정 연동 조회    |
| `idx_sessions_user_id`       | B-Tree | `user_id`       | 사용자별 세션 조회         |
| `idx_sessions_session_token` | B-Tree | `session_token` | 세션 토큰 조회 (인증 처리) |

##### Table: `user_actions`

| Index Name                       | Type   | Target                 | Description                  |
| :------------------------------- | :----- | :--------------------- | :--------------------------- |
| `idx_user_actions_user_id`       | B-Tree | `user_id`              | 사용자별 액션 조회           |
| `idx_user_actions_expression_id` | B-Tree | `expression_id`        | 표현별 액션 통계 조회        |
| `idx_user_actions_composite`     | B-Tree | `user_id, action_type` | 사용자별 특정 액션 목록 조회 |

##### Table: `vocabulary_lists`

| Index Name                          | Type             | Target                       | Description                      |
| :---------------------------------- | :--------------- | :--------------------------- | :------------------------------- |
| `idx_vocabulary_lists_user_id`      | B-Tree           | `user_id`                    | 사용자별 단어장 조회             |
| `idx_vocabulary_lists_user_created` | B-Tree           | `user_id, created_at DESC`   | 사용자별 단어장 최신순 정렬      |
| `idx_vocabulary_lists_user_default` | Special (Unique) | `user_id` where `is_default` | 사용자당 기본 단어장 유일성 보장 |

##### Table: `vocabulary_items`

| Index Name                           | Type   | Target                     | Description                            |
| :----------------------------------- | :----- | :------------------------- | :------------------------------------- |
| `idx_vocabulary_items_expression_id` | B-Tree | `expression_id`            | 표현이 포함된 단어장 조회 (Saved 여부) |
| `idx_vocabulary_items_list_created`  | B-Tree | `list_id, created_at DESC` | 단어장 내 아이템 최신순 정렬           |

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
- **SQL Definition**: [`database/functions/get_random_expressions.sql`](../../database/functions/get_random_expressions.sql) 참조.

#### 2. `toggle_user_action`

- **Description**: 사용자 액션(좋아요/저장/학습)을 원자적(Atomic)으로 토글합니다. 존재하면 삭제하고, 없으면 생성합니다.
- **Usage**: 클라이언트에서 더블 클릭 등으로 인한 Race Condition을 방지하고 네트워크 요청을 최적화(1 RTT)하기 위해 사용합니다.
- **Parameters**:
  - `p_expression_id` (uuid): 대상 표현 ID.
  - `p_action_type` (text): 액션 타입 ('save', 'learn').
- **Returns**: `void`
- **SQL Definition**: [`database/functions/toggle_user_action.sql`](../../database/functions/toggle_user_action.sql) 참조.

#### 3. `get_vocabulary_lists_with_counts`

- **Description**: 사용자(인증됨)의 모든 단어장 목록을 조회하며, 각 단어장에 포함된 아이템 개수(`item_count`)와 기본 여부(`is_default`)를 반환합니다.
- **Usage**: 단어장 목록 페이지 및 저장 모달에서 사용.
- **Parameters**: None (Uses `auth.uid()`)
- **Returns**: `Table (id uuid, title text, item_count bigint, is_default boolean)`
- **SQL Definition**: [`database/functions/get_vocabulary_lists_with_counts.sql`](../../database/functions/get_vocabulary_lists_with_counts.sql) 참조.

#### 4. `set_default_vocabulary_list`

- **Description**: 특정 단어장을 기본(Default) 단어장으로 설정합니다. 기존의 기본 단어장은 자동으로 해제됩니다 (Transactional).
- **Usage**: 단어장 목록에서 Long Press 등으로 기본 단어장을 변경할 때 사용.
- **Parameters**:
  - `p_list_id` (uuid): 대상 단어장 ID.
- **Returns**: `void`
- **SQL Definition**: [`database/functions/set_default_vocabulary_list.sql`](../../database/functions/set_default_vocabulary_list.sql) 참조.

#### 5. `get_vocabulary_list_details`

- **Description**: 특정 단어장의 상세 정보와 포함된 모든 표현(Expression) 데이터를 하나의 JSON 객체로 조회합니다. 소유권 체크(`auth.uid()`)가 내장되어 있습니다.
- **Usage**: 단어장 상세 페이지에서 사용.
- **Parameters**:
  - `p_list_id` (uuid): 조회할 단어장 ID.
- **Returns**: `json` (단어장 정보 및 items 배열 포함)
- **SQL Definition**: [`database/functions/get_vocabulary_list_details.sql`](../../database/functions/get_vocabulary_list_details.sql) 참조.

#### 6. `get_user_tier`

- **Description**: 특정 사용자의 `tier`와 `subscription_end_date`를 조회합니다. `SECURITY DEFINER` 옵션을 사용하여 RLS 정책이나 스키마 권한 제약을 우회하고 안전하게 데이터를 가져옵니다.
- **Usage**: NextAuth Adapter에서 세션 생성 시 최신 User 정보를 보강하기 위해 사용합니다. (Cross-Schema Access)
- **Parameters**:
  - `p_user_id` (uuid): 대상 사용자 ID.
- **Returns**: `Table (tier user_tier, subscription_end_date timestamptz)`
- **SQL Definition**: [`database/functions/get_user_tier.sql`](../../database/functions/get_user_tier.sql) 참조.

#### 7. `move_vocabulary_items`

- **Description**: 원본 단어장에서 표현들을 제거하고 대상 단어장에 추가하는 이동 작업을 원자적(Atomic)으로 수행합니다.
- **Usage**: 단어장 간 표현 이동(`moveExpressionsToVocabularyList`) 시 사용.
- **Parameters**:
  - `p_source_list_id` (uuid): 원본 단어장 ID.
  - `p_target_list_id` (uuid): 대상 단어장 ID.
  - `p_expression_ids` (uuid[]): 이동할 표현 ID 배열.
- **Returns**: `void`
- **SQL Definition**: [`database/functions/move_vocabulary_items.sql`](../../database/functions/move_vocabulary_items.sql) 참조.

### Database Triggers

트리거는 데이터 변경 시 자동으로 실행되는 로직을 정의합니다.

#### 1. Trigger Functions

| Function Name                      | Returns   | Description                                                 |
| ---------------------------------- | --------- | ----------------------------------------------------------- |
| `update_updated_at_column()`       | `TRIGGER` | 레코드 수정 시 `updated_at` 컬럼을 현재 시간으로 갱신       |
| `handle_vocabulary_list_deleted()` | `TRIGGER` | 기본 단어장 삭제 시 가장 오래된 다른 단어장으로 기본값 이관 |

**SQL Definition**:

```sql
create or replace function speak_mango_en.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;
```

#### 2. Triggers

| Trigger Name                        | Table              | Event           | Description                                                                                                                                             |
| ----------------------------------- | ------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `update_users_updated_at`           | `users`            | `BEFORE UPDATE` | 사용자 정보 변경 시 `updated_at` 필드 갱신                                                                                                              |
| `update_vocab_updated_at`           | `vocabulary_lists` | `BEFORE UPDATE` | 단어장 수정 시 `updated_at` 필드 갱신                                                                                                                   |
| `set_vocabulary_list_first_default` | `vocabulary_lists` | `AFTER INSERT`  | 첫 단어장 생성 시 `is_default=true` 설정 <br> (SQL: [`on_vocabulary_list_created.sql`](../../database/functions/on_vocabulary_list_created.sql))        |
| `on_vocabulary_list_deleted`        | `vocabulary_lists` | `AFTER DELETE`  | 기본 단어장 삭제 시 자동 이관 로직 수행 <br> (SQL: [`handle_vocabulary_list_deleted.sql`](../../database/functions/handle_vocabulary_list_deleted.sql)) |

### Custom Enums

프로젝트 도메인에 특화된 사용자 정의 타입입니다.

#### 1. `user_tier`

사용자의 서비스 이용 등급을 구분합니다.

- `free`: 기본 사용자 (LocalStorage 저장, 기능 제한)
- `pro`: 유료 구독 사용자 (DB 저장, 모든 기능 개방)

#### 2. `action_type`

사용자가 표현에 대해 수행하는 상호작용의 종류를 정의합니다.

- `save`: 저장/북마크 (나중에 공부하기)
- `learn`: 학습 완료 표시

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
