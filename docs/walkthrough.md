# Implementation Walkthrough

> 각 버전별 구현 내용과 변경 사항을 상세히 기록합니다. 최신 버전이 상단에 옵니다.

## v0.4.0: 자동화 파이프라인 구축 (2025-12-30)

### 1. n8n 로컬 환경 설정

- **`docker-compose.yml`**: n8n을 Docker로 실행하기 위한 설정 추가 (`localhost:5678`).
- **Persistence**: `n8n_data` 볼륨을 통해 워크플로우 저장 데이터 보존.

### 2. 워크플로우 템플릿 제공

- **`docs/n8n_workflow_template.json`**: Schedule -> HTTP -> Gemini -> Supabase로 이어지는 핵심 파이프라인 템플릿 생성.
- **Gemini 프롬프트**: JSON 구조 응답을 강제하여 DB 데이터 정합성 확보.

## v0.3.0: 상세 페이지 및 데이터 페칭 개선 (2025-12-30)

### 1. 상세 페이지 구현

- **`app/expressions/[id]/page.tsx`**: 개별 표현의 상세 정보를 보여주는 페이지 구현.
- **UI 구성**: 원본 링크, 태그, 회화 예문 등을 포함한 확장된 카드 뷰.
- **Link 연동**: 메인 리스트의 카드를 클릭하면 상세 페이지로 이동하도록 `ExpressionCard` 수정.

### 2. 데이터 페칭 로직 개선 (Refactoring)

- **`lib/expressions.ts`**:
  - `getExpressionById(id)` 함수 추가.
  - 환경 변수 미설정 시 에러가 아닌 Mock 데이터로 우아하게 대체(Fallback)되도록 `try-catch` 및 로직 개선.
- **`lib/mock-data.ts`**: Mock 데이터를 별도 파일로 분리하여 재사용성 확보.

## v0.2.0: 메인 UI 및 데이터 페칭 구현 (2025-12-30)

### 1. 데이터 타입 정의

- **`types/database.types.ts`**: `Expression` 인터페이스 정의.

### 2. UI 컴포넌트 구현

- **`components/ExpressionCard.tsx`**: 개별 영어 표현을 보여주는 카드 UI. Tailwind CSS 활용.

### 3. 데이터 페칭 로직 (SSR/ISR)

- **`lib/expressions.ts`**: Supabase에서 표현 리스트를 가져오는 서버 측 함수 구현.
- **`app/page.tsx`**:
  - `getExpressions`를 사용하여 서버 컴포넌트에서 데이터 페칭.
  - `export const revalidate = 3600` 설정을 통해 1시간 간격 ISR 적용.
  - 데이터가 없을 경우를 대비한 Mock 데이터 fallback 및 Empty State UI 구현.

## v0.1.1: Supabase 클라이언트 및 환경 설정 (2025-12-30)

### 1. 의존성 설치

- `@supabase/ssr`, `@supabase/supabase-js` 패키지 설치.

### 2. Supabase 클라이언트 유틸리티 구현

- **`lib/supabase/client.ts`**: `createBrowserSupabase` - 브라우저 환경용 클라이언트 설정.
- **`lib/supabase/server.ts`**: `createServerSupabase` - 서버 컴포넌트 및 SSR용 클라이언트 설정 (Next.js 15+ `cookies()` 비동기 대응).

### 3. 환경 변수 템플릿 생성

- **`.env.local.example`**: 프로젝트 URL 및 Anon Key 설정을 위한 템플릿 파일 추가.

## v0.1.0: 프로젝트 스캐폴딩 및 설계 (2025-12-30)

- Command: `npx create-next-app@latest daily-english --ts --tailwind --eslint --app --no-src-dir`
- 기본 설정: TypeScript, Tailwind CSS, App Router 사용.

### 2. 문서화 (Documentation)

- **`docs/database_schema.md`**: Supabase `expressions` 테이블 스키마 정의 (UUID, 영어 표현, 뜻, 예문 등).
- **`docs/n8n_workflow_guide.md`**: n8n 자동화 로직 설계 (HTTP Request -> Gemini AI -> Supabase).
- **`docs/project_context.md`**: 프로젝트 규칙 및 아키텍처 정의.

### 3. 향후 계획 (Next Steps)

- Supabase 프로젝트 생성 및 테이블 실제 적용.
- Next.js에서 Supabase 클라이언트 연동 (`@supabase/ssr` 패키지 설치 예정).
- 메인 페이지 UI 구현 (카드 리스트 형태).
