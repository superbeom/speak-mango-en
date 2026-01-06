# Implementation Walkthrough

> 각 버전별 구현 내용과 변경 사항을 상세히 기록합니다. 최신 버전이 상단에 옵니다.

## v0.8.3: 네비게이션 상태 보존 및 스크롤 복원 (2026-01-06)

### 1. Global State Management (`ExpressionContext`)

- **Architecture**: `context/ExpressionContext.tsx`를 생성하여 `ExpressionProvider` 구현. 리스트 아이템(`items`), 페이지(`page`), 더 보기 여부(`hasMore`), 필터(`filters`), 스크롤 위치(`scrollPosition`)를 전역 상태로 관리.
- **Integration**: `app/layout.tsx`에서 전체 애플리케이션을 Provider로 감싸, 페이지 네비게이션 간에도 상태가 유지되도록 설정.

### 2. Smart Scroll Restoration

- **Persistence Logic**: `components/ExpressionList.tsx`에서 컴포넌트 언마운트 시점(상세 페이지 진입 전)에 현재 스크롤 위치(`window.scrollY`)를 Context에 저장.
- **Restoration Logic**: 컴포넌트 마운트 시, 저장된 필터와 현재 필터가 일치하면 `useLayoutEffect`를 통해 저장된 위치로 즉시 스크롤 이동. 이를 통해 '더 보기'로 길어진 리스트의 중간 위치로 정확히 돌아갈 수 있음.
- **Performance**: `useState` 초기값에 스토어 데이터를 동기적으로 주입하여, 첫 렌더링부터 올바른 DOM 높이를 확보함으로써 스크롤 점프(Layout Shift) 방지.

### 3. Back Navigation Improvement

- **`components/BackButton.tsx`**:
  - 기존의 `<Link href="/">` 방식을 `router.back()` 기반의 클라이언트 컴포넌트로 대체.
  - **Fallback**: 브라우저 히스토리가 없을 경우(Deep Link 진입 등) 안전하게 홈으로 이동하는 분기 처리(`history.length > 1`) 추가.

## v0.8.2: 리스트 애니메이션 최적화 및 UI/UX 폴리싱 (2026-01-05)

### 1. Layout Stability Optimization

- **`components/AnimatedList.tsx`**: `motion.div`에서 `layout` 속성을 제거.
  - **Reason**: '더 보기' 기능을 통해 리스트가 동적으로 확장될 때, 기존 아이템들이 불필요하게 재계산되어 위치를 이동하려는 시도를 차단. 이를 통해 새로운 아이템 추가 시 발생하는 미세한 레이아웃 흔들림(Jitter)을 방지하고 성능을 최적화함.

### 2. Entrance Animation Refinement

- **`components/ExpressionCard.tsx`**: 카드 등장 애니메이션의 핵심 속성을 변경.
  - **Scale-based Entrance**: 기존 Slide-up(`y: 20`) 대신 Scale-up(`scale: 0.96 -> 1.0`)을 적용하여 콘텐츠가 화면에 더 부드럽고 집중력 있게 안착하도록 개선.
  - **Timing & Easing**: 애니메이션 지속 시간을 `0.5s`에서 `0.4s`로 단축하고, 정교한 베지어 곡선(`[0.21, 0.47, 0.32, 0.98]`)을 적용하여 리스트 로딩 시의 리듬감을 향상시킴.

## v0.8.1: 리스트 '더 보기(Load More)' 기능 구현 및 스크롤 리셋 최적화 (2026-01-05)

### 1. Pagination Logic

- **Server-side Range**: `lib/expressions.ts`의 `getExpressions` 함수에 `page`와 `limit` 파라미터를 추가하고, Supabase의 `.range(from, to)`를 사용하여 필요한 데이터만 효율적으로 페칭하도록 개선.
- **Initial Load**: 홈 페이지 첫 진입 시 최신순으로 12개의 아이템을 먼저 로드함.

### 2. Server Actions for Client Interaction

- **`lib/actions.ts`**: 클라이언트 컴포넌트에서 추가 데이터를 요청할 수 있도록 `"use server"` 지시어를 사용한 `fetchMoreExpressions` 액션 구현. 이를 통해 API route 생성 없이도 타입 안정성을 유지하며 비동기 데이터 페칭 가능.

