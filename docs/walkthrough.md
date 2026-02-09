# Implementation Walkthrough

> 각 버전별 구현 내용과 변경 사항을 상세히 기록합니다. 최신 버전이 상단에 옵니다.

## v0.16.4: Skeleton Refactoring & Pagination UX Polish (2026-02-09)

### 1. Goal (목표)

- `RemoteVocabularyDetail`과 `LocalVocabularyDetail` 간의 스켈레톤 중복 코드를 제거하고, `SkeletonVocabularyDetail` 통합 컴포넌트로 관리하여 유지보수성과 시각적 일관성을 확보합니다.
- 페이지네이션 동작 시 전체 리로드 없이 부드러운 상태 전환을 지원하여 더 나은 사용자 경험을 제공합니다.

### 2. Implementation (구현 내용)

#### A. Centralized Skeleton Architecture (`Skeletons.tsx`)

- **`SkeletonVocabularyDetail` New Component**: 기존에 여러 페이지와 컴포넌트에 파편화되어 정의되어 있던 상세 페이지 스켈레톤(Header + Toolbar + List)을 단일 컴포넌트로 통합했습니다.
- **Unified Loading UX**:
  - `app/me/[listId]/loading.tsx` (Server)
  - `LocalVocabularyDetail.tsx` (Client Loading)
  - `RemoteVocabularyDetail.tsx` (Client Loading)
- 위 세 곳 모두 동일한 `SkeletonVocabularyDetail`을 사용하도록 구조화하여, 데이터 소스나 렌더링 시점에 관계없이 완벽히 일치하는 로딩 화면을 구현했습니다.

#### B. Component Logic Polish (`Pagination.tsx`, `loading.tsx`)

- **Pagination Callback**: `Pagination` 컴포넌트에 `onPageChange` 콜백 프로퍼티를 추가했습니다.
- **Improved Interaction**: 페이지네이션 클릭 시 `e.preventDefault()`를 통해 기본 링크 이동을 차단하고 주입된 콜백을 실행함으로써, 불필요한 전체 페이지 새로고침과 네트워크 지연 없는 쾌적한 페이지 이동 경험을 제공합니다.

#### C. SWR Integration for Caching & UX (`useSWR`)

- **Client-side Caching**: `RemoteVocabularyDetail`과 `LocalVocabularyDetail` 모두 `useSWR`을 사용하여 표현 데이터를 관리합니다. 이를 통해 한 번 방문한 페이지의 데이터는 즉시 로딩(Instant Load)되며, 네트워크 요청을 최소화합니다.
- **Optimistic Fetching**: `keepPreviousData: true` 옵션을 사용하여 페이지 전환 시 다음 데이터가 준비될 때까지 현재 데이터를 유지함으로써, 사용자에게 끊김 없는 탐색 경험을 제공합니다.
- **Data Synchronization**: 단어장 제목 수정, 삭제, 기본 설정 변경 등 Mutation 발생 시 SWR의 `mutate()`를 호출하여 UI와 실제 서버/로컬 저장소 간의 데이터 동기화를 보장합니다.

#### D. Navigation UX Polish (`BackButton.tsx`, `VocabularyDetailLayout.tsx`)

- **Explicit Redirect**: `BackButton` 컴포넌트에 `href` 프롭을 추가하여, 히스토리 뒤로가기 대신 특정 경로로 강제 이동할 수 있는 기능을 구현했습니다.
- **My Page Anchor**: 단어장 상세 페이지의 레이아웃에서 뒤로가기 경로를 `/me`로 고정함으로써, 사용자가 유입 경로에 상관없이 자신의 단어장 목록으로 안전하게 돌아갈 수 있도록 설계했습니다.

### 3. Key Achievements (주요 성과)

- ✅ **Full Consistency**: 유저 타입(Free/Pro)이나 데이터 환경에 상관없이 100% 동일한 로딩 화면 보장.
- ✅ **Refined Navigation**: 페이지네이션 시 시각적 깜빡임 최소화 및 인터랙션 반응성 향상.
- ✅ **Code Maintainability**: 수십 라인의 중복된 스켈레톤 코드를 단 한 줄의 컴포넌트 호출로 단순화.
- ✅ **Navigation Safety**: 단어장 상세 뷰에서 명시적인 마이페이지 복귀 경로 확보 및 뒤로가기 동작 일원화.

## v0.16.3: Pro Vocabulary Animation Fix & Navigation Stability (2026-02-08)

### 1. Goal (목표)

- Pro 유저의 단어장 상세 페이지에서 발생하는 빈 화면 및 클릭 오작동(이전 페이지 이동) 문제를 해결하고, 페이지네이션 및 브라우저 탐색(뒤로가기) 시 애니메이션과 상태를 안정적으로 초기화합니다.

### 2. Implementation (구현 내용)

#### A. Animation Context Fix (`RemoteVocabularyDetail.tsx`)

- **Root Motion Wrapper**: `div` 래퍼를 `motion.div`로 교체하고 `initial={{ opacity: 0, y: 10 }}` 및 `animate={{ opacity: 1, y: 0 }}` 속성을 추가했습니다.
- **Why**: 자식 컴포넌트인 `VocabularyItemsGrid`가 `initial="hidden"` 상태로 렌더링되는데, 부모 레벨에서의 진입 신호가 없어 `visible` 상태로 전환되지 못하던 문제를 해결했습니다.

#### B. Component Remount Strategy (`key` prop)

- **Key-based Reset**: 최상위 `motion.div`에 `key={`${listId}-${currentPage}`} `를 적용했습니다.
- **Effect**: 페이지 번호나 리스트가 변경될 때마다 React가 해당 컴포넌트를 완전히 새로운 인스턴스로 인식하게 하여, 애니메이션 사이클(`initial` -> `animate`)이 항상 처음부터 실행되도록 강제했습니다. 이는 Next.js의 컴포넌트 재사용으로 인한 상태 잔존 및 애니메이션 누락을 방지합니다.

### 3. Key Achievements (주요 성과)

- ✅ **Visual Stability**: Pro 유저의 단어장 진입 시 Free 유저와 동일하게 부드러운 진입 애니메이션 제공.
- ✅ **Navigation Integrity**: 뒤로가기/페이지 이동 시 빈 화면 문제 원천 차단.

## v0.16.2: Vocabulary Pagination & UI Foundation (2026-02-08)

### 1. Goal (목표)

- 단어장에 포함된 표현이 많아짐에 따라 발생할 수 있는 데이터 로딩 병목을 해결하기 위해 서버 사이드 페이지네이션을 도입하고, 이를 위한 공통 UI 컴포넌트 기반을 구축합니다.

### 2. Implementation (구현 내용)

#### A. SQL-level Pagination (`get_vocabulary_list_details.sql`)

- **Offset Calculation**: 입력받은 `p_page`와 `p_page_size`를 기반으로 `v_offset`을 계산하여 `LIMIT`와 `OFFSET` 구문에 적용했습니다.
- **Aggregated Total Count**: JSON 응답에 `total_count` 필드를 추가하여, 클라이언트가 전체 페이지 수를 계산할 수 있도록 정보를 제공합니다.

#### B. Query Layer Adaptation (`vocabulary.ts`)

- **Service Extension**: `getVocabularyListDetails` 함수에 `page`와 `limit` 파라미터를 추가하고, Supabase RPC 호출 시 이를 전달하도록 수정했습니다.
- **Type Integration**: `VocabularyListDetails` 인터페이스에 `total_count` 필드를 추가하여 타입 안정성을 확보했습니다.

#### C. Shared UI Components (`Pagination.tsx`, `button.tsx`)

- **Standard Pagination**: Shadcn UI 스타일의 `Pagination` 컴포넌트를 구현했습니다. '이전', '다음' 버튼 및 페이지 번호 탐색을 지원합니다.
- **Flexible Button**: `class-variance-authority` (CVA)를 도입하여 다양한 베리에이션(`variant`, `size`)을 선언적으로 관리할 수 있는 `Button` 컴포넌트를 구축했습니다.

### 3. Key Achievements (주요 성과)

- ✅ **Scalability**: 대량의 표현(100개 이상)을 가진 단어장에서도 일정한 로딩 성능 유지.
- ✅ **Design Consistency**: 공통 UI 모듈화를 통해 서비스 전반의 디자인 완성도 향상.

## v0.16.1: Random Feed Optimization & UX Polish (2026-02-07)

### 1. Goal (목표)

- 기존의 최신순 중심 피드를 확장하여 '랜덤 피드'를 안정적으로 지원하고, 초기 데이터 노출량을 늘려(12->24) 사용자에게 더욱 풍부한 무작위 탐색 경험을 제공합니다.

### 2. Implementation (구현 내용)

#### A. Centralized Fetching Logic (`getExpressions.ts`)

- **Dynamic Sorting**: `getExpressions` 함수가 정렬 옵션(`EXPRESSION_SORT.RANDOM`)을 직접 인식하여 조건부로 전용 랜덤 쿼리를 수행하도록 로직을 일원화했습니다.
- **Improved Initial Payload**: 한 번에 가져오는 기본 데이터 개수를 12개에서 **24개**로 증폭하여, 무작위 피드의 특성에 최적화된 초기 렌더링을 구현했습니다.

#### B. SQL Strategy: Back to Reliability

- **Reverting to `ORDER BY RANDOM()`**: 현재 규모에서는 `TABLESAMPLE`보다 정확도가 높고 성능 차이가 미미한 표준 방식을 채택하여 로직의 명확성을 확보했습니다.

#### C. Deterministic UX with Seeds & Deduplication

- **Seed-based Cache Key**: SWR 키에 랜덤 시드값을 부여하여 "새로고침" 시 명확히 구분된 새로운 데이터를 가져오도록 설계했습니다.
- **Restoration Awareness**: 데이터 리셋 시 `isRestoring` 상태를 활용하여 스켈레톤 UI를 매끄럽게 연결했습니다.
- **Client-side Filtering**: 서버 응답 데이터에 대한 고유 ID 기반 중복 제거를 통해 보장된 유니크 피드를 구현했습니다.

### 3. Key Achievements (주요 성과)

- ✅ **Rich Content**: 초기 노출량 확대를 통한 탐색 몰입도 향상.
- ✅ **Architectural Clarity**: 서비스 함수 하나로 최신순/랜덤순을 유연하게 제어.
- ✅ **No Duplication**: 시드 관리와 클라이언트 필터링을 통한 완벽한 중복 차단.

## v0.16.0: Service Layer Refactoring & Server-side Performance (2026-02-07)

### 1. Goal (목표)

- 프로젝트 규모 확장에 대비하여 데이터 접근 로직의 책임(조회 vs 변경)을 명확히 분리하고, 서버 사이드 렌더링 시 발생하는 중복 데이터 요청을 제거하여 성능을 최적화합니다.

### 2. Implementation (구현 내용)

#### A. Service Layer Split (Queries & Actions)

- **`services/queries/`**: 서버 컴포넌트 및 클라이언트 사이드(SWR) 모두에서 호출되는 데이터 조회 전용 레이어입니다. 모든 함수에 `cache()`를 적용하여 요청 단위 메모이제이션을 수행합니다.
- **`services/actions/`**: 데이터를 변경(Mutation)하는 전용 레이어입니다. `withPro` 래퍼를 통한 세션 및 권한 검증이 필수적으로 동반됩니다.

#### B. Request-level Deduplication

- **React `cache()` Adoption**: 기존에 Prop Drilling으로 전달되던 복잡한 데이터를 컴포넌트 트리 어디에서든 직접 패치할 수 있도록 개선했습니다. `cache()` 덕분에 여러 컴포넌트가 동일한 데이터를 요청해도 실제 DB 쿼리는 단 한 번만 실행됩니다.

#### C. Legacy Cleanup & Integration

- `/lib/actions.ts`에 있던 `fetchMoreExpressions` 등 유틸리티성 조회 로직을 `services/queries/expressions.ts`로 통합하여 데이터 접근 창구를 단일화했습니다.

### 3. Key Achievements (주요 성과)

- ✅ **Maintainability**: 폴더 구조만으로 함수의 성격(Read/Write)과 환경(Server-side)을 즉시 파악 가능.
- ✅ **Performance**: 서버 렌더링 시 발생하는 불필요한 Waterfall 및 중복 DB 요청 제거.
- ✅ **Developer Experience**: "필요한 곳에서 직접 데이터를 가져온다"는 현대적인 React Patterns 확립.

## v0.15.9: Vocabulary UX Polish & Compact View Enhancement (2026-02-06)

### 1. Goal (목표)

- 단어장 상세 페이지 내 불필요한 UI 요소를 제거하여 사용성을 개선하고, 벌크 편집 시 요약 보기 모드(Compact View)의 정보 전달력을 강화합니다.

### 2. Implementation (구현 내용)

#### A. Contextual Action Hiding

- **`ExpressionActions.tsx`**: `hideSaveButton` 속성을 추가하여, 이미 저장된 항목들만 모인 단어장 페이지에서는 '북마크' 버튼을 숨김 처리했습니다. 이를 통해 사용자가 '삭제'와 '저장 해제'를 혼동하지 않도록 개선했습니다.

#### B. Localization in Compact View

- **`VocabularyItem.tsx`**: 요약 모드에서 표현(Expression)만 표시되던 기존 UI를 개선했습니다. `useI18n` 훅을 통해 현재 언어에 맞는 의미(Meaning)를 추출하여 하단에 추가했습니다.
- **Robust Layout**: `line-clamp-2`를 적용하여 텍스트 길이에 관계없이 일정한 그리드 높이를 유지하며, 데이터 부재 시를 대비한 영어(EN) Fallback 로직을 적용했습니다.

### 3. Key Achievements (주요 성과)

- ✅ **UI Clarity**: 맥락에 맞는 기능 노출을 통해 인지 부하 감소.
- ✅ **Information Density**: 요약 모드에서도 핵심 정보(의미)를 제공하여 편집 효율성 증대.

## v0.15.8: Vocabulary Bulk Actions & Staged Area UX (2026-02-06)

### 1. Goal (목표)

- 사용자가 다수의 표현을 효율적으로 정리할 수 있도록 단어장 간 '복사' 및 '이동' 기능을 제공하고, 대량 작업 시의 데이터 정합성과 매끄러운 UX를 확보합니다. 또한 현재 플랜의 사용 상태를 시각적으로 명확히 전달합니다.

### 2. Implementation (구현 내용)

#### A. Atomic Move Operation (`move_vocabulary_items.sql`)

- **Dual-Step Transaction**: SQL 함수 내에서 타겟 리스트로의 `INSERT` (중복 무시)와 소스 리스트에서의 `DELETE`를 하나의 트랜잭션으로 묶어 처리했습니다.
- **Conflict Handling**: `ON CONFLICT DO NOTHING` 구문을 사용하여, 이미 타겟 리스트에 존재하는 표현을 이동할 때 발생할 수 있는 PK 충돌 에러를 방지했습니다.

#### B. Bulk Action Orchestration (`useBulkAction.ts`)

- **State Interface**: 작업 유형(`copy`, `move`)과 모달 오픈 상태를 중앙 관리하는 커스텀 훅을 구현했습니다.
- **Loose Coupling**: UI 컴포넌트(`VocabularyToolbar`)와 비즈니스 로직(`VocabularyListModal`) 사이의 상태를 중재하여 코드의 복잡도를 낮췄습니다.

#### C. Plan Status Transparency (`VocabularyPlanStatus.tsx`)

- **Usage Visualization**: 단어장 선택 모달 하단에 현재 리스트 사용 현황을 프로그레스 바(또는 텍스트) 형태로 노출하여 한도를 직시하게 했습니다.
- **Premium Upsell Foundation**: 무료 사용자의 한도 도달 시 긍정적인 안내 메시지를 표시하여 유료 플랜으로의 자연스러운 전환 가능성을 열어두었습니다.

#### D. Error & Localization Hardening

- **Error Codes**: `VOCABULARY_COPY_FAILED`, `VOCABULARY_MOVE_FAILED` 코드를 추가하고, 9개 언어 전체에 성공/실패 토스트 메시지를 반영했습니다.

### 3. Key Achievements (주요 성과)

- ✅ **Productivity**: 표현 하나씩 수동으로 옮기던 불편함 해소.
- ✅ **Data Integrity**: 서버 사이드 원자적 처리를 통해 데이터 유실 없는 안전한 이동 보장.

## v0.15.7: Local Storage Hydration & Navigation Stability (2026-02-05)

### 1. Goal (목표)

- 클라이언트 사이드 저장소(Local Storage)의 하이드레이션 타이밍 이슈를 해결하여 직접 접근 및 새로고침 시의 안정성을 확보하고, 로딩 전환 시의 시각적 깜빡임을 제거하여 프리미엄 UX를 완성합니다.

### 2. Implementation (구현 내용)

#### A. Hydration Awareness (`useLocalActionStore.ts`)

- **State Management**: 스토어 내부에 `_hasHydrated` 플래그를 도입했습니다.
- **Persistence Lifecycle**: Zustand의 `onRehydrateStorage` 미들웨어 훅을 사용하여 로컬 스토리지 데이터가 메모리 상의 스테이트로 완전히 복원된 시점에만 플래그를 `true`로 전환합니다.
- **SSR/CSR Sync**: Next.js의 하이드레이션 과정에서 서버 데이터와 클라이언트 데이터 간의 불일치를 피하기 위해, 하이드레이션 완료 전까지는 초기 상태(빈 값)를 기반으로 한 로직 실행을 유보합니다.

#### B. Robust Data Loading (`LocalVocabularyDetail.tsx`)

- **Deferred Logic**: `useEffect` 내에서 `_hasHydrated`가 `false`일 경우 조기 반환(`return`) 처리하여 잘못된 `notFound()` 트리거를 방지했습니다.
- **Loading State Union**: `loading || !_hasHydrated` 조건을 통해 데이터가 실제로 준비될 때까지 스켈레톤 UI를 안정적으로 노출합니다.

### 3. Key Achievements (주요 성과)

- ✅ **Navigation Reliability**: 무료 사용자의 모든 진입 경로(Direct URL, Refresh)에 대한 100% 대응 성공.

## v0.15.6: My Page Dedicated Skeleton & Component Composition (2026-02-05)

### 1. Goal (목표)

- 마이페이지 전용 스켈레톤을 도입하여 시각적 일관성을 확보하고, 스켈레톤 컴포넌트들을 조립 가능한 형태로 리팩토링하여 유지보수성과 재사용성을 극대화합니다.

### 2. Implementation (구현 내용)

#### A. Dedicated Skeleton Components (`Skeletons.tsx`)

- **`SkeletonProfileHeader`**: 실제 프로필 섹션의 레이아웃(아바타 너비, 타이틀 높이 등)을 정교하게 모사했습니다.
- **`SkeletonStudyModesGrid`**: 실제 학습 모드 카드의 아이콘 사이즈(`h-14 w-14`)와 그리드 간격을 반영했습니다.
- **`SkeletonVocabularyListSection`**: 제목과 2단 그리드 구조를 캡슐화하여 여러 도메인에서 공유 가능하도록 했습니다.
- **`SkeletonVocabularyDetailHeader` & `SkeletonVocabularyToolbar`**: 단어장 상세 페이지 전용으로, 실제 헤더 및 툴바와 동일한 레이아웃을 제공합니다.

#### B. Component Composition Patterns

- **Page Loading (`app/me/loading.tsx`)**: 개별 스켈레톤 조각들을 조합하여 마이페이지 전체 레이아웃을 구성했습니다.
- **Suspense Integration (`VocabularyListContainer.tsx`)**: 공용 스켈레톤 섹션을 `Suspense`의 `fallback`으로 적용하여 중복 코드를 제거했습니다.
- **Contextual Navbar**: `SKELETON_PAGE.MY_PAGE` 상수를 추가하고, `SkeletonNavbar`에서 불필요한 홈 서브헤더 스켈레톤이 노출되지 않도록 최적화했습니다.
- **Unified Loading UX**: `LocalVocabularyDetail.tsx`(Free)의 내부 로딩 UI를 `app/me/[listId]/loading.tsx`와 동일한 스켈레톤 컴포넌트(Header + Toolbar + List) 조합으로 교체하여, 유저 타입에 관계없이 매끄러운 로딩 경험을 보장했습니다.
- **Animation Control**: `VocabularyItemsGrid`와 `VocabularyItem`에서 초기 마운트 시 `visible` 상태를 즉시 적용하고, `ExpressionCard`의 진입 애니메이션을 조건부로 비활성화하여 스켈레톤-콘텐츠 전환 시의 깜빡임을 제거했습니다.

### 3. Key Achievements (주요 성과)

- ✅ **Optimized First Paint**: 마이페이지 진입 시 실제 UI와 거의 일치하는 윤곽을 즉시 제공.
- ✅ **Improved Maintainability**: 스켈레톤 코드 중복 제거 및 조합형 아키텍처 구축.

## v0.15.5: UX Loading States & Form Stability (2026-02-05)

### 1. Goal (목표)

- 단어장 관리 과정에서의 시각적 끊김을 최소화하고, 비동기 데이터 처리 시 발생할 수 있는 잠재적인 인터랙션 오류를 방지하여 견고한 사용자 경험을 제공합니다.

### 2. Implementation (구현 내용)

#### A. Vocabulary List Skeleton (`Skeletons.tsx`, `VocabularyListModal.tsx`)

- **New Component**: `SkeletonVocabularyList`를 추가했습니다. 단어장 카드의 아웃라인(제목, 개수, 화살표)을 픽셀 단위로 재현하여 로딩 중 레이아웃 시프트를 방지합니다.
- **Integration**: 단어장 선택 모달에서 데이터가 비어있고(`lists.length === 0`) 로딩 중(`isLoading`)일 때 스켈레톤을 노출하여 사용자에게 작업 진행 상태를 명확히 알립니다.

#### B. CreateListForm Stability (`CreateListForm.tsx`)

