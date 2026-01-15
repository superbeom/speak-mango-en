# Implementation Walkthrough

> 각 버전별 구현 내용과 변경 사항을 상세히 기록합니다. 최신 버전이 상단에 옵니다.

## v0.12.9: PWA Meta Tag 업데이트 (2026-01-15)

### 1. Deprecation Fix

- **File**: `app/layout.tsx`
- **Change**: Meta tag 업데이트
  - **Before**: `<meta name="apple-mobile-web-app-capable" content="yes" />`
  - **After**: `<meta name="mobile-web-app-capable" content="yes" />`

### 2. Reason

- Chrome DevTools deprecation 경고 해결
- 표준화된 메타 태그로 업데이트
- 향후 브라우저 호환성 확보

### 3. Result

- ✅ **Deprecation 경고 제거**: DevTools에서 경고 사라짐
- ✅ **표준 준수**: 최신 PWA 표준 메타 태그 사용
- ✅ **기능 유지**: Standalone 모드 정상 작동

## v0.12.8: Open Graph 이미지 중앙 정렬 개선 (2026-01-15)

### 1. Layout Adjustment

- **File**: `app/opengraph-image.tsx`
- **Issue**: 로고와 텍스트가 오른쪽으로 치우쳐 보이는 문제
- **Solution**: CSS transform을 사용한 미세 조정
  - Container: `transform: translateX(-25px)`
  - Text: `transform: translateX(-15px)`

### 2. Result

- ✅ **시각적 균형**: 로고와 서비스명이 중앙에 정렬
- ✅ **소셜 미디어 최적화**: 공유 시 더 나은 썸네일 표시

## v0.12.7: Share 메시지 개선 (i18n) (2026-01-15)

### 1. i18n Message Update

- **Files**: 9개 언어 파일 (`i18n/locales/*.ts`)
- **Change**: `shareCopied` 메시지 개선
  - **Before**: "Link copied to clipboard!" / "링크가 클립보드에 복사되었습니다!"
  - **After**: "Shared successfully!" / "공유 완료!"

### 2. Reason

- ShareButton은 두 가지 방식으로 작동:
  - **Web Share API** (모바일): 네이티브 공유 다이얼로그
  - **Clipboard API** (데스크탑): 클립보드 복사
- 기존 메시지는 데스크탑에만 정확, 모바일에서는 부정확
- 두 방식 모두에 적합한 일반적인 메시지로 통일

### 3. Result

- ✅ **정확한 사용자 피드백**: 모바일/데스크탑 모두에서 정확한 메시지 표시
- ✅ **일관된 UX**: 플랫폼 무관하게 동일한 메시지 경험
- ✅ **9개 언어 지원**: 모든 언어에서 개선된 메시지 제공

## v0.12.6: Google Tag Manager 향후 고려사항 문서화 (2026-01-14)

### 1. Documentation Update

- **File**: `docs/product/future_todos.md`
  - Marketing & Analytics 섹션 신규 추가
  - Google Tag Manager (GTM) 도입을 선택적 개선사항으로 문서화

### 2. Key Points (GTM)

- **Current State**: GA4를 `gtag.js`로 직접 연동 중 (타입 안전, 명확)
- **GTM Adoption Criteria**:
  - 마케팅 도구 2개 이상 사용
  - 마케팅 팀 구성 (비개발자 태그 관리)
  - 빈번한 A/B 테스트
- **Conclusion**: 현재는 GTM 불필요, 향후 프로젝트 복잡도 증가 시 고려

### 3. Result

- ✅ **명확한 의사결정 프레임워크**: GTM 도입 시점 및 조건 문서화
- ✅ **조기 최적화 방지**: 현재 단일 도구 환경에서는 직접 연동이 최적
- ✅ **향후 가이드 제공**: 마케팅 도구 확장 시 참고 자료

## v0.12.5: 표현 카드 공유 버튼 통합 (2026-01-14)

### 1. Card Layout Redesign

- **Independent Share Button Positioning**:
  - ShareButton을 카드 우측 하단에 absolute 포지셔닝
  - `bottom-5 right-5` 위치로 고정하여 태그와 독립적으로 배치
  - Link 컴포넌트에 `relative` 추가하여 포지셔닝 컨텍스트 제공

### 2. Event Propagation Prevention

- **Robust Click Handling**:
  - ShareButton 내부: `e.preventDefault()` + `e.stopPropagation()`
  - ExpressionCard: `onClick={(e) => e.stopPropagation()}`
  - 카드 클릭(상세 페이지 이동)과 공유 버튼 클릭 완전 분리

### 3. UI/UX Improvements

- **Visual Hierarchy**:
  - 태그는 좌측에 자연스럽게 흐르도록 flex-wrap
  - 공유 버튼은 우측 하단 고정 위치로 시각적 균형 확보
  - compact variant로 공간 효율성 극대화

### 4. Result

- ✅ **카드 통합 완료**: 메인 페이지 및 관련 표현 섹션에서 바로 공유 가능
- ✅ **이벤트 분리**: 공유 버튼 클릭 시 페이지 이동 없이 공유 기능만 실행
- ✅ **일관된 UX**: 상세 페이지와 동일한 공유 경험 제공

## v0.12.4: Share 기능 구현 (Web Share API + Analytics) (2026-01-14)

### 1. ShareButton Component Implementation

- **Component**: `components/ShareButton.tsx` 생성
  - **Web Share API**: 모바일 환경에서 네이티브 공유 다이얼로그 지원
  - **Clipboard Fallback**: 데스크탑 환경에서 클립보드 복사 기능 제공
  - **Variant Support**: `default` (아이콘 + 텍스트) 및 `compact` (아이콘만) 모드 지원
  - **Event Propagation Prevention**: 카드 통합 시 이벤트 전파 방지 (`e.preventDefault()` + `e.stopPropagation()`)
  - **Analytics Integration**: `trackShareClick` 및 `trackShareComplete` 자동 호출

### 2. Toast Notification System

- **Component**: `components/ui/Toast.tsx` 생성
  - 재사용 가능한 독립 컴포넌트로 설계
  - `success` / `error` 타입 지원
  - Framer Motion 기반 애니메이션 (fade-in + slide-in)
- **Type System**: `types/toast.ts` 생성
  - `ToastType` 타입 정의
  - `TOAST_TYPE` 상수 정의 (`SUCCESS`, `ERROR`)
  - 중앙 집중식 타입 관리로 재사용성 향상

### 3. Share URL Generation

- **Utility**: `lib/utils.ts`에 `getShareUrl` 함수 추가
  - 표현 ID 기반 공유 URL 생성
  - UTM 파라미터 지원 (`utm_source=share`, `utm_medium=native`)
  - `BASE_URL` 상수 활용 (환경별 URL 자동 전환)

### 4. Analytics Tracking

- **Events**: `analytics/index.ts`
  - `trackShareClick`: 공유 버튼 클릭 추적
    - `shareMethod`: `"native"` (Web Share API) | `"copy_link"` (클립보드)
    - `sharePlatform`: `"native"` | `"clipboard"`
  - `trackShareComplete`: 공유 완료 추적
- **Integration**: ShareButton 내부에서 자동 호출
  - 네이티브 공유 성공 시: `sharePlatform: "native"`
  - 클립보드 복사 성공 시: `sharePlatform: "clipboard"`

### 5. Internationalization (i18n)

