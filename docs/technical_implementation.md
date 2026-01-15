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

### 4.1 Multi-Language Expansion (Proxy & Detection)

- **File**: `proxy.ts` (Next.js 16+ Standard)
- **Logic**: 브라우저의 `Accept-Language` 헤더를 파싱하여 **지원되는 9개 국어(EN, KO, JA, ES, FR, DE, RU, ZH, AR)** 중 가장 적합한 언어를 선택하고, 요청 헤더에 `x-locale`을 추가하여 서버로 전달합니다.
- **Note**: Next.js 16의 보안 권고 사항(`CVE-2025-29927`) 및 아키텍처 변경에 따라 기존 `middleware.ts`를 `proxy.ts`로 전환했습니다.

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

### 7.2 Path Resolution & Storage Strategy (경로 해석 및 저장 전략)

- **Storage Format**: Supabase DB (`expressions` 테이블)의 `audio_url` 필드에는 스토리지 내부의 **상대 경로**(`expressions/{id}/{index}.wav`)를 저장합니다. 절대 경로 대신 상대 경로를 사용함으로써 도메인 변경이나 프로젝트 이관 시 유연성을 확보합니다.
- **Client-Side Resolution**: URL 완성 로직은 서버가 아닌 `DialogueAudioButton.tsx` 컴포넌트 내부에서 수행됩니다.
  - **Payload Optimization**: 서버에서 클라이언트로 전달되는 JSON 데이터의 용량을 줄입니다.
  - **Encapsulation**: 컴포넌트가 재생에 필요한 실제 주소(`getStorageUrl`)를 스스로 계산하므로 서버 컴포넌트(`page.tsx`)의 로직이 단순해집니다.

### 7.3 Global Audio Synchronization (전역 동기화)

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
- **Explicit Reset**: 새로운 필터나 검색어로 진입하여 저장된 위치가 없는 경우(`targetPosition <= 0`), 명시적으로 `window.scrollTo(0, 0)`을 호출하여 스크롤이 중간에 멈춰있는 현상을 방지합니다.
- **Recursive requestAnimationFrame**: 리스트의 데이터가 실제로 화면에 그려져서 높이가 확보될 때까지 브라우저의 페인팅 주기에 맞춰 여러 프레임에 걸쳐 반복적으로 스크롤 이동을 시도합니다.
- **Termination Condition**: 목표 위치에 도달하거나, 약 1초(60프레임) 이상의 시도가 실패할 경우 자동으로 종료하여 성능을 보존합니다.
- **Separation of Concerns**: 데이터 업데이트(`updateCacheData`)와 스크롤 저장(`updateScrollPosition`) 메서드를 분리하여, 데이터 추가 로드 시 스크롤 위치가 초기화되지 않도록 보호합니다.
- **Unmount Cleanup**: `ExpressionList` 언마운트 시 `history.scrollRestoration = 'auto'`로 복구하여, 리스트가 없는 다른 페이지(예: 로고 클릭으로 이동 등)에서의 예기치 않은 스크롤 동작을 방지합니다.

### 9.4 Detail Page Scroll Reset (상세 페이지 스크롤 리셋 전략)

메인 리스트의 `manual` 복원 모드와 상세 페이지의 `auto` 복원 모드 간의 충돌을 해결하기 위한 전략입니다.

- **Problem**: 상세 페이지 진입 시 브라우저가 이전 스크롤 위치를 기억하고 있어, 새로운 네비게이션임에도 불구하고 로딩 스켈레톤이나 본문이 페이지 중간부터 보이는 현상 발생.
- **Solution (Flag Strategy)**: `sessionStorage`와 Next.js `template.tsx`를 결합하여 구현.
  1. **Flag Setting**: `ExpressionCard`의 `Link` 클릭 시 `sessionStorage`에 리셋 플래그(`SCROLL_RESET_KEY`)를 저장하고 `history.scrollRestoration = 'auto'`를 선제적으로 적용합니다.
  2. **Template-level Reset**: 상세 페이지의 `template.tsx`(`app/expressions/[id]/template.tsx`)에서 플래그를 확인합니다. 템플릿은 페이지 로딩 스켈레톤보다 상위 계층이므로, 화면이 그려지기 직전에 `window.scrollTo(0, 0)`을 실행하여 시각적 결함을 원천 차단합니다.
  3. **Flag Cleanup**: 스크롤 리셋 직후 플래그를 제거하여, 이후의 '뒤로가기' 네비게이션(플래그 없음) 시에는 브라우저의 기본 스크롤 복원 메커니즘이 정상적으로 작동하도록 보장합니다.

### 9.5 Performance Optimization (성능 최적화)

복잡해 보일 수 있는 스크롤 및 데이터 연동 로직은 성능과 사용자 경험 간의 최적의 균형을 위해 다음과 같이 설계되었습니다.

- **Throttled Tracking (스크롤 추적 - 조용하고 효율적인 감시)**:
  - `Passive Listener`: addEventListener에 { passive: true } 옵션을 주어, 브라우저가 스크롤 최적화를 방해받지 않고 즉시 수행하도록 했습니다. 이로 인해 브라우저의 스크롤 성능 저하를 차단합니다.
  - `200ms 디바운스(Debounce)`: 사용자가 스크롤을 멈추거나 아주 잠깐 멈추는 찰나에만 딱 한 번 캐시를 업데이트합니다. 1초에 수백 번 발생하는 이벤트를 1초에 최대 5번 정도로 압축한 셈이라 CPU 점유율이 매우 낮습니다.