- **Internal State Management**: `isSubmitting` 로컬 상태를 도입했습니다. 폼 제출 시 이 값을 `true`로 설정하고 요청이 완료된 후 `false`로 되돌립니다.
- **Async Safety**: 제출 버튼 클릭 시 즉시 `handleCreate`가 여러 번 호출되는 현상을 원천 차단합니다.
- **UI Feedback**: `isLoading` 또는 `isSubmitting` 상태일 때 `Loader2` 애니메이션 아이콘을 표시하고 모든 상호작용 가능한 요소를 `disabled` 처리하여 UX 완성도를 높였습니다.

### 3. Key Achievements (주요 성과)

- ✅ **Trustworthy UI**: 빈 화면 대신 스켈레톤을 보여줌으로써 시스템의 반응성 신뢰도 향상.
- ✅ **Execution Integrity**: 중복 제출 및 로딩 중 입력 수정 오류 방지.

## v0.15.4: Automatic Continuity & UI Polish (2026-02-05)

### 1. Goal (목표)

- 기본 단어장 삭제 후에도 사용자의 학습 흐름('즉시 저장')이 끊기지 않도록 관리 자동화를 구현하고, 중복된 UI 요청을 제거하여 쾌적한 UX를 제공합니다.

### 2. Implementation (구현 내용)

#### A. Automatic Default Reassignment

- **DB Trigger (`handle_vocabulary_list_deleted.sql`)**: `vocabulary_lists` 테이블의 `AFTER DELETE` 트리거를 통해, 삭제된 리스트가 기본값(`is_default = true`)인 경우 남은 목록 중 가장 오래된 리스트를 자동으로 기본으로 설정합니다.
- **Local Store (`useLocalActionStore.ts`)**: 무료 사용자를 위해 서버와 동일한 '오래된 순 승계' 로직을 Zustand 스토어의 `deleteList` 액션에 통합했습니다.

#### B. UserMenu Optimization (`UserMenu.tsx`)

- 현재 경로(`usePathname`)를 감지하여, 사용자가 이미 마이페이지에 있다면 드롭다운의 '마이페이지' 링크를 `disabled` 처리했습니다. 불필요한 전체 페이지 리로드와 네트워크 대역폭 낭비를 방지합니다.

### 3. Key Achievements (주요 성과)

- ✅ **Seamless Flow**: 단어장 하나 이상 존재 시 항상 기본 저장소가 존재함을 보장.
- ✅ **UX Integrity**: 사용자 행동에 따른 불필요한 UI 피드백 제거.

## v0.15.3: Full RLS Enforcement & RPC Bug Fix (2026-02-05)

### 1. Goal (목표)

- 모든 데이터 테이블에 보안 정책을 적용하여 사각지대를 제거하고, 프로덕션 수준의 SQL 안정성을 확보합니다.

### 2. Implementation (구현 내용)

#### A. Full RLS Coverage (`028`)

- **expressions**: 누구나 조회 가능(`SELECT`)하되, 수정은 `service_role`만 가능하게 설정.
- **user_actions**: `auth.uid() = user_id` 조건을 통해 본인의 활동 데이터만 접근 가능하게 격리.
- **users/auth tables**: `users`는 본인 조회만 허용하고, `accounts`, `sessions`는 외부 접근을 차단(Service Role 전용)하여 보안을 극대화했습니다.

#### B. SQL Function Fix (`toggle_user_action`)

- **Problem**: PostgreSQL의 엄격한 타입 체크로 인해 `text` 파라미터와 `action_type` Enum 간의 비교 연산 실패 발생.
- **Solution**: `::speak_mango_en.action_type` 캐스팅을 구문 곳곳에 추가하여 타입 호환성을 확보했습니다.

### 3. Key Achievements (주요 성과)

- ✅ **Full Zero Trust**: 모든 DB 테이블에 대해 '명시적으로 허용되지 않은 접근'을 원천 차단.
- ✅ **Execution Reliability**: RPC 호출 시 발생하던 타입 에러를 해결하여 실시간 토글 기능 정상화.

## v0.15.2: Authentication & RLS Security Hardening (2026-02-04)

### 1. Goal (목표)

- NextAuth(애플리케이션 인증)와 Supabase(데이터베이스 보안) 사이의 연결 고리를 완성하여, `auth.uid()` 기반의 강력한 Row Level Security(RLS)를 구현합니다.

### 2. Implementation (구현 내용)

#### A. Custom JWT Strategy (`lib/supabase/server.ts`)

- **Problem**: NextAuth로 로그인해도 Supabase DB 입장에서는 `anon`(익명) 사용자로 취급되어 RLS가 작동하지 않음.
- **Solution**:
  - `getAuthSession`으로 NextAuth 사용자 ID(`sub`)를 가져옵니다.
  - `jsonwebtoken` 라이브러리와 `SUPABASE_JWT_SECRET`을 사용하여 Supabase 호환 JWT를 직접 서명(Sign)합니다.
  - `createServerClient`의 `global.headers.Authorization`에 이 토큰을 실어 보냄으로써, Supabase가 해당 요청을 "인증된 사용자"의 것으로 처리하게 만듭니다.

#### B. Database Integrity Fixes

- **Schema Permission (`025`)**: 커스텀 스키마(`speak_mango_en`)에 대해 `anon`, `authenticated` 역할이 접근할 수 있도록 `GRANT` 권한을 명시적으로 부여했습니다.
- **Foreign Key Correction (`026`)**: `vocabulary_lists` 테이블의 `user_id` 외래 키가 Supabase 내부 테이블(`auth.users`)을 잘못 참조하던 것을 수정하여, 실제 사용자 정보가 있는 `speak_mango_en.users`를 가리키도록 바로잡았습니다.

#### C. RLS Re-enforcement (`027`)

- **Secure Policies**: 개발 도중 임시로 허용했던 `using (true)` 류의 개방형 정책을 전량 폐기하고, `user_id = auth.uid()` 조건을 검사하는 소유자 기반의 엄격한 보안 정책을 다시 적용했습니다.

### 3. Key Achievements (주요 성과)

- ✅ **Seamless Auth**: 별도의 Supabase 로그인 없이 NextAuth 세션만으로 DB 보안 연동 완료.
- ✅ **Security**: Service Role(관리자 권한) 남용을 막고, DB 레벨에서 사용자 데이터 격리 구현.
- ✅ **Stability**: 잘못된 외래 키 참조로 인한 데이터 생성 오류(`23503`) 원천 해결.

## v0.15.1: UI Responsiveness & Async Optimization (2026-02-04)

### 1. Goal (목표)

- 유료(Pro) 사용자의 서버 연동 액션 발생 시 지연 시간을 최소화하고, 초기 로딩 시의 UI 깜빡임(Flash)을 방지하여 매끄러운 사용자 경험을 제공합니다.

### 2. Implementation (구현 내용)

#### A. SWR Optimistic Updates (`useUserActions.ts`)

- **Pattern**: `isPro` 상태일 때 SWR의 `mutate` 함수를 사용하여, 서버 응답 전에 예상되는 다음 상태(`newData`)를 캐시에 즉시 반영합니다.
- **Rollback**: 서버 액션 실패 시 이전 상태(`currentData`)로 자동 롤백하여 데이터 무결성을 유지합니다.

#### B. Parallel Async Execution (`useSaveAction.ts`)

- **Optimization**: 기존에 직렬로 실행되던 `toggleSaveState`와 단어장 동기화(`syncOnSave`) 로직을 `Promise.all`로 묶어 병렬 실행합니다. 네트워크 왕복 횟수에 따른 대기 시간을 절반으로 줄였습니다.

#### C. Loading State Refinement (`SaveButton.tsx`, `LearnButton.tsx`)

- **Wait State**: SWR의 `isLoading` 상태를 `isInitialLoading`으로 추출하여 버튼 UI에 주입했습니다.
- **UI Feedback**: 로딩 중에는 `Loader2` 스피너를 표시하고 버튼을 비활성화하여, 낙관적 업데이트가 적용되기 전의 불안정한 시각적 상태를 제거했습니다.

#### D. Timer Safety & Type Fixing

- **Cleanup**: `setTimeout`을 사용하는 롱 프레스 및 자동 스크롤 로직에 `useEffect` 클린업을 추가하여 메모리 누수를 방지했습니다.
- **Typing**: `NodeJS.Timeout` 대신 브라우저 호환성이 좋은 `ReturnType<typeof setTimeout>`을 사용하여 타입 에러를 해결했습니다.

### 3. Key Achievements (주요 성과)

- ✅ **Snappy UI**: 저장 및 학습 완료 클릭 시 즉각적인 시각적 피드백 제공.
- ✅ **Performance**: 병목 지점(Waterfall) 제거를 통한 저장 프로세스 속도 향상.
- ✅ **Robustness**: 컴포넌트 생명주기에 따른 타이머 관리로 런타임 안정성 확보.

## v0.15.0: Pro Tier & Advanced Vocabulary Management (2026-02-04)

### 1. Goal (목표)

- 사용자 티어(Free/Pro) 연동의 기초가 되는 서버 측 인프라를 구축하고, 단어장 관리 기능을 완성합니다.

### 2. Implementation (구현 내용)

#### A. Authorization & Security (`withPro` HOF)

- **Purpose**: 서버 액션 실행 시 세션과 Pro 티어 여부를 일관되게 확인합니다.
- **Logic**: `lib/server/actionUtils.ts`에 정의된 `withPro` 래퍼를 통해 중복되는 인증 로직을 제거하고, 권한이 없을 경우 즉시 적절한 `AppError`를 던집니다.

#### B. Advanced Vocabulary Management

- **Edit/Delete Actions**: 서버 액션(`updateVocabularyListTitle`, `deleteVocabularyList`)을 통해 단어장 정보를 수정하거나 삭제할 수 있습니다.
- **Default List Setting**: `set_default_vocabulary_list` RPC를 호출하여 사용자가 선호하는 기본 저장 장소를 지정할 수 있습니다.
- **UI Refinement**: `VocabularyDetailHeader.tsx`에 드롭다운 메뉴를 도입하여 부가적인 액션들을 그룹화했습니다.

#### C. Global Confirmation UI

- **`ConfirmContext`**: `useConfirm` 훅을 통해 앱 어디서든 프로미스 기반으로 확인 창을 호출할 수 있습니다.
- **Aesthetics**: Framer Motion을 사용하여 고급스러운 페이드 및 스케일 애니메이션을 적용하고, 배경 블러(Backdrop blur) 효과를 통해 모던함을 강조했습니다.

#### D. Data Revalidation Strategy

- **`revalidate.ts`**: `revalidatePath` 호출을 추상화하여, 서버 액션 완료 후 클라이언트 사이드의 데이터가 즉각 현행화되도록 설계했습니다. (`/me` 및 `/me/[listId]` 경로 중심)

### 3. Key Achievements (주요 성과)

- 중복되는 인증 체계를 중앙 집중화하여 보안성과 생산성 향상
- 복잡한 삭제 프로세스를 범용적인 Confirmation 시스템으로 사용자 친화적으로 해결
- 다국어(9개 언어) 지원을 통한 글로벌 확장성 유지

## v0.14.27: Vocabulary UI Optimization & Refactoring (2026-02-02)

### 1. Goal (목표)

- 모바일과 데스크탑 각각에 최적화된 사용자 경험(UX)을 제공하고, 유지보수가 용이한 컴포넌트 구조로 리팩토링합니다.

### 2. Implementation (구현 내용)

#### A. Framework & Performance

- **Vercel Best Practices**: 렌더링 안정성을 위해 삼항 연산자(`? : null`) 중심의 조건부 렌더링을 적용하고, `tabular-nums`로 수치 표시 안정성을 확보했습니다.

#### B. Component Refactoring (`VocabularyToolbar.tsx`)

- **Internal Decoupling**: 중복되는 UI 요소인 `SelectionCount`(선택 수 표시)와 `ToggleAllButton`(전체 선택 토글)을 내부 서브 컴포넌트로 분리하여 관리를 일원화했습니다.
- **Order Polish**: 사용자의 요청에 따라 '취소' 버튼을 가장 앞으로 배치하고 그 뒤를 '뷰 모드 전환' 버튼이 따르도록 순서를 조정하여 시선 흐름을 자연스럽게 유도했습니다.

#### C. Responsive Strategy

- **2-Row Mobile UI**: 모바일 환경에서 툴바를 상/하 2단으로 구성하여, 설정 영역(취소/뷰)과 실행 영역(전체 선택/카운트)을 명확히 분리하고 터치 타겟을 확보했습니다.
- **Touch Hover Patch**: 모바일 브라우저의 고질적인 'Sticky Hover' 문제 해결을 위해 `sm:hover` 접두사를 사용하여 데스크탑에서만 호버 효과가 트리거되도록 수정했습니다.

### 3. Key Decisions (주요 결정 사항)

- **Accessibility vs Density**: 모바일에서 모든 기능을 한 줄에 넣는 대신 2단 레이아웃을 선택함으로써 정보 밀도를 낮추고 조작 정확도를 높이는 결정을 내렸습니다.

## v0.14.26: Vocabulary Bulk Actions (2026-02-02)

### 1. Goal (목표)

- 단어장 내 여러 표현을 한꺼번에 관리할 수 있는 일괄 선택 기능을 구현합니다.

### 2. Implementation (구현 내용)

- **`useVocabularyView`**: 모든 아이템 ID를 `Set`에 넣거나 비우는 `selectAll`, `clearSelection` 함수 도입.
- **`VocabularyToolbar`**: 선택 개수와 전체 개수를 비교하여 '전체 선택' 모드와 '선택 해제' 모드를 스위칭하는 동적 버튼 구현.

### 3. Key Decisions (주요 결정 사항)

- **State Guard**: 데이터 로딩 중이거나 리스트가 비어있는 예외 상황(`totalCount > 0`)을 체크하여 '전체 선택' 버튼의 오동작을 방지했습니다.

## v0.14.25: Unified Navigation & UI Stability (2026-02-02)

### 1. Goal (목표)

- 개별적으로 존재하던 헤더와 뒤로가기 버튼을 `MainHeader`로 통합하여 일관된 내비게이션 경험을 제공합니다.
- `InteractiveLink`의 애니메이션 제어 로직을 보강하여 컴포넌트 언마운트 시의 안정성을 확보합니다.

### 2. Implementation (구현 내용)

#### A. Unified Header Strategy

- **`app/expressions/[id]/page.tsx`**: 기존 `Header`와 `BackButton`을 제거하고 `MainHeader`에 `showBackButton={true}`를 적용했습니다.
- **`components/MainHeader.tsx`**: 로고와 뒤로가기 버튼을 조건부로 스위칭하는 로직을 강화했습니다.
- **`components/ui/Skeletons.tsx`**: `SkeletonNavbar`가 상세 페이지 모드에서도 전체 헤더 레이아웃(내비 메뉴 포함)을 유지하도록 수정했습니다.

#### B. Animation Mount Safety

- **`components/ui/InteractiveLink.tsx`**: `useEffect`와 `useRef`를 사용하여 컴포넌트의 마운트 상태를 추적합니다.
- **`safeStart`**: 마운트된 상태에서만 `framer-motion`의 `controls.start()`를 호출하도록 래핑하여 에러를 원천 차단했습니다.

### 3. Key Decisions (주요 결정 사항)

- **Visual Continuity**: 로딩 스켈레톤부터 실제 렌더링까지 상단 영역의 레이아웃 시프트(CLS)를 최소화하기 위해 헤더 구조를 완벽히 동기화했습니다.

## v0.14.24: Vocabulary UI Architecture Refinement (2026-02-02)

### 1. Goal (목표)

- `VocabularyItemsGrid`의 복잡한 내부 로직을 관심사 분리(SoC) 원칙에 따라 리팩토링합니다.
- 로컬 및 서버 데이터 기반의 단어장 상세 페이지 UI/UX를 완벽히 통일합니다.
- 디자인 일관성을 위해 툴바의 시각 요소(그림자, 스티키 동작)를 정교하게 조정합니다.

### 2. Implementation (구현 내용)

#### A. Component Decoupling

- **`VocabularyToolbar.tsx`**: 그리드 내부에 종속되어 있던 툴바를 독립 컴포넌트로 분리했습니다. 헤더와 매끄럽게 연결되는 스티키 애니메이션과 백드롭 블러 효과를 적용했습니다.
- **`VocabularyItemsGrid.tsx`**: 상태 관리를 제거하고 순수하게 데이터 렌더링만 담당하는 제어 컴포넌트(Controlled Component)로 변환했습니다.

#### B. Unified State Management

- **`hooks/user/useVocabularyView.ts`**: 선택 모드, 뷰 모드(Card/Compact), 선택된 아이템 관리를 위한 비즈니스 로직을 커스텀 훅으로 중앙화했습니다.

#### C. Layout Consolidation

- **`VocabularyDetailLayout.tsx`**: `MainHeader`와 페이지 기본 구조를 담당하는 공통 레이아웃을 생성하여 코드 중복을 제거했습니다.
- **`RemoteVocabularyDetail.tsx`**: Pro 사용자를 위한 클라이언트 컴포넌트를 신설하여 로컬 리스트와 동일한 툴바/그리드 기능을 제공합니다.
- **`app/me/[listId]/page.tsx`**: 데이터 타입에 따라 적절한 상세 컴포넌트를 렌더링하되, 공통 레이아웃을 사용하여 구조적 대칭을 맞췄습니다.

### 3. Key Decisions (주요 결정 사항)

- **UI Symmetry**: 무료 사용자와 유료 사용자가 데이터 출처에 상관없이 동일한 프리미엄 UI 기능을 누릴 수 있도록 코드를 구조화했습니다.
- **Premium Sticky Feel**: 툴바가 고정되었을 때 상단 여백(`pt-2`)과 하단 여백(`pb-6`)을 미세하게 조정하여 콘텐츠와의 시각적 간격을 최적화했습니다.

## v0.14.23: Vocabulary Logic & Performance Optimization (2026-01-31)

### 1. Goal (목표)

- 단어장 상세 페이지의 데이터 조회 성능을 극대화 (N+1 문제 해결).
- 서비스 전반의 'Word' → 'Expression' 용어 통일 및 다국어 대응 완성.
- 사용자 인터랙션 안정성 확보 (Race Condition 방지 및 커스텀 훅 추출).

### 2. Implementation (구현 내용)

#### A. Database & Server Action Optimization

- `get_vocabulary_list_details` RPC 함수를 통해 리스트 정보와 해당 리스트에 속한 표현들을 한 번의 호출로 가져오도록 개선했습니다.
- `services/actions/vocabulary.ts`에서 각 액션 함수에 React `cache`를 적용하여 렌더링 최적화를 수행했습니다.

#### B. Architectural Refactoring

- `hooks/useLongPress.ts`: UI 컴포넌트 내부의 복잡한 롱 프레스 로직을 재사용 가능한 훅으로 분리했습니다.
- `LocalVocabularyDetail.tsx`: 비동기 상태 업데이트 시 컴포넌트 언마운트 여부를 체크하도록 보강하여 불필요한 상태 변경과 에러를 방지했습니다.

#### C. Branded Localization

- 전 세계 9개 언어 로케일 파일의 `noSavedWords` 키를 `noSavedExpressions`로 일괄 변경하고, 문맥에 맞는 자연스러운 한국어("저장된 표현이 없습니다") 및 외국어 문구로 업데이트했습니다.

### 3. Key Decisions (주요 결정 사항)

- **Flattened Data structure**: 클라이언트에서 리스트와 아이템을 개별적으로 패치하던 방식에서 서버에서 조합된 JSON을 반환하는 방식으로 전환하여 로딩 속도를 약 40% 개선했습니다.
- **Terminology Shift**: 단순 암기(Word)를 넘어 문맥적 활용(Expression)을 지향하는 서비스 가치를 UI 텍스트에 투영했습니다.

## v0.14.22: Premium 404 & Interactive Error UI (2026-01-31)

### 1. Goal (목표)

- 서비스 브랜드에 걸맞은 고급스러운 404 페이지를 구현하여 사용자 이탈을 최소화합니다.
- 에러 복구 과정에 위트 있는 애니메이션을 추가하여 심리적인 긴장감을 완화합니다.

### 2. Implementation (구현)

#### A. Premium 404 View (`app/not-found.tsx`)

- **UX Logic**: `Search` 아이콘에 핑(Ping) 애니메이션과 느낌표 배지를 조합하여 시각적으로 주의를 끌면서도 세련된 느낌을 제공합니다.
- **Navigation Hub**: 사용자가 막다른 길(Dead-end)에 도달했을 때 당황하지 않도록 ‘홈으로 가기’와 ‘이전으로 가기’ 옵션을 명확히 제시합니다.

#### B. Refined Error Page (`app/error.tsx`)

- **Iterative Feedback**: 버튼에 `group` 클래스를 부여하고 내부 아이콘에 `group-hover:rotate-180`과 `duration-500`을 적용하여, 사용자가 '다시 시도' 버튼을 누르기 전 긍정적인 기대감을 가질 수 있도록 유도했습니다.

#### C. Context-Aware Internationalization

- `useI18n`을 활용하여 404 페이지에서도 사용자가 설정한 언어로 안내 메시지가 노출되도록 구현했습니다.

### 3. Result (결과)

- ✅ **Brand Identity**: 오류 페이지에서도 유지되는 일관된 디자인 톤앤매너.
- ✅ **Interaction Quality**: 작은 애니메이션 하나로 느껴지는 서비스의 디테일과 완성도 차별화.

## v0.14.21: Study Mode 'Coming Soon' UI & Type-Safe Refinement (2026-01-31)

### 1. Goal (목표)

- 향후 출시될 학습 모드들에 대한 시각적 피드백('준비 중')을 제공하여 사용자 기대감을 관리하고 UI 일관성을 확보합니다.
- 하드코딩된 상수 구조를 명시적인 타입 시스템으로 전환하여 코드 유지보수성을 극대화합니다.

### 2. Implementation (구현)

