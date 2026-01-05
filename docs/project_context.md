# Project Context & Rules: Speak Mango

**최종 수정일**: 2026-01-05

## 1. 프로젝트 개요 (Project Overview)

- **서비스명**: Speak Mango (매일 만나는 영어 표현)
- **목적**: Speak Mango 플랫폼의 영어 학습 서브 서비스. 유용한 영어 표현을 자동으로 생성 및 가공(AI)하여 업로드하는 자동화 블로그 구축.
- **핵심 가치**:
  - **자동화 (Automation)**: n8n + AI를 통해 콘텐츠 수집 및 가공 비용 최소화.
  - **학습 효율 (Efficiency)**: 매일 하나의 핵심 표현만 제공하여 학습 부담 감소.
  - **SEO 최적화**: Next.js의 ISR을 활용하여 검색 엔진 친화적인 콘텐츠 제공.

## 2. 시스템 아키텍처 (System Architecture)

```mermaid
graph TD
    subgraph Automation [n8n Workflow]
        Scheduler[Daily Trigger] -->|1. Start| Category[Random Category]
        Category -->|2. Select Topic| Generator1[Gemini (Generate Expression)]
        Generator1 -->|3. Expression| DB_Check{Duplicate Check}
        DB_Check -->|New| Generator2[Gemini (Generate Content)]
        DB_Check -->|Exists| Skip[End Workflow]
        Generator2 -->|4. Final Data| DB[(Supabase DB)]
    end

    subgraph Service [Next.js App]
        DB -->|5. Fetch Data| ISR[Incremental Static Regeneration]
        ISR -->|6. Render| UI[Card Interface]
        User[Visitor] -->|7. Read| UI
    end
```

## 3. 기술 스택 (Tech Stack)

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS.
- **Database**: Supabase (PostgreSQL).
- **Automation**: n8n (Self-hosted or Cloud).
- **AI Engine**: Google Gemini 2.5 Flash (Free Tier).
- **Package Manager**: yarn.

## 4. 디렉토리 구조 (Directory Structure)

```
speak-mango-en/
├── .agent/              # 에이전트 워크플로우 및 설정
├── app/                 # Next.js App Router Pages
│   ├── page.tsx         # 메인 페이지 (표현 리스트)
│   ├── layout.tsx       # 레이아웃
│   └── globals.css      # 전역 스타일
├── components/          # React 컴포넌트
│   └── ui/              # 재사용 가능한 UI 컴포넌트 (Card, Button 등)
├── database/            # 데이터베이스 마이그레이션 스크립트 (SQL)
├── hooks/               # 커스텀 React 훅
├── i18n/                # 다국어 지원 로직 및 번역 파일
├── lib/                 # 핵심 로직 및 유틸리티
│   ├── supabase/        # Supabase 클라이언트 설정 (server/client)
│   └── utils.ts         # 공통 유틸리티 함수
├── types/               # TypeScript 타입 정의
│   └── database.ts      # Supabase Generated Types
├── docs/                # 프로젝트 문서의 중앙 저장소 (Docs as Code)
│   ├── project_context.md   # 전체 프로젝트의 규칙, 아키텍처, 상태 정의 (Single Source of Truth)
│   ├── project_history.md   # 주요 의사결정 이력 및 Q&A 로그
│   ├── technical_implementation.md # 주요 기능의 기술적 구현 상세 및 알고리즘
│   ├── task.md              # 작업 목록 및 진행 상태 관리
│   ├── future_todos.md      # 기술 부채, 아이디어, 개선 사항 백로그
│   ├── feature_ideas.md     # 추가 기능 아이디어 및 브레인스토밍
│   ├── features_list.md     # 구현 완료된 기능 목록 정리
│   ├── walkthrough.md       # 버전별 기능 구현 상세 및 검증 내역
│   ├── database_schema.md   # DB 스키마 정의
│   ├── monetization_brainstorming.md # 수익화 브레인스토밍 및 Q&A (원본)
│   ├── monetization_ideas.md # 수익화 및 성장 전략 아이디어 요약
│   ├── monetization_strategy.md # 수익화 및 성장 전략 구현 로드맵
│   ├── n8n_optimization_steps.md # AI 기반 생성 가이드
│   ├── n8n_workflow_guide.md # n8n 자동화 설정 가이드
│   ├── n8n_user_guide.md    # 서비스 및 n8n 워크플로우 운영자 가이드
│   ├── agent_workflows.md   # AI 에이전트 워크플로우 가이드
│   ├── supabase_strategy.md # Supabase 다중 프로젝트 관리 전략
│   ├── git_convention.md    # 커밋 메시지 작성 규칙
│   └── git_branch_strategy.md # 브랜치 생성 및 관리 전략
└── ...설정 파일들
```

