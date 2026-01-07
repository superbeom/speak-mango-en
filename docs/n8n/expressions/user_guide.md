# Speak Mango User Guide

Speak Mango는 AI 기반의 영어 표현 자동 생성 및 학습 서비스입니다. 이 문서는 사용자가 서비스를 이해하고, n8n 자동화 워크플로우를 설정 및 운영하는 방법을 단계별로 안내합니다.

## 🌟 서비스 개요

- **목적**: 매일 새로운 영어 표현을 자동으로 학습하고, 퀴즈와 회화를 통해 실력을 향상시킵니다.
- **핵심 기능**:
  - **Daily Expressions**: 매일 아침 9시, AI가 선정한 유용한 영어 표현이 업데이트됩니다.
  - **Native Voice (TTS)**: 대화문에 원어민 음성(Groq Orpheus V1)을 제공하여 듣기 학습을 지원합니다.
  - **Smart Quiz**: 학습한 표현을 바로 테스트할 수 있는 퀴즈를 제공합니다.
  - **Multi-language**: 한국어, 일본어, 스페인어로 학습 콘텐츠를 제공합니다.

---

## 🚀 시작하기 (Getting Started)

### 1. 웹사이트 접속

- 메인 페이지에서 최신 영어 표현 카드를 확인할 수 있습니다.
- 카드를 클릭하면 상세 페이지로 이동하여 뜻, 예문, 퀴즈 등을 학습할 수 있습니다.
- 상단 검색창에서 원하는 표현이나 태그를 검색할 수 있습니다.

### 2. 학습 방법

1.  **표현 확인**: 오늘의 표현과 뜻을 확인합니다.
2.  **상황 파악**: `Situation` 섹션에서 어떤 상황에 쓰이는지 파악합니다.
3.  **실전 회화**: `Dialogue` 예문을 통해 실제 대화 흐름을 익힙니다.
4.  **퀴즈 풀기**: `Quiz`를 통해 학습 내용을 점검합니다.

---

## ⚙️ 자동화 워크플로우 설정 (For Operators)

이 섹션은 서비스를 운영하거나 n8n 워크플로우를 직접 설정하려는 사용자를 위한 가이드입니다.

### 사전 준비 사항

- **n8n 인스턴스**: 로컬(`localhost:5678`) 또는 클라우드에 n8n이 설치되어 있어야 합니다.
- **Supabase 프로젝트**: 데이터베이스 및 Storage(`speak-mango-en` 버킷)가 구축되어 있어야 합니다.
- **API Keys**
  - **Google Gemini**: 콘텐츠 생성
  - **Supabase**: 데이터베이스 및 스토리지 접근
  - **Groq**: 음성 합성

### 워크플로우 가져오기 (Import)

1.  n8n 대시보드에서 `Import from File`을 선택합니다.
2.  프로젝트 내 `n8n/expressions/expressions_workflow_template.json` 파일을 업로드합니다.
3.  가져온 워크플로우 내의 주요 노드들에 **Credentials**를 연결합니다.
    - `googlePalmApi`: Gemini AI 연동을 위해 발급받은 Google AI Studio API 키를 연결합니다.
    - `supabaseApi`: Supabase 프로젝트의 API URL과 Service Role Key를 입력하여 연결합니다.
    - `groqApi`: Groq 음성 합성을 위해 발급받은 API 키를 연결합니다. (Header Auth 방식 사용)

### 노드별 설정 가이드

#### 1. Schedule Trigger

- **역할**: 워크플로우를 주기적으로 실행합니다.
- **설정**: `Trigger Interval`을 `Custom (Cron)`으로 설정하고 `0 9 * * *` (매일 아침 9시)로 지정합니다.

#### 2. Pick Category

- **역할**: 오늘의 주제를 랜덤으로 선정합니다.
- **검증**: `Code` 노드 내 `topics` 배열에 원하는 카테고리가 포함되어 있는지 확인합니다.

#### 3. Get Existing Expressions (Supabase)

- **역할**: 중복 생성을 방지하기 위해 이미 DB에 있는 표현들을 조회합니다.
- **설정**: `Operation`을 `Get Many`로 설정하고, `Return All`을 켭니다.

#### 4. Gemini Expression Generator

- **역할**: 선택된 카테고리와 주제에 맞춰 새로운 영어 표현 1개를 생성합니다.
- **주요 설정 (Prompt Details)**:
  - **Role**: `Professional English Teacher`
  - **Task**: Suggest ONE useful English expression related to the category.
  - **Requirements**:
    - 실용적이고 널리 쓰이는 표현일 것.
    - `# EXCLUDED EXPRESSIONS`에 있는 표현은 절대 생성하지 말 것 (중복 방지).
    - **대소문자 규칙**: 문장은 대문자 시작(예: "No worries"), 구절은 소문자 시작(예: "spill the tea").
    - **뜻풀이**: 간결하고 캐주얼한 반말 톤 사용 (마침표 제외).
  - **Example Output**: `{"expression": "Hold your horses", "meaning": "잠깐 기다려 · 진정해"}`