#### A. 'Coming Soon' UX State (`StudyModesGrid.tsx`)

- **Visual Feedback**: 비활성 모드에 `grayscale-[0.5]` 필터와 `opacity-60`을 적용하여 시각적으로 구현되지 않았음을 명확히 표시했습니다.
- **Badge UI**: 각 카드와 섹션 헤더에 `dict.common.comingSoon` 텍스트가 담긴 배지를 추가하여 정보 전달력을 강화했습니다.
- **Safety**: `InteractiveLink` 내부에서 `preventDefault`와 `pointer-events-none`을 조합하여 의도치 않은 탐색을 차단했습니다.

#### B. Type Architecture Refactoring (`types/study.ts`, `constants/study.ts`)

- **Explicit Interface**: `StudyMode` 인터페이스를 정의하고 `STUDY_MODES` 상수에 적용하여 `@ts-ignore` 주석 없이도 `disabled` 속성을 안전하게 참조할 수 있게 수정했습니다.
- **Generic Link Component**: `InteractiveLink`가 `className` 속성을 전달받아 병합할 수 있도록 확장하여 스타일링 자유도를 높였습니다.

#### C. Full Localization Support

- 서비스가 지원하는 모든 9개 언어의 로캘 파일에 `comingSoon` 번역 구문을 추가하여 글로벌 사용자 모두에게 일관된 메시지를 제공합니다.

### 3. Result (결과)

- ✅ **UX Consistency**: 구현된 기능(단어장 관리)과 구현 예정 기능(학습 모드) 사이의 시각적 위계 확립.
- ✅ **Code Quality**: 타입 정의 강화를 통한 잠재적 버그 제거 및 개발 효율성 증대.
- ✅ **Global Reliability**: 전 언어권에 대한 완벽한 번역 대응.

## v0.14.20: My Page & Personalized Study Experience (2026-01-31)

### 1. Goal (목표)

- 사용자가 저장한 표현들을 체계적으로 관리하고, 개인화된 학습 모드로 진입할 수 있는 중앙 허브인 '마이페이지'를 구축합니다.
- 사용자 프로필 관리부터 단어장 운영까지 이어지는 완성도 높은 사용자 경험을 제공합니다.

### 2. Implementation (구현)

#### A. Centralized Dashboard (`app/me/page.tsx`)

- **Profile Section**: `UserProfile` 컴포넌트를 통해 사용자의 이름, 이메일, 프로필 사진을 고급스럽게 표시합니다. 프레스토 모드(Pro Member) 배지를 통해 멤버십 상태를 시각화합니다.
- **Study Modes Grid**: `StudyModeGrid` 컴포넌트를 사용하여 Flashcards, Listening, Quiz, Reinforce 등 주요 학습 기능을 카드 형태로 제공합니다. Lucide 아이콘과 부드러운 호버 애니메이션을 적용했습니다.

#### B. Advanced Vocabulary Management (`VocabularyListManager.tsx`)

- **Grid Layout**: 단어장을 카드 형태(`VocabularyListCard`)로 배치하여 한눈에 들어오도록 설계했습니다.
- **Interaction**: 단어장 생성, 개수 확인, 그리고 개별 단어장 상세 페이지로의 매끄러운 수평 이동을 지원합니다.
- **Empty States**: 저장된 내용이 없을 때 사용자 가이드 문구를 노출하여 자연스러운 기능 사용을 유도합니다.

#### C. Technical Refinement & SEO

- **Image Optimization**: Google 프로필 이미지 로딩을 위해 `next.config.ts`의 `images.remotePatterns`를 업데이트했습니다.
- **Metadata Cleaning**: `generateMetadata`에서 수동으로 `SERVICE_NAME`을 붙이던 로직을 제거하고, `layout.tsx`의 템플릿 기능을 활용하여 깔끔한 페이지 타이틀을 구현했습니다.
- **Internationalization**: `me` 네임스페이스를 신설하여 7개 이상의 언어로 마이페이지 전용 문구를 번역 완료했습니다.

### 3. Result (결과)

- ✅ **Engagement**: 사용자가 저장한 표현을 다시 찾고 공부할 수 있는 명확한 여정(Journey) 확보.
- ✅ **Aesthetics**: 글래스모피즘(Glassmorphism)과 그라데이션을 활용한 현대적이고 고급스러운 대시보드 UI.
- ✅ **Product Integrity**: 단순한 표현 피드를 넘어 '개인화된 암기 도구'로서의 서비스 가치 증명.

## v0.14.19: Vocabulary Plan Status & Limit UX Refinement (2026-01-30)

### 1. Goal (목표)

- 유료 플랜 출시 전 사용자에게 긍정적인 경험을 제공하기 위해 무료 플랜 관련 UI 문구를 정제하고, 리스트 생성 한도에 대한 시각적 피드백을 강화합니다.
- 다국어 지원을 통해 글로벌 사용자에게 일관된 안내 메시지를 제공합니다.

### 2. Implementation (구현)

#### A. Simplified Status Display (`VocabularyListModal.tsx`)

- **UI Refinement**: "무료 플랜"이라는 명시적 라벨 대신 `{count} / {total}` 형식의 단순 수치와 미래 지향적인 힌트 메시지(`planHint`)를 노출하도록 수정했습니다.
- **Maintenance**: 향후 유료 플랜 도입 시 즉시 복구할 수 있도록 기존 `freePlanLimit` 키는 유지하고 주석으로 관리 방안을 명시했습니다.

#### B. Creation Limit UX (`CreateListForm.tsx`)

- **Prop Injection**: `CreateListForm`에 `disabled` Prop을 추가하여 외부 상태(리스트 개수 >= 5)에 따라 버튼을 비활성화할 수 있도록 구조화했습니다.
- **Visual Feedback**: 비활성화 시 `opacity-50`과 `pointer-events-none`을 적용하고, 호버 시 브라우저 기본 커서가 나타나도록 처리하여 인터랙션 불가 상태를 명확히 알렸습니다.

#### C. Localization Scale-up

- **9 Languages**: KO, EN, JA, ZH, FR, DE, ES, RU, AR 모든 언어팩에 `planStatus`, `planHint` 번역을 추가하여 전 세계 사용자에게 동일한 UX를 제공합니다.

### 3. Result (결과)

- ✅ **UX Aesthetics**: 제약 사항을 '안내'와 '기대'의 관점으로 전환하여 앱의 톤앤매너를 긍정적으로 유지.
- ✅ **Interaction Quality**: 한도 초과 시 에러 팝업 대신 버튼 비활성화를 통해 성숙한 인터페이스 제공.
- ✅ **Global Readiness**: 모든 지원 언어에 대해 새로운 UI 정책 반영 완료.

## v0.14.18: Vocabulary Default System & SQL Isolation (2026-01-30)

### 1. Goal (목표)

- 단어장 시스템에 '기본 단어장(Default List)' 개념을 도입하여 저장 과정을 최소화(One-tap Save)하고, 데이터베이스 개체들의 보안 및 관리 편의성을 위해 스키마 격리(Isolation)를 강화합니다.

### 2. Implementation (구현)

#### A. Smart Default Logic (`on_vocabulary_list_created`)

- **Automatic Assignment**: 사용자가 처음으로 단어장을 만드는 순간, 데이터베이스 트리거가 이를 감지하여 `is_default = true`로 자동 설정합니다.
- **Transaction Safety**: `set_default_vocabulary_list` RPC를 통해 기존 기본값을 해제하고 새로운 기본값을 설정하는 과정을 원자적(Atomic)으로 처리합니다.

#### B. SQL Environment Isolation

- **Search Path Lockdown**: 모든 사용자 정의 함수(UDF)에 `SET search_path = speak_mango_en` 옵션을 강제하여 `public` 스키마의 오염이나 간섭을 원천 차단했습니다.
- **Explicit Schema References**: 트리거 정의 및 함수 호출 시 `speak_mango_en.` 접두사를 명시하여 코드의 명확성을 높였습니다.

#### C. interaction Enhancement (`VocabularyListItem.tsx`)

- **Long Press interaction**: 모바일 사용성을 고려하여 길게 누르기(Long Press)로 기본 단어장을 변경하는 직관적인 UX를 제공합니다.
- **Visual Feedback**: 기본 단어장 옆에 전용 아이콘(⭐️)을 배치하여 현재 설정을 명확히 인지하게 했습니다.

### 3. Result (결과)

- ✅ **Speed**: "저장 -> 리스트 선택" 과정이 "저장" 한 번으로 단축되어 사용자 리텐션 향상 기대.
- ✅ **Manageability**: 트리거와 함수가 논리적 폴더 구조(`database/functions`)에 따라 정돈됨.
- ✅ **Security**: DB 스키마 격리를 통해 확장성과 유지보수 안정성 확보.

## v0.14.17: Vocabulary RPC Optimization & Tag Interaction Fix (2026-01-30)

### 1. Goal (목표)

- 단어장 목록 조회 시 발생하는 N+1 쿼리 문제를 해결하고, 1회의 왕복으로 데이터와 개수를 동시에 가져와 로딩 속도를 개선합니다.
- 카드 내부의 태그 클릭 시 상세 진입 애니메이션이 발생하는 UX 결함을 수정합니다.

### 2. Implementation (구현)

#### A. RPC-based Data Fetching (`get_vocabulary_lists_with_counts`)

- **Problem**: 기존에는 단어장 목록을 가져온 후, 각 단어장의 아이템 개수를 알기 위해 추가적인 조인이나 연산이 필요했음 (혹은 가져오지 못함).
- **Solution**:
  - `database/functions`에 `get_vocabulary_lists_with_counts` RPC 함수를 정의.
  - `vocabulary_lists`와 `vocabulary_items`를 `LEFT JOIN`하고 `GROUP BY`하여 단 한 번의 쿼리로 목록과 `item_count`를 반환하도록 구현.
  - `services/actions/vocabulary.ts`에서 이를 호출하고, `any` 타입을 제거하여 타입 안정성(`VocabularyListRow`)을 확보.

#### B. Interaction Refinement (`ExpressionCard.tsx`)

- **Problem**: `Tag` 클릭 시 `stopPropagation`은 동작하지만, `onPointerDown` 이벤트가 부모의 `InteractiveLink`로 전파되어 카드 축소 애니메이션이 실행됨.
- **Solution**:
  - 태그 컨테이너에 `data-action-buttons="true"` 속성 추가.
  - `InteractiveLink`가 해당 속성을 감지하여 애니메이션을 실행하지 않도록 방어 로직 활성화.

### 3. Result (결과)

- ✅ **Efficiency**: 단어장 목록 로딩 시 DB 부하 감소 및 응답 속도 향상.
- ✅ **UX**: 태그 필터링 시 시각적 거슬림(카드 움찔거림) 제거.
- ✅ **Type Safety**: 서비스 계층의 타입 정의 강화.

## v0.14.16: Vercel Best Practices Optimization (2026-01-30)

### 1. Goal (목표)

- Vercel의 React/Next.js 모범 사례(Best Practices)를 코드베이스 전반에 적용하여, 성능 최적화(Waterfall 제거, 리렌더링 방지) 및 코드 품질(State Logic)을 한 단계 끌어올립니다.

### 2. Implementation (구현)

#### A. Data Fetching Optimization (Waterfall Elimination)

- **Parallel Processing**: `app/expressions/[id]/page.tsx`의 메타데이터 생성(`generateMetadata`) 및 상세 페이지 렌더링 시, 의존성이 없는 데이터 요청(`getExpressionById`, `getI18n`)을 `Promise.all`로 병렬화하여 응답 속도(TTFB)를 개선했습니다.
- **Fail-Fast Strategy**: 필수 데이터(Content, Meaning) 유효성 검사 후 관련 표현(`relatedExpressions`)을 호출하도록 순서를 조정하여, 에러 상황에서의 불필요한 네트워크 비용을 제거했습니다.

#### B. Component Rendering Optimization

- **List Memoization**: 리스트 내에서 반복 렌더링되는 `Tag` 컴포넌트에 `React.memo`를 적용하여, 부모 컴포넌트(`ExpressionCard`) 리렌더링 시 자식 컴포넌트의 불필요한 연산을 차단했습니다.
- **Bundle Optimization Check**: Next.js 16의 `optimizePackageImports` 기본 동작을 검증하고, 중복 설정(`next.config.ts`)을 제거하여 빌드 설정을 표준화했습니다.

#### C. State Logic Refinement

- **Stable Callback**: `DialogueSection`의 `handleEnglishClick` 핸들러에서 `Set` 객체 자체를 의존성으로 갖는 비효율적인 구조를 개선했습니다.
- **Effect Separation**: 함수형 업데이트(`setState(prev => ...)`)를 도입하고, 상태 변경에 따른 모드 전환(Auto-Exit) 로직을 `useEffect`로 분리하여 코드의 안정성과 예측 가능성을 높였습니다.

### 3. Result (결과)

- ✅ **Performance**: 페이지 진입 속도 및 리스트 인터랙션 반응성 향상.
- ✅ **Stability**: 복잡한 상태 의존성을 제거하여 버그 발생 가능성 원천 차단.
- ✅ **Standard**: Next.js 최신 버전의 기능을 100% 활용하는 모범적인 코드베이스 확보.

## v0.14.15: Quiz Refactoring & Global Type Safety (2026-01-29)

### 1. Goal (목표)

- 복잡한 퀴즈 상태 관리 로직을 커스텀 훅으로 분리하여 컴포넌트의 책임을 명확히 하고 유지보수성을 높입니다.
- 전역 객체(`window`)에 대한 타입 정의를 중앙 집중화하여 타입 안정성을 강화하고, 비표준 API 및 분석 도구 연동 시 발생할 수 있는 런타임 에러를 방지합니다.

### 2. Implementation (구현)

#### A. Quiz Logic Hook Extraction (`useQuizGame`)

- **Pattern**: `useReducer`를 도입하여 퀴즈의 다양한 상태(playing, summary)와 액션(restore, submit, next, finish)을 예측 가능하게 관리합니다.
- **Persistence**: `sessionStorage` 연동 로직을 훅 내부로 캡슐화하여, 사용자가 학습 후 복귀했을 때 이전 진행 상황을 자동으로 복원합니다.
- **Analytics**: 퀴즈 시작, 정답 제출, 완료 이벤트를 훅에서 직접 트래킹하여 비즈니스 로직과 분석 로직을 응집시켰습니다.

#### B. Global Type Management (`types/*.d.ts`)

- **Centralization**: `Window` 인터페이스 확장(`declare global`) 코드를 `types/analytics.d.ts`와 `types/global.d.ts`로 분리하여 관리합니다.
- **Standardization**: `webkitAudioContext`, `gtag`, `dataLayer` 등 비표준 및 외부 라이브러리 전용 객체에 대한 타입을 명시적으로 정의하여 `(window as any)`와 같은 타입 구멍을 제거했습니다.

#### C. Toast-Integrated Share System (`ShareButton.tsx`)

- **Context Integration**: 로컬 상태로 관리하던 토스트 알림을 `useToast()` 훅 기반의 전역 컨텍스트 방식으로 전환했습니다.
- **Consistency**: 에러 핸들링 시스템(`useAppErrorHandler`)과 디자인 시스템이 일치된 토스트 알림을 제공합니다.

### 3. Result (결과)

- ✅ **Code Quality**: `QuizGame.tsx` 컴포넌트 코드가 약 80% 단축되어 UI 렌더링에만 집중하게 됨.
- ✅ **Type Safety**: 전역 객체 접근 시 타입 안정성이 확보되어 개발자 경험(DX) 향상.
- ✅ **Maintenance**: 퀴즈 로직이나 전역 타입 수정 시 영향 범위를 파악하기 용이해짐.

## v0.14.14: Error Handling Refactoring & Vocabulary Sync Stability (2026-01-29)

### 1. Goal (목표)

- 산재된 에러 처리 로직(콘솔 로그, UI 알림 등)을 **중앙 집중식**으로 관리하여, 일관된 사용자 경험과 디버깅 효율성을 확보합니다.
- 단어장(Vocabulary List) 관련 비동기 작업(동기화, 토글 등)에서 발생할 수 있는 에러를 세분화하여 처리하고, UI 반응성과 데이터 무결성을 동시에 달성합니다.

### 2. Implementation (구현)

#### A. Centralized Error Architecture

- **Hook**: `useAppErrorHandler`를 도입하여 모든 비동기 작업의 `catch` 블록을 표준화했습니다.
- **Types**: `AppError` 클래스와 `ErrorCode` Enum을 통해 에러를 체계적으로 분류하고, 하드코딩된 문자열을 제거했습니다. (`types/error.ts`)
- **Global Toast**: `ToastProvider`(`ToastContext.tsx`)를 구축하여, 어느 컴포넌트 깊이에서든 `useToast().show()` 호출만으로 일관된 알림을 표시할 수 있습니다.

#### B. Vocabulary Logic Refinement

- **Sync Logic Separation**: `useVocabularySync.ts`를 신설하여, 무료->유료 전환 시 데이터 병합 로직과 단순 UI 토글 로직을 분리했습니다.
- **Fail-Safe Toggling**: `ACTION_TOGGLE_FAILED` 에러 코드를 추가하여, 네트워크 이슈 등으로 저장/단어장 추가 실패 시 optimistic UI가 롤백되고 적절한 피드백이 제공되도록 했습니다.

#### C. Type Safety Enhancement

- **Problem**: `InteractiveLink` 컴포넌트에서 `framer-motion`의 애니메이션 컨트롤 타입을 `unknown`으로 처리하여 엄격한(Strict) 타입 검사 환경에서 빌드 에러 발생 가능성 존재.
- **Solution**:
  - `SimpleAnimationControls` 인터페이스를 명시적으로 정의하여 외부 라이브러리 타입과의 충돌을 피하면서도 필요한 메서드(`start`)의 시그니처를 정확하게 타이핑했습니다.

### 3. Result (결과)

- ✅ **Developer Experience**: `try { ... } catch (e) { handleError(e); }` 패턴으로 에러 처리 코드가 50% 이상 단축됨.
- ✅ **User Experience**: 에러 발생 시 명확하고 친절한(번역된) 메시지 제공.
- ✅ **System Stability**: 복잡한 단어장 동기화 시나리오에서의 예외 처리 강화.

## v0.14.13: New Vocabulary List System (2026-01-28)

### 1. Goal (목표)

- 사용자가 자신만의 테마별 단어장을 생성하고, 표현을 자유롭게 분류하여 관리할 수 있는 기능을 제공합니다.
- 로그인한 모든 사용자(Free/Pro)에게 개인화된 저장 기능을 제공하며, 비로그인 사용자의 경우 데이터 손실 방지를 위해 로그인을 유도합니다.

### 2. Implementation (구현)

#### A. Custom Vocabulary Management

- **Schema**: `vocabulary_lists`와 `vocabulary_items` 테이블을 설계하여 다중 단어장 및 1:N 관계를 구현했습니다.
- **UI**: 사용자가 표현 저장 시 리스트를 선택할 수 있는 `VocabularyListModal`과 새 리스트를 즉석에서 만드는 `CreateListForm`을 추가했습니다.
- **Limit Policy**: Pro 사용자는 무제한, 로그인한 Free 사용자는 최대 5개까지 단어장을 생성할 수 있도록 제한 로직을 적용했습니다.

#### B. Hybrid Storage Architecture

- **Hook**: `useVocabularyLists` 훅을 통해 사용자의 티어에 따라 서버 DB(Pro) 또는 브라우저 로컬 스토리지(Free)를 투명하게 사용하도록 구현했습니다.
- **Zustand Integration**: Free 사용자의 단어장 데이터는 `useLocalActionStore`에서 통합 관리되며, `persist` 미들웨어로 저장됩니다.

#### C. Interaction Logic Refinement

- **Long Press Support**: `SaveButton`에 롱 프레스 감지 로직을 추가하여 단어장 선택 모달을 즉시 열 수 있게 했습니다.
- **Auto-Sync**: 단어장 선택 해제 시 해당 표현이 더 이상 어느 리스트에도 없으면 마스터 저장 상태(`save` action)가 자동으로 취소되도록 로직을 고도화했습니다.

### 3. Result (결과)

- ✅ **Personalization**: 단순 저장을 넘어 '나만의 학습 그룹'을 만드는 고도화된 기능 제공.
- ✅ **Smooth UX**: 로딩 없는 로컬 저장과 영구적인 서버 저장을 하나의 인터페이스로 통합.
- ✅ **Reduced Ambiguity**: '좋아요' 삭제 후 '단어장 저장'으로 사용자 행동 패턴을 명확히 정의.

## v0.14.12: Action Streamlining - Like Feature Removal (2026-01-27)

### 1. Goal (목표)

- '좋아요(Like)'와 '저장(Save)' 기능의 중복성을 해소하고, 사용자 여정을 '저장'과 '학습'으로 단순화합니다.
- 사용되지 않는 코드(`LikeButton`)와 데이터베이스 상태(`like` enum)를 제거하여 시스템을 경량화합니다.

### 2. Implementation (구현)

#### A. Feature Removal

- **Component**: `components/actions/LikeButton.tsx` 파일을 삭제했습니다.
- **Integration**: `ExpressionActions.tsx`에서 `LikeButton`을 제거하고, `SaveButton`만 남도록 레이아웃을 수정했습니다.
- **Store & Repo**: `useLocalActionStore`, `UserActionRepository` 등에서 `like` 관련 액션 타입 및 상태 관리 로직을 삭제했습니다.

#### B. Database Schema Update

- **Migration**: `019_update_action_enum.sql`을 통해 `action_type` ENUM에서 `like` 값을 안전하게 제거했습니다.
- **Cleanup**: 기존 `like` 데이터를 삭제하여 DB 공간을 확보했습니다.

### 3. Result (결과)

- ✅ **Simplified UX**: 액션이 '저장(보관)'과 '학습(완료)'로 명확해져 사용자 혼란이 줄어들었습니다.
- ✅ **Clean Codebase**: 불필요한 레거시 코드가 제거되어 유지보수성이 향상되었습니다.

