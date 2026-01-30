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

### 1.4 Responsive UI Architecture (반응형 UI 아키텍처)

초기 로딩 성능과 SSR(Server-Side Rendering) 호환성을 위해 JavaScript 의존도를 낮추고 CSS 유틸리티를 적극 활용하는 전략입니다.

- **Transition Strategy**: 기존의 `useIsMobile` 훅을 사용한 JS 조건부 렌더링(`!isMobile && ...`)을 지양하고, Tailwind CSS의 반응형 유틸리티(`hidden sm:block`)를 사용하여 브라우저 렌더링 엔진 레벨에서 표시 여부를 제어합니다. 이는 **Hydration Mismatch(서버-클라이언트 불일치)** 오류를 원천 차단합니다.
- **Performance Optimization**: `RelatedExpressions`와 같이 무거운 애니메이션이 포함된 컴포넌트의 경우, CSS로 숨겨진 상태(`display: none`)에서도 JS 연산이 계속되는 것을 막기 위해 `offsetParent === null` 체크를 도입했습니다. 이를 통해 모바일 환경에서 보이지 않는 데스크탑용 애니메이션 연산을 중지하여 배터리와 CPU 자원을 절약합니다.

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

### 3.3 Manual Animation & Event Delegation (수동 애니메이션 및 이벤트 위임)

Framer Motion의 선언적 애니메이션(`whileTap`)과 복잡한 중첩 인터랙션 간의 충돌을 해결하기 위한 전략입니다.

- **Problem**: `ExpressionCard` 전체를 감싸는 `Link`에 `whileTap`을 적용할 경우, 카드 내부에 위치한 '좋아요' 등의 액션 버튼을 클릭해도 카드 전체가 반응(Scale-down)하는 시각적 부적절함이 발생합니다. `e.stopPropagation()`은 네비게이션은 막아주지만, Framer Motion의 제스처 감지는 DOM 트리 전체에 대해 작동하기 때문입니다.
- **Solution (Manual Control)**:
  - **`InteractiveLink`**: `whileTap` 대신 `useAnimation` 훅을 통한 명령형 애니메이션 제어를 도입했습니다.
  - **Event Filtering**: `onPointerDown` 핸들러에서 클릭된 요소가 `data-action-buttons` 속성을 가진 요소 내부에 있는지(`closest`) 확인합니다.
  - **Conditional Trigger**: 액션 버튼 영역 외부 클릭일 때만 `controls.start({ scale: 0.98 })`을 호출하여 애니메이션을 실행합니다. 이를 통해 "이 영역은 카드 애니메이션에서 제외한다"는 명확한 구분이 가능해졌습니다.
- **Event Delegation & Isolation**:
  - **`ActionButtonGroup`**: 개별 버튼들을 감싸는 이 컴포넌트에 `pointer-events-auto`와 `data-action-buttons`를 적용하고, 모든 포인터 이벤트에 `stopPropagation()`을 강제하여 부모의 커스텀 포인터 로직과 완전히 분리했습니다.
  - **Parent Container**: `ExpressionActions`의 메인 컨테이너에 `pointer-events-none`을 적용하여, 버튼 사이의 빈 공간을 클릭했을 때는 이벤트가 부모인 `InteractiveLink`로 자연스럽게 흘러 들어가 카드 전체의 애니메이션과 네비게이션이 작동하도록 설계했습니다.
- **Type Safety Pattern**: 외부 라이브러리(`framer-motion`)의 복잡한 타입(`AnimationControls`)을 직접 사용하는 대신, 필요한 메서드(`start`)만 포함하는 `SimpleAnimationControls` 인터페이스를 로컬에 정의하여 버전 호환성 문제와 타입 충돌을 방지하는 'Duck Typing' 패턴을 적용했습니다.

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

### 4.3 Client-Side Data Injection (Context API)

- **File**: `context/I18nContext.tsx`
- **Mechanism**: 서버 컴포넌트에서 로드된 `dict`와 `locale` 데이터를 클라이언트 컴포넌트 트리 전체에 효율적으로 전파하기 위해 React Context API를 활용합니다.
- **Provider**: `I18nProvider`는 루트 레이아웃(`layout.tsx`)에서 트리 상단에 위치하여, 모든 말단 컴포넌트에 번역 데이터를 공급합니다.
- **Hook**: 커스텀 훅 `useI18n()`을 제공하여, 컴포넌트가 부모로부터 Prop을 주입받지 않고도 필요한 시점에 즉시 언어 정보를 참조할 수 있도록 설계했습니다.
- **Impact**: **Prop Drilling**을 완전히 제거하여 코드 가독성과 유지보수성을 극대화했으며, 말단 컴포넌트(`ShareButton`, `DialogueAudioButton` 등)의 독립적인 재사용성을 확보했습니다.

### 4.4 International SEO Implementation (국제 SEO 구현)

