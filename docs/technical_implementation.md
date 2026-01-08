# Technical Implementation Details

> 이 문서는 프로젝트의 주요 기능에 적용된 기술적인 구현 상세, 알고리즘, 트러블슈팅 내역을 다룹니다.

## 1. Mobile Optimization & Interaction (모바일 최적화 및 인터랙션)

모바일(터치) 환경과 데스크탑(마우스) 환경의 경험을 분리하여 최적화하기 위한 구현 전략입니다.

### 1.1 Mobile Detection Strategy (모바일 감지)

- **Hook**: `hooks/useMediaQuery.ts` -> `hooks/useIsMobile.ts`
- **Logic**: `window.matchMedia`와 React 18의 `useSyncExternalStore`를 결합하여 구현했습니다.
- **Hydration Safety**:
  - 서버 사이드 렌더링(SSR) 시에는 화면 크기를 알 수 없으므로 초기값을 `undefined`로 반환합니다.
  - 이를 통해 Server-Client 간 HTML 불일치(Hydration Mismatch) 오류를 방지합니다.
  - 컴포넌트에서는 `isMobile === undefined`일 경우 데스크탑 뷰를 기본으로 렌더링하여 CLS(Layout Shift)를 최소화합니다.

```typescript
// hooks/useIsMobile.ts
const MOBILE_BREAKPOINT = "(max-width: 639px)"; // Tailwind 'sm' 기준

export function useIsMobile() {
  return useMediaQuery(MOBILE_BREAKPOINT);
}
```

### 1.2 Conditional Hover Effects (조건부 호버 효과)

모바일 터치 시 `:hover` 상태가 유지되는 문제(Sticky Hover)를 해결하기 위한 두 가지 접근 방식을 사용합니다.

#### A. JavaScript 제어 (Logic Intensive)

Framer Motion 애니메이션이나 복잡한 상태 변경이 필요한 경우 `useEnableHover` 훅을 사용합니다.

```typescript
// components/ExpressionCard.tsx
const enableHover = useEnableHover(); // !isMobile || isMobile === undefined

// 카드 진입(Entrance) 애니메이션
const itemVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  },
};

// 인터랙션 애니메이션
<motion.div
  whileHover={enableHover ? { y: -5 } : undefined}
  whileTap={enableHover ? { scale: 0.98 } : undefined}
/>;
```

#### B. CSS Media Query (Style Only)

단순한 스타일 변경(회전, 색상 변경 등)은 CSS 미디어 쿼리를 사용하여 성능을 최적화합니다. `(pointer: fine)` 조건을 추가하여 마우스가 연결된 환경만 타겟팅합니다.

```css
/* app/globals.css */
@media (hover: hover) and (pointer: fine) {
  .group:hover .safe-hover-rotate-12 {
    transform: rotate(12deg);
  }
}
```

### 1.3 Scroll To Top Interaction (상단 이동 시스템)

- **Hook**: `hooks/useScroll.ts`
- **Visibility**: 스크롤 깊이가 `300px`을 초과할 때만 버튼을 노출합니다.
- **Interaction**:
  - `framer-motion`의 `AnimatePresence`를 사용하여 부드러운 Scale & Fade 애니메이션으로 등장/퇴장합니다.
  - 클릭 시 `window.scrollTo({ top: 0, behavior: 'smooth' })`를 호출하여 최상단으로 이동합니다.
- **Mobile optimization**: 모바일에서는 손가락 터치 시 불필요한 호버 효과가 남지 않도록 제어합니다.

## 2. UI Automation Logic (UI 자동화)

### 2.1 Auto-Scroll to Active Filter (필터 자동 스크롤)

사용자가 필터(카테고리)를 선택했을 때, 해당 버튼이 화면 밖(오버플로우 영역)에 있더라도 자동으로 중앙으로 스크롤되는 로직입니다.

- **File**: `components/FilterBar.tsx`
- **Implementation**:
  1.  각 카테고리 버튼에 `data-category={categoryName}` 속성을 부여합니다.
  2.  `useEffect`에서 현재 선택된 카테고리(`currentCategory`)가 변경될 때마다 실행됩니다.
  3.  `scrollContainerRef` 내부에서 해당 `data-category`를 가진 DOM 요소를 찾습니다(`querySelector`).
  4.  요소의 위치(`offsetLeft`, `offsetWidth`)와 컨테이너의 크기(`clientWidth`)를 계산하여, 요소를 중앙에 위치시키기 위한 `scrollLeft` 값을 산출합니다.
  5.  `scrollTo({ left: calculatedLeft, behavior: 'smooth' })`로 부드럽게 이동시킵니다.