### 3. Client-side State Management

- **`components/ExpressionList.tsx`**:
  - `useState`를 사용하여 서버에서 받은 초기 데이터와 추가 페칭된 데이터를 통합 관리.
  - `useEffect`를 통해 카테고리나 검색어 필터가 변경될 때 리스트를 즉시 초기화하도록 구현.
  - `hasMore` 상태를 통해 데이터 소진 여부를 판단하고 버튼 노출 여부를 동적으로 제어.
- **`components/LoadMoreButton.tsx`**: 독립적인 버튼 컴포넌트로 분리. 다크모드 시인성 개선 및 `useEnableHover`를 통한 모바일 UX 최적화 적용.

### 4. Automatic Scroll Reset

- **`template.tsx`**: 상세 페이지(`[id]`) 진입 시 이전 스크롤 위치가 유지되는 문제를 해결하기 위해 Next.js Template 도입. 페이지 전환 시마다 `window.scrollTo(0, 0)`를 실행하여 사용자 경험 일관성 확보.

## v0.8.0: 스켈레톤 로딩 (Skeleton Loading) 도입 및 UX 정교화 (2026-01-05)

### 1. Reusable Skeleton Components

- **`components/ui/Skeletons.tsx`**:
  - `SkeletonNavbar`: 메인 페이지(로고+서브헤더)와 상세 페이지(뒤로가기)의 각기 다른 헤더 구조를 지원하는 반응형 스켈레톤.
  - `SkeletonHomeHero`: 홈 페이지 상단 타이틀과 설명 영역의 공간을 미리 확보하여 CLS 방지.
  - `SkeletonCard`: 실제 `ExpressionCard`와 동일한 레이아웃, 여백, 애니메이션을 가진 카드 스켈레톤.
  - `SkeletonFilterBar`: 검색창과 카테고리 칩 리스트 모양을 모사한 스켈레톤.
  - `SkeletonDetail`: 상세 페이지의 복잡한 카드 구조(상황, 대화, 팁, 퀴즈, 태그)를 실제 DOM 트리와 동일하게 구현하여 로딩 전후의 시각적 이질감 제거.

### 2. Streamlined Loading Pages

- **`app/loading.tsx`**: 홈 페이지 로딩 시 상단 네비바부터 하단 카드 그리드까지 전체 레이아웃 윤곽을 즉시 렌더링.
- **`app/expressions/[id]/loading.tsx`**: 상세 페이지 로딩 시 뒤로가기 버튼이 포함된 네비바와 상세 콘텐츠 스켈레톤을 배치하여 사용자 대기 경험 개선.

### 3. Documentation & Governance

- **`docs/project_context.md`**: '스켈레톤 로딩 전략'을 공식 코딩 컨벤션에 추가하여 향후 모든 데이터 기반 UI에 대한 스켈레톤 동시 개발 의무화.

## v0.7.9: Scroll To Top 기능 구현 및 모바일 최적화 (2026-01-05)

### 1. Scroll To Top Component

- **Visibility Logic**: `useScroll(300)` 훅을 사용하여 페이지가 300px 이상 스크롤되었을 때만 버튼이 나타나도록 구현.
- **Smooth Animation**: `framer-motion`의 `AnimatePresence`를 사용하여 버튼의 등장과 퇴장을 부드럽게 처리하고, `whileHover` 및 `whileTap` 인터랙션을 추가함.
- **Top Interaction**: 클릭 시 `window.scrollTo({ top: 0, behavior: 'smooth' })`를 통해 최상단으로 부드럽게 이동.

### 2. Mobile Responsive Design

- **Adaptive Styling**: 모바일 환경을 고려하여 버튼 크기(`p-3` vs `sm:p-3.5`)와 위치(`bottom-6` vs `sm:bottom-8`)를 유연하게 조정.
- **Hover Prevention**: `useEnableHover` 훅을 적용하여 터치 디바이스에서는 불필요한 호버 스타일 및 애니메이션이 발생하지 않도록 최적화.

## v0.7.8: n8n 생성 로직 고도화 - 태그 생성 의무화 (2026-01-05)

### 1. n8n Prompt Optimization (Tags)