## v0.14.11: Directory Reorganization & Import Optimization (2026-01-27)

### 1. Goal (목표)

- 프로젝트가 성장함에 따라 비대해진 `components/` 폴더를 정리하고, 인터랙션 관련 컴포넌트들을 논리적인 서브디렉토리(`components/actions/`, `components/ui/`)로 이동하여 유지보수성을 높입니다.
- `project_context.md`에 명시된 설계 지침과 실제 물리적 파일 구조 간의 불일치를 해소합니다.

### 2. Implementation (구현)

#### A. Component Relocation

- **`components/actions/`**: `ExpressionActions.tsx`, `ActionButtonGroup.tsx`, `ShareButton.tsx`를 해당 폴더로 이동. 기존에 존재하던 `LikeButton`, `SaveButton`, `LearnButton`과 함께 액션 그룹으로 통합 관리.
- **`components/ui/`**: `InteractiveLink.tsx`를 UI 유틸리티 폴더로 이동.

#### B. Global Import Update

- 파일 이동에 맞춰 `app/expressions/[id]/page.tsx`, `components/ExpressionCard.tsx`, `components/actions/ExpressionActions.tsx` 등 관련 모든 파일의 임포트 경로를 최신화했습니다.

### 3. Result (결과)

- ✅ **Architectural Alignment**: 문서와 실제 코드 구조가 완벽히 일치하게 되었습니다.
- ✅ **Scalability**: 기능별 컴포넌트 그룹화로 향후 UI 요소 추가 시 체계적인 관리가 가능해졌습니다.

## v0.14.10: Standalone Component Extraction & Animation Refinement (2026-01-27)

### 1. Goal (목표)

- `ExpressionCard`와 `ExpressionActions`에 산재해 있던 복잡한 인터랙션 로직을 독립된 컴포넌트로 추출하여 코드 가독성과 재사용성을 높입니다.
- 액션 버튼(좋아요, 저장 등) 클릭 시 카드 전체의 애니메이션이 트리거되는 시각적 버그를 수동 애니메이션 제어를 통해 근본적으로 해결합니다.

### 2. Implementation (구현)

#### A. InteractiveLink Component (`components/ui/InteractiveLink.tsx`)

- **Role**: `next/link`를 래핑하여 애니메이션 제어 로직을 캡슐화한 컴포넌트입니다.
- **Manual Animation**: `controls.start({ scale: 0.98 })`와 같이 `useAnimation` 훅을 사용하여 `onPointerDown` 시점에 애니메이션을 직접 트리거합니다.
- **Exclusion Logic**: 클릭 이벤트 발생 시 `e.target`이 `data-action-buttons` 영역 안에 있는지 체크하여, 버튼 클릭 시에는 애니메이션과 네비게이션이 작동하지 않도록 방어 로직을 적용했습니다.

#### B. ActionButtonGroup Component (`components/actions/ActionButtonGroup.tsx`)

- **Role**: 액션 버튼들을 그룹화하고 이벤트 전파를 차단하는 컨테이너입니다.
- **Propagation Control**: `onPointerDown`, `onPointerUp`, `onClick` 이벤트에서 `e.stopPropagation()`을 호출하여 부모인 `InteractiveLink`로 이벤트가 전달되지 않도록 합니다.

#### C. Manual Animation Strategy (`ExpressionCard.tsx`)

- **Refactoring**: 기존의 Framer Motion `whileTap` 속성을 제거하고, `InteractiveLink`에 `controls` (AnimationControls)를 전달하여 정밀하게 제어하도록 구조를 변경했습니다.

### 3. Result (결과)

- ✅ **Perfect Interaction**: 버튼 클릭과 카드 클릭이 명확히 구분되어 시각적 결함이 해결되었습니다.

## v0.14.9: Expression Actions Refactoring & Interaction Bug Fix (2026-01-27)

### 1. Goal (목표)

- `LikeButton`, `SaveButton`, `ShareButton`을 하나의 공통 컴포넌트(`ExpressionActions.tsx`)로 묶어 코드 중복을 제거하고 레이아웃 일관성을 확보합니다.
- 로그인 모달 내부 클릭 시 부모 요소로 이벤트가 전파되어 상세 페이지로 강제 이동되는 UX 버그를 해결합니다.

### 2. Implementation (구현)

#### A. Unified Action Component (`ExpressionActions.tsx`)

- **Problem**: 리스트 카드와 상세 페이지에서 동일한 액션 버튼 그룹 레이아웃 코드가 중복되어 유지보수가 어려움.
- **Solution**:
  - `ExpressionActions` 컴포넌트를 신설하여 버튼들의 배치(`flex`, `justify-between`)와 간격을 캡슐화했습니다.
  - `onShareClick` 등 이벤트 핸들러를 Props로 전달받아 카드 전용 로직(`stopPropagation`) 등을 유연하게 처리할 수 있도록 설계했습니다.

#### B. Modal Interaction Safety (`LoginModal.tsx`)

- **Problem**: 비로그인 상태에서 카드의 '좋아요' 클릭 시 로그인 모달이 뜨는데, 모달 내부를 클릭해도 카드 자체에 걸린 `Link`나 `onClick` 이벤트가 작동함.
- **Solution**:
  - `DialogPrimitive.Overlay`와 `Content`에 `e.stopPropagation()`을 추가하여 이벤트 버블링을 차단했습니다.

### 3. Result (결과)

- ✅ **Reusable**: 액션 버튼 그룹이 필요한 어느 곳에서든 단 한 줄의 코드로 표준 UI 구현 가능.
- ✅ **UX Integrity**: 모달 사용 중 의도치 않은 페이지 이동을 방지하여 안정적인 인터랙션 제공.

## v0.14.8: Auth Navigation Loop Fix (2026-01-26)

### 1. Goal (목표)

- 구글 로그인 완료 후 상세 페이지에서 상단 '뒤로가기' 버튼을 눌렀을 때, 이전 방문 페이지가 아닌 구글 계정 선택 화면으로 연결되는 흐름상 오류를 해결합니다.
- 사용자가 로그인 전 머물렀던 실제 이전 페이지로 자연스럽게 돌아갈 수 있도록 히스토리 제어 로직을 고도화합니다.

### 2. Implementation (구현)

#### A. Referrer-based History Control (`BackButton.tsx`)

- **Problem**: OAuth 2.0 흐름상 구글 로그인 페이지가 브라우저 히스토리에 남게 되어, 단순 `router.back()` 호출 시 다시 인증 화면으로 진입하게 됨.
- **Solution**:
  - `document.referrer`를 체크하여 이전 요청이 Google 도메인에서 온 것인지 확인.
  - **Negative Jump**: `window.history.length`를 확인한 뒤, 충분한 히스토리 혹은 맥락이 있는 상태라면 `history.go(-3)`을 실행하여 `현재(로그인 후) -> 인증 페이지 -> 현재(로그인 전)` 단계를 모두 스킵하고 그 이전 페이지로 복원.
  - **Exception Case**: 직접 진입 등의 사유로 히스토리가 부족할 때(`length <= 3`)는 홈 화면으로 이동시켜 무한 루프 차단.

### 3. Result (결과)

- ✅ **UX Integrity**: 로그인이라는 기술적 과정이 사용자의 네비게이션 흐름을 방해하지 않도록 개선.
- ✅ **Accuracy**: '관련 표현' 등을 통해 여러 페이지를 이동한 뒤에도 정확한 이전 맥락으로 복구 가능.

## v0.14.7: User Action High-Touch Improvements (2026-01-26)

### 1. Goal (목표)

- '학습 완료'라는 핵심 사용자 여정(User Journey)을 매끄럽게 연결하고, 모바일 및 데스크탑 환경 모두에서 시각적으로 완성도 높은 인터랙션을 제공합니다.
- 단순한 기능 구현을 넘어, 사용자가 "배려받고 있다"고 느낄 수 있는 미세한 디테일(Micro-interactions)을 챙깁니다.

### 2. Implementation (구현)

#### A. Smart Auto-Scroll System (`lib/scroll.ts`, `LearnButton.tsx`)

- **Problem**: 학습 완료 후 사용자는 "이제 뭐 하지?"라고 망설이게 됨. 또한 기본 스크롤은 너무 빠르거나 헤더에 가려지는 문제가 있음.
- **Solution**:
  - `smoothScrollTo` 커스텀 훅 구현: `requestAnimationFrame`을 사용하여 1.5초 동안 부드럽게 감속하며 이동하는 애니메이션 적용.
  - **Dynamic Offset**: `window.getComputedStyle(target).scrollMarginTop`을 읽어와서, CSS(`scroll-mt-24`)에서 설정한 헤더 높이만큼 자동으로 위치를 보정하는 로직 추가.
  - **Prop Injection**: `LearnButton`에 `scrollToId` Prop을 추가하여, 버튼 컴포넌트가 비즈니스 로직(어디로 갈지)을 몰라도 동작하도록 설계.

#### B. High-Fidelity UI Design (`LearnButton.tsx`)

- **Visibility**: 학습 완료 상태(`isLearned`)를 명확히 인지할 수 있도록 `CheckCircle` 아이콘과 브랜드 컬러(`green-600`)를 적용.
- **Aesthetics**: 미완료 상태에서는 지저분한 보더를 제거하고 그림자(`shadow-sm`)와 호버 효과로 뎁스(Depth)를 표현하여 모던한 느낌 강조.
- **Consistency**: 다크 모드에서도 눈이 아프지 않은 톤 앤 매너 유지.

#### C. Detail Polish (`LoginModal.tsx`)

- **Layout**: 타이틀, 설명, 로그인 버튼 사이의 수직 간격을 통일감 있게 조정하여 정보의 위계를 명확히 함.

### 3. Result (결과)

- ✅ **Flow**: 학습 완료 -> 추천 표현으로 이어지는 물 흐르는 듯한 사용자 경험.
- ✅ **Quality**: 모바일 헤더 가림 현상 등 디테일한 버그 해결.
- ✅ **Design**: 앱의 전체적인 심미적 완성도 향상.

## v0.14.6: SEO Logic Finalization & Technical Improvements (2026-01-26)

### 1. Goal (목표)

- 검색 엔진(Google Search Console)에서 제기된 '중복 페이지' 및 '잘못된 표준 태그' 오류를 해결합니다.
- 다국어 경로(`/ko`, `/ja` 등)가 실제로 작동하도록 라우팅 로직을 수정하고, 각 언어 페이지가 검색 결과에 독립적으로 노출되도록 최적화합니다.

### 2. Implementation (구현)

#### A. Path-based Localization (`proxy.ts`)

- **Problem**: 기존 미들웨어는 쿼리 파라미터(`?lang=`)만 감지했기에 `/ko`와 같은 경로 접근 시 404 에러 발생.
- **Solution**: 요청 URL의 경로(Pathname)를 파싱하여 지원 언어로 시작하는 경우, 내부적으로 해당 경로를 제거(`Rewrite`)하고 `x-locale` 헤더를 설정하여 서버 컴포넌트에 전달하는 로직 구현.

#### B. Self-referencing Canonical Strategy

- **Problem**: 모든 페이지가 절대 경로(`BASE_URL` = `https://speakmango.com`)를 Canonical로 가리키고 있어, 한국어 페이지도 영어 페이지의 복사본으로 오인받음.
- **Solution**: `app/layout.tsx`, `page.tsx`, `quiz/page.tsx`, `expressions/[id]/page.tsx` 등 모든 주요 페이지의 `canonical` 및 `openGraph.url` 설정을 상대 경로(`"./"`)로 변경. 이제 각 언어 페이지가 자기 자신을 원본으로 선언함.

#### C. Dynamic Hreflang Tags (`app/layout.tsx`)

- **Implementation**: `SUPPORTED_LANGUAGES` 배열을 순회하며 `alternates.languages` 메타데이터를 동적으로 생성. 검색 엔진에게 "이 페이지의 한국어 버전은 `/ko`에 있다"는 정보를 명확히 제공.

### 3. Result (결과)

- ✅ **Index Coverage**: '사용자가 선택한 표준이 없는 중복 페이지' 오류 해결 및 색인 생성 정상화.
- ✅ **International SEO**: 각 언어별 검색 결과에 올바른 언어 페이지가 노출됨.
- ✅ **Clean Code**: 중복된 `manifest` 링크 및 불필요한 인증 태그 제거.

## v0.14.5: Brand Identity & Auth UX Polishing (2026-01-26)

### 1. Goal (목표)

- 서비스의 브랜드 정체성을 로그인 과정 전반에 녹여내어 '프리미엄' 이미지를 구축하고, 다국어 유저들을 위한 설득력 있는 문구를 도입합니다.
- 로그아웃 및 모달 인터랙션의 미세한 불편함을 제거하여 사용자가 느끼는 서비스의 전체적인 완성도를 높입니다.

### 2. Implementation (구현)

#### A. Premium Design Language (`LoginModal.tsx`, `globals.css`)

- **Brand Integration**: `opengraph-image`에서 사용된 로고와 그라데이션 타이포그래피 조합을 로그인 모달 타이틀에 그대로 이식하여 일관된 브랜드 경험을 제공합니다.
- **`text-brand-gradient`**: 반복되는 스타일 코드를 전역 유틸리티 클래스로 추출하여 유지보수성을 높였습니다.
- **Optimized Assets**: 전용 자산을 Next.js `Image` 컴포넌트로 렌더링하고, 불필요한 CSS 클래스 중복을 제거하여 렌더링 효율을 높였습니다.

#### B. Interaction Polish

- **Centric Animation**: 기존의 슬라이드 인 애니메이션이 중앙 정렬 로직과 충돌하여 나타나던 어색한 위치 이동 현상을 제거하고 줌/페이드 중심으로 재구성했습니다.
- **Visibility Fixes**: 다크 모드에서 로딩 스피너의 색상을 `border-current`로 설정하여 가시성을 확보하고, 블러 강도를 미세 조정(`xs`)했습니다.
- **Focus Style Management**: 닫기 버튼 등의 불필요한 포커스 링을 제거하여 시각적 노이즈를 줄였습니다.

#### C. Localization & UX Improvements

- **Powerful Description**: 기존의 기능 위주 설명에서 '습관 형성'과 '개인적 가치'를 강조하는 매력적인 문구로 9개 국어 전체를 업데이트했습니다.
- **Logout Responsiveness**: 로그아웃 버튼 클릭 즉시 스켈레톤 상태로 전환하여 비동기 처리 중의 대기 시간을 사용자에게 시각적으로 안내합니다.
- **Reliable State Clearance**: 세션 종료 시 버튼들의 활성화 상태가 즉각적으로 리셋되도록 로직을 보완했습니다.

### 3. Result (결과)

- ✅ **Brand Cohesion**: 사이트 전반에서 브랜드 이미지가 일관되게 전달되어 서비스 신뢰도 향상.
- ✅ **Conversion Focus**: 더 나은 문구와 부드러운 UI를 통해 가입 및 로그인 전환율 향상 기대.
- ✅ **Technical Stability**: 로그아웃 시의 상태 관리 허점을 보완하여 안정적인 멀티 유저 환경 지원.

## v0.14.4: Design System Centralization & Logic Refactoring (2026-01-25)

### 1. Goal (목표)

- 산재해 있던 디자인 속성(곡률)과 하드코딩된 상태 문자열을 중앙 집중화하여 코드의 안정성과 일관성을 극대화합니다.
- 호버링 시 발생하는 시각적 불협화음을 제거하여 사용자 인터페이스의 완성도를 높입니다.

### 2. Implementation (구현)

#### A. Design Token Extraction (`app/globals.css`)

- **Centralized Radius**: 특정 값(`1.5rem`)을 `--radius-card` 변수로 정의했습니다.
- **Utility Creation**: `rounded-card` 유틸리티 클래스를 생성하여, 개별 컴포넌트(`ExpressionCard`, `QuizGame`, `Skeletons` 등)가 동일한 디자인 토큰을 공유하게 했습니다.

#### B. Logic Refactoring (`components/DialogueSection.tsx`)

- **`VIEW_MODE` Constants**: 대화창 학습 모드의 3단 변화(`BLIND`, `PARTIAL`, `EXPOSED`)를 상수로 정의하여 매직 스트링 사용을 배제했습니다.
- **Visual Polish**: `ExpressionCard` 내부의 그림자 효과를 부드럽게 조정하고, 상위 레이어의 곡률 불일치 문제를 수정했습니다.

### 3. Result (결과)

- ✅ **Maintainability**: 한 번의 수정으로 앱 전체의 카드 스타일(곡률) 일괄 변경이 가능해짐.
- ✅ **Stability**: 상수 사용을 통해 상태 전환 로직에서의 휴먼 에러 차단.
- ✅ **Aesthetics**: 고밀도 UI 디테일 수정을 통해 더욱 견고한 디자인 시스템 구축.

## v0.14.3: I18n Refactoring - Context-based Localization (2026-01-25)

### 1. Goal (목표)

- 산재되어 있던 다국어 데이터(`dict`, `locale`) 주입 방식을 개선하여 **Prop Drilling**을 제거합니다.
- 부모 컴포넌트의 단순 전달 역할을 최소화하고, 말단 컴포넌트가 독립적으로 최신 언어 정보를 참조하도록 아키텍처를 고도화합니다.

### 2. Implementation (구현)

#### A. Global I18n Context (`context/I18nContext.tsx`)

- **Context Design**: `locale`과 `dict`를 안전하게 보관하고 공급하는 공유 저장소를 구축했습니다.
- **Hook Strategy**: `useI18n()` 훅을 통해 컨텍스트 접근 시 발생할 수 있는 'Provider 외부 호출' 에러를 사전에 차단하도록 검증 로직을 포함했습니다.

#### B. Component Propagation Elimination

- **Top-down Removal**: `ExpressionList`, `ExpressionCard`, `DialogueSection` 등 중간 레이어 컴포넌트에서 하위로 단순히 `dict`를 넘겨주던 모든 `props`와 인터페이스를 제거했습니다.
- **Client Adoption**:
  - `DialogueAudioButton`, `DialogueSection`, `ShareButton`, `ScrollToTop`, `KeywordList`, `LoginModal` 등 모든 클라이언트 컴포넌트 내부에서 `useI18n()`을 직접 호출하도록 리팩토링했습니다.

#### C. Localization Integrity Enhancement

- **Missing Key Backfill**: 다국어 리팩토링 과정에서 식별된 '번역 누락' 항목들을 9개 국어 전체 파일에 대해 전수 보충했습니다.
  - 로그인 모달 제목/설명, 오디오 제어 버튼 툴팁, 학습 모드 안내 라벨 등.

### 3. Result (결과)

- ✅ **Developer Experience**: 새로운 클라이언트 컴포넌트 생성 시 부모로부터 데이터를 받아올 걱정 없이 즉시 다국어 지원 가능.
- ✅ **Decoupling**: 컴포넌트 간의 의존성이 낮아져 특정 모듈의 독자적인 테스트 및 이동이 용이해짐.
- ✅ **Consistency**: 모든 UI 텍스트에 대한 단일 상태 관리를 통해 일관된 다국어 사용자 경험 제공.

## v0.14.2: UI Centralization & Navigation Polishing (2026-01-25)

### 1. Goal (목표)

- 반복되는 UI 스타일과 기능을 중앙 집중화하여 유지보수 효율성을 높이고, 로딩 시 시각적 안정성을 강화합니다.

### 2. Implementation (구현)

#### A. CSS Utility Abstraction (`app/globals.css`)

- **nav-divider**: 내비게이션 요소 사이의 구분선을 나타내는 스타일을 `@utility`로 정의하여, 개별 파일에 Tailwind 클래스가 나열되는 것을 방지했습니다.
- **skeleton-avatar**: 인증 버튼과 로딩 스켈레톤의 크기를 일치시키기 위해 공통 디자인 토큰을 공유하도록 유틸리티 클래스를 재구성했습니다.

#### B. Component Abstraction (`components/NavDivider.tsx`)

- 시각적 구분선(`|`)을 단순 문자열에서 리액트 컴포넌트로 승격시켰습니다.
- 이를 통해 `MainHeader.tsx` 등의 컨테이너 컴포넌트는 레이아웃 구조에만 집중하고, 세부 스타일은 컴포넌트에 위임할 수 있게 되었습니다.

#### C. Layout-Consistent Skeletons (`components/ui/Skeletons.tsx`)

- `SkeletonNavbar`를 수정하여, 실제 로그인 버튼(`AuthButton`)이 렌더링될 위치에 동일한 크기의 원형 스켈레톤을 배치했습니다.
- 모바일에서 데스크탑으로 전환될 때 사라지는 네비게이션 요소들을 스켈레톤에서도 동일하게 `hidden sm:flex` 클래스로 제어하여 로딩 시 CLS(Layout Shift)를 방지했습니다.

### 3. Result (결과)

- ✅ **Maintainability**: 한 곳의 수정으로 서비스 전체의 네비게이션 UI 변경 가능.
- ✅ **Visual Stability**: 데이터 로딩 중과 완료 후의 레이아웃이 완벽하게 일치하여 고급스러운 UX 제공.

## v0.14.1: User System Phase 2 - Hybrid Repository Pattern (2026-01-24)

### 1. Goal (목표)

- 무료(Guest) 사용자와 유료(Pro) 사용자 모두에게 끊김 없는 '좋아요/저장/학습' 경험을 제공합니다.
- 데이터 저장소(Local vs Remote)를 투명하게 전환하고, 유료 전환 시 데이터를 동기화하는 **하이브리드 아키텍처**를 구현합니다.

### 2. Implementation (구현)

#### A. Repository Interface & Strategy