```typescript
// Center Alignment Logic
const scrollLeft = offsetLeft - clientWidth / 2 + offsetWidth / 2;
```

## 3. Animation Logic (애니메이션 로직)

### 3.1 Bidirectional Infinite Scroll (양방향 무한 스크롤)

`RelatedExpressions` 컴포넌트의 Marquee 효과는 단순 CSS 애니메이션이 아닌, `requestAnimationFrame`을 사용한 JavaScript 기반 로직입니다.

- **Data Cloning**: 데이터 배열을 2배로 복제(`[...data, ...data]`)하여 렌더링합니다.
- **Loop Trick**:
  - 스크롤이 컨텐츠 전체 길이의 절반(원본 데이터 길이)에 도달하면 `scrollLeft`를 0으로 초기화하여 처음으로 되돌립니다. (오른쪽 이동 시)
  - 스크롤이 0보다 작아지면 절반 지점으로 이동시킵니다. (왼쪽 이동 시)
  - 이 과정이 순식간에 일어나 사용자에게는 무한히 이어지는 것처럼 보입니다.
- **Mobile Fallback**: 모바일 환경에서는 성능과 배터리 소모를 고려하여 Marquee 애니메이션을 비활성화하고, 세로 리스트로 자동 전환합니다.

### 3.2 Drag Acceleration (드래그 가속)

- **Interaction**: 데스크탑에서 마우스를 좌/우 페이드 영역에 올리면 스크롤 속도가 가속됩니다.
- **Implementation**:
  - 평상시 속도: `0.3`
  - 가속시 속도: `4.0` (방향에 따라 `+/-`)
  - `hoverDirection` 상태를 통해 가속 여부와 방향을 결정하고, `requestAnimationFrame` 루프 내에서 `scrollLeft`에 더하는 값을 동적으로 변경합니다.

## 4. Internationalization (i18n) Engine

외부 라이브러리(`next-intl` 등) 없이 Next.js Middleware와 Server Components만으로 구현한 경량화된 다국어 시스템입니다.

### 4.1 Middleware Locale Detection

- **File**: `middleware.ts`
- **Logic**: 브라우저의 `Accept-Language` 헤더를 파싱하여 `ko`, `en`, `ja`, `es` 중 가장 적합한 언어를 선택하고, 요청 헤더에 `x-locale`을 추가하여 서버로 전달합니다.

### 4.2 Server-Side Dictionary Loading

- **File**: `lib/i18n/server.ts`
- **Helper**: `getI18n()` 함수는 `headers()`에서 `x-locale`을 읽어 해당 언어의 JSON/TS 딕셔너리(`lib/i18n/locales/*.ts`)를 반환합니다.
- **Benefit**: 클라이언트 사이드 번들 크기를 줄이고, 검색 엔진(SEO)에 최적화된 다국어 콘텐츠를 제공합니다.

## 5. Data Architecture & Optimization

### 5.1 ISR (Incremental Static Regeneration)

- **Strategy**: 매 요청마다 DB를 조회하지 않고, 1시간(`revalidate = 3600`)마다 정적 페이지를 재생성합니다.
- **Implementation**: `app/page.tsx` 등 페이지 컴포넌트에서 `export const revalidate` 상수를 정의하여 적용합니다.
- **Effect**: 데이터베이스 부하를 최소화하면서도 사용자에게 빠른 로딩 속도(TTFB)를 제공합니다.

### 5.2 Supabase Client Separation

- **Files**: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- **Reason**: Next.js 환경에서 쿠키 접근 방식이 다르기 때문에, 브라우저 환경(`createBrowserClient`)과 서버 환경(`createServerClient`)용 유틸리티를 분리하여 구현했습니다.
- **Multi-Schema**: `createBrowserSupabase(schema?)`와 같이 스키마를 인자로 받아 다국어 확장에 유연하게 대응하도록 설계되었습니다.

## 6. Search & Navigation Logic

### 6.1 URL Query Parameter State

- **Principle**: 모든 필터 및 검색 상태(Category, Tag, Search Term)는 URL Query Parameter(`?category=...&tag=...`)를 Single Source of Truth로 사용합니다.
- **Benefit**: 사용자가 현재 보고 있는 필터 상태를 URL 복사만으로 공유할 수 있습니다.