- **9개 언어 지원**: EN, KO, JA, ES, FR, DE, RU, ZH, AR
- **Translation Keys**:
  - `detail.share`: "Share" / "공유" / "共有" 등
  - `detail.shareCopied`: "Link copied!" / "링크 복사됨!" 등
  - `detail.shareFailed`: "Failed to share" / "공유 실패" 등
  - `card.share`, `card.shareCopied`, `card.shareFailed`: 카드용 동일 텍스트

### 6. UI Integration

- **Detail Page**: `app/expressions/[id]/page.tsx`
  - Tags & Source 섹션에 ShareButton 추가 (default variant)

### 7. Documentation Updates

- **Analytics Guide**: `docs/analytics/analytics_guide.md`
  - 공유 이벤트 섹션 업데이트 ("향후 구현" → "구현 완료")
  - `share_method` 및 `share_platform` 파라미터 정의 업데이트
- **Implementation Guide**: `docs/analytics/implementation_guide.md`
  - ShareButton 컴포넌트 추가
  - 공유 이벤트 체크리스트 완료 표시
- **Features List**: `docs/product/features_list.md`
  - Share 기능 상세 설명 추가 (모바일/데스크탑 동작 방식)
  - Analytics 섹션에서 Share 이벤트 완료 표시
- **Future Todos**: `docs/product/future_todos.md`
  - Social Share Button 섹션 삭제 (구현 완료)
- **Task**: `docs/task.md`
  - Phase 5 Analytics - Tracking (Share) 완료 표시

### 8. Result

- ✅ **Web Share API 구현**: 모바일에서 Instagram, Twitter, KakaoTalk 등 네이티브 앱으로 직접 공유 가능
- ✅ **Clipboard Fallback**: 데스크탑에서 클립보드 복사 + Toast 알림
- ✅ **Analytics 추적**: 공유 클릭 및 완료 이벤트 자동 추적
- ✅ **9개 언어 지원**: 모든 언어에서 공유 기능 사용 가능
- ✅ **재사용 가능한 Toast**: 향후 다른 기능에서도 Toast 컴포넌트 활용 가능

## v0.12.3: Analytics Phase 3 완료 (Audio Complete & Related Click) (2026-01-14)

### 1. Audio Complete Tracking

- **Implementation**: `DialogueAudioButton.tsx`의 `handleEnded` 함수에서 `trackAudioComplete` 호출
  - **Logic**: 오디오 재생이 끝까지 완료되었을 때만 이벤트 전송
  - **Sequential Play**: 전체 듣기 모드에서도 각 문장이 끝날 때마다 이벤트 발생

### 2. Related Expression Click Tracking

- **Implementation**: `RelatedExpressions.tsx`에 `trackRelatedClick` 추가
  - **Props**: `currentExpressionId` prop 추가하여 출발지(Source) 추적
  - **Action**: 관련 표현 카드 클릭 시 `from_expression_id`와 `to_expression_id` 전송
- **Result**: 추천 콘텐츠의 클릭률(CTR) 및 연관 탐색 패턴 분석 가능

### 3. Smart Tracking Logic (Duplicate Prevention)

- **Problem**: '전체 듣기' 실행 시 개별 재생(`audio_play`) 이벤트가 중복 발생하거나, 일시정지 후 재개 시 중복 집계되는 문제
- **Solution**:
  - **Sequential Flag**: `play(true)` 파라미터를 통해 순차 재생임을 명시하고 중복 추적 방지
  - **Resume Check**: `isPaused` 상태를 확인하여 일시정지 후 재개인 경우 이벤트 스킵

### 4. Documentation Updates

- **docs/product/features_list.md**: Phase 3 완료 상태 반영 (Audio Complete, Related Click)
- **docs/analytics/implementation_guide.md**: 체크리스트 업데이트
- **docs/analytics/analytics_guide.md**: 이벤트 구현 상태 업데이트

### 5. Result

- **Phase 3 완전 정복**: 기획된 10개 핵심 이벤트 중 공유(Share)를 제외한 모든 상호작용 추적 구현 완료
- **Data Completeness**: 단순 클릭뿐만 아니라 '완청(Complete)' 데이터까지 확보하여 콘텐츠 몰입도 분석 가능

## v0.12.2: Analytics Phase 3 완료 - 학습 모드, 필터, 검색, 태그 추적 (2026-01-14)

### 1. Learning Mode Toggle Tracking

- **Implementation**: `DialogueSection.tsx`에 `trackLearningModeToggle` 추가
  - **Blind Listening Mode**: Headphones 아이콘 클릭 시 `mode: "blind_listening"`, `action: "enable"/"disable"` 전송
  - **Translation Blur Mode**: Eye 아이콘 클릭 시 `mode: "translation_blur"`, `action: "enable"/"disable"` 전송
- **Logic**: 각 모드의 활성화/비활성화 상태 변화를 정확히 추적
- **Result**: 사용자의 학습 패턴 및 모드 사용률 분석 가능

### 2. Category Filter Tracking

- **Implementation**: `FilterBar.tsx`에 `trackFilterApply` 추가
  - 카테고리 버튼 클릭 시 `filterType: "category"`, `filterValue: cat` 전송
  - 중복 클릭 방지: 이미 선택된 카테고리 재클릭 시에만 "all"로 변경 이벤트 전송
- **Result**: 사용자의 카테고리 탐색 패턴 및 인기 카테고리 파악 가능

### 3. Search Tracking

- **Implementation**: `SearchBar.tsx`에 `trackSearch` 추가
  - 검색 제출 시 `searchTerm: value` 전송
  - 빈 검색어는 추적하지 않음 (`value.trim()` 체크)
- **Result**: 사용자 검색 의도 및 검색어 패턴 분석 가능

### 4. Tag Click Tracking

- **Implementation**: `Tag.tsx`에 `trackTagClick` 추가
  - **Props 확장**: `source` prop 추가 (`"card" | "detail" | "filter"`)
  - **Client Component**: `"use client"` 지시어 추가하여 클라이언트 컴포넌트화
  - **Source Distinction**:
    - `ExpressionCard.tsx`: `source="card"` 전달 (홈 피드 카드)
    - `app/expressions/[id]/page.tsx`: `source="detail"` 전달 (상세 페이지)
- **Result**: 태그 클릭이 발생하는 위치별 사용자 행동 패턴 분석 가능

### 5. Documentation Updates

- **docs/project_history.md**: Analytics Phase 3 완료 항목 추가 (Q&A, 구현 상세, 검증 방법)
- **docs/product/features_list.md**: Phase 3 이벤트 상태를 ⏳에서 ✅로 변경
- **docs/analytics/analytics_guide.md**: Phase 3 완료 상태 반영
- **docs/analytics/implementation_guide.md**: 체크리스트 및 디렉토리 구조 업데이트

### 6. Result

- **Phase 3 완료**: 7개 이벤트 추적 구현 완료
  - ✅ `expression_click`, `expression_view`
  - ✅ `audio_play`
  - ✅ `learning_mode_toggle` (Blind Listening, Translation Blur)
  - ✅ `filter_apply` (카테고리)
  - ✅ `search`
  - ✅ `tag_click` (source 구분)
- **향후 구현**: `audio_complete`, `related_click`, `share_click` 등

## v0.12.1: Analytics 모듈 재구성 및 Phase 3 이벤트 추적 구현 (2026-01-14)

### 1. Analytics Module Structure Reorganization

- **Directory Move**: `lib/analytics/` → `analytics/` (루트 레벨로 이동)
  - 독립된 모듈로 분리하여 발견 가능성 향상
  - Import 경로 단순화: `@/lib/analytics` → `@/analytics`