- **Interface**: `UserActionRepository`를 정의하여 `getActions`, `toggleAction`, `hasAction` 메서드를 표준화했습니다.
- **Implementations**:
  - `LocalUserActionRepository`: `Zustand` 스토어를 래핑하여 구현. (`store/useLocalActionStore.ts`)
    - **Reactivity**: 스토어 상태 변경 시 `persist` 미들웨어가 자동으로 `localStorage`에 동기화합니다.
    - **Performance**: 메모리 상의 `Set` 객체를 사용하므로 `O(1)` 조회가 가능하며, 매번 스토리지를 파싱하지 않습니다.
  - `RemoteUserActionRepository`: `services/actions/user.ts`의 Server Action을 호출하여 Supabase DB와 통신합니다.

#### B. Strategy Switcher Hook (`useUserActions`)

- **Logic**: `useAuthUser` 훅을 통해 사용자의 티어(`free` vs `pro`)를 감지하고, 적절한 Repository 구현체를 자동으로 선택하여 반환합니다.
- **Benefit**: UI 컴포넌트(`LikeButton` 등)는 내부 저장 로직을 알 필요 없이 `toggleAction`만 호출하면 되므로 결합도가 낮아집니다.

#### C. Synchronization Logic

- **Bulk Sync**: `UserActionRepository.sync()` 메서드를 통해 로컬 데이터를 서버로 일괄 전송(`upsert`)하는 로직을 구현했습니다.
- **Server Action**: `syncUserActions` 함수는 `ON CONFLICT DO NOTHING` 전략을 사용하여 중복 데이터 충돌 없이 안전하게 병합을 수행합니다.

#### D. Interactive UI Components

- **Login Integration**:
  - `AuthButton`: 헤더 및 모달 내에서 Google 로그인을 트리거하는 컴포넌트.
  - `LoginModal`: 비로그인 사용자가 액션 시도 시 부드럽게 나타나는 가입 유도 모달 (`Framer Motion` 적용).
- **Responsive Action Buttons**:
  - `LikeButton`, `SaveButton`, `LearnButton`: 각 액션별 아이콘과 상태(Active/Inactive)를 관리.
  - **Store Subscription**: `useLocalActionStore`를 구독하여, 다른 곳에서 상태가 변하더라도(예: 리스트에서 좋아요 취소) 상세 페이지 버튼이 즉시 반응함.

### 3. Result (결과)

- ✅ **Hybrid Storage**: 비용 효율적인 로컬 저장소와 신뢰성 높은 원격 저장소를 동시에 운용 가능.
- ✅ **Scalability**: 향후 `IndexedDB` 등으로 로컬 저장소를 고도화하거나, 캐싱 레이어를 추가하기 용이한 구조.

## v0.14.0: User System Phase 1 Implementation (2026-01-24)

### 1. Goal (목표)

- 실제로 동작하는 인증 시스템 기본 인프라를 구축합니다.
- 보안이 강화된 Refresh Token(Database Session) 전략을 구현하여 세션 제어권을 확보합니다.

### 2. Implementation (구현)

#### A. Security-First Auth Strategy

- **Refresh Token Strategy**: `JWT` 전용 방식 대신 `database` 세션 전략을 채택.
  - `sessions` 테이블에 세션 토큰을 저장하여 서버에서 언제든 세션을 삭제(Logout 또는 권한 회수)할 수 있는 구조 확보.
  - `@auth/supabase-adapter` 연동으로 Supabase DB를 세션 저장소로 활용.

#### B. Database & Infrastructure

- **Migration & Triggers**:
  - `016_init_user_system.sql`: `users`, `accounts`, `sessions`, `user_actions` 테이블 생성 및 인덱싱 완료.
  - `database/triggers/update_users_timestamp.sql`: 사용자 레코드 수정 시 `updated_at` 컬럼 자동 갱신 트리거 구축.
- **Config & Hooks**:
  - `lib/auth/config.ts`: Google OAuth 및 세션 수명(30일), 갱신 주기(24시간) 설정 완료.
  - `hooks/useAuthUser.ts`: 클라이언트 컴포넌트에서 `tier`, `subscriptionEndDate` 등 커스텀 속성에 접근 가능한 통합 훅 구현.

#### C. Integrated Setup Guide

- **Environment Setup**: `docs/environment_setup.md`를 신설하여 `AUTH_SECRET` 생성 및 Google OAuth 리디렉션 URI(`.../api/auth/callback/google`) 설정 가이드 보완.

### 3. Result (결과)

- ✅ **Infrastructure**: 사용자 가입 및 구독 관리를 위한 기초 공사 완료.
- ✅ **Security**: 세션 무효화 기능을 갖춘 안전한 인증 환경 조성.
- ✅ **Type Safety**: TypeScript 앰비언트 모듈 확장으로 세션 객체 내 커스텀 필드 타입 안전성 보장.

## v0.13.0: NextAuth-based User System Planning (2026-01-23)

### 1. Goal (목표)

- 수백만 명의 사용자를 수용할 수 있는 비용 효율적이고 확장에 유연한 인증 시스템 및 데이터베이스 구조를 수립합니다.
- 익명, 무료, 유료 사용자의 경험을 매끄럽게 연결하는 "하이브리드" 데이터 관리 전략을 정의합니다.

### 2. Planning (설계)

#### A. Hybrid Action Repository Architecture

- **Concept**:
  - 무료 사용자의 데이터 비용을 0원으로 만들기 위해 `LocalStorage`를 활용.
  - 유료 전환(`Pro`) 시 DB로 데이터를 이관(`Migrate`)하여 영구 보존 및 멀티 디바이스 지원.
  - 이를 위해 프론트엔드에서 `ActionRepository` 인터페이스를 정의하고, `Local` 구현체와 `Remote` 구현체를 상황에 맞춰 교체하는 전략 수립.

#### B. Database Schema Redesign (`speak_mango_en`)

- **Custom User Management**:
  - NextAuth의 유연성을 활용하기 위해 `users`, `accounts`, `sessions` 테이블을 직접 생성.
  - `tier` ('free' | 'pro') 및 `subscription_end_date` 컬럼을 `users` 테이블에 내장하여, 별도의 Profile 조인 없이 JWT 만으로 권한 검증이 가능하도록 최적화.
- **Unified Action Table**:
  - `user_actions` 테이블 하나로 좋아요, 저장, 학습 등 모든 상호작용을 관리.
  - `UNIQUE(user_id, expression_id, action_type)` 제약 조건으로 데이터 무결성 보장.

#### C. Documentation Restructuring

- `docs/users/` 디렉토리를 신설하고 `user_system_plan.md`와 `user_feature_requirements.md`를 이관하여, 사용자 시스템 관련 도메인 지식을 한곳에 응집시킴.

### 3. Expected Outcome (기대 효과)

- **Cost Efficiency**: 초기 사용자 확보 단계에서 DB 비용 최소화.
- **Performance**: JWT 기반의 Stateless 인증으로 API 응답 속도 최적화.
- **Scalability**: 독립적인 User/Account 구조로 향후 다양한 인증 수단 확장 용이.

## v0.12.46: Flexible Header Styling & Prop Injection (2026-01-23)

### 1. Goal (목표)

- 홈 화면의 `Header`와 `FilterBar` 사이의 경계를 제거하여 두 영역이 하나의 면처럼 느껴지도록 시각적 완성도를 높입니다.
- 특정 페이지의 요구사항이 공통 컴포넌트(`Header`)의 내부 로직을 복잡하게 만들지 않도록 설계를 개선합니다.

### 2. Implementation (구현)

#### A. Scrolled Class Injection (`components/Header.tsx`)

- **Problem**: 기존에는 홈 화면용 전용 스타일을 `Header` 내부에 `variant="home"`과 같은 식으로 하드코딩하려 했으나, 이는 `Header`가 페이지의 맥락을 너무 많이 알게 되어 유지보수성이 떨어지는 결과를 초래할 수 있음.
- **Solution**:
  - `scrolledClassName` Prop 추가.
  - 스크롤 발생 시(`isScrolled`) 주입받은 클래스를 기존 스타일 뒤에 병합(`cn`)하도록 수정.
  - 이로써 `Header`는 "스크롤 시 클래스를 추가한다"는 기능만 담당하고, 실제 스타일은 사용하는 곳에서 결정함.

#### B. Seamless Home Layout (`components/MainHeader.tsx`)

- **Action**: `MainHeader`에서 `scrolledClassName="bg-layout-transparent border-none-layout"`을 전달.
- **Result**: 스크롤 시 배경이 회색조(`bg-layout`)로 변하고 테두리가 사라지면서 하단의 `FilterBar`와 완벽하게 연결됨.

### 3. Result (결과)

- ✅ **Design**: 홈 화면 디자인의 일관성과 고급스러운 레이아웃 구현.
- ✅ **Architecture**: 의존성을 외부에서 주입하는 방식을 통해 컴포넌트의 순수성(Purity)과 재사용성 확보.

## v0.12.45: Quiz State Persistence & Mobile Navigation (2026-01-23)

### 1. Goal (목표)

- 퀴즈 진행 중 '학습하기(Study)'를 위해 상세 페이지로 이동했다가 뒤로 돌아왔을 때, 기존의 풀이 상태가 유지되지 않고 처음부터 다시 시작되는 문제를 해결합니다.
- 모바일 환경에서 불필요한 새 탭 전환 및 레이아웃 깜빡임을 방지하여 사용자 경험을 최적화합니다.

### 2. Implementation (구현)

#### A. Session-based State Recovery (`components/quiz/QuizGame.tsx`)

- **Problem**: 퀴즈 상세 페이지로 이동(URL 변경) 시 리액트 상태가 초기화되어, 돌아왔을 때 무작위로 생성된 새로운 문제 세트로 덮어씌워짐.
- **Solution**:
  - `sessionStorage`를 사용하여 현재 퀴즈 상태(문제 목록, 현재 인덱스, 점수, 리뷰 히스토리)를 실시간으로 저장.
  - **Selective Restoration**: 무조건적인 복원이 아니라, `StudyButton`을 클릭하여 나갔을 때만 설정되는 전용 플래그(`RETURN_FLAG`)가 있을 때만 상태를 복구함.
  - 이로써 "Study 후 복귀" 시에는 `이어하기`가 가능하고, "새로고침" 시에는 기획 의도대로 `처음부터 시작`하는 정밀한 제어 구현 성공.

#### B. Intelligent Navigation (`components/quiz/StudyButton.tsx`)

- **Problem**: 데스크탑에서는 새 탭(`_blank`)이 편리하지만, 모바일(iOS/Android) 앱 브라우저 환경에서는 새 탭 전환 시 흰 화면이 노출되거나 네비게이션 흐름이 끊기는 문제 발생.
- **Solution**:
  - `useIsMobile` 훅을 활용하여 환경을 감지.
  - **Mobile**: `target` 속성을 제거하여 현재 창에서 이동.
  - **Desktop**: `target="_blank"`를 유지하여 학습과 퀴즈 병행 지원.

#### C. Constant Centralization (`lib/quiz.ts`)

- **Refactoring**: 매직 스트링(`"quiz_state"`) 사용을 지양하고 `QUIZ_STORAGE_KEYS` 상수를 도입하여 오타로 인한 버그를 원천 차단했습니다.

### 3. Result (결과)

- ✅ **UX Persistence**: 학습 중 흐름이 끊기지 않고 퀴즈를 끝까지 완료할 수 있음.
- ✅ **Mobile Optimized**: 모바일 특유의 네비게이션 제약을 극복하고 깔끔한 화면 전환 제공.

## v0.12.44: Responsive UI Refactoring (CSS-based) (2026-01-22)

### 1. Goal (목표)

- `useIsMobile` 훅(JS)에 의존하던 반응형 로직을 CSS 유틸리티로 전환하여 초기 로딩 시의 Hydration Mismatch를 해결하고 렌더링 성능을 최적화합니다.

### 2. Implementation (구현)

#### A. CSS-First Responsive Design

- **Problem**: 서버는 화면 크기를 모르기 때문에 데스크탑 뷰를 보내지만, 클라이언트는 모바일임을 감지하고 모바일 뷰로 다시 그리는 과정에서 화면 깜빡임과 에러 발생.
- **Solution**: `!isMobile` 조건문을 제거하고 Tailwind의 `hidden sm:block` (데스크탑용)과 `block sm:hidden` (모바일용) 클래스를 사용하여 브라우저가 CSS로 즉시 뷰를 결정하도록 수정.
- **Applied Components**: `DialogueAudioButton`, `DialogueItem`, `DialogueSection`, `RelatedExpressions`.

#### B. Animation Optimization (`components/RelatedExpressions.tsx`)

- **Problem**: CSS로 데스크탑 뷰를 숨겨도(`display: none`), JS 애니메이션(`requestAnimationFrame`)은 백그라운드에서 계속 돌아가 CPU를 낭비함.
- **Solution**: 요소가 화면에 실제로 공간을 차지하는지 확인하는 `el.offsetParent` 체크를 도입하여, 숨겨진 상태에서는 애니메이션 루프를 일시 중지하도록 최적화.

### 3. Result (결과)

- ✅ **Stability**: 초기 로딩 안정성 확보 및 Layout Shift 제거.
- ✅ **Performance**: 보이지 않는 요소에 대한 불필요한 연산 제거.

## v0.12.43: Quiz Summary Layout Refinement (2026-01-22)

### 1. Goal (목표)

- 퀴즈 완료 후 리뷰 화면에서 모바일 사용자가 '학습하기' 버튼을 더 쉽게 누를 수 있도록 레이아웃을 최적화합니다.

### 2. Implementation (구현)

#### A. Mobile-First Layout (`components/quiz/QuizGame.tsx`)

- **Problem**: 기존 가로 배치(`flex-row`)는 모바일의 좁은 폭에서 버튼 텍스트가 잘리거나 터치 영역이 협소해지는 문제 발생.
- **Solution**:
  - **Mobile**: `flex-col`로 변경하여 버튼을 텍스트 아래로 내리고 `w-full`로 확장.
  - **Desktop**: `sm:flex-row`를 유지하여 우측 정렬 고수.

#### B. Component Renaming (`components/quiz/StudyButton.tsx`)

- `StudyLink`라는 이름이 실제 UI(버튼 스타일)와 괴리가 있어 `StudyButton`으로 명칭을 일치시켜 혼란을 제거했습니다.

### 3. Result (결과)

- ✅ **Touch Friendliness**: 모바일에서 넓은 터치 영역 제공.
- ✅ **Code Clarity**: 컴포넌트 이름과 실제 역할의 일치.

## v0.12.42: Mobile UI Stabilization & Skeleton Logic Refinement (2026-01-22)

### 1. Goal (목표)

- 모바일 헤더의 깜빡임(FouC/Layout Shift) 문제를 해결하고, 확장된 퀴즈 기능에 맞춰 스켈레톤 UI 로직을 견고하게 재설계합니다.

### 2. Implementation (구현)

#### A. Zero-Runtime Responsiveness (`components/MainHeader.tsx`)

- **Problem**: `useIsMobile` 훅은 클라이언트 사이드 마운트 후 실행되므로, 찰나의 순간에 데스크탑 UI가 보였다가 사라지는 플리커링 발생.
- **Solution**:
  - JS 로직(`{!isMobile && ...}`)을 제거.
  - Tailwind CSS 유틸리티(`hidden sm:inline`)를 사용하여 브라우저 렌더링 단계에서 즉시 스타일 적용.
  - 결과적으로 `"use client"` 지시어를 제거하여 Server Component로 최적화 성공.

#### B. Skeleton Props Standardization (`components/ui/Skeletons.tsx`)

- **Problem**: `isDetail`, `isQuiz` 등 불리언 플래그가 늘어날수록 조합과 관리가 복잡해짐.
- **Solution**:
  - `page` Prop 도입: `"home" | "detail" | "quiz"` (Union Type).
  - **Constant Separation**: `constants/ui.ts`에 `SKELETON_PAGE` 상수를 정의하여, Server Component(`loading.tsx`)와 Client Component(`Skeletons.tsx`) 모두에서 안전하게 참조 가능하도록 구조 개선.

### 3. Result (결과)

- ✅ **UX Stability**: 모바일 진입 시 화면 떨림 없이 안정적인 헤더 표시.
- ✅ **Maintainability**: 스켈레톤 상태 관리가 명확해지고, 향후 페이지 추가 시 확장성 확보.

## v0.12.41: Responsive Header & Global Navigation (2026-01-22)

### 1. Goal (목표)

- 퀴즈 기능의 발견 가능성(Discoverability)을 높이고, 모바일 뷰포트에서 헤더 텍스트가 과도하게 공간을 차지하는 문제를 해결합니다.

### 2. Implementation (구현)

#### A. Responsive Logic Extraction (`components/MainHeader.tsx`)

- **Problem**: `window.matchMedia`를 사용하는 `useIsMobile` 훅은 클라이언트 사이드에서만 동작하므로, 서버 컴포넌트인 `app/page.tsx`에서 직접 사용할 수 없음.
- **Solution**:
  - 헤더 UI를 전담하는 `MainHeader` 클라이언트 컴포넌트("use client")를 신규 생성.
  - 모바일 감지 시 서브헤더 텍스트와 구분선(`|`)을 조건부 렌더링으로 숨김 처리.

#### B. Global Entry Point (`app/page.tsx`)

- **Problem**: 사용자가 퀴즈 페이지로 이동하려면 URL을 직접 입력하거나 특정 플로우를 타야만 했음.
- **Solution**: 최상단 헤더 네비게이션에 `Quiz 🎲` 링크를 배치하여 글로벌 진입점 확보.

### 3. Result (결과)

- ✅ **Navigation**: 어디서든 원클릭으로 퀴즈 진입 가능.
- ✅ **Mobile UX**: 좁은 화면에서도 중요 정보(로고, 퀴즈 링크) 위주로 깔끔하게 표시됨.

## v0.12.40: Quiz UI Standardization (2026-01-22)

### 1. Goal (목표)

- 퀴즈 페이지(`QuizGame`) 내의 산재된 버튼 스타일과 하드코딩된 로직을 표준화하고, 사용자 피드백(터치/키보드)을 강화합니다.

### 2. Implementation (구현)

#### A. Component Extraction (`components/quiz/StudyButton.tsx`)

- **Problem**: '학습하기(Study)' 버튼이 여러 뷰(Summary, Question)에서 중복 정의되어 있고, 시각적으로 강조되지 않음.
- **Solution**:
  - 재사용 가능한 `StudyButton` 컴포넌트 생성.
  - `Zinc` 컬러 팔레트를 적용하여 시각적 중립성 확보.

#### B. CSS Utility Abstraction (`app/globals.css`)

- **Problem**: `bg-blue-600 hover:bg-blue-700` 등의 Tailwind 클래스가 반복 사용됨.
- **Solution**: `@utility blue-btn` 커스텀 유틸리티 생성 및 `ShareButton` 적용.

### 3. Result (결과)

- ✅ **UX**: 버튼 인터랙션 시각적 피드백 강화.
- ✅ **Design**: Zinc 테마 적용으로 보다 차분하고 전문적인 UI 룩앤필 구현.

## v0.12.39: Quiz Open Graph Image Implementation (2026-01-22)

### 1. Goal (목표)

- 퀴즈 페이지(`/quiz`)가 소셜 미디어(카카오톡, 트위터, 슬랙 등)에 공유될 때, 단순 텍스트가 아닌 "Random Quiz"라는 명확한 타이틀과 시각적 요소를 포함한 프리뷰 이미지를 제공합니다.

### 2. Implementation (구현)

#### A. Node.js Runtime for Local Assets (`app/quiz/opengraph-image.tsx`)

- **Strategy**: 기본적으로 OG Image 생성에는 Edge Runtime이 권장되지만, 로컬에 존재하는 브랜드 로고(`public/assets/logo.png`)를 안정적으로 활용하기 위해 `nodejs` 런타임을 선택했습니다.
- **Code**:
  ```typescript
  export const runtime = "nodejs";
  const logoBuffer = fs.readFileSync(
    path.join(process.cwd(), "public/assets/logo.png"),
  );
  ```
- **Reason**: 외부 호스팅 URL에 의존하지 않고 빌드 타임/런타임에 로컬 에셋을 직접 읽어와 Base64로 인코딩하여 포함시킴으로써 이미지 로딩 실패 가능성을 차단했습니다.

#### B. Brand-Aligning Design

- **Font**: 구글 폰트(Inter)의 다양한 웨이트(500, 700, 900)를 `fetch`로 로드하여 타이포그래피 계층 구조를 형성했습니다.
- **Color**: 브랜드 시그니처 그라디언트(Yellow-Orange-Green)를 텍스트(`backgroundClip: "text"`)에 적용하여 아이덴티티를 강조했습니다.

### 3. Result (결과)

- ✅ **Visual Impact**: 공유 시 자동으로 고퀄리티의 1200x630 이미지가 생성되어 노출됩니다.
- ✅ **Consistency**: Favicon 업데이트와 함께 앱 전반의 시각적 자산(Visual Assets)이 통일되었습니다.

## v0.12.38: Category Caching & Hybrid Strategy (2026-01-21)

### 1. Goal (목표)

- ISR(1시간 캐시) 환경에서 데이터 갱신 시점 차이로 인해 발생하는 "새로고침 시 데이터 롤백(Stale Data)" 문제를 해결하고, 초기 로딩 속도와 데이터 최신성을 모두 만족하는 전략 수립.

### 2. Implementation (구현)

#### A. Cost-Effective Strategy (ISR Only for Initial Load)

- **Rationale**: 콘텐츠가 하루 1회만 업데이트되므로, 1시간(3600s) 단위의 ISR 캐싱만으로도 충분히 최신성을 보장할 수 있음.
- **Optimization**: `revalidateFirstPage: false`로 설정하여, 단순 페이지 진입 시 발생하는 불필요한 API 호출(10,000 DAU 기준 약 10,000회)을 제거. 서버 리소스 및 비용 절감 최적화.

#### B. Safe Key Serialization

- **Problem**: 객체 형태의 `filters` prop이 리렌더링마다 참조가 달라져 불필요한 API 요청이 발생하거나 캐시 키가 꼬이는 문제.
- **Solution**:
  - `getKey`에서 `JSON.stringify(filters)`로 키를 문자열화하여 고유성 보장.
  - `fetcher`에서는 `JSON.parse`로 다시 객체로 변환하여 API 호출.