- **Efficient Restoration (복원 효율 - 가장 스마트한 대기)**:
  - `RAF(requestAnimationFrame) 기반 시도`: 단순히 한 번 스크롤 명령을 내리고 끝내는 것이 아니라, 브라우저가 다음 화면을 그리는 찰나(60fps)마다 "지금 리스트 높이가 충분한가? 스크롤 할 수 있는가?"를 체크하며 부드럽게 시도합니다.
  - `60회(약 1초) 제한 알고리즘`: 데이터 로딩이 너무 늦어지거나 예상치 못한 이유로 스크롤이 불가능할 때, 무한히 시도하며 CPU를 낭비하지 않도록 딱 1초(60프레임)만 시도하고 멈추는 안전장치를 두었습니다.
- **Lifecycle Management (자원 관리 - 클린업 & 부작용 방지)**:
  - `철저한 가비지 컬렉션`: 사용자가 다른 페이지로 떠나는 즉시(Unmount), 메모리에 남아있을 수 있는 스크롤 리스너와 진행 중인 RAF 애니메이션을 단 1ms의 지체 없이 모두 제거하여 성능 누수를 원천 차단합니다.
  - `전역 설정 격리`: 브라우저의 스크롤 복원 모드(`manual/auto`) 전환을 해당 리스트 페이지가 활성화된 동안에만 적용합니다. 덕분에 리스트와 상관없는 다른 페이지들의 스크롤 동작에는 아무런 부작용을 주지 않습니다.

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

### 10.5 Backfill & Multi-Language Merge Strategy (백필 병합 전략)

- **Challenge**: 이미 데이터가 존재하는 상태에서 새로운 언어(독/프/러/중/아)를 추가할 때, 기존 데이터(KO, JA, ES) 및 검증된 영문(EN) 데이터를 어떻게 처리할 것인가?
- **Solution (Dual Strategy)**:
  1.  **Universal Strategy (`universal_backfill_parse_code.js`)**:
      - 목적: 영문 콘텐츠 리뉴얼 또는 초기 데이터 생성.
      - 동작: `meaning`, `content`는 타겟 언어(6개국) 전체 덮어쓰기. `dialogue`는 영문 텍스트 갱신 + 신규 번역 병합.
  2.  **Supplementary Strategy (`supplementary_backfill_parse_code.js`)**:
      - 목적: 검증된 영문 데이터 보존 + 신규 언어 확장.
      - 동작: `en` 필드 업데이트를 차단하고 신규 언어만 주입하는 로직.
      - **주의**: 기존 영어 데이터가 보존됩니다.

### 10.6 Batch Processing Optimization (Backfill Efficiency)

- **Context**: 100개 이상의 데이터를 백필할 때 단건 처리(1-by-1)는 시간과 API 호출 비용 측면에서 비효율적임.
- **Solution**:
  - **Batching**: n8n Loop 노드의 Batch Size를 20으로 설정하여 데이터를 묶음 처리.
  - **Prompting**: `batch_dialogue_translation_prompt.txt`를 통해 한 번의 요청으로 20개의 아이템에 대한 번역 결과를 JSON Array로 반환받음.
  - **Parsing**: `batch_dialogue_translation_parse_code.js`에서 각 항목의 ID 매칭을 통해 대량의 응답을 정확한 원본 데이터에 병합.
  - **Result**: 처리 속도 95% 단축 및 토큰 효율성 증대.

### 10.7 Strict Prompt Engineering (No Mixed Language)

LLM이 번역 결과에 영어 원문을 포함하는 "언어 누출(Language Leakage)" 현상(예: "안녕하세요. Hello.")을 방지하기 위해 모든 프롬프트 템플릿에 강력한 제약 헤더를 추가했습니다.

- **No Mixed Language (CRITICAL)**: 타겟 값에 영어 텍스트를 포함하는 것을 명시적으로 금지합니다.
- **Target Language ONLY**: 오직 번역된 결과물만 허용됨을 강조합니다.
  이러한 제약 조건은 메인 콘텐츠 생성기와 배치 번역 프롬프트 모두에 적용됩니다.

### 10.8 Content Verification Logic (Strict Validation)

- **Context**: LLM 생성 데이터의 품질을 보장하기 위해 n8n 워크플로우 중간에 엄격한 검증 로직을 배치했습니다 (`10_validate_content.js`).
- **Rules**:
  1. **Structure Check**: 필수 필드(`expression`, `meaning`, `content`, `tags`, `dialogue`) 존재 여부 확인.
  2. **Tag Rules**: 소문자 영어만 허용, `#` 금지, 타겟 언어 문자 포함 금지.
  3. **No Mixed Language**: 번역 필드(`meaning`, `dialogue.translations`)에 영어 알파벳 소문자가 포함되어 있는지 검사하여 "언어 누출"을 방지.
     - **Exception**: 고유명사(대문자로 시작)나 허용 목록(`allowedlist`: iPhone, eBay 등)에 있는 단어는 통과.
  4. **Markdown Prevention**: 대화 번역문에 마크다운 문법(`**bold**`)이 포함되지 않도록 강제.
  5. **Dialogue Length**: 대화가 너무 짧거나 길어지지 않도록 **2~4턴**의 길이를 강제.
  6. **Quiz Consistency**: 퀴즈 선택지(Option A, B, C)의 언어가 모두 영어이거나 모두 타겟 언어여야 함(혼용 금지).