- **Mandatory Tags**: `docs/n8n_optimization_steps.md` 및 `docs/n8n_workflow_template.json`의 Gemini 프롬프트에 `tags` 필드를 필수(MANDATORY)로 지정.
- **Strict Formatting**: 3~5개의 소문자 문자열 배열 형식을 강제하고, '#' 기호 사용을 금지하여 DB 저장 및 필터링 시의 데이터 정합성을 확보함.

## v0.7.7: 모바일 호버 효과 제거 및 관련 표현 추천 개선 (2026-01-05)

### 1. Mobile Hover UX Fix

- **Condition Logic**: `ExpressionCard.tsx`에서 `useIsMobile` 훅을 사용하여 모바일 환경(`isMobile === true`)을 감지.
- **Animation Control**: 모바일일 경우 `whileHover`, `whileTap` 애니메이션 props를 `undefined`로 설정하여 비활성화.
- **Style Conditional**: `cn` 유틸리티를 사용하여 `hover:` 관련 CSS 클래스들도 모바일이 아닐 때만 적용되도록 조건부 렌더링 처리.
- **Hydration Safety**: `isMobile`이 `undefined`일 때(초기 렌더링)는 데스크탑으로 간주하여 서버 사이드 렌더링(SSR)과의 불일치 방지.

### 2. Auto-Scroll Filter Bar

- **Auto-Focus**: `FilterBar.tsx`에서 현재 선택된 카테고리(`currentCategory`)가 변경될 때마다 `data-category` 속성을 사용하여 해당 버튼 요소를 찾음.
- **Center Alignment**: 선택된 버튼이 스크롤 컨테이너의 중앙에 오도록 `scrollTo`를 사용하여 부드럽게 이동시킴. 모바일과 같이 화면이 좁을 때 사용자가 선택한 필터를 놓치지 않도록 개선.

### 3. Documentation

- **Technical Guide**: `docs/technical_implementation.md`를 신설하여 모바일 감지, 호버 제어, 무한 스크롤 등 UI/UX 관련 핵심 기술 구현 내용을 상세히 정리함.

## v0.7.6: 관련 표현 추천 드래그 가속 기능 추가 (2026-01-05)

### 1. Accelerated Drag on Hover

- **Fade Interaction**: 데스크탑 뷰에서 좌우 페이드 영역에 마우스를 올리면 스크롤이 해당 방향으로 빠르게 가속되는 기능 구현.
- **Directional Logic**: `hoverDirection` 상태를 도입하여 왼쪽 페이드 호버 시 역방향(`-4.0`), 오른쪽 페이드 호버 시 정방향(`4.0`)으로 스크롤 속도 조정.
- **Bidirectional Infinite Loop**: 기존의 단방향 무한 루프 로직을 개선하여, 왼쪽 끝에 도달했을 때도 자연스럽게 오른쪽 끝으로 연결되도록 보완.

### 2. UI/UX Polish

- **Enhanced Affordance**: 페이드 영역에 마우스를 올리면 `cursor-w-resize`, `cursor-e-resize` 커서가 표시되도록 하여 인터랙션 가능함을 직관적으로 알림.
- **Improved Hit Area**: 페이드 영역의 너비를 `w-24`로 확장하여 사용자가 더 쉽게 가속 기능을 트리거할 수 있도록 개선.

## v0.7.5: 사용자 가이드 및 퀴즈 UI 가독성 개선 (2026-01-04)

### 1. New Documentation: User Guide

- **`docs/n8n_user_guide.md`**: 서비스의 핵심 기능 소개부터 n8n 워크플로우 운영 가이드까지 포함한 종합 사용자 가이드 작성.
- **Operator focus**: n8n을 통한 자동화 프로세스(프롬프트 설정, Credentials 연결, 트러블슈팅)를 상세히 설명하여 운영 효율성 제고.

### 2. UI Polish (Quiz)

- **Line Break Support**: 상세 페이지 퀴즈 질문 섹션에 `whitespace-pre-wrap`을 적용하여 n8n에서 생성된 다중 개행(`\n`)이 의도한 대로 렌더링되도록 수정.
- **Enhanced Readability**: 질문과 선택지가 뭉쳐 보이던 문제를 해결하여 모바일 환경에서의 가독성을 대폭 향상.