- **Comment Localization**: 모든 영어 주석을 한국어로 변환
  - `analytics/index.ts`: 12개 이벤트 함수 주석 한국어화
  - `analytics/AnalyticsProvider.tsx`: Provider 주석 한국어화
  - `analytics/ExpressionViewTracker.tsx`: Tracker 주석 한국어화
- **Import Path Updates**: 7개 파일의 import 경로 업데이트
  - `app/layout.tsx`
  - `app/expressions/[id]/page.tsx`
  - `components/ExpressionCard.tsx`
  - `components/DialogueAudioButton.tsx`
  - `analytics/index.ts`
  - `analytics/AnalyticsProvider.tsx`
  - `analytics/ExpressionViewTracker.tsx`

### 2. Phase 3: Component-Level Event Tracking Implementation

- **Expression Click Tracking** (`ExpressionCard.tsx`)
  - `trackExpressionClick()` 호출 추가
  - 파라미터: `expressionId`, `expressionText`, `category`, `source: "home_feed"`
  - 사용자가 홈 피드에서 표현 카드를 클릭할 때 자동 추적
- **Expression View Tracking** (`ExpressionViewTracker.tsx`)
  - 새로운 클라이언트 컴포넌트 생성
  - 표현 상세 페이지 로드 시 `trackExpressionView()` 자동 호출
  - 파라미터: `expressionId`, `category`, `lang`
  - 서버 컴포넌트(`page.tsx`)에서 사용 가능하도록 설계
- **Audio Play Tracking Infrastructure** (`DialogueAudioButton.tsx`)
  - Props 추가: `expressionId`, `audioIndex`, `playType`
  - 오디오 재생 시작 시 `trackAudioPlay()` 호출
  - 파라미터 조건부 전송 (props가 있을 때만)
  - 향후 `DialogueSection`에서 props 전달 필요

### 3. Documentation Updates

- **project_context.md**: 디렉토리 구조 업데이트
  - `lib/analytics/` 제거
  - `analytics/` 추가 (3개 파일 명시)

### 4. Result

- Analytics 모듈이 독립적이고 발견하기 쉬운 구조로 개선
- 모든 주석이 한국어로 통일되어 프로젝트 규칙 준수
- 핵심 사용자 상호작용 3가지 자동 추적 시작:
  1. 표현 카드 클릭 (홈 피드)
  2. 표현 상세 조회
  3. 오디오 재생 (인프라 구축)
- Phase 3 나머지 이벤트 추적을 위한 기반 마련

## v0.12.0: Analytics Implementation (Google Analytics 4) (2026-01-14)

### 1. GA4 Integration & Infrastructure

- **Module Structure**: `lib/analytics/` 폴더 생성 및 모듈화
  - `index.ts`: 타입 안전한 이벤트 추적 유틸리티 (12개 이벤트 함수)
  - `AnalyticsProvider.tsx`: 자동 페이지 뷰 추적 Provider
- **Environment-Based Configuration**: 개발/프로덕션 환경별 GA4 속성 자동 전환
  - 개발: `NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID` (Speak Mango EN (Dev))
  - 프로덕션: `NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID` (Speak Mango EN)
  - `process.env.NODE_ENV`에 따라 `lib/analytics/index.ts`에서 자동 선택
- **Provider Architecture**: `AnalyticsProvider`를 최상위에 배치하여 `ExpressionProvider`와 독립적으로 작동
- **Result**: 사용자 행동 분석 인프라 구축 완료, Phase 1-2 완료 (페이지 뷰 자동 추적)

### 2. Automatic Page View Tracking

- **Implementation**: `usePathname` + `useSearchParams` 훅으로 라우트 변경 감지
- **Title Synchronization**: `setTimeout` 100ms로 Next.js Metadata API가 `document.title`을 설정할 시간 확보
- **Result**: 모든 페이지 이동이 자동으로 GA4에 전송되며, 정확한 title과 lang 정보 포함

### 3. TypeScript Type Safety

- **Function Overloading**: `gtag` 함수의 타입 정의를 함수 오버로드로 구현하여 `Date` 객체 타입 에러 해결
  ```typescript
  gtag?: {
    (command: "js", date: Date): void;
    (command: "config", targetId: string, config?: Record<string, any>): void;
    (command: "event", eventName: string, params?: Record<string, any>): void;
  };
  ```
- **Event Helpers**: 12개의 타입 안전한 이벤트 추적 함수 (표현 클릭, 오디오 재생, 학습 모드 등)
- **Result**: 컴파일 타임에 이벤트 파라미터 검증, 런타임 에러 방지

### 4. i18n Title Duplication Fix

- **Problem**: `layout.tsx`의 `title.template` (`%s | Speak Mango`)과 i18n 파일의 `expressionTitle` (`{expression} | {serviceName}`)이 중복되어 `snap up | Speak Mango | Speak Mango` 형태로 표시
- **Solution**: 9개 언어 파일 모두에서 `expressionTitle`을 `{expression}`으로 수정
- **Result**: `snap up | Speak Mango` 형태로 정상 표시

### 5. Documentation

- **Analytics Guide** (`docs/analytics/analytics_guide.md`): 전체 Analytics 전략, 이벤트 설계, 지표 정의
- **Implementation Guide** (`docs/analytics/implementation_guide.md`): 다른 Next.js 프로젝트에서 재사용 가능한 실전 구현 가이드
- **Project Context Update**: `lib/analytics/` 구조와 `docs/analytics/` 문서를 `project_context.md`에 추가

### 6. Next Steps (Phase 3)

- 컴포넌트별 이벤트 추적 구현 예정:
  - `ExpressionCard.tsx`: 표현 클릭 추적
  - `DialogueAudioButton.tsx`: 오디오 재생 추적
  - `DialogueSection.tsx`: 학습 모드 전환 추적
  - `FilterBar.tsx`: 필터/검색 추적
  - `Tag.tsx`: 태그 클릭 추적

## v0.11.5: PWA iOS Splash Screen Fix (2026-01-13)

### 1. Explicit Head Injection (iOS Compatibility)

- **Problem**: Next.js Metadata API를 통한 `startupImage` 설정이 iOS PWA 환경에서 간헐적으로 무시되어 앱 실행 시 흰 화면이 노출되는 문제 발생.
- **Solution**: `layout.tsx`에 수동으로 `<head>` 태그를 구성하고 30여 개의 `<link rel="apple-touch-startup-image" ...>` 태그를 직접 주입하여 안정성 확보.
- **Result**: iOS 기기별 모든 해상도 및 방향(Portrait/Landscape)에서 스플래시 스크린 정상 동작 확인.

### 2. Standalone Mode Assurance

- **Meta Tag**: `apple-mobile-web-app-capable` 메타 태그를 수동 시스템에 추가하여, "홈 화면에 추가" 시 브라우저 UI 없이 독립형(Standalone) 앱으로 구동되도록 강제함.

## v0.11.4: Service Essentials Update (PWA Splash & Theme Color) (2026-01-13)

### 1. Dynamic Theme Color

- **Viewport Config**: Next.js의 `viewport` 설정을 통해 시스템 테마(Light/Dark)에 따라 브라우저 상단 바 색상을 동적으로 전환(`#ffffff` <-> `#0a0a0a`).
- **UX Improvement**: 다크 모드 사용자에게 눈부심 없는 일관된 시각적 경험 제공.

### 2. Complete PWA Asset Injection

- **Splash Screens**: `pwa-asset-generator`로 생성된 iOS 기기별 스플래시 스크린(Startup Image) 메타 태그 30여 개를 `layout.tsx`에 모두 주입.
- **Manifest**: `manifest` 파일 연결을 명시하여 PWA 설치 가능성 및 웹 앱 표준 준수 강화.