- **Local Verification**: 동일한 로직을 로컬에서 수행할 수 있는 `verification/verify_db_data.js`를 제공하여, `temp.json` 데이터를 워크플로우 실행 없이 빠르게 검증할 수 있습니다.

### 10.9 Quiz Structure Validation (퀴즈 구조 검증)

**Problem**: DB에서 잘못된 quiz 구조 발견

- **Expected**: `quiz: { question: string, answer: string }`
- **Found**: `quiz: { question: string, answer: string, options: string[] }`
- **Issue**: Gemini가 `question` 필드에 선택지를 넣지 않고 `options` 배열을 별도로 생성

**Solution**: 두 가지 접근

1. **Gemini 프롬프트 강화**: DB 구조 명시
2. **Validation 로직 강화**: 잘못된 구조 차단

**Gemini Prompt Update** (`08_gemini_content_generator_prompt.txt`, `04_gemini_master_generator_prompt_v2.txt`):

```plaintext
2. **Database Structure (CRITICAL)**: The quiz object MUST contain ONLY two fields: "question" and "answer". DO NOT create an "options" field.
3. **Options in Question Field**: You MUST include all 3 options (A, B, C) inside the "question" field.
4. **Format**: "question": "Question text?\n\nA. option1\nB. option2\nC. option3"
```

**Validation Logic** (`10_validate_content.js`, `06_validate_content_v2.js`, `verify_db_data.js`):

```javascript
// 1. quiz.options 필드 금지
if (contentObj.quiz.options) {
  errors.push(
    `Content (${lang}).quiz must NOT have 'options' field. Options should be in 'question' field.`
  );
}

// 2. quiz.question 내 선택지 A, B, C 필수
const hasOptionA = /\nA\.\s/.test(questionText) || /^A\.\s/.test(questionText);
const hasOptionB = /\nB\.\s/.test(questionText);
const hasOptionC = /\nC\.\s/.test(questionText);

if (!hasOptionA || !hasOptionB || !hasOptionC) {
  errors.push(
    `Content (${lang}).quiz.question must contain all options (A, B, C). Missing: ${missing.join(
      ", "
    )}`
  );
}
```

**Benefits**:

- ✅ Gemini가 올바른 quiz 구조로 생성하도록 명확히 지시
- ✅ Validation에서 잘못된 구조 즉시 차단
- ✅ 선택지 누락 감지 및 명확한 에러 메시지

### 10.10 Single-Shot AI Generation (V2 Optimization)

- **Architecture Shift**: 기존의 **2-Step** (Expression Selection -> Content Generation) 방식을 **Single-Shot** (Master Generator) 방식으로 통합했습니다.
- **Files**: `n8n/expressions/code_v2/` 하위의 `04_gemini_master_generator_prompt.txt` 및 `05_parse_master_json.js`.
- **Logic**:
  - **Integrated Context**: 단일 프롬프트 내에서 '표현 선정'과 '다국어 콘텐츠 생성'을 동시에 수행하여, AI가 선정한 표현의 의도와 뉘앙스가 예문 및 설명에 일관되게 반영되도록 합니다.
  - **Latency Reduction**: LLM 호출 횟수를 1회로 줄여 전체 파이프라인의 레이턴시를 약 40~50% 단축했습니다.
- **Fail-Fast Verification**: `Validate Content` 단계를 DB 조회(`Check Duplicate`)보다 앞단에 배치하여, 파싱 실패나 규격 미달 데이터를 조기에 필터링하고 불필요한 DB/Storage 요청을 방지했습니다.

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

## 12. Learning Mode System (학습 모드 시스템)

리스닝 집중도를 높이기 위해 텍스트 정보를 단계적으로 노출하는 시스템입니다.

### 12.1 View Mode State Machine (뷰 모드 상태 머신)

### 12.1 View Mode State Machine (뷰 모드 상태 머신)

학습 모드의 복잡한 상호작용을 체계적으로 관리하기 위해 3가지 상태를 가진 State Machine을 도입했습니다.

- **State Definition**:

  - **`blind` (Default)**: 리스닝 집중 모드. 모든 영어/해석 텍스트가 블러 처리됨. '해석 전체 보기' 버튼은 Soft Disabled 상태가 됨.
  - **`partial`**: 부분 확인 모드. 사용자가 안 들리는 특정 영어 문장만 클릭하여 일부만 드러낸 상태. **이 상태에서는 해석을 클릭하여 개별적으로 확인하는 것도 허용됩니다.**
  - **`exposed`**: 학습 모드 해제 상태. 모든 텍스트가 제약 없이 사용자 설정(해석 숨김 여부 등)에 따라 표시됨.

- **Transition Flow**:
  1.  **`blind` → `partial`**: 사용자가 블러 처리된 영어 문장 중 하나를 클릭할 때 전환됩니다.
  2.  **`partial` → `exposed`**:
      - **Auto-Exposed**: 문장을 하나씩 열다가 **모든 문장이 공개(`revealedEnglishIndices.size === dialogue.length`)**되는 순간 자동 전환됩니다.
      - **Manual Toggle**: 사용자가 'Headphones' 또는 'Translation Blur' 버튼을 눌러 직접 모드를 해제할 때도 전환됩니다.
  3.  **`exposed` → `blind`**: 사용자가 'Headphones' 아이콘을 클릭하여 리스닝 모드를 켤 때 전환됩니다. 이때 현재의 해석 노출 상태가 백업(State Preservation)됩니다.