### 6.2 Centralized Routing System (라우트 중앙 관리)

- **File**: `lib/routes.ts`
- **Implementation**:
  - 앱 내의 모든 URL 경로를 `ROUTES` 상수로 관리합니다.
  - 필터 조합(Category, Tag, Search)을 기반으로 적절한 홈 경로를 생성하는 `getHomeWithFilters()` 헬퍼 함수를 포함합니다.
- **Benefit**: 하드코딩된 경로 문자열을 제거하여 링크 구조 변경 시 한 곳에서만 수정하면 되므로 유지보수성과 타입 안정성이 크게 향상됩니다.

### 6.3 Smart Tag Detection (스마트 태그 감지)

- **Logic**: 사용자가 검색창에 `#`으로 시작하는 단어를 입력하면(`SearchBar.tsx`), 이를 일반 검색어가 아닌 '태그 필터'로 인식하여 URL을 `?tag=...`로 변환합니다.

### 6.4 Sticky UI Interaction (스티키 UI 상호작용)

- **Hook**: `hooks/useScroll.ts`
- **Logic**: 윈도우 스크롤 이벤트를 감지하여 특정 임계값(예: 80px)을 넘으면 `isStuck` 상태를 반환합니다.
- **Visual**: `FilterBar`는 이 상태에 따라 테두리(`border-b`)를 표시하거나 배경 투명도를 조절하여, 헤더와 자연스럽게 연결되는 시각적 효과를 줍니다.

## 7. Audio Playback System (오디오 재생 시스템)

### 7.1 Web Audio API & Volume Amplification (볼륨 증폭)

- **Problem**: 일부 TTS 생성 음성이 모바일 기기에서 작게 들리는 문제.
- **Solution**: 표준 `HTMLAudioElement` 대신 `Web Audio API`의 `GainNode`를 사용하여 볼륨을 2배(`2.0`)로 증폭하여 출력합니다.
- **Implementation**:
  - `AudioContext`를 생성하고 `createMediaElementSource`로 오디오를 연결합니다.
  - `GainNode`를 삽입하여 `gain.value = 2.0`을 적용한 뒤 `destination`으로 출력합니다.
  - Web Audio API 미지원 환경을 위한 Fallback 로직이 내장되어 있습니다.

### 7.2 Global Audio Synchronization (전역 동기화)

- **Mechanism**: 여러 개의 오디오 버튼이 동시에 재생되어 소리가 겹치는 것을 방지합니다.
- **logic**:
  - 각 버튼은 재생 시작 시 `AUDIO_PLAYBACK_START` 커스텀 이벤트를 `window`에 디스패치합니다.
  - 모든 `DialogueAudioButton` 인스턴스는 이 이벤트를 구독하고 있으며, 이벤트의 페이로드로 전달된 `audio` 객체가 자신의 것이 아닐 경우 재생을 즉시 정지(`pause`)합니다.

### 7.3 Feature Gating Infrastructure (권한 제어)

- **Implementation**: `DialogueAudioButton`에 `onPlayAttempt` 비동기 콜백을 주입할 수 있는 구조를 갖추고 있습니다.
- **Usage**: 실제 재생 로직이 수행되기 전에 이 콜백을 실행하여 사용자의 구독 티어(Free/Pro), 포인트 보유량, 또는 광고 시청 여부를 체크할 수 있습니다. `false`가 반환되면 재생이 차단됩니다.

### 7.4 Context-Aware Icon Logic (상태별 아이콘 로직)

- **Stop Behavior**: `stopBehavior` prop (`reset` | `pause`)에 따라 아이콘과 동작이 동적으로 변합니다.
  - **Manual Play (`reset`)**: 재생 중 클릭 시 초기화(`currentTime = 0`)되며, 정지 아이콘(`Square`)을 표시합니다.
  - **Auto Play (`pause`)**: 연속 재생 중에는 일시정지(`pause`) 동작을 수행하며, 일시정지 아이콘(`Pause`)을 표시합니다.
- **Visual States**: `isLoading`, `isPlaying`, `isPaused` 상태를 조합하여 로딩 스피너, 재생, 정지, 일시정지 아이콘을 명확하게 구분하여 렌더링합니다.

### 7.5 Sequential Playback ("Play All" 멀티 재생)