## v0.11.3: Dynamic OG Image Design & Metadata Polish (2026-01-13)

### 1. Dynamic OG Image Redesign (Expression Detail)

- **Visual Upgrade**: 메인 OG 이미지의 디자인 언어(White BG, Gradient Text, Logo Header)를 상세 페이지인 `app/expressions/[id]/opengraph-image.tsx`에도 적용하여 브랜드 일관성 확보.
- **Runtime Switch (Edge -> Node.js)**: 로컬 파일 시스템(`fs`)을 통해 고화질 로고(`logo.png`)와 폰트 파일(`inter-*.ttf`)을 직접 로드하기 위해 런타임 환경을 변경함.
- **Typography Hierarchy**:
  - **Service Name**: Inter Bold (700) + Gradient
  - **Expression**: Inter Black (900)
  - **Meaning**: Inter Medium (500)
  - 각 요소의 중요도에 따라 폰트 두께를 차등 적용하여 가독성 최적화.

### 2. i18n Metadata Optimization

- **Expression Description**: 9개 국어 로케일 파일에서 `expressionDesc` 템플릿 수정. 중복되는 `expression` 변수를 제거하고 `meaning`을 전면에 배치하여 검색 결과 및 소셜 공유 시 정보 전달력 강화.

## v0.11.2: 대화 생성 규칙 정교화 및 검증 로직 완화 (2026-01-13)

### 1. Dialogue Generation Rules (Gender & Names)

- **Gender Standardization**:
  - **Role A**: 여성 (Female) - Default: Sarah/Emily
  - **Role B**: 남성 (Male) - Default: Mike/David
- **Name Usage Strategy**:
  - **Flexible Rule**: "If using names"라는 조건을 추가하여, 대화의 자연스러운 흐름을 위해 필요한 경우에만 이름을 사용하도록 유도.
  - **American Preferred**: 이름을 사용할 때는 전형적인 미국식 이름을 사용하며, 한국식 이름 사용은 지양.

## v0.11.1: 검증 로직 완전 동기화 (Validation Parity) (2026-01-13)

### 1. Verification Script Sync

- **Strict Parity**: 로컬 검증 스크립트(`verification/verify_db_data.js`)를 n8n의 최신 검증 로직(`10_validate_content.js`)과 100% 일치시킴.
- **Rules Applied**:
  - **Dialogue Length**: 대화 턴수 2~4턴 강제.
  - **Quiz Consistency**: 퀴즈 선택지의 언어 혼용(영어+타겟어) 금지.
  - **Punctuation & Syntax**: 엄격한 문장 부호 및 태그 형식 검사.

## v0.11.0: n8n Workflow V2 최적화 - Single-Shot AI Generation (2026-01-13)

### 1. Single-Shot AI Architecture

- **통합 생성 (Consolidated Generation)**: 기존의 2단계(표현 선정 -> 콘텐츠 생성) 호출을 하나의 `Gemini Master Generator` 호출로 통합함.
- **성능 향상**: API 호출 횟수를 50% 절감하고, 네트워크 오버헤드를 제거하여 전체 생성 속도를 2배가량 향상시킴.
- **문맥 일관성**: 동일한 프롬프트 컨텍스트 내에서 표현 선정과 다국어 설명을 동시 수행하여, AI가 선정한 표현의 뉘앙스가 예문과 상황 설명에 더 정교하게 반영되도록 개선함.

### 2. Fail-Fast Validation Pipeline

- **검증 단계 전진 배치**: `Validate Content` 로직을 DB 중복 확인 및 ID 생성보다 앞단으로 이동함.
- **효율성 극대화**: 파싱 에러나 규격 미달 데이터가 발생할 경우 조기에 워크플로우를 중단하여, 불필요한 DB 쿼리와 Storage 요청을 방지함.
- **코드 최적화**: `06_validate_content.js` 내의 미사용 변수(`id`)를 제거하여 ESLint 경고를 해결하고 로직을 정제함.

### 3. Workflow Documentation Sync

- **1:1 매칭 가이드**: `docs/n8n/expressions/optimization_steps_v2.md`를 신규 작성하여, 워크플로우의 실제 노드 순서(1~15번)와 문서의 단계 설명(1~15단계)을 완벽하게 일치시킴으로써 운영 가독성을 높임.

## v0.10.1: 대화 턴수 검증 규칙 도입 (Dialogue Turn Length Validation) (2026-01-12)

### 1. Dialogue Length Validation

- **엄격한 턴수 제한**: n8n Code Node인 `10_validate_content.js`에 대화 턴수가 2~4턴 사이인지 검증하는 로직을 도입함.
- **문서 동기화**: `docs/n8n/expressions/optimization_steps.md`에 해당 검증 규칙을 명시하여 데이터 품질 기준을 현행화함.

## v0.10.0: V2 워크플로우 아키텍처 (개발 중) (2026-01-12)

> **⚠️ 상태: 개발 중 (In Development)**
> 이 V2 워크플로우는 현재 개발 중이며 아직 프로덕션 준비가 되지 않았습니다. 특히 `15_groq_tts_v2.js` 노드에 대한 검증이 필요합니다.

### 1. Fan-out 아키텍처 구현

- **병렬 처리 (Parallel Processing)**: `01_pick_category_v2.js`가 이제 여러 카테고리 아이템을 반환하여, 다양한 주제에 대한 콘텐츠 생성을 동시에 수행(Fan-out)할 수 있도록 개선됨.
- **컨텍스트 보존 (Context Preservation)**: `04_prepare_prompt_data_v2.js` 및 다운스트림 노드들이 다중 실행 브랜치를 올바르게 처리하고 병합할 수 있도록 업데이트됨.

### 2. 코드베이스 구조 재편 (V2)

- **전용 디렉토리 (Dedicated Directory)**: 모든 V2 전용 로직과 프롬프트를 `n8n/expressions/v2/`로 이동하여 안정적인 V1 워크플로우와 완전히 격리함.
- **파일 표준화**:
  - `01_pick_category_v2.js`
  - `12_validate_content_v2.js`: "Non-strict" 검증 구현 (실패 대신 필터링).
  - `15_groq_tts_v2.js`: **[검증 필요]** Groq API 제한 준수를 위한 배치 처리(10개 항목) 및 속도 제한(65초 대기) 구현.

### 3. 검증 로직 이원화 (Validation Logic Divergence)

- **V1 (Strict)**: 유효하지 않은 데이터 발생 시 워크플로우를 중단함 (프로덕션용).
- **V2 (Relaxed)**: 유효한 아이템만 통과시키고 유효하지 않은 것은 로그를 남겨, 엄격한 차단보다는 워크플로우의 지속적인 실행을 우선시함.

## v0.9.9: 데이터 검증 로직 고도화 (Strict Validation) (2026-01-12)

### 1. Verification Logic Refinement

- **Strict Data Verification**: `10_validate_content.js`에 엄격한 규칙(Structure Check, Tag Rules, No Mixed Language) 도입.
- **Local Script**: `verification/verify_db_data.js`를 신설하여 n8n 워크플로우 없이 로컬에서 `temp.json` 데이터를 검증할 수 있는 환경 구축.
- **Bug Fix**: `15_aggregate_tts_results.js`에서 Supabase Insert 에러 `PGRST204`를 해결하기 위해 `_validation` 필드 삭제 로직 추가.

## v0.9.8: 프롬프트 정교화 - 혼합 언어 방지 (2026-01-11)