### 12.2 State Preservation Logic (상태 보존 로직)

- **Mechanism**:
  - `exposed` 모드에서 사용자가 설정한 '해석 보기' 상태(`revealedIndices`)를 `savedRevealedIndices`에 백업하고 `blind` 모드로 진입합니다.
  - `blind` 모드를 끄거나 `auto-exposed` 되면 백업된 상태를 복원하여, 사용자의 원래 의도(해석 다 보기 등)를 유지합니다.
- **Soft Disabled UI**:
  - `bling` 모드 중에는 '해석 전체 보기(Eye Icon)' 버튼이 '켜져 있지만 흐릿한(Soft Disabled)' 색상으로 표시되어, 모드가 Override 중임을 암시합니다.

### 12.3 English & Translation Interaction

- **Partial Reveal**: 영어 문장 클릭 시 `revealedEnglishIndices`에 추가하고 즉시 노출합니다.
- **Auto Sync**: `revealedEnglishIndices`의 크기가 전체 대화 길이와 같아지면 즉시 `viewMode`를 `exposed`로 전환하고, `savedRevealedIndices`를 파기(Discard)하여 현재 상태를 새로운 Context로 확정합니다.

## 13. Service Essentials Implementation (시스템 필수 요소 구현)

서비스 품질을 결정짓는 3대 요소(PWA, SEO, i18n)에 대한 기술적 구현 상세입니다.

### 13.1 PWA & Splash Screen Strategy (스플래시 스크린 전략)

- **Library**: `next-pwa` (플러그인) + `pwa-asset-generator` (에셋 생성)
- **Challenge**: iOS는 안드로이드와 달리 매니페스트 파일만으로 스플래시 스크린을 자동 생성해주지 않으며, 기기 해상도별로 정확한 사이즈의 이미지를 `<link rel="apple-touch-startup-image">`로 제공해야 합니다.
- **Solution (Adaptive Padding)**:
  - `pwa-asset-generator`를 사용하여 30여 종의 해상도별 이미지를 생성했습니다.
  - **Padding Logic**: 로고가 화면에 꽉 차지 않고 여백을 갖도록, HTML 기반 렌더링 시 **Portrait(세로) 30%**, **Landscape(가로) 20%**의 패딩을 주어 생성했습니다. 이를 통해 아이패드 등 태블릿 가로 모드에서도 로고가 잘리지 않고 안정적으로 표시됩니다.
- **Build Config**: `next-pwa`와 Turbopack의 호환성 문제 및 Vercel 배포 안정성을 위해, Dev/Build 스크립트에 `--webpack` 플래그를 명시적으로 적용했습니다.
- **Explicit Injection (iOS Fix)**: Next.js `metadata.appleWebApp`의 자동 생성 태그가 iOS에서 스플래시 스크린을 제대로 트리거하지 못하는 이슈(White Screen)가 확인되어, `app/layout.tsx`에 수동으로 `<head>` 태그를 선언하고 `<link rel="apple-touch-startup-image">`를 직접 주입하는 **Hard-coded Link Strategy**를 채택했습니다. 또한 `apple-mobile-web-app-capable` 태그도 명시적으로 추가하여 Standalone 모드를 보장합니다.

### 13.4 PWA Theme Color (동적 테마 컬러)

- **Problem**: `viewport`의 `themeColor`를 단일 문자열(`#ffffff`)로 설정 시, 다크 모드에서도 상태 표시줄이 흰색으로 유지되어 눈부심 유발.
- **Solution**: Next.js Viewport API를 활용하여 미디어 쿼리 기반의 동적 색상 배열을 설정했습니다.
  ```typescript
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ];
  ```

### 13.2 Dynamic SEO & Open Graph (동적 SEO)

- **Metadata API**: Next.js 14+의 `generateMetadata` 함수를 활용하여 페이지별로 동적인 `title`과 `description`을 주입합니다.
- **Structured Data (JSON-LD)**: 단순 메타 태그를 넘어, 구글 검색 엔진이 포맷을 이해할 수 있도록 `script` 태그에 `LearningResource` 스키마를 JSON-LD 포맷으로 삽입했습니다.
- **Node.js-generated OG Image**:
  - `app/expressions/[id]/opengraph-image.tsx`를 구현했습니다.
  - **Runtime Strategy**: 고화질 로고 이미지(`fs.readFileSync`)와 커스텀 폰트 파일 로딩을 위해 기본 `edge` 런타임 대신 **`nodejs` 런타임**을 채택했습니다.
  - ImageResponse API를 사용하여, 공유되는 표현(Expression) 텍스트가 박힌 세련된 이미지를 **Request Time에 동적으로 생성**합니다.
  - 이를 통해 수천 개의 표현에 대해 정적 이미지를 미리 만들어둘 필요 없이, 강력한 소셜 미디어 미리보기(썸네일)를 제공합니다.
  - 브랜드 아이덴티티(그라데이션 로고, Inter 폰트)가 적용된 고품질 썸네일을 제공합니다.

### 13.3 Type-Safe i18n Architecture (타입 안전 i18n)

- **Total 9 Languages**: EN, KO, JA, ES, FR, DE, RU, ZH, AR 지원.
- **Inference & Maintenance**:
  - `export type Dictionary = typeof en;`을 통해 영어 원문(`en.ts`)의 키 구조를 타입으로 추론합니다.
  - `dictionaries` 객체에 `Record<SupportedLanguage, Dictionary>` 타입을 강제하여, 다른 언어 파일에서 키가 하나라도 누락되면 빌드 에러를 발생시킵니다.
