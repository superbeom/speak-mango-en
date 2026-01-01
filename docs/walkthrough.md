# Implementation Walkthrough

> 각 버전별 구현 내용과 변경 사항을 상세히 기록합니다. 최신 버전이 상단에 옵니다.

## v0.6.0: 콘텐츠 분류 체계 고도화 (2026-01-01)

### 1. 2단계 분류 체계 도입 (Dual-Category)

- **Schema Expansion**: `domain`(대분류)과 `category`(소분류) 컬럼을 `expressions` 테이블에 추가하여 콘텐츠 확장성 확보.
- **Migration**: 기존 데이터를 `conversation` 도메인 및 `daily` 카테고리로 일괄 업데이트하는 스크립트 작성 (`database/005_add_category_columns.sql`).

### 2. n8n 워크플로우 최적화

- **Structured Picking**: 'Pick Category' 노드에서 단순 문자열 배열 대신 `domain`, `category`, `topic`을 포함한 객체 배열을 사용하도록 리팩토링.
- **Global Context**: 특정 언어권에 국한된 '콩글리시' 카테고리를 제거하고, 전 세계 공통 주제인 '쇼핑' 등을 추가.

### 3. 다국어 데이터 동시 생성

- **Prompt Engineering**: Gemini Content Generator가 한국어, 일본어, 스페인어 데이터를 한 번에 생성하도록 프롬프트 고도화.
- **Data Integrity**: JSONB 구조(`meaning`, `content`)에 맞춰 각 언어별 키(`ko`, `ja`, `es`)를 동적으로 매핑하도록 n8n 노드 설정 변경.

## v0.5.0: 다국어(i18n) 지원 인프라 구축 (2025-12-31)

### 1. 데이터베이스 스키마 확장

- **i18n Schema**: `meaning` 컬럼을 `JSONB`로 변경하고, `content` 구조를 언어 코드별로 계층화(`{ "ko": { ... } }`)함.
- **Generic Keys**: `dialogue` 내부의 언어별 키(`kr`, `jp` 등)를 중립적인 `translation` 키로 통일하여 확장성 확보.

### 2. 동적 언어 감지 및 미들웨어

- **`middleware.ts`**: 브라우저의 `Accept-Language` 헤더를 분석하여 커스텀 헤더(`x-locale`)를 전달하는 로직 구현.
- **Server-side Helper**: 서버 컴포넌트에서 언어와 딕셔너리를 쉽게 가져올 수 있는 `getI18n()` 헬퍼 함수 (`lib/i18n/server.ts`) 추가.

### 3. 중앙 집중식 문자열 관리

- **Locales**: `lib/i18n/locales/` 내에 `ko.ts`, `en.ts` 등으로 다국어 문자열 분리 관리.
- **Refactoring**: 메인 페이지, 상세 페이지, 카드 컴포넌트의 하드코딩된 문자열을 딕셔너리 기반으로 전면 교체.

## v0.4.2: AI 프롬프트 고도화 및 파이프라인 최적화 (2025-12-31)

### 1. 프롬프트 페르소나 일관성 강화

- **Prompt Engineering**: Gemini Content Generator 프롬프트에 실서비스 데이터 예시 3종을 추가하여 스타일 학습 유도.
- **Constraint**: 특정 집단(학생 등)을 지칭하는 호칭 사용 금지 및 2030 타겟의 세련된 톤 앤 매너 적용.

### 2. JSON 파싱 로직 추가

- **`Parse JSON` Node**: Gemini의 마크다운 코드 블록(` ```json `)이 포함된 응답을 순수 JSON 객체로 변환하는 JavaScript 로직 구현.
- **Error Handling**: 파싱 실패 시 원본 데이터를 로깅하도록 예외 처리.

### 3. n8n 백업 체계 수립

- **`docs/n8n_workflow_guide.md`**: 워크플로우 Export/Import 가이드 추가.

## v0.4.1: n8n 데이터 지속성 설정 개선 (2025-12-31)

### 1. Docker Volume -> Bind Mount 변경

- **`docker-compose.yml`**: 데이터 초기화 문제 해결을 위해 n8n 데이터 저장 경로를 Docker Volume에서 로컬 디렉토리 바인딩(`user -> ./n8n_data:/home/node/.n8n`)으로 변경.
- **`.gitignore`**: 로컬 DB 파일이 커밋되지 않도록 `n8n_data/` 추가.

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

- **`types/database.ts`**: `Expression` 인터페이스 정의.

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
