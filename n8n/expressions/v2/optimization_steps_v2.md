# n8n Optimization Guide V2: Parallel Generation & Context Restoration

> **Version 2 Update**: 이 문서는 **Optimization Guide V1**을 기반으로 고도화된 **V2 워크플로우**를 다룹니다.
> V2의 핵심은 **"단일 실행으로 모든 카테고리에 대해 각각 1개씩 표현을 병렬 생성"**하는 것과, 이를 위한 **"Context Restoration (데이터 맥락 유지)"** 기술입니다.

## 🏗️ 목표 구조 V2 (Target Architecture)

1.  **Schedule Trigger** (매일 9시 실행)
2.  **Pick Category V2** (전체 카테고리 목록 생성 - **Fan-out**)
3.  **Get Existing Expressions (Supabase)** (각 카테고리별 기존 표현 조회 - 병렬 실행)
4.  **Prepare Prompt Data** (조회된 기존 표현을 카테고리별로 매핑 - **Aggregation**)
5.  **Gemini Expression Generator** (각 카테고리별 새로운 표현 생성)
6.  **Merge Context** (Expression Generator의 출력과 원본 Category 정보 병합 - **Left Join**)
7.  **Parse Expression JSON** (응답 파싱)
8.  **Check Duplicate (Supabase)** (중복 확인)
9.  **Merge Duplicate Status** (중복 여부 데이터 병합)
10. **If New** (중복이 아닌 항목만 필터링 - `id is empty`)
11. **Wait (Rate Limiting)** (60초 대기 - Gemini API 제한 준수)
12. **Gemini Content Generator** (상세 콘텐츠 생성 - **각 아이템별 독립 실행**)
13. **Parse Content JSON** (응답 파싱 - Fan-out 지원)
14. **Validate Content (Relaxed)** (오류 항목 필터링, 성공 항목만 통과 - **V2**)
15. **Generate ID** (UUID 생성)
16. **Prepare TTS Requests** (오디오 분할 및 메타데이터 준비)
17. **Groq Orpheus TTS (Code)** (배치 처리 10개 & 65초 대기 - Rate Limit 준수)
18. **Upload to Storage** (Supabase Storage 업로드)
19. **Aggregate TTS Results** (업로드된 오디오 경로를 원본 JSON에 병합)
20. **Supabase Insert** (최종 DB 저장)

---

## 🛠️ V2 핵심 변경 사항 (Key Changes)

### 1. Pick Category (Fan-out)
V1에서는 하나만 랜덤 선택했지만, V2에서는 **모든 유효한 카테고리**를 반환하여 이후 노드들이 **병렬(Parallel)**로 실행되도록 합니다.

- **File**: `n8n/expressions/code_v2/01_pick_category_v2.js`
- **Output**: 6개 아이템 (Daily, Business, Travel, Shopping, Emotion, Slang)

### 2. Context Restoration (Merge Node) `[CRITICAL]`
`Gemini Expression Generator`를 거치면 입력 데이터의 구조가 바뀌어 원본(`domain`, `category`, `topic`) 정보를 잃어버릴 수 있습니다.
V2에서는 **Merge Node (Left Join)**를 사용하여 이를 완벽하게 해결합니다.

- **Node**: `Merge Context`
- **Strategy**: Input 1 (`Prepare Prompt Data` output)의 데이터를 보존하면서 Gemini 출력을 병합.

### 3. Rate Limiting (Wait Node & Batching)
Gemini와 Groq API의 분당 요청 제한(RPM)을 준수하기 위해 대기 및 배치 로직을 도입했습니다.

- **Wait Node (Step 11)**: `If New` 통과 후 60초 대기하여 이전 단계의 실행 빈도를 조절.
- **Groq TTS Code (Step 17)**: 10개씩 배치(Batch)로 묶어 처리하고, 배치 간 65초를 대기하여 10 RPM 제한을 준수.

### 4. Relaxed Validation (V2)
엄격하게 실패를 `throw`하던 V1과 달리, V2 검증 로직은 실패한 아이템을 **제거(Filter)**하고 경고 로그를 남긴 뒤, 유효한 아이템만 다음 단계로 넘깁니다. 이는 워크플로우 전체가 멈추는 것을 방지합니다.

- **File**: `n8n/expressions/code_v2/12_validate_content_v2.js`

### 5. V2 Dedicated Files
V2 워크플로우를 위해 `n8n/expressions/code_v2/` 폴더에 전용 파일들을 분리하여 관리합니다.

| Step | Node Name | File Path |
| :--- | :--- | :--- |
| 02 | Pick Category | `n8n/expressions/code_v2/01_pick_category_v2.js` |
| 04 | Prepare Prompt Data | `n8n/expressions/code_v2/04_prepare_prompt_data_v2.js` |
| 05 | Gemini Expression Gen | `n8n/expressions/code_v2/03_gemini_expression_prompt_v2.txt` |
| 07 | Parse Expression JSON | `n8n/expressions/code_v2/06_parse_expression_json_v2.js` |
| 12 | Gemini Content Gen | `n8n/expressions/code_v2/05_gemini_content_prompt_v2.txt` |
| 13 | Parse Content JSON | `n8n/expressions/code_v2/11_parse_content_json_v2.js` |
| 14 | Validate Content | `n8n/expressions/code_v2/12_validate_content_v2.js` |
| 15 | Generate ID | `n8n/expressions/code_v2/13_generate_id_v2.js` |
| 16 | Prepare TTS Requests | `n8n/expressions/code_v2/14_prepare_tts_requests_v2.js` |
| 17 | Groq Orpheus TTS | `n8n/expressions/code_v2/15_groq_tts_v2.js` |
| 19 | Aggregate TTS Results | `n8n/expressions/code_v2/15_aggregate_tts_v2.js` |

---

## 🚀 상세 설정 (Configuration)

### Gemini Content Generator V2
병렬 실행 시 **절대** `$('NodeName').first().json`을 사용하면 안 됩니다.
반드시 **Merge**를 통과한 **현재 아이템의 컨텍스트(`$json`)**를 사용해야 합니다.

**Good (V2 Style):**
```text
Domain: {{ $json.domain }}
Category: {{ $json.category }}
Expression: {{ $json.expression }}
```

### Groq TTS Batching
`Groq Orpheus TTS - Code` 노드는 내부적으로 65초 대기를 포함하므로 실행 시간이 깁니다. n8n 타임아웃 설정에 유의하세요.

---

이 가이드를 따라 V2 워크플로우를 구성하면, **하루에 한 번 실행으로 모든 카테고리의 새로운 표현을 자동으로 생성, 검증, 음성 합성하여 문맥 유실 없이 안전하게 저장**할 수 있습니다.