## 5. 코딩 컨벤션 (Coding Conventions)

### General

- **언어**: TypeScript 엄수. `any` 사용 지양.
- **절대 경로**: `@/` alias 사용 (예: `import { createClient } from '@/lib/supabase/server'`).

### Naming Conventions

- **File Names**:
  - **Components (`components/`)**: `PascalCase` (예: `ExpressionCard.tsx`)
  - **Utilities & Logic (`lib/`)**: `kebab-case` (예: `ui-config.ts`, `expressions.ts`)
  - **Pages (`app/`)**: Next.js App Router 규칙 준수 (`page.tsx`, `layout.tsx` 등)
- **Export Style**:
  - **Components**: `export default function ComponentName` (Default Export)
  - **Utilities**: `export const functionName` (Named Export)

### Component Architecture

- **모듈화 및 재사용성 (Modularity)**: 독립적으로 구성 가능한 요소는 반드시 컴포넌트로 분리합니다. 함수와 유틸리티는 재사용성을 최우선으로 설계합니다.
- **관심사 분리 (Separation of Concerns)**:
  - **Presentational Component**: UI 렌더링에만 집중하며, 데이터는 `props`로 주입받습니다. 비즈니스 로직을 포함하지 않습니다.
  - **Container Component**: 데이터 페칭 및 비즈니스 로직을 처리하고, 결과를 Presentational 컴포넌트에 전달합니다.
- **독립성 (Independence)**: 컴포넌트는 외부 상태에 의존하지 않고 주입받은 `props`만으로 렌더링되어야 합니다.
- **스켈레톤 로딩 전략 (Skeleton Loading Strategy)**:
  - **목적**: 데이터 페칭 중 사용자 경험(UX) 향상 및 레이아웃 흔들림(CLS) 방지.
  - **적용 대상**: 서버에서 데이터를 가져오는 모든 주요 컴포넌트 및 레이아웃 유지를 위해 필요한 상단 요소(`SearchBar`, `FilterBar`, `ExpressionCard` 등).
  - **구현 원칙**: 새로운 데이터 의존 컴포넌트 생성 시, 해당 컴포넌트의 레이아웃을 모사하는 스켈레톤 컴포넌트를 반드시 세트로 함께 구현합니다.
  - **관리**: `components/ui/Skeletons.tsx`에 재사용 가능한 스켈레톤 컴포넌트들을 모아 관리합니다.

### Frontend

- **스타일링**: Tailwind CSS 유틸리티 클래스 사용. 커스텀 CSS 지양.
- **Global Variables & Utilities**:
  - **Theme Variables (`@theme`)**: 여러 속성에서 재사용되는 디자인 토큰(예: `height`, `top`, `padding` 등에서 쓰이는 `--header-height`)은 `app/globals.css`의 `@theme` 블록에 CSS 변수로 정의하여 사용합니다.
  - **Custom Utilities (`@utility`)**: 특정 속성 조합이 반복될 때(예: `max-width` 설정)는 `@utility` 블록에 커스텀 유틸리티 클래스(예: `max-w-layout`)를 정의하여 사용합니다.
  - 하드코딩된 값 대신 위에서 정의한 변수와 유틸리티를 사용하여 레이아웃 일관성을 유지합니다.