> **Note**: 다국어 URL 구조, Canonical, Hreflang 등 SEO 최적화와 관련된 상세 구현은 [14.3 International SEO Optimization](#143-international-seo-optimization-국제-seo-최적화) 섹션을 참조하십시오.

## 5. Data Architecture & Optimization

### 5.1 ISR (Incremental Static Regeneration)

- **Strategy**: 매 요청마다 DB를 조회하지 않고, 1시간(`revalidate = 3600`)마다 정적 페이지를 재생성합니다.
- **Implementation**: `app/page.tsx` 등 페이지 컴포넌트에서 `export const revalidate` 상수를 정의하여 적용합니다.
- **Effect**: 데이터베이스 부하를 최소화하면서도 사용자에게 빠른 로딩 속도(TTFB)를 제공합니다.

### 5.2 Supabase Client Separation

- **Files**: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- **Reason**: Next.js 환경에서 쿠키 접근 방식이 다르기 때문에, 브라우저 환경(`createBrowserClient`)과 서버 환경(`createServerClient`)용 유틸리티를 분리하여 구현했습니다.
- **Multi-Schema**: `createBrowserSupabase(schema?)`와 같이 스키마를 인자로 받아 다국어 확장에 유연하게 대응하도록 설계되었습니다.

### 5.3 Client-Side State Management (Zustand)

- **Library**: `zustand` + `persist` middleware.
- **Purpose**: 로컬 사용자 액션(좋아요, 저장 등)의 고성능 처리 및 UI 반응성 확보.
- **Implementation**:
  - **Memory-First**: `Set` 자료구조를 사용하여 `O(1)` 성능으로 상태를 관리합니다.
  - **Auto-Persist**: 상태 변경 시 자동으로 `localStorage`에 직렬화(`Array.from`)하여 저장하고, 로드 시 역직렬화(`new Set`)합니다.
  - **SSR Safety**: `persist` 미들웨어의 내부 로직 덕분에 Next.js Hydration 과정에서 불일치 에러 없이 안전하게 초기화됩니다.
- **Structure**:
  - `store/useLocalActionStore.ts`: 실제 상태를 관리하는 Zustand 스토어.
  - `services/repositories/LocalUserActionRepository.ts`: 스토어에 접근하는 비동기 어댑터 (Repository Pattern 유지).

## 6. Search & Navigation Logic

### 6.1 URL Query Parameter State

- **Principle**: 모든 필터 및 검색 상태(Category, Tag, Search Term)는 URL Query Parameter(`?category=...&tag=...`)를 Single Source of Truth로 사용합니다.
- **Benefit**: 사용자가 현재 보고 있는 필터 상태를 URL 복사만으로 공유할 수 있습니다.

### 6.2 Centralized Routing System (라우트 중앙 관리)

- **File**: `lib/routes.ts`
- **Implementation**:
  - 앱 내의 모든 URL 경로를 `ROUTES` 상수로 관리합니다. (Relative Paths)
  - `CANONICAL_URLS` 객체를 통해 SEO 및 공유에 필수적인 **절대 경로(Canonical URL)** 생성을 중앙화합니다.
  - **(2026-01-26 업데이트)**: 다국어 SEO 최적화를 위해 메타데이터(`canonical`, `og:url`)에서는 절대 경로 대신 **상대 경로(`"./"`)**를 사용하는 전략으로 변경되었습니다. 다만, 절대 경로가 필수적인 Schema.org(JSON-LD) 생성을 위해 `CANONICAL_URLS` 유틸리티는 여전히 중요하게 사용됩니다.
  - 필터 조합(Category, Tag, Search)을 기반으로 적절한 홈 경로를 생성하는 `getHomeWithFilters()` 헬퍼 함수를 포함합니다.
- **Benefit**: 하드코딩된 경로 문자열을 제거하여 링크 구조 변경 시 한 곳에서만 수정하면 되므로 유지보수성과 타입 안정성이 크게 향상됩니다.

### 6.3 Smart Tag Detection (스마트 태그 감지)

- **Logic**: 사용자가 검색창에 `#`으로 시작하는 단어를 입력하면(`SearchBar.tsx`), 이를 일반 검색어가 아닌 '태그 필터'로 인식하여 URL을 `?tag=...`로 변환합니다.

### 6.4 Sticky UI Interaction (스티키 UI 상호작용)

- **Hook**: `hooks/useScroll.ts`
- **Logic**: 윈도우 스크롤 이벤트를 감지하여 특정 임계값(예: 80px)을 넘으면 `isScrolled` 상태를 반환합니다.
- **Visual Strategy (Prop Injection)**:
  - `Header` 컴포넌트는 `scrolledClassName` prop을 통해 스크롤 시 추가될 스타일을 외부에서 주입받습니다.
  - 이를 통해 메인 페이지(`HomeHeader`)에서는 스크롤 시 테두리를 제거(`border-none-layout`)하고 배경색을 레이아웃 색상(`bg-layout-transparent`)으로 변경하여 하단 필터바와 시각적으로 연결합니다.
  - 반면 서브 페이지(퀴즈, 상세)에서는 기본 스타일을 유지하여 페이지 간의 맥락에 맞는 디자인을 유연하게 적용합니다.

### 6.5 Locale-Specific Search (로케일별 검색)

- **Problem**:
  - 모든 언어의 `meaning` 필드를 검색하여 부정확한 결과 표시 (예: 한국어 사용자가 "oke" 검색 시 영어 meaning에 "oke"가 있는 결과도 포함)
  - `meaning->>locale` 검색 방식은 인덱스를 타지 못해 전체 테이블 스캔(Full Scan)이 발생하여 속도가 느렸음.
  - 단순 텍스트 검색(`meaning_text`만 사용)은 다른 언어의 키워드까지 매칭되는 "정확도 노이즈" 문제 존재.
- **Solution (Double-Filter Pattern)**:
  - `meaning_text` 컬럼(Generated Column)과 Trigram 인덱스를 추가하여 고속 검색 기반 마련.
  - 다음 두 단계의 필터를 `AND` 조건으로 결합:
    1.  **Fast Index Scan**: `meaning_text.ilike`로 인덱스를 타서 후보군을 좁힘 (Candidate Generation).
    2.  **Precise Recheck**: `meaning->>locale.ilike`로 실제 JSON 데이터에서 해당 언어 일치 여부 검증.
  ```typescript
  const locale = filters.locale || "en";
  query = query.or(
    `expression.ilike.%${searchTerm}%,and(meaning_text.ilike.%${searchTerm}%,meaning->>${locale}.ilike.%${searchTerm}%)`,
  );
  ```
- **Flow**: `app/page.tsx`에서 `getI18n()`으로 locale 획득 → `getExpressions({ ...filters, locale })` → `ExpressionList`에서 `filtersWithLocale` 생성 → 페이지네이션 시에도 locale 유지
- **Performance**: '인덱스 없는 쿼리' 대비 **수백 배 빠른 응답 속도**와 **완벽한 로케일 정확성** 동시 달성.

### 6.6 Duplicate Search Prevention (중복 검색 방지)

- **Problem**: 동일한 검색어를 여러 번 입력하면 매번 네트워크 요청 발생
- **Solution**: `useRef`로 이전 검색어를 추적하고 동일하면 즉시 리턴
  ```tsx
  const previousSearchRef = useRef<string>(initialValue);
  const executeSearch = useCallback(
    (searchValue: string) => {
      if (searchValue === previousSearchRef.current) return;
      previousSearchRef.current = searchValue;
      onSearch(searchValue);
    },
    [onSearch],
  );
  ```
- **Why useRef**: `useState`는 리렌더링 발생, `useRef`는 값 변경 시 리렌더링 없음 (효율적)
- **Result**: 중복 요청 100% 차단, 네트워크 부하 감소

### 6.7 Database Indexing for Search (검색 인덱스 최적화)

- **GIN Index (JSONB meaning)**:
  - `CREATE INDEX idx_expressions_meaning_gin ON speak_mango_en.expressions USING GIN (meaning);`
  - JSONB 특화, 9개 언어 키를 하나의 인덱스로 커버
- **Trigram Index (TEXT expression)**:
  - `CREATE INDEX idx_expressions_expression_trgm ON speak_mango_en.expressions USING GIN (expression gin_trgm_ops);`
  - 문자열을 3글자씩 나눈 조각으로 인덱싱 (예: "hello" → "hel", "ell", "llo")
  - ILIKE 쿼리 성능 향상: 250ms → 15ms (16.6배)
- **Troubleshooting**: `unstable_cache`와 `cookies()` 충돌로 인해 캐싱 제거, Next.js 기본 캐싱 메커니즘 활용 (Page-level `revalidate = 3600`, Supabase 자체 캐싱, 클라이언트 사이드 중복 방지)

### 6.8 Auth Navigation Loop Handling (인증 네비게이션 루프 처리)

구글 로그인과 같은 외부 OAuth 인증 후 돌아왔을 때, 브라우저의 전용 '뒤로가기' 버튼이나 UI상의 '뒤로가기' 버튼이 인증 페이지로 사용자를 되돌리는 문제를 해결하기 위한 스킵 로직입니다.

- **File**: `components/BackButton.tsx`
- **Logic**:
  - **Detection**: `document.referrer`가 `accounts.google.com`을 포함하는지 확인합니다.
  - **Skipping**: 인증 흐름은 보통 `[이전 페이지] -> [현재 페이지(GUEST)] -> [구글 인증] -> [현재 페이지(USER)]` 순으로 히스토리를 생성합니다.
  - **Action**: 따라서 `isBackToLogin`이 감지되면 `window.history.go(-3)`을 호출하여 위 과정을 역순으로 건너뛰고 바로 `[이전 페이지]`에 도달하게 합니다.
  - **Safety**: 히스토리 스택이 부족하여 3단계 이전이 존재하지 않을 경우를 대비해 `window.history.length > 3` 조건을 검사한 후, 실패 시 `router.push('/')`로 안전하게 폴백(Fallback)합니다.

## 7. Audio Playback System (오디오 재생 시스템)

### 7.1 Web Audio API & Volume Amplification (볼륨 증폭)

- **Problem**: 일부 TTS 생성 음성이 모바일 기기에서 작게 들리는 문제.
- **Objective**: 표준 `HTMLAudioElement` 대신 `Web Audio API`의 `GainNode`를 사용하여 볼륨을 2배(`2.0`)로 증폭하여 출력합니다.
- **Architecture**:
  - `AudioContext`를 생성하고 `createMediaElementSource`로 오디오를 연결합니다.
  - `GainNode`를 삽입하여 `gain.value = 2.0`을 적용한 뒤 `destination`으로 출력합니다.
  - **Singleton Pattern Update**: 기존의 개별 Context 생성 방식에서 **전역 싱글턴 `AudioContext`**를 공유하는 방식으로 변경하여 iOS 연속 재생 문제를 해결했습니다. (상세 내용은 7.8 참조)

### 7.1.1 In-App Browser & iOS Compatibility (인앱 브라우저 호환성)

- **Problem**: 카카오톡, 네이버 등 인앱 브라우저에서 Web Audio API 초기화 실패 및 첫 페이지 로딩 문제 > 오디오 무한 로딩
- **Root Cause 1**: `createMediaElementSource()` 실패 시 오디오 객체가 제대로 초기화되지 않아 `canplaythrough` 이벤트 미발생
- **Root Cause 2 (Android)**: AudioContext가 `suspended` 상태로 시작하여 사용자 인터랙션 전까지 작동 안 함 (autoplay 정책)
- **Root Cause 3 (iOS)**: iOS Safari는 더 엄격하여 오디오 로딩 전 `createMediaElementSource()` 호출 시 `loadeddata` 이벤트 자체가 발생하지 않음
- **Solution**: Try-catch 기반 범용 폴백 + AudioContext 활성화 (Android/iOS 차별화) + Web Audio API 지연 초기화 (iOS)

  ```tsx
  // 1. Audio element 생성 (Web Audio API 초기화는 아직 안 함)
  const audio = new Audio(audioUrl);
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";
  audioRef.current = audio;

  // 2. loadeddata 이벤트 핸들러에서 Web Audio API 초기화
  const handleLoadedData = () => {
    setIsLoading(false);
    onReadyRef.current?.();

    // Initialize Web Audio API AFTER audio is loaded (iOS Safari fix)
    if (!audioContextRef.current) {
      initializeWebAudio();
    }
  };

  // 3. Web Audio API 초기화 함수 (오디오 로딩 후 호출)
  const initializeWebAudio = () => {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioContextClass && audioRef.current) {
        const ctx = new AudioContextClass();

        // Android: Try to resume immediately (works on Android, ignored on iOS)
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {
            // Silently fail on iOS, will be resumed on user gesture
          });
        }

        const gainNode = ctx.createGain();
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        gainNode.gain.value = 2.0;

        audioContextRef.current = ctx;
      }
    } catch (e) {
      // Web Audio API failed, fallback to basic HTML5 Audio
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
      }
    }
  };

  // 4. 사용자 클릭 시 AudioContext 활성화 (iOS Safari)
  const togglePlay = async () => {
    if (audioContextRef.current?.state === "suspended") {
      try {
        await audioContextRef.current.resume(); // 사용자 제스처 내에서 호출
      } catch (e) {
        // Silently fail
      }
    }
    // ... 오디오 재생
  };
  ```

- **Why Try-Catch over User Agent Detection**:
  - User Agent 방식: 카카오톡, 네이버 등 일일이 선언 필요 → 새로운 앱 대응 불가
  - Try-Catch 방식: Web Audio API 실패 시 자동 폴백 → 모든 인앱 브라우저 자동 대응
  - 유지보수성: 새로운 인앱 브라우저 출시 시 코드 수정 불필요
- **Why Deferred Initialization (iOS Safari)**:
  - **문제**: 오디오 로딩 전 `createMediaElementSource()` 호출 시 iOS Safari에서 `loadeddata` 이벤트가 발생하지 않음
  - **해결**: Web Audio API 초기화를 `loadeddata` 이벤트 **후**로 지연
  - **효과**: iOS에서도 오디오가 정상적으로 로딩되고 `loadeddata` 이벤트 발생
  - **Android**: 즉시 초기화해도 작동하지만, 지연 초기화도 문제없이 작동
- **AudioContext Resume Logic (Android vs iOS)**:
  - **Android**: 페이지 로드 시 `resume()` 호출 시도 (작동함)
  - **iOS Safari**: 사용자 클릭 시점(`togglePlay`)에서 `resume()` 호출 (사용자 제스처 필요)
  - 다른 페이지 갔다 오면 작동하는 현상 해결 (AudioContext가 이미 running 상태였기 때문)
- **iOS Safari loadeddata Event**:
  - Web Audio API 초기화를 지연시켜 `loadeddata` 이벤트가 정상 발생하도록 보장
  - 로딩 스피너 제거 → 사용자가 재생 버튼 클릭 가능 → AudioContext 활성화 → 정상 재생
- **Trade-off**:
  - 일반 브라우저: Web Audio API 사용 → 볼륨 2.0배 증폭 ✅
  - 인앱 브라우저: 기본 HTML5 Audio 또는 Web Audio API (플랫폼에 따라) → 볼륨 1.0~2.0 ✅
  - 재생 기능은 모든 환경에서 보장됨

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

### 7.8 Media Session API Integration (잠금 화면 제어)

iOS 및 모바일 디바이스의 잠금 화면/알림 센터 제어 패널에 올바른 메타데이터를 표시하기 위해 `Media Session API`를 사용합니다.

- **Implementation**:
  - `DialogueAudioButton` 컴포넌트 내에서 `isPlaying` 상태가 `true`가 될 때 `useEffect`를 통해 메타데이터를 설정합니다.
  - **Metadata**:
    - `title`: "Dialogue Audio"
    - `artist`: "Speak Mango"
    - `artwork`: `/assets/icon-512x512.png` 등 고화질 아이콘
  - **Action Handlers**:
    - `play`, `pause`, `stop` 핸들러를 등록하여 잠금 화면에서도 제어가 가능하도록 연결합니다.
  - **Context Strategy**: `togglePlay` 함수를 `useEffect` 의존성으로 안전하게 사용하거나, `useRef`를 통해 최신 핸들러를 참조하도록 하여 순환 참조 문제를 방지합니다.

### 7.7 Lazy Initialization Strategy (지연 초기화 전략)

모바일 환경 호환성과 iOS Safari 버그를 동시에 해결하기 위해 **Hybrid Loading** 전략을 사용합니다.

- **Resource**: `audio.preload = "metadata"`와 함께 컴포넌트 마운트 시 `audio.load()`를 명시적으로 호출합니다.
  - **Why?**: iOS Safari에서 Web Audio API(`MediaElementSource`)를 사용할 때, 오디오가 로드되지 않은 상태(`readyState: 0`)에서 연결하면 로딩 자체가 멈추는 Deadlock 버그가 있습니다. 이를 방지하기 위해 최소한의 메타데이터는 미리 확보해야 합니다.
- **API Context**: `Web Audio API` (`AudioContext`) 초기화는 **사용자의 클릭 이벤트 핸들러(`togglePlay`)** 내부에서 수행(Lazy Init)합니다.
  - **Why?**: 카카오톡 등 인앱 브라우저는 사용자 제스처 없이 오디오 컨텍스트를 만들거나 Resume하는 것을 차단합니다. 클릭 시점에 초기화함으로써 이 제약을 우회합니다.

### 7.8 Singleton Architecture for Sequential Playback (싱글턴 아키텍처)

- **Problem (iOS Sequential Playback Failure)**: 아이폰에서 '전체 듣기' 실행 시, 첫 번째 곡은 재생되지만 두 번째 곡부터는 "사용자 제스처 없음"으로 간주되어 `AudioContext` 생성이 차단되고 재생이 멈추는 현상 발생.
- **Solution**: **Singleton Pattern** 도입.
  - 앱 전역에서 **단 하나의 `AudioContext`**만 생성하고 재사용합니다.
  - 첫 번째 터치 시점에 Context가 생성(또는 Resume)되면, 이후에는 사용자 개입 없이도 활성 상태가 유지되어 연속 재생이 가능해집니다.
- **Implementation**:
  - `context/AudioContext.tsx`: 전역 Context Provider 구축.
  - `useAudio`: 싱글턴 인스턴스에 접근하는 훅 제공.

### 7.9 Stable Event Handler Pattern (안정적 핸들러 패턴)

- **Problem**: `togglePlay`가 `isPlaying`, `isPaused` 등 빈번하게 변하는 상태에 의존하고 있어, 상태 변화 시마다 함수가 재생성되고 하위 컴포넌트나 Ref가 갱신되는 비효율 발생.
- **Solution**: **Latest Ref Pattern** 도입.
  - `latestValues`라는 `useRef`에 모든 상태와 Props를 담아 매 렌더링마다 동기화합니다.
  - `togglePlay`는 의존성 배열이 빈(`[]`) 상태로 생성되어, 컴포넌트 생명주기 동안 단 한 번만 생성됩니다.
  - 함수 내부에서는 `latestValues.current`를 통해 항상 최신의 상태값에 접근합니다.
- **Effect**: 불필요한 클로저 생성 방지 및 렌더링 성능 최적화.

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

### 9.6 Quiz State Persistence (퀴즈 상태 유지 전략)

- **Objective**: 퀴즈 도중 상세 학습을 위해 페이지를 이탈했다가 복귀할 때, 진행 중이던 문제 번호와 점수를 완벽히 복원하여 학습 흐름을 유지합니다.
- **Mechanism (Selective Restoration)**:
  - **Storage**: `sessionStorage`를 사용하여 탭별 독립적인 상태 저장을 보장합니다.
  - **Flag Logic**:
    - `StudyButton` 클릭 시 `QUIZ_STORAGE_KEYS.RETURN_FLAG`를 설정합니다.
    - `QuizGame` 컴포넌트 마운트 시 이 플래그가 있으면 저장된 `STATE`를 복원합니다.
    - 일반 진입이나 새로고침 시에는 플래그가 없으므로 기존 데이터를 삭제하고 퀴즈를 리셋합니다.
- **Mobile Navigation Adjustment**:
  - 모바일 기기에서의 원활한 흐름을 위해, `useIsMobile` 훅으로 모바일을 감지하면 '공부하기' 링크가 새 탭이 아닌 현재 탭에서 동작하도록 `target` 속성을 동적으로 조정합니다.

## 10. Automation Pipeline (n8n & AI)

### 10.1 Pre-fetch Duplicate Check

- **Problem**: AI가 이미 존재하는 표현을 중복 생성하는 비효율성 발생.
- **Solution**: 생성 단계(Generate) 이전에 Supabase에서 기존 표현 리스트를 조회(Pre-fetch)하여 프롬프트의 '제외 목록'으로 전달함으로써 중복을 원천 차단합니다.

### 10.2 Strict JSON Parsing

- **Problem**: LLM이 JSON 응답에 마크다운 코드 블록(``json ... `)을 포함하여 파싱 에러 발생.
- **Solution**: n8n 워크플로우 내에서 정규식(`replace(/```json|```/g, '')`)을 사용하여 순수 JSON 문자열만 추출한 뒤 파싱하는 로직을 추가했습니다.

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
  3. **No Mixed Language & Allowed Lists**: 번역 필드(`meaning`, `dialogue.translations`)에 영어 알파벳 소문자가 포함되어 있는지 검사하여 "언어 누출"을 방지.
     - **Exception Logic**:
       - `ALLOWED_NAMES`: 인명 (Sarah, Emily 등)
       - `ALLOWED_ENGLISH_TERMS`: 기술 용어/브랜드 (iPhone, eBay, SNS 등)
       - 위 리스트에 포함되는 단어는 위음성(False Positive) 방지를 위해 허용합니다.
  4. **Markdown Prevention**: 대화 번역문에 마크다운 문법(`**bold**`)이 포함되지 않도록 강제.
  5. **Dialogue Length**: 대화가 너무 짧거나 길어지지 않도록 **2~4턴**의 길이를 강제.
  6. **Quiz Consistency (Strict)**:
     - **Pattern 1**: 질문에 영어가 없으면 -> 선택지는 무조건 **영어**.
     - **Pattern 2/3**: 질문에 영어가 있으면 -> 선택지는 무조건 **타겟 언어**.
     - **No Hybrid**: 타겟 언어 선택지에 영어가 섞여 있는 경우(Hybrid)도 허용하지 않는 엄격한 규칙 적용.
  7. **Strict Punctuation**:
     - `meaning` 필드에 마침표(.)나 세미콜론(;) 포함 금지.
     - CJK 언어의 경우 고리점(`。`) 포함 금지 (`ideographic_full_stop` 정규식 사용).
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
    `Content (${lang}).quiz must NOT have 'options' field. Options should be in 'question' field.`,
  );
}

// 2. quiz.question 내 선택지 A, B, C 필수
const hasOptionA = /\nA\.\s/.test(questionText) || /^A\.\s/.test(questionText);
const hasOptionB = /\nB\.\s/.test(questionText);
const hasOptionC = /\nC\.\s/.test(questionText);

if (!hasOptionA || !hasOptionB || !hasOptionC) {
  errors.push(
    `Content (${lang}).quiz.question must contain all options (A, B, C). Missing: ${missing.join(
      ", ",
    )}`,
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

### 10.11 Meaning Field Cleanup & Strict Punctuation Validation (데이터 정제 및 엄격한 문장 부호 검증)

- **Problem**: Gemini가 'meaning' 필드 생성 시, 프롬프트 지침에도 불구하고 문장 끝에 마침표(.)를 붙이거나 다중 의미를 구분할 때 세미콜론(;)을 사용하는 경우가 빈번함. 기존 검증 로직은 이를 에러로 처리하여 재시도 비용 발생.
- **Solution (2-Phase Strategy)**:
  1.  **Phase 1: Auto-Cleanup (데이터 정제)**
      - **Node**: `Cleanup Meaning` (n8n V2 Step 6, V1 Step 10)
      - **Logic**: 검증 단계 진입 전에 문제 소지가 있는 문장 부호를 자동으로 정리합니다.
        - **마침표 제거**: 문장 끝뿐만 아니라 **중간에 포함된 마침표**도 모두 제거합니다 (단, 말줄임표 `...`는 보존).
        - **세미콜론 치환**: 세미콜론(;)을 프로젝트 표준 구분자인 `·`(가운뎃점)으로 변경하고 주변 공백을 정규화합니다.
      - **Code**: `n8n/expressions/code_v2/06_cleanup_meaning.js`

  ```javascript
  // 마침표(.) 제거 (문장 중간 포함, ...은 제외)
  const tempEllipsis = "___ELLIPSIS___";
  text = text.replace(/\.\.\./g, tempEllipsis); // ... 보호
  text = text.replace(/\./g, ""); // 모든 마침표 제거
  text = text.replace(new RegExp(tempEllipsis, "g"), "..."); // ... 복원

  // 세미콜론(;)을 ' · '로 변경
  text = text.replace(/;/g, " · ");
  ```

  2.  **Phase 2: Strict Validation (엄격한 검증)**
      - **Node**: `Validate Content`
      - **Logic**: 정제 후에도 남아있는 문장 부호나 잘못된 형식을 에러로 처리하여 DB 오염을 방지합니다.
      - **Rule**: `meaning` 필드에 마침표(.)나 세미콜론(;)이 하나라도 포함되어 있으면 **즉시 에러**로 간주합니다.
      - **Implementation**: `text.replace(/\.\.\./g, "").includes(".")` 로 말줄임표를 제외한 모든 마침표를 검출.

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

- **State Definition (`VIEW_MODE` Constants)**:
  - **`BLIND` (`blind` - Default)**: 리스닝 집중 모드. 모든 영어/해석 텍스트가 블러 처리됨. '해석 전체 보기' 버튼은 Soft Disabled 상태가 됨.
  - **`PARTIAL` (`partial`)**: 부분 확인 모드. 사용자가 안 들리는 특정 영어 문장만 클릭하여 일부만 드러낸 상태. **이 상태에서는 해석을 클릭하여 개별적으로 확인하는 것도 허용됩니다.**
  - **`EXPOSED` (`exposed`)**: 학습 모드 해제 상태. 모든 텍스트가 제약 없이 사용자 설정(해석 숨김 여부 등)에 따라 표시됨.

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

## 13. Performance Optimization Techniques (성능 최적화 기법)

### 13.1 Server-Side Waterfall Removal (서버 측 워터폴 제거)

- **Problem**:
  - `app/page.tsx` 및 `app/quiz/page.tsx`에서 `getI18n()` 완료 후 DB 조회 함수가 실행되는 직렬 구조.
  - `app/expressions/[id]/page.tsx`의 `generateMetadata`와 `ExpressionDetailPage`에서 `getExpressionById` 후 `getI18n`을 호출하는 비효율.
- **Solution**: 의존성이 없는 비동기 작업을 `Promise.all`로 병렬 처리.
  - `getLocale()`을 먼저 호출하여 필요한 로케일 정보를 확보.
  - `getI18n()`과 `getExpressions()`(또는 `getExpressionById`)를 동시에 실행하여 전체 응답 시간을 단축.
  - 사용자 유효성 검사(Fail-Fast) 로직과 함께 `Promise.all`을 사용하여 불필요한 네트워크 대기 시간 최소화.

### 13.2 React Component Rendering Optimization (리렌더링 최적화)

- **Target**: `DialogueSection`, `DialogueItem`, `ExpressionCard`, `Tag`
- **Problem**:
  - 오디오 재생 인덱스(`playingIndex`) 변경 시 섹션 내 모든 아이템 리렌더링.
  - 리스트 내의 작은 컴포넌트(`Tag`)들이 부모 리렌더링 시 불필요하게 같이 렌더링됨.
- **Solution**:
  - **Memoization**: `DialogueItem`, `ExpressionCard`, `Tag`를 `React.memo`로 감싸 Props 변경이 없는 경우 리렌더링 방지.
  - **Stable Callbacks**: `DialogueSection`의 이벤트 핸들러를 `useCallback`으로 감싸고, `index`를 인자로 받는 형태로 리팩토링.
  - **Effect Isolation**: 상태 변경에 따른 부수 효과(Auto-Exit 로직)를 `useEffect`로 분리하여, 핸들러(`handleEnglishClick`)가 불필요한 의존성(`Set` 객체 등)을 갖지 않도록 최적화.

### 13.3 Database Search Optimization (검색 쿼리 최적화)

- **Problem**:
  - `meaning` 필드는 JSONB 타입이므로, 특정 키(`ko`, `en` 등) 내부의 텍스트를 `ILIKE`로 검색할 때 인덱스를 사용할 수 없음 (Full Table Scan 발생).
  - 전체 텍스트 검색을 위해 `meaning`을 단순히 문자열로 변환하여 검색하면, 다른 언어의 키워드까지 매칭되는 노이즈 문제 발생.

- **Solution (Double-Filter Pattern)**:
  1.  **Generated Column**: `meaning` 데이터를 문자열로 변환 저장하는 `meaning_text` 컬럼 추가 (`GENERATED ALWAYS AS ... STORED`).
  2.  **Trigram Index**: `pg_trgm` 확장을 통해 `meaning_text`에 GIN 인덱스 생성.
  3.  **Hybrid Query**:
      - **1차 (Index Scan)**: `meaning_text ILIKE %term%`으로 인덱스를 타서 후보군을 빠르게 압축.
      - **2차 (Recheck)**: 압축된 소수의 결과에 대해 `meaning->>locale ILIKE %term%`을 실행하여 정확한 언어 매칭 검증.
      - PostgreSQL 옵티마이저는 인덱스 조건(1차)을 먼저 실행하므로, 느린 JSON 연산(2차)의 오버헤드는 무시할 수 수준이 됨.

### 13.4 Scroll Event Optimization (스크롤 이벤트 최적화)

- **Problem**: `FilterBar`의 스크롤/리사이즈 이벤트 핸들러가 메인 스레드에서 빈번하게 실행되어 레이아웃 스래싱(Layout Thrashing) 및 UI 버벅임 유발 가능성.
- **Solution**:
  - **requestAnimationFrame (rAF)**: `RelatedExpressions`의 무한 스크롤(3.1) 및 스크롤 복원(9.3)에 사용된 것과 동일한 패턴을 적용하여, 브라우저 페인팅 주기에 맞춰 이벤트를 최적화(Throttling)했습니다.
  - **Auto-Cleanup**: `useRef`를 통해 rAF ID를 관리하고, 컴포넌트 언마운트 시 `cancelAnimationFrame`을 호출하여 메모리 누수를 방지합니다.
  - **Referential Stability**: 핸들러 함수를 `useCallback`으로 감싸고 `useEffect` 의존성 배열에 명시하여, 리렌더링 시 불필요한 이벤트 리스너 재등록을 방지합니다.

### 13.5 Database Random Sampling (RPC 기반 랜덤 샘플링)

- **Problem**:
  - 클라이언트(Node.js)에서 `SELECT id FROM expressions`로 전체 ID를 가져온 후 `JavaScript`로 셔플링하여 N개를 뽑는 방식은 테이블 크기가 커질수록 메모리 사용량과 네트워크 대역폭을 과도하게 점유합니다(O(N)).
- **Solution (Database-Side Processing)**:
  - PostgreSQL의 `ORDER BY random() LIMIT N` 기능을 캡슐화한 RPC 함수(`speak_mango_en.get_random_expressions`)를 도입했습니다.
  - 데이터 셔플링과 추출을 DB 엔진 내부에서 수행하고, 최종 결과인 N개의 행만 네트워크로 전송합니다.
- **Benefit**:
  - **Constant Complexity**: 데이터가 100건이든 10만 건이든 클라이언트가 받는 부하는 동일합니다.
  - **Memory Efficiency**: Node.js 런타임의 메모리 스파이크를 방지합니다.

### 13.6 Request Deduplication (Server-Side Caching)

- **Problem**: Next.js App Router 아키텍처에서 `Page` 컴포넌트와 `generateMetadata` 함수가 동일한 데이터를 필요로 할 때, 별도의 조치를 취하지 않으면 동일한 DB 쿼리가 한 요청(Request) 내에서 중복 실행되는 비효율이 발생합니다.
- **Solution**:
  - `lib/expressions.ts`의 모든 DB 조회 함수를 React의 `cache` 함수로 래핑했습니다.
  - 이 메모이제이션은 **서버 요청 수명 주기(Per-request)** 동안만 유효하므로, 데이터의 최신성을 해치지 않으면서 중복 부하만 제거합니다.
- **Implementation**:
  ```typescript
  export const getExpressions = cache(async (...) => { ... });
  ```

### 13.7 Data Fetching Strategy (SWR Adoption)

- **Goal**: 클라이언트 사이드 데이터 페칭의 상태 관리 복잡성을 줄이고, UX(빠른 네비게이션, 자동 갱신)를 개선합니다.
- **Implementation**:
  - `docs/technical_implementation/use_swr_strategy.md`에 정의된 전략에 따라 `hooks/usePaginatedList.ts`를 `useSWRInfinite` 기반으로 리팩토링했습니다.
  - **Key Serialization**: 객체 키(`filters`)의 참조 불안정성 문제를 해결하기 위해 `JSON.stringify`로 직렬화하여 키를 생성하고, Fetcher 내부에서 `JSON.parse`로 복원하는 패턴을 적용했습니다.
  - **Optimized Fetching Strategy**: `app/page.tsx`는 ISR(`revalidate = 3600`)을 사용하여 초기 HTML 로딩을 처리합니다. 콘텐츠 업데이트 빈도(1일 1회)를 고려하여 `hooks/usePaginatedList.ts`에서 `revalidateFirstPage: false`를 설정, 초기 진입 시 중복 API 호출을 차단하여 성능을 최적화했습니다.
  - 전역 상태(`ExpressionContext`)에서 무거운 데이터(`items`)를 제거하고, 오직 '페이지 수(`size`)'와 '스크롤 위치'만 관리하도록 경량화하여 메모리 사용량을 최적화했습니다.
- **Reference**: 자세한 내용은 [useSWR 전략 문서](./use_swr_strategy.md)를 참조하십시오.

## 14. Service Essentials Implementation (시스템 필수 요소 구현)

서비스 품질을 결정짓는 3대 요소(PWA, SEO, i18n)에 대한 기술적 구현 상세입니다.

### 14.1 PWA & Splash Screen Strategy (스플래시 스크린 전략)

- **Library**: `next-pwa` (플러그인) + `pwa-asset-generator` (에셋 생성)
- **Challenge**: iOS는 안드로이드와 달리 매니페스트 파일만으로 스플래시 스크린을 자동 생성해주지 않으며, 기기 해상도별로 정확한 사이즈의 이미지를 `<link rel="apple-touch-startup-image">`로 제공해야 합니다.
- **Solution (Adaptive Padding)**:
  - `pwa-asset-generator`를 사용하여 30여 종의 해상도별 이미지를 생성했습니다.
  - **Padding Logic**: 로고가 화면에 꽉 차지 않고 여백을 갖도록, HTML 기반 렌더링 시 **Portrait(세로) 30%**, **Landscape(가로) 20%**의 패딩을 주어 생성했습니다. 이를 통해 아이패드 등 태블릿 가로 모드에서도 로고가 잘리지 않고 안정적으로 표시됩니다.
- **Build Config**: `next-pwa`와 Turbopack의 호환성 문제 및 Vercel 배포 안정성을 위해, Dev/Build 스크립트에 `--webpack` 플래그를 명시적으로 적용했습니다.
- **Explicit Injection (iOS Fix)**: Next.js `metadata.appleWebApp`의 자동 생성 태그가 iOS에서 스플래시 스크린을 제대로 트리거하지 못하는 이슈(White Screen)가 확인되어, `app/layout.tsx`에 수동으로 `<head>` 태그를 선언하고 `<link rel="apple-touch-startup-image">`를 직접 주입하는 **Hard-coded Link Strategy**를 채택했습니다. 또한 `apple-mobile-web-app-capable` 태그도 명시적으로 추가하여 Standalone 모드를 보장합니다.

### 14.2 Dynamic SEO & Open Graph (동적 SEO)

- **Metadata API**: Next.js 14+의 `generateMetadata` 함수를 활용하여 페이지별로 동적인 `title`과 `description`을 주입합니다.
- **Structured Data (JSON-LD) Strategy**:
  - **Dual Schema Architecture**:
    - **Global (`app/layout.tsx`)**: `WebSite` (Identity, Keywords) & `Organization`.
    - **Local (`app/page.tsx`)**: `WebSite` (`SearchAction`) - 홈 화면 전용 검색 기능 명시.
    - **Detail (`app/expressions/[id]/page.tsx`)**: `LearningResource` - 개별 표현 학습 자료 명시.
  - **Keyword Injection**: `meta keywords` 태그뿐만 아니라 JSON-LD 스키마 내에도 `keywords` 속성을 주입하여 엔티티 연관성을 강화했습니다.
- **Node.js-generated OG Image**:
  - **Targets**: `app/expressions/[id]/opengraph-image.tsx` (Expression), `app/quiz/opengraph-image.tsx` (Quiz).
  - **Runtime Strategy**: 고화질 로고 이미지(`fs.readFileSync`)와 커스텀 폰트 파일 로딩을 위해 기본 `edge` 런타임 대신 **`nodejs` 런타임**을 채택했습니다.
  - **Implementation**: `ImageResponse`를 사용하여 텍스트와 브랜드 아이덴티티(그라데이션 로고, Inter 폰트)가 적용된 고품질 썸네일을 **Request Time에 동적으로 생성**합니다.
  - **Benefit**: 수천 개의 표현 및 퀴즈 페이지에 대해 정적 이미지를 미리 생성할 필요 없이, 강력한 소셜 미디어 미리보기(CTR 증대)를 제공합니다.

### 14.3 International SEO Optimization (국제 SEO 최적화)

SEO(검색 엔진 최적화)는 다국어 사이트의 가장 큰 기술적 난제인 '중복 콘텐츠 이슈'와 '크롤링 경로 최적화'를 해결하기 위한 핵심 전략입니다.

#### A. Path-based Localization Strategy (경로 기반 지역화 전략)

- **Problem**:
  - 기존 Next.js Middleware나 쿼리 파라미터(`?lang=ko`) 방식은 Googlebot이 크롤링하기 어려운 구조입니다.
  - `/ko`와 같은 명시적인 언어 경로가 존재하지 않아, 검색 엔진이 각 언어 버전의 페이지를 독립적으로 인식하지 못하고 404 에러를 유발합니다.
- **Solution (`proxy.ts`)**:
  - **Path Interception**: Middleware 레벨에서 요청 URL 경로를 가로챕니다.
  - **Rewrite Logic**: `/ko/quiz`, `/ja/quiz` 등으로 시작하는 요청을 감지하면 `x-locale` 헤더를 설정하고, 내부적으로는 경로를 제거한 원본 URL(`/quiz`)로 `Rewrite`합니다.
  - **Result**: 사용자와 검색 봇은 명시적인 언어 경로(`/ko/quiz`)로 접근하지만, 서버에서는 단 하나의 페이지 컴포넌트(`/app/quiz/page.tsx`)가 헤더에 따라 적절한 언어 콘텐츠를 렌더링하는 효율적인 구조를 갖게 됩니다.

#### B. Self-referencing Canonical (자기 참조 표준 태그)

- **Problem (Canonical Confusion)**:
  - 모든 페이지가 디폴트 언어(영어) URL을 Canonical(`https://speakmango.com/...`)로 가리키고 있다면, 한국어/일본어 등 타 언어 페이지는 "나는 원본이 아니다"라고 선언하는 꼴이 됩니다.
  - 이 경우, 구글은 타 언어 페이지를 '중복 콘텐츠'로 간주하고 색인에서 제외(Drop)합니다.
- **Solution (Relative Canonical)**:
  - `metadata` 설정 시 `canonical` 값을 절대 경로(`BASE_URL`)가 아닌 **상대 경로(`"./"`)**로 설정합니다.
  - **Effect**:
    - `/ko/expressions/123` 페이지의 Canonical은 `.../ko/expressions/123`이 됩니다.
    - `/ja/expressions/123` 페이지의 Canonical은 `.../ja/expressions/123`이 됩니다.
    - 각 언어 페이지가 자기 자신을 원본으로 선언함으로써 독립적인 페이지로 인정받고 색인됩니다.

#### C. Dynamic Hreflang Tags (동적 Hreflang 태그)

- **Mechanism (`app/layout.tsx`)**:
  - `SUPPORTED_LANGUAGES` 배열을 순회하며 `alternates.languages` 메타데이터를 동적으로 생성합니다.
  - 예: `<link rel="alternate" hreflang="ko-KR" href="https://speakmango.com/ko/..." />`
- **Benefit**:
  - 검색 엔진에게 "이 페이지는 한국어 사용자에게는 이 URL을 보여주라"고 명확히 지시합니다.
  - 사용자의 언어 및 지역 설정에 맞는 최적의 페이지가 검색 결과 상단에 노출되도록 유도합니다.

#### D. Centralized Canonical Utility (표준 URL 유틸리티)

- **Context (`lib/routes.ts`)**:
  - **`CANONICAL_URLS`**: 메타데이터 태그(`canonical`, `og`)에서는 상대 경로(`"./"`)를 사용하지만, 절대 경로(`https://...`)가 필수로 요구되는 `Schema.org (JSON-LD)`와 `Sitemap` 생성을 위해 별도의 유틸리티를 중앙화했습니다.
  - 이중 관리 전략을 통해 메타데이터와 구조화된 데이터(Structured Data) 양쪽의 요구사항을 모두 충족합니다.

#### E. Crawling Control (크롤링 제어)

- **Robots.txt**: `/admin`, `/studio` 등 관리자 전용 경로를 `Disallow` 처리하여 크롤러의 리소스 낭비를 막고 보안을 강화했습니다.
- **Meta Robots**: 관리자 페이지 컴포넌트(`StudioPage`)에서 `robots: { index: false, follow: false }`를 반환하여, 실수로 페이지가 노출되더라도 색인을 원천 차단했습니다.

### 14.4 Dynamic Keyword Localization Strategy (동적 키워드 현지화 전략)

단순 번역을 넘어, 검색 의도(Search Intent)와 사용자 언어 맥락(Context)에 맞는 키워드를 동적으로 생성하는 전략입니다.

- **Localized Categories**:
  - 각 언어 파일(`i18n/locales/*.ts`)에 `categories` 맵을 정의하여, 동일한 카테고리라도 언어별로 가장 자연스러운 검색어를 매핑합니다.
  - 예: `travel` -> `Travel English` (EN), `여행 영어` (KO), `旅行英会話` (JA).
- **Suffix Patterns**:
  - `expressionSuffixes`: 표현 자체를 검색할 때 사용되는 접미사 (예: "뜻", "의미", "meaning").
  - `meaningSuffixes`: 의미를 통해 표현을 찾을 때 사용되는 접미사 (예: "영어로", "in English"). 단순 접미사뿐만 아니라 `{}` 템플릿 패턴(`another way to say {}`)을 지원하여 유연성을 확보했습니다.
- **Visible Tags (White Hat)**:
  - 메타 태그(`keywords`)뿐만 아니라, `components/KeywordList.tsx`를 통해 페이지 하단에 실제 텍스트로 키워드를 노출합니다. 이는 _Keyword Stuffing_(숨겨진 텍스트로 키워드 남발)으로 오인받지 않으면서 검색 엔진에 페이지의 관련성을 강력하게 어필하는 **White Hat SEO** 기법입니다.

### 14.5 PWA Theme Color (동적 테마 컬러)

- **Problem**: `viewport`의 `themeColor`를 단일 문자열(`#ffffff`)로 설정 시, 다크 모드에서도 상태 표시줄이 흰색으로 유지되어 눈부심 유발.
- **Solution**: Next.js Viewport API를 활용하여 미디어 쿼리 기반의 동적 색상 배열을 설정했습니다.
  ```typescript
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ];
  ```

### 14.6 Type-Safe i18n Architecture (타입 안전 i18n)

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

### 14.7 i18n Locale Language Consistency Validation (언어팩 일관성 검증)

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

## 15. Analytics Implementation (사용자 행동 분석)

Google Analytics 4를 Next.js 16 App Router 환경에 통합하여 사용자 행동 데이터를 수집하고 분석하는 시스템입니다.

### 15.1 Environment-Based Configuration (환경별 설정)

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

### 15.2 Type-Safe Event Tracking (타입 안전한 이벤트 추적)

- **Function Overloading**: `gtag` 함수의 타입 정의를 함수 오버로드로 구현하여 각 명령어(`js`, `config`, `event`)별로 다른 타입의 파라미터를 받을 수 있도록 설계:
  ```typescript
  declare global {
    interface Window {
      gtag?: {
        (command: "js", date: Date): void;
        (
          command: "config",
          targetId: string,
          config?: Record<string, any>,
        ): void;
        (
          command: "event",
          eventName: string,
          params?: Record<string, any>,
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

### 15.3 Automatic Page View Tracking (자동 페이지 뷰 추적)

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

### 15.4 Development vs Production Behavior (개발/프로덕션 동작 분리)

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

### 15.5 Event Taxonomy (이벤트 분류 체계)

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

### 15.6 Integration with Next.js App Router (Next.js 통합)

- **Script Injection**: `app/layout.tsx`에서 GA4 스크립트를 `afterInteractive` 전략으로 로드:
  ```tsx
  <Script
    strategy="afterInteractive"
    src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
  />
  ```
- **Configuration**: `send_page_view: false`로 설정하여 자동 페이지 뷰를 비활성화하고 `AnalyticsProvider`에서 수동 제어
- **Single Source of Truth**: `GA_MEASUREMENT_ID`를 `analytics/index.ts`에서 export하여 환경별 선택 로직을 한 곳에 집중

### 15.7 Component-Level Event Tracking (컴포넌트 레벨 이벤트 추적)

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

### 15.8 Analytics Module Organization (모듈 구조)

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

## 16. Share Functionality Implementation (공유 기능 구현)

사용자가 표현을 소셜 미디어나 메신저로 공유할 수 있도록 Web Share API와 Clipboard API를 활용한 크로스 플랫폼 공유 시스템입니다.

### 16.1 ShareButton Component Architecture (컴포넌트 아키텍처)

- **File**: `components/ShareButton.tsx`
- **Strategy**: Progressive Enhancement (점진적 향상)
  - **Primary**: Web Share API (모바일 네이티브 공유)
  - **Fallback**: Clipboard API (데스크탑 복사)
- **Variant Support**:
  - `default`: 아이콘 + 텍스트 (상세 페이지용)
  - `compact`: 아이콘만 (카드용, 공간 효율적)

### 16.2 Web Share API Integration (네이티브 공유 통합)

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

### 16.3 Clipboard Fallback Strategy (클립보드 폴백)

- **API**: `navigator.clipboard.writeText(url)`
- **User Feedback**: Toast 알림으로 복사 성공/실패 피드백
- **URL Generation**: `lib/utils.ts`의 `getShareUrl` 함수
  ```typescript
  export function getShareUrl(
    expressionId: string,
    utmParams?: Record<string, string>,
  ): string {
    const url = `${BASE_URL}/expressions/${expressionId}`;
    if (!utmParams) return url;
    const params = new URLSearchParams(utmParams);
    return `${url}?${params.toString()}`;
  }
  ```
- **UTM Parameters**: 공유 출처 추적 (`utm_source=share`, `utm_medium=native`)

### 16.4 Toast Notification System (토스트 알림 시스템)

- **Component**: `components/ui/Toast.tsx`
- **Type System**: `types/toast.ts`
  - `ToastType`: `"success" | "error"`
  - `TOAST_TYPE`: 상수 객체 (`SUCCESS`, `ERROR`)
- **Design Pattern**: 재사용 가능한 독립 컴포넌트
  - ShareButton뿐만 아니라 향후 다른 기능(북마크, 좋아요 등)에서도 활용 가능
- **Animation**: Framer Motion 기반 fade-in + slide-in 효과
- **Auto-dismiss**: 3초 후 자동 사라짐

### 16.5 Event Propagation Prevention (이벤트 전파 방지)

- **Problem**: Expression Card는 전체가 `<Link>`로 감싸져 있어, 공유 버튼 클릭 시 상세 페이지로 이동하는 문제 발생
- **Solution**: 이중 방어 전략
  1. **ShareButton 내부**: `handleShare`에서 `e.preventDefault()` + `e.stopPropagation()`
  2. **ExpressionCard**: ShareButton의 `onClick` prop에서 `e.stopPropagation()`
- **Result**: 공유 버튼 클릭 시 페이지 이동 없이 공유 기능만 실행

### 16.6 Card Integration with Absolute Positioning (카드 통합)

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

### 16.7 Analytics Integration (분석 통합)

- **Events**:
  - `trackShareClick`: 공유 버튼 클릭 시 자동 호출
    - `shareMethod`: `"native"` (Web Share API) | `"copy_link"` (Clipboard)
    - `sharePlatform`: `"native"` | `"clipboard"`
  - `trackShareComplete`: 공유 성공 시 자동 호출
- **Implementation**: ShareButton 내부에서 자동 추적, 컴포넌트 사용자는 별도 로직 불필요

### 16.8 Internationalization (다국어 지원)

- **Translation Keys**: 9개 언어 (EN, KO, JA, ES, FR, DE, RU, ZH, AR)
  - `detail.share`: "Share" / "공유" / "共有" 등
  - `detail.shareCopied`: "Link copied!" / "링크 복사됨!" 등
  - `detail.shareFailed`: "Failed to share" / "공유 실패" 등

## 17. Marketing Asset Generation System (Marketing Studio)

SNS 마케팅을 위한 고화질 에셋을 생성하고 대량 자동화하기 위한 기술적 구현 상세입니다.

### 17.1 Client-Side Image Rendering (`html-to-image`)

- **Objective**: 브라우저에 렌더링된 DOM 요소를 고화질 이미지(PNG)로 변환합니다.
- **Library**: `html-to-image`를 사용하여 SVG ForeignObject 기반의 캔버스 렌더링을 수행합니다.
- **High Resolution (Retina Support)**: 캡처 시 `pixelRatio: 2` 옵션을 적용하여 모바일 및 고해상도 디스플레이에서도 선명한 결과물을 얻습니다.
- **Download Handling**: 생성된 데이터 URL을 `file-saver`를 통해 사용자 로컬 기기에 즉시 저장합니다.

### 17.2 Automation with Playwright (자동화 스크립트)

- **Language**: Python
- **Engine**: Playwright (Headless Chromium)
- **Mechanism**:
  1. `sitemap.xml`을 파싱하여 전체 표현 ID 리스트를 확보합니다.
  2. `asyncio.Semaphore`를 사용하여 브라우저 컨텍스트를 병렬(`CONCURRENCY=3`)로 실행하여 속도를 최적화합니다.
  3. 특정 요소(`#studio-capture-area`)가 화면에 나타날 때까지 대기(`wait_for_selector`)한 후 해당 영역만 스크린샷을 찍습니다.
- **Quality Assurance**: 폰트 및 이미지 로딩 지연으로 인한 깨짐 방지를 위해 캡처 전 `1000ms`의 지연 시간을 강제합니다.

### 17.3 Localized Asset Generation (다국어 이미지 생성)

- **Query Param Strategy**: 실제 사용자 URL 구조를 깨뜨리지 않으면서 스크립트가 특정 언어를 강제할 수 있도록 `?lang=[code]` 쿼리 파라미터를 활용합니다.
- **Middleware Integration**: `proxy.ts` 미들웨어가 해당 파라미터를 감지하여 `x-locale` 헤더를 설정함으로써 서버 컴포넌트가 해당 언어의 딕셔너리를 로드하도록 유도합니다.
- **Directory Sharding**: 생성된 이미지는 `studio_images/[lang]/` 폴더로 자동 분류되어 저장됩니다.

### 17.4 Layout Adaptability for Long Content (유동적 레이아웃)

- **Problem**: 내용이 길어질 경우 `absolute`로 배치된 브랜딩 로고가 텍스트와 겹치는 현상 발생.
- **Solution**: **Flexbox Flow**로 전환.
  - `StudioClient`의 캡처 영역을 `flex flex-col justify-between`으로 구성했습니다.
  - 상단에 카드 본체(`flex-1`), 하단에 로고 영역을 배치하여 내용이 많아지면 로고가 자연스럽게 아래로 밀리도록 설계했습니다.
  - 이 과정에서 `aspect-ratio`를 유지하면서도 콘텐츠 오버플로우를 안전하게 처리합니다.

### 17.5 Static Capture Mode (정적 캡처 모드)

- **Prop**: `ExpressionCard`에 `isStatic` 옵션을 도입했습니다.
- **Implementation**:
  - 모든 Framer Motion 애니메이션을 비활성화합니다.
  - 호버 효과 및 클릭 상호작용을 제거합니다.
  - 레이아웃을 `h-auto`로 고정하여 캡처 도구(`html-to-image`)가 실제 콘텐츠 높이를 정확히 계산할 수 있도록 돕습니다.
- **Benefit**: 캡처 시점에 애니메이션 중간 단계가 찍히거나 레이아웃이 어긋나는 문제를 원천 차단합니다.

## 18. User System & Authentication (사용자 시스템 및 인증)

NextAuth(Auth.js v5)를 기반으로 구축된 보안 중심의 사용자 인증 및 권한 관리 시스템입니다.

### 18.1 Refresh Token & Database Session Strategy (세션 관리 전략)

- **Problem**: 표준 JWT 방식은 빠르지만, 사용자의 구독 상태(Tier)가 변경되거나 계정이 정지되었을 때 서버에서 즉시 무효화하기 어렵다는 단점이 있습니다.
- **Solution (Database Session)**: `strategy: "database"` 방식을 채택하고 `sessions` 테이블을 직접 운영합니다.
  - **Immediate Revocation**: 사용자가 로그아웃하거나 관리자가 DB에서 세션을 삭제하는 즉시 모든 기기에서 로그아웃 처리(Access 차단)가 가능합니다.
  - **Live Tier Updates**: 구독 결제 완료 후 세션 갱신 주기(24시간) 내에 DB 정보를 강제 동기화하여 Pro 기능을 즉시 개방할 수 있습니다.
  - **Security**: 탈취된 세션 토큰을 서버 사이드에서 영구 무효화할 수 있는 강력한 보안 수단을 제공합니다.

### 18.2 NextAuth v5 Architecture (인증 아키텍처)

- **File**: `lib/auth/config.ts`, `app/api/auth/[...nextauth]/route.ts`
- **Modern Pattern**: NextAuth v5의 최신 패턴을 따라 `auth.ts` 설정 파일을 `lib/auth/config.ts`로 분리하고, API Route에서는 간결하게 핸들러만 노출합니다.
- **Middleware-less**: V5에서는 필요한 경우에만 `auth()` 함수를 호출하여 세션을 확인하는 Lazy Loading 방식을 사용하여 성능을 최적화합니다.

### 18.3 Supabase Adapter & Custom Fields (어댑터 및 커스텀 필드)

- **Library**: `@auth/supabase-adapter`
- **Mechanism**: Supabase를 NextAuth의 영속성 계층으로 사용합니다.
- **Custom Mapping**:
  - `callbacks.session`: DB에서 가져온 `tier`, `subscriptionEndDate` 정보를 NextAuth 세션 객체에 주입합니다.
  - 이를 통해 API나 컴포넌트 레벨에서 별도의 추가 DB 조회 없이 사용자의 권한 등급을 즉시 파악할 수 있습니다.

### 18.4 Type-Safe Session Access (타입 안전 인증 접근)

- **Ambient Module Extension**: `types/next-auth.d.ts`에서 NextAuth의 `Session` 및 `User` 인터페이스를 확장하여 커스텀 필드(`tier` 등)에 대한 IDE 자동 완성 및 타입 검사를 지원합니다.
- **Common Hook**: `hooks/user/useAuthUser.ts`
  - 클라이언트 컴포넌트에서 인증 상태(`loading`, `authenticated`)와 사용자 정보를 한 번에 가져올 수 있는 추상화된 훅을 제공합니다.
  - **Benefit**: 중복 코드를 줄이고, 미래에 인증 라이브러리가 바뀌더라도 훅의 인터페이스만 유지하면 컴포넌트 코드는 수정할 필요가 없습니다.

### 18.5 Schema View Strategy (인증 스키마 전략)

NextAuth와 Supabase의 스키마 명명 규칙 충돌(CamelCase vs SnakeCase)을 해결하기 위한 **View Proxy Pattern**입니다.

- **The Conflict**:
  - Supabase/PostgreSQL: `snake_case` (DB 표준)
  - NextAuth: `camelCase` (JS 라이브러리 표준)
- **The Solution (View Layer)**:
  - **Physical (`speak_mango_en`)**: `snake_case` 테이블 (`users`, `sessions`).
  - **Logical (`speak_mango_en_next_auth`)**: `camelCase`로 매핑된 Updatable View.
  - **Mapping**: `CREATE VIEW ... SELECT user_id AS "userId" ...`
- **Benefit**: DB 표준을 준수하면서도 외부 라이브러리와의 호환성을 완벽하게 유지합니다.

## 19. Vocabulary System (단어장 시스템)

사용자가 학습하고자 하는 표현을 테마별로 그룹화하여 관리할 수 있는 시스템입니다.

### 19.1 Component Architecture (컴포넌트 구조)

- **`VocabularyListModal`**:
  - `SaveButton` 클릭 시 또는 롱 프레스 시 노출되는 메인 인터페이스입니다.
  - 현재 표현이 담긴 단어장들을 체크박스 형태로 노출하며, 즉각적인 토글 인터랙션을 제공합니다.
  - 비로그인 사용자가 접근 시 `LoginModal`로 리다이렉션하여 데이터 무결성을 보장합니다.
- **`CreateListForm`**:
  - 새로운 단어장을 생성하는 인라인 폼입니다.
  - Pro 사용자는 무제한, 로그인한 Free 사용자는 최대 5개까지 생성이 가능하도록 정책이 적용되어 있습니다.

### 19.2 Hybrid Repository Workflow (하이브리드 워크플로우)

`useVocabularyLists` 훅은 사용자의 인증 상태와 티어(`isPro`)를 감지하여 데이터 저장소를 동적으로 전환합니다.

- **Pro User**:
  - `services/actions/vocabulary.ts`의 서버 액션을 통해 Supabase DB와 직접 통신합니다.
  - `vocabulary_lists`와 `vocabulary_items` 테이블을 사용하여 영구적인 동기화를 제공합니다.
- **Free User (Logged-in)**:
  - `useLocalActionStore` (Zustand)를 통해 로컬 환경에서 단어장을 관리합니다.
  - 브라우저의 `localStorage`에 상태가 보존되며, 서버 비용 없이 즉각적인 반응성을 제공합니다.

### 19.3 Synchronization Logic (`useSaveAction`)

'저장(Save)'이라는 마스터 액션과 개별 '단어장(Vocabulary List)' 간의 상태 일관성을 유지하기 위한 캡슐화 로직입니다.

1.  **Selection Logic**: 사용자가 처음 저장 버튼을 누르면, 리스트가 있을 경우 첫 번째 리스트에 자동으로 담고 `isSaved` 상태를 `true`로 만듭니다. 리스트가 하나도 없다면 단어장 만들기 모달을 띄웁니다.
2.  **Bidirectional Sync**:
    - 단어장 모달에서 마지막 남은 리스트의 체크를 해제하면 마스터 저장 상태(`isSaved`)도 `false`로 변경됩니다.
    - 반대로 마스터 저장 버튼을 눌러 저장을 취소하면, 해당 표현이 담긴 모든 단어장에서 한꺼번에 제거됩니다.
3.  **Performance Optimization**: Zustand 스토어 구독 시 원본 객체(`raw state`)를 선택하고 가공은 컴포넌트 내에서 수행하도록 설계하여, 불필요한 참조 생성에 의한 무한 루프 렌더링을 방지했습니다.

### 19.4 Database Schema & Triggers

- **`vocabulary_lists`**: 단어장 메타 정보(제목, 소유자)를 저장합니다.
- **`vocabulary_items`**: 단어장과 표현(`expressions`) 간의 M:N 관계를 정의합니다.
- **Trigger**: `update_vocab_updated_at` 기능을 통해 단어장 내 아이템 추가/삭제나 제목 변경 시 `updated_at` 컬럼이 자동으로 갱신되어, 정렬 최신성을 유지합니다.

## 20. Component Refactoring & Reusability (컴포넌트 리팩토링 및 재사용성)

### 20.1 Unified Action Bar (`ExpressionActions.tsx`)

- **Objective**: '저장', '공유' 등 표현과 관련된 주요 액션 버튼들의 레이아웃과 로직을 단일 컴포넌트로 캡슐화하여 유지보수 효율성을 높입니다.
- **Implementation**:
  - `SaveButton`, `ShareButton`을 결합한 컨테이너 컴포넌트를 구축했습니다.
  - **Flexbox Layout**: `justify-between`과 `gap` 설정을 통해 모바일과 데스크탑 환경 모두에서 균형 잡힌 버튼 배치를 보장합니다.
  - **Prop-driven Styling**:
    - `actionButtonSize`: `lg` (상세 페이지용) 또는 기본 크기 (카드용)를 주입받아 버튼들의 크기를 일관되게 조정합니다.
    - `shareVariant`: 공유 버튼의 텍스트 노출 여부(`default` vs `compact`)를 제어합니다.
- **Benefit**: 상세 페이지(`page.tsx`)와 리스트 카드(`ExpressionCard.tsx`)의 코드가 간결해졌으며, 버튼 간격이나 정렬 방식 변경 시 한 곳에서만 수정하면 전체 UI에 반영됩니다.

### 20.2 Modal Event Isolation (이벤트 격리)

- **Problem**: `Dialog` (Radix UI) 내부의 클릭 이벤트가 DOM 트리를 따라 부모 요소로 전파되어, 모달 아래에 있는 카드나 링크가 클릭되는 현상 발생.
- **Solution**:
  - `LoginModal.tsx`의 `Overlay`와 `Content` 컴포넌트에 `onClick={(e) => e.stopPropagation()}`을 적용했습니다.
  - 이를 통해 모달 내부 인터랙션이 부모의 클릭 핸들러를 트리거하지 않도록 보장하여 UX 안정성을 확보했습니다.

## 21. Error Handling Architecture (에러 핸들링 아키텍처)

사용자에게 일관된 에러 경험을 제공하고 디버깅 효율성을 높이기 위해 중앙 집중식 에러 관리 시스템을 구축했습니다.

### 21.1 Centralized Error Hook (`useAppErrorHandler`)

- **Objective**: 개별 컴포넌트나 훅에서 `try/catch`와 UI 알림 로직이 중복되는 것을 방지합니다.
- **Implementation**:
  - `hooks/useAppErrorHandler.ts`에 정의된 이 훅은 에러 객체를 받아 표준화된 처리를 수행합니다.
  - **Error Normalization**: `AppError`, `Error`, `string` 등 다양한 형태의 에러를 `AppError` 객체로 통일합니다.
  - **UI Notification**: `ToastContext`를 사용하여 사용자에게 친화적인 에러 메시지를 표시합니다.
  - **Logging**: 개발 모드에서는 상세 에러 로그를 콘솔에 출력합니다.

### 21.2 Unified Error Types (`types/error.ts`)

- **Standardization**: 애플리케이션 전반에서 사용되는 에러 코드를 열거형(Enum)으로 관리합니다.
- **Consolidation**: 기존의 `ACTION_UNAUTHORIZED` 등 파편화된 에러 코드를 `UNAUTHORIZED`와 같이 범용적인 코드로 통합하여 관리 복잡도를 줄였습니다.
- **i18n Integration**: 에러 코드에 대응하는 다국어 메시지 키를 매핑하여, 에러 발생 시 즉시 번역된 메시지를 제공할 수 있는 기반을 마련했습니다.

### 21.3 Global Toast System (`ToastContext`)

- **Structure**: `context/ToastContext.tsx`
- **Role**: 애플리케이션 최상위(`layout.tsx`)에서 `ToastProvider`로 감싸져 있어, 어디서든 `useToast()` 훅을 통해 알림을 띄울 수 있습니다.
- **Integration**: `useAppErrorHandler`와 긴밀하게 통합되어, 에러 발생 -> 핸들러 호출 -> 토스트 알림으로 이어지는 일관된 파이프라인을 형성합니다.

### 21.4 Custom Hook Pattern with Reducer (`useQuizGame`)

**Problem**: 퀴즈 게임(`QuizGame.tsx`) 컴포넌트에 상태 관리, 비즈니스 로직, 세션 스토리지, 분석 트래킹 로직이 복잡하게 섞여 있어 컴포넌트가 비대해지고 유지보수가 어려웠습니다.

**Solution**: Reducer 패턴을 사용하는 커스텀 훅(`useQuizGame`)으로 로직 추출하여 컴포넌트 간소화 및 재사용성을 확보했습니다.

#### A. Hook 구조 (Structure)

```typescript
// hooks/quiz/useQuizGame.ts
export function useQuizGame(initialExpressions: Expression[]) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  return {
    state,
    content,
    parsedQuiz,
    currentExpression,
    actions: {
      handleAnswerSelect,
      handleNext,
      handleRestart,
    },
  };
}
```

#### B. Reducer 패턴 (Reducer Pattern)

- **Action Types**: `RESTORE`, `SUBMIT`, `NEXT`, `FINISH` 등 액션 타입을 명시적으로 정의
- **Immutability**: Reducer 내에서는 불변성을 유지하며 상태 업데이트
- **Predictability**: 동일한 상태 변화는 항상 동일한 액션을 통해 수행되어 예측 가능성 확보

#### C. 컴포넌트 간소화 (Component Simplification)

**Before** (`QuizGame.tsx`): ~160 lines

- 로컬 useState, useEffect, 비즈니스 로직이 혼재
- 역할이 명확하지 않아 테스트 및 유지보수 어려움

**After** (`QuizGame.tsx`): ~30 lines

- `useQuizGame` 훅으로부터 상태와 액션만 주입받음
- UI 렌더링에 집중하고 비즈니스 로직은 훅에 위임

#### D. 장점 (Benefits)

1. **Separation of Concerns**: UI 컴포넌트와 비즈니스 로직이 완전히 분리
2. **Testability**: 훅을 독립적으로 유닛 테스트 가능
3. **Reusability**: 다른 컴포넌트에서도 동일한 퀴즈 로직 재사용 가능
4. **Maintainability**: 상태 전환 로직이 한 곳(Reducer)에 집중되어 디버깅 용이

#### E. 타입 안전성 (Type Safety)

- `QuizState`, `QuizAction` 등 명시적 인터페이스 정의
- TypeScript의 타입 추론을 활용하여 컴파일 타임 에러 방지