- **File**: `components/DialogueSection.tsx`
- **Mechanism**: 대화 목록 전체를 순차적으로 자동 재생합니다.
- **Implementation**:
  - `audioRefs`: 각 `DialogueAudioButton`의 명령형 ID/메서드에 접근하기 위해 `useRef` 배열을 관리합니다.
  - `handlePlayAll`: 현재 인덱스를 0으로 설정하고 첫 번째 오디오를 재생합니다.
  - `onAudioEnded`: 현재 오디오 재생이 끝나면 인덱스를 증가시키고, 다음 버튼의 `play()` 메서드를 호출합니다.
  - **State Sync**: 자동 재생 중 사용자가 특정 오디오를 수동으로 멈추거나 재생하면, `isAutoPlaying` 상태를 즉시 해제하여 충돌을 방지합니다.

### 7.6 Audio Loading Stabilization (로딩 안정화)

- **Problem**: 부모 컴포넌트(`DialogueSection`)가 리렌더링될 때마다 자식(`DialogueAudioButton`)으로 전달되는 `onReady` 콜백이 변경되어, 오디오 초기화(`useEffect`)가 반복 실행되는 '깜빡임(Flicker)' 현상 발생.
- **Solution**:
  - `useRef`를 사용하여 `onReady` 콜백을 저장하고, `useEffect` 의존성 배열에서 `onReady`를 제거합니다.
  - 이를 통해 부모의 상태 변화(예: 다른 오디오가 준비됨)가 자식의 오디오 재로딩을 유발하지 않도록 격리(Isolation)합니다.
- **Loading Sync**: 모든 오디오 인스턴스가 `onReady` 신호를 보낼 때까지 'Play All' 버튼을 비활성화하여, 끊김 없는 연속 재생을 보장합니다.

## 8. Skeleton Loading Implementation (스켈레톤 구현 상세)

- **Strategy**: `docs/project_context.md`의 규칙에 따라 데이터 의존성이 있는 컴포넌트와 한 쌍으로 구현됩니다.
- **Shared Components**: `components/ui/Skeletons.tsx`에서 중앙 관리합니다.
  - **`SkeletonCard`**: `ExpressionCard`의 높이와 내부 레이아웃(배경색, 뱃지 위치 등)을 픽셀 단위로 모사하여 로딩 전후 CLS 0을 유지합니다.
  - **`SkeletonDetail`**: 상세 페이지의 복잡한 그리드와 대화 블록 구조를 그대로 재현합니다.
- **Integration**: `app/loading.tsx`를 통해 Next.js App Router의 스트리밍 기능을 활용하며, 첫 번째 바이트(TTFB)가 도달하자마자 레이아웃 윤곽을 표시합니다.

## 9. Navigation State Persistence (네비게이션 상태 보존)

'더 보기(Load More)'로 로드된 리스트와 스크롤 위치를 페이지 이동 간에도 유지하기 위한 복합 전략입니다.

### 9.1 Multi-Cache Architecture

- **Context**: `context/ExpressionContext.tsx`
- **Structure**: 단일 상태가 아닌, 필터 조합(URL)을 키로 사용하는 맵 구조(`Record<string, ExpressionState>`)를 사용하여 각 화면의 상태를 독립적으로 저장합니다.
- **Key Generation**: `serializeFilters` 유틸리티를 통해 `category=business&search=hello`와 같은 고유 키를 생성합니다. 이때 빈 문자열 필터는 제외하여 서버/클라이언트 간 키 일관성을 유지합니다.

### 9.2 Real-time Scroll Tracking

- **Mechanism**: 상세 페이지 이동 시점뿐만 아니라, 사용자가 리스트를 스크롤할 때마다 실시간으로 위치를 캐시에 저장합니다.
- **Optimization**: 브라우저 부하를 줄이기 위해 200ms 디바운스(Debounce)를 적용하여 업데이트 빈도를 조절합니다.
- **Safety**: 스크롤 복원이 진행 중일 때는 저장 로직을 일시 차단하여, 복원 도중 0(상단) 위치가 캐시에 덮어씌워지는 문제를 방지합니다.

### 9.3 Robust Scroll Restoration (Recursive RAF)