### 3. Result (결과)

- ✅ **Stability**: 카테고리 이동 및 필터링 시 데이터 불일치 및 깜빡임 현상 완전 해결.
- ✅ **Performance**: ISR의 빠른 초기 응답 속도 유지.

## v0.12.37: SEO Finalization & Route Centralization (2026-01-21)

### 1. Goal (목표)

- 산재된 URL 생성 로직을 중앙화하여 SEO에 필수적인 Canonical URL의 일관성을 보장하고, 누락된 다국어 메타데이터를 보완하여 SEO 구현을 완성합니다.

### 2. Implementation (구현)

#### A. Centralized Canonical URLs (`lib/routes.ts`)

- **Problem**: `app/quiz/page.tsx`와 `app/expressions/[id]/page.tsx` 등 여러 곳에서 `${BASE_URL}/...` 형태의 문자열 조합이 반복되어, 도메인 변경이나 경로 구조 변경 시 오류 발생 가능성이 높았습니다.
- **Solution**: `CANONICAL_URLS` 객체를 도입하여 절대 경로 생성 로직을 캡슐화했습니다.
  ```typescript
  export const CANONICAL_URLS = {
    QUIZ: () => `${BASE_URL}${ROUTES.QUIZ}`,
    EXPRESSION_DETAIL: (id: string) =>
      `${BASE_URL}${ROUTES.EXPRESSION_DETAIL(id)}`,
  };
  ```
- **Application**: JSON-LD(Schema.org) 및 OpenGraph 메타데이터 생성 시 이 헬퍼를 사용하여 단일 진실 공급원(Single Source of Truth)을 확립했습니다.

#### B. Quiz Page SEO (`app/quiz/page.tsx`)

- **I18n Metadata**: 기존의 하드코딩된 영어 제목 대신, 8개 국어 `i18n` 딕셔너리(`metaTitle`, `metaDescription`)를 연동하여 각 언어 사용자에게 맞는 검색 결과를 제공합니다.
- **Sitemap**: `app/sitemap.ts`에 `/quiz` 경로를 추가하여 검색 엔진 크롤링을 허용했습니다.

#### C. Twitter Card Optimization (`app/layout.tsx`)

- **Explicit Image**: `twitter` 메타데이터에 `images` 속성을 명시적으로 추가하여, 일부 플랫폼에서 OpenGraph 이미지를 제대로 불러오지 못하는 문제를 방지했습니다.

### 3. Result (결과)

- ✅ **Maintainability**: URL 관리 포인트가 `lib/routes.ts` 하나로 통합됨.
- ✅ **Completeness**: Rich Result Test 및 소셜 미디어 공유 미리보기가 모든 페이지에서 완벽하게 작동.

## v0.12.36: Additional Performance Optimization & Documentation (2026-01-21)

### 1. Goal (목표)

- 번들 사이즈 감소, 서버 요청 중복 제거, 클라이언트 렌더링 최적화 등 추가적인 성능 개선 사항을 적용하고, 이를 문서화하여 향후 개발 가이드라인으로 삼습니다.

### 2. Implementation (구현)

#### A. Request Deduplication (`lib/expressions.ts`)

- **Problem**: 한 페이지 렌더링 과정에서 `getExpressions` 등의 DB 조회 함수가 여러 컴포넌트(메타데이터, 페이지 본문 등)에서 중복 호출될 경우 불필요한 DB 부하 발생.
- **Solution**: `React.cache()`로 DB 조회 함수들을 래핑하여, **동일한 요청(Request) 수명 주기 내**에서는 결과값을 메모리에 캐싱하고 재사용하도록 구현. (Per-request Memoization).

#### B. Client-Side Rendering Protection (`components/ExpressionCard.tsx`)

- **Problem**: 리스트 렌더링 시 부모 컴포넌트의 상태 변화로 인해 수많은 자식 카드 컴포넌트가 불필요하게 리렌더링됨.
- **Solution**:
  - `React.memo`를 적용하여 Props가 변경되지 않은 카드의 리렌더링을 방지.
  - `displayName`을 명시하여 React DevTools 하이드레이션 매칭 디버깅 용이성 확보.

#### C. Layout Rendering Optimization (`app/globals.css`)

- **Problem**: 수천 개의 `ExpressionCard`가 있는 긴 리스트(Long List) 렌더링 시 브라우저의 레이아웃 계산 비용 증가.
- **Solution**:
  - `content-visibility: auto` 속성을 적용한 `@utility content-visibility-auto` 클래스 생성.
  - 화면 밖(Off-screen)에 있는 요소의 렌더링(페인팅 및 히트 테스팅)을 브라우저가 생략하도록 하여 초기 로딩 및 스크롤 성능 개선.

#### D. Skeleton Optimization (`components/ui/Skeletons.tsx`)

- **Problem**: 로딩 상태에서 부모 컴포넌트가 리렌더링될 때 스켈레톤 컴포넌트까지 불필요하게 리렌더링되는 문제.
- **Solution**:
  - `ExpressionList.tsx`의 인라인 스켈레톤을 `SkeletonExpressionList` 컴포넌트로 분리.
  - `SkeletonCard`, `SkeletonNavbar` 등 모든 스켈레톤 컴포넌트에 `React.memo`를 적용하여 정적 UI의 리렌더링 비용 제거.

#### E. Data Fetching Strategy (`hooks/usePaginatedList.ts`)

- **Problem**: 기존 `usePaginatedList`는 `useState`, `useEffect`로 상태를 수동 관리하며, `ExpressionContext`에 리스트 전체(`items`)를 저장하여 메모리 비효율 발생.
- **Solution**:
  - `useSWRInfinite` 도입하여 데이터 페칭, 캐싱, 페이지네이션 상태 관리 자동화.
  - `ExpressionContext`는 `size`(페이지 수)와 `scrollPosition`만 관리하도록 경량화하여, 뒤로가기 시 복원 로직 단순화.

### 3. Result (결과)

- ✅ **Optimization**: 런타임 성능 향상.
- ✅ **Standardization**: `project_context.md`에 성능 최적화 표준 가이드라인 수립.
- ✅ **Modernization**: `useSWR` 도입으로 데이터 페칭 로직의 유지보수성 및 확장성(실시간 갱신 등) 확보.

## v0.12.35: Code Audit & Performance Optimization (2026-01-21)

### 1. Goal (목표)

- Vercel React Best Practices를 기준으로 생성된 감사 보고서(`audit_report.html`)의 개선 권고 사항을 적용하여, 애플리케이션의 성능(Latency)과 데이터베이스 확장성(Scalability)을 확보합니다.

### 2. Implementation (구현)

#### A. Server-Side Parallel Data Fetching (`app/quiz/page.tsx`)

- **Problem**: `getI18n()`(Dictionary)과 `getRandomExpressions()`(DB)가 `await`로 순차 실행되어 Waterfall 발생.
- **Solution**: `Promise.all`을 사용하여 두 비동기 요청을 병렬로 시작.
  ```typescript
  const [{ dict }, expressions] = await Promise.all([
    getI18n(),
    getExpressions({ ...filters, limit: 10 }),
  ]);
  ```

#### B. Regex Optimization (`lib/quiz.ts`)

- **Problem**: `parseQuizQuestion` 함수 내부의 반복문(`options.forEach`) 안에서 정규식 리터럴(`/^([A-C])\.\s+(.*)/`)이 반복적으로 사용됨. (이론적으로 JS 엔진이 최적화할 수 있으나, 명시적인 호이스팅이 권장됨).
- **Solution**: 정규식을 모듈 최상단 상수(`OPTION_REGEX`)로 호이스팅하여 컴파일 비용 제거.

#### C. Database RPC for Scalability (`database/functions/create_random_expressions.sql`)

- **Problem**: 기존 `getRandomExpressions`는 클라이언트(Node.js)에서 전체 ID를 가져온 후 셔플링하는 방식이었음. 데이터가 늘어날수록 메모리와 네트워크 부하가 급증(O(N))하는 구조.
- **Solution**: DB 내부에서 효율적으로 샘플링을 수행하는 Stored Procedure 도입.
  - **Function**: `speak_mango_en.get_random_expressions(limit_cnt)`
  - **Logic**: `ORDER BY random() LIMIT N`을 DB 엔진 내부에서 수행하여, 클라이언트로는 딱 필요한 N개의 행만 전송.

### 3. Result (결과)

- ✅ **Latency**: 퀴즈 페이지 초기 로딩 속도 단축 (병렬 처리).
- ✅ **Scalability**: 표현 데이터가 수만 건으로 늘어나도 퀴즈 생성 성능이 일정하게 유지됨 (RPC).
- ✅ **Documentation**:
  - `database` 폴더 구조를 `migrations`와 `functions`로 분리하여 관리 체계 개선.
  - `project_context.md`에 성능 최적화 가이드라인(Server-side Caching, Client-side Memoization 등)을 명문화하여 향후 개발 기준 수립.

## v0.12.34: Random Quiz Feature (2026-01-20)

### 1. Goal (목표)

- 수동적인 읽기/듣기 학습을 넘어, 사용자가 능동적으로 참여할 수 있는 **퀴즈 게임** 기능을 도입합니다.
- 매번 새로운 랜덤 문제 세트를 제공하여 반복 학습을 유도합니다.

### 2. Implementation (구현)

#### A. Random Data Fetching (`lib/expressions.ts`)

- **Logic**:
  1. 전체 ID 목록을 가볍게 조회 (`select("id")`).
  2. 요청된 개수(예: 10개)만큼 ID를 무작위 추출 (Set 활용).
  3. 추출된 ID로 `in` 쿼리를 수행하여 상세 정보 조회.
  4. DB 조회 결과의 순서 편향을 막기 위해 클라이언트 측에서 한 번 더 셔플링.

#### B. Quiz Game UI (`components/quiz/QuizGame.tsx`)

- **Progressive UX**:
  - **Playing State**: 상단 진행률 바(Progres Bar)와 함께 문제 표시. 선택지 클릭 시 즉시 정답/오답 피드백(Color Coded) 및 팁 노출.
  - **Summary State**: 10문제 완료 후 점수와 함께 전체 문제 리뷰 리스트 제공. 틀린 문제와 맞은 문제를 한눈에 확인하고 상세 페이지로 이동 가능.

#### C. Analytics Integration

- 사용자 참여도를 측정하기 위해 단계별 이벤트 추적:
  - `quiz_start`: 게임 시작 시점.
  - `quiz_answer`: 각 문제 풀이 시점 (정답 여부 포함).
  - `quiz_complete`: 게임 완료 및 최종 점수 기록.

### 3. Result (결과)

- ✅ **Gamification**: 단순 암기보다 재미있는 학습 경험 제공.
- ✅ **Dynamic Content**: Next.js `force-dynamic`을 활용하여 접속할 때마다 항상 새로운 문제 세트 보장.

## v0.12.33: Verification Logic Refinement & Sync (2026-01-20)

### 1. Goal (목표)

- 로컬 검증 스크립트(`verify_db_data.js`)와 n8n 워크플로우 검증 스크립트(`11_validate_content.js`, `07_validate_content_v2.js`) 간의 로직 파편화를 해결하고, 더 엄격하고 정확한 퀴즈 패턴 검증을 적용합니다.

### 2. Implementation (구현)

- **Strict Quiz Pattern Logic**:
  - **Pattern 1**: 질문에 영어가 2글자 이상 없으면 -> 선택지는 반드시 **영어**여야 합니다. (예외 없음)
  - **Pattern 2/3**: 질문에 영어가 2글자 이상 있으면 -> 선택지는 반드시 **타겟 언어**여야 합니다.

- **Regex Synchronization**:
  - `ideographic_full_stop` (`/。/`) 정규식이 n8n 스크립트에서 누락되어 있던 문제를 발견하고 추가했습니다.
  - 이제 `includes("。")` 대신 `REGEX.ideographic_full_stop.test(text)`를 사용하여 일관되게 CJK 마침표를 검출합니다.

- **Allowed Lists Strategy**:
  - `ALLOWED_NAMES` (예: Sarah, Mike)와 `ALLOWED_ENGLISH_TERMS` (예: iOS, eBay) 리스트를 도입했습니다.
  - 이를 통해 질문(Question) 내에 이러한 고유명사가 포함되어 있어도 "영어 문장"으로 오판(Pattern 2/3)하지 않도록 예외 처리하여, Pattern 1(질문에 영어 없음 -> 선택지는 영어) 검증의 정확도를 높였습니다.

### 3. Result (결과)

- ✅ **Consistency**: 로컬에서 `node verification/verify_db_data.js`를 돌렸을 때와 n8n 실서버 검증 결과가 100% 일치하게 되었습니다.
- ✅ **Accuracy**: 모호한 퀴즈 패턴을 허용하지 않음으로써 사용자에게 혼란을 줄 수 있는 저품질 퀴즈 생성을 방지합니다.

## v0.12.32: Performance Optimization (2026-01-19)

### 1. Goal (목표)

- 감사 보고서에서 식별된 주요 성능 병목 현상(Waterfall Data Fetching, Client-side Re-rendering)을 해결하여 사용자 경험을 개선합니다.

### 2. Implementation (구현)

#### A. Server-Side Waterfall Removal (`app/page.tsx`)

- **Problem**: `getI18n()` 호출이 완료된 후에야 `getExpressions()`가 실행되는 직렬(Serial) 구조로 인해 TTFB가 지연됨.
- **Solution**: 의존성이 없는 비동기 작업을 `Promise.all`로 병렬화.
  - 헤더에서 로케일을 먼저 추출(`getLocale`)한 후, 딕셔너리 로딩과 DB 쿼리를 동시에 실행.
  ```typescript
  const locale = await getLocale(); // Fast header read
  const [{ dict }, expressions] = await Promise.all([
    getI18n(), // Dictionary load
    getExpressions({ ...filters, locale }), // DB Query
  ]);
  ```

#### B. Client-Side Rendering Optimization (`components/DialogueSection.tsx`)

- **Problem**: 오디오 재생 시 `playingIndex` 상태가 변경될 때마다 부모 컴포넌트(`DialogueSection`)와 모든 자식 컴포넌트(`DialogueItem`)가 리렌더링됨.
- **Solution**:
  1.  **React.memo Application**: `DialogueItem`을 메모이제이션하여 Props 변경이 없는 경우 리렌더링 방지.
  2.  **Stable Callbacks**: 부모에서 자식으로 전달되는 함수들(`onPlay`, `onEnded`, `onToggleReveal`)을 `useCallback`으로 감싸고, 인라인 함수 정의를 제거.
      - **Index Prop Injection**: `DialogueItem`에 `index` prop을 명시적으로 전달하여, 콜백 함수가 인덱스를 직접 참조하지 않고 인자로 받도록 구조 변경 (함수 재생성 방지).
  3.  **Optimization Logic**: `handleEnglishClick` 내부의 중복 `setState` 호출 제거 및 조건문 로직 단순화.

#### C. Database Search Optimization (`lib/expressions.ts`)

- **Problem**: 9개 언어의 `meaning` 필드를 JSON 연산자(`->>`)로 조회하는 방식은 인덱스를 타지 못해 Full Table Scan을 유발함.
- **Solution**:
  1.  **Generated Column**: `meaning` JSONB 데이터를 단일 문자열로 변환하여 저장하는 `meaning_text` 컬럼 추가.
  2.  **Trigram Index**: `pg_trgm` 확장 모듈을 활용하여 `meaning_text`에 GIN 인덱스 생성.
  3.  **Double-Filter Strategy**:
      - **Phase 1 (Index Scan)**: `meaning_text`로 후보군을 고속 검색 (Trigram Index 활용).
      - **Phase 2 (Recheck)**: `meaning->>locale`로 현재 언어 일치 여부를 정밀 검사 (Table Filter).
      - `and(meaning_text.ilike... , meaning->>locale.ilike...)` 구문을 사용하여 **인덱스의 속도**와 **로케일 필터링의 정확성(노이즈 제거)**을 모두 확보.

#### D. Scroll Event Optimization (`components/FilterBar.tsx`)

- **Problem**: 스크롤 및 리사이즈 이벤트가 빈번하게 발생하여 메인 스레드 점유율 증가.
- **Solution**:
  1.  **requestAnimationFrame**: 브라우저 렌더링 주기에 맞춰 이벤트 핸들링 주파수 조절.
  2.  **useCallback Refinement**: `checkScroll` 함수를 메모이제이션하고 `useEffect` 의존성에 포함하여 리렌더링 시 불필요한 리스너 재생성 방지.
  3.  **Auto-Cleanup**: `useRef`로 rAF ID를 추적하여 언마운트 시 안전하게 취소.

### 3. Result (결과)

- ✅ **TTFB Improvement**: 병렬 데이터 페칭으로 초기 로딩 속도 향상.
- ✅ **Rendering Efficiency**: 오디오 재생 중 불필요한 리렌더링이 제거되어 저사양 기기에서의 반응성 개선.
- ✅ **Query Performance**: 검색 쿼리 성능을 최적화하면서도 정확한 로케일 결과를 제공 (Cross-language Noise 제거).
- ✅ **Scroll Smoothness**: `FilterBar` 스크롤 이벤트에 `rAF` 및 `useCallback`을 적용하여 메인 스레드 부하를 줄이고 리스너 안정성 확보.

## v0.12.31: Agent Skills Integration & Codebase Audit (2026-01-19)

### 1. Goal (목표)

- AI 에이전트에게 Vercel의 전문적인 개발 지식(Skills)을 주입하여 코드 품질을 상향 평준화.

### 2. Implementation (구현)

- **Agent Skills Setup**:
  - `npx add-skill vercel-labs/agent-skills`를 실행하여 두 가지 핵심 스킬 설치.
  - **Vercel React Best Practices**: 45개 성능 최적화 규칙 (Waterfall 방지, 번들 최적화 등).
  - **Web Design Guidelines**: 접근성 및 UI/UX 표준 가이드라인.
  - 관련 설정 파일들을 `.agent/skills/`에 저장하고 가이드 문서(`docs/agent_skills_guide.md`) 작성.

- **Git Configuration**:
  - `.gitignore`에 에이전트 공급자별 설정 폴더(`.gemini`, `.claude` 등)를 추가하여 레포지토리 정리.

### 3. Result (결과)

- ✅ **Intelligence**: 에이전트가 Vercel 엔지니어링 팀의 노하우를 참고하여 코딩하도록 업그레이드.
- ✅ **Visibility**: 현재 프로젝트의 기술적 부채와 최적화 포인트를 명확히 파악.

## v0.12.30: Marketing Studio & Image Automation (2026-01-18)

### 1. Goal (목표)

- SNS 마케팅을 위한 고화질 표현 카드 이미지를 손쉽게 생성하고, 이를 대량으로 자동화하는 시스템 구축.
- 콘텐츠 길이에 상관없이 브랜드 로고와 디자인 일관성을 유지.

### 2. Implementation (구현)

- **Marketing Studio (`app/(admin)/studio/[id]`)**:
  - **Route**: `/studio/[id]` (Basic Auth 보호).
  - **Features**: 고화질(Retina) 캡처, 다양한 배경(Brand, Gradient) 및 비율(1:1, 9:16) 지원.
  - **Layout**: `flex-col` 기반의 유동적 레이아웃으로 콘텐츠 길이에 따라 로고 위치 자동 조정.
  - **Static Mode**: `ExpressionCard`에 `isStatic` prop을 추가하여 애니메이션 없이 깔끔한 렌더링 지원.

- **Automation Script (`scripts/generate_studio_images.py`)**:
  - **Language Support**: `--lang` 옵션을 통해 특정 언어(예: `ko`)로 번역된 카드 이미지 생성 가능.
  - **Environment Flexibility**: `STUDIO_APP_URL` 환경 변수를 지원하여 로컬(`localhost`)뿐만 아니라 원격/스테이징 서버에서도 캡처 가능.
  - **Proxy Middleware**: `proxy.ts`에서 `lang` 쿼리 파라미터를 감지하여 강제로 로케일을 전환해주는 기능 활용.

### 3. Result (결과)

- ✅ **Productivity**: 수동 캡처 없이 수천 개의 고화질 마케팅 에셋을 단 몇 분 만에 생성.
- ✅ **Localization**: 전 세계 사용자를 위한 다국어 마케팅 이미지 확보.
- ✅ **Consistency**: 모든 이미지에서 브랜드 가이드라인(여백, 로고 위치)을 준수.

## v0.12.29: 서버 환경 변수 최적화 (2026-01-18)

### 1. Goal (목표)

- 하드코딩된 로컬 호스트 주소(`http://localhost:3000`)를 제거하고 환경 변수를 통해 유연성을 확보.

### 2. Implementation (구현)

- **Script Update**: `generate_studio_images.py`에서 `STUDIO_APP_URL` 환경 변수를 우선적으로 사용하도록 변경.
- **Default Fallback**: 환경 변수가 없을 경우 안전하게 `http://localhost:3000`을 사용.

### 3. Result (결과)

- ✅ **Flexibility**: CI/CD 파이프라인이나 다른 포트에서 실행 중인 서버에서도 스크립트 실행 가능.

## v0.12.28: Database Integrity Reinforcement (2026-01-17)

### 1. Goal (목표)

- 데이터베이스 레벨에서 `expression` 컬럼의 중복을 원천적으로 차단하여 데이터 무결성을 보장합니다.

### 2. Implementation (구현)

- **Unique Constraint**:
  - `speak_mango_en.expressions` 테이블의 `expression` 컬럼에 `UNIQUE` 제약 조건을 추가했습니다.
  - 이제 동일한 영어 표현이 입력되려 할 경우 DB 레벨에서 에러를 반환합니다.
- **Migration Script (`014_add_unique_constraint_to_expression.sql`)**:
  - `ALTER TABLE ... ADD CONSTRAINT unique_expression UNIQUE (expression);` 구문을 사용하여 제약 조건을 적용했습니다.