## v0.7.4: 퀴즈 로직 고도화 및 데이터 정합성 확보 (2026-01-04)

### 1. n8n Quiz Logic Optimization

- **Pattern Refinement**: 퀴즈 생성 패턴을 3가지로 명확히 재정의하여 학습 효과 극대화.
  - **Pattern 1 (Situation -> EN)**: 상황에 맞는 영어 표현 고르기.
  - **Pattern 2 (Expression -> Situation)**: 영어 표현에 맞는 상황 고르기.
  - **Pattern 3 (Negative Logic)**: 영어 표현에 적절하지 _않은_ 상황 고르기.
- **Strict Formatting**: 모든 언어(KO, JA, ES)에 대해 3지 선다(A/B/C)와 정답 포맷(단일 알파벳)을 강제하는 규칙 적용.

### 2. Data Integrity

- **Corrective SQL**: 기존 데이터 중 논리적 오류(한국어 대사 고르기)나 포맷 오류(선택지 누락)가 있는 항목을 올바른 패턴으로 일괄 수정하는 SQL 스크립트(`database/009_fix_invalid_quizzes.sql`) 작성 및 적용.

## v0.7.3: n8n 프롬프트 최적화 (2026-01-03)

### 1. n8n Prompt Engineering

- **Capitalization Rules**: `Gemini Content Generator` 프롬프트에 문장("No worries")은 대문자, 구절("spill the tea")은 소문자로 시작하도록 명시적 규칙 추가.
- **Tone & Manner**: '무조건 반말' 원칙을 완화하여, 영어 표현 자체가 정중할 경우("Could I...?") 한국어 뜻풀이도 존댓말을 허용하도록 유연성 확보.
- **Punctuation**: 영어 표현이 의문문일 경우 뜻풀이도 물음표로 끝나도록 강제하여 뉘앙스 전달력 강화.

### 2. Agent Workflow Enhancement

- **Context Restoration**: `.agent/workflows/restore_context.md`를 업데이트하여 `features_list.md`, `database_schema.md` 등 핵심 문서를 추가 로드하도록 개선. 이를 통해 에이전트가 프로젝트의 기능과 데이터 구조를 더 정확히 이해하게 됨.

## v0.7.2: UI 스타일 중앙 관리 및 모바일 최적화 (2026-01-03)

### 1. Style Centralization (Utility Classes)

- **Semantic Utilities**: 반복되는 테마 스타일을 `globals.css`에 유틸리티 클래스로 정의하여 유지보수성 향상.
  - `bg-surface`: 메인 카드 및 입력창 배경 (`white` / `zinc-900`)
  - `bg-subtle`: 보조 카드 및 태그 배경 (`zinc-50` / `zinc-800/50`)
  - `bg-muted`: 호버 효과 및 강조 배경 (`zinc-100` / `zinc-800`)
  - `border-main`: 기본 테두리 (`zinc-200` / `zinc-800`)
  - `border-subtle`: 약한 테두리 및 구분선 (`zinc-100` / `zinc-800`)
  - `text-body`: 본문 텍스트 (`zinc-800` / `zinc-200`)
  - `text-secondary`: 설명 및 보조 텍스트 (`zinc-600` / `zinc-400`)

### 2. Reliable Mobile Detection

- **Custom Hooks**: `useMediaQuery`와 `useIsMobile` 훅을 구현하여 화면 크기에 따른 로직 분기 처리.
- **Hydration Safety**: `SyncExternalStore`와 초기값 `undefined` 처리를 통해 SSR 환경에서의 하이드레이션 오류 방지.
- **Responsive Layout**: `RelatedExpressions` 컴포넌트에서 모바일일 경우 세로 리스트, 데스크탑일 경우 Marquee 스크롤로 자동 전환되도록 개선.

### 3. Documentation Workflow Update

- **Ideas Management**: `update_docs` 워크플로우에 `feature_ideas.md`를 추가하고, 구현된 기능을 자동으로 필터링하도록 규칙 가이드 업데이트.

## v0.7.1: 아키텍처 정비 및 Sticky UI 고도화 (2026-01-03)

### 1. Architectural Restructuring

