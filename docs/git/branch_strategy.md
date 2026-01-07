# Git Branch Strategy & Naming Convention

## 1. 브랜치 전략 (Branching Strategy)

이 프로젝트는 **GitHub Flow**를 기반으로 한 **Feature Branch Workflow**를 따릅니다.

- **main**: 언제나 배포 가능한 상태를 유지하는 메인 브랜치입니다.
- **Feature Branches**: 새로운 기능 개발, 버그 수정, 문서 작업 등을 수행하는 임시 브랜치입니다. 작업 완료 후 PR(Pull Request)을 통해 `main`으로 병합됩니다.

## 2. 네이밍 규칙 (Naming Convention)

브랜치 이름은 **`<type>/<description>`** 형식을 따릅니다.

### 형식 (Format)

```bash
<type>/<kebab-case-description>
```

### 타입 (Types)

커밋 컨벤션(`docs/git/convention.md`)의 타입과 동일하게 사용합니다.

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 포맷팅, 수정, 추가 등
- `style`: 코드 포맷팅, 세미콜론 누락 등 (로직 변경 없음)
- `refactor`: 코드 리팩토링 (기능 변경 없음)
- `test`: 테스트 코드 추가/수정
- `chore`: 빌드, 패키지 매니저, 설정 변경 등

### 설명 (Description)

- 작업 내용을 명확하고 간결하게 **영어 소문자**와 **하이픈(-)** 으로 작성합니다 (kebab-case).
- 예시:
  - `feat/supabase-setup`
  - `fix/login-error`
  - `refactor/home-ui`
  - `docs/update-readme`

## 3. 워크플로우 (Workflow)

1. **Branch 생성**: `main` 브랜치에서 최신 상태를 pull 받은 후 새로운 브랜치를 생성합니다.
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/new-feature
   ```
2. **작업 및 Commit**: 작업을 수행하고 커밋 규칙에 따라 커밋합니다.
3. **Push 및 PR**: 원격 저장소에 푸시하고 Pull Request를 생성합니다.
4. **Merge**: 리뷰 승인 후 `main`에 병합하고 브랜치를 삭제합니다.