- **Manual Control**: 브라우저의 기본 스크롤 복원 동작(`history.scrollRestoration = 'manual'`)을 차단하여 React의 렌더링 사이클과 충돌하는 것을 방지합니다.
- **Recursive requestAnimationFrame**: 리스트의 데이터가 실제로 화면에 그려져서 높이가 확보될 때까지 브라우저의 페인팅 주기에 맞춰 여러 프레임에 걸쳐 반복적으로 스크롤 이동을 시도합니다.
- **Termination Condition**: 목표 위치에 도달하거나, 약 1초(60프레임) 이상의 시도가 실패할 경우 자동으로 종료하여 성능을 보존합니다.
- **Separation of Concerns**: 데이터 업데이트(`updateCacheData`)와 스크롤 저장(`updateScrollPosition`) 메서드를 분리하여, 데이터 추가 로드 시 스크롤 위치가 초기화되지 않도록 보호합니다.

## 10. Automation Pipeline (n8n & AI)

### 10.1 Pre-fetch Duplicate Check

- **Problem**: AI가 이미 존재하는 표현을 중복 생성하는 비효율성 발생.
- **Solution**: 생성 단계(Generate) 이전에 Supabase에서 기존 표현 리스트를 조회(Pre-fetch)하여 프롬프트의 '제외 목록'으로 전달함으로써 중복을 원천 차단합니다.

### 10.2 Strict JSON Parsing

- **Problem**: LLM이 JSON 응답에 마크다운 코드 블록(``json ... `)을 포함하여 파싱 에러 발생.
- **Solution**: n8n 워크플로우 내에서 정규식(` replace(/```json|```/g, '') `)을 사용하여 순수 JSON 문자열만 추출한 뒤 파싱하는 로직을 추가했습니다.

### 10.3 Structured Prompt Engineering

- **File**: `docs/n8n/expressions/optimization_steps.md`
- **Context**: 3단계(상황->표현, 표현->상황, 부정 로직)의 퀴즈 패턴을 정의하고, 문장 부호 및 대소문자 규칙(문장은 대문자, 구절은 소문자 시작)을 명시하여 데이터의 일관성을 확보했습니다.

### 10.4 Modular Workflow Management (워크플로우 모듈화)

- **Strategy**: n8n GUI 내부에 직접 작성하던 JavaScript 코드와 AI 프롬프트를 로컬 파일(`n8n/expressions/code/*.js`, `*.txt`)로 분리하여 관리합니다.
- **Benefits**:
  - 에디터(VS Code)의 자동 완성 및 린트 기능을 활용할 수 있습니다.
  - 워크플로우 로직에 대한 버전 관리가 용이해집니다.
  - 프롬프트 변경 이력을 추적하기 쉬워지며, 여러 워크플로우에서 동일한 코드를 재사용할 수 있는 기반이 됩니다.

## 11. Design System & Global Styling (디자인 시스템 및 전역 스타일링)

Tailwind CSS v4의 `@theme` 및 `@utility` 기능을 활용하여 유지보수성이 높은 디자인 시스템을 구축했습니다.

### 11.1 Semantic Theme Variables (시맨틱 테마 변수)

- **Definition**: `app/globals.css`의 `@theme` 블록 내에 색상, 간격, 높이 등을 프로젝트 전용 변수로 정의합니다.
- **Usage**:
  - `--header-height`: 헤더의 물리적 높이를 상수로 관리하여 레이아웃 계산에 활용합니다.
  - `--color-text-main`: 다크 모드와 라이트 모드에서 각각 최적화된 메인 텍스트 색상을 추상화합니다.
- **Benefit**: 특정 색상이나 수치를 변경해야 할 때 전역 변수 하나만 수정하면 전체 UI에 일괄 반영됩니다.

### 11.2 Reusable Utility Classes (공통 유틸리티)

- **Definition**: 반복되는 스타일 조합을 `@utility` 클래스로 정의하여 가독성과 생산성을 높입니다.
- **Implementation**:
  - `.dialogue-bubble`: 대화 버블의 공통 스타일(패딩, 테두리 반경, 트랜지션)을 캡슐화합니다.
  - `.dialogue-audio-btn`: 오디오 버튼의 기본 크기, 간격, 둥글기 스타일을 통일합니다.
- **Benefit**: 컴포넌트 내부에 긴 Tailwind 클래스 나열을 줄이고, 디자인 일관성을 강제로 유지할 수 있습니다.

### 11.3 Conditional Styling with `cn()` (조건부 스타일링 유틸리티)

- **Utility**: `lib/utils.ts`의 `cn` (`clsx` + `tailwind-merge`) 함수를 사용하여 클래스를 결합합니다.
- **Logic**: 중복되거나 충돌하는 Tailwind 클래스를 지능적으로 병합하고, 조건에 따른 스타일 적용(`cn('base', condition && 'extra')`)을 명확하게 처리합니다.