- **Folder Relocation**: `hooks/`, `i18n/` 폴더를 루트 레벨로 이동하여 모듈 접근성 및 구조적 명확성 향상.
- **Shared Logic**: `useScroll` 커스텀 훅을 통해 스크롤 상태 관리 로직을 중앙화하고 컴포넌트 간 중복 제거.

### 2. Sticky UI & Spacing Polish

- **Dynamic Transitions**: 스크롤 위치에 따라 헤더의 테두리를 필터 바 하단으로 이동시키는 동적 스타일링 구현.
- **Background Sync**: 화이트 모드에서 스크롤 시 헤더 배경색이 메인 배경색(`zinc-50`)과 일치하도록 변경하여 시각적 일체감 확보.
- **Consistent Spacing**: 필터 바가 고정될 때와 평상시의 카드 간격을 동일하게 유지하도록 여백 로직 최적화.

### 3. Developer Experience (DX)

- **Theming**: Tailwind v4 테마 변수(`--header-height`) 및 커스텀 유틸리티(`max-w-layout`, `border-layout`) 도입.
- **Workflow Automation**: 문서 자동 업데이트를 지원하는 `update_docs` 에이전트 워크플로우 구축.
- **Type Safety**: `yarn lint` 실행 시 `tsc --noEmit`을 포함하여 린트 단계에서 타입 체크 강제.

## v0.6.7: 관련 표현 추천 고도화 (Auto-Marquee) (2026-01-02)

### 1. Auto-Marquee Animation

- **무한 루프 스크롤**: `requestAnimationFrame`을 활용하여 끊김 없이 흐르는 자동 스크롤(Infinite Loop)을 구현.
- **데이터 복제(Cloning)**: 리스트 데이터를 2배로 복제하여 스크롤이 끝에 도달했을 때 순식간에 처음으로 되돌리는 트릭을 사용하여 시각적으로 끊김 없는 연결을 구현.

### 2. Interaction Polish

- **스마트 일시정지**: 사용자가 카드를 자세히 볼 수 있도록 마우스 호버 시 스크롤을 **일시정지(Pause)**하고, 이탈 시 자동으로 **재개(Resume)**.
- **시각적 힌트**: 좌우 Fade 영역에 마우스를 올리면 `cursor-w-resize`, `cursor-e-resize` 커서를 표시하여 스크롤 가능함을 직관적으로 알림.

### 3. Performance

- **최적화**: `useCallback`과 `useRef`를 적절히 활용하여 애니메이션 루프가 리렌더링을 유발하지 않도록 최적화하고, `useEffect` 의존성을 관리하여 메모리 누수를 방지.

## v0.7.0: 브랜드 리뉴얼 및 다국어 확장 아키텍처 수립 (2026-01-02)

### 1. 서비스 브랜드 리뉴얼

- **명칭 변경**: `Daily English`에서 **`Speak Mango`**로 서비스명을 공식 변경.
- **상수화**: `lib/constants.ts`에 `SERVICE_NAME` 상수를 추가하여 UI 및 메타데이터에서 일관되게 참조하도록 개선.
- **메타데이터 업데이트**: `app/layout.tsx`의 타이틀 및 설명을 새로운 브랜드명에 맞춰 업데이트.

### 2. 다국어 확장 및 서비스 격리 전략 수립

- **스키마 설계**:
  - 콘텐츠 스키마(`speak_mango_en`, `speak_mango_ko` 등)와 사용자 공유 스키마(`speak_mango_shared`)를 분리하는 하이브리드 아키텍처 도입.
  - `auth.users`를 공유하되 스키마별 `profiles` 테이블(외래키 참조)을 통해 서비스 가입자를 구분하는 보안 전략 수립.
- **클라이언트 고도화**:
  - `createBrowserSupabase` 및 `createServerSupabase` 함수가 스키마 이름을 인자로 받아 동적으로 전환할 수 있도록 리팩토링.
  - 단일 스키마(Scenario A)와 다중 스키마(Scenario B) 사용 예시를 문서화(`docs/supabase_strategy.md`).

### 3. 데이터베이스 마이그레이션