- **이슈**: 타겟 언어 번역에 영어 원문이 섞여 들어가는 현상 발견 (예: "Korean Text. English Text").
- **해결**: `gemini_content_generator_prompt.txt` 및 `batch_dialogue_translation_prompt.txt`에 **"Target Language ONLY"** 및 **"No Mixed Language (CRITICAL)"** 제약 조건 추가.
- **검증**: `docs/n8n/expressions/optimization_steps.md` 문서와 코드가 일치하는지 확인 및 검증 완료.

## v0.9.7: n8n Batch Backfill Optimization & Prompt Strengthening (2026-01-11)

### 1. Batch Processing for Backfill

- **Efficiency**: 대량의 Dialogue 번역 누락 건을 처리하기 위해 Batch Size 20 기반의 처리 로직 도입.
- **Workflow**: `batch_dialogue_translation_prompt.txt` 및 `batch_dialogue_translation_parse_code.js` 구현.

### 2. Prompt Strictness

- **Critical Warning**: `08_gemini_content_generator_prompt.txt`에 8개 언어(`ko, ja, es, fr, de, ru, zh, ar`) 필수 포함 규칙을 `**CRITICAL**` 키워드로 강조하여 누락 방지.

### 3. Legacy Code Cleanup

- **Schema Sync**: TTS 관련 코드(`prepare_tts_requests.js`, `aggregate_tts_results.js`)에서 구버전 `content.ko.dialogue` 경로를 제거하고 `data.dialogue`로 표준화.

## v0.9.6: 하드코딩된 언어 문자열 제거 및 상수화 (2026-01-11)

### 1. Hardcoded String Refactoring

- **Removal of Hardcoded Strings**:
  - codebase 전반(components, i18n utilities, pages)에 걸쳐 `'en'`, `'ko'` 등으로 산재해 있던 하드코딩된 언어 문자열을 `SupportedLanguage` 상수로 대체.
  - `i18n/format.ts`, `i18n/server.ts`, `app/expressions/[id]/page.tsx`, `components/ExpressionCard.tsx` 등 프로젝트 전반의 로케일 로직을 정교화.
- **Logic Standardization**: 특정 언어에 의존적이던 로직을 제거하고 `SupportedLanguage.EN`을 명시적 Fallback으로 사용하도록 통일하여 오타 방지 및 중앙 집중식 관리 실현.

## v0.9.5: 5개국어 추가 및 i18n 타입 안정성 강화 (2026-01-11)

### 1. Language Expansion (9 Languages Supported)

- **New Locales**: FR (French), DE (German), RU (Russian), ZH (Chinese), AR (Arabic) 추가.
- **Implementation**: `i18n/locales/`에 각 언어별 번역 파일 생성 및 `LOCALE_DETAILS` 메타데이터 업데이트.

### 2. Strict Type Safety

- **Dictionary Logic**: `en.ts`를 기준(Source of Truth)으로 삼아 `Dictionary` 타입을 정의.
- **Enforcement**: `i18n/index.ts`에서 모든 언어 팩이 `Dictionary` 인터페이스를 완벽히 준수하도록 강제하여, 키 누락 시 컴파일 에러 발생.

## v0.9.3: Universal Backfill System 구축 (Multi-Language Expansion) (2026-01-11)

### 1. Dual Backfill Strategy (이원화 전략)

- **Problem**: 기존 데이터에 새로운 언어(FR, DE, RU, ZH, AR)를 추가할 때, 이미 검증된 영어 콘텐츠(`en`)까지 덮어쓰여지는 위험과, 반대로 영어 콘텐츠 리뉴얼이 필요한 상황이 혼재.
- **Solution**: 상황에 따라 선택 가능한 두 가지 전략으로 분리.
  - **Universal Mode**: 영문(`en`)을 포함한 6개 국어를 동시 생성 및 갱신. (기존 `ko`, `ja`, `es`는 보존)
  - **Supplementary Mode**: 기존 영문 데이터는 철저히 보존하고, 신규 5개 국어만 생성하여 안전하게 병합.

### 2. Logic Separation (코드 분리)

- **Files**:
  - `universal_backfill_parse_code.js`: `en` 필드 업데이트를 허용하는 병합 로직.
  - `supplementary_backfill_parse_code.js`: `en` 필드 업데이트를 차단하고 신규 언어만 주입하는 로직.
- **Workflow**: `Parse Content JSON` 노드의 자바스크립트 코드를 별도 파일로 관리하여, 운영자가 전략에 맞춰 코드를 손쉽게 교체할 수 있도록 개선.

## v0.9.2: 데이터베이스 스키마 리팩토링 (Database Schema Refactoring) (2026-01-11)

### 1. Dialogue Data Normalization

- **Structure Change**: 기존 `content` JSON 내부에 중첩되어 있던 대화문 데이터를 최상위 `dialogue` JSONB 컬럼으로 이동.
- **Deduplication**: 영어 원문(`en`)과 오디오 경로(`audio_url`)가 각 언어별(`ko`, `ja` 등) 객체마다 반복 저장되던 비효율을 개선하여, 최상위 레벨에서 한 번만 저장하고 각 언어는 번역본(`translations`)만 관리하도록 구조 변경.
- **Indexing**: 대화 내용 검색 성능 향상을 위해 `dialogue` 컬럼에 GIN 인덱스 추가.

## v0.9.1: n8n 콘텐츠 품질 고도화 (Content Quality Refinement) (2026-01-10)

### 1. Gemini Prompt Logic Improvement

- **n8n/expressions/code/08_gemini_content_generator_prompt.txt**:
  - **4-Language Support**: JSON 스키마에 영어(en) 필드를 추가하여, 다국어 콘텐츠 생성 파이프라인(EN/KO/JA/ES)을 완성.
  - **Tone & Manner**: 영어 설명에 대해 "Standard English (Friendly yet educational)" 톤을 정의하고, 교육적 목적에 맞지 않는 Text-speak(문자체) 사용을 금지.
  - **Quiz Randomization**: 퀴즈 정답이 'B'로 쏠리는 편향을 막기 위해, 정답 위치(Option A/B/C)를 무작위로 배정하라는 명시적 규칙 추가.

## v0.9.0: 서비스 필수 요소 완성 (Service Essentials: PWA, SEO, i18n) (2026-01-10)

### 1. PWA Implementation (iOS Completeness)

- **`manifest.ts`**: 안드로이드 및 데스크탑을 위한 표준 매니페스트 설정 (아이콘, 테마 컬러, Standalone 모드).
- **iOS Assets Generator**: `pwa-asset-generator`를 활용하여 iOS 기기별 스플래시 스크린(Startup Image) 30여 장 생성 및 `layout.tsx` 연결.
  - **Logic**: 세로 30%, 가로 20%의 여백(Padding)을 차등 적용하여 모든 화면 회전 상태에서 로고 시인성 확보.
- **Build Config**: `next-pwa`와 Turbopack의 충돌을 방지하기 위해 `next dev --webpack` 설정 강제.

### 2. SEO & Metadata Strategy

- **Dynamic Metadata**: `generateMetadata`를 통해 페이지별 콘텐츠에 최적화된 메타 태그(Title, Desc, Keywords) 동적 생성.
- **Open Graph Image**: `opengraph-image.tsx`를 구현하여 상세 페이지 공유 시 해당 표현 텍스트가 렌더링된 썸네일 카드 자동 생성.
- **Structured Data (JSON-LD)**: 학습 자료(LearningResource) 스키마를 적용하여 구글 검색 리치 스니펫 대응.

