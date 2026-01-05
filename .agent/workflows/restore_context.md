# Context Restoration & Rule Enforcement

이 워크플로우는 `speak-mango-en` 프로젝트의 모든 컨텍스트 파일을 로드하고, 개발 에이전트로서 준수해야 할 규칙을 재확립합니다.

## 1. Load Context Files

우선 다음 파일들을 순차적으로 읽고 내용을 메모리에 확실히 적재하십시오.
(파일이 존재하지 않으면 건너뛰지 말고 생성 여부를 물어보십시오.)

- `docs/project_context.md` (프로젝트 개요 및 아키텍처, 규칙)
- `docs/project_history.md` (히스토리 및 Q&A)
- `docs/task.md` (작업 목록)
- `docs/features_list.md` (구현된 기능 명세)
- `docs/future_todos.md` (기술 부채 및 아이디어)
- `docs/database_schema.md` (DB 스키마 정의)
- `docs/git_convention.md` (커밋 컨벤션)
- `docs/git_branch_strategy.md` (브랜치 전략)
- `docs/walkthrough.md` (구현 상세 내역)

## 2. Summarize & Internalize

읽어들인 내용을 바탕으로 다음을 수행하여 사용자에게 보고하십시오:

1. **프로젝트 요약**: 현재 프로젝트의 목표, 핵심 아키텍처(n8n Automation + Next.js), 기술 스택을 간략히 요약.
2. **진행 상태**: `task.md`를 기반으로 현재 완료된 단계와 남은 작업 확인.
3. **최근 이슈**: `project_history.md`의 상단을 확인하여 가장 최근에 논의된 주제 파악.

## 3. Enforce Operational Rules (Crucial)

**이 세션 동안 다음 규칙을 엄격히 준수하십시오:**

1.  **자동 기록 (Auto-Documentation)**:
    - 사용자와의 중요한 문답, 결정 사항은 작업이 끝날 때 `project_history.md`에 요약하여 추가하십시오.
    - 기능 구현이 완료되면 `walkthrough.md`에 구현 상세를 버전별로 기록하십시오.
2.  **기술 부채 관리 (Debt Management)**:
    - 코드 작성 중 개선이 필요한 부분이나 나중으로 미룰 사항이 생기면, 단순히 주석만 남기지 말고 **반드시 `future_todos.md` 파일에도 항목을 추가**하십시오.
    - 예: `// TODO: 중복 체크 로직 개선` -> `future_todos.md`에 `[ ] 중복 체크 로직 개선 (n8n workflow)` 추가.
3.  **일관성 유지**:
    - `project_context.md`에 정의된 아키텍처와 `git_convention.md`의 규칙을 항상 먼저 고려하십시오.

---

**모든 로딩이 완료되면 "✅ 프로젝트 컨텍스트가 로드되었습니다. 현재 [작업 단계]를 진행할 차례입니다."라고 출력하고 대기하십시오.**
