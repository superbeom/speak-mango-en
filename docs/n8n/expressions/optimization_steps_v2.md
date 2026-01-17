# n8n Optimization Guide V2: Single-Shot AI Generation

이 문서는 기존의 2-Step (표현 생성 -> 콘텐츠 생성) 방식을 **단일 Gemini 호출 (Single-Shot)**로 통합하여 최적화한 V2 워크플로우 가이드입니다.

V2는 API 호출 횟수를 절반으로 줄여 속도를 개선하고, 표현과 콘텐츠의 문맥적 일관성을 강화합니다. 또한, 검증 로직을 조기에 수행하여 불필요한 DB 조회를 방지합니다.

## 🏗️ 목표 구조 (Target Architecture V2)

1.  **Schedule Trigger** (매일 실행 또는 수동 실행)
2.  **Pick Category** (카테고리 랜덤 선택)
3.  **Get Existing Expressions** (Supabase: 중복 방지용 데이터 조회)
4.  **Gemini Master Generator** (표현 선정 + 다국어 콘텐츠 + 대화문 **동시 생성**)
5.  **Parse Master JSON** (Gemini 응답을 순수 JSON 객체로 변환)
6.  **Cleanup Meaning** (Meaning 필드 문장 부호 정리: 마침표, 세미콜론)
7.  **Validate Content** (엄격한 규칙 검증: 언어 혼용, 태그, 퀴즈 포맷 등)
8.  **If Error** (검증 실패 시 필터링)
9.  **Check Duplicate** (Supabase: DB 중복 최종 확인)
10. **If New** (신규 데이터인 경우 진행)
11. **Generate ID** (UUID 생성)
12. **Prepare TTS Requests** (대화문 분리 및 목소리 할당)
13. **Groq Orpheus TTS** (음성 합성)
14. **Upload to Storage** (Supabase Storage 업로드)
15. **Aggregate TTS Results** (오디오 경로 병합)
16. **Supabase Insert** (최종 데이터 저장)

---

## 🛠️ 단계별 설정 가이드 (Step-by-Step)

### 1단계: Schedule Trigger

워크플로우의 시작점입니다. **Schedule Trigger** 노드를 추가합니다.

- **Trigger Interval**: `Custom (Cron)`
- **Expression**: `0 9 * * *` (매일 오전 9시)

### 2단계: Pick Category

실행 때마다 카테고리를 랜덤하게 하나 뽑는 **Code** 노드입니다.

- **Name**: `Pick Category`
- **Code**: `n8n/expressions/code_v2/02_pick_category_v2.js`의 내용을 사용합니다.
  - **주의**: 여기서 사용하는 `category` 값은 웹 앱의 `lib/constants.ts`에 정의된 `CATEGORIES`와 일치해야 필터링이 정상적으로 작동합니다.
  - **Domain**: 대분류 (conversation, test, vocabulary 등)
  - **Category**: 소분류 (daily, business, travel, shopping 등)
  - **Topic**: AI 프롬프트에 전달할 구체적인 주제 설명

### 3단계: Get Existing Expressions

**Supabase** 노드를 사용하여 해당 카테고리의 기존 표현들을 조회합니다.

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

### 4단계: Gemini Master Generator (통합 생성)

**V2의 핵심 변경점입니다.** 표현 제안과 콘텐츠 생성을 한 번에 수행합니다.

- **Name**: `Gemini Master Generator`
- **Prompt**: `n8n/expressions/code_v2/04_gemini_master_generator_prompt_v2.txt`의 내용을 사용합니다.

### 5단계: Parse Master JSON

Gemini의 응답(Markdown 포함)을 순수 JSON 객체로 변환하는 **Code** 노드입니다.

- **Name**: `Parse Master JSON`
- **Code**: `n8n/expressions/code_v2/05_parse_master_json_v2.js`의 내용을 사용합니다.

### 6단계: Cleanup Meaning (데이터 정제)

Gemini가 생성한 Meaning 필드의 문장 부호를 규칙에 맞게 정리하는 **Code** 노드입니다. 검증 단계 전에 실행되어 사소한 포맷 에러를 자동 수정합니다.

- **Code**: `n8n/expressions/code_v2/06_cleanup_meaning_v2.js`의 내용을 사용합니다.

### 7단계: Validate Content (선제적 검증)