- **Hardcoded String Removal (상수 기반 관리)**:
  - 기존 코드 전반에 산재해 있던 `'en'`, `'ko'` 등 리터럴 문자열을 `SupportedLanguage.EN`, `SupportedLanguage.KO` 등 상수로 대체했습니다.
  - 이를 통해 로케일 로직의 오타를 원천 차단하고 중앙 집중식 관리를 실현합니다.
- **Structure**:
  - `SupportedLanguage`: 언어 코드의 Single Source of Truth.
  - `LOCALE_DETAILS`: 각 언어별 메타 정보(라벨, 태그, OG Locale)를 매핑한 객체.
  - `Locale`: `SupportedLanguage` 타입에서 파생된 유니온 타입.
- **Benefit**: 새로운 언어 추가 시 컴파일러 레벨에서 누락된 설정이나 오타를 즉시 감지할 수 있어 안정적인 확장이 가능합니다.

### 13.4 i18n Locale Language Consistency Validation (언어팩 일관성 검증)

**File**: `verification/verify_i18n_locales.js`

**Purpose**: 9개 언어 파일(`i18n/locales/*.ts`)이 각각 해당 언어만 포함하는지 자동으로 검증하여 언어 일관성을 보장합니다.

#### A. Language Configuration (언어별 설정)

각 언어별로 허용/금지 스크립트를 정의합니다:

```javascript
const LANGUAGE_CONFIG = {
  ko: {
    name: "Korean",
    primaryScript: REGEX.hangul,
    allowedScripts: [REGEX.hangul],
    forbiddenScripts: [REGEX.kana, REGEX.han, REGEX.cyrillic, REGEX.arabic],
  },
  ja: {
    name: "Japanese",
    primaryScript: REGEX.kana,
    allowedScripts: [REGEX.kana, REGEX.han], // 일본어는 한자 사용
    forbiddenScripts: [REGEX.hangul, REGEX.cyrillic, REGEX.arabic],
  },
  // ... 다른 언어들
};
```

**Unicode Ranges**:

- **한글**: `\uAC00-\uD7AF` (음절), `\u1100-\u11FF` (자모)
- **가나**: `\u3040-\u309F` (히라가나), `\u30A0-\u30FF` (가타카나)
- **한자**: `\u4E00-\u9FCC` (통합 한자)
- **키릴**: `\u0400-\u04FF` (러시아어)
- **아랍**: `\u0600-\u06FF` (아랍어)

#### B. Template Variable Handling (템플릿 변수 처리)

동적으로 치환되는 변수명과 고유명사를 허용 목록으로 관리합니다:

```javascript
const ALLOWED_ENGLISH_TERMS = [
  // 고유명사 (브랜드명)
  "iPhone",
  "eBay",
  "Instagram",
  "TikTok",
  "YouTube",

  // 템플릿 변수 (동적 치환)
  "serviceName",
  "expression",
  "meaning",
  "tag",
];
```

**Smart English Inclusion Check**:

- ✅ **허용**: 대문자로 시작하는 단어 (Instagram, TikTok)
- ✅ **허용**: 허용 목록의 용어 (serviceName, expression)
- ❌ **차단**: 소문자 영어 단어 (hello, world) - 누출로 간주

#### C. TypeScript Parsing Strategy (파싱 전략)

**Primary Method**: JSON Parsing

```javascript
// 1. 템플릿 리터럴 제거
objectStr = objectStr.replace(/`[^`]*`/g, (match) => {
  return JSON.stringify(match.slice(1, -1));
});

// 2. 주석 제거
objectStr = objectStr.replace(/\/\/.*/g, "");
objectStr = objectStr.replace(/\/\*[\s\S]*?\*\//g, "");

// 3. 키를 따옴표로 감싸기
objectStr = objectStr.replace(/(\w+):/g, '"$1":');

// 4. JSON 파싱
return JSON.parse(objectStr);
```

**Fallback Method**: Regex Extraction

템플릿 리터럴(`\`...\``)과 변수 삽입(`${SERVICE_NAME}`)으로 인해 JSON 파싱이 실패할 경우 정규표현식으로 문자열 값만 추출합니다:

```javascript
function parseFallback(content) {
  const result = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const match = line.match(/(\w+):\s*["']([^"']+)["']/);
    if (match) {
      result[match[1]] = match[2];
    }
  }

  return result;
}
```

#### D. Validation Logic (검증 로직)

**4-Step Process**:

1. **TypeScript 파일 파싱**: JSON 변환 또는 Fallback 메서드
2. **문자열 추출**: 모든 문자열 값 재귀적 추출
3. **금지된 스크립트 검사**: 언어별 금지 문자 검증
4. **영어 누출 검사**: 비라틴 언어만 소문자 영어 차단

```javascript
function validateLocaleFile(lang, filePath) {
  const config = LANGUAGE_CONFIG[lang];
  const errors = [];

  // 1. 파일 파싱
  const localeData = parseLocaleFile(filePath);

  // 2. 문자열 추출
  const strings = extractStrings(localeData);

  // 3. 각 문자열 검증
  strings.forEach(({ path, value }) => {
    // 금지된 스크립트 검사
    config.forbiddenScripts.forEach((forbiddenRegex) => {
      if (forbiddenRegex.test(value)) {
        errors.push(`[${path}] Contains forbidden script`);
      }
    });

    // 영어 누출 검사 (비라틴 언어만)
    if (!["es", "fr", "de", "en"].includes(lang)) {
      checkEnglishInclusion(value, `[${path}]`, errors);
    }
  });

  return { valid: errors.length === 0, errors };
}
```

