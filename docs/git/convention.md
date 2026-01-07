# Git Commit Message Convention

이 프로젝트는 **변경의 이유(Why)와 영향(Impact)**을 명확히 기록하는 것을 목표로 합니다.
우리의 스타일은 **"Problem, Solution, Effect"** 구조를 따르되, 상황에 따라 유연하게 적용합니다.

## 1. 표준 양식 (Standard Format)

주요 기능 추가, 리팩토링, 버그 수정 시 사용합니다.

```text
<type>(<scope>): <Subject in English>

Problem:
- <소개: 왜 이 변경이 필요한가? 어떤 문제가 있었나?>

Solution:
- <상세: 무엇을 어떻게 변경했나?>

Effect:
- <결과: 이 변경으로 무엇이 좋아졌나? 사용자/개발자에게 미치는 영향>

--------------------------------------------------

<Subject in Korean>

문제 (Problem):
- <문제점 또는 배경 설명>

해결 (Solution):
- <변경 사항 상세 설명>

효과 (Effect):
- <결과 및 기대 효과 설명>
```

## 2. 간소화 양식 (Simplified Format)

단순 문서 수정, 스타일 변경, 사소한 자잘한 수정 시 사용합니다. 영어/한글 병기는 유지합니다.

```text
<type>(<scope>): <Subject in English>

- <Bullet point details in English>

--------------------------------------------------

<Subject in Korean>

- <상세 내용 한글 요약>
```

## 3. 타입 (Types)

| Type       | Description                       |
| ---------- | --------------------------------- |
| `feat`     | 새로운 기능 (New feature)         |
| `fix`      | 버그 수정 (Bug fix)               |
| `docs`     | 문서 수정 (Documentation)         |
| `style`    | 로직 변화 없는 포맷팅/스타일 수정 |
| `refactor` | 코드 리팩토링                     |
| `test`     | 테스트 코드                       |
| `chore`    | 빌드, 설정, 패키지 매니저 등      |

## 4. 원칙 (Principles)

1.  **영어 우선, 한글 병기**: 글로벌 표준을 따르되, 빠른 이해를 위해 한글을 포함합니다.
2.  **Why First**: 단순히 "무엇을 바꿨다"보다 "왜 바꿨다"에 집중합니다 (Problem 섹션 중요).
3.  **상세하게**: 커밋 메시지만 보고도 코드 변경의 의도를 파악할 수 있어야 합니다.
