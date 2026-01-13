# n8n Optimization Guide V2: Single-Shot AI Generation

이 문서는 기존의 2-Step (표현 생성 -> 콘텐츠 생성) 방식을 **단일 Gemini 호출 (Single-Shot)**로 통합하여 최적화한 V2 워크플로우 가이드입니다.

V2는 API 호출 횟수를 절반으로 줄여 속도를 개선하고, 표현과 콘텐츠의 문맥적 일관성을 강화합니다. 또한, 검증 로직을 조기에 수행하여 불필요한 DB 조회를 방지합니다.

## 🏗️ 목표 구조 (Target Architecture V2)

1.  **Schedule Trigger** (매일 실행 또는 수동 실행)
2.  **Pick Category** (카테고리 랜덤 선택)
3.  **Get Existing Expressions** (Supabase: 중복 방지용 데이터 조회)
4.  **Gemini Master Generator** (표현 선정 + 다국어 콘텐츠 + 대화문 **동시 생성**)
5.  **Parse Master JSON** (Gemini 응답을 순수 JSON 객체로 변환)
6.  **Validate Content** (엄격한 규칙 검증: 언어 혼용, 태그, 퀴즈 포맷 등)
7.  **If Error** (검증 실패 시 필터링)
8.  **Check Duplicate** (Supabase: DB 중복 최종 확인)
9.  **If New** (신규 데이터인 경우 진행)
10. **Generate ID** (UUID 생성)
11. **Prepare TTS Requests** (대화문 분리 및 목소리 할당)
12. **Groq Orpheus TTS** (음성 합성)
13. **Upload to Storage** (Supabase Storage 업로드)
14. **Aggregate TTS Results** (오디오 경로 병합)
15. **Supabase Insert** (최종 데이터 저장)

---

## 🛠️ 단계별 설정 가이드 (Step-by-Step)

### 1단계: Schedule Trigger

워크플로우의 시작점입니다. **Schedule Trigger** 노드를 추가합니다.

- **Trigger Interval**: `Custom (Cron)`
- **Expression**: `0 9 * * *` (매일 오전 9시)

### 2단계: Pick Category

실행 때마다 카테고리를 랜덤하게 하나 뽑는 **Code** 노드입니다.

```javascript
// 주제 목록 정의
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

const selected = topics[Math.floor(Math.random() * topics.length)];

return {
  json: {
    domain: selected.domain,
    category: selected.category,
    topic: selected.topic,
  },
};
```

### 3단계: Get Existing Expressions

**Supabase** 노드를 사용하여 해당 카테고리의 기존 표현들을 조회합니다.

- **Operation**: `Get Many`
- **Table**: `expressions`
- **Filters**: `category` EQUAL `{{ $json.category }}`

### 4단계: Gemini Master Generator (통합 생성)

**V2의 핵심 변경점입니다.** 표현 제안과 콘텐츠 생성을 한 번에 수행합니다.

- **Prompt**: `n8n/expressions/code_v2/04_gemini_master_generator_prompt.txt`의 내용을 사용합니다.

### 5단계: Parse Master JSON

Gemini의 응답(Markdown 포함)을 순수 JSON 객체로 변환하는 **Code** 노드입니다.

- **Code**: `n8n/expressions/code_v2/05_parse_master_json.js`의 내용을 사용합니다.

### 6단계: Validate Content (선제적 검증)

생성된 데이터가 모든 규칙을 준수하는지 검증합니다.

- **Code**: `n8n/expressions/code_v2/06_validate_content.js`의 내용을 사용합니다.

### 7단계: If Error

검증 실패 여부에 따라 워크플로우를 분기합니다.

- **Conditions**: `{{ $json.error !== undefined }}` IS FALSE

### 8단계: Check Duplicate

**Supabase** 노드로 DB에 동일한 표현이 있는지 최종 확인합니다.

- **Filters**: `expression` ILIKE `{{ $json.expression }}`

### 9단계: If New

중복 데이터가 없는 경우에만 다음 단계로 진행합니다.

- **Conditions**: `{{ $json.expression }}` IS EMPTY (조회 결과가 없어야 신규)

### 10단계: Generate ID

저장 및 파일 경로에 사용할 UUID를 생성합니다.

- **Code**: `n8n/expressions/code_v2/10_generate_id.js`의 내용을 사용합니다.

### 11단계: Prepare TTS Requests

대화문을 개별 오디오 요청 단위로 분리하고 목소리를 할당합니다.

- **Code**: V1 가이드의 `Prepare TTS Requests`와 동일한 로직을 사용합니다.

### 12단계: Groq Orpheus TTS

**HTTP Request** 노드를 통해 각 대화 문장을 음성으로 합성합니다.

- **Model**: `canopylabs/orpheus-v1-english`

### 13단계: Upload to Storage

생성된 오디오 파일을 **Supabase Storage**의 `speak-mango-en` 버킷에 업로드합니다.

### 14단계: Aggregate TTS Results

분리되었던 오디오 파일 경로들을 다시 원본 데이터 구조에 통합합니다.

### 15단계: Supabase Insert

최종 완성된 데이터를 `expressions` 테이블에 저장합니다.

---

## ⚡ V2의 주요 개선 사항

1.  **속도 2배 향상**: Gemini 호출이 2회에서 1회로 감소했습니다.
2.  **문맥 일관성**: 표현과 예문이 하나의 맥락에서 생성되어 더 자연스럽습니다.
3.  **안정성 강화**: 검증 로직(`Validate Content`)이 앞단에 배치되어 데이터 품질을 보장합니다.