#### E. Key Design Decisions (주요 설계 결정)

1. **EXCLUDED_KEYS 제거**: 초기에는 `expressionTitle`, `expressionDesc` 필드를 검증에서 제외했으나, 템플릿 변수를 허용 목록으로 관리하면서 불필요해져 제거했습니다.

2. **언어별 특성 반영**:

   - 일본어는 한자 사용이 필수이므로 `allowedScripts`에 포함
   - 라틴 계열 언어는 영어 알파벳을 사용하므로 영어 누출 검사 제외

3. **Fallback 전략**: TypeScript 파일의 복잡한 구조(템플릿 리터럴, 변수 삽입)로 인한 파싱 실패에 대비하여 정규표현식 기반 Fallback 메서드 구현

4. **조용한 실패**: Fallback 메서드 사용 시 경고 메시지를 출력하지 않아 출력이 깔끔하게 유지됨

#### F. Usage (사용법)

```bash
$ node verification/verify_i18n_locales.js

🔍 Validating 9 locale files...

📄 Checking ar.ts (Arabic)...
   ✅ All checks passed
📄 Checking ko.ts (Korean)...
   ✅ All checks passed
# ... 다른 언어들

============================================================
✅ All locale files passed validation!
============================================================
```

**Exit Codes**:

- `0`: 모든 검증 통과
- `1`: 하나 이상의 언어 파일에서 위반 발견

## 14. Analytics Implementation (사용자 행동 분석)

Google Analytics 4를 Next.js 16 App Router 환경에 통합하여 사용자 행동 데이터를 수집하고 분석하는 시스템입니다.

### 14.1 Environment-Based Configuration (환경별 설정)

- **Dual Property Strategy**: 개발과 프로덕션 환경에서 별도의 GA4 속성을 사용하여 테스트 데이터가 실제 통계에 섞이지 않도록 분리합니다.
- **Environment Variables**:
  - `NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID`: 개발용 측정 ID
  - `NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID`: 프로덕션용 측정 ID
- **Automatic Selection**: `lib/analytics/index.ts`에서 `process.env.NODE_ENV`를 기반으로 자동 선택:
  ```typescript
  export const GA_MEASUREMENT_ID =
    process.env.NODE_ENV === "production"
      ? GA_MEASUREMENT_ID_PROD
      : GA_MEASUREMENT_ID_DEV;
  ```
- **Benefit**: 환경 전환 시 수동 설정 변경 불필요, 실수 방지

### 14.2 Type-Safe Event Tracking (타입 안전한 이벤트 추적)

- **Function Overloading**: `gtag` 함수의 타입 정의를 함수 오버로드로 구현하여 각 명령어(`js`, `config`, `event`)별로 다른 타입의 파라미터를 받을 수 있도록 설계:
  ```typescript
  declare global {
    interface Window {
      gtag?: {
        (command: "js", date: Date): void;
        (
          command: "config",
          targetId: string,
          config?: Record<string, any>
        ): void;
        (
          command: "event",
          eventName: string,
          params?: Record<string, any>
        ): void;
      };
      dataLayer?: any[];
    }
  }
  ```
- **Event Helpers**: 각 이벤트별로 타입 안전한 헬퍼 함수 제공:
  ```typescript
  export const trackExpressionClick = (params: {
    expressionId: string;
    expressionText: string;
    category: string;
    source: "home_feed" | "related" | "search";
  }): void => {
    trackEvent("expression_click", {
      expression_id: params.expressionId,
      expression_text: params.expressionText,
      category: params.category,
      source: params.source,
    });
  };
  ```
- **Benefit**: 컴파일 타임에 파라미터 검증, 런타임 에러 방지, IDE 자동 완성 지원

### 14.3 Automatic Page View Tracking (자동 페이지 뷰 추적)

- **Provider Component**: `lib/analytics/AnalyticsProvider.tsx`가 라우트 변경을 감지하여 자동으로 페이지 뷰 전송
- **Implementation**:

  ```typescript
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // Wait for document.title to be set by Next.js metadata
    const timer = setTimeout(() => {
      trackPageView(url, document.title, lang);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams, lang]);
  ```

- **Title Synchronization**: `setTimeout` 100ms를 사용하여 Next.js Metadata API가 `document.title`을 설정할 시간을 확보
  - **Problem**: 클라이언트 컴포넌트가 렌더링될 때 SSR에서 생성된 title이 아직 적용되지 않은 상태
  - **Solution**: 짧은 지연을 통해 hydration이 완료되고 title이 설정될 때까지 대기
- **Provider Hierarchy**: `AnalyticsProvider`를 최상위에 배치하여 다른 Provider와 독립적으로 작동:
  ```tsx
  <AnalyticsProvider lang={locale}>
    <ExpressionProvider>{children}</ExpressionProvider>
  </AnalyticsProvider>
  ```

### 14.4 Development vs Production Behavior (개발/프로덕션 동작 분리)

- **Development Mode**:
  - 콘솔 로그로 이벤트 출력: `console.log('[Analytics] Event:', eventName, properties)`
  - GA4로 데이터 전송하지 않음
  - 실시간 디버깅 용이
- **Production Mode**:
  - GA4로 실제 데이터 전송
  - 콘솔 로그 출력 안 함