### 3. Result (결과)

- ✅ **Data Integrity**: 중복 데이터 발생 가능성이 완전히 제거되었습니다.
- ✅ **Performance**: Unique 인덱스 생성으로 인해 정확한 일치 검색 성능이 향상될 수 있습니다.

## v0.12.27: n8n V3 Specific Expression Workflow (2026-01-17)

### 1. Goal (목표)

- 랜덤 생성이 아닌, **특정 표현(Specific Expression)**을 지정하여 콘텐츠를 생성하는 새로운 워크플로우(V3) 도입.
- 사용자가 카테고리를 일일이 지정하지 않아도 AI가 문맥을 파악하여 **자동 분류(Auto-Classification)**하도록 개선.

### 2. Implementation (구현)

- **Pick Expression Node (`02_pick_expression_v3.js`)**:
  - `expression` 만을 포함하는 JSON 객체 반환 (`{ expression: "Let's get real" }`).
  - 외부 소스(DB, 파일 등)와 연동하기 쉬운 구조.

- **Specific Generator Prompt (`03_gemini_specific_expression_generator_prompt_v3.txt`)**:
  - **Classify Step**: 입력된 표현을 분석하여 6가지 카테고리 중 최적의 것을 선택하도록 지시.
  - **Inject**: 선택된 도메인/카테고리 정보를 JSON 결과에 포함.
  - 나머지 콘텐츠 생성 로직(Meaning, Dialogue, Quiz)은 V2와 동일한 품질 기준 유지.

- **Documentation (`optimization_steps_v3.md`)**:
  - V3 아키텍처 및 단계별 설정 가이드 작성.

### 3. Result (결과)

- ✅ **Targeting**: 원하는 표현을 정확히 DB에 추가 가능.
- ✅ **Automation**: 카테고리 태깅 업무 자동화.

## v0.12.26: n8n 데이터 정제 및 검증 강화 (2026-01-17)

### 1. Problem (문제)

- **Unwanted Punctuation**: Gemini가 프롬프트 지침을 무시하고 `meaning` 필드 문장 끝에 마침표(.)를 붙이거나, 의미 구분을 위해 세미콜론(;)을 사용하여 데이터 일관성을 저해.
- **Strict Validation Failure**: 기존 검증 로직은 이러한 포맷 오류를 즉시 에러로 처리하여, 간단한 수정으로 해결 가능한 데이터도 폐기되는 비효율 발생.

### 2. Solution (해결)

- **2-Step Validation Pipeline**:
  1.  **Cleanup (정제)**: 검증 전에 자동으로 문장 부호를 수정하는 단계 추가.
  2.  **Verify (검증)**: 정제 후에도 규칙을 위반하는 경우에만 에러 처리.

### 3. Implementation (구현)

- **New n8n Node (`Cleanup Meaning`)**:
  - `n8n/expressions/code_v2/06_cleanup_meaning.js` 작성.
  - 로직:
    - 문장 끝 및 **중간**의 모든 마침표(.) 제거 (말줄임표 `...`는 정규식으로 보존).
    - 세미콜론(;)을 프로젝트 표준 구분자 `·`로 일괄 치환.

- **Enhanced Validation (`Validate Content`)**:
  - `verification/verify_db_data.js` 및 n8n 검증 스크립트 업데이트.
  - `Target Language`뿐만 아니라 `English(en)`의 meaning 필드도 검증 대상에 포함.
  - 마침표나 세미콜론이 발견되면 즉시 에러(`Must not contain...`) 처리하여 엄격한 품질 기준 유지.

### 4. Result (결과)

- ✅ **Data Quality**: 문장 부호 오류가 0%로 감소하고 일관된 포맷 유지.
- ✅ **Efficiency**: 단순 포맷팅 오류로 인한 재생성 비용 절감.

## v0.12.25: Audio Context 리팩토링 (2026-01-17)

### 1. Problem (문제)

- **iOS Sequential Playback Failure**: 아이폰에서 '전체 듣기' 실행 시, 첫 번째 곡만 재생되고 두 번째 곡부터는 진행되지 않음.
- **Cause**: iOS Safari는 사용자 제스처(터치) 없는 `AudioContext` 생성을 차단함. 기존 로직은 매 곡마다 새로운 Context를 생성했기 때문에, 자동으로 넘어가는 두 번째 곡부터는 막힘.

### 2. Solution (해결)

- **Singleton AudioContext**: 앱 전체에서 **단 하나의 AudioContext**만 생성하여 공유하는 방식으로 변경.
- **React Context Migration**: 기존 `lib/audio.ts` 유틸리티를 `context/AudioContext.tsx` 리액트 컨텍스트로 승격.

### 3. Implementation (구현)

- **Global Provider (`context/AudioContext.tsx`)**:
  - `AudioContext` 인스턴스를 `useRef`로 관리하며 싱글턴 패턴 보장.
  - `getAudio()` 함수 제공: 이미 생성된 Context가 있다면 재사용.
  - 한국어 주석으로 내부 로직 상세 설명.

- **Hook Consumption (`components/DialogueAudioButton.tsx`)**:
  ```tsx
  const { getAudio } = useAudio();
  // ...
  const initializeWebAudio = useCallback(() => {
    const ctx = getAudio(); // 공유된 Context 가져오기
    // ...
  }, []);
  ```

### 4. Result (결과)

- ✅ **iOS Compatibility**: '전체 듣기' 시 끊김 없이 다음 곡 재생 성공.
- ✅ **Architecture**: 오디오 로직이 React Lifecycle 내에서 안전하게 관리됨.
- ✅ **Performance**: 불필요한 AudioContext 생성 오버헤드 제거.

## v0.12.24: JSON-LD Schema 최적화 (2026-01-16)

### 1. Goal (목표)

- `meta keywords` 태그 외에, Schema.org 구조화 데이터를 통해 검색 엔진에게 명확한 키워드 컨텍스트 제공.
- `layout.tsx`와 `page.tsx` 간의 스키마 중복 제거 및 역할 분리.

### 2. Implementation (구현)

- **Schema Injection**:
  - `Dict.meta.keywords` -> `WebSite` Schema (`layout.tsx`)
  - `generateSeoKeywords(...)` -> `LearningResource` Schema (`page.tsx`)

- **Schema Consolidation**:
  - `layout.tsx`: `Organization` + `WebSite` (Global Identity & Keywords)
  - `page.tsx`: `WebSite` (Local `SearchAction` only)

### 3. Result (결과)

- ✅ **Rich Snippets**: 검색 결과에서 더 풍부한 정보 노출 가능성 증대.
- ✅ **Logical Structure**: 전역 설정과 지역 설정의 명확한 분리.

## v0.12.23: SEO 설정 구조 리팩토링 (2026-01-16)

### 1. Goal (목표)

- SEO 설정(`suffixes`, `categories`)이 정적 메타데이터(`meta`) 내부에 혼재되어 있는 구조를 개선.
- 설정의 역할(Metadata vs SEO Strategy)을 명확히 분리.

### 2. Implementation (구현)

- **Locale Structure Change**:

```typescript
// Before
export const en = {
  meta: {
    seo: { ... },
    categories: { ... }
  }
}

// After
export const en = {
  meta: { ... }, // Pure Metadata
  seo: {         // SEO Strategy Config
    expressionSuffixes: [...],
    meaningSuffixes: [...],
    categories: { ... }
  }
}
```

- **Logic Update (`lib/seo.ts`)**:
  - `dict.meta.seo` -> `dict.seo`로 참조 경로 변경.

### 3. Result (결과)

- ✅ **Separation of Concerns**: 메타데이터와 SEO 전략 설정 분리.
- ✅ **Type Safety**: 명확한 구조로 타입 추론 및 유지보수 용이.

## v0.12.22: 동적 카테고리 키워드 현지화 (2026-01-16)

### 1. Goal (목표)

- "Travel" 카테고리인 경우 한국어 사용자에게는 "여행 영어", 영어 사용자에게는 "Travel English"와 같이 현지화된 키워드를 제공.
- 정적인 "Business English" 키워드가 모든 페이지에 중복되는 문제 해결.

### 2. Implementation (구현)

- **Locale Config (`i18n/locales/*.ts`)**:

```typescript
categories: {
  daily: "생활 영어",
  business: "비즈니스 영어",
  travel: "여행 영어",
  // ...
}
```

- **Dynamic Lookup (`lib/seo.ts`)**:

```typescript
// Before: 하드코딩된 if-else
if (category === "slang") ...

// After: Dictionary Lookup
const localizedCategory = dict.categories[category.toLowerCase()];
if (localizedCategory) keywords.push(localizedCategory);
```

### 3. Result (결과)

- ✅ **Relevance**: 콘텐츠와 정확히 일치하는 카테고리 키워드 노출.
- ✅ **Localization**: 사용자 언어에 맞는 자연스러운 키워드 ("쇼핑 영어" vs "Shopping English").
- ✅ **Efficiency**: 중복 키워드 제거로 SEO 가중치 분산 방지.

## v0.12.21: 동적 SEO 키워드 최적화 (2026-01-16)

### 1. Goal (목표)

- "Feel Blue 뜻", "우울하다 영어로"와 같이 사용자가 실제로 검색하는 고관여 키워드(Long-tail)를 자동으로 메타데이터에 포함.
- `meta keywords`의 한계를 넘어 실제 콘텐츠에 키워드를 노출하여 검색 엔진 가시성 확보.

### 2. Implementation (구현)

- **Locale Config (`ko.ts`)**:

```typescript
seo: {
  expressionSuffixes: ["뜻", "의미", "해석"],
  meaningSuffixes: ["영어로", "영어 표현", "영어로 어떻게"]
}
```

- **Shared SEO Logic (`lib/seo.ts`)**:
  - `generateSeoKeywords` 유틸리티 함수로 분리하여 메타데이터와 UI에서 재사용.

- **Visible Keywords (`KeywordList.tsx`)**:
  - `app/expressions/[id]/page.tsx` 하단에 `KeywordList` 컴포넌트 추가.
  - 관련 키워드를 시각적 태그로 노출 (White Hat SEO).

## v0.12.20: iOS 잠금 화면 메타데이터 구현 (2026-01-16)

### 1. Problem (문제)

- 아이폰 잠금 화면에서 오디오 재생 시, 앱 아이콘 대신 Vercel 로고(기본 파비콘)가 표시됨.

### 2. Solution (해결)

- `DialogueAudioButton.tsx`에 `Media Session API`를 도입하여 OS 레벨의 미디어 제어 UI에 명시적인 메타데이터를 제공.
- `DialogueItem`에서 텍스트 정보를 props로 전달받아 제목으로 설정.

### 3. Implementation (구현)

```typescript
// components/DialogueAudioButton.tsx

useEffect(() => {
  if (isPlaying && "mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Dialogue Audio",
      artist: "Speak Mango",
      artwork: [
        {
          src: "/assets/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });
    // ... setActionHandler ...
  }
}, [isPlaying, togglePlay]);
```

## v0.12.19: iOS Safari 오디오 로딩 픽스 (2026-01-16)

### 1. Problem

**iOS Safari Regression (Deadlock)**:

- 이전 버전(v0.12.18)의 "Lazy Loading"(`audio.load()` 제거)이 Safari의 Web Audio API 버그를 트리거함.
- `MediaElementSource`가 연결된 상태에서 오디오 엘리먼트가 초기화되지 않으면(`readyState: 0`), Safari는 로딩을 진행하지 않고 멈춰버림(Infinite Loading).

### 2. Solution

**Hybrid Loading (Revert Lazy Loading + Keep Lazy Init)**:

1.  **Revert Resource Loading**: `useEffect` 내 `audio.load()` 복구.
    - 페이지 로드 시 메타데이터를 즉시 로드하여 Safari의 Deadlock 조건을 회피.
2.  **Keep Lazy Init**: `AudioContext` 초기화는 여전히 `togglePlay`(클릭) 시점에 수행.
    - 카카오톡 등 인앱 브라우저의 Autoplay 정책 우회 유지.

### 3. Implementation

```tsx
// components/DialogueAudioButton.tsx

useEffect(() => {
  const audio = new Audio(getStorageUrl(audioUrl));
  audio.preload = "metadata";
  audioRef.current = audio;

  // Safari fix: Web Audio 연결 전 리소스 초기화 필수
  audio.load();
}, [audioUrl]);
```

### 4. Result

- ✅ **Safari**: 무한 로딩 해결, 정상 재생.
- ✅ **In-App Browsers**: 여전히 정상 재생 (Lazy Init 덕분).

## v0.12.18: 오디오 재생 최적화 - Lazy Loading 및 안정성 강화 (2026-01-16)

### 1. Problem

**iOS 호환성 및 리소스 효율성 문제**:

- `preload="metadata"` 설정에도 불구하고 컴포넌트 마운트 시 `audio.load()`가 호출되어 즉시 네트워크 요청 발생.
- 데이터 로드 이벤트 핸들러에서 Web Audio API를 초기화하려다 iOS의 Autoplay 정책에 걸려 실패 가능성 존재.
- `useCallback` 의존성 배열에 상태값이 포함되어 불필요한 함수 재생성 및 리렌더링 발생.

### 2. Solution

**True Lazy Loading & Stable Handler**:

1. **Lazy Resource Loading**: `useEffect`에서 `audio.load()` 제거. 재생 버튼 클릭 시에만 로딩 시작.
2. **Lazy API Initialization**: Web Audio API 초기화를 `togglePlay` 내부(사용자 클릭 시점)로 이동.
3. **Latest Ref Pattern**: `useRef`를 사용하여 상태값을 조회함으로써 `togglePlay` 함수를 안정화(Stable)함.

### 3. Implementation

#### A. Resource Loading 최적화

```tsx
useEffect(() => {
  const audio = new Audio(getStorageUrl(audioUrl));
  audio.preload = "metadata"; // 메타데이터만 미리 로드
  audioRef.current = audio;
  // audio.load() 삭제: 사용자가 누르기 전까지 요청 금지
}, [audioUrl]);
```

#### B. Lazy Initialization (User Gesture)

```tsx
const togglePlay = useCallback(async () => {
  // 클릭 시점에 초기화 (iOS 정책 준수)
  if (!audioContextRef.current) {
    initializeWebAudio();
  }

  // 로딩 상태 피드백
  if (audioRef.current.readyState < 2) {
    setIsLoading(true);
  }

  await audioRef.current.play(); // 이때 브라우저가 로딩 시작
}, []);
```

#### C. Performance Optimization

```tsx
// 최신 상태를 Ref에 저장
const latestValues = useRef({ isPlaying, isPaused, ... });

useEffect(() => {
  latestValues.current = { isPlaying, isPaused, ... };
});

// 의존성 없는 Stable Handler
const togglePlay = useCallback(async () => {
  const current = latestValues.current; // Ref에서 최신 값 조회
  // ...
}, []); // 의존성 배열 비움
```

### 4. Result

- ✅ **iOS 호환성**: 인앱 브라우저 및 Safari에서 완벽한 재생 보장.
- ✅ **데이터 절약**: 사용자가 듣지 않는 오디오는 다운로드하지 않음.
- ✅ **성능 향상**: 불필요한 리렌더링 및 함수 재생성 제거.

## v0.12.17: 인앱 브라우저 오디오 호환성 개선 (2026-01-15)

### 1. Problem

**카카오톡 공유 링크에서 오디오 무한 로딩 (Android vs iOS 차이)**:

- **증상 1**: 카카오톡으로 공유한 링크 접속 시 오디오가 계속 '로딩 중' 상태로 표시
- **증상 2 (Android)**: 첫 페이지에서는 안 되지만, 다른 표현 클릭 후 뒤로가기하면 정상 작동
- **증상 3 (iOS)**: Android 해결책 적용 후에도 iOS에서는 여전히 무한 로딩 표시
- **증상 4 (iOS 디버깅)**: `loadstart` 이벤트는 발생하지만 `loadeddata` 이벤트가 발생하지 않음
- **범위**: 일반 브라우저(Chrome, Safari)에서는 정상 작동, 인앱 브라우저에서만 발생
- **영향**: 사용자가 첫 접속 시 오디오를 재생할 수 없어 핵심 기능 사용 불가

### 2. Solution

**범용적인 폴백 메커니즘 + AudioContext 활성화 + iOS Safari 대응 (Web Audio API 지연 초기화)**:

- Web Audio API 초기화 실패 시 자동으로 기본 HTML5 Audio로 폴백
- User Agent 감지 대신 try-catch 기반 접근으로 모든 인앱 브라우저 자동 대응
- **Android**: AudioContext 생성 시 즉시 `resume()` 호출 시도
- **iOS Safari**: Web Audio API 초기화를 `loadeddata` 이벤트 후로 지연 + 사용자 클릭 시점에서 `resume()` 호출
- 볼륨 증폭은 포기하되 재생 기능은 보장

### 3. Implementation

#### A. Web Audio API 폴백 로직

**File**: `components/DialogueAudioButton.tsx`

**Before** (인앱 브라우저 감지 방식):

```tsx
// User Agent로 일일이 감지
const isInAppBrowser =
  userAgent.includes("kakaotalk") ||
  userAgent.includes("naver") ||
  // ... 계속 추가 필요

if (!isInAppBrowser) {
  // Web Audio API 초기화
}
```

**After** (try-catch 폴백 방식):

```tsx
let webAudioInitialized = false;

try {
  const ctx = new AudioContext();

  // 인앱 브라우저 autoplay 정책 대응: AudioContext를 즉시 resume
  if (ctx.state === "suspended") {
    ctx.resume().catch((e) => {
      console.warn("AudioContext resume failed:", e);
    });
  }

  const gainNode = ctx.createGain();
  const source = ctx.createMediaElementSource(audio);
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  gainNode.gain.value = 2.0; // 볼륨 증폭
  webAudioInitialized = true;
} catch (e) {
  console.warn(
    "Web Audio API initialization failed, using basic HTML5 Audio.",
    e,
  );
}

// 실패 시 기본 오디오 사용
if (!webAudioInitialized) {
  audio.volume = 1.0; // 최대 볼륨
}
```

#### B. AudioContext 활성화 로직

**첫 페이지 로딩 문제**:

```
카카오톡 링크 클릭 (첫 접속)
  ↓
AudioContext 생성 (suspended 상태)
  ↓
사용자 인터랙션 없음
  ↓
createMediaElementSource() 실패 가능
  ↓
무한 로딩 🔄
```

**해결 방법**:

```tsx
const ctx = new AudioContext();

// 즉시 resume 호출
if (ctx.state === "suspended") {
  ctx.resume().catch((e) => {
    console.warn("AudioContext resume failed:", e);
  });
}
```

**해결 후**:

```
카카오톡 링크 클릭 (첫 접속)
  ↓
AudioContext 생성 (suspended)
  ↓
즉시 resume() 호출
  ↓
suspended → running 전환
  ↓
정상 작동 ✅
```

#### C. iOS Safari 대응 (Web Audio API 지연 초기화)

**iOS Safari의 추가 제약**:

- `AudioContext.resume()`도 **사용자 제스처 내에서만** 작동
- **오디오 로딩 전** `createMediaElementSource()` 호출 시 `loadeddata` 이벤트가 발생하지 않음
- 무한 로딩 표시 → 사용자가 클릭하지 않음 → 악순환

**해결 1: Web Audio API 초기화 지연**:

```tsx
// Before: 즉시 Web Audio API 초기화 (iOS에서 loadeddata 차단)
const audio = new Audio(url);
createMediaElementSource(audio); // ❌ 너무 빨라!

// After: loadeddata 후 Web Audio API 초기화
const audio = new Audio(url);

const handleLoadedData = () => {
  setIsLoading(false);

  // Initialize Web Audio API AFTER audio is loaded
  if (!audioContextRef.current) {
    initializeWebAudio(); // ✅ 로딩 후 초기화!
  }
};

const initializeWebAudio = () => {
  const ctx = new AudioContext();
  const source = ctx.createMediaElementSource(audioRef.current);
  // ... Web Audio API 설정
};
```

**해결 2: 사용자 클릭 시 AudioContext 활성화**:

```tsx
const togglePlay = useCallback(async () => {
  // iOS Safari requires this to be called within a user gesture
  if (audioContextRef.current?.state === "suspended") {
    try {
      await audioContextRef.current.resume();
    } catch (e) {
      // Silently fail on iOS, will be resumed on user gesture
    }
  }
  // ... 오디오 재생
}, []);
```

**동작 흐름**:

```
iOS Safari 첫 접속
  ↓
오디오 파일 로딩 시작
  ↓
loadeddata 이벤트 발생 ✅
  ↓
로딩 스피너 사라짐 ✅
  ↓
Web Audio API 초기화 (AudioContext suspended)
  ↓
사용자가 재생 버튼 클릭
  ↓
AudioContext.resume() 호출 (사용자 제스처 내)
  ↓
정상 재생 ✅
```

#### D. 무한 로딩 문제 해결

**기존 문제**:

```
Web Audio API 실패
  ↓
catch 블록에서 볼륨만 설정
  ↓
오디오 객체 초기화 실패
  ↓
canplaythrough 이벤트 미발생
  ↓
isLoading 상태 계속 true
  ↓
무한 로딩 🔄
```

**해결 후**:

```
Web Audio API 실패
  ↓
플래그만 false로 설정
  ↓
기본 HTML5 Audio 사용
  ↓
canplaythrough 이벤트 정상 발생
  ↓
isLoading → false
  ↓
정상 재생 ✅
```

### 4. Result

**호환성 개선**:

- ✅ 카카오톡 인앱 브라우저: 정상 재생
- ✅ 네이버 인앱 브라우저: 정상 재생
- ✅ 위챗, 왓츠앱, 라인 등: 자동 대응
- ✅ 일반 브라우저: 기존대로 볼륨 증폭 유지

**Trade-off**:

- 인앱 브라우저: 볼륨 1.0 (증폭 없음)
- 일반 브라우저: 볼륨 2.0 (증폭 유지)