### 3. I18n Infrastructure Refactoring

- **Single Source of Truth**: `i18n/index.ts`에 `SupportedLanguage` 상수를 도입하여 흩어져 있던 언어 코드 정의를 중앙화.
- **Refactoring**: `middleware.ts`, `server.ts`, `format.ts` 등 전반적인 i18n 로직이 문자열 대신 상수를 참조하도록 수정하여 타입 안정성(Type Safety) 강화.

## v0.8.18: 프로젝트 고도화 및 품질 개선 (2026-01-09)

### 1. 코드 리팩토링 및 훅 분리 (Hooks Extraction)

- **Problem**: `ExpressionList.tsx`의 비대해진 로직으로 인해 유지보수가 어렵고 버그 발생 가능성이 높음.
- **Solution**: 로직을 목적에 따라 두 개의 커스텀 훅으로 분리함.
  - **`usePaginatedList`**: 페이지네이션 상태 및 캐시 동기화에 집중하도록 개선.
  - **`useScrollRestoration`**: 정밀한 스크롤 위치 추적(200ms 디바운스) 및 재귀적 RAF 기반의 복원 로직 담당.
- **Result**: UI 레이아웃과 데이터 렌더링에만 집중하는 간결하고 예측 가능한 컴포넌트 구조 확보.

## v0.8.17: 스크롤 네비게이션 동작 수정 (2026-01-09)

### 1. Explicit Scroll Reset

- **Problem**: `ExpressionList`가 스크롤 복원을 위해 `history.scrollRestoration`을 `manual`로 설정하고 있어, 상세 페이지에서 태그를 클릭해 메인으로 돌아올 때(새로운 네비게이션) 스크롤이 자동으로 초기화되지 않고 유지되는 문제 발생.
- **Solution**: 캐시된 스크롤 위치가 없는 경우(`targetPosition <= 0`)에는 명시적으로 `window.scrollTo(0, 0)`을 호출하여 강제로 최상단으로 이동하도록 로직 추가.

### 2. Detail Page Scroll Reset (Session Storage)

- **Problem**: 상세 페이지 진입 시 브라우저의 이전 스크롤 기억으로 인해 화면 중간부터 렌더링이 시작되는 현상.
- **Solution**: `sessionStorage` 플래그와 `template.tsx`를 결합하여 새로운 진입 시에만 화면 노출 전 스크롤을 리셋하는 시스템 구축.

## v0.8.16: Audio URL 정규화 및 아키텍처 리팩토링 (2026-01-09)

### 1. Audio URL Normalization (DB 정규화)

- **Relative Paths**: Supabase DB의 `audio_url`을 절대 경로에서 스토리지 내부 상대 경로(`expressions/...`)로 일괄 전환.
- **Portability**: 도메인 변경이나 프로젝트 이전에 유연하게 대응할 수 있는 데이터 구조 확보.

### 2. Architectural Refactoring (캡슐화 및 최적화)

- **Centralized Resolution**: URL 완성 로직을 Server Component에서 Client Component(`DialogueAudioButton`) 내부로 이동.
- **Payload Optimization**: 서버에서 클라이언트로 전달되는 JSON 데이터를 가볍게 유지하고, 필요한 시점에만 Full URL 생성.
- **DX (Developer Experience)**: `constants/index.ts`에 `STORAGE_BUCKET` 상수를 도입하여 설정을 중앙화하고, `lib/utils`의 `getStorageUrl` 유틸리티를 고도화.

### 3. Error Handling Polish

- **Detailed Logging**: 오디오 재생 실패 시 단순 에러 객체 대신 `error.code`, `error.message`, `src`를 포함한 상세 정보를 콘솔에 출력하도록 개선.

## v0.8.15: UI 비주얼 보정 (2026-01-09)

### 1. Visual Polish

- **Dark Mode Visibility**: `DialogueItem`의 Blue Variant가 블러 상태일 때 올바른 색상(`text-blue-200/70`)을 유지하도록 수정하여 시인성 확보.

### 2. Utility Refactoring

- **`text-disabled`**: `app/globals.css`에 유틸리티 클래스를 추가하고 이를 컴포넌트에 적용하여 스타일 코드 중복 제거.

## v0.8.14: 학습 모드 상호작용 고도화 (2026-01-09)

### 1. Smart Toggle Interaction

- **`components/DialogueSection.tsx`**:
  - **Auto-Disable Logic**: 'Blind Listening' 모드가 켜진 상태에서 'Translation Blur'(눈 아이콘) 클릭 시, 자동으로 리스닝 모드를 끄고 해석을 보여주도록 개선.
  - **State Preservation**: `savedRevealedIndices` 상태를 도입하여, Blind Mode 진입 시 이전의 해석 노출 상태를 백업하고 해제 시 복원.
  - **Constraint Removal**: 기존의 `isDisabled` 제약을 제거하여 사용자 주도적인 모드 전환 지원.

### 2. Individual English Reveal

- **`components/DialogueSection.tsx` & `DialogueItem.tsx`**:
  - **Selective Reveal**: 'Blind Listening' 모드 활성화 시, 전체를 다 끄지 않고도 궁금한 영어 문장만 클릭하여 일시적으로 확인할 수 있는 기능 추가.
  - **Auto-Exposed Logic**: 사용자가 수동으로 모든 영어 문장을 드러내면(`revealedEnglishIndices.size === dialogue.length`), 자동으로 `viewMode`를 `exposed`로 전환하여 'Blind Mode'를 해제하고 UI를 동기화.
  - **State Management**: `viewMode`(`'blind' | 'partial' | 'exposed'`) 상태 머신을 도입하여 복잡한 투명도/블러 로직을 체계적으로 관리.
  - **UX Detail**: 블러 처리된 텍스트에 `cursor-pointer`와 `hover` 효과를 주어 클릭 가능함을 암시하고, 해석은 여전히 가려진 상태를 유지하여 학습 효과 지속.

## v0.8.12: 학습 모드 (Learning Mode) 및 오디오 안정화 (2026-01-08)

### 1. Learning Mode Foundation

- **`components/DialogueSection.tsx`**:
  - `isBlindMode` (영어 블러) 및 `revealedIndices` (해석 블러) 상태 관리 로직 추가.
  - **LearningToggle**: 공통 토글 버튼 컴포넌트를 사용하여 리스닝 모드와 해석 블러 제어 UI 구현.
  - **Interaction Policy**: 리스닝 모드 활성 시 해석 블러 버튼을 비활성화(`isDisabled`)하여 학습 집중도 향상.

### 2. Individual Line Translation Reveal

- **`components/DialogueItem.tsx`**:
  - 해석 영역 클릭 시 해당 문장의 블러만 해제되는 토글 기능 구현.
  - 리스닝 모드일 경우 해석 영역과 영어 문장 모두 블러 처리 및 클릭 방지.

## v0.8.11: 대화 전체 듣기(Sequential Playback) 기능 구현 (2026-01-08)

### 1. Sequential Playback Logic

- **`components/DialogueSection.tsx`**:
  - `DialogueSection` 컴포넌트를 신설하여 대화 리스트와 오디오 재생 로직을 캡슐화.
  - **Auto Play**: '전체 듣기(Play All)' 버튼 클릭 시 A와 B의 대화를 순차적으로 재생하는 로직 구현.
  - **Smart Interruption**: 자동 재생 중 사용자가 특정 줄을 수동으로 재생하거나 멈추면, 자동 재생 모드가 즉시 해제되어 사용자 의도를 존중.
  - **Loading Synchronization**: '전체 듣기' 버튼은 포함된 모든 오디오 파일(`readyIndices`)이 로딩될 때까지 비활성화되며, 'Loading...' 상태를 표시하여 안정적인 연속 재생을 보장.

