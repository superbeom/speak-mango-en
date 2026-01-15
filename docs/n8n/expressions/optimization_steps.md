# n8n Optimization Guide: AI-Driven Generation & TTS Integration

이 문서는 외부 블로그 스크래핑 방식에서 벗어나, **AI가 스스로 카테고리별 유용한 표현을 선정하고 생성하며, 원어민 음성(TTS)까지 자동으로 합성하는 방식**으로 전환하는 가이드입니다. 이 구조는 외부 의존성을 제거하여 워크플로우의 안정성을 극대화하고 학습 경험을 고도화합니다.

## 🏗️ 목표 구조 (Target Architecture)

1.  **Schedule Trigger** (매일 9시 실행)
2.  **Pick Category** (카테고리 랜덤 선택 - Business, Travel, Native Slang 등)
3.  **Get Existing Expressions (Supabase)** (선택된 카테고리의 기존 표현 조회)
4.  **Gemini Expression Generator** (기존 표현을 제외하고 새로운 표현 1개 생성)
5.  **Parse Expression JSON** (Gemini 응답을 순수 JSON 객체로 변환)
6.  **Check Duplicate (Supabase)** (DB 중복 확인 - 안전장치)
7.  **If New** (중복 여부 판단)
8.  **Gemini Content Generator** (상세 콘텐츠 생성 - Role A/B 포함)
9.  **Parse Content JSON** (Gemini 응답을 순수 JSON 객체로 변환)
10. **Validate Content (Code)** (Gemini 응답 데이터 무결성 검증)
11. **Generate ID (Code)** (저장 경로용 UUID 미리 생성)
12. **Prepare TTS Requests (Code)** (대화문 분리 및 목소리 할당)
13. **Groq Orpheus TTS (HTTP)** (음성 합성 호출)
14. **Upload to Storage (Supabase)** (오디오 파일 업로드)
15. **Aggregate TTS Results (Code)** (오디오 경로를 데이터에 병합)
16. **Supabase Insert** (데이터 저장)

---

## 🛠️ 단계별 설정 가이드 (Step-by-Step)

### 1단계: Schedule Trigger 설정

워크플로우의 시작점입니다. **Schedule Trigger** 노드를 추가합니다.

- **Trigger Interval**: `Custom (Cron)`
- **Expression**: `0 9 * * *`

### 2단계: Pick Category

1.  **Code** 노드를 추가하고 이름을 `Pick Category`로 설정합니다.
2.  다음 코드를 입력하여 실행 때마다 카테고리를 랜덤하게 하나 뽑도록 합니다.

    - **주의**: 여기서 사용하는 `category` 값은 웹 앱의 `lib/constants.ts`에 정의된 `CATEGORIES`와 일치해야 필터링이 정상적으로 작동합니다.

    - **Domain**: 대분류 (conversation, test, vocabulary 등)
    - **Category**: 소분류 (daily, business, travel, shopping 등)
    - **Topic**: AI 프롬프트에 전달할 구체적인 주제 설명

    ```javascript
    // 주제 목록 정의 (대분류/소분류 체계 적용)
    const topics = [
      {
        domain: "conversation",
        category: "daily",
        topic: "미국 원어민이 매일 쓰는 생활 영어 표현",
      },
      {
        domain: "conversation",
        category: "business",
        topic: "비즈니스 미팅이나 이메일에서 꼭 필요한 정중한 영어 표현",
      },
      {
        domain: "conversation",
        category: "travel",
        topic: "해외 여행할 때 유용한 필수 영어 표현",
      },
      {
        domain: "conversation",
        category: "shopping",
        topic: "해외 직구 쇼핑이나 매장에서 사용하는 쇼핑 관련 영어 표현",
      },
      {
        domain: "conversation",
        category: "emotion",
        topic: "기쁨, 슬픔, 화남 등 감정을 섬세하게 표현하는 영어 단어",
      },
      {
        domain: "conversation",
        category: "slang",
        topic: "미드나 영화에 자주 나오는 최신 트렌디한 슬랭",
      },
    ];

    // 랜덤 선택
    const selected = topics[Math.floor(Math.random() * topics.length)];

    return {
      json: {
        domain: selected.domain,
        category: selected.category,
        topic: selected.topic, // AI 프롬프트용
      },
    };
    ```