**Code** 노드를 통해 생성된 데이터가 모든 규칙을 준수하는지 검증합니다.

- **Name**: `Validate Content`
- **Code**: `n8n/expressions/code_v2/07_validate_content_v2.js`의 내용을 사용합니다.

### 8단계: If Error

검증 실패 여부에 따라 워크플로우를 분기합니다.

- **Name**: `If Error`
- **Conditions**: `{{ $json.error !== undefined }}` IS FALSE
- **Boolean**: `is true`
  - false 연결선을 다음 단계 `Check Duplicate`로 연결

### 9단계: Check Duplicate

**Supabase** 노드로 DB에 동일한 표현이 있는지 최종 확인합니다. (AI가 제외 목록을 무시했을 경우를 대비한 2차 안전장치입니다.)

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
  - **Field Value**: `"*{{ $('Parse Master JSON').item.json.expression }}*"`
  - _(참고: 'Equal' 대신 'Like'를 사용하여 "touch base"가 생성될 때 기존의 "Let's touch base"도 중복으로 감지하도록 함)_
  - _(참고: 양끝을 ""로 감싸 ,가 포함되었을 때도 에러가 발생하지 않도록 함)_

### 10단계: If New

중복 데이터가 없는 경우에만 다음 단계로 진행합니다.

- **Name**: `If New`
- **Conditions**: `{{ $('Check Duplicate').first().json.expression }}`
- **String**: `is empty`
  - (데이터가 없으면 'is empty'이므로 새로운 표현임)
  - true 연결선을 다음 단계 `Generate ID`로 연결

### 11단계: Generate ID

**Code** 노드를 통해 저장 및 파일 경로에 사용할 UUID를 생성합니다.

- **Name**: `Generate ID`
- **Code**: `n8n/expressions/code_v2/11_generate_id_v2.js`의 내용을 사용합니다.

### 12단계: Prepare TTS Requests

대화문을 개별 오디오 요청 단위로 분리하고 목소리를 할당합니다.

- **Name**: `Prepare TTS Requests`
- **Code**: `n8n/expressions/code_v2/12_prepare_tts_requests_v2.js`의 내용을 사용합니다.

### 13단계: Groq Orpheus TTS

**HTTP Request** 노드를 통해 12단계에서 분리된 각 대화 문장을 실제 오디오 파일(WAV)로 변환하는 단계입니다.

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

### 14단계: Upload to Storage

**HTTP Request** 노드를 통해 13단계에서 생성된 오디오 파일을 **Supabase Storage**의 `speak-mango-en` 버킷에 업로드합니다.

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
  - `Input Data Field Name`: `data` (14단계 Groq TTS 노드에서 받은 바이너리 필드명)
- **Options**: `Response`
  - **Response Format**: `JSON`

### 15단계: Aggregate TTS Results

**Code** 노드를 통해 분리되었던 오디오 파일 경로들을 다시 원본 데이터 구조에 통합합니다.

- **Name**: `Aggregate TTS Results`
- **Code**: `n8n/expressions/code_v2/15_aggregate_tts_results_v2.js`의 내용을 사용합니다.
- **역할**: 분산된 여러 아이템을 다시 1개의 아이템으로 병합하여 최종 저장을 준비합니다.

### 16단계: Supabase Insert 설정

**Supabase** 노드를 연결하여 최종 데이터를 저장합니다.

- **Name**: `Supabase Insert`
- **Schema**: `speak_mango_en`
- **Resource**: `Row`
- **Operation**: `Create`
- **Table Name or ID**: `expressions`
- **Data to Send**: `Auto-Map Input Data to Columns`
  - **Mapping**: `expression`, `domain`, `category`, `meaning`, `content`, `tags` 등 모든 컬럼이 자동으로 매핑됩니다.

---

## ⚡ V2의 주요 개선 사항

1.  **속도 2배 향상**: Gemini 호출이 2회에서 1회로 감소했습니다.
2.  **데이터 품질 향상**: `Cleanup Meaning` 노드가 추가되어 문장 부호 오류를 자동으로 수정합니다.
3.  **문맥 일관성**: 표현과 예문이 하나의 맥락에서 생성되어 더 자연스럽습니다.
4.  **안정성 강화**: 검증 로직(`Validate Content`)이 앞단에 배치되어 데이터 품질을 보장합니다.
