# Project Context & Rules: Speak Mango

**최종 수정일**: 2026-02-04

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
│   ├── skills/          # Vercel 에이전트 스킬 (성능 최적화, 디자인 가이드)
│   └── workflows/       # 자동화 워크플로우
├── app/                 # Next.js App Router Pages
│   ├── page.tsx         # 메인 페이지 (표현 리스트)
│   ├── layout.tsx       # 레이아웃
│   ├── template.tsx     # 페이지 전환 초기화 (스크롤 리셋 등)
│   └── globals.css      # 전역 스타일
├── analytics/           # 사용자 행동 분석 (Google Analytics 4)
│   ├── index.ts                # 이벤트 추적 유틸리티 함수 (12개 핵심 이벤트)
│   ├── AnalyticsProvider.tsx   # 페이지 뷰 자동 추적 Provider
│   └── ExpressionViewTracker.tsx # 표현 조회 추적 컴포넌트
├── components/          # React 컴포넌트
│   ├── actions/         # 액션 관련 공통 컴포넌트
│   ├── ui/              # 재사용 가능한 UI 컴포넌트 (Skeletons, Toast, InteractiveLink 등)
├── constants/           # 전역 상수 관리
│   ├── index.ts         # 일반 상수 (서비스명, DB 스키마 등)
│   └── events.ts        # 이벤트 상수 (오디오 재생 등)
├── context/             # 전역 상태 관리 (Context API)
├── database/            # 데이터베이스 관리
│   ├── migrations/      # 마이그레이션 스크립트 (SQL) - 테이블 생성/변경
│   ├── functions/       # 데이터베이스 함수 (RPC) - 성능 최적화 로직
│   └── triggers/        # 트리거 함수 및 정의 - 자동화된 데이터 관리
├── hooks/               # 커스텀 React 훅
│   ├── user/            # 사용자 및 인증 관련 훅 (useAuthUser, useUserActions)
│   └── quiz/            # 퀴즈 게임 관련 훅 (useQuizGame)
├── i18n/                # 다국어 지원 로직 및 번역 파일
├── lib/                 # 핵심 로직 및 유틸리티
│   ├── auth/            # 인증 설정 및 유틸리티
│   │   └── config.ts    # NextAuth 설정 (Google Provider, Session Strategy)
│   ├── supabase/        # Supabase 클라이언트 설정 (server/client)
│   ├── routes.ts        # 라우트 상수 및 경로 생성 로직 (중앙 관리)
│   └── utils.ts         # 공통 유틸리티 함수
├── services/            # 비즈니스 로직 및 데이터 접근 서비스
│   ├── actions/         # Next.js Server Actions (user context 등)
│   └── repositories/    # 데이터 레이어 추상화 (Local/Remote Hybrid Pattern)
├── store/               # 전역 상태 관리 (Zustand)
│   └── useLocalActionStore.ts # 로컬 액션 상태 (localStorage 연동)
├── n8n/                 # n8n 자동화 관련 설정 및 템플릿
│   └── expressions/     # 영어 표현(Expressions) 생성 워크플로우
│       ├── code/        # 각 노드의 JavaScript 코드 파일 (단계별 분리)
│       └── expressions_workflow_template.json # 워크플로우 템플릿
├── scripts/             # 유틸리티 및 자동화 스크립트 (Python)
│   └── generate_studio_images.py # 스튜디오 이미지 일괄 생성 스크립트
├── types/               # TypeScript 타입 정의
│   ├── database.ts      # Supabase Generated Types
│   └── toast.ts         # Toast 알림 타입 및 상수
├── verification/        # 데이터 검증 스크립트
│   ├── verify_db_data.js       # 로컬 데이터 검증 (Strict Validation)
│   └── verify_i18n_locales.js  # i18n 언어팩 일관성 검증
├── docs/                # 프로젝트 문서의 중앙 저장소 (Docs as Code)
│   ├── n8n/                 # n8n 자동화 관련 가이드
│   │   └── expressions/     # 영어 표현 워크플로우 문서
│   │       ├── optimization_steps_v2.md # V2 (Single-Shot) AI 생성 가이드
│   │       ├── optimization_steps_v3.md # V3 (Specific) AI 생성 가이드
│   │       ├── optimization_steps.md    # (Legacy) V1 AI 생성 가이드
│   │       ├── workflow_guide.md        # n8n 자동화 설정 가이드
│   │       └── user_guide.md            # 서비스 및 n8n 워크플로우 운영자 가이드
│   ├── marketing/           # 마케팅 가이드 및 리소스
│   │   └── studio_guide.md       # 마케팅 스튜디오 및 자동화 스크립트 사용 가이드
│   ├── monetization/        # 수익화 전략 문서
│   │   ├── brainstorming.md      # 수익화 브레인스토밍 및 Q&A (원본)
│   │   ├── ideas.md              # 수익화 및 성장 전략 아이디어 요약
│   │   └── strategy.md           # 수익화 및 성장 전략 구현 로드맵
│   ├── database/            # 데이터베이스 관련 문서
│   │   ├── schema.md             # DB 스키마 정의
│   │   └── supabase_strategy.md  # Supabase 다중 프로젝트 관리 전략
│   ├── git/                 # Git 관련 규칙
│   │   ├── convention.md         # 커밋 메시지 작성 규칙
│   │   └── branch_strategy.md    # 브랜치 생성 및 관리 전략
│   ├── product/             # 제품 기획 및 관리 문서
│   │   ├── content_strategy.md   # 콘텐츠 전략
│   │   ├── feature_ideas.md      # 추가 기능 아이디어 및 브레인스토밍
│   │   ├── features_list.md      # 구현 완료된 기능 목록 정리
│   │   └── future_todos.md       # 기술 부채, 아이디어, 개선 사항 백로그
│   ├── analytics/          # Analytics 관련 문서
│   │   ├── analytics_guide.md        # Analytics 전략 및 이벤트 설계
│   │   └── implementation_guide.md   # 실전 구현 가이드 (재사용 가능)
│   ├── seo_strategy.md      # SEO 전략 및 구현 가이드 (Dynamic & Visible Keywords)
│   ├── project_context.md   # 전체 프로젝트의 규칙, 아키텍처, 상태 정의 (Single Source of Truth)
│   ├── project_history.md   # 주요 의사결정 이력 및 Q&A 로그
│   ├── technical_implementation/    # 주요 기능의 기술적 구현 상세
│   │   ├── index.md                 # 구현 개요 및 알고리즘
│   │   └── use_swr_strategy.md      # Client-Side Data Fetching (useSWR) 전략
│   ├── task.md              # 작업 목록 및 진행 상태 관리
│   ├── walkthrough.md       # 버전별 기능 구현 상세 및 검증 내역
│   ├── agent_workflows.md   # AI 에이전트 워크플로우 가이드
│   └── agent_skills_guide.md # AI 에이전트 스킬 가이드 (Vercel Best Practices)
└── ...설정 파일들
```

## 5. 코딩 컨벤션 (Coding Conventions)

### General

- **언어**: TypeScript 엄수. `any` 타입 사용을 지양하며, 불가피한 경우 `unknown`과 타입 가드(Type Guard)를 사용하거나 명시적인 인터페이스를 정의해야 합니다. (ESLint `no-explicit-any` 규칙 준수)
- **Global Type Management**: Window 인터페이스 확장(`declare global`)은 별도의 `.d.ts` 파일(`types/analytics.d.ts`, `types/global.d.ts`)로 중앙 관리하여 코드베이스 전체의 타입 정의를 정리하고 충돌을 방지합니다.
- **절대 경로**: `@/` alias 사용 (예: `import { createClient } from '@/lib/supabase/server'`).

### Naming Conventions

- **File Names**:
  - **Components (`components/`)**: `PascalCase` (예: `ExpressionCard.tsx`)
  - **Utilities & Logic (`lib/`)**: `kebab-case` (예: `ui-config.ts`, `expressions.ts`)
  - **Pages (`app/`)**: Next.js App Router 규칙 준수 (`page.tsx`, `layout.tsx` 등)
- **Export Style**:
  - **Components**: `export default function ComponentName` (Default Export)
  - **Utilities**: `export const functionName` (Named Export)
- **Variables & Constants**:
  - **Constants**: `UPPER_SNAKE_CASE` 사용 (예: `DATABASE_SCHEMA`).
  - **Event Names (Constants)**: 변수명은 `UPPER_SNAKE_CASE`로 작성하되, 실제 값(Value)은 `snake_case` 소문자를 사용합니다 (예: `AUDIO_PLAYBACK_START = "audio_playback_start"`). 이는 `click`, `play` 등 브라우저 표준 DOM 이벤트 네이밍 관례와의 일관성을 유지하기 위함입니다.

### Routing

- **중앙 관리**: 앱 내의 모든 경로는 `lib/routes.ts` 파일의 `ROUTES` 상수를 통해 관리해야 합니다.
- **하드코딩 금지**: 컴포넌트나 함수 내부에서 경로 문자열(예: `"/expressions/..."`)을 직접 작성하는 것을 엄격히 금지합니다.
- **동적 경로**: 상세 페이지 등 매개변수가 필요한 경로는 `ROUTES.EXPRESSION_DETAIL(id)`와 같은 생성 함수를 사용합니다.
- **필터 조합**: 검색어, 카테고리 등 쿼리 파라미터가 포함된 홈 경로는 `getHomeWithFilters()` 헬퍼 함수를 사용하여 생성합니다.
- **레이아웃 초기화**: 상세 페이지(`/expressions/[id]`)와 같이 페이지 진입 시마다 일관된 초기 상태(스크롤 리셋 등)가 필요한 경우, `page.tsx` 대신 `template.tsx`를 활용하여 프레임워크 수준에서의 초기화를 강제합니다.

### Scroll Management (스크롤 관리 전략)

메인 페이지의 커스텀 캐싱 복원과 상세 페이지의 브라우저 기본 복원 간의 조화를 위한 규칙입니다.

- **메인 페이지 (Home)**: `manual` 모드를 사용하며, `ExpressionContext`의 캐시를 통해 필터별로 데이터와 스크롤 위치를 독립적으로 관리합니다.
- **상세 페이지 (Detail)**: `auto` 모드를 우선하며, 브라우저의 기본 기능을 활용합니다.
- **스크롤 리셋 (Scroll Reset)**:
  - 새로운 상세 페이지 진입 시(`push`)에는 `sessionStorage`에 `SCROLL_RESET_KEY`를 설정하여 `template.tsx`에서 감지하고 `window.scrollTo(0, 0)`을 실행합니다.
  - 뒤로가기(`back`) 시에는 플래그가 없으므로 브라우저가 위치를 자동 복원하도록 설계합니다.
  - 리스트 컴포넌트(`ExpressionList`) 언마운트 시에는 항상 설정을 `auto`로 복구하여 부작용을 방지합니다.

### 퀴즈 상태 관리 (Quiz State Management)

- **공공 저장소**: `sessionStorage`를 활용하여 퀴즈 진행 상태를 관리합니다 (`lib/quiz.ts` 내 `QUIZ_STORAGE_KEYS` 참조).
- **상태 보존 (Persistence)**:
  - 퀴즈 도중 '공부하기' 버튼을 클릭하여 이동할 때 `RETURN_FLAG`를 설정합니다.
  - 뒤로가기로 복귀 시, 해당 플래그가 존재하면 `STATE`를 읽어 기존 진행 상황(문제, 점수 등)을 복원합니다.
- **초기화 (Reset)**:
  - 페이지 새로고침(Refresh)이나 직접 진입 시에는 플래그가 없으므로 기존 상태를 삭제하고 퀴즈를 처음부터 시작합니다.
  - 사용자 의도에 따른 리셋(새 퀴즈 시작 버튼) 시에도 스토리지를 명시적으로 비웁니다.
- **네비게이션**:
  - 모바일 UX 일관성을 위해 모바일(터치 기기) 환경에서는 '공부하기' 링크가 새 탭이 아닌 현재 탭에서 동작하도록 `useIsMobile` 훅으로 제어합니다.

### Audio Asset Management

- **저장소**: 모든 원어민 대화 음성 파일(TTS)은 Supabase Storage의 `speak-mango-en` 버킷에 저장합니다.
- **경로 규칙**: `expressions/{expression_id}/{line_index}.wav` 형식을 엄수합니다.
- **데이터 바인딩**: DB의 `content` JSONB 데이터 내 `audio_url` 필드에는 **스토리지 내부 상대 경로**를 저장합니다. 실제 재생을 위한 절대 URL 변환은 클라이언트 컴포넌트(`DialogueAudioButton`)에서 재생 시점에 수행됩니다.
- **확장성 가이드**: 버킷명을 특정 용도(예: `audio`)가 아닌 프로젝트명(`speak-mango-en`)으로 설정함으로써, 향후 `users/`, `images/`, `vocabulary/` 등 다른 종류의 파일들도 동일한 버킷 하위 폴더로 격리하여 관리할 수 있습니다. 이는 루트 경로의 혼잡을 방지하고 관리 효율성을 높입니다.
- **보안 전환 주의**: 현재는 **Public** 버킷을 사용 중이나, 향후 유료 기능(Feature Gating) 도입 시 버킷을 **Private**으로 전환하고 **RLS(Storage Policies)** 설정을 통해 접근 권한을 제어해야 합니다 (`docs/database/supabase_strategy.md` 참조).

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
- **인터랙션 및 애니메이션 제어 (Interaction & Animation Control)**:
  - **Clickable Link Cards**: 특정 카드 전체가 링크인 경우, 내부의 버튼(좋아요, 저장 등) 클릭 시 카드 전체의 반응(애니메이션)을 차단해야 합니다.
  - **InteractiveLink**: `whileTap` 대신 `useAnimation`을 사용하는 `InteractiveLink` 컴포넌트를 활용하여 클릭 대상에 따른 조건부 애니메이션을 실행합니다.
  - **Event Delegation**: 액션 버튼 그룹(`ActionButtonGroup`)은 `data-action-buttons` 마킹과 `e.stopPropagation()`을 통해 부모의 인터랙션 간섭을 원천 차단합니다.
- **범용 확인 시스템 (Global Confirmation Strategy)**:
  - 삭제나 중요 설정 변경 등 되돌리기 어려운 작업 전에는 반드시 `useConfirm` 훅을 통한 사용자 확인 과정을 거쳐야 합니다.
  - **Usage**: `const confirmed = await confirm({ title: "...", message: "..." })`
  - **Consistency**: 개별 컴포넌트에서 브라우저의 `window.confirm()`을 사용하지 않고, 앱 디자인 가이드라인을 따르는 전역 `ConfirmDialog`를 사용합니다.

### Frontend

- **스타일링**: Tailwind CSS 유틸리티 클래스 사용. 커스텀 CSS 지양.
- **Global Variables & Utilities**:
  - **Theme Variables (`@theme`)**: 여러 속성에서 재사용되는 디자인 토큰(예: `height`, `top`, `padding` 등에서 쓰이는 `--header-height`)은 `app/globals.css`의 `@theme` 블록에 CSS 변수로 정의하여 사용합니다.
    - `--header-height`: GNB 높이
    - `--radius-card`: 전체 서비스 공통 카드 곡률 (현재 `1.5rem` / `3xl` 수준)
  - **Custom Utilities (`@utility`)**: 특정 속성 조합이 반복될 때(예: `max-width` 설정)는 `@utility` 블록에 커스텀 유틸리티 클래스(예: `max-w-layout`)를 정의하여 사용합니다.
    - `max-w-layout`: 중앙 정렬 컨테이너 최대 너비
    - `rounded-card`: 서비스 표준 카드 곡률 적용 (`border-radius: var(--radius-card)`)
  - 하드코딩된 값 대신 위에서 정의한 변수와 유틸리티를 사용하여 레이아웃 일관성을 유지합니다.
- **모바일 최적화 (Mobile Optimization)**: 새로운 페이지나 컴포넌트 추가 시 모바일 환경을 최우선으로 고려합니다. Tailwind의 반응형 유틸리티(`sm:`, `md:` 등)를 활용하여 작은 화면에서도 가독성과 사용성이 확보되도록 패딩, 텍스트 크기, 레이아웃을 최적화합니다.
  - **Hover Effects**: 터치 스크롤 시 의도치 않은 시각적 피드백이나 애니메이션이 발생하는 것을 방지하기 위해 모바일(터치 디바이스)에서는 호버 효과(`hover:` 클래스, `whileHover` 애니메이션 등)를 비활성화해야 합니다. `useIsMobile` 훅 대신 Tailwind의 `sm:hover:` 유틸리티를 사용하여 CSS 레벨에서 데스크탑 전용 호버 효과를 적용하는 것을 권장합니다. 이는 SSR 호환성 및 렌더링 성능에 유리합니다.
  - **Clickable Elements**: 버튼, 링크, 칩 등 클릭 가능한 모든 요소에는 `cursor-pointer` 클래스를 명시적으로 적용하여 데스크탑 환경에서의 Affordance를 보장합니다.
- **Reusable UI Logic**: 스크롤 감지, 화면 크기 확인 등 반복되는 UI 동작 로직은 커스텀 훅(예: `useScroll`, `useIsMobile`)으로 추출합니다.
  - **Responsive Strategy**: 화면 크기에 따른 분기 처리는 다음 규칙을 따릅니다.
    - **Rendering & Styling (Preferred)**: 단순한 보이기/숨기기나 스타일 변경은 **Tailwind 반응형 유틸리티**(`hidden sm:block`, `w-full sm:w-auto`, `sm:hover:`)를 최우선으로 사용합니다. 이는 SSR 호환성을 보장하고 초기 로딩 성능(LCP)을 높입니다.
    - **Logic & Animation (Fallback)**: CSS로 처리가 불가능한 자바스크립트 로직(예: 모바일 전용 터치 이벤트, Framer Motion 애니메이션 값 변경)이 필요한 경우에만 제한적으로 `useIsMobile` 훅을 사용합니다. 이때는 반드시 `useEffect` 등을 통해 클라이언트 사이드에서만 실행되도록 처리하여 Hydration Mismatch를 방지해야 합니다.
- **Toast Notification System**: 사용자 피드백이 필요한 액션(복사, 저장, 공유 등)에는 `context/ToastContext.tsx`를 통해 제공되는 `useToast()` 훅을 활용합니다.
  - **Global Context**: 앱 최상위에서 `ToastProvider`가 관리하므로, 개별 컴포넌트에서 `Toast` UI를 직접 렌더링할 필요가 없습니다.
  - **Type Safety**: `types/toast.ts`에 정의된 `ToastType` 및 `TOAST_TYPE` 상수를 사용하여 타입 안정성 확보.
  - **Consistency**: 모든 알림은 중앙화된 컨텍스트를 통해 동일한 애니메이션과 디자인으로 제공됩니다.
- **Error Handling Strategy**:
  - **Hook**: `hooks/useAppErrorHandler.ts`를 사용하여 에러 처리 로직을 중앙화합니다. `try/catch` 블록 내에서 `handleError(e)`를 호출하면 표준화된 로깅과 UI 알림(Toast)이 자동으로 수행됩니다.
  - **Server Action Wrapper (`withPro`)**: `lib/server/actionUtils.ts`의 `withPro` 고차 함수를 사용하여 서버 액션의 세션 인증 및 Pro 티어 검증을 일원화합니다. 보안이 필요한 모든 원격 액션은 이 래퍼를 통해 보호되어야 합니다.
  - **Types**: `types/error.ts`의 `ErrorCode` Enum을 사용하여 에러 케이스를 정의하고, 하드코딩된 문자열 에러 메시지 사용을 지양합니다.
- **데이터 페칭**: Server Components에서 직접 DB 접근을 선호하며, 클라이언트 측은 필요한 경우에만 최소화.
- **타입 안정성**: DB 데이터는 Supabase에서 생성된 타입을 사용하거나 명시적 인터페이스로 정의.
- **성능 최적화 (Performance Optimization)**:
  - **Server-Side Caching**: DB 조회 함수는 `React.cache`로 래핑하여 동일 요청 내 중복 쿼리를 제거합니다 (Request Deduplication).
  - **Client-Side Memoization**: 리스트 아이템 등 빈번한 리렌더링이 예상되는 컴포넌트는 `React.memo`를 적용합니다.
  - **Layout Optimization**: 긴 리스트에는 `content-visibility: auto`를 적용하여 렌더링 성능을 개선합니다.
  - **Data Fetching Strategy**: `docs/technical_implementation/use_swr_strategy.md` (useSWR 활용 가이드)
- **Custom Hook Pattern**: 복잡한 상태 관리와 비즈니스 로직을 컴포넌트로부터 분리하여 재사용 가능한 커스텀 훅으로 추출합니다.
  - **State Management**: `useReducer`를 활용한 예측 가능한 상태 전환 패턴 (`hooks/quiz/useQuizGame.ts`)
  - **Separation of Concerns**: UI 컴포넌트는 렌더링에, 커스텀 훅은 비즈니스 로직에 집중하여 관심사 분리
  - **Reusability**: 훅을 통해 동일한 로직을 여러 컴포넌트에서 재사용
  - **Type Safety**: 훅의 반환 타입을 명시적으로 정의하여 컴포넌트에서의 타입 추론을 돕습니다.

### Database

- **운영 전략**: `docs/database/supabase_strategy.md`에 따라 단일 Pro 프로젝트 내 **스키마 분리** 전략을 사용합니다.
- **메인 스키마**: `speak_mango_en` (User Data).
- **인증 스키마**: `speak_mango_en_next_auth` (NextAuth View Layer).

### Internationalization (i18n)

- **중앙 관리**: 모든 다국어 설정은 `i18n/index.ts`에서 관리하며, `LOCALE_DETAILS`에 언어별 메타데이터(언어별 코드, 표시명, OG용 로케일 등)가 정의되어 있습니다.
- **아키텍처 (Server / Client 분리)**:
  - **Server Components**: `i18n/server.ts`의 `getI18n()`, `getLocale()` 헬퍼를 사용하여 직접 딕셔너리를 로드합니다.
  - **Client Components**: `context/I18nContext.tsx`의 `I18nProvider`와 `useI18n()` 훅을 사용합니다. **Prop Drilling을 방지하기 위해 말단 클라이언트 컴포넌트에서는 반드시 Context를 통해 `dict`와 `locale`에 접근해야 합니다.**
- **지원 언어 (9개 국어)**: EN, KO, JA, ES, FR, DE, RU, ZH, AR.
- **Type Safety**: `Dictionary` 타입을 `en.ts` 기준으로 추론하여 모든 언어 파일의 키 일관성을 강제합니다. 코드 내에서 'en', 'ko' 등 하드코딩된 문자열 대신 `SupportedLanguage` 상수를 사용해야 합니다.
- **새로운 언어 추가 시 절차**:
  1. `i18n/locales/{lang}.ts` 딕셔너리 파일 생성.
  2. `i18n/index.ts`의 `SupportedLanguage` 상수에 새 언어 코드 추가.
  3. `i18n/index.ts`의 `dictionaries` 객체에 import 및 매핑 추가.
  4. `i18n/index.ts`의 `LOCALE_DETAILS` 객체에 해당 언어의 상세 정보(label, tag, ogLocale) 추가.
  5. `SUPPORTED_LANGUAGES`는 `Object.values(SupportedLanguage)`를 사용하므로 자동 반영됩니다.

### SEO Strategy

- **핵심 철학**: 사용자 경험을 해치지 않는 **White Hat SEO** 원칙을 준수합니다. (Cloaking 등 편법 금지)
- **전략 문서**: 새로운 SEO 전략을 도입하거나 변경할 때는 반드시 `docs/seo_strategy.md` 문서를 참조하고, 변경 사항을 해당 문서에 상세히 기록해야 합니다.
- **구현 원칙**:
  - **Dynamic Keyword Generation**: `lib/seo.ts`의 유틸리티를 사용하여 메타데이터와 UI 간 키워드 일치성 보장.
  - **Visible Keywords**: `components/KeywordList.tsx`를 사용하여 키워드를 시각적으로 노출 (Hidden Text 방지).

### Analytics Strategy

- **원칙**: 새로운 기능(Feature)을 생성하거나 추가할 때는 반드시 Google Analytics 4(GA4) 이벤트를 적절히 설계하여 추가해야 합니다.
- **문서화**: 이벤트 추가 시 `docs/analytics/analytics_guide.md` 및 `docs/analytics/implementation_guide.md` 문서를 함께 업데이트하여 최신 상태를 유지해야 합니다.
- **가이드**: `docs/analytics/analytics_guide.md`를 참조하여 이벤트 네이밍 규칙 및 파라미터 설계를 따릅니다.

### Automation (n8n)

- **에러 처리**: 스크래핑 실패나 AI 응답 오류 시에도 워크플로우가 중단되지 않도록 Error Trigger 또는 대체 로직 구성.
- **비용 관리**: Gemini API 호출 시 토큰 절약을 위해 불필요한 HTML 태그는 사전 제거.

## 6. 워크플로우 가이드라인 (Workflow Guidelines)

1.  **세션 시작 (Initialization)**:
    - 작업 전 `docs/project_history.md`와 `docs/task.md`를 확인하여 이전 작업 내용 및 우선순위를 파악합니다.
2.  **Git 전략**:
    - `docs/git/branch_strategy.md`에 따라 기능별 브랜치(`feat/...`)를 생성하여 작업합니다.
    - `docs/git/convention.md`에 맞춰 커밋 메시지를 작성합니다 ("Why" 중심).
3.  **이력 기록 및 작업 관리**:
    - 주요 변경 사항은 `project_history.md`에, 구현 상세는 `walkthrough.md`에 기록합니다.
    - 진행 중인 작업은 `task.md`에서 실시간으로 업데이트합니다.
4.  **기술 부채 관리**:
    - 코드 개선이 필요하거나 추후 작업이 필요한 항목은 `docs/product/future_todos.md`에 기록합니다.
5.  **문서화**:
    - DB 스키마/함수 변경 시 `docs/database/schema.md`를 반드시 최신화합니다.
    - SQL 파일은 목적에 따라 `database/migrations/` 또는 `database/functions/`에 위치시킵니다.
    - Supabase 운영 방식은 `docs/database/supabase_strategy.md`를 따릅니다.
6.  **에이전트 활용**:
    - `.agent/workflows/` 내의 워크플로우(`@restore_context`, `@generate_commit`, `@update_docs`)를 적극 활용하여 작업 효율성을 높입니다 (`docs/agent_workflows.md` 참조).

## 7. 주요 제약 사항 & 이슈

- **Gemini Free Tier**: 분당 5회 요청 제한 대응.
  - **Single Item**: `Wait` 노드를 통해 속도 조절.
  - **Batching**: 20개씩 묶음 처리하여 API 호출 횟수를 최소화(1/20)하고 안정성 확보.
- **Supabase Free Tier**: 데이터베이스 용량(500MB)을 고려하여 불필요한 로그 데이터는 주기적으로 정리 필요.

## 8. 수익화 전략 (Monetization Strategy)

- **핵심 모델**: Freemium + Monthly Subscription (PayPal, $9.99/mo).
- **데이터 전략**: Hybrid Storage (Free: LocalStorage / Pro: Supabase DB).
- **전환 트리거**: 데이터의 영구 보존 및 멀티 디바이스 연동 욕구 자극.
- **참고 문서**:
  - `docs/monetization/brainstorming.md` (수익화 Q&A 원본)
  - `docs/monetization/ideas.md` (전략 및 아이디어 요약)
  - `docs/monetization/strategy.md` (구현 로드맵)