- **모바일 최적화 (Mobile Optimization)**: 새로운 페이지나 컴포넌트 추가 시 모바일 환경을 최우선으로 고려합니다. Tailwind의 반응형 유틸리티(`sm:`, `md:` 등)를 활용하여 작은 화면에서도 가독성과 사용성이 확보되도록 패딩, 텍스트 크기, 레이아웃을 최적화합니다.
  - **Hover Effects**: 모바일(터치 디바이스)에서는 호버 효과(`hover:` 클래스, `whileHover` 애니메이션 등)를 비활성화해야 합니다. 터치 스크롤 시 의도치 않은 시각적 피드백이나 애니메이션이 발생하는 것을 방지하기 위해 `useIsMobile` 훅을 사용하여 조건부로 적용합니다.
- **Reusable UI Logic**: 스크롤 감지, 화면 크기 확인 등 반복되는 UI 동작 로직은 커스텀 훅(예: `useScroll`, `useIsMobile`)으로 추출하여 `hooks/` 디렉토리에서 관리합니다. 이를 통해 컴포넌트 코드를 간결하게 유지하고 로직 중복을 최소화합니다.
- **데이터 페칭**: Server Components에서 직접 DB 접근을 선호하며, 클라이언트 측은 필요한 경우에만 최소화.
- **타입 안정성**: DB 데이터는 Supabase에서 생성된 타입을 사용하거나 명시적 인터페이스로 정의.

### Database

- **운영 전략**: `docs/supabase_strategy.md`에 따라 단일 Pro 프로젝트 내 **스키마 분리** 전략을 사용합니다.
- **스키마 명**: `speak_mango_en` (기본 public 스키마 사용 지양).

### Automation (n8n)

- **에러 처리**: 스크래핑 실패나 AI 응답 오류 시에도 워크플로우가 중단되지 않도록 Error Trigger 또는 대체 로직 구성.
- **비용 관리**: Gemini API 호출 시 토큰 절약을 위해 불필요한 HTML 태그는 사전 제거.

## 6. 워크플로우 가이드라인 (Workflow Guidelines)

1.  **세션 시작 (Initialization)**:
    - 작업 전 `docs/project_history.md`와 `docs/task.md`를 확인하여 이전 작업 내용 및 우선순위를 파악합니다.
2.  **Git 전략**:
    - `docs/git_branch_strategy.md`에 따라 기능별 브랜치(`feat/...`)를 생성하여 작업합니다.
    - `docs/git_convention.md`에 맞춰 커밋 메시지를 작성합니다 ("Why" 중심).
3.  **이력 기록 및 작업 관리**:
    - 주요 변경 사항은 `project_history.md`에, 구현 상세는 `walkthrough.md`에 기록합니다.
    - 진행 중인 작업은 `task.md`에서 실시간으로 업데이트합니다.
4.  **기술 부채 관리**:
    - 코드 개선이 필요하거나 추후 작업이 필요한 항목은 `future_todos.md`에 기록합니다.
5.  **문서화**:
    - DB 스키마 변경 시 `docs/database_schema.md`를 반드시 최신화합니다.
    - Supabase 운영 방식은 `docs/supabase_strategy.md`를 따릅니다.
6.  **에이전트 활용**:
    - `.agent/workflows/` 내의 워크플로우(`@restore_context`, `@generate_commit`, `@update_docs`)를 적극 활용하여 작업 효율성을 높입니다 (`docs/agent_workflows.md` 참조).

## 7. 주요 제약 사항 & 이슈

- **Gemini Free Tier**: 분당 15회 요청 제한이 있으므로, n8n 루프 실행 시 `Wait` 노드를 통해 속도를 조절해야 함.
- **Supabase Free Tier**: 데이터베이스 용량(500MB)을 고려하여 불필요한 로그 데이터는 주기적으로 정리 필요.

## 8. 수익화 전략 (Monetization Strategy)

- **핵심 모델**: Freemium + Monthly Subscription (PayPal, $9.99/mo).
- **데이터 전략**: Hybrid Storage (Free: LocalStorage / Pro: Supabase DB).
- **전환 트리거**: 데이터의 영구 보존 및 멀티 디바이스 연동 욕구 자극.
- **참고 문서**:
  - `docs/monetization_brainstorming.md` (수익화 Q&A 원본)
  - `docs/monetization_ideas.md` (전략 및 아이디어 요약)
  - `docs/monetization_strategy.md` (구현 로드맵)
