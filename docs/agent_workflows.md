# Agent Workflows Guide

이 문서는 `speak-mango-en` 프로젝트에서 개발 효율성과 일관성을 유지하기 위해 사용하는 **AI 에이전트 워크플로우**의 사용법을 설명합니다.

모든 워크플로우 파일은 `.agent/workflows/` 디렉토리에 위치하며, 채팅창에서 `@`를 통해 해당 파일을 호출하여 실행합니다.

---

## 1. 컨텍스트 복원 (`@restore_context`)

**파일 경로**: `.agent/workflows/restore_context.md`

### 💡 목적

- IDE를 새로 켜거나 새로운 채팅 세션을 시작할 때, 프로젝트의 방대한 컨텍스트(규칙, 히스토리, 할 일 등)를 AI에게 빠르게 주입합니다.
- AI가 "개발자 페르소나"와 "프로젝트 규칙"을 장착하도록 강제합니다.

### 🚀 사용법

채팅창에 아래 명령어를 입력하세요:

```bash
@.agent/workflows/restore_context.md
```

### 📋 실행되는 작업

1. `docs/project_context.md`, `docs/project_history.md`, `docs/task.md` 등 핵심 문서들을 읽습니다.
2. 현재 프로젝트의 진행 상태와 최근 이슈를 요약하여 보고합니다.
3. **"질문은 History에 기록, 할 일은 Future Todos에 기록"**하는 행동 강령을 활성화합니다.

---

## 2. 커밋 메시지 자동 생성 (`@generate_commit`)

**파일 경로**: `.agent/workflows/generate_commit.md`

### 💡 목적

- `docs/git_convention.md`에 정의된 복잡한 커밋 메시지 규칙(Problem-Solution-Effect)을 고민할 필요 없이 자동으로 작성합니다.
- 터미널에서 바로 실행 가능한 스크립트 파일(`commit_msg.sh`)을 만들어줍니다.

### 🚀 사용법

1. 변경 사항을 Staging Area에 올립니다:
   ```bash
   git add .
   ```
2. 채팅창에 아래 명령어를 입력하세요:
   ```bash
   @.agent/workflows/generate_commit.md
   ```

### 📋 실행되는 작업

1. `git diff --cached`를 분석하여 변경 내용을 파악합니다.
2. 컨벤션에 맞춰 영문/한글 커밋 메시지를 작성합니다.
3. `commit_msg.sh` 파일을 생성합니다.
4. 사용자는 터미널에서 `./commit_msg.sh`만 입력하면 커밋이 완료됩니다.

---

## 3. 문서 현행화 (`@update_docs`)

**파일 경로**: `.agent/workflows/update_docs.md`

### 💡 목적

- 코드 변경 사항 발생 시, 관련된 프로젝트 문서(`project_history.md`, `task.md` 등)가 함께 업데이트되었는지 점검하고 누락된 내용을 채워 넣습니다.
- 문서와 코드의 싱크가 맞지 않는 상황(Documentation Drift)을 방지합니다.

### 🚀 사용법

단독으로 실행하거나, 커밋 전 점검 용도로 사용합니다.

```bash
@.agent/workflows/update_docs.md
```

> **참고**: `@generate_commit` 워크플로우 실행 시, 이 워크플로우가 **자동으로 먼저 실행**되어 문서를 최신화합니다.

### 📋 실행되는 작업

1. `git status`로 변경된 파일 목록을 확인합니다.
2. `project_history.md`, `task.md`, `walkthrough.md`, `features_list.md` 등 핵심 문서를 순회하며 업데이트가 필요한지 검토합니다.
3. 업데이트가 필요한 경우 문서 내용을 수정하고 `git add` 하여 변경 사항을 반영합니다.

---

## 💡 팁 (Tips)

- 워크플로우 파일은 단순한 마크다운 문서이므로, 프로젝트 규칙이 바뀌면 내용을 직접 수정하여 AI의 행동을 교정할 수 있습니다.
- 새로운 반복 작업이 생기면 이 폴더에 새로운 `.md` 파일을 만들어 나만의 워크플로우를 추가해보세요.