- **주의**: `Execute Once` 설정이 켜져 있는지 확인하여, 입력 데이터가 여러 개라도 한 번만 실행되도록 해야 합니다.

#### 5. Parse Expression JSON

- **역할**: Gemini가 생성한 표현 데이터(문자열)를 순수 JSON 객체로 변환합니다.
- **로직**: 마크다운 코드 블록(```json)을 제거하고 `JSON.parse()`를 수행합니다.

#### 6. Check Duplicate & If New

- **역할**: 2차 중복 검사를 수행합니다.
- **로직**: `expression`이 DB에 이미 존재하면 워크플로우를 종료(False)하고, 없으면 진행(True)합니다.

#### 7. Gemini Content Generator

- **역할**: 선정된 표현에 대한 상세 학습 콘텐츠(뜻, 상황, 대화, 팁, 퀴즈)를 3개 국어(KO, JA, ES)로 생성합니다.
- **주요 설정 (Prompt Details)**:
  - **Role**: `Professional English Content Creator & Polyglot Teacher`
  - **Task**: Create a detailed study card in Korean, Japanese, and Spanish.
  - **Requirements**:
    - **Tone**: 친근하고 유머러스한 2030 타겟 톤 (단, 설명은 경어체 사용).
    - **Meaning**: 기본 반말, 존대 표현은 존댓말 허용.
    - **No Markdown**: JSON 응답에 마크다운 태그 포함 금지.
  - **Quiz Logic (Critical)**:
    - **Pattern 1**: [상황] 주어짐 -> 알맞은 [영어 표현] 고르기.
    - **Pattern 2**: [영어 표현] 주어짐 -> 알맞은 [상황] 고르기.
    - **Pattern 3**: [영어 표현] 주어짐 -> 알맞지 _않은_ [상황] 고르기 (Negative Logic).
    - **Format**: 반드시 A, B, C 선택지와 알파벳 정답(예: "B") 형식을 따라야 하며, 질문과 선택지 사이 줄바꿈(`\n`) 필수.
  - **Output Structure**: `meaning`, `content` (situation, dialogue, tip, quiz), `tags` 등을 포함한 JSON 구조.

#### 8. Parse Content JSON

- **역할**: 상세 콘텐츠 데이터(문자열)를 순수 JSON 객체로 변환합니다.

#### 9. Generate ID (Code)

- **역할**: 오디오 저장 경로 및 DB 고유 키로 사용할 UUID를 미리 생성합니다.
- **이유**: TTS 생성과 상세 콘텐츠 생성을 병렬 혹은 순차로 진행할 때 동일한 ID를 공유하기 위함입니다.

#### 10. TTS Pipeline (음성 합성 및 저장)

- **역할**: 생성된 대화문을 원어민 음성으로 변환하여 저장합니다.
- **단계별 상세 (Steps)**:
  - **Prepare TTS Requests**: 영어 대화문을 추출하고, 화자(A/B)에 따라 적절한 목소리(Hannah/Troy)를 할당하여 개별 요청 아이템으로 분해합니다.
  - **Groq Orpheus TTS**: Orpheus V1 모델을 호출하여 초고속으로 텍스트를 음성(WAV) 바이너리로 변환합니다.
  - **Upload to Storage**: 생성된 오디오 파일을 Supabase Storage의 `speak-mango-en` 버킷 내 `expressions/` 폴더에 업로드합니다.
  - **Aggregate Results**: 분산되었던 오디오 파일 경로(`audio_url`)들을 원본 JSON 데이터 구조의 적절한 위치(`dialogue` 배열)에 다시 병합합니다.

#### 11. Supabase Insert

- **역할**: 최종 생성된 데이터를 DB에 저장합니다.
- **매핑**: `expression`, `meaning`, `content`, `tags` 등의 필드가 정확히 매핑되었는지 확인합니다.

### 트러블슈팅 (Troubleshooting)

- **JSON 파싱 에러**: Gemini가 가끔 마크다운 코드 블록(```json)을 포함하여 응답할 수 있습니다. `Parse Content JSON` 노드가 이를 처리하지만, 형식이 너무 많이 깨진 경우 프롬프트를 재확인하세요.
- **퀴즈 포맷 오류**: 특정 언어에서 선택지가 누락되거나 정답이 텍스트로 나오는 경우, `Gemini Content Generator` 프롬프트의 `Strict Formatting Rules`를 다시 한번 강조해서 입력하세요.

---

## 📚 데이터 관리 정책

- **데이터 보정**: 잘못 생성된 데이터는 `database/` 폴더 내의 SQL 스크립트를 통해 수정하거나 삭제할 수 있습니다.
- **백업**: `n8n_data/` 폴더는 `.gitignore`에 포함되어 있으므로, 중요한 워크플로우 변경 사항은 `n8n/` 폴더의 JSON 템플릿 파일로 내보내어 정기적으로 버전 관리하세요.