- **Conditional Logic**:
  ```typescript
  export const isAnalyticsEnabled = (): boolean => {
    return typeof window !== "undefined" && !!GA_MEASUREMENT_ID;
  };
  ```

### 14.5 Event Taxonomy (이벤트 분류 체계)

- **Naming Convention**: `{object}_{action}` 형식의 snake_case 사용
- **Core Events** (10개):
  1. `page_view`: 페이지 뷰 (자동)
  2. `expression_view`: 표현 상세 조회
  3. `expression_click`: 표현 카드 클릭
  4. `audio_play`: 오디오 재생
  5. `audio_complete`: 오디오 재생 완료
  6. `learning_mode_toggle`: 학습 모드 전환
  7. `filter_apply`: 필터 적용
  8. `search`: 검색 실행
  9. `tag_click`: 태그 클릭
  10. `related_click`: 관련 표현 클릭
- **Future Events** (2개): 11. `share_click`: 공유 버튼 클릭 12. `share_complete`: 공유 완료

### 14.6 Integration with Next.js App Router (Next.js 통합)

- **Script Injection**: `app/layout.tsx`에서 GA4 스크립트를 `afterInteractive` 전략으로 로드:
  ```tsx
  <Script
    strategy="afterInteractive"
    src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
  />
  ```
- **Configuration**: `send_page_view: false`로 설정하여 자동 페이지 뷰를 비활성화하고 `AnalyticsProvider`에서 수동 제어
- **Single Source of Truth**: `GA_MEASUREMENT_ID`를 `analytics/index.ts`에서 export하여 환경별 선택 로직을 한 곳에 집중

### 14.7 Component-Level Event Tracking (컴포넌트 레벨 이벤트 추적)

Phase 3에서 구현된 컴포넌트별 이벤트 추적 패턴입니다.

#### A. Expression Click Tracking (표현 클릭 추적)

- **Component**: `components/ExpressionCard.tsx`
- **Implementation**:

  ```typescript
  import { trackExpressionClick } from "@/analytics";

  // Link onClick handler
  onClick={() => {
    trackExpressionClick({
      expressionId: item.id,
      expressionText: item.expression,
      category: item.category,
      source: "home_feed",
    });
    // ... 기존 스크롤 리셋 로직
  }}
  ```

- **Trigger**: 사용자가 홈 피드에서 표현 카드를 클릭할 때
- **Parameters**:
  - `expressionId`: 표현 고유 ID
  - `expressionText`: 표현 텍스트 (예: "snap up")
  - `category`: 카테고리 (예: "daily", "business")
  - `source`: 클릭 출처 (`"home_feed"`, `"related"`, `"search"`)

#### B. Expression View Tracking (표현 조회 추적)

- **Component**: `analytics/ExpressionViewTracker.tsx` (신규 생성)
- **Pattern**: Server-Client Component Separation
- **Challenge**: 표현 상세 페이지(`app/expressions/[id]/page.tsx`)는 서버 컴포넌트이지만, Analytics 추적은 클라이언트에서만 가능(`useEffect` 필요)
- **Solution**: 별도의 클라이언트 컴포넌트 생성

  ```typescript
  "use client";

  export default function ExpressionViewTracker({
    expressionId,
    category,
    lang,
  }: ExpressionViewTrackerProps) {
    useEffect(() => {
      trackExpressionView({
        expressionId,
        category,
        lang,
      });
    }, [expressionId, category, lang]);

    return null; // UI 없음, 추적만 수행
  }
  ```

- **Usage**: 서버 컴포넌트에서 import하여 사용
  ```typescript
  // app/expressions/[id]/page.tsx
  <ExpressionViewTracker
    expressionId={id}
    category={expression.category}
    lang={locale}
  />
  ```
- **Benefit**: 서버/클라이언트 경계를 명확히 분리하고 코드 재사용성 향상

#### C. Audio Play Tracking (오디오 재생 추적)

- **Component**: `components/DialogueAudioButton.tsx`
- **Pattern**: Optional Analytics Props
- **Implementation**:

  ```typescript
  interface DialogueAudioButtonProps {
    // ... 기존 props
    // Analytics props (선택적)
    expressionId?: string;
    audioIndex?: number;
    playType?: "individual" | "sequential";
  }

  // 재생 시작 시
  if (expressionId !== undefined && audioIndex !== undefined) {
    trackAudioPlay({
      expressionId,
      audioIndex,
      playType,
    });
  }
  ```

- **Design Decision**: Props를 선택적(optional)으로 설계
  - **Reason**: `DialogueAudioButton`은 범용 컴포넌트로 다양한 곳에서 사용됨
  - Analytics가 필요 없는 경우(미리보기, 테스트)에도 동작해야 함
  - Props가 제공되면 추적하고, 없으면 추적하지 않는 조건부 로직
- **Next Step**: `DialogueSection.tsx`에서 `expressionId` prop을 받아 `DialogueItem`으로 전달 필요

### 14.8 Analytics Module Organization (모듈 구조)

- **Directory**: `analytics/` (루트 레벨, `lib/`에서 이동)
- **Rationale**: Analytics는 단순 유틸리티가 아니라 독립적인 기능 모듈
  - GA4 통합, Provider, Tracker 등 여러 컴포넌트로 구성
  - `components/`, `hooks/`, `context/`와 동일한 레벨의 독립 모듈로 취급
