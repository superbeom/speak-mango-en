# n8n Optimization Guide V3: Specific Expression Content Generation

이 문서는 **특정 표현(Specific Expression)**을 지정하여 콘텐츠를 생성하는 V3 워크플로우 가이드입니다.
V2(랜덤 생성)와 달리, 데이터 일관성 및 특정 표현에 대한 정교한 콘텐츠 제작을 목표로 합니다.

## 🏗️ 목표 구조 (Target Architecture V3)

1.  **Schedule Trigger** (매일 실행 또는 수동 실행)
2.  **Pick Expression** (생성할 특정 표현 선택)
3.  **Gemini Specific Expression Generator** (표현 분류 + 다국어 콘텐츠 + 대화문 생성)
4.  **Parse Master JSON** (Gemini 응답을 순수 JSON 객체로 변환)
5.  **Cleanup Meaning** (Meaning 필드 문장 부호 정리)
6.  **Validate Content** (엄격한 규칙 검증)
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

V2에서 변경된 **2단계**와 **3단계**를 중심으로 설명합니다. 나머지 단계는 V2와 동일합니다.

### 2단계: Pick Expression (표현 선택)

V2의 `Pick Category`를 대체합니다. 생성하고자 하는 특정 표현을 직접 지정하여 넘겨줍니다.

- **Name**: `Pick Expression`
- **Code**: `n8n/expressions/code_v3/02_pick_expression_v3.js`의 내용을 사용합니다.

### 3단계: Gemini Specific Expression Generator (특정 표현 생성)

V2의 `Gemini Master Generator`를 대체합니다. AI가 표현을 랜덤 제안하는 것이 아니라, 입력받은 표현을 분석하고 분류하여 콘텐츠를 생성합니다.

- **Name**: `Gemini Specific Expression Generator`
- **Prompt**: `n8n/expressions/code_v3/03_gemini_specific_expression_generator_prompt_v3.txt`의 내용을 사용합니다.
- **주요 기능**:
  1.  **Analyze (분석)**: 입력된 표현(`Make yourself comfortable`)을 분석합니다.
  2.  **Classify (자동 분류)**: 미리 정의된 6가지 토픽 중 가장 적절한 Domain/Category를 AI가 스스로 판단하여 할당합니다.
  3.  **Generate (콘텐츠 생성)**: V2와 동일한 고품질 포맷으로 Meaning, Content, Dialogue를 생성합니다.

---

## ⚡ V3의 특징

1.  **타겟팅 생성**: 원하는 표현을 정확히 핀포인트하여 DB에 추가할 수 있습니다.
2.  **자동 분류 (Auto-Classification)**: 사용자가 매번 카테고리를 지정하지 않아도, AI가 문맥에 맞춰 최적의 카테고리를 찾아줍니다.
3.  **V2와의 호환성**: 입/출력 구조를 V2와 동일하게 맞춰(JSON Schema 유지), 이후 프로세스(검증, TTS, 저장)는 수정 없이 그대로 재사용합니다.
