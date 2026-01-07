# Auto-Generate Commit Message Workflow

이 워크플로우는 현재 Staging된 변경 사항을 분석하여 `git/convention.md` 규칙에 맞는 커밋 메시지를 생성하고, 이를 바로 실행할 수 있는 쉘 스크립트로 만들어줍니다.

## 0. Prerequisites (사전 작업)

**커밋 메시지를 생성하기 전에, 문서 현행화가 완료되었는지 확인해야 합니다.**

- **`@.agent/workflows/update_docs.md`** 워크플로우를 로드하여 실행하십시오.
- 해당 워크플로우를 실행한 후(문서 업데이트 사항이 없더라도) 다음 단계로 넘어가십시오.

## 1. Analyze Changes (변경 사항 분석)

1.  우선 `git status`와 `git diff --cached` 명령어를 실행하여 어떤 파일이 변경되었는지, 구체적인 코드 변경 내용은 무엇인지 파악하십시오.
2.  만약 Staged된 파일이 없다면 작업을 중단하고 사용자에게 `git add`를 먼저 하라고 안내하십시오.

## 2. Load Convention (규칙 로드)

1.  `docs/git/convention.md` 파일을 읽고 다음 규칙을 숙지하십시오:
    - **Format**: `type(scope): Subject` + `Problem / Solution / Effect` 구조.
    - **Language**: 영어 우선, 하단에 한글 요약 병기.
    - **Type**: `feat`, `fix`, `refactor`, `docs`, `chore` 등 적절한 타입 선택.

## 3. Generate & Write Script (스크립트 생성)

1.  분석된 내용을 바탕으로 커밋 메시지를 작성하십시오.
2.  `commit_msg.sh` 파일을 생성하고(덮어쓰기), 아래와 같은 형식의 Bash 스크립트를 작성하십시오.

    - **주의**: 메시지 내의 줄바꿈이나 특수문자가 깨지지 않도록 적절히 escaping 하거나 따옴표를 사용하십시오.

    ```bash
    #!/bin/bash
    git commit -m "<Type>(<Scope>): <Subject>

    Problem:
    - <Why this change?>

    Solution:
    - <What changed?>

    Effect:
    - <Impact?>

    --------------------------------------------------

    <한글 제목>

    문제 (Problem):
    - <한글 문제 설명>

    해결 (Solution):
    - <한글 해결 설명>

    효과 (Effect):
    - <한글 효과 설명>"
    ```

3.  생성된 파일에 실행 권한을 부여하십시오: `chmod +x commit_msg.sh`

## 4. Final Report

- 사용자에게 "✅ 커밋 메시지 준비 완료! 아래 명령어로 커밋을 확정하세요:" 라는 메시지와 함께 `./commit_msg.sh` 명령어를 안내하십시오.
