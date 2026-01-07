# n8n Workflow Guide

이 문서는 n8n을 사용하여 영어 학습 콘텐츠 생성을 자동화하고 원어민 음성(TTS)까지 연동하는 워크플로우 설정을 안내합니다.

## 🚀 n8n 실행 방법 (Docker)

프로젝트 루트 디렉토리에서 다음 명령어를 실행하여 n8n을 기동합니다.

```bash
# n8n 컨테이너 실행
docker-compose up -d

# 실행 확인
docker-compose ps
```

실행 후 브라우저에서 **[http://localhost:5678](http://localhost:5678)** 에 접속하여 초기 설정을 완료하세요.

## 🏗️ 전체 워크플로우 구조 (AI-Driven + TTS)

외부 블로그 스크래핑의 불안정성을 제거하고, **AI가 스스로 주제를 선정하여 표현과 상세 콘텐츠를 생성하며, 원어민 음성까지 지원하는 방식**으로 최적화되었습니다.
상세한 노드 설정 방법은 **[`docs/n8n/expressions/optimization_steps.md`]** 문서를 참고하세요.

1. **Schedule Trigger**: 매일 오전 9시 실행.
2. **Pick Category**: 미리 정의된 주제(비즈니스, 생활회화 등) 중 하나를 랜덤 선택.
3. **Get Existing Expressions (Supabase)**: 선택된 카테고리의 기존 표현들을 조회하여 중복 생성을 방지.
4. **Gemini Expression Generator**: 선택된 주제에 맞는 유용한 영어 표현 1개 생성 (기존 표현 제외).
5. **Parse Expression JSON**: AI가 생성한 표현 데이터를 JSON 객체로 변환.
6. **Check Duplicate (Supabase)**: 생성된 표현이 DB에 있는지 확인 (2차 안전장치).
7. **If New**: 중복이 아닐 경우에만 다음 단계 진행.
8. **Gemini Content Generator**: 전체 콘텐츠(뜻, 예문, 퀴즈 등) 상세 생성.
9. **Parse Content JSON**: 상세 콘텐츠 데이터를 JSON 객체로 변환.
10. **Generate ID (Code)**: 저장 경로 및 DB 고유 키로 사용할 UUID 미리 생성.
11. **TTS Pipeline (음성 합성 및 저장)**:
    - **Prepare TTS Requests**: 영어 대화문을 추출하고 화자(A/B)별 목소리를 할당하여 개별 요청으로 분해.
    - **Groq Orpheus TTS**: Orpheus V1 모델을 호출하여 텍스트를 고품질 음성(WAV)으로 초고속 변환.
    - **Upload to Storage**: 생성된 오디오 파일을 Supabase Storage의 `speak-mango-en` 버킷 내 `expressions/` 폴더에 업로드.
    - **Aggregate Results**: 분산되었던 오디오 파일 경로들을 원본 데이터 구조에 다시 병합.
12. **Supabase Insert**: 오디오 경로가 포함된 최종 데이터를 DB에 저장.

---

## 📥 워크플로우 가져오기 (Import)

1. n8n 접속 후 왼쪽 메뉴의 **Workflows** 클릭
2. 오른쪽 상단의 **Add Workflow** -> **Import from File** 선택
3. `n8n/expressions/expressions_workflow_template.json` 파일 선택
4. 각 노드의 **Credential**을 본인의 설정에 맞게 등록 (Gemini API Key, Supabase URL/Key, Groq API Key)

---

## 🤖 Gemini API 설정

1. [Google AI Studio](https://aistudio.google.com/)에서 API Key를 발급받습니다.
2. n8n에서 `Google Gemini Chat Model` 노드를 추가하고 API Key를 등록합니다.
3. `Gemini Extractor`와 `Gemini Generator` 노드에 각각 Credential을 연결합니다.

---

## ✍️ AI 프롬프트 전략

### 1. Expression Generator Prompt

랜덤 선택된 카테고리를 입력받아 관련성 높은 표현 하나를 생성합니다.

```json
// Input: Category "Business"
{
  "expression": "Touch base",
  "meaning": "연락하다 / 이야기하다"
}
```

### 2. Content Generator Prompt

DB에 없는 새로운 표현일 때만 호출되며, 상세 교육 콘텐츠를 생성합니다.

- **Tone**: 친절하고 유머러스한 강사 (1020 타겟)
- **Output**: `expression`, `meaning`, `content` (situation, dialogue, tip, quiz), `tags`

---

## 🔗 데이터 연동 (Supabase)

n8n의 `Supabase` 노드를 사용하여 최종 데이터를 `expressions` 테이블에 Insert 합니다.

- **Table**: `expressions`
- **Mapping**: JSON 데이터를 컬럼에 매핑 (expression, meaning, content, tags).

---

## 💾 백업 및 복구 (Backup & Recovery)

워크플로우 데이터 유실에 대비하여 주기적으로 설정을 내보내기 하는 것이 좋습니다.

1. **내보내기 (Export)**: 워크플로우 화면 상단 메뉴 -> **Download** 클릭.
2. **공유용 저장**: API Key가 제거된 템플릿은 `n8n/expressions/expressions_workflow_template.json`에 저장하여 공유합니다.
3. **개인 백업 저장**: 본인의 실제 Credential 정보가 포함된 전체 백업은 **`n8n_data/speak_mango_n8n_expressions_workflow.json`** 경로에 저장하는 것을 권장합니다. (해당 폴더는 `.gitignore` 처리되어 있어 보안상 안전합니다.)
4. **가져오기 (Import)**: 새로운 n8n 환경에서 **Import from File** 클릭 -> 저장된 JSON 파일 선택.
5. **재연동**: 가져오기 후 Gemini API Key 및 Supabase Credential을 다시 연결하면 즉시 가동 가능합니다.

## 💡 팁 & 트러블슈팅 (Troubleshooting)

- **Duplicate Check**: DB에 이미 존재하는 표현이 생성될 경우, `If New` 노드에 의해 자동으로 필터링되고 다음 실행을 기약합니다.
- **Category Management**: `Code` 노드 내의 카테고리 배열을 주기적으로 업데이트하면 콘텐츠의 다양성을 유지할 수 있습니다.
- **Credential Missing Error**: 템플릿 JSON 파일에는 보안을 위해 실제 API Key가 포함되어 있지 않습니다. 가져오기 직후 `Google Gemini Chat Model`, `Groq Orpheus TTS`, `Check Duplicate`, `Supabase Insert` 노드가 주황색으로 표시될 수 있습니다. 각 노드를 열어 본인의 **Gemini API**, **Groq**, **Supabase** Credential을 새로 생성하거나 선택해 주어야 합니다.
- **Import Error**: "Could not find property option" 에러가 발생할 경우, 최신 n8n 버전을 사용 중인지 확인하거나 템플릿의 `options: {}` 필드를 제거해보세요 (현재 템플릿은 최적화되어 있습니다).
- **JSON Parsing Error**: 워크플로우 템플릿의 `prompt` 필드는 줄바꿈(`\n`)과 따옴표(`\"`)가 이스케이프 처리된 단일 문자열이어야 합니다. 수정 시 JSON 문법이 깨지지 않도록 주의하세요.
- **Quota Management**:
  - **Gemini**: 2.5 Flash 무료 티어를 효율적으로 사용하기 위해, 중복된 표현은 Generator 단계를 건너뛰도록 설계되었습니다.
  - **Groq**: Orpheus V1은 매우 빠르지만 API 한도가 있을 수 있습니다. 대화문이 너무 길어질 경우 프롬프트에서 글자 수를 제한하는 것이 좋습니다.