- **Structure**:
  ```
  analytics/
  ├── index.ts                    # 12개 이벤트 추적 함수
  ├── AnalyticsProvider.tsx       # 페이지 뷰 자동 추적
  └── ExpressionViewTracker.tsx   # 표현 조회 추적 컴포넌트
  ```
- **Import Path**: `@/analytics` (기존 `@/lib/analytics`에서 변경)
- **Comment Convention**: 모든 주석 한국어로 통일 (프로젝트 규칙 준수)

## 15. Share Functionality Implementation (공유 기능 구현)

사용자가 표현을 소셜 미디어나 메신저로 공유할 수 있도록 Web Share API와 Clipboard API를 활용한 크로스 플랫폼 공유 시스템입니다.

### 15.1 ShareButton Component Architecture (컴포넌트 아키텍처)

- **File**: `components/ShareButton.tsx`
- **Strategy**: Progressive Enhancement (점진적 향상)
  - **Primary**: Web Share API (모바일 네이티브 공유)
  - **Fallback**: Clipboard API (데스크탑 복사)
- **Variant Support**:
  - `default`: 아이콘 + 텍스트 (상세 페이지용)
  - `compact`: 아이콘만 (카드용, 공간 효율적)

### 15.2 Web Share API Integration (네이티브 공유 통합)

- **Feature Detection**: `navigator.share` 존재 여부로 지원 확인
- **Share Data**:
  ```typescript
  await navigator.share({
    title: `${expressionText} - Speak Mango`,
    text: meaning,
    url: shareUrl,
  });
  ```
- **Platform Support**:
  - **Mobile**: Instagram, Twitter, KakaoTalk, WhatsApp 등 설치된 앱으로 직접 공유
  - **Desktop**: 대부분 미지원 → Clipboard Fallback 자동 전환

### 15.3 Clipboard Fallback Strategy (클립보드 폴백)

- **API**: `navigator.clipboard.writeText(url)`
- **User Feedback**: Toast 알림으로 복사 성공/실패 피드백
- **URL Generation**: `lib/utils.ts`의 `getShareUrl` 함수
  ```typescript
  export function getShareUrl(
    expressionId: string,
    utmParams?: Record<string, string>
  ): string {
    const url = `${BASE_URL}/expressions/${expressionId}`;
    if (!utmParams) return url;
    const params = new URLSearchParams(utmParams);
    return `${url}?${params.toString()}`;
  }
  ```
- **UTM Parameters**: 공유 출처 추적 (`utm_source=share`, `utm_medium=native`)

### 15.4 Toast Notification System (토스트 알림 시스템)

- **Component**: `components/ui/Toast.tsx`
- **Type System**: `types/toast.ts`
  - `ToastType`: `"success" | "error"`
  - `TOAST_TYPE`: 상수 객체 (`SUCCESS`, `ERROR`)
- **Design Pattern**: 재사용 가능한 독립 컴포넌트
  - ShareButton뿐만 아니라 향후 다른 기능(북마크, 좋아요 등)에서도 활용 가능
- **Animation**: Framer Motion 기반 fade-in + slide-in 효과
- **Auto-dismiss**: 3초 후 자동 사라짐

### 15.5 Event Propagation Prevention (이벤트 전파 방지)

- **Problem**: Expression Card는 전체가 `<Link>`로 감싸져 있어, 공유 버튼 클릭 시 상세 페이지로 이동하는 문제 발생
- **Solution**: 이중 방어 전략
  1. **ShareButton 내부**: `handleShare`에서 `e.preventDefault()` + `e.stopPropagation()`
  2. **ExpressionCard**: ShareButton의 `onClick` prop에서 `e.stopPropagation()`
- **Result**: 공유 버튼 클릭 시 페이지 이동 없이 공유 기능만 실행

### 15.6 Card Integration with Absolute Positioning (카드 통합)

- **Layout Strategy**: Absolute 포지셔닝으로 독립적 배치

  ```tsx
  <Link className="relative block h-full">
    {/* 카드 내용 */}

    <div className="absolute bottom-5 right-5">
      <ShareButton variant="compact" ... />
    </div>
  </Link>
  ```

- **Design Decision**:
  - **Initial Attempt**: 태그와 함께 flex 레이아웃 → 태그 개수에 따라 위치 변동
  - **Final Solution**: Absolute 포지셔닝 → 항상 우측 하단 고정 위치
- **Benefits**:
  - 일관된 위치 (태그 개수 무관)
  - 시각적 균형 확보
  - 태그 영역 침범 없음

### 15.7 Analytics Integration (분석 통합)

- **Events**:
  - `trackShareClick`: 공유 버튼 클릭 시 자동 호출
    - `shareMethod`: `"native"` (Web Share API) | `"copy_link"` (Clipboard)
    - `sharePlatform`: `"native"` | `"clipboard"`
  - `trackShareComplete`: 공유 성공 시 자동 호출
- **Implementation**: ShareButton 내부에서 자동 추적, 컴포넌트 사용자는 별도 로직 불필요

### 15.8 Internationalization (다국어 지원)

- **Translation Keys**: 9개 언어 (EN, KO, JA, ES, FR, DE, RU, ZH, AR)
  - `detail.share`: "Share" / "공유" / "共有" 등
  - `detail.shareCopied`: "Link copied!" / "링크 복사됨!" 등
  - `detail.shareFailed`: "Failed to share" / "공유 실패" 등
  - `card.share`, `card.shareCopied`, `card.shareFailed`: 카드용 동일 텍스트
