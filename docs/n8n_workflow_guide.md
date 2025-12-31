# n8n Workflow Guide

이 문서는 n8n을 사용하여 영어 블로그를 자동화하는 워크플로우 설정을 안내합니다.

## 🚀 n8n 실행 방법 (Docker)

프로젝트 루트 디렉토리에서 다음 명령어를 실행하여 n8n을 기동합니다.

```bash
# n8n 컨테이너 실행
docker-compose up -d

# 실행 확인
docker-compose ps
```

실행 후 브라우저에서 **[http://localhost:5678](http://localhost:5678)** 에 접속하여 초기 설정을 완료하세요.

## 🏗️ 전체 워크플로우 구조 (AI-Driven)

외부 블로그 스크래핑의 불안정성을 제거하고, **AI가 스스로 주제를 선정하여 표현을 생성하는 방식**으로 최적화되었습니다.
상세한 노드 설정 방법은 **[`docs/n8n_optimization_steps.md`]** 문서를 참고하세요.

1. **Schedule Trigger**: 매일 오전 9시 실행.
2. **Category Selection**: 미리 정의된 주제(비즈니스, 생활회화 등) 중 하나를 랜덤 선택.
3. **Gemini Expression Generator**: 선택된 주제에 맞는 유용한 영어 표현 1개 생성.
4. **Check Duplicate (Supabase)**: 생성된 표현이 DB에 있는지 확인.
5. **If New**: 중복이 아닐 경우에만 다음 단계 진행.
6. **Gemini Content Generator**: 전체 콘텐츠(뜻, 예문, 퀴즈 등) 상세 생성.
7. **Supabase Insert**: 최종 데이터 저장.

---

## 📥 워크플로우 가져오기 (Import)

1. n8n 접속 후 왼쪽 메뉴의 **Workflows** 클릭
2. 오른쪽 상단의 **Add Workflow** -> **Import from File** 선택
3. `docs/n8n_workflow_template.json` 파일 선택
4. 각 노드의 **Credential**을 본인의 설정에 맞게 등록 (Gemini API Key, Supabase URL/Key)

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

## 💡 팁 (Troubleshooting)

- **Duplicate Check**: DB에 이미 존재하는 표현이 생성될 경우, `If New` 노드에 의해 자동으로 필터링되고 다음 실행을 기약합니다.
- **Category Management**: `Code` 노드 내의 카테고리 배열을 주기적으로 업데이트하면 콘텐츠의 다양성을 유지할 수 있습니다.
- **Import Error**: "Could not find property option" 에러가 발생할 경우, 최신 n8n 버전을 사용 중인지 확인하거나 템플릿의 `options: {}` 필드를 제거해보세요 (현재 템플릿은 최적화되어 있습니다).
- **JSON Parsing Error**: 워크플로우 템플릿의 `prompt` 필드는 줄바꿈(`\n`)과 따옴표(`\"`)가 이스케이프 처리된 단일 문자열이어야 합니다. 수정 시 JSON 문법이 깨지지 않도록 주의하세요.
- **Quota**: Gemini 2.5 Flash 무료 티어를 효율적으로 사용하기 위해, 중복된 표현은 Generator 단계를 건너뛰도록 설계되었습니다.