- **스키마 변경**: 기존 `daily_english` 스키마를 `speak_mango_en`으로 변경하는 마이그레이션 스크립트 작성 (`database/008_rename_schema_to_speak_mango.sql`).
- **권한 재설정**: 변경된 스키마 명칭에 맞춰 API 및 n8n 접근 권한(`GRANT`)을 일괄 재부여.

## v0.6.6: Header 리팩토링 및 추천 섹션 UI 개선 (2026-01-02)

### 1. Header 컴포넌트 독립 분리

- **`components/Header.tsx`**: 메인 페이지와 상세 페이지에서 중복 사용되던 헤더 로직을 독립 컴포넌트로 분리.
- **Overlap 이슈 해결**: 헤더의 `z-index`를 `z-50`으로 상향 조정하여, 스크롤 시 카드 컴포넌트(특히 카테고리 라벨)가 헤더 위로 노출되는 문제 해결.

### 2. 관련 표현 추천 UI 고도화

- **`components/RelatedExpressions.tsx`**:
  - 상세 페이지 하단의 추천 섹션을 별도 컴포넌트로 분리.
  - 가로 스크롤(`overflow-x-auto`)을 적용하고 각 카드에 최소 가로 폭(`min-w`)을 설정하여 찌그러짐 방지.
  - `FilterBar`와 동일하게 양옆 **Fade 효과**를 추가하여 스크롤 가능 여부를 시각적으로 표시.
- **데이터 확보**: 추천 리스트의 풍부함을 위해 페칭 제한을 6개로 상향.

## v0.6.5: 관련 표현 추천 기능 구현 (2026-01-02)

### 1. 데이터 로직 확장

- **`lib/expressions.ts`**: `getRelatedExpressions(currentId, category)` 함수 추가. 동일한 카테고리의 표현을 최대 3개까지 가져오며, 현재 보고 있는 표현은 결과에서 제외하도록 쿼리 작성.

### 2. UI 구현

- **`app/expressions/[id]/page.tsx`**:
  - 상세 페이지 하단에 '📚 이런 표현은 어때요?' 섹션 추가.
  - `ExpressionCard`를 재사용하여 일관된 디자인 유지.
- **i18n 지원**: `ko.ts`, `en.ts`에 섹션 타이틀(`relatedTitle`) 다국어 문자열 추가.

## v0.6.4: Framer Motion을 활용한 애니메이션 고도화 (2026-01-02)

### 1. 애니메이션 인프라 구축

- **Dependencies**: `framer-motion` 패키지 설치.
- **`components/AnimatedList.tsx`**: 리스트의 Staggered 애니메이션(순차적 등장)과 레이아웃 전환(Layout Animation)을 처리하는 전용 클라이언트 컴포넌트 구현. `AnimatePresence`를 통해 요소 추가/삭제 시 부드러운 전환 지원.

### 2. 컴포넌트 애니메이션 적용

- **`ExpressionCard`**:
  - `motion.div`를 도입하여 카드 진입 시 Fade-in & Slide-up 효과 적용.
  - `whileHover`(살짝 떠오름) 및 `whileTap`(눌림 효과) 인터랙션 추가.
  - `layout` 속성을 통해 필터링 시 카드가 부드럽게 재배치되도록 개선.
- **`app/page.tsx`**: 기존의 정적 그리드를 `AnimatedList`로 교체하여 전체적인 사용자 경험(UX) 상향.

## v0.6.3: CategoryLabel 컴포넌트 추가 및 인터랙션 강화 (2026-01-01)

### 1. CategoryLabel 컴포넌트

- **`components/CategoryLabel.tsx`**: 카테고리 표시 UI를 독립 컴포넌트로 분리. `Tag`와 마찬가지로 `Link`와 `button` 모드를 모두 지원하며, `cn` 유틸리티를 활용한 안전한 스타일링 적용.
- **애니메이션 고도화**: 컴포넌트에 `group` 클래스를 내장하여, 상세 페이지 등 부모 컨텍스트에 상관없이 아이콘 호버 애니메이션(`rotate-12`)이 작동하도록 개선.

### 2. 필터링 연동

- **`ExpressionCard`**: 카드 내 카테고리 클릭 시 `handleCategoryClick`을 통해 메인 페이지로 이동하며 해당 카테고리로 필터링.
- **`ExpressionDetailPage`**: 상세 페이지 상단의 카테고리도 클릭 가능하도록 변경하여, 사용자가 동일한 카테고리의 다른 표현을 쉽게 탐색할 수 있도록 개선.