### 3단계: Get Existing Expressions (중복 방지용 조회)

`Pick Category` 뒤에 **Supabase** 노드를 추가하여, 해당 카테고리에 이미 존재하는 표현들을 미리 가져옵니다. 이를 AI에게 전달하여 중복 생성을 원천 차단합니다.

- **Name**: `Get Existing Expressions`
- **Schema**: `speak_mango_en`
- **Operation**: `Get Many`
- **Table Name or ID**: `expressions`
- **Return All**: `True`
- **Filters**:
  - **Filter**: `Build Manually`
  - **Must Match**: `All Filters`
  - **Field Name or ID**: `category - (string)`
  - **Condition**: `Equal`
  - **Field Value**: `{{ $('Pick Category').item.json.category }}`

### 4단계: Gemini Expression Generator (표현 생성)

`Get Existing Expressions` 노드 뒤에 **Google Gemini Chat Model** 노드를 연결합니다.

- **Name**: `Gemini Expression Generator`
- **Settings**: `Execute Once` 토글을 **On**으로 켜주세요. (매우 중요! 입력 데이터가 여러 개라도 AI는 한 번만 실행되어야 합니다.)
- **Prompt**: `n8n/expressions/code/04_gemini_expression_generator_prompt.txt`의 내용을 사용합니다.

  > **💡 팁**: 프롬프트 내의 `# EXCLUDED EXPRESSIONS` 아래의 `{{ ... }}` 코드는 n8n의 Expression 기능입니다. 별도의 Code Node 없이도, 이전 노드(`Get Existing Expressions`)에서 가져온 수많은 데이터 중 `expression` 필드만 추출하여 쉼표로 연결된 문자열로 변환해 줍니다. Gemini에게는 제외해야 할 표현 목록만 깔끔하게 전달됩니다.

### 5단계: Parse Expression JSON

Gemini가 생성한 표현 데이터가 문자열 형태(Markdown Code Block 등)로 반환될 수 있으므로, 이를 순수 JSON 객체로 변환하는 과정이 반드시 필요합니다.

`Gemini Expression Generator` 뒤에 **Code** 노드를 추가하고 연결합니다.

- **Name**: `Parse Expression JSON`
- **Code**: `n8n/expressions/code/05_parse_expression_json.js`의 내용을 사용합니다.

### 6단계: Supabase 중복 체크 노드 추가

`Parse Expression JSON` 노드 뒤에 **Supabase** 노드를 추가합니다. (AI가 제외 목록을 무시했을 경우를 대비한 2차 안전장치입니다.)

- **Name**: `Check Duplicate`
- **Schema**: `speak_mango_en`
- **Operation**: `Get Many`
- **Table Name or ID**: `expressions`
- **Return All**: `False`
- **Limit**: `1`
- **Always Output Data**: `On` (중요: 중복된 데이터가 없을 때도 빈 객체를 반환하여 워크플로우가 멈추지 않게 해야 합니다.)
- **Filters**:
  - **Filter**: `Build Manually`
  - **Must Match**: `Any Filter`
  - **Field Name or ID**: `expression - (string)`
  - **Condition**: `ILIKE operator`
  - **Field Value**: `"*{{ $('Parse Expression JSON').item.json.expression }}*"`
  - _(참고: 'Equal' 대신 'Like'를 사용하여 "touch base"가 생성될 때 기존의 "Let's touch base"도 중복으로 감지하도록 함)_

### 7단계: If 노드 추가 (조건 분기)

`Check Duplicate` 뒤에 **If** 노드를 추가합니다.

- **Name**: `If New`
- **Conditions**: `{{ $('Check Duplicate').first().json.expression }}`
- **String**: `is empty`
  - (데이터가 없으면 'is empty'이므로 새로운 표현임)

### 8단계: Gemini Content Generator (상세 내용 생성)

`If New` 노드의 **True** 출력에 새로운 **Google Gemini Chat Model** 노드를 연결합니다.