### 2. Audio Stability & Optimization

- **`components/DialogueAudioButton.tsx`**:
  - **Flicker Fix**: `onReady` 콜백이 변경될 때마다 오디오가 불필요하게 재로딩되는 문제를 `useRef`를 사용하여 해결, 로딩 상태 깜빡임 제거.
  - **Ready State**: 오디오 로딩이 완료(`canplaythrough`)되거나 에러가 발생했을 때 부모에게 준비 완료 신호를 보내는 `onReady` prop 구현.
  - **Visual Feedback**: 개별 재생 버튼 로딩 시에도 커서를 `not-allowed`로 변경하여 사용자에게 명확한 피드백 제공.

### 3. UI/UX

- **Play All Button**: 대화 섹션 타이틀 옆에 직관적인 재생/정지 버튼 배치.
- **Active State**: 현재 자동 재생 중인 대화 버블에 `ring` 효과를 주어 시각적 포커스 제공.

### 4. Internationalization

- **Keys**: `playAll`, `stop` 키를 `en.ts`, `ko.ts`에 추가하여 다국어 지원.
- **Loading Label**: 'Loading...' 텍스트를 `common.loading` 키로 중앙 관리하여 언어팩에서 제어하도록 개선.

## v0.8.10: 대화 섹션 스타일링 개선 및 모바일 최적화 (2026-01-08)

### 1. Mobile Optimization (Hover Removal)

- **`useIsMobile` Hook**: `DialogueSection` 및 `DialogueAudioButton`에 훅을 적용하여 모바일 환경 감지.
- **Conditional Styling**: `hover:` 클래스들을 `!isMobile` 조건부로 래핑하여, 터치 디바이스에서 불필요한 호버 효과(색상 변경 등)가 발생하는 것을 방지.

### 2. UI Consistency & Visibility

- **Button Styling**:
  - `DialogueAudioButton`: `variant` prop(`default` | `blue`) 도입.
    - **Default (User A)**: Dark mode hover 개선(`dark:hover:bg-zinc-700`)하여 배경과 구분되도록 수정.
    - **Blue (User B)**: Dark mode에서도 Light mode와 동일한 파란색 테마 유지. 재생 중(Playing) 상태일 때 호버 배경색(`bg-blue-500`)을 그대로 사용하여 시각적 안정감 확보.
  - **Dark Mode**: '전체 듣기' 버튼의 호버 시 텍스트 색상을 `dark:hover:text-zinc-200`으로 명시하여, 어두운 배경(`bg-zinc-700`) 위에서도 가독성 확보.
- **Code Refactoring**: `cn` 유틸리티를 활용하여 조건부 클래스 결합 로직을 깔끔하게 정리.

## v0.8.9: 오디오 재생 권한 제어 기반 구현 (2026-01-08)

### 1. Feature Gating Infrastructure

- **`components/DialogueAudioButton.tsx`**: `onPlayAttempt` 콜백 함수를 Props로 추가.
- **Asynchronous Permission Check**: 재생 버튼 클릭 시 `onPlayAttempt`가 존재하면 이를 실행하고, 결과(`boolean`)에 따라 재생 여부를 결정하도록 로직 고도화.
- **Future-Proof Design**: 이 구조를 통해 상세 페이지나 리스트 어디에서든 사용자 티어 체크, 포인트 차감, 또는 광고 시청 유도 로직을 유연하게 주입할 수 있게 됨.

## v0.8.8: 원어민 대화 듣기 기능 구현 (2026-01-08)

### 1. Audio Playback Component

- **`components/DialogueAudioButton.tsx`**: Lucide 아이콘(`Volume2`, `Pause`, `Loader2`)을 활용한 전용 오디오 재생 버튼 컴포넌트 구현.
- **Audio Synchronization**: 한 번에 하나의 오디오만 재생되도록 커스텀 이벤트(`AUDIO_PLAYBACK_START`) 기반의 전역 중지 로직 적용.
- **Visual Feedback**: 재생 중(`Pause` 아이콘), 로딩 중(`Spinner`), 정지 중(`Volume` 아이콘) 상태를 명확히 구분하여 제공.

### 2. Detailed Page Integration

- **`app/expressions/[id]/page.tsx`**: A/B 대화 버블 내부에 오디오 버튼을 통합.
- **Thematic Styling**: 화자별 배경색(회색/파란색)에 최적화된 아이콘 색상 및 호버 효과 적용 (`text-blue-200` 등).

### 3. Structural Improvements (Constants & Naming)

- **Constants Centralization**: 루트 레벨의 `constants/` 폴더를 신설하여 일반 상수(`index.ts`)와 이벤트 상수(`events.ts`)를 분리 관리.
- **Standardized Naming**: 브라우저 DOM 관례에 맞춰 이벤트 값은 소문자 `snake_case`로, 변수명은 `UPPER_SNAKE_CASE`로 정의하여 프로젝트 일관성 확보.

## v0.8.7: n8n 워크플로우 최적화 및 콘텐츠 품질 고도화 (2026-01-08)

### 1. Check Duplicate Node Optimization

- **Performance**: `Check Duplicate` 노드에 `Limit: 1` 설정을 추가하여 중복 여부 확인 시 첫 번째 매칭 결과만 반환하도록 최적화.
- **Stability**: `Always Output Data: On` 옵션을 활성화하여 데이터가 없는 경우에도 빈 객체를 출력하게 함으로써, 워크플로우가 예외 없이 정상적으로 흐르도록 개선.
- **Logic Sync**: `If New` 노드의 조건문을 데이터 존재 여부(`Check Duplicate`의 출력 데이터가 비어있는지)를 기준으로 판단하도록 동기화.

### 2. High-Quality Content Generation Standards

- **Dialogue Structure**: 대화문을 2~3턴(A-B 또는 A-B-A)으로 표준화. 학습자가 상황을 빠르게 이해할 수 있는 최적의 길이를 유지하고 TTS 생성 효율성 확보.
- **Currency & Numeric Formatting**:
  - 통화 표기를 USD(`$`)로 통일하여 데이터 일관성 부여.
  - 1,000 이상의 숫자에 쉼표(`,`)를 강제하여 가독성 상향 평준화.
- **Requirement Updates**: 위 규칙들을 `n8n/expressions/code/08_gemini_content_generator_prompt.txt` 및 워크플로우 템플릿에 명시적으로 반영.

### 3. Operator Safety & Troubleshooting

- **Groq Terms Notice**: `orpheus-v1-english` 모델 사용 시 Groq Console에서 약관 동의가 필수임을 문서(`optimization_steps.md`, `user_guide.md`)에 명시.
- **Error Handling Guide**: `model_terms_required`로 인한 400 에러 발생 시의 해결 방법을 트러블슈팅 섹션에 추가하여 운영 안정성 강화.

## v0.8.6: n8n 워크플로우 모듈화 및 확장성 강화 (2026-01-07)

### 1. Modular Code & Prompt Management

- **Structure**: n8n 워크플로우의 각 노드에 분산되어 있던 JavaScript 코드와 Gemini 프롬프트를 로컬 파일로 분리하여 `n8n/expressions/code/` 폴더에 저장.
- **File Naming**: 실행 순서에 따라 번호 접두사를 부여하여 가독성 확보 (예: `02_pick_category.js`, `04_gemini_expression_generator_prompt.txt`).
- **Benefits**: 외부 에디터 사용 가능, 버전 관리 용이성, 코드 재사용성 향상.