## v0.6.2: 스타일 유틸리티 도입 및 Tag 컴포넌트 고도화 (2026-01-01)

### 1. 스타일 충돌 방지 시스템

- **Dependencies**: `tailwind-merge` 및 `clsx` 패키지 추가.
- **Utility**: `lib/utils.ts`에 `cn` 함수를 추가하여 Tailwind 클래스 병합 및 조건부 스타일링 지원.
- **Refactoring**: `Tag` 컴포넌트에서 `cn` 유틸리티를 사용하도록 변경하여 외부 `className` 주입 시 발생할 수 있는 스타일 충돌 문제 해결.

## v0.6.1: 검색/필터 UI 고도화 및 컴포넌트 리팩토링 (2026-01-01)

### 1. 검색 및 필터링 기능 구현

- **`SearchBar` 컴포넌트 분리**: 입력 상태 관리와 초기화 로직을 독립적인 컴포넌트로 분리하여 재사용성 확보.
- **`FilterBar` 기능 확장**: 검색어와 카테고리(`category`) 필터링을 URL 쿼리 파라미터(`searchParams`)와 연동하여 구현. 태그 검색(`#tag`) UX 지원.
- **상세 페이지 태그 연동**: `app/expressions/[id]/page.tsx`의 태그를 클릭 시 메인 페이지의 태그 필터로 연결되도록 구현.
- **필터 간소화**: `domain` 필터는 데이터 확충 전까지 임시로 제거하고 `category` 필터에 집중.

### 2. UI/UX 개선

- **스크롤 UI**: `FilterBar`의 가로 스크롤 영역에 양옆 페이드(Fade) 효과를 추가하고 스크롤바를 숨겨(`scrollbar-hide`) 깔끔한 디자인 구현.
- **인터랙션**: `ExpressionCard`를 클라이언트 컴포넌트로 전환하고, 태그 클릭 시 즉시 검색 필터가 적용되도록 `onClick` 핸들러 구현.
- **다크 모드**: 카드 호버 시 그림자와 테두리 효과를 강화하여 다크 모드에서의 시인성 개선.

### 3. 코드 구조 개선

- **Tag 컴포넌트 분리**: `Link`와 `button`을 통합 지원하는 `components/Tag.tsx`를 생성하고, 메인 및 상세 페이지에 일관된 스타일로 적용.
- **설정 중앙화**: UI 관련 설정(아이콘, 색상 등)을 `lib/ui-config.ts`로, 상수(카테고리 목록 등)를 `lib/constants.ts`로 분리.
- **유틸리티 분리**: 문자열 포맷팅 함수 등을 `lib/utils.ts`로 이동.

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
- **`lib/supabase/server.ts`**: `createServerSupabase` - 서버 컴포넌트 및 SSR용 클라이언트 설정 (Next.js 16+ `cookies()` 비동기 대응).

### 3. 환경 변수 템플릿 생성

- **`.env.local.example`**: 프로젝트 URL 및 Anon Key 설정을 위한 템플릿 파일 추가.

## v0.1.0: 프로젝트 스캐폴딩 및 설계 (2025-12-30)

- Command: `npx create-next-app@latest speak-mango-en --ts --tailwind --eslint --app --no-src-dir`
- 기본 설정: TypeScript, Tailwind CSS, App Router 사용.

### 2. 문서화 (Documentation)

- **`docs/database_schema.md`**: Supabase `expressions` 테이블 스키마 정의 (UUID, 영어 표현, 뜻, 예문 등).
- **`docs/n8n_workflow_guide.md`**: n8n 자동화 로직 설계 (HTTP Request -> Gemini AI -> Supabase).
- **`docs/project_context.md`**: 프로젝트 규칙 및 아키텍처 정의.

### 3. 향후 계획 (Next Steps)

- Supabase 프로젝트 생성 및 테이블 실제 적용.
- Next.js에서 Supabase 클라이언트 연동 (`@supabase/ssr` 패키지 설치 예정).
- 메인 페이지 UI 구현 (카드 리스트 형태).