- **Name**: `Gemini Content Generator`
- **Prompt**: `n8n/expressions/code/08_gemini_content_generator_prompt.txt`의 내용을 사용합니다.

### 9단계: Parse Content JSON

Gemini가 JSON을 문자열(`text`)로 반환할 경우를 대비하여 **Code** 노드를 추가합니다.
`Gemini Content Generator`와 `Supabase Insert` 사이에 연결하세요.

- **Name**: `Parse Content JSON`
- **Code**: `n8n/expressions/code/09_parse_content_json.js`의 내용을 사용합니다.

### 10단계: Validate Content (Code)

Gemini가 생성한 콘텐츠가 모든 엄격한 규칙(언어 혼용 금지, 태그 규칙, 퀴즈 포맷 등)을 준수하는지 검증하는 마지막 관문입니다. 위반 사항 발생 시 워크플로우를 즉시 중단합니다.

- **Name**: `Validate Content`
- **Code**: `n8n/expressions/code/10_validate_content.js`의 내용을 사용합니다.

### 11단계: Generate ID (Code)

저장 경로 및 DB ID로 사용할 UUID를 여기서 생성해야 데이터가 덮어씌워지지 않습니다.

- **Name**: `Generate ID`
- **Code**: `n8n/expressions/code/11_generate_id.js`의 내용을 사용합니다.

### 12단계: Prepare TTS Requests

대화문을 개별 오디오 요청으로 분리합니다.

- **Name**: `Prepare TTS Requests`
- **Code**: `n8n/expressions/code/12_prepare_tts_requests.js`의 내용을 사용합니다.

### 13단계: Groq Orpheus TTS (HTTP Request)

11단계에서 분리된 각 대화 문장을 실제 오디오 파일(WAV)로 변환하는 단계입니다.

- **Name**: `Groq Orpheus TTS`
- **Method**: `POST`
- **URL**: `https://api.groq.com/openai/v1/audio/speech`
- **Authentication**: `Header Auth` 선택
  - **Name**: `Authorization`
  - **Value**: `Bearer <YOUR_GROQ_API_KEY>`
- **Body Content Type**: `JSON`
- **Body Parameters**:
  - `model`: `canopylabs/orpheus-v1-english`
  - `input`: `{{ $json.tts_input }}`
  - `voice`: `{{ $json.tts_voice }}`
  - `response_format`: `wav`
- **Response Format**: `File` (중요: 응답을 바이너리 파일로 받아야 합니다.)

> **⚠️ 중요 (400 Bad Request 에러 발생 시)**: `canopylabs/orpheus-v1-english` 모델을 처음 사용하는 경우, 반드시 **[Groq Console](https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english)**에 접속하여 해당 모델의 이용 약관(Terms)을 **승인(Accept)**해야 합니다. 승인하지 않으면 API 호출 시 에러가 발생합니다.

### 14단계: Upload to Storage (Supabase REST API)

공식 Supabase 노드는 파일 업로드를 지원하지 않으므로, **HTTP Request** 노드를 사용하여 직접 업로드합니다.

- **사전 작업**: Supabase Dashboard > Storage에서 **`speak-mango-en`**라는 이름의 Bucket을 미리 생성해야 합니다. (폴더는 자동으로 생성되므로 Bucket만 있으면 됩니다.)
- **Name**: `Upload to Storage`
- **Method**: `POST`
- **URL**: `https://<YOUR_PROJECT_REF>.supabase.co/storage/v1/object/speak-mango-en/{{ $json.storage_path }}`
  - (참고: `storage_path`에 `expressions/...`가 포함되어 있음)
- **Authentication**: `Generic Credential Type`
- **Generic Auth Type**: `Header Auth`
- **Header Auth**: `Supabase Header Auth`
  - `Name`: `Authorization`
  - `Value`: `Bearer <YOUR_SERVICE_ROLE_KEY>`
- **Send Body**: `Binary`
  - `Body Content Type`: `n8n Binary File`
  - `Input Data Field Name`: `data` (12단계 Groq TTS 노드에서 받은 바이너리 필드명)
- **Options**: `Response`
  - **Response Format**: `JSON`

### 15단계: Aggregate TTS Results (Code)