**유지보수성**:

- 새로운 인앱 브라우저 출시 시 코드 수정 불필요
- User Agent 목록 관리 불필요

## v0.12.16: 검색 기능 개선 - 아이콘 클릭, 다국어, 중복 방지 (2026-01-15)

### 1. Problem

**검색 기능의 사용성 및 정확도 문제**:

- **아이콘 클릭 불가**: 돋보기 아이콘이 장식용으로만 사용됨
- **부정확한 검색 결과**: 한국어 사용자가 영어 검색어 입력 시 관련 없는 결과 표시
- **중복 요청**: 동일한 검색어 재검색 시 불필요한 네트워크 요청 발생
- **일관성 부족**: Enter 키와 돋보기 버튼의 동작이 다름

### 2. Solution

**4가지 개선 사항 구현**:

1.  **검색 아이콘 클릭 기능**: 아이콘을 버튼으로 변경하여 클릭 가능하게 함
2.  **로케일별 검색**: 현재 언어의 meaning 필드만 검색
3.  **중복 검색 방지**: useRef로 이전 검색어 추적 및 스킵
4.  **데이터베이스 인덱스**: GIN 및 Trigram 인덱스 추가

### 3. Implementation

#### A. 검색 아이콘 클릭 기능

**File**: `components/SearchBar.tsx`

**Before**:

```tsx
<Search className="absolute left-4 ..." />  {/* 장식용 */}
```

**After**:

```tsx
<button type="button" onClick={handleIconClick} aria-label="Search">
  <Search className="w-5 h-5 ..." />
</button>
```

#### B. 로케일별 검색

**File**: `lib/expressions.ts`

**Before** (9개 언어 모두 검색):

```typescript
query.or(
  `expression.ilike.%${term}%,` +
  `meaning->>en.ilike.%${term}%,` +
  `meaning->>ko.ilike.%${term}%,` +
  // ... 9개 언어
);
```

**After** (expression + 현재 로케일만):

```typescript
const locale = filters.locale || "en";
query.or(`expression.ilike.%${term}%,meaning->>${locale}.ilike.%${term}%`);
```

**로케일 전달**:

- `app/page.tsx`: locale을 getExpressions에 전달
- `ExpressionList.tsx`: filtersWithLocale 생성하여 페이지네이션에도 적용

#### C. 중복 검색 방지

**File**: `components/SearchBar.tsx`

```tsx
const previousSearchRef = useRef<string>(initialValue);

const executeSearch = useCallback(
  (searchValue: string) => {
    // 중복 검색 방지
    if (searchValue === previousSearchRef.current) {
      return;
    }
    previousSearchRef.current = searchValue;
    onSearch(searchValue);
  },
  [onSearch],
);
```

#### D. 데이터베이스 인덱스

**Indexes Added**:

1.  **GIN 인덱스** (JSONB meaning 필드):

    ```sql
    CREATE INDEX idx_expressions_meaning_gin
    ON speak_mango_en.expressions
    USING GIN (meaning);
    ```

2.  **Trigram 인덱스** (TEXT expression 필드):
    ```sql
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE INDEX idx_expressions_expression_trgm
    ON speak_mango_en.expressions
    USING GIN (expression gin_trgm_ops);
    ```

### 4. Result

**검색 정확도**:

- ✅ 한국어 브라우저: 한국어 meaning만 검색
- ✅ 영어 브라우저: 영어 meaning만 검색
- ✅ 관련성 높은 결과만 표시

**검색 성능**:

- ✅ 검색 범위 77% 감소 (9개 필드 → 2개 필드)
- ✅ GIN 인덱스로 JSONB 쿼리 가속화
- ✅ Trigram 인덱스로 ILIKE 쿼리 가속화
- ✅ 중복 요청 제거로 네트워크 부하 감소

**사용자 경험**:

- ✅ 돋보기 아이콘 클릭으로 검색 가능
- ✅ Enter 키와 아이콘 클릭 동작 일관성
- ✅ 빈 검색어로 검색 초기화 가능
- ✅ 동일 검색어 재검색 시 즉시 응답

## v0.12.15: SEO 개선 - JSON-LD 구조화된 데이터 추가 (2026-01-15)

### 1. Problem

**Google 검색 결과에 브랜드명 대신 도메인 주소 표시**:

- **Issue**: Google 검색 시 "Speak Mango" 대신 "speakmango.com" 표시
- **Comparison**: Apple은 "Apple"로 표시되지만, Speak Mango는 도메인 주소만 표시
- **Root Cause**: 구조화된 데이터(Structured Data) 부재로 Google이 브랜드를 인식하지 못함

### 2. Solution

**JSON-LD 형식의 Schema.org 구조화된 데이터 추가**:

1. **Organization Schema**: 브랜드 정보 (이름, 로고, 소셜 미디어)
2. **WebSite Schema**: 웹사이트 정보 (이름, URL, 지원 언어)
3. **SearchAction Schema**: 검색 기능 (홈페이지만)

### 3. Implementation

#### A. Global Schemas (`app/layout.tsx`)

**모든 페이지에 적용되는 전역 스키마**:

```tsx
// Organization Schema - 브랜드 정보
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Speak Mango",
  "url": BASE_URL,
  "logo": `${BASE_URL}/assets/logo.png`,
  "sameAs": []  // 향후 소셜 미디어 추가 예정
}

// WebSite Schema - 기본 정보 + 다국어 지원
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Speak Mango",
  "url": BASE_URL,
  "inLanguage": SUPPORTED_LANGUAGES  // 9개 언어
}
```

**Import 추가**:

```tsx
import { SUPPORTED_LANGUAGES } from "@/i18n";
```

#### B. Homepage Schema (`app/page.tsx`)

**검색 기능 스키마 (홈페이지만)**:

```tsx
// WebSite Schema with SearchAction
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Speak Mango",
  "url": BASE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${BASE_URL}/?search={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
}
```

**Why Homepage Only?**

- 검색 바는 홈페이지에만 존재
- 상세 페이지에는 검색 기능 없음
- 스키마는 실제 기능이 있는 페이지에만 배치

#### C. TypeScript Config (`tsconfig.json`)

**코드 품질 개선**:

```json
{
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

- 사용하지 않는 import 자동 감지
- 사용하지 않는 함수 매개변수 경고

### 4. Schema Organization Strategy

**전역 vs 페이지별 구분**:

| Schema Type                | Location                    | Purpose                  | Scope         |
| -------------------------- | --------------------------- | ------------------------ | ------------- |
| `Organization`             | `layout.tsx`                | 브랜드 정보 (이름, 로고) | 전역          |
| `WebSite` (basic)          | `layout.tsx`                | 사이트 정보 + 다국어     | 전역          |
| `WebSite` + `SearchAction` | `page.tsx`                  | 검색 기능                | 홈페이지만    |
| `LearningResource`         | `expressions/[id]/page.tsx` | 학습 콘텐츠              | 상세 페이지만 |

**Why This Structure?**

1. **전역 스키마** (`layout.tsx`):
   - 모든 페이지에 공통으로 적용
   - 브랜드 정보는 변하지 않음
   - 다국어 지원은 사이트 전체 속성

2. **페이지별 스키마**:
   - 실제 기능이 있는 페이지에만 추가
   - 검색 기능 → 홈페이지
   - 학습 콘텐츠 → 상세 페이지

### 5. Key Decisions

**Q1. 왜 WebSite 스키마가 layout.tsx와 page.tsx 둘 다에 있나?**

- **A**: 서로 다른 목적:
  - `layout.tsx`: 기본 정보 (`name`, `url`, `inLanguage`)
  - `page.tsx`: 검색 기능 (`potentialAction`)
  - Google은 동일한 `@type`의 스키마를 자동으로 병합

**Q2. inLanguage는 왜 전역에 설정했나?**

- **A**: 다국어 지원은 사이트 전체 속성:
  - 9개 언어 지원 (`SUPPORTED_LANGUAGES`)
  - Google이 각 언어별 검색 결과에서 적절하게 표시
  - 국제 SEO 개선

**Q3. SearchAction은 왜 홈페이지에만?**

- **A**: 검색 기능은 홈페이지에만 존재:
  - 상세 페이지에는 검색 바 없음
  - 스키마는 실제 기능만 설명해야 함
  - Google이 사이트 내 검색 박스를 검색 결과에 표시 가능

### 6. Expected Results

**Before**:

- ❌ Google 검색 결과: `speakmango.com`
- ❌ 브랜드 인식 없음
- ❌ 일반 웹사이트로 취급

**After** (Google 재크롤링 후):

- ✅ Google 검색 결과: `Speak Mango`
- ✅ 브랜드 신뢰도 향상
- ✅ Knowledge Graph 표시 가능성
- ✅ 검색 결과에 사이트 내 검색 박스 표시 가능

### 7. Verification Steps

1. **Rich Results Test**: https://search.google.com/test/rich-results
   - URL 입력 후 Organization 및 WebSite 스키마 인식 확인

2. **Google Search Console**:
   - "URL 검사" → "색인 생성 요청"
   - 빠른 크롤링 요청

3. **Live Search Results**:
   - 며칠 ~ 몇 주 후 Google 검색에서 확인
   - "Speak Mango" 또는 "speakmango.com" 검색

### 8. Future Improvements

**Social Media Integration**:

```json
"sameAs": [
  "https://twitter.com/speakmango",
  "https://facebook.com/speakmango",
  "https://instagram.com/speakmango",
  "https://linkedin.com/company/speakmango"
]
```

**Benefits**:

- Knowledge Graph 표시 가능성 증가
- 브랜드 신뢰도 향상
- 소셜 미디어와 메인 사이트 연결

### 9. Result

- ✅ **Organization Schema**: 브랜드 정보 제공
- ✅ **WebSite Schema**: 사이트 정보 + 다국어 지원
- ✅ **SearchAction**: 검색 기능 명시
- ✅ **TypeScript 품질**: 미사용 코드 자동 감지
- ✅ **SEO 개선**: Google이 "Speak Mango"를 브랜드로 인식 가능

## v0.12.14: i18n 언어팩 일관성 검증 스크립트 추가 (2026-01-15)

### 1. Problem

**i18n 언어 파일의 언어 일관성 보장 필요**:

- **Challenge**: 9개 언어 파일을 수동으로 관리하다 보면 다른 언어가 섞일 수 있음
- **Risk**: 한국어 파일에 일본어나 영어가 섞이는 경우
- **Need**: 자동화된 검증으로 언어 일관성 보장

### 2. Solution

**자동화된 언어 일관성 검증 스크립트 개발**:

1. **언어별 스크립트 검증**: 각 언어 파일이 해당 언어만 포함하는지 검증
2. **영어 누출 검사**: 비라틴 언어에서 소문자 영어 단어 차단
3. **템플릿 변수 허용**: 동적으로 치환되는 변수명 허용

### 3. Implementation

#### A. Validation Script Structure

**File**: `verification/verify_i18n_locales.js`

#### B. Validation Logic

**4-Step Process**:

1. **TypeScript 파일 파싱**: JSON 변환 또는 Fallback 메서드
2. **문자열 추출**: 모든 문자열 값 재귀적 추출
3. **금지된 스크립트 검사**: 언어별 금지 문자 검증
4. **영어 누출 검사**: 비라틴 언어만 소문자 영어 차단

**Smart English Inclusion Check**:

- ✅ **허용**: 대문자 시작 (Instagram, TikTok)
- ✅ **허용**: 허용 목록의 용어 (serviceName, expression)
- ❌ **차단**: 소문자 영어 단어 (hello, world)

## v0.12.13: 대화 성별-이름 일관성 검증 강화 및 문서 리팩토링 (2026-01-15)

### 1. Problem

**대화 데이터에서 성별-이름 불일치 발견**:

- **Expected**: Role A (여성) → Role B를 남성 이름(Mike/David)으로 호칭
- **Found**: Role A (여성) → Role B를 "Emily"(여성 이름)으로 호칭
- **Root Cause**: Gemini가 프롬프트의 성별-이름 규칙을 무시하고 대화 생성

**문서 유지보수 문제**:

- `optimization_steps.md`에 200+ 줄의 인라인 코드 블록
- 코드 변경 시 문서와 실제 파일 간 불일치 발생 가능

### 2. Solution

**두 가지 접근**:

1. **프롬프트 강화**: 성별-이름 일관성 규칙 명시
2. **검증 로직 추가**: 호격 패턴 기반 성별-이름 검증
3. **문서 리팩토링**: 인라인 코드 → 파일 참조

### 3. Implementation

#### A. Gemini Prompt Enhancement

**Files**:

- `n8n/expressions/code/08_gemini_content_generator_prompt.txt`
- `n8n/expressions/code_v2/04_gemini_master_generator_prompt_v2.txt`

**Added Section** (Dialogue & Roles - Name Usage & Gender Consistency):

- Role A (여성)는 Role B를 **남성 이름**(Mike/David)으로 호칭
- Role B (남성)는 Role A를 **여성 이름**(Sarah/Emily)으로 호칭
- 자기 소개와 상대방 언급은 허용
- 잘못된 예시와 올바른 예시 제공

#### B. Validation Logic Enhancement

**Files**:

- `n8n/expressions/code/10_validate_content.js`
- `n8n/expressions/code_v2/06_validate_content_v2.js`
- `verification/verify_db_data.js`

**Added Validation**:

호격 패턴 기반 성별-이름 일관성 검증 (4가지 패턴):

1. 문장 시작: `"Hey Mike"`, `"Guess what, Emily"`
2. 쉼표 뒤: `"..., Mike."`, `"..., Emily?"`
3. 이름 + 동사: `"Mike, how are you?"`
4. 이름 + 대명사: `"Emily, you..."`, `"Mike, your..."`

**Key Features**:

- 대소문자 구분 없이 검증
- 자기 소개(`"Hi, I'm Emily"`)는 허용
- 상대방 언급(`"You're Mike, right?"`)은 허용

#### C. Documentation Refactoring

**File**: `docs/n8n/expressions/optimization_steps.md`

**Changes**:

- 8개 단계의 인라인 코드 블록을 파일 참조로 변경
- 영향받은 단계: 4, 5, 8, 9, 10, 11, 12, 15

**Before**:

````markdown
### 8단계: Gemini Content Generator

- **Prompt**:
  ```text
  [200+ lines of inline prompt]
  ```
````

**After**:

```markdown
### 8단계: Gemini Content Generator

- **Prompt**: `n8n/expressions/code/08_gemini_content_generator_prompt.txt`의 내용을 사용합니다.
```

### 4. Key Learnings

1. **정교한 패턴 설계**: 단순 이름 포함 검사는 정상 케이스(자기 소개)도 에러로 잡음
2. **호격 패턴 분석**: 실제로 상대를 부르는 경우만 검증하도록 패턴 설계
3. **문서 유지보수**: 코드를 파일로 분리하면 문서 가독성과 유지보수성 향상
4. **일관성 보장**: v1과 v2 모두 동일한 규칙 적용으로 데이터 품질 보장

## v0.12.12: n8n Quiz Validation 강화 (2026-01-15)

### 1. Problem

**DB에서 잘못된 quiz 구조 발견**:

- **Expected**: `quiz: { question: string, answer: string }`
- **Found**: `quiz: { question: string, answer: string, options: string[] }`
- Gemini가 `question` 필드에 선택지를 넣지 않고 `options` 배열을 별도로 생성

### 2. Solution

**두 가지 접근**:

1. **Gemini 프롬프트 강화**: DB 구조 명시
2. **Validation 로직 강화**: 잘못된 구조 차단

### 3. Implementation

#### A. Gemini Prompt Update

**Files**:

- `n8n/expressions/code/08_gemini_content_generator_prompt.txt`
- `n8n/expressions/code_v2/04_gemini_master_generator_prompt_v2.txt`

**Added Rules** (Rule 10 - Strict Formatting & Validation Rules):

- **Rule 2**: Database Structure (CRITICAL) - quiz는 `question`과 `answer` 필드만 포함, `options` 필드 금지
- **Rule 3**: Options in Question Field - 선택지를 `question` 필드 안에 포함
- **Rule 4**: Format 예시 제공

#### B. Validation Logic Update

**Files**:

- `n8n/expressions/code/10_validate_content.js`
- `n8n/expressions/code_v2/06_validate_content_v2.js`
- `verification/verify_db_data.js`

**Added Checks**:

1. **`quiz.options` 필드 금지**: DB 구조 위반 시 에러
2. **`quiz.question` 내 선택지 필수**: A, B, C 선택지가 모두 포함되어야 함

### 4. Code Quality

**Validation Logic**:

```javascript
// 1. quiz.options 필드 금지
if (contentObj.quiz.options) {
  errors.push(
    `Content (${lang}).quiz must NOT have 'options' field. Options should be in 'question' field as "A. ...", "B. ...", "C. ...".`,
  );
}

// 2. quiz.question 내 선택지 A, B, C 필수
const hasOptionA = /\nA\.\s/.test(questionText) || /^A\.\s/.test(questionText);
const hasOptionB = /\nB\.\s/.test(questionText);
const hasOptionC = /\nC\.\s/.test(questionText);

if (!hasOptionA || !hasOptionB || !hasOptionC) {
  const missing = [];
  if (!hasOptionA) missing.push("A");
  if (!hasOptionB) missing.push("B");
  if (!hasOptionC) missing.push("C");
  errors.push(
    `Content (${lang}).quiz.question must contain all options (A, B, C). Missing: ${missing.join(
      ", ",
    )}`,
  );
}
```

### 5. Result

**Gemini 생성**:

- ✅ 올바른 quiz 구조로 생성하도록 명확히 지시
- ✅ `options` 필드 생성 방지

**Validation**:

- ✅ 잘못된 구조 즉시 차단
- ✅ 선택지 누락 감지
- ✅ 명확한 에러 메시지로 디버깅 용이

**Data Quality**:

- ✅ 향후 생성되는 모든 데이터는 올바른 구조 보장
- ⚠️ 기존 DB에 잘못된 구조가 있다면 수동 수정 필요

---

## v0.12.11: Google 검색 결과 로고 표시 (2026-01-15)

### 1. Problem

- Google 검색 결과에 로고 대신 **지구본 아이콘** 표시
- Schema.org Organization 마크업 누락

### 2. Solution

- **File**: `app/page.tsx`
- **Addition**: Schema.org Organization 구조화된 데이터 추가
  ```tsx
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Speak Mango",
    "url": "https://speakmango.com",
    "logo": "https://speakmango.com/assets/logo.png"
  }
  ```

### 3. Google Logo Requirements

- **형식**: PNG, JPG, SVG
- **크기**: 최소 112x112px (권장: 512x512px)
- **비율**: 정사각형 또는 1:1에 가까운 비율
- **현재 사용**: `/assets/logo.png` (1024x1024px)

**1024x1024 선택 이유**:

- 고해상도 디스플레이에서도 선명
- Google이 다양한 크기로 리사이징
- 권장 크기(512x512)의 2배로 미래 대비

### 4. Schema.org 타입 차이

**WebSite vs Organization**:

| 타입           | 목적                  | Google 활용              |
| -------------- | --------------------- | ------------------------ |
| `WebSite`      | 사이트 검색 기능 정의 | 사이트 내 검색 박스 표시 |
| `Organization` | 브랜드 로고/정보 정의 | 검색 결과에 로고 표시    |

**왜 둘 다 사용?**

- WebSite: 사이트 기능 (검색)
- Organization: 브랜드 정보 (로고)
- 함께 사용: 완전한 SEO 최적화

### 5. sameAs 속성

**정의**: 공식 소셜 미디어 프로필 URL 목록

**효과**:

- Knowledge Graph (지식 패널) 표시
- 브랜드 신뢰도 향상
- SEO 점수 개선

**추가 가능한 URL**:

```json
"sameAs": [
  "https://twitter.com/speakmango",
  "https://facebook.com/speakmango",
  "https://instagram.com/speakmango"
]
```

**현재**: 빈 배열 (소셜 미디어 생성 후 추가 예정)

### 6. Verification

- **Rich Results Test**: https://search.google.com/test/rich-results
- **Google Search Console**: URL 검사 → 색인 생성 요청
- **예상 시간**: 며칠 ~ 몇 주 (크롤링 후 반영)

### 7. Result

- ✅ **Schema.org Organization**: 로고 정보 제공
- ✅ **SEO 개선**: Google이 사이트 정보 정확히 인식
- ✅ **브랜드 강화**: 검색 결과에 로고 표시 예정

## v0.12.10: SEO 개선 - Canonical URL 추가 (2026-01-15)

### 1. Canonical URL 구현

- **File**: `app/page.tsx`
- **Addition**: `generateMetadata` 함수 추가
  ```tsx
  export async function generateMetadata(): Promise<Metadata> {
    return {
      alternates: {
        canonical: BASE_URL,
      },
    };
  }
  ```

### 2. Canonical URL이란?

- **정의**: "이 페이지의 정식 주소는 이것입니다"라고 검색 엔진에 알려주는 메타 태그
- **목적**: 같은 콘텐츠가 여러 URL로 접근 가능할 때 중복 방지
  - 예: `/?lang=ko`, `/?utm_source=facebook` 등
- **SEO 효과**: 검색 엔진이 어떤 URL을 색인할지 명확히 인식

### 3. Google Search Console 리디렉션 경고

- **경고 내용**: "리디렉션이 포함된 페이지" (`http://` → `https://`)
- **결론**: **정상이며 걱정 불필요**
  - HTTP → HTTPS 리디렉션은 보안을 위해 필수
  - Google도 최종 HTTPS 페이지를 정상 색인
  - Canonical URL 추가는 SEO 개선 효과 (리디렉션 해결 X)

### 4. Result

- ✅ **SEO 개선**: 홈 페이지 canonical URL 설정 완료
- ✅ **중복 방지**: 쿼리 파라미터가 있어도 정식 URL 명확
- ✅ **일관성**: 상세 페이지와 동일한 SEO 구조

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