### 2. Documentation Reorganization

- **Categorization**: `docs/` 내의 평면적인 파일 구조를 `n8n/`, `monetization/`, `git/`, `database/`, `product/` 등 주제별 하위 폴더로 재편.
- **Scalability**: `docs/n8n/expressions/`와 같이 워크플로우별 전용 문서 폴더를 생성하여, 향후 `vocas` 등 새로운 기능 추가 시 문서 혼재를 방지.

### 3. Scalable Workflow Organization

- **Directory Relocation**: 기존 루트의 n8n 관련 파일들을 `n8n/expressions/` 하위로 이동.
- **Template Renaming**: `n8n_workflow_template.json`을 `expressions_workflow_template.json`으로 변경하여 향후 `vocas`, `images` 등 다른 도메인의 워크플로우가 추가될 때 충돌 없이 확장 가능한 구조 마련.

### 4. Template Sanitization & Security

- **Credential Cleanup**: 워크플로우 템플릿 내에 포함된 특정 Credential ID들을 `your-http-header-auth-id` 등과 같은 플레이스홀더로 교체하여 공용 저장소 커밋 시 보안 위험 원천 차단.

## v0.8.5: 라우트 중앙 관리 및 필터 누적 시스템 (2026-01-06)

### 1. Centralized Route Management

- **File**: `lib/routes.ts` 생성.
- **Implementation**: 앱 내 모든 경로(`ROUTES`)와 필터 기반 홈 경로 생성 함수(`getHomeWithFilters`)를 정의. 모든 컴포넌트에서 하드코딩된 경로를 제거하고 이 시스템을 사용하도록 리팩토링.

### 2. Additive Filtering UX

- **Logic**: `ExpressionCard.tsx`에서 카테고리/태그 클릭 시 `useSearchParams`를 통해 기존 필터 상태를 읽어와 조합.
- **Behavior**:
  - 카테고리 클릭: 기존 검색어/태그 유지 + 카테고리 변경.
  - 태그 클릭: 기존 카테고리 유지 + 태그 변경 (검색어는 초기화).
  - 결과적으로 사용자가 원하는 대로 필터를 겹쳐서 적용할 수 있는 강력한 탐색 기능 제공.

## v0.8.4: 카테고리 필터링 최적화 (2026-01-06)

### 1. Smart Category Toggling

- **Logic**: `FilterBar.tsx`의 카테고리 선택 핸들러(`handleCategoryClick`)를 고도화.
- **Toggling**: 특정 카테고리(예: `Business`)가 활성화된 상태에서 다시 클릭 시, `category` 파라미터를 제거하고 `all` 상태로 자동 전환.
- **Duplicate Prevention**: 현재 상태가 `all`인 경우, `all` 버튼 클릭 시 라우팅 동작을 중단(`return`)하여 불필요한 데이터 페칭 및 리렌더링 방지.

## v0.8.3: 네비게이션 상태 보존 및 스크롤 복원 (2026-01-06)

### 1. Multi-Cache Global State

- **Architecture**: `context/ExpressionContext.tsx`에서 필터별 상태를 저장하는 맵 구조(`cache`) 도입. 검색, 카테고리, 태그 검색 결과가 각각 독립적인 데이터와 스크롤 위치를 가짐.
- **Optimization**: `useCallback`, `useMemo`를 통한 컨텍스트 함수 메모이제이션 및 얕은 비교를 통한 불필요한 리렌더링 방지.

### 2. Real-time Scroll Tracking

- **Tracking**: `ExpressionList.tsx`에서 스크롤 리스너를 통해 현재 위치를 실시간으로 캐시에 기록 (200ms 디바운스 적용).
- **Data Integrity**: 스크롤 복원 중에는 저장 로직을 차단하여 캐시 오염을 방지. 데이터 변경(`items`) 시에도 스크롤 위치는 보존되도록 메서드 분리(`updateCacheData`).

### 3. Robust Scroll Restoration (Recursive RAF)

- **Recursive RAF**: `requestAnimationFrame`을 사용하여 브라우저 페인팅 주기에 맞춰 최대 60프레임 동안 반복적으로 스크롤 이동 시도. 레이아웃 안정화 지연에 완벽 대응.
- **Component Lifecycle Control**: `app/page.tsx`에서 필터별 `key` prop을 `ExpressionList`에 전달하여, 필터 변경 시 컴포넌트 강제 리마운트 및 깨끗한 상태 초기화 보장.

### 4. Navigation UX

- **`components/BackButton.tsx`**: `router.back()` 기반의 뒤로가기 구현. 히스토리가 없는 직접 진입 시에도 홈으로 안전하게 이동하는 Fallback 처리.

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

- **Mandatory Tags**: `docs/n8n/expressions/optimization_steps.md` 및 `n8n/n8n_workflow_template.json`의 Gemini 프롬프트에 `tags` 필드를 필수(MANDATORY)로 지정.
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

- **`docs/n8n/expressions/user_guide.md`**: 서비스의 핵심 기능 소개부터 n8n 워크플로우 운영 가이드까지 포함한 종합 사용자 가이드 작성.
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

- **Context Restoration**: `.agent/workflows/restore_context.md`를 업데이트하여 `features_list.md`, `database/schema.md` 등 핵심 문서를 추가 로드하도록 개선. 이를 통해 에이전트가 프로젝트의 기능과 데이터 구조를 더 정확히 이해하게 됨.

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
  - 단일 스키마(Scenario A)와 다중 스키마(Scenario B) 사용 예시를 문서화(`docs/database/supabase_strategy.md`).

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

- **`docs/n8n/expressions/workflow_guide.md`**: 워크플로우 Export/Import 가이드 추가.

## v0.4.1: n8n 데이터 지속성 설정 개선 (2025-12-31)

### 1. Docker Volume -> Bind Mount 변경

- **`docker-compose.yml`**: 데이터 초기화 문제 해결을 위해 n8n 데이터 저장 경로를 Docker Volume에서 로컬 디렉토리 바인딩(`user -> ./n8n_data:/home/node/.n8n`)으로 변경.
- **`.gitignore`**: 로컬 DB 파일이 커밋되지 않도록 `n8n_data/` 추가.

## v0.4.0: 자동화 파이프라인 구축 (2025-12-30)

### 1. n8n 로컬 환경 설정

- **`docker-compose.yml`**: n8n을 Docker로 실행하기 위한 설정 추가 (`localhost:5678`).
- **Persistence**: `n8n_data` 볼륨을 통해 워크플로우 저장 데이터 보존.

### 2. 워크플로우 템플릿 제공

- **`n8n/n8n_workflow_template.json`**: Schedule -> HTTP -> Gemini -> Supabase로 이어지는 핵심 파이프라인 템플릿 생성.
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

- **`docs/database/schema.md`**: Supabase `expressions` 테이블 스키마 정의 (UUID, 영어 표현, 뜻, 예문 등).
- **`docs/n8n/expressions/workflow_guide.md`**: n8n 자동화 로직 설계 (HTTP Request -> Gemini AI -> Supabase).
- **`docs/project_context.md`**: 프로젝트 규칙 및 아키텍처 정의.

### 3. 향후 계획 (Next Steps)

- Supabase 프로젝트 생성 및 테이블 실제 적용.
- Next.js에서 Supabase 클라이언트 연동 (`@supabase/ssr` 패키지 설치 예정).
- 메인 페이지 UI 구현 (카드 리스트 형태).