업로드된 오디오 파일들의 경로(`storage_path`)를 원본 데이터 구조의 각 대화문(`dialogue`) 항목에 다시 주입하고, 하나로 합칩니다.

- **Name**: `Aggregate TTS Results`
- **Code**: `n8n/expressions/code/15_aggregate_tts_results.js`의 내용을 사용합니다.
- **역할**: 분산된 여러 아이템을 다시 1개의 아이템으로 병합하여 최종 저장을 준비합니다.

### 16단계: Supabase Insert 설정

`Parse JSON` 노드 뒤에 **Supabase** 노드를 연결하여 최종 데이터를 저장합니다.

- **Name**: `Supabase Insert`
- **Schema**: `speak_mango_en`
- **Resource**: `Row`
- **Operation**: `Create`
- **Table Name or ID**: `expressions`
- **Data to Send**: `Auto-Map Input Data to Columns`
- **Mapping**: `expression`, `domain`, `category`, `meaning`, `content`, `tags` 등 모든 컬럼이 `Parse JSON`의 출력값과 자동으로 매핑됩니다.

---

## ✅ 완료 확인

1.  **Execute Workflow**를 실행합니다.
2.  `Pick Category`가 랜덤한 주제를 뽑고, Gemini가 그에 맞는 표현을 생성하는지 확인합니다.
3.  이미 DB에 있는 표현이라면 `If New`에서 False로 빠지는지 확인합니다.
4.  **Supabase Storage**에 `speak-mango-en` 버킷 생성 여부 확인.
5.  DB `expressions` 테이블의 `content` 내 `audio_url` 경로 정상 저장 확인.

---

## 🔄 Universal Backfill Strategy (Multi-Language Expansion)

기존 데이터에 새로운 언어(독일어, 프랑스어, 러시아어, 중국어, 아랍어)를 추가하거나, 전체 콘텐츠를 리뉴얼할 때 사용하는 **Universal Backfill System** 가이드입니다.

### 📂 폴더 구조 및 파일 (`n8n/expressions/backfill_universal/`)

1.  **`universal_backfill_workflow.json`**: 백필 전용 통합 워크플로우.
2.  **`universal_backfill_prompt.txt`**: **6개 국어**(`en`, `fr`, `de`, `ru`, `zh`, `ar`)를 생성합니다. (기존 `ko`, `ja`, `es`는 보존됨)
3.  **`supplementary_backfill_prompt.txt`**: 기존 언어(EN)는 유지하고 **추가 언어만** 생성하기 위한 프롬프트.
4.  **`universal_backfill_parse_code.js`**: Universal 모드용 병합 로직 (EN 업데이트 포함).
5.  **`supplementary_backfill_parse_code.js`**: Supplementary 모드용 병합 로직 (EN 보존).

### 🚀 사용 가이드

1.  **영어 및 신규 언어 추가 (Partial Update)**:

    - `universal_backfill_prompt.txt` 내용을 복사하여 Gemini 노드에 설정.
    - **주의**: `en` 및 신규 5개 국어(`fr`, `de`, `ru`, `zh`, `ar`)만 생성되며, 기존의 `ko`, `ja`, `es` 데이터는 보존됩니다.

2.  **새로운 언어만 추가하고 싶은 경우**:

    - `supplementary_backfill_prompt.txt` 내용을 복사하여 Gemini 노드에 설정.
    - **주의**: 영어(`en`) 필드는 생성되지 않으며, `Parse Content JSON` 단계에서 기존 데이터와 병합될 때 기존 영어 데이터가 보존됩니다.

3.  **데이터 병합 로직 (Javascript)**:
    - **Universal**: `universal_backfill_parse_code.js`를 `Parse Content JSON` 노드에 복사하여 사용하세요. (영어 갱신 + 신규 언어 추가)
    - **Supplementary**: `supplementary_backfill_parse_code.js`를 `Parse Content JSON` 노드에 복사하여 사용하세요. (영어 보존 + 신규 언어만 추가)
    - **공통 동작**: `meaning`, `content` 및 `dialogue`의 `translations` 객체를 타겟 언어에 맞춰 지능적으로 병합합니다.
