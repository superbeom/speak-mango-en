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

## 🏗️ 전체 워크플로우 구조

1. **Schedule Trigger**: 주기적 실행 (예: 매일 오전 9시)
2. **HTTP Request**: 블로그 URL에서 HTML 가져오기
3. **Gemini Node (LLM)**: 가져온 텍스트에서 표현 추출 및 가공
4. **Supabase Node**: 가공된 데이터를 DB에 저장

---

## 📥 워크플로우 가져오기 (Import)

1. n8n 접속 후 왼쪽 메뉴의 **Workflows** 클릭
2. 오른쪽 상단의 **Add Workflow** -> **Import from File** 선택
3. `docs/n8n_workflow_template.json` 파일 선택
4. 각 노드의 **Credential**을 본인의 설정에 맞게 등록 (Gemini API Key, Supabase URL/Key)

---

## 🤖 Gemini API 설정 (무료)

1. [Google AI Studio](https://aistudio.google.com/)에서 API Key를 발급받습니다.
2. n8n에서 `Google Gemini Chat Model` 노드를 추가하고 API Key를 등록합니다.
3. 모델은 `gemini-1.5-flash`를 권장합니다. (가장 빠르고 무료 티어가 넉넉함)

---

## ✍️ AI 프롬프트 (가공 양식)

현재 워크플로우 템플릿에는 **친절하고 유머러스한 영어 강사** 컨셉의 프롬프트가 포함되어 있습니다. 1020 학생들에게 적합한 말투와 이모지를 사용하도록 설정되어 있습니다.

---

## 🔗 데이터 연동 (Supabase)

n8n의 `Supabase` 노드를 사용하여 추출된 JSON 데이터를 `expressions` 테이블에 Insert 합니다.

- **Table**: `expressions`
- **Columns**: `expression`, `meaning`, `content`, `origin_url`, `tags`

---

## 💡 팁

- **Duplicate Check**: 동일한 표현이 이미 DB에 있는지 확인하는 로직을 n8n에서 추가하면 중복 포스팅을 방지할 수 있습니다.
- **HTML Cleanup**: 스크래핑한 데이터가 너무 크면 토큰 제한에 걸릴 수 있으므로, HTML 노드에서 `main`이나 `article` 태그만 추출하는 것이 좋습니다.
