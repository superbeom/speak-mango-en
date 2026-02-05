# Project History & Q&A Logs

> 최신 항목이 상단에 위치합니다.

## v0.15.5: UX Loading States & Form Stability (2026-02-05)

### ✅ 진행 사항

1.  **Vocabulary List Skeleton (`SkeletonVocabularyList`)**:
    - **Problem**: 단어장 목록 조회 시 초기 로딩 과정에서 빈 화면이 노출되어 사용자가 '데이터 없음'으로 오해할 소지가 있었습니다.
    - **Solution**: `components/ui/Skeletons.tsx`에 단어장 전용 스켈레톤을 추가하고, `VocabularyListModal`에서 초기 페칭 시 이를 보여주도록 처리했습니다.

2.  **CreateListForm UX Polish**:
    - **Internal Loading State**: 부모로부터 전달받은 `isLoading` 외에 컴포넌트 내부에서 `isSubmitting` 상태를 별도로 관리하여, 비동기 요청 중 버튼 중복 클릭을 방지하고 상태 제어의 안정성을 확보했습니다.
    - **Visual Feedback**: 리스트 생성 버튼에 `Loader2` 스피너를 추가하고, 로딩 중에는 입력창과 버튼을 비활성화(`disabled`)하여 데이터 무결성을 보장했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `isLoading`이 있는데 `isSubmitting`을 따로 쓰나요?**

- **A.** 외부에서 주입되는 로딩 상태(`isLoading`)는 리스트를 불러오거나 다른 전역적인 작업에 의존할 수 있습니다. 반면 리스트 생성 버튼의 클릭은 이 컴포넌트만의 독립적인 액션이므로, 내부 상태(`isSubmitting`)를 통해 "지금 이 폼이 제출 중임"을 명확히 정의함으로써 예외 상황(예: 외부 isLoading이 늦게 바뀔 때)에서도 안전하게 동작하도록 설계했습니다.

## v0.15.4: Automatic Continuity & UI Polish (2026-02-05)

### ✅ 진행 사항

1.  **Automatic Default List Reassignment (기본 단어장 자동 승계)**:
    - **Problem**: 기본(Default) 단어장을 삭제하면 더 이상 기본 단어장이 남지 않아 '즉시 저장' 기능이 작동하지 않았습니다.
    - **Solution**:
      - **DB (Pro)**: `on_vocabulary_list_deleted` 트리거를 추가하여 기본 단어장 삭제 시 가장 오래된 다른 리스트로 기본 설정을 자동 이관합니다.
      - **Local (Free)**: `useLocalActionStore`의 `deleteList` 로직을 수정하여 동일한 자동 승계 로직을 구현했습니다.

2.  **UserMenu UX Optimization (불필요한 리로드 방지)**:
    - **Problem**: 마이페이지(`/me`)에 이미 접속해 있는 상태에서도 유저 메뉴의 '마이페이지' 링크를 클릭하면 페이지가 전체 새로고침되었습니다.
    - **Solution**: `UserMenu` 컴포넌트에서 `usePathname`을 활용해 현재 경로가 마이페이지일 경우 링크를 비활성화(`disabled`) 처리하여 불필요한 네트워크 요청을 차단했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 삭제 로직을 트리거(Trigger)로 구현했나요?**

- **A.** 복잡한 비즈니스 로직이라기보다 **데이터 정합성(Invariant)**에 가까운 규칙이기 때문입니다. 서비스 내 어떤 경로(대시보드, API 호출 등)로든 기본 리스트를 지우면 자동으로 다른 리스트가 그 역할을 대신하게 함으로써 데이터의 자가 치유(Self-healing)가 가능하도록 설계했습니다.

## v0.15.3: Full RLS Enforcement & RPC Bug Fix (2026-02-05)

### ✅ 진행 사항

1.  **Full RLS Coverage (보안 전면 강화)**:
    - **Backdrop**: 기존에는 `vocabulary_lists` 등 일부 테이블만 RLS가 걸려있어 다른 테이블들이 'Unrestricted' 상태였습니다.
    - **Solution**: `028_enable_rls_all_tables.sql`을 통해 `expressions`, `user_actions`, `users`, `accounts`, `sessions` 등 모든 테이블의 RLS를 활성화하고, 각 용도에 맞는 엄격한 정책(Policy)을 수립했습니다.

2.  **RPC Type Casting Bug Fix (SQL 에러 해결)**:
    - **Problem**: `toggle_user_action` 함수 호출 시 `text`와 `action_type` Enum 간의 비교 연산자 에러(`operator does not exist`)가 발생했습니다.
    - **Solution**: SQL 함수 내부에서 `p_action_type::speak_mango_en.action_type`으로 명시적 형변환을 추가하여 타입을 일치시켰습니다.

## v0.15.2: Authentication & RLS Security Hardening (2026-02-04)

### ✅ 진행 사항

1.  **Custom JWT Integration (인증 연동)**:
    - **Backdrop**: NextAuth와 Supabase Auth의 유저 시스템 분리로 인해 RLS 정책에서 `auth.uid()`를 사용할 수 없는 문제가 있었습니다.
    - **Solution**: `createServerSupabase` 클라이언트 초기화 시, NextAuth 세션의 사용자 ID로 서명된 **Custom JWT**를 생성하여 Supabase에 전달하도록 구현했습니다. 이로써 Supabase가 요청을 인증된 사용자(`authenticated`)로 인식하고 `auth.uid()`를 올바르게 매핑합니다.

2.  **Database Permission & Integrity (DB 권한 및 무결성)**:
    - **Grant Permissions**: `025_grant_permissions_speak_mango.sql`을 통해 `speak_mango_en` 스키마에 대한 접근 권한(`USAGE`, `SELECT` 등)을 명확히 부여했습니다.
    - **Foreign Key Correction**: `vocabulary_lists`가 잘못된 참조(`auth.users`)를 하고 있던 것을 `speak_mango_en.users`로 수정하여 참조 무결성 에러(`23503`)를 해결했습니다 (`026_fix_vocabulary_fk.sql`).

3.  **RLS Security Hardening (보안 강화)**:
    - **Strict Policies**: 개발 편의를 위해 풀어두었던 임시 정책(`using (true)`)을 제거하고, `auth.uid() = user_id` 조건의 엄격한 RLS 정책으로 교체하여 데이터 보안을 확보했습니다 (`027_secure_rls.sql`).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Custom JWT 방식을 도입했나요?**

- **A.** Supabase Service Role Key를 사용하면 모든 권한이 뚫리기 때문에 보안상 매우 취약합니다. RLS(행 수준 보안)를 데이터베이스 레벨에서 강제하기 위해서는 Supabase가 "현재 요청자가 누구인지"를 알아야 하므로, NextAuth의 신원을 보증하는 Custom JWT가 필수적이었습니다.

**Q. 기존의 RLS 완화 마이그레이션(023, 024)은 불필요했나요?**

- **A.** 결과적으로는 그렇습니다. 처음부터 Custom JWT 전략을 채택했다면 RLS를 풀 필요가 없었습니다. 하지만 이는 인증 연동 문제를 해결해가는 과정에서의 시행착오였으며, `027`번 마이그레이션을 통해 다시 정상적인 보안 수준으로 복구되었습니다. 반면, 권한 부여(`025`)와 외래 키 수정(`026`)은 아키텍처상 반드시 필요한 작업이었습니다.

## 2026-02-04: UI Responsiveness & Async Optimization

### ✅ 진행 사항

1.  **SWR Optimistic Updates**:
    - `useUserActions` 훅에 SWR의 낙관적 업데이트(Optimistic Update) 패턴을 도입했습니다. 서버 응답을 기다리지 않고 UI를 즉시 갱신하며, 실패 시에만 롤백하여 네트워크 지연 없는 쾌적한 인터랙션을 구현했습니다.

2.  **Waterfall Elimination in Save Logic**:
    - `useSaveAction`에서 저장 상태 변경(`toggleSaveState`)과 단어장 동기화(`syncOnSave/syncOnUnsave`)를 `Promise.all`을 사용하여 병렬로 처리하도록 개선했습니다. 이를 통해 불필요한 직렬 대기(Waterfall)를 제거하고 응답 속도를 높였습니다.

3.  **Loading State & Flash Prevention**:
    - `SaveButton`과 `LearnButton`에 `isInitialLoading` 상태를 정교하게 적용했습니다. 초기 데이터 페칭 중에는 로딩 스피너를 보여주고 버튼을 비활성화하여, 데이터 부족으로 인한 UI 깜빡임(Flash)과 중복 클릭을 방지했습니다.

4.  **Timer Cleanup & Stability**:
    - 버튼 컴포넌트 언마운트 시 `setTimeout` 타이머가 해제되도록 `useEffect` 클린업 로직을 추가했습니다. 또한 NodeJS와 Browser 간의 타이머 타입 혼선을 방지하기 위해 `ReturnType<typeof setTimeout>`을 사용하도록 타입을 정규화했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 SWR 낙관적 업데이트를 도입했나요?**

- **A.** Pro 사용자의 경우 서버 액션을 호출하므로 응답까지 수백 ms의 지연이 발생합니다. 낙관적 업데이트를 통해 사용자는 즉각적인 버튼 상태 변화를 체감할 수 있으며, 이는 앱의 전반적인 반응성(Responsiveness)을 크게 향상시킵니다.

**Q. `Promise.all`을 사용한 이유는?**

- **A.** 비즈니스 로직상 저장 상태 변경과 단어장 동기화는 서로 의존성이 없는 독립적인 비동기 작업입니다. 이를 순차적으로 실행하면 전체 소요 시간이 각 작업의 합만큼 늘어나게 되므로, 병렬 실행을 통해 전체 지연 시간을 최소화했습니다.

## 2026-02-04: Pro Tier Integration & Advanced Vocabulary Management

### ✅ 진행 사항

1.  **Pro Tier Infrastructure**:
    - **`get_user_tier` SQL Function**: 유저의 현재 티어(Free/Pro)를 즉각 확인하기 위한 DB 함수를 추가했습니다.
    - **`withPro` Server Action HOF**: 모든 서버 액션에서 Pro 티어 권한을 중앙 집중식으로 확인하고 에러를 처리하는 고차 함수(HOF)를 도입했습니다.

2.  **Vocabulary Management Expansion**:
    - **Advanced Actions**: 단어장 이름 수정(`Rename`), 삭제(`Delete`), 기본 단어장 설정(`Set Default`) 기능을 추가했습니다.
    - **Enhanced Header UI**: `VocabularyDetailHeader`에 '더 보기(More)' 메뉴를 도입하여 복잡한 액션들을 깔끔하게 정리했습니다.

3.  **Global Confirmation System**:
    - **`ConfirmDialog` & `ConfirmContext`**: 삭제 등 민감한 작업 시 사용할 수 있는 범용적인 모달 시스템을 구축했습니다.

4.  **Stability & Performance**:
    - **Server-side Revalidation**: `revalidatePath` 및 `revalidateTag`를 래핑한 유틸리티를 사용하여 데이터 변경 후 즉각적으로 UI가 갱신되도록 보장했습니다.
    - **I18n Expansion**: 새로운 관리 기능들을 위해 9개 언어에 대한 번역 문자열을 업데이트했습니다.

## 2026-02-02: Vocabulary UI Optimization & Refactoring

### ✅ 진행 사항

1.  **Mobile-First UI Optimization**:
    - **2-Row Mobile Layout**: 좁은 모바일 화면을 고려하여 툴바를 2단 구조로 변경했습니다. 1단에는 '취소/선택' 및 '뷰 모드'를, 2단에는 '전체 선택'과 '선택 수'를 배치하여 조작 편의성을 높였습니다.
    - **Touch Logic Refinement**: 모바일에서 터치 시 호버 배경색이 남는 현상을 방지하기 위해 `sm:hover` 접두사를 적용하여 데스크탑에서만 호버 효과가 나타나도록 수정했습니다.

2.  **Vocabulary Toolbar Refactoring**:
    - **Component Decoupling**: 툴바 내부의 중복 로직을 `SelectionCount`와 `ToggleAllButton`이라는 내부 서브 컴포넌트로 분리하여 가독성과 유지보수성을 극대화했습니다.
    - **Layout Order Polish**: 사용자의 요청에 따라 '취소' 버튼을 가장 앞으로 배치하고, 그 뒤를 '뷰 모드 전환' 버튼이 따르도록 순서를 조정했습니다.

3.  **Vercel & Web Design Best Practices**:
    - **Ternary Conditionals**: 렌더링 성능과 안전성을 위해 `&&` 대신 삼항 연산자(`? : null`)를 사용하여 조건부 렌더링을 수행하도록 표준화했습니다.
    - **Stable Visuals**: 선택 수 표시 부분에 `tabular-nums`를 적용하여 숫자가 바뀔 때의 미세한 흔들림을 제거했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 모바일에서만 2단 레이아웃을 사용하나요?**

- **A.** 1단에 모든 버튼을 넣을 경우 버튼 크기가 너무 작아져 터치 오류가 발생하거나 텍스트가 잘리는 문제가 있었습니다. 논리적으로 '설정(취소/뷰)'과 '동작(전체선택/수)'을 구분하여 2단으로 배치함으로써 훨씬 쾌적한 모바일 경험을 제공할 수 있게 되었습니다.

**Q. 왜 `&&` 연산자 대신 삼항 연산자를 사용했나요?**

- **A.** Vercel React Best Practices 가이드라인에 따른 조치입니다. `&&` 연산자는 `0`과 같은 숫자를 의도치 않게 렌더링할 위험이 있지만, 삼항 연산자는 명시적으로 `null`을 반환하므로 더 안전하고 명확합니다.

## 2026-02-02: Vocabulary Bulk Selection

### ✅ 진행 사항

1.  **Vocabulary Bulk Operations**:
    - `useVocabularyView` 훅에 `selectAll` 및 `clearSelection` 기능을 추가하여 단어장 항목의 일괄 선택/해제를 구현했습니다.
    - `VocabularyToolbar`에 "전체 선택" / "선택 해제" 버튼을 추가했습니다.
    - 모든 항목이 선택 되었을 때 아이콘과 텍스트가 동적으로 변하는 토글 로직을 적용했습니다.

2.  **Global i18n Support for Bulk Actions**:
    - 9개 언어 전체 로케일 파일에 `selectAll` 및 `deselectAll` 번역을 추가하여 글로벌 일관성을 확보했습니다.

3.  **Server Component Best Practices**:
    - `app/me/[listId]/page.tsx`에서 데이터 페칭 로직을 IIFE로 래핑하여 JSX 생성 로직과 분리함으로써 에러 발생 시의 안전성을 강화했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. `selectAll` 구현 시 `totalCount > 0` 체크를 넣은 이유는?**

- **A.** 빈 리스트에서 전체 선택 버튼을 누를 경우, 불필요한 상태 변경이나 의도치 않은 UI 표시를 방지하기 위함입니다. 데이터가 확실히 존재할 때만 기능이 작동하도록 방어적으로 설계했습니다.

## 2026-02-02: Unified Navigation & Vocabulary UI Refinement

### ✅ 진행 사항

1.  **Unified Navigation (Consolidated Header)**:
    - `expressions/[id]/page.tsx`에서 개별 `Header` + `BackButton` 조합을 제거하고, `MainHeader`로 통합했습니다.
    - `showBackButton` prop을 통해 로고 영역을 '뒤로가기' 버튼으로 전환하여 네비게이션 동선을 일원화했습니다.
    - **Skeleton Synchronization**: `SkeletonNavbar`를 업데이트하여 상세 페이지 로딩 시에도 실제 헤더와 동일한 레이아웃(우측 내비 아이콘 포함)을 미리 볼 수 있도록 개선했습니다.

2.  **UI Component Stability (`InteractiveLink`)**:
    - 컴포넌트가 언마운트된 후 `controls.start()`가 실행되어 발생하는 런타임 에러를 방지하기 위해 `isMounted` 체크 로직(`safeStart`)을 도입했습니다.
    - `VocabularyItemsGrid` 등 빠른 페이지 전환이 일어나는 환경에서의 안정성을 확보했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 상세 페이지 헤더를 `MainHeader` 하나로 통합했나요?**

- **A.** 기존에는 `Header`와 `BackButton`을 각각 관리하여 코드 중복이 발생하고, 페이지별로 로고/뒤로가기 버튼의 스타일이나 위치가 미세하게 달라지는 이슈가 있었습니다. `MainHeader`로 일원화하여 유지보수성을 높이고 시각적 일관성을 확보했습니다.

**Q. `InteractiveLink`에 `safeStart` 로직을 도입한 이유는?**

- **A.** 페이지를 빠르게 이동할 때 언마운트된 컴포넌트에서 애니메이션이 뒤늦게 실행되면서 발생하는 런타임 에러를 방지하기 위함입니다. `isMounted` 체크를 통해 안정적인 환경을 제공합니다.

## 2026-02-02: Vocabulary UI Architecture Refinement & Unified Infrastructure

### ✅ 진행 사항

1.  **Standalone `VocabularyToolbar` Component**:
    - `VocabularyItemsGrid` 내부에 산재해 있던 툴바 로직을 독립된 `VocabularyToolbar.tsx`로 추출하여 응집도를 높였습니다.
    - **Sticky Behavior Polish**: 헤더와 결합하여 고정될 때 백드롭 블러(`backdrop-blur`)와 적절한 패딩(`pt-2 pb-6`)을 적용하여 카드가 툴바 아래로 자연스럽게 지나가는 프리미엄 시각 효과를 구현했습니다.
    - **Consistent Shadow**: 홈 화면의 검색바와 일치하는 `shadow-sm`을 적용하여 서비스 전반의 디자인 일관성을 확보했습니다.

2.  **State Management Hook (`useVocabularyView`)**:
    - 선택 모드(`isSelectionMode`), 뷰 모드(`viewMode`), 선택 항목(`selectedIds`) 관리 로직을 `hooks/user/useVocabularyView.ts`로 중앙화했습니다.
    - 이로써 로컬 단어장과 서버 단어장 페이지가 동일한 뷰 상태 제어 로직을 공유하게 되었습니다.

3.  **Unified Layout & Semantic Markup**:
    - **`VocabularyDetailLayout`**: 모든 단어장 상세 페이지의 공통 껍데기(`MainHeader`, `<main>` 태그 등)를 레이아웃 컴포넌트로 분리하여 SRP(단일 책임 원칙)를 실현했습니다.
    - **`RemoteVocabularyDetail`**: 서버(DB)에서 데이터를 가져오는 사용자를 위해 로컬 단어장과 완벽히 동일한 UX를 제공하는 클라이언트 컴포넌트를 신설했습니다.
    - **`app/me/[listId]/page.tsx` 리팩토링**: 데이터 출처(로컬/서버)에 상관없이 일관된 레이아웃 구조를 사용하도록 마크업을 단순화했습니다.

4.  **Prop Drilling Elimination**:
    - `VocabularyItemsGrid`를 내부 상태가 없는 제어 컴포넌트(Controlled Component)로 변경하여 부모로부터 전달받은 상태에 따라 렌더링하도록 정규화했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 툴바를 그리드 밖으로 꺼냈나요?**

- **A.** 툴바가 그리드 내부에 있으면 스티키 고정 시 레이아웃 계산이 복잡해지고, 그리드 전체의 여백 조절이 부자연스러워집니다. 툴바를 형제 요소로 올림으로써 독립적인 공간 확보(`mb-10`)와 안정적인 스티키 동작을 구현할 수 있었습니다.

**Q. 왜 `RemoteVocabularyDetail`과 `LocalVocabularyDetail`을 나누었나요?**

- **A.** 로컬 데이터는 유즈 스테이트 등으로 즉시 동기화되는 반면, 원격 데이터는 서버 액션과 DB 동기화가 필요합니다. 하지만 사용자에게는 두 경험이 동일해야 하므로, 복잡한 데이터 동기화 로직은 각각의 컴포넌트가 담당하되 시각적인 UI(`Toolbar`, `Grid`)는 공통 컴포넌트를 재사용하도록 설계했습니다.

## 2026-01-31: Vocabulary Logic Refactoring & Performance Polish

### ✅ 진행 사항

1.  **Server-Side Logic Optimization**:
    - **Nested Data RPC**: `get_vocabulary_list_details` RPC를 신설하여, 단어장 상세 정보와 포함된 표현들을 단일 JSON 구조로 가져오도록 최적화했습니다 (N+1 문제 및 클라이언트 가공 로직 제거).
    - **Request Deduplication**: `services/actions/` 하위의 데이터 조회 함수들에 React `cache`를 적용하여, 한 번의 렌더링 사이클 내 중복 요청을 방지했습니다.

2.  **Interaction & Architecture Refinement**:
    - **Custom Hook Extraction**: `VocabularyListItem`에 산재해 있던 롱 프레스 로직을 `useLongPress` 커스텀 훅으로 추상화하여 코드 재사용성을 높였습니다.
    - **Stability Enhancement**: `LocalVocabularyDetail`에서 비동기 처리 중 발생할 수 있는 Race Condition과 메모리 누수 문제를 `isMounted` 패턴과 조기 반환(`early return`)으로 해결했습니다.

3.  **Terminology Standardization**:
    - **Word → Expression**: 브랜드 아이덴티티 강화를 위해 서비스 전반의 '단어(Word)' 표현을 '표현(Expression)'으로 통일했습니다.
    - **Multilingual Consistency**: 9개 언어 로케일 파일 전체에 대해 `noSavedWords`를 `noSavedExpressions`로 변경하고 자연스러운 현지화 문구로 수정했습니다.

4.  **UI/UX Polishing**:
    - **Empty State Consolidation**: `VocabularyListManager`에서 산재해 있던 빈 상태(Empty State) 디자인을 `VocabularyEmptyState` 컴포넌트로 일원화했습니다.
    - **Motion Feedback**: 상세 페이지 진입 시 컨텐츠가 부드럽게 나타나도록 `framer-motion` 애니메이션을 보강했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 "단어"를 "표현"으로 바꾸었나요?**

- **A.** 'Speak Mango'는 단순 단어 암기가 아닌 실전 문장과 뉘앙스를 배우는 서비스입니다. "단어장"이라는 명칭은 유지하되, 그 안의 알맹이는 "표현"임을 강조함으로써 사용자에게 서비스의 가치를 더 정확히 전달하고자 했습니다.

**Q. Server Action에 React `cache`를 왜 사용했나요?**

- **A.** 마이페이지나 상세 페이지처럼 여러 컴포넌트가 동일한 리스트 정보를 필요로 할 때, 각각 호출하더라도 실제 DB 쿼리는 한 번만 실행되도록 하여 서버 부하를 줄이고 데이터 일관성을 보장하기 위함입니다.

## 2026-01-31: Premium 404 Page & Error UX Enhancement

### ✅ 진행 사항

1.  **Premium 404 Dashboard**:
    - **NotFound Component**: 단순 텍스트가 아닌, 애니메이션이 적용된 검색 아이콘과 글래스모피즘 스타일이 적용된 전용 404 페이지(`app/not-found.tsx`)를 구축했습니다.
    - **Smart Navigation**: 이전 페이지로 돌아가는 '뒤로 가기'와 '홈으로 이동' 버튼을 배치하여 사용자의 이탈을 방지했습니다.

2.  **Micro-Animation Enhancement**:
    - **Error Page Refresh**: 에러 발생 시 재시도 버튼에 호버하면 `RefreshCcw` 아이콘이 180도 회전하며 동작의 의도를 시각적으로 강화했습니다.

3.  **Global Connectivity**:
    - 서비스가 지원하는 9개 언어 전체에 404 전용 번역 키를 추가하여 안정적인 글로벌 대응이 가능하도록 조치했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 404 페이지에 공을 들였나요?**

- **A.** 404 페이지는 사용자가 길을 잃었을 때 만나는 마지막 지점입니다. 여기서의 경험이 단순한 '에러'가 아닌 '친절한 안내'가 될 때 브랜드에 대한 신뢰도가 높아집니다. 디자인 일관성을 유지하기 위해 다른 페이지들과 동일한 프리미엄 테마를 적용했습니다.

## 2026-01-31: Study Mode Refinement & Technical Debt Resolution

### ✅ 진행 사항

1.  **Study Mode UX Refinement**:
    - **Coming Soon Strategy**: 아직 구현되지 않은 암기(Flashcards), 리스닝(Listening) 등의 학습 모드에 '준비 중' 상징을 부여했습니다. 그레이스케일 필터와 투명도 조절, 그리고 배지(Coming Soon)를 통해 사용자에게 명확한 상태를 전달합니다.
    - **Visual Consistency**: 개별 카드뿐만 아니라 '학습 모드' 타이틀 섹션 전체에도 통일된 비활성 스타일을 적용하여 디자인 완성도를 높였습니다.

2.  **Type-Safe Architecture Refactoring**:
    - **Centralized Types**: `types/study.ts`를 신설하여 `StudyMode` 인터페이스와 `StudyModeId` 유니온 타입을 정의했습니다. 이를 통해 기존의 `@ts-ignore` 편법을 제거하고 100% 타입 안전성을 확보했습니다.
    - **Component Flexibility**: `InteractiveLink`가 커스텀 `className`과 선택적 `onClick` 핸들러를 지원하도록 개선하여 다른 영역에서도 활용 가능한 범용성을 갖추었습니다.

3.  **Global i18n Expansion**:
    - 9개 국어(AR, DE, EN, ES, FR, JA, KO, RU, ZH) 전체에 대해 '준비 중(comingSoon)' 번역 구문을 추가하여 글로벌 사용자 대응을 완료했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 구현되지 않은 기능을 미리 마이페이지에 노출하나요?**

- **A.** 사용자에게 서비스가 앞으로 확장될 방향성(Roadmap)을 시각적으로 보여줌으로써 기대감을 형성하기 위함입니다. 버튼이 단순히 작동하지 않는 것보다 '준비 중'임을 명확히 알리는 것이 UX 측면에서도 정직하고 친절합니다.

**Q. @ts-ignore를 제거한 이유는 무엇인가요?**

- **A.** `@ts-ignore`는 개발 과정에서 일시적인 방편이 될 수 있지만, 장기적으로는 런타임 에러의 원인이 됩니다. 명시적인 인터페이스 정의를 통해 IDE의 자동 완성 기능을 활용하고, 데이터 구조 변경 시 컴파일 단계에서 오류를 잡아낼 수 있도록 설계했습니다.

## 2026-01-31: My Page Implementation & Personalized Study Experience

### ✅ 진행 사항

1.  **My Page (`/me`) Dashboard**:
    - **User Profile**: 구글 프로필 이미지( lh3.googleusercontent.com 도메인 허용) 및 사용자 정보를 표시하는 헤더 섹션을 구현했습니다.
    - **Study Mode Grid**: Flashcards(암기), Listening(리스닝), Quiz(퀴즈), Reinforce(약점 보완) 등 4가지 학습 모드를 한눈에 보고 바로 진입할 수 있는 인터페이스를 제공합니다.
    - **Vocabulary Management**: 기존의 단어장 목록을 사이드바가 아닌 메인 컨텐츠 영역에서 카드 형태로 직관적으로 관리할 수 있도록 배치했습니다.

2.  **Vocabulary Logic & UI Refinement**:
    - **Terminology Standardization**: "List"라는 표현을 각 언어별로 "Vocabulary", "Wordbook", "단어장" 등 학습 서비스에 더 적합한 용어로 통일했습니다.
    - **Empty State UX**: 저장된 항목이 없을 때 사용자에게 동기를 부여하는 일러스트(아이콘)와 안내 문구를 보강했습니다.
    - **I18n Expansion**: 마이페이지 및 단어장 관리와 관련된 수십 개의 새로운 다국어 키를 7개 주요 언어(EN, KO, ES, JA, FR, RU, ZH)에 대해 추가했습니다.

3.  **Technical SEO & Infrastructure**:
    - **Metadata Standardization**: 페이지별 `generateMetadata`에서 서비스명 중복 노출을 제거하여 검색 결과에서의 가독성을 높였습니다.
    - **Path Refinement**: `/me` (마이페이지), `/me/[id]` (개별 단어장) 등 개인화된 경로 체계를 수립했습니다.
    - **Remote Image Support**: Next.js `images` 설정에 Google 유저 프로필 도메인을 추가하여 프로필 이미지가 정상적으로 출력되도록 조치했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 단어장 관리와 학습 모드를 한 페이지에 모았나요?**

- **A.** 사용자가 저장한 내용을 '확인'하는 행위는 자연스럽게 '복습'으로 이어져야 합니다. 한 화면에서 나의 자산(단어장)을 확인하고 즉시 다양한 학습 모드를 선택할 수 있게 함으로써 학습 루프 완성도를 높였습니다.

**Q. 왜 "List"를 "단어장"으로 이름을 바꾸었나요?**

- **A.** "List"는 기술적으로는 정확하지만, 사용자에게는 단순한 목록으로 느껴질 수 있습니다. "단어장(Vocabulary)"이라는 학습 도메인 전용 용어를 사용함으로써 서비스의 본질인 '어학 학습'의 느낌을 강화하고자 했습니다.

## 2026-01-30: Vocabulary Plan Status & Limit UX Refinement

### ✅ 진행 사항

1.  **Plan Status UI Simplification**:
    - **Positive Guidance**: 기존 '무료 플랜: 3 / 5 리스트 사용 중' 문구를 '3 / 5 리스트 사용 중'으로 간소화하고, "리스트를 더 만들고 싶으신가요? 더 많은 리스트를 추가할 수 있도록 곧 업데이트될 예정입니다."와 같은 미래 지향적인 안내 문구(`planHint`)를 추가했습니다.
    - **Global i18n Support**: 9개 언어(KO, EN, JA, ZH, ES, FR, DE, RU, AR)에 대해 새로운 안내 문구 번역을 적용했습니다.

2.  **Creation Limit Enforcement**:
    - **Disabled State**: 무료 사용자 리스트 생성 한도(5개) 도달 시, `CreateListForm`의 생성 버튼을 비활성화(`disabled`)하고 시각적 피드백(투명도 조정)을 추가하여 무분별한 생성 시도를 방지했습니다.
    - **UX Consistency**: 모달 하단에 현재 리스트 사용 현황을 명확히 노출하여 사용자가 한도를 직관적으로 인지하게 했습니다.

3.  **Future-proofing & Technical Debt**:
    - `docs/product/future_todos.md`에 유료 플랜 출시 시 전환 유도 모달(Conversion Modal) 구현 계획과 기존 `freePlanLimit` 문구 복구에 대한 기술 부채를 기록했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 '무료 플랜'이라는 명칭을 숨겼나요?**

- **A.** 현재 유료 버전이 없는 상태에서 '무료'임을 강조하는 것은 사용자에게 기능적 제약만 부각시킬 수 있습니다. 대신 현재의 사용량만 보여주고, 향후 더 많은 리스트를 만들 수 있다는 긍정적인 암시를 줌으로써 유료 플랜에 대한 기대감을 높이고자 했습니다.

**Q. 한도 도달 시 왜 버튼을 비활성화했나요?**

- **A.** 이전에는 버튼은 활성화되어 있고 클릭 시 에러 메시지가 뜨는 방식이었으나, 이는 사용자에게 부정적인 경험을 줄 수 있습니다. 미리 버튼을 비활성화하고 상태를 보여줌으로써 불필요한 인터랙션을 줄이고 시스템 정책을 명확히 전달했습니다.

## 2026-01-30: Vocabulary System & Trigger Refactoring

### ✅ 진행 사항

1.  **Default Vocabulary List Implementation**:
    - **Implicit Default**: 사용자가 첫 번째로 생성한 단어장이 자동으로 '기본 단어장(Default)'으로 설정되도록 트리거(`set_vocabulary_list_first_default`)를 구현했습니다.
    - **Quick Save UX**: 저장 버튼 클릭 시 기본 단어장에 즉시 저장되는 스마트 로직을 적용했습니다.
    - **Long Press Interaction**: 단어장 목록에서 특정 리스트를 길게 눌러 기본 단어장을 손쉽게 변경할 수 있는 기능을 추가했습니다.

2.  **SQL Architecture Refinement**:
    - **Trigger Management**: `database/migrations`에 흩어져 있던 트리거 정의를 `database/functions/on_vocabulary_list_created.sql`로 통합하고 관리 체계를 정비했습니다.
    - **Schema Isolation**: 모든 SQL 함수 및 트리거에서 `SET search_path = speak_mango_en`을 명시하고 `public` 스키마 참조를 제거하여 데이터베이스 환경을 격리했습니다.

3.  **Documentation Update**:
    - `schema.md` 및 `technical_implementation/index.md`에 새로운 트리거, RPC(`get_vocabulary_lists_with_counts`), 그리고 `is_default` 모델 변경 사항을 반영했습니다.

## 2026-01-30: Vocabulary RPC & Interaction Fix

### ✅ 진행 사항

1.  **RPC Optimization (단어장 최적화)**:
    - **Single Query Fetching**: `get_vocabulary_lists_with_counts` RPC를 구현하여 단어장 목록과 각 리스트의 아이템 개수를 단일 네트워크 요청으로 조회하도록 개선했습니다. (N+1 문제 해결)

2.  **Interaction Refinement**:
    - **Prevent Card Animation**: `ExpressionCard` 내부의 `Tag` 클릭 시 부모 링크 영역의 `onPointerDown` 이벤트가 전파되어 카드가 축소되는 현상을 수정했습니다. (`data-action-buttons` 속성 활용)

## 2026-01-30: Vercel React Best Practices Optimization

### ✅ 진행 사항

1.  **WaterFall Elimination (데이터 페칭 최적화)**:
    - **Concurrent Fetching**: `generateMetadata`와 `ExpressionDetailPage`에서 `getExpressionById`와 `getI18n`을 `Promise.all`로 병렬 처리하여 초기 로딩 시간을 단축했습니다.
    - **Optimized Sequence**: 상세 페이지에서 `relatedExpressions` 호출을 유효성 검사 실패 시 건너뛰도록 재배치하여, 에러 케이스에서의 불필요한 네트워크 요청을 제거했습니다.

2.  **Rendering Performance (렌더링 성능 개선)**:
    - **List Memoization**: `Tag` 컴포넌트 등 반복 렌더링되는 리스트 아이템에 `React.memo`를 적용하여 리렌더링 비용을 최소화했습니다. (`DialogueItem`, `ExpressionCard`는 기 적용 확인)

3.  **State Logic Optimization (상태 관리 최적화)**:
    - **Stable Callback**: `DialogueSection`의 `handleEnglishClick`에서 `useCallback` 의존성을 최적화했습니다. `Set` 객체 자체를 의존성으로 갖는 대신 함수형 업데이트(`setState(prev => ...)`)를 사용하여 핸들러의 재생성을 방지했습니다.
    - **Effect Separation**: 상태 변경에 따른 부수 효과(Auto-Exit 로직)를 `useEffect`로 분리하여 코드의 예측 가능성을 높였습니다.

4.  **Bundle Size Check**: `lucide-react` 최적화를 위해 Next.js 설정을 검토했으나, Next.js 16이 기본적으로 `optimizePackageImports`를 지원함을 확인하고 중복 설정을 제거했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 404 에러 상황에서도 `getI18n`을 같이 호출하는 게 낭비 아닌가요?**

- **A.** 404 에러보다 정상 접속(200)의 비율이 압도적으로 높기 때문에, 정상 케이스에서의 로딩 속도(Waterfall 제거)를 우선시하는 것이 사용자 경험상 유리합니다. 따라서 `expression` 확인 전이라도 `i18n` 데이터를 병렬로 가져오는 것이 더 나은 전략이라고 판단했습니다.

## 2026-01-29: Type Safety Improvements & Quiz Refactoring

### ✅ 진행 사항

1.  **Type Safety Improvements (타입 안정성 강화)**:
    - **Global Type Declarations**: Window 인터페이스 확장(`declare global`)을 `types/analytics.d.ts`와 `types/global.d.ts`로 분리하여 중앙 관리했습니다.
    - **Type Safety**: `Record<string, any>` 대신 `Record<string, unknown>`을 사용하여 엄격한 타입 검사를 적용했습니다. (`analytics/index.ts`)
    - **Clean Separation**: 각 파일의 역할을 명확히 분리하여 유지보수성을 높였습니다.

2.  **Quiz Component Refactoring (퀴즈 컴포넌트 리팩토링)**:
    - **Custom Hook Extraction**: `components/quiz/QuizGame.tsx`의 복잡한 퀴즈 로직(~160 lines)을 `hooks/quiz/useQuizGame.ts` 커스텀 훅으로 분리했습니다.
    - **Reducer Pattern**: `useReducer`를 도입하여 퀴즈 상태 관리를 단순화하고 예측 가능한 상태 전환을 보장했습니다.
    - **Component Simplification**: `QuizGame.tsx`를 ~30 lines로 축소하여 UI 렌더링에 집중하도록 개선했습니다.

3.  **ShareButton Refactoring (공유 버튼 개선)**:
    - **ToastContext Integration**: 로컬 상태(`useState`)로 토스트를 관리하던 방식을 `useToast()` 훅을 사용하는 `ToastContext` 방식으로 변경했습니다.
    - **State Management Simplification**: `showToast`, `toastMessage`, `toastType` 상태를 제거하고 중앙화된 컨텍스트를 활용했습니다.
    - **Consistency**: 모든 UI 알림이 동일한 ToastProvider를 통해 일관된 애니메이션과 디자인으로 제공됩니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 퀴즈 로직을 별도 훅으로 분리했나요?**

- **A.** 퀴즈 상태 관리, 세션 스토리지 복원/지속성, 분석 트래킹 로직이 복잡하게 섞여 있어 컴포넌트의 가독성을 해치고 있었습니다. 이를 커스텀 훅으로 분리함으로써 UI 컴포넌트는 렌더링에만 집중하고, 비즈니스 로직은 훅에서 담당하도록 관심사를 명확히 분리했습니다.

**Q. 왜 `any` 대신 `unknown`을 사용했나요?**

- **A.** TypeScript의 `unknown` 타입은 명시적인 타입 가드(Type Guard)를 강제하므로 런타임 타입 안정성을 보장합니다. `any`는 타입 체크를 우회하여 잠재적인 버그를 야기할 수 있으므로, 엄격한 타입 검사가 필요한 분석 및 상태 관리 코드에는 `unknown`을 사용하도록 표준화했습니다.

**Q. ShareButton에서 왜 ToastContext를 도입했나요?**

- **A.** 기존에는 개별 컴포넌트(`ShareButton`)가 토스트의 표시 여부와 메시지 상태를 직접 들고 있었습니다. 이는 중복된 로직을 야기하고, 다른 컴포넌트에서 발생하는 알림과 시각적/기능적 불일치를 초래할 수 있습니다. `ToastContext`를 도입하여 전역에서 통일된 방식으로 알림을 관리함으로써 코드를 간소화하고 전역 에러 핸들링 시스템과의 연동성을 높였습니다.

## 2026-01-29: Error Handling Refactoring & Vocabulary Sync Stability

### ✅ 진행 사항

1.  **Centralized Error Handling (에러 핸들링 중앙화)**:
    - **`useAppErrorHandler`**: 산재되어 있던 에러 처리 로직(콘솔 로그, 토스트 알림 등)을 통합 훅으로 중앙화했습니다 (`hooks/useAppErrorHandler.ts`).
    - **Unified Error Types**: `types/error.ts`를 신설하여 `AppError` 클래스와 `ErrorCode` Enum을 정의하고, 에러 메시지 다국어 처리 기반을 마련했습니다.
    - **Global Toast**: `ToastContext`를 도입하여 에러 발생 시 사용자에게 즉각적이고 일관된 피드백을 제공합니다.

2.  **Vocabulary Update & Sync (단어장 동기화 안정화)**:
    - **Hooks Refine**: `hooks/user/useVocabularySync.ts`, `hooks/user/useSaveToggle.ts` 등을 세분화하여 동기화 로직과 UI 토글 로직을 분리했습니다.
    - **Anonymous Merge**: 로그인 시 로컬(익명) 단어장을 서버 계정으로 병합하는 로직을 고도화했습니다.
    - **UI Polish**: `VocabularyListItem` 컴포넌트 분리 및 리스트 모달 개선.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `useAppErrorHandler`를 도입했나요?**

- **A.** 기존에는 `try/catch` 블록마다 `console.error`와 `toast.error`를 중복해서 작성해야 했습니다. 이를 `handleError` 함수 하나로 통합하여 코드를 간결하게 만들고, 에러 로그 포맷과 UI 알림 방식을 전역에서 일관되게 제어하기 위함입니다.

## 2026-01-28: Vocabulary List System & Schema Cleanup

### ✅ 진행 사항

1.  **Vocabulary List System (단어장 시스템 구축)**:
    - **Custom Lists**: 사용자가 자신만의 단어장을 만들고 관리할 수 있는 기능을 구현했습니다 (`vocabulary_lists`, `vocabulary_items` 테이블).
    - **Anonymous Usage Policy**: 비로그인 사용자는 저장 기능을 사용할 수 없으며, 클릭 시 로그인 모달이 노출되도록 정책을 확정했습니다. (로컬 스토리지 기반 비로그인 저장은 혼선 방지를 위해 배제)
    - **Hybrid Repository Integration**: `useVocabularyLists` 훅을 통해 Pro 사용자는 서버 DB, Free(로그인) 사용자는 로컬 로직을 타도록 통합했습니다.
    - **UI implementation**: 단어장 생성 폼(`CreateListForm`), 단어장 선택 모달(`VocabularyListModal`)을 추가했습니다.

2.  **Schema Cleanup (스키마 정제)**:
    - **Removed `is_system`**: 초기 기획의 '시스템 단어장' 개념을 삭제하고, 모든 단어장을 사용자가 직접 관리하는 구조로 단순화했습니다. 관련 DB 컬럼 및 코드 로직을 전면 제거했습니다.
    - **Timestamp Triggers**: `vocabulary_lists`의 `updated_at` 자동 갱신을 위한 전용 트리거(`update_vocab_updated_at`)를 생성하고 관리 체계를 정립했습니다.

3.  **Refactoring & Stability**:
    - **Type Maintenance**: `ActionType`에서 `like`를 완전히 제거하고, `vocabulary` 관련 타입을 별도 파일로 분리하여 관리 효율성을 높였습니다.
    - **Hook Optimization**: `useSaveAction` 훅을 통해 저장 상태와 단어장 동기화 로직을 캡슐화했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 비로그인 사용자의 로컬 저장을 막았나요?**

- **A.** 비로그인 상태에서 로컬에 저장했다가 나중에 로그인했을 때의 데이터 병합(Merge) 로직이 복잡하고, 사용자에게 데이터 손실 우려(브라우저 캐시 삭제 시)가 있다는 점을 고려했습니다. "저장은 나만의 공간을 만드는 행위"이므로 로그인을 필수 조건으로 설정하여 데이터의 안전성과 연속성을 보장하기로 했습니다.

**Q. `is_system` 컬럼을 왜 삭제했나요?**

- **A.** 시스템이 미리 정해준 단어장보다 사용자가 직접 이름을 붙이고 분류하는 방식이 더 직관적이라고 판단했습니다. 초기 '기타' 혹은 '기본' 단어장은 첫 저장 시 자동으로 생성하거나 사용자가 선택하게 함으로써 시스템 복잡도를 낮췄습니다.

## 2026-01-27: User Action Streamlining (Like Feature Removal)

### ✅ 진행 사항

1.  **Feature Cleanup (기능 단순화)**:
    - **Remove Like Button**: 사용성이 낮고 '저장'과 역할이 중복되는 '좋아요(Like)' 기능을 제거했습니다.
    - **Focus on Save & Learn**: 사용자의 핵심 여정을 '저장(Save)'하여 모아보거나, '학습 완료(Learn)'하여 숨기는 흐름으로 단순화했습니다.
    - **DB Schema Update**: `user_actions` 테이블의 `action_type` ENUM에서 `like`를 제거하는 마이그레이션을 적용했습니다.

2.  **Code Refactoring (코드 리팩토링)**:
    - **Action System**: `ExpressionActions` 컴포넌트에서 `LikeButton` 의존성을 제거하고 `SaveButton` 단독 체제로 레이아웃을 최적화했습니다.
    - **Store Cleanup**: `useLocalActionStore` 및 리포지토리 계층에서 `like` 관련 상태 관리 로직을 모두 삭제하여 메모리 및 코드 복잡도를 줄였습니다.
    - **Constant Usage**: `actionButtonSize` prop에 하드코딩된 문자열 대신 `ACTION_ICON_SIZE` 상수를 적용하여 타입 안전성을 확보했습니다.

3.  **Migration Strategy**:
    - `019_update_action_enum.sql`: 기존의 `like` 데이터를 삭제하고 Enum 타입을 갱신하는 마이그레이션 스크립트를 작성했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 좋아요 기능을 삭제했나요?**

- **A.** 초기 기획과 달리 '저장(Save)'과 '좋아요(Like)'의 사용자 가치가 모호하고 중복된다고 판단했습니다. 언어 학습 앱의 본질은 "나중에 다시 공부하기 위해 모아두는 것(Save)"에 있으므로, 모호한 좋아요 기능을 제거하고 저장 기능에 집중하여 UX를 간결하게 만들었습니다.

## 2026-01-27: Component Reorganization & Advanced Interaction Control

### ✅ 진행 사항

1.  **Directory Structure Optimization (디렉토리 구조 최적화)**:
    - **`components/actions/`**: `ExpressionActions.tsx`, `ActionButtonGroup.tsx`, `ShareButton.tsx`를 해당 폴더로 이동하여 액션 관련 컴포넌트들을 논리적으로 그룹화했습니다.
    - **`components/ui/`**: `InteractiveLink.tsx`를 UI 유틸리티 폴더로 이동하여 `project_context.md`의 설계 지침과 실제 구조를 일치시켰습니다.
    - **Import Path Cleanup**: 파일 이동에 따른 프로젝트 전반의 임포트 경로를 일괄 업데이트하여 참조 오류를 방지했습니다.

2.  **Standalone Component Extraction (컴포넌트 독립화)**:
    - **`InteractiveLink.tsx`**: `ExpressionCard` 내부에 있던 복잡한 포인터 이벤트 핸들링 및 애니메이션 제어 로직을 독립된 컴포넌트로 분리하여 재사용성을 확보했습니다.
    - **`ActionButtonGroup.tsx`**: 액션 버튼 그룹의 이벤트 전파 차단(`stopPropagation`)과 포인터 이벤트 제어(`pointer-events-auto`)를 캡슐화했습니다.

3.  **Manual Animation Control (수동 애니메이션 제어)**:
    - **Precision UX**: Framer Motion의 `whileTap` 대신 `useAnimation` 훅을 도입했습니다. `data-action-buttons` 마킹을 통해 버튼 클릭 시 카드 전체의 눌림 애니메이션이 트리거되는 시각적 버그를 해결했습니다.

4.  **Interaction Bug Fixes**:
    - **Login Modal Propagation**: 로그인 모달의 오버레이(`Overlay`)와 컨텐츠(`Content`) 클릭 시 이벤트가 부모 요소로 전파되는 현상을 차단하여 의도치 않은 페이지 이동을 막았습니다. (`v0.14.9` 관련)

### 💬 주요 Q&A 및 의사결정

**Q. 왜 컴포넌트들을 `actions/` 폴더로 옮겼나요?**

- **A.** 프로젝트가 성장함에 따라 `components/` 최상위 폴더가 비대해지는 것을 방지하고, '학습/좋아요/공유' 등 사용자 액션과 관련된 컴포넌트들을 한곳에 모아 관리 효율성을 높이기 위함입니다. 이는 `project_context.md`에 명시된 아키텍처 가이드를 준수하는 조치이기도 합니다.

**Q. 왜 `whileTap` 대신 `useAnimation` 명령형 방식을 사용했나요?**

- **A.** 선언적 애니메이션인 `whileTap`은 하위 요소의 `stopPropagation()`으로 제어할 수 없는 시각적 피드백을 발생시킵니다. 명령형 API(`controls.start`)를 사용하면 클릭 시점의 타겟 요소를 프로그래밍적으로 분석하여, "진짜 카드 클릭"일 때만 애니메이션을 실행하는 정밀한 제어가 가능하기 때문입니다.

## 2026-01-27: Component Refactoring & Interaction Bug Fix

### ✅ 진행 사항

1.  **Expression Actions Refactoring (컴포넌트 구조 고도화)**:
    - **`ExpressionActions.tsx`**: `LikeButton`, `SaveButton`, `ShareButton`을 하나의 독립적인 액션 바 컴포넌트로 통합 리팩토링했습니다.
    - **Reusability**: 상세 페이지(`app/expressions/[id]/page.tsx`)와 리스트 카드(`components/ExpressionCard.tsx`)에서 중복되던 액션 버튼 레이아웃 코드를 제거하고, 새롭게 생성한 공통 컴포넌트를 적용하여 코드 응집도를 높였습니다.
    - **Dynamic Sizing**: 사용처에 따라 버튼 크기(`lg` vs `default`)와 공유 버튼의 스타일(`compact` vs `default`)을 Props로 유연하게 제어할 수 있도록 설계했습니다.

2.  **Auth UI Interaction Bug Fix (로그인 모달 클릭 전파 해결)**:
    - **Event Stop Propagation**: 로그인 모달의 오버레이(`Overlay`)와 컨텐츠(`Content`) 영역 클릭 시 이벤트가 부모 요소(특히 `ExpressionCard`의 클릭 핸들러 등)로 전파되어 의도치 않은 페이지 이동이 발생하는 현상을 `e.stopPropagation()`을 통해 원천 차단했습니다.
    - **UX Stability**: 비로그인 상태에서 액션 시도 시 모달이 떴을 때, 모달 내부를 클릭해도 배경의 카드가 클릭된 것으로 간주되어 상세 페이지로 이동해버리는 심각한 UX 결함을 수정했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 개별 버튼들을 하나로 묶었나요?**

- **A.** 상세 페이지와 리스트 카드에서 '좋아요-저장-공유'로 이어지는 액션 그룹은 항상 세트로 움직이는 경향이 있습니다. 이를 매번 수동으로 배치하면 간격(`gap`)이나 정렬(`justify-between`) 설정에서 미세한 오차가 발생하기 쉽습니다. 하나로 그룹화함으로써 레이아웃의 일관성을 강제하고 유지보수 포인트를 단일화했습니다.

**Q. 모달 클릭 시 왜 상세 페이지로 이동했었나요?**

- **A.** `ExpressionCard`는 카드 전체가 상세 페이지로 연결되는 `Link` 또는 `onClick` 핸들러를 가지고 있습니다. 로그인 모달은 Radix UI(Dialog)를 사용하지만, 클릭 이벤트는 DOM 트리를 따라 위로 전파(Bubbling)됩니다. 모달의 오버레이나 컨텐츠를 클릭했을 때 이 이벤트가 카드 컨테이너까지 도달하여 "카드가 클릭되었다"고 인식했기 때문입니다. 이를 명시적으로 멈춰주어 모달 내부 인터랙션이 배경 요소에 영향을 주지 않도록 조치했습니다.

## 2026-01-26: Auth Navigation Loop Fix & UX Refinement

### ✅ 진행 사항

1.  **Auth Navigation Loop Fix (로그인 뒤로가기 루프 해결)**:
    - **Back Button Intelligence**: 구글 로그인 성공 후 상세 페이지에서 '뒤로가기' 클릭 시, 브라우저 히스토리에 남은 구글 계정 선택 화면으로 되돌아가는 UX 결함을 수정했습니다.
    - **History Jump Logic**: `document.referrer`를 분석하여 구글 인증 페이지(`accounts.google.com`)에서의 진입을 감지하고, `window.history.go(-3)` 명령을 통해 `[현재 페이지(로그인 후) <- 구글 인증 <- 현재 페이지(로그인 전)]` 단계를 한 번에 건너뛰어 실제 '이전 페이지'로 정확히 복귀하도록 구현했습니다.
    - **Fallback Strategy**: 히스토리가 충분하지 않은 경우(예: 주소창 직접 진입 후 로그인)에는 안전하게 홈 화면(`ROUTES.HOME`)으로 리다이렉트되도록 예외 처리를 추가했습니다.

## 2026-01-26: User Action High-Touch Improvements (Interaction & Design)

### ✅ 진행 사항

1.  **High-Level Interaction Refinement (인터랙션 고도화)**:
    - **Learn Button Auto-Scroll**: '학습 완료(`LearnButton`)' 버튼 클릭 시, 사용자의 시선을 다음 학습 콘텐츠로 자연스럽게 유도하기 위해 하단의 '관련 표현(`RelatedExpressions`)' 섹션으로 부드럽게 자동 스크롤되는 기능을 구현했습니다.
    - **Smooth Scroll Algorithm**: 브라우저 기본 스크롤(`scrollIntoView`)의 한계(속도 제어 불가, `scroll-margin` 무시 등)를 극복하기 위해, `requestAnimationFrame`과 `easeInOutQuad` 이징(Easing) 함수를 적용한 커스텀 스크롤 유틸리티(`lib/scroll.ts`)를 자체 구현했습니다.
    - **Mobile-Specific Offset**: 모바일 환경에서 고정 헤더가 콘텐츠를 가리는 문제를 해결하기 위해, 타겟 요소의 `scroll-margin-top` CSS 속성을 동적으로 계산하여 스크롤 오프셋에 반영하는 스마트한 로직을 적용했습니다.

2.  **Visual Design System Polishing (디자인 시스템 개선)**:
    - **Learn Button Redesign**: 기존의 흐릿한 색상 대비를 개선하여, 학습 완료 상태(`isLearned`)에서 진한 초록색과 흰색 체크 아이콘(`CheckCircle`)을 사용하여 가시성을 극대화했습니다. 미완료 상태에서는 보더(`border`) 대신 그림자(`shadow-sm`)를 활용하여 깔끔하고 모던한 UI를 구현했습니다.
    - **Dark Mode Consistency**: 다크 모드에서도 눈부심 없이 편안한 경험을 제공하기 위해, 라이트 모드와 동일한 브랜드 컬러(`bg-green-600`)를 유지하되 그림자 심도를 조절하는 방식을 채택했습니다.
    - **Modal Layout Balance**: 로그인 모달의 타이틀, 설명, 버튼 간의 간격(`gap-4`)을 균일하게 조정하여 시각적 안정감을 주었습니다.

3.  **Code Maintenance & Reusability (코드 재사용성)**:
    - **`lib/scroll.ts`**: 스크롤 애니메이션 로직을 별도 유틸리티로 분리하여 프로젝트 전반에서 재사용할 수 있도록 구조화했습니다.
    - **`scrollToId` Prop**: `LearnButton` 컴포넌트가 특정 ID를 알 필요 없이, 외부에서 주입받은 ID로 스크롤할 수 있도록 설계하여 결합도(Coupling)를 낮췄습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 브라우저 기본 스크롤 API를 쓰지 않고 직접 구현했나요?**

- **A.** `scrollIntoView({ behavior: 'smooth' })`는 스크롤 속도를 개발자가 제어할 수 없습니다. 특히 '학습 완료'와 같은 중요한 액션 후에는 사용자가 맥락을 놓치지 않도록 **천천히(1초 이상)** 스크롤되는 경험을 제공하고 싶었습니다. 또한 `scroll-margin` 속성이 일부 상황에서 무시되는 브라우저 호환성 문제를 해결하기 위해 직접 계산 로직을 포함했습니다.

**Q. 모바일에서 스크롤 위치가 왜 중요한가요?**

- **A.** 데스크탑과 달리 모바일은 화면이 좁고 상단 헤더가 고정되어 있는 경우가 많습니다. 스크롤이 정확히 요소의 시작점에 멈추면 헤더에 콘텐츠가 가려지는 현상이 발생합니다. 이를 방지하기 위해 `scroll-mt-*` 클래스와 연동된 오프셋 계산이 필수적입니다.

## 2026-01-26: SEO Logic Finalization & Technical Improvements

### ✅ 진행 사항

1.  **Technical SEO (기술적 SEO)**:
    - **Path-based Hreflang**: 하위 경로가 존재하지 않는 404 문제를 해결하기 위해 `proxy.ts`에 경로 기반(`path-based`) 언어 감지 및 Rewrite 로직을 추가했습니다. `/ko`, `/ja` 등으로 접근 시 해당 언어 페이지로 정상 연결됩니다.
    - **Self-referencing Canonical**: 모든 페이지의 `canonical` 및 `og:url` 태그를 절대 경로(`BASE_URL`)에서 상대 경로(`./`)로 변경하여, 다국어 페이지 각각이 원본 페이지로 인정받도록 수정했습니다.
    - **Robot Control**: `app/robots.ts` 및 관리자 페이지 메타태그를 통해 `/studio`, `/admin` 경로의 크롤링을 원천 차단했습니다.
2.  **Metadata Optimization**:
    - **Dynamic Hreflang Generation**: `app/layout.tsx`에서 지원 언어 목록(`SUPPORTED_LANGUAGES`)을 기반으로 `alternates` 태그를 동적으로 생성하여 구글 검색 엔진에 다국어 관계를 명확히 알렸습니다.
    - **Authentication Verification**: 불필요하거나 중복된 인증 태그(`google-site-verification`, `manifest`)를 정리하여 헤더를 경량화했습니다.

## 2026-01-26: Brand Identity & Auth UX Polishing

### ✅ 진행 사항

1.  **Premium Auth UI Design**:
    - **Login Modal Refinement**: 로그인 모달 타이틀에 브랜드 로고 이미지와 그라데이션 텍스트(`SERVICE_NAME`)를 통합하여 디자인의 일관성과 고급스러움을 강화했습니다.
    - **Centered Animation**: 모달 오픈 시의 좌우 슬라이드 애니메이션을 제거하고, 화면 중앙 축을 중심으로 부드러운 페이드와 줌 효과만 적용하여 안정적인 UX를 제공합니다.
    - **Visual Details**: 백드롭 블러 강도 조정(`xs`), 닫기 버튼 포커스 링 제거 및 커서 스타일(`sm:cursor-pointer`) 추가, 다크 모드 로딩 스피너 가시성(`border-current`)을 개선했습니다.
2.  **Auth Experience Optimization**:
    - **Logout UX**: 로그아웃 시 즉시 스켈레톤 UI를 보여주고 비동기 작업을 처리하여 사용자에게 즉각적인 피드백을 제공합니다. (`UserMenu.tsx`)
    - **State Integrity**: 로그아웃 시 로컬 UI 상태(좋아요/저장 등)가 안전하게 초기화되도록 `useEffect` 의존성에 `user` 세션 상태를 명확히 추가했습니다.
3.  **Global Message Optimization**:
    - **Habit-Forming Copy**: 로그인 유도 문구를 단순히 기능적인 설명에서 "마음에 드는 표현을 저장하고, 당신만의 특별한 영어 습관을 만들어보세요"라는 더 강력한 동기 부여형 문구로 변경했습니다.
    - **Localization Expansion**: 이를 9개 국어 모든 언어팩에 타겟 언어별 자연스러운 뉘앙스로 일괄 적용했습니다.
4.  **Style & Asset Standardization**:
    - **Text Utility**: 브랜드 전용 그라데이션 스타일을 `text-brand-gradient` 유틸리티 클래스로 정의하여 `globals.css`에서 중앙 관리합니다.
    - **Next.js Image Adoption**: `LoginModal`의 로고 이미지를 `next/image` 컴포넌트로 교체하여 최적화 및 레이아웃 안정성을 확보했습니다.

## 2026-01-25: Design System Centralization & Logic Refactoring

### ✅ 진행 사항

1.  **Design Token Centralization (디자인 토큰 중앙화)**:
    - **`--radius-card` & `rounded-card`**: 프로젝트 전반에 산재해 있던 하드코딩된 `rounded-3xl` 값을 `app/globals.css`의 CSS 변수와 유틸리티 클래스로 중앙 집중화했습니다. 이제 서비스 전체의 카드 곡률을 한 곳에서 제어할 수 있습니다.
    - **UI 적용**: `ExpressionCard`, `QuizGame`, `Skeletons`, `StudioClient`, 메인 페이지 Empty State 등 주요 카드형 UI에 일괄 적용하여 시각적 일관성을 확보했습니다.
2.  **Logic Clean-up with Constants (상수 기반 리팩토링)**:
    - **`VIEW_MODE` Constants**: `DialogueSection.tsx` 내에서 하드코딩된 상태 문자열(`blind`, `partial`, `exposed`)을 `VIEW_MODE` 상수로 대체하여 오타를 방지하고 유지보수성을 높였습니다.
3.  **Visual Polish**:
    - `ExpressionCard`의 호버 시 발생하는 각진 잔상 현상을 제거하기 위해 상위 컨테이너 구조에도 곡률을 적용하고, 호버 그림자의 강도를 은은하게 조정했습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `rounded-3xl` 대신 커스텀 유틸리티(`rounded-card`)를 사용하나요?**

- **A.** 서비스의 브랜드 아이덴티티가 변경되어 곡률을 `2xl`이나 `full`로 바꾸고 싶을 때, 수십 개의 파일을 일일이 수정하는 대신 `globals.css`의 변수 하나만 바꾸면 되기 때문입니다. 이는 "Single Source of Truth" 원칙을 준수하기 위함입니다.

## 2026-01-25: Internationalization (i18n) Refactoring

### ✅ 진행 사항

1.  **I18n Context Adoption (다국어 컨텍스트 도입)**:
    - **`I18nProvider` & `useI18n`**: 서버 유래 데이터(`dict`, `locale`)를 클라이언트 컴포넌트 트리 전체에 공유하기 위한 전역 컨텍스트를 구축했습니다.
2.  **Prop Drilling Elimination (배달용 Prop 제거)**:
    - **말단 컴포넌트 리팩토링**: `ShareButton`, `ScrollToTop`, `DialogueSection`, `KeywordList`, `LoginModal` 등 모든 클라이언트 컴포넌트가 부모로부터 `dict`를 넘겨받는 대신 `useI18n()` 훅을 통해 직접 데이터를 가져오도록 수정했습니다.
3.  **Localization Scale-up (언어팩 고도화)**:
    - **Localization Integrity**: 9개국 모든 언어팩에 로그인 모달 문구, 학습 모드 토글 라벨, 오디오 제어 툴팁 등을 일괄 추가하여 UI의 다국어 완성도를 높였습니다.
4.  **Logo Static Refactoring (로고 컴포넌트 정적화)**:
    - `Logo` 컴포넌트가 더 이상 서비스명을 Prop으로 받지 않고, 내부에서 `SERVICE_NAME` 상수를 직접 참조하도록 변경하여 결합도를 낮췄습니다.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Prop Drilling 방식을 Context 방식으로 바꿨나요?**

- **A.** 프로젝트가 확장되면서 거의 모든 클라이언트 컴포넌트가 번역 데이터(`dict`)를 필요로 하게 되었습니다. 이를 매번 부모 컴포넌트에서 주입해주는 방식은 코드의 가독성을 해치고, 중간 단계의 컴포넌트들이 불필요한 데이터를 들고 있어야 하는 오버헤드를 발생시켰기 때문입니다. Context 공법을 통해 각 컴포넌트가 독립적으로 최신 언어 상태를 참조할 수 있게 되었습니다.

## 2026-01-25: UI Centralization & Navigation Polishing

### ✅ 진행 사항

1.  **UI Utility Centralization (스타일 중앙화)**:
    - **`nav-divider`**: 헤더의 구분선(`|`) 스타일(`hidden sm:inline text-sm text-disabled`)을 `globals.css`의 `@utility nav-divider`로 추출하여 중앙 관리 체계를 구축했습니다.
    - **Auth Skeleton**: Auth 버튼과 스켈레톤의 스타일 불일치를 방지하기 위해 `skeleton-avatar` 유틸리티를 활용하도록 구조화했습니다.
2.  **Component Extraction (컴포넌트화)**:
    - **`NavDivider.tsx`**: 반복적으로 사용되던 구분선 코드를 별도의 컴포넌트로 분리하여 가독성과 유지보수성을 높였습니다.
3.  **Skeleton UI Refinement (로딩 UI 고도화)**:
    - **`SkeletonNavbar`**: `MainHeader`에 새롭게 추가된 `AuthButton` 레이아웃에 맞춰 로딩 스켈레톤을 업데이트했습니다 (두 번째 구분선 및 버튼 형태 추가).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `NavDivider`를 컴포넌트로 분리했나요?**

- **A.** 헤더 내비게이션에서 구분선이 여러 곳에서 반복적으로 사용됩니다. 단순한 `span` 태그와 클래스 조합을 컴포넌트화함으로써, 나중에 구분선의 모양(`|` -> `·`)이나 간격 등을 변경하고 싶을 때 한 곳에서만 수정하면 되기 때문입니다.

## 2026-01-24: User System Finalization (Hybrid Repo & UI)

### ✅ 진행 사항

1.  **Interactive UI Components (사용자 인터페이스)**:
    - **Authentication**: `AuthButton.tsx` (헤더 로그인) 및 `LoginModal.tsx` (가입 유도) 구현. `Framer Motion`을 적용하여 부드러운 진입/퇴장 애니메이션 제공.
    - **Action Buttons**:
      - `LikeButton`: 하트 애니메이션과 함께 좋아요 토글.
      - `SaveButton`: 북마크 저장/취소.
      - `LearnButton`: 학습 완료 처리 및 다음 카드로 자동 스크롤.
    - **Reactivity**: `useLocalActionStore`를 구독하여, 리스트에서 좋아요를 눌렀을 때 상세 페이지의 버튼 상태도 즉시 동기화되도록 구현.

2.  **Hybrid Repository Pattern (데이터 저장소)**:
    - **Dual Strategy**: 티어에 따라 저장소를 자동 전환하는 전략 구현.
      - **Free/Anonymous**: `localStorage` 사용 (비용 $0, 속도 Fast). `Set` 자료구조 직렬화 로직 및 `persist` 미들웨어 적용.
      - **Pro**: `Supabase DB` 사용 (영구 보존, 멀티 디바이스). `toggle_user_action` RPC 및 Server Action 연동.
    - **Sync System**: 유료 전환 시 로컬 데이터를 서버로 일괄 업로드(`syncUserActions`)하는 마이그레이션 로직 포함.

3.  **Auth Architecture Stabilization (Schema View Strategy)**:
    - **문제 해결**: NextAuth(`camelCase`)와 Supabase(`snake_case`)의 네이밍 충돌 해결.
    - **View Proxy Pattern**:
      - Data Layer: `speak_mango_en` (Snake Case Standard).
      - View Layer: `speak_mango_en_next_auth` (Camel Case View).
      - Adapter: `CustomSupabaseAdapter`를 통해 View Layer와 통신.

4.  **Backend Infrastructure**:
    - **Session Strategy**: Database Session (Refresh Token) 방식으로 보안 강화.
    - **Triggers**: `users`, `sessions` 테이블 자동 갱신 트리거 및 인덱스 최적화 완료.

### 💬 주요 Q&A 및 의사결정

**Q. 로그인 모달은 언제 뜨나요?**

- **A.** 비로그인(익명) 사용자가 '좋아요', '저장', '학습 완료' 버튼을 클릭할 때 즉시 노출됩니다. 콘텐츠 열람은 자유롭지만, 상호작용을 위해서는 로그인이 필요함을 부드럽게 알리기 위함입니다.

**Q. 왜 View Proxy 패턴을 썼나요?**

- **A.** DB 컬럼명을 라이브러리에 맞춰 `camelCase`로 바꾸면 SQL 가독성이 떨어지고, 기존 컨벤션을 해치게 됩니다. "DB는 DB답게, 코드는 코드답게" 유지하기 위해 View를 번역기(Translator)로 사용했습니다.

**Q. 버튼 상태 동기화는 어떻게 처리했나요?**

- **A.** `useLocalActionStore`가 전역 상태 관리(Zustand) 역할을 수행합니다. 어떤 컴포넌트에서든 액션이 발생하면 스토어가 업데이트되고, 이를 구독하는 모든 버튼 컴포넌트가 리렌더링되어 최신 상태를 반영합니다.

## 2026-01-24: Auth System Stabilization (Schema View Strategy)

### ✅ 진행 사항

- **인증 아키텍처 개선 (Schema View Strategy)**:
  - **문제**: NextAuth Supabase Adapter는 `next_auth` 스키마와 `camelCase` 컬럼을 강제하여, 기존 `speak_mango_en` 스키마(`snake_case`)와 충돌 발생.
  - **해결**: **"View Proxy Pattern"** 도입.
    - **Data Layer (`speak_mango_en`)**: 테이블과 컬럼은 `snake_case` 표준을 준수하여 저장 (`user_id`, `session_token` 등).
    - **View Layer (`speak_mango_en_next_auth`)**: NextAuth 전용 스키마를 생성하고, Updatable View를 통해 테이블과 매핑 (`userId` -> `user_id`).
    - **Adapter**: 공식 `@auth/supabase-adapter` 대신 스키마 설정이 가능한 `CustomSupabaseAdapter` (Lite Version) 사용.
- **코드 리팩토링**:
  - `constants/index.ts`에 `AUTH_SCHEMA` 상수 추가하여 하드코딩 제거.
  - `017_create_next_auth_views.sql`: 전용 스키마 및 View 생성 마이그레이션 적용.
  - `018_cleanup_indexes.sql`: 중복 인덱스 정리.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 공식 어댑터 대신 커스텀 어댑터를 사용했나?**

- **A.** 공식 어댑터는 스키마 이름이 `next_auth`로 하드코딩되어 변경할 수 없습니다. 다중 프로젝트 전략(`supabase_strategy.md`)에 따라 `speak_mango_en_next_auth`와 같이 네임스페이스가 포함된 스키마를 사용하기 위해, 스키마 옵션만 주입할 수 있는 경량 커스텀 어댑터를 적용했습니다.

**Q. 왜 View를 사용했나?**

- **A.** 데이터베이스 표준(Snake Case)과 라이브러리 요구사항(Camel Case)을 모두 만족시키기 위해서입니다. 테이블 컬럼명을 라이브러리에 맞춰 Camel Case로 바꾸면 SQL 쿼리 작성 시 쌍따옴표(`"userId"`)를 매번 써야 하는 불편함과 기존 관례 파괴 문제가 발생합니다. View를 "번역기"로 활용하여 이 문제를 우아하게 해결했습니다.

## 2026-01-24: User System Phase 2 Implementation (Hybrid Repository)

### ✅ 진행 사항

- **Hybrid Repository Pattern**: `LocalUserActionRepository`와 `RemoteUserActionRepository` 구현.
  - 무료/익명 사용자: `localStorage` 직접 접근 (Direct Access)으로 비용 절감 및 속도 최적화.
  - 유료 사용자: `Supabase RPC`(`toggle_user_action`) 및 `Server Actions`를 통한 데이터 영구 저장 및 원자성 확보.
- **Interface Segregation**: `UserActionRepository` (기본)와 `SyncableRepository` (동기화 포함) 인터페이스 분리.
- **Functional Refactoring**: 클래스 기반 리포지토리를 객체 리터럴(Object Literal)로 변경하여 React Hook과의 호환성 및 간결성 확보.
- **Client-Side State Management (Zustand)**:
  - `LocalUserActionRepository`를 Zustand Store(`store/useLocalActionStore.ts`) 기반으로 재구현.
  - `localStorage` 직접 접근 방식의 비효율성(매번 파싱) 제거 및 UI 반응성(Reactivity) 기반 마련.
  - `constants/index.ts`에 `LOCAL_STORAGE_KEYS` 상수를 도입하여 키 관리 안전성 확보.
- **Code Audit (Vercel Best Practices)**:
  - `persist` 미들웨어 사용으로 SSR Hydration Mismatch 방지.
  - `Set` 자료구조 직렬화(Serialization) 로직 구현.

## 2026-01-24: User System Phase 1 Implementation (NextAuth & Schema)

### ✅ 진행 사항

- **인프라 구축**: NextAuth (Auth.js v5) 기반의 사용자 인증 시스템 초기 구축 완료.
- **Refresh Token 전략**: 보안 및 세션 제어 강화를 위해 Database Session (Refresh Token) 방식 도입.
- **데이터베이스 마이그레이션**:
  - `016_init_user_system.sql` 실행 완료: `users`, `accounts`, `sessions`, `user_actions` 테이블 생성.
  - `database/triggers/update_users_timestamp.sql` 구현: 사용자 정보 변경 시 `updated_at` 자동 갱신.
- **인증 설정 및 훅**:
  - `lib/auth/config.ts`: Google Provider 및 Database Session 설정 완료.
  - `hooks/useAuthUser.ts`: 클라이언트 사이드 인증 정보 접근성 강화.
- **환경 설정**: `docs/environment_setup.md` 작성을 통한 로컬/프로덕션 환경 변수 가이드 마련.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 JWT에서 Database Session (Refresh Token) 방식으로 변경했나?**

- **A.**
  1. **즉각적인 권한 제어**: 사용자가 구독을 취소하거나 계정이 정지되었을 때, DB에서 세션을 삭제하여 즉시 접근을 차단하기 위함.
  2. **보안성**: 토큰이 탈취되었을 때 서버 사이드에서 세션을 무효화할 수 있는 수단이 필요했음.
  3. **유연성**: 사용자 등급(Tier) 변경 등이 발생했을 때 세션 갱신 주기(24시간) 내에 DB를 통해 최신 정보를 강제할 수 있음.

**Q. 왜 Trigger를 별도 파일로 분리했나?**

- **A.** 트리거 함수(`update_updated_at_column`)와 트리거 정의가 마이그레이션 스크립트에 섞여 있으면 관리가 어려움. `database/triggers/` 폴더를 신설하여 상세한 주석과 함께 독립적으로 관리함으로써 유지보수성을 높임.

**Q. `ranking_stats` 테이블의 위치를 왜 변경했나?**

- **A.** 해당 테이블은 사용자별 고유 데이터가 아닌, 전체 데이터를 기반으로 한 **집계(Aggregation)** 목적이 크므로 '사용자 데이터' 섹션보다는 '분석 및 집계' 섹션으로 독립시켜 설계의 명확성을 확보함. (참고: 현 단계에서는 설계만 분리되었으며, 실제 테이블 생성은 Phase 6에서 진행 예정)

## 2026-01-23: User System Strategy Update (NextAuth Pivot)

### ✅ 진행 사항

- **인증 아키텍처 변경**: Supabase Auth 대신 **NextAuth (Auth.js v5)** + **JWT** 방식을 채택. 초기 비용 절감 및 유연한 커스텀 필드 관리 목적.
- **데이터베이스 스키마 재설계**:
  - `users` (Custom Table) + `accounts` (OAuth) 구조 정의.
  - `user_actions` 및 `user_custom_cards` 테이블 설계로 하이브리드 리포지토리 패턴 지원.
  - `database/migrations/000_init_user_system.sql` 작성 완료.
- **문서화 구조 개선**:
  - 사용자 관련 문서를 `docs/users/` 폴더로 이동하여 응집도 강화.
  - `docs/users/user_system_plan.md`에 하이브리드 리포지토리 패턴, 권한 매트릭스, 체험판 로직 등 상세 구현 계획 복구 및 업데이트.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Supabase Auth 대신 NextAuth를 선택했나?**

- **A.**
  1.  **비용 효율성**: MAU 증가 시 Supabase Auth 유료 플랜 비용을 절감.
  2.  **커스텀 필드 제어**: `subscription_end_date`, `tier` 등의 핵심 필드를 JWT에 포함하여 DB 조회 없이 API 레벨에서 권한 검증 가능 (성능 최적화).
  3.  **데이터 소유권**: 사용자 테이블(`users`)을 직접 제어하여 향후 마이그레이션 용이성 확보.

**Q. `accounts` 테이블은 왜 필요한가?**

- **A.** NextAuth 표준 스키마 준수 및 **1인 다중 로그인 수단(구글, 애플 등)** 지원을 위해 `users`와 분리된 계정 관리 테이블이 필수적임.

**Q. 문서 구조를 왜 변경했나?**

- **A.** `user_system_plan.md`와 `user_feature_requirements.md`가 제품 기획(`docs/product`)보다는 사용자 시스템이라는 특정 도메인에 집중되므로, `docs/users/`로 분리하여 관리 효율성을 높임.

## 2026-01-23: 헤더 스타일링 유연성 개선 (Prop Injection 도입)

### ✅ 진행 사항

- **헤더 스타일링 유연성 개선(Header Utility Refactoring)**: 특정 페이지(홈)에서 헤더와 FilterBar를 시각적으로 자연스럽게 연결하기 위해 `scrolledClassName` prop 도입.
- **의사결정**: 상위 컴포넌트(`MainHeader`)가 하위의 특정 모드(`home` variant)를 아는 대신, 필요한 스타일을 직접 주입하는 방식(Prop Injection)을 채택하여 결합도를 낮추고 재사용성을 높임.
- **문법 최적화**: `isScrolled && scrolledClassName` 패턴을 사용하여 `cn` 유틸리티 내에서 안전하게 조건부 클래스를 적용하도록 구현.

## 2026-01-23: 퀴즈 상태 유지 및 모바일 UX 개선

### ✅ 진행 사항

- **퀴즈 상태 유지(State Persistence)**: '공부하기' 페이지 방문 후 뒤로 가기 시 기존 퀴즈 진행 상황(문제 번호, 점수, 히스토리 등)이 유지되도록 `sessionStorage` 연동.
- **모바일 네비게이션 최적화**: 모바일 환경에서 '공부하기' 버튼 클릭 시 새 탭 대신 현재 탭에서 이동하도록 수정하여 불필요한 레이아웃 깜빡임 및 리소스 낭비 방지.
- **스토리지 키 중앙 관리**: `quiz_return_flag`, `quiz_state` 등 하드코딩된 문자열을 `lib/quiz.ts` 내 `QUIZ_STORAGE_KEYS` 상수로 정의하여 유지보수성 향상.

### 💬 주요 Q&A 및 의사결정

**Q. 새로고침 시에도 퀴즈 상태가 유지되어야 하나?**

- **A.** 아니오. 사용자의 요구사항에 따라 '새로고침'이나 '일반 진입' 시에는 퀴즈가 처음부터 리셋되어야 함. 따라서 `StudyButton` 클릭 시에만 `quiz_return_flag`를 설정하여, 이 플래그가 있을 때만 복원 로직이 작동하도록 설계함.

**Q. 왜 `sessionStorage`를 사용하나?**

- **A.** `localStorage`는 브라우저를 닫아도 데이터가 남지만, `sessionStorage`는 탭별로 독립적이며 탭을 닫으면 자동으로 비워짐. 퀴즈와 같은 일회성 진행 상태를 관리하기에 가장 적합한 도구임.

### 2026-01-22: Responsive UI Refactoring (CSS-based)

- **Goal**: JS 기반의 반응형 처리(`useIsMobile`)를 CSS 유틸리티(`sm:hidden`, `sm:hover`)로 대체하여 SSR 호환성을 확보하고 렌더링 성능을 개선합니다.
- **Actions**:
  - **Components Refactoring**: `DialogueAudioButton`, `DialogueItem`, `DialogueSection`, `RelatedExpressions` 등 주요 컴포넌트의 조건부 렌더링 로직을 Tailwind CSS 클래스로 전환.
  - **Performance**: `RelatedExpressions`에서 `offsetParent` 체크를 도입하여, CSS로 숨겨진 상태(모바일)에서는 무한 스크롤 애니메이션 연산을 중지하도록 최적화.
  - **Style**: 데스크탑 호버 효과를 `sm:hover:`로 변경하여 터치 디바이스에서의 오작동 방지.
- **Outcome**: 초기 로딩 시의 Hydration Mismatch 해결 및 불필요한 리렌더링 제거.

### 2026-01-22: Quiz UI Layout Refinement

- **Goal**: 퀴즈 완료 화면(Summary)의 모바일 레이아웃을 개선하여 버튼 터치 영역을 확보하고, 컴포넌트 네이밍을 직관적으로 변경합니다.
- **Actions**:
  - **Mobile Layout (`QuizGame.tsx`)**: 모바일 화면에서 리뷰 리스트의 버튼이 너무 좁아지는 문제를 해결하기 위해, `flex-col`을 적용하여 '텍스트 하단'으로 버튼을 이동시키고 너비를 100%로 확장했습니다.
  - **Refactoring (`StudyButton.tsx`)**: 컴포넌트의 역할(Action)을 명확히 하기 위해 `StudyLink`를 `StudyButton`으로 이름을 변경했습니다.
- **Outcome**: 모바일 사용성(Usability) 향상 및 코드 가독성 개선.

### 2026-01-22: Mobile Flicker Fix & Skeleton Refinement

- **Goal**: 모바일 환경에서 헤더 텍스트가 깜빡이는(Flicker) 현상을 제거하고, 스켈레톤 UI의 로직을 상수로 중앙화하여 안정성을 높입니다.
- **Actions**:
  - **Mobile Optimization (`components/MainHeader.tsx`)**:
    - `useIsMobile` 훅(JS) 기반의 조건부 렌더링을 CSS(`hidden sm:block`) 반응형 클래스로 교체.
    - 초기 로딩 시점의 UI 불일치(Hydration Mismatch) 및 깜빡임 현상 원천 차단.
    - Client Component(`"use client"`)에서 Server Component로 전환하여 번들 사이즈 감소.
  - **Skeleton Refactoring (`components/ui/Skeletons.tsx`)**:
    - `SkeletonNavbar`의 모드 제어 방식을 불리언(`isQuiz`)에서 명시적인 `page` Prop(`home` | `detail` | `quiz`)으로 변경.
    - `SKELETON_PAGE` 상수를 `constants/ui.ts`로 분리하여 Client/Server 컴포넌트 간 임포트 에러 해결.
    - 홈 화면 스켈레톤에 'Quiz 링크' 및 '반응형 서브헤더' 구조를 반영하여 실제 UI와 싱크를 맞춤.
- **Outcome**: 모바일 사용자 경험(UX) 개선 및 코드베이스의 타입 안전성/유지보수성 향상.

### 2026-01-22: Responsive Header & Global Navigation

- **Goal**: 퀴즈 기능의 접근성을 높이고, 모바일 환경에서 헤더 영역의 공간 효율성을 개선합니다.
- **Actions**:
  - **Global Navigation (`app/page.tsx`)**: 헤더 네비게이션에 'Quiz 🎲' 링크를 추가하여 모든 페이지에서의 접근성을 확보했습니다.
  - **Responsive Component (`components/MainHeader.tsx`)**:
    - `useIsMobile` 훅을 활용하여 모바일 기기에서는 서브헤더 텍스트(`One new expression...`)를 자동으로 숨기는 반응형 헤더 컴포넌트 구현.
    - 클라이언트 사이드 렌더링(CSR)이 필요한 로직을 별도 컴포넌트로 분리하여 메인 페이지의 서버 컴포넌트 이점을 유지.
  - **Localization**: 9개 언어 전체에 `quiz.title` 키를 추가하여 UI 다국어 지원 완료.
- **Outcome**: 퀴즈 기능 유입 경로 확보 및 작은 화면에서의 UI 가독성 향상.

### 2026-01-22: Quiz UI Refinement & Localization

- **Goal**: 퀴즈 페이지의 UI 일관성을 확보하고, 하드코딩된 텍스트와 스타일을 리팩토링하여 유지보수성을 향상시킵니다.
- **Actions**:
  - **Component Refactoring (`StudyButton.tsx`)**:
    - 중복되던 '학습하기' 링크 로직을 `StudyButton` 컴포넌트로 분리.
    - 사용자 요청에 따라 Zinc(Neutral) 컬러 스킴 일괄 적용.
  - **Style Standardization (`globals.css`)**:
    - 반복되는 파란색 버튼 스타일을 `@utility blue-btn`으로 추상화.
  - **Localization (`i18n/locales/*.ts`)**:
    - `QuizGame` 내 하드코딩된 에러 메시지를 `dict.quiz.failedToLoad` 키로 대체하고 9개 언어 번역 적용.
- **Outcome**: 퀴즈 기능의 시각적 완성도와 코드 재사용성이 높아졌으며, 글로벌 사용자를 위한 언어 지원이 강화되었습니다.

### 2026-01-22: Quiz Open Graph & Favicon Update

- **Goal**: 퀴즈 페이지의 소셜 미디어 공유 시각적 경험(OG Image)을 개선하고, 파비콘 리소스를 최신화합니다.
- **Actions**:
  - **Dynamic Open Graph (`app/quiz/opengraph-image.tsx`)**:
    - `ImageResponse`를 사용하여 "Random Quiz" 타이틀과 브랜드 로고가 포함된 이미지를 동적으로 생성.
    - `nodejs` 런타임을 명시하여 로컬 파일 시스템(`fs`)에서 고화질 로고를 직접 로드하도록 구현.
    - Google Fonts(Inter)를 3가지 웨이트(500, 700, 900)로 로드하여 타이포그래피 품질 확보.
  - **Asset Update**: `app/favicon.ico`를 다양한 해상도(16x16 ~ 48x48)가 포함된 멀티 리소스 파일로 교체하여 레거시 및 모던 브라우저 호환성 강화.
- **Outcome**: 퀴즈 페이지 공유 링크의 클릭률(CTR) 증대 기대 및 브랜드 아이덴티티 통일.

### 2026-01-21: Category Caching & SWR Synchronization Fix

- **Problem**: 카테고리 필터 변경 시, 서버에서는 최신 데이터를 내려주지만 클라이언트(SWR)가 기존 캐시를 우선하여 오래된 목록이 표시되는 현상 발생. 또한 `hooks/usePaginatedList.ts`의 키 생성 로직과 Fetcher 간 타입 불일치로 인해 필터링이 무시되는 문제 확인.
- **Solution**:
  - **Performance Optimization**: `filters` 객체의 참조 문제 해결(Safe Serialization)만으로도 카테고리 필터링이 정상 작동함을 확인. 하루 1회 업데이트되는 콘텐츠 특성을 고려하여, 불필요한 API 호출(Daily Transcation)을 절약하기 위해 `revalidateFirstPage: false`로 설정.
  - **Safe Serialization**: `filters` 객체의 참조 불안정성을 해결하기 위해 `getKey`에서 `JSON.stringify`를 사용하고, `fetcher` 내부에서 이를 `JSON.parse`하여 복원하는 로직을 타입 단언(`as ExpressionFilters`)과 함께 구현.
- **Outcome**: 초기 진입 시 불필요한 API 요청을 0으로 만들어 서버 비용을 절감하면서도, 필터링 기능의 정확성은 완벽하게 확보.

### 2026-01-21: SEO Finalization & Route Refactoring (SEO & Routing)

- **Goal**: SEO 심층 리뷰에서 식별된 메타데이터 누락 및 비효율적인 URL 관리 방식을 개선하여 검색 엔진 최적화 완성도를 100%로 끌어올림.
- **Actions**:
  - **Metadata Refinement**:
    - `app/quiz/page.tsx`: 다국어(`i18n`) 메타데이터(Title, Description) 적용 및 하드코딩 제거.
    - `app/layout.tsx`: Twitter Card용 `images` 속성 명시 (OpenGraph와의 호환성 확보).
    - `app/sitemap.ts`: 누락되었던 `/quiz` 경로 추가.
  - **Route Centralization (`lib/routes.ts`)**:
    - **CANONICAL_URLS Object**: SEO에 필수적인 Canonical URL(절대 경로) 생성 로직을 `CANONICAL_URLS` 객체로 중앙화.
    - `app/expressions/[id]/page.tsx` 및 `app/quiz/page.tsx`의 하드코딩된 URL 문자열(`template literal`)을 모두 상수/함수 호출로 대체하여 유지보수성 및 일관성 확보.
  - **Open Graph Optimization**:
    - `locale` 속성 중복 제거 (`layout.tsx`에서 상속).
    - 페이지별 명시적인 `url`, `title`, `description` 설정으로 공유 시 프리뷰 정확도 향상.
- **Outcome**: SEO 메타데이터의 기술적 무결성 확보 및 라우팅 로직의 코드 중복 제거.

### 2026-01-21: Documentation Refinement & Additional Performance Optimization

- **Goal**: 추가적인 성능 최적화 적용 및 프로젝트 문서(컨벤션) 현행화.
- **Actions**:
  - **Performance Optimization**:
    - **Server-Side Rendering (`lib/expressions.ts`)**: `React.cache()`를 사용하여 동일 요청 내 중복 DB 쿼리 제거 (Request Deduplication).
    - **Client-Side Rendering (`components/ExpressionCard.tsx`)**: `React.memo` 적용 및 `className` prop 추가로 리렌더링 방어.
    - **Layout Rendering (`globals.css`)**: `content-visibility: auto` 유틸리티 추가 및 `ExpressionList`에 적용하여 대량의 리스트 렌더링 성능 최적화.
    - **Skeleton Optimization (`components/ui/Skeletons.tsx`)**: `SkeletonExpressionList` 컴포넌트 분리 및 모든 스켈레톤에 `React.memo`를 적용하여 로딩 중 불필요한 리렌더링 방지.
    - **Data Fetching (`hooks/usePaginatedList.ts`, `ExpressionContext.tsx`)**: `useSWRInfinite`를 도입하여 무한 스크롤 로직을 단순화하고, 전역 상태(Context)에서 무거운 데이터를 제거(경량화)하여 메모리 효율성 및 UX 개선.
  - **Documentation**:
    - `docs/project_context.md`: "성능 최적화(Performance Optimization)" 코딩 컨벤션 섹션 추가.
    - `docs/technical_implementation/index.md`: Request Deduplication 기술 구현 상세 추가.
    - `docs/technical_implementation/use_swr_strategy.md`: SWR 전략 문서 생성 및 구현 완료 표시.
- **Outcome**: 렌더링 및 네트워크 효율성 추가 확보, 성능 최적화 가이드라인 명문화, 데이터 페칭 전략 현대화.

### 2026-01-21: Code Audit & Performance Optimization

- **Goal**: Vercel React Best Practices 기반으로 코드베이스를 감사(Audit)하고, 식별된 성능 병목 및 확장성 문제를 해결.
- **Actions**:
  - **Audit Report**: `audit_report.html` 생성 및 한국어 번역본 제공. 주요 이슈(Waterfall, Regex Re-compilation, DB Scalability) 식별.
  - **Performance Fixes**:
    - **Server-Side Waterfall (`app/quiz/page.tsx`)**: `getI18n`과 `getRandomExpressions`를 `Promise.all`로 병렬화하여 응답 속도 개선.
    - **Regex Optimization (`lib/quiz.ts`)**: 반복문 내부에서 컴파일되던 정규식(`OPTION_REGEX`)을 외부로 호이스팅.
    - **Database Scalability (`database/016_...`)**: `ORDER BY random()`의 성능 저하를 방지하기 위해 `speak_mango_en.get_random_expressions` RPC 함수 구현 (`database/functions/`로 구조화).
  - **Documentation Refinement**:
    - `docs/database/schema.md`: 폴더 구조 변경(`migrations/`, `functions/`) 반영 및 RPC 섹션 위치 조정.
    - `docs/features/random_quiz_architecture.md`: RPC 구현 상세 업데이트.
    - `docs/project_context.md`: 코딩 컨벤션에 "성능 최적화(Performance Optimization)" 섹션 추가 (React.memo, React.cache 가이드).
    - `docs/technical_implementation.md`: Request Deduplication 구현 상세 추가.
- **Outcome**: 감사 보고서의 모든 Critical/Medium 이슈 해결 완료. 데이터베이스 함수 관리 체계 수립.

### 2026-01-20: Random Quiz Feature Implementation

- **Goal**: 사용자가 다양한 표현을 무작위로 학습하고 실력을 점검할 수 있는 퀴즈 게임 모드 추가.
- **Actions**:
  - **Feature Implementation**: `/quiz` 경로에 랜덤 퀴즈 페이지 구현.
    - `force-dynamic` 렌더링을 사용하여 매 요청마다 새로운 10개의 표현 세트 생성.
    - `Fisher-Yates Shuffle` 로직을 응용한 `getRandomExpressions` 유틸리티 구현.
  - **Interactive UI**: `QuizGame` 클라이언트 컴포넌트 개발.
    - 진행률 바, 정답/오답 즉시 피드백, 최종 결과 및 리뷰 화면 제공.
  - **Analytics**: 퀴즈 시작, 정답 제출, 완료 시점 별 GA4 이벤트 추적 적용.
  - **Documentation**: `docs/features/random_quiz_architecture.md` 작성.
- **Outcome**: 반복적인 학습을 유도하는 게이미피케이션 요소 추가.

### 2026-01-20: Verification Logic Refinement & Sync

- **Goal**: 검증 로직의 위음성(False Positives) 제거 및 로컬 CLI(`verify_db_data.js`)와 n8n 워크플로우 스크립트 간의 로직 불일치 해결.
- **Actions**:
  - **Strict Pattern 1 Enforcement**: "질문에 영어가 없으면 선택지는 무조건 영어여야 한다"는 엄격한 규칙(Strict Pattern 1)을 모든 스크립트에 적용.
  - **Punctuation Check**: `verify_db_data.js`에만 존재하던 `ideographic_full_stop` (/。/) 정규식 검사를 `n8n/expressions/code/11_validate_content.js` 및 `n8n/expressions/code_v2/07_validate_content_v2.js`에 동기화하여 검증 기준 통일.
  - **Allowed Lists**: `ALLOWED_NAMES`와 `ALLOWED_ENGLISH_TERMS`를 추가하여 고유명사로 인한 오탐지 방지.
- **Outcome**: 검증 로직의 신뢰성 확보 및 유지보수 포인트 단일화 (Verification Script = n8n Script).

### 2026-01-19: Loading State Fix & Search Query Optimization

- **Goal**: 남은 감사 보고서 항목(검색 쿼리 효율성) 해결 및 로직 버그 수정.
- **Actions**:
  - **Bug Fix**: `hooks/usePaginatedList.ts`의 `finally` 블록에서 `setLoading(true)`가 중복 호출되는 실수 수정.
  - **Search Optimization**: `lib/expressions.ts`의 검색 쿼리를 개선.
    - **Schema Change**: `meaning` 필드를 텍스트로 변환하여 저장하는 `meaning_text` 컬럼(Generated Column) 추가.
    - **Index**: `meaning_text`에 Trigram 인덱스(`idx_expressions_meaning_text_trgm`)를 생성하여 다국어 ILIKE 검색 성능 최적화.
    - **Double-Filter Strategy**: 인덱스 스캔(`meaning_text`)으로 후보를 빠르게 좁힌 후, JSON 필터(`meaning->>locale`)로 정밀 검사하는 이중 필터링 패턴 적용. 이는 속도와 정확도(타 언어 노이즈 제거)를 동시에 달성함.
  - **Scroll Optimization**: `components/FilterBar.tsx`에 `requestAnimationFrame` 및 `useCallback`을 적용하여 스크롤 성능 최적화 (60FPS 보장 및 핸들러 참조 안정성 확보).
- **Outcome**: 검색 성능(Latency) 대폭 개선, 무한 스크롤 로딩 상태 안정화, UI 스크롤 부드러움 향상.

### 2026-01-19: Performance Optimization (Waterfall & Client-Side)

- **Goal**: 감사 보고서에서 식별된 핵심 성능 병목 개선.
- **Actions**:
  - **Waterfall Fix**: `app/page.tsx`에서 `getI18n`과 `getExpressions`가 직렬로 호출되던 문제를 `Promise.all`로 병렬화하여 TTFB 개선.
  - **Client-Side Optimization**: `components/DialogueSection.tsx` 및 `DialogueItem.tsx` 최적화.
    - `React.memo` 적용 및 `index` prop 추가.
    - `useCallback`으로 핸들러 안정화하여 불필요한 리렌더링 제거.
    - `handleEnglishClick` 로직 단순화로 중복 상태 업데이트 제거.
- **Outcome**: 초기 로딩 속도 향상 및 대화 재생 시 UI 반응성 개선.

### 2026-01-19: Agent Skills Integration & Codebase Audit

- **Goal**: Vercel의 전문적인 React/Next.js 지침을 에이전트에게 장착하고, 이를 기반으로 전체 코드베이스의 성능 및 디자인 품질을 감사(Audit).
- **Actions**:
  - **Skill Installation**: `npx add-skill vercel-labs/agent-skills`를 통해 `vercel-react-best-practices` 및 `web-design-guidelines` 설치.
  - **Documentation**: 에이전트 스킬 활용을 위한 가이드 문서(`docs/agent_skills_guide.md`) 작성.
  - **Git Configuration**: 공급자별 스킬 설정 폴더(`.gemini`, `.claude`, `.opencode`)를 `.gitignore`에 추가하여 레포지토리 정리.
- **Outcome**: 에이전트의 개발 역량을 상향 평준화하고, 정량화된 감사 보고서를 통해 성능 최적화 로드맵 확보.

### 2026-01-17: Marketing Studio & Image Automation (Marketing Asset Generation)

- **Goal**: SNS 마케팅을 위한 고화질 표현 카드 이미지를 손쉽게 생성하고, 이를 대량으로 자동화하는 시스템 구축.
- **Actions**:
  - **Feature Implementation**: `/studio/[id]` 경로에 마케팅 스튜디오 페이지 구현.
    - `html-to-image`와 `file-saver`를 활용한 클라이언트 측 이미지 생성 및 다운로드.
    - 다양한 배경(Brand, Gradient, Solid) 및 비율(1:1, 9:16) 옵션 제공.
    - `ExpressionCard` 컴포넌트에 `isStatic` 모드를 추가하여 애니메이션 없이 정적 렌더링 지원.
  - **Automation Script**: `scripts/generate_studio_images.py` 파이썬 스크립트 작성.
    - `sitemap.xml`을 파싱하여 모든 표현 ID 추출.
    - `playwright`를 사용하여 병렬로 스튜디오 페이지에 접속하고 스크린샷 캡처.
  - **Environment Setup**: 파이썬 가상 환경(`venv`) 구성 및 필수 라이브러리(`requests`, `playwright`) 설치.
  - **Documentation**: `docs/marketing/studio_guide.md` 가이드 문서 작성 및 컨텍스트 업데이트.
- **Outcome**: 마케팅용 고화질 에셋 생산성을 획기적으로 높이고, 수동 캡처 작업의 번거로움을 제거함.

### 2026-01-17: Database Schema Update (Unique Constraint)

- **Goal**: `expression` 컬럼의 중복 데이터 입력을 DB 수준에서 원천 차단하여 데이터 무결성 보장.
- **Actions**:
  - **Schema Change**: `speak_mango_en.expressions` 테이블의 `expression` 컬럼에 `UNIQUE` 제약 조건 추가.
  - **Migration**: `database/014_add_unique_constraint_to_expression.sql` 마이그레이션 파일 생성.
  - **Documentation**: `docs/database/schema.md`에 Unique Key(UK) 및 인덱스 정보 반영.
- **Outcome**: 애플리케이션 레벨의 중복 체크 외에 DB 레벨의 안전장치가 추가되어 중복 데이터 발생 가능성 0%.

### 2026-01-17: n8n V3: 특정 표현 기반 콘텐츠 생성 (Specific Expression Generation)

- **Goal**: 랜덤 생성이 아닌, 사용자가 지정한 특정 표현(Specific Expression)에 대해 AI가 자동으로 카테고리를 분류하고 콘텐츠를 생성하는 V3 워크플로우 구축.
- **Actions**:
  - **New Files**:
    - `n8n/expressions/code_v3/02_pick_expression_v3.js`: 특정 표현 목록을 반환하는 노드.
    - `n8n/expressions/code_v3/03_gemini_specific_expression_generator_prompt_v3.txt`: 표현을 입력받아 자동 분류(Auto-Classification) 및 콘텐츠를 생성하는 V3 프롬프트.
    - `docs/n8n/expressions/optimization_steps_v3.md`: V3 워크플로우 아키텍처 및 가이드 문서 작성.
- **Outcome**: 원하는 표현을 정확히 핀포인트하여 DB에 추가하는 기능 확보. AI의 자동 분류 능력 활용.

### 2026-01-17: n8n 워크플로우 데이터 정제 및 검증 강화 (n8n Workflow Data Cleanup & Validation Update)

- **Goal**: Gemini가 생성하는 `meaning` 필드에 대해 엄격한 문장 부호 규칙(끝 마침표 금지, 세미콜론 금지)을 강제합니다.
- **Actions**:
  - **n8n V1 & V2**: `Cleanup Meaning` Code 노드 추가 (V1: 10단계, V2: 6단계). 문장 끝 마침표 자동 제거 및 세미콜론을 가운뎃점(`·`)으로 치환.
  - **Verification Script**: `verify_db_data.js` 및 n8n 검증 스크립트를 업데이트하여 `meaning` 필드 내 _모든_ 마침표(말줄임표 제외)와 세미콜론을 에러로 처리.
  - **Refactoring**: 새로운 정제 단계 추가에 맞춰 `n8n/expressions/code` 및 `n8n/expressions/code_v2`의 스크립트 파일명을 변경하고 순서를 재조정.
  - **Documentation**: 새로운 워크플로우 구조와 코드를 반영하여 `optimization_steps.md` 및 `optimization_steps_v2.md` 문서 업데이트.
- **Outcome**: 검증 전 단계에서 일반적인 문장 부호 오류를 자동으로 수정하여 데이터 품질을 향상시키고, 수동 개입 및 데이터 거부율을 감소시켰습니다.

## 2026-01-17: Audio Context 리팩토링 및 iOS 전체 재생 픽스 (Audio Context Refactoring)

### ✅ 진행 사항

**New Files**:

- `context/AudioContext.tsx`: Singleton AudioContext 관리 (한국어 주석 포함)

**Modified Files**:

- `app/layout.tsx`: `AudioProvider` 적용
- `components/DialogueAudioButton.tsx`: `useAudio` 훅 적용 및 로컬 Context 제거
- `lib/audio.ts`: 삭제 (Context로 이관)

### 💬 주요 Q&A 및 의사결정

**Q. 아이폰에서 '전체 듣기' 시 다음 곡으로 넘어가지 않았던 이유는?**

- **A**: iOS(Safari/WebKit)의 **Autoplay Policy** 때문입니다.
  - 아이폰은 배터리/데이터 절약을 위해 **"사용자의 직접적인 터치 없이는 새로운 AudioContext를 생성/재개할 수 없다"**는 강력한 제약이 있습니다.
  - 기존 로직은 곡이 바뀔 때마다 **새로운 AudioContext**를 생성했습니다.
  - 첫 곡은 터치로 시작했으니 재생되지만, 두 번째 곡부터는 코드(자동)로 넘어가므로 "사용자 제스처 없음"으로 간주되어 OS가 AudioContext 생성을 차단(Suspend)했습니다.

**Q. 어떻게 해결했나? (Singleton Pattern)**

- **A**: **"오디오 문을 딱 하나만 열어두고 계속 쓰기"** 전략을 사용했습니다.
  - **Before**: 곡마다 `new AudioContext()` (매번 문을 새로 열려다 차단됨)
  - **After**: 앱 실행 시(정확히는 첫 터치 시) **단 하나의 공용 `AudioContext`**를 만들고, 모든 오디오가 이 파이프라인을 공유합니다.
  - 한 번 열린(Resumed) Context는 이후 사용자 제스처 없이도 계속 사용할 수 있어, '전체 듣기'가 끊기지 않고 이어집니다.

**Q. 왜 `lib/audio.ts` 대신 React Context(`AudioContext.tsx`)를 선택했나?**

- **A**: React의 **Lifecycle**과 **Global State** 관리 패턴을 따르기 위함입니다.
  - `ExpressionContext`나 `AnalyticsProvider`처럼, 전역 상태는 Provider로 감싸는 것이 일관성이 있습니다.
  - `useAudio`, `getAudio` 훅을 통해 컴포넌트 어디서든 쉽게 접근할 수 있습니다.
  - 내부 주석을 모두 한국어로 작성하여 유지보수 편의성을 높였습니다.

**Q. `createMediaElementSource` 관련 `try/catch`는 왜 필요한가?**

- **A**: **React Strict Mode**의 이중 렌더링 방어 기제입니다.
  - `createMediaElementSource`는 한 오디오 태그당 **딱 한 번만** 호출할 수 있습니다 (두 번 연결 시 에러).
  - 컴포넌트 마운트나 리렌더링 시 이미 연결된 오디오에 대해 재연결을 시도하면 앱이 죽을 수 있으므로, `try/catch`로 "이미 연결됨" 에러를 무시하도록 처리했습니다.

## 2026-01-16: SEO Schema & JSON-LD 최적화 (Schema.org Implementation)

- **목표**: 검색 엔진의 엔티티 이해도 향상을 위해 구조화된 데이터(Structured Data) 강화.
- **변경**:
  - `app/layout.tsx`: `keywords` 속성을 `WebSite` 스키마에 추가하여 사이트 전체 주제 명시. `app/page.tsx`의 중복 스키마 통합 및 제거.
  - `app/expressions/[id]/page.tsx`: `LearningResource` 스키마에 `keywords` 속성 추가 (동적 생성된 키워드 주입).
  - **검증**: 중복된 `WebSite` 스키마 제거로 로직 일관성(`layout`=Global, `page`=Local SearchAction) 확보.

## 2026-01-16: SEO 설정 구조 리팩토링 (SEO Config Refactoring)

- **목표**: SEO 관련 설정(`seo`)을 메타데이터(`meta`)와 분리하여 구조적 명확성 확보 및 유지보수성 향상.
- **변경**:
  - `i18n/locales/*.ts`: `meta.seo` 객체와 `categories`를 최상위 `seo` 객체로 이동.
  - `lib/seo.ts`: 키워드 생성 로직이 `dict.seo`를 참조하도록 수정.
  - **검증**: 아랍어(`ar.ts`) 등 누락된 카테고리(`emotion`) 복구 및 `{}` 플레이스홀더 포맷 검증 완료.

## 2026-01-16: 동적 SEO 키워드 지역화 (Localized Dynamic Keywords)

- **목표**: 사용자 언어 설정에 맞는 자연스러운 카테고리 키워드 제공 (예: 'Travel English' vs '여행 영어').
- **구현**:
  - `i18n/locales/*.ts`: 각 언어 파일에 `categories` 맵 정의 (`daily`, `business`, `travel` 등).
  - `lib/seo.ts`: 하드코딩된 로직 제거 및 `dict.categories` 기반 동적 룩업 구현.
  - **제거**: 모든 로케일 파일에서 중복/하드코딩된 정적 키워드("Business English" 등) 일괄 삭제.

## 2026-01-16: 동적 SEO 키워드 생성 (Dynamic Keywords)

- **목표**: 표현 페이지의 검색 엔진 노출 최적화 (Intent Keywords 타겟팅).
- **구현**:
  - `i18n/locales/*.ts`: 각 언어별 검색 의도에 맞는 접미사(`expressionSuffixes`, `meaningSuffixes`) 정의.
  - `en`: "meaning", "how to say" 등.
  - `ko`: "뜻", "의미", "영어로" 등.
  - `zh`, `ru`, `fr`, `de`, `ar` 등 주요 언어 추가 지원.
  - `app/expressions/[id]/page.tsx`: 메타데이터 생성 시 접미사를 조합하여 고관여 키워드 자동 생성 및 주입.
  - `package.json`: 프로젝트 레벨 `keywords` 필드 추가.
  - **추가 개선**: `meta` 태그의 한계를 극복하기 위해 `KeywordList` 컴포넌트를 통해 페이지 하단에 시각적 태그(Visible Keys)로 노출.

## 2026-01-16: iOS 잠금 화면 오디오 메타데이터 구현 (Media Session API)

### 💬 주요 Q&A 및 의사결정

**Q. iOS 잠금 화면에서 오디오 재생 시 Vercel 로고가 표시되고, 제목 정보가 누락되는 이유는?**

- **A**: iOS 잠금 화면에서 오디오 재생 시 Vercel 로고가 표시되고, 제목 정보가 누락됨 (기본 파비콘 사용 추정).
- **해결**: `DialogueAudioButton`에 `Media Session API`를 구현하여 제목, 아티스트(Speak Mango), 앨범 아트(앱 아이콘)를 명시적으로 설정.
- **상세**:
  - `togglePlay` 및 `useEffect`를 통해 오디오 재생 시 `navigator.mediaSession.metadata` 업데이트.
  - `play`, `pause` 등의 액션 핸들러 연결.

## 2026-01-16: iOS Safari 오디오 로딩 문제 해결 - Lazy Loading 리버트 (iOS Audio Fix)

### ✅ 진행 사항

**Modified Files**:

- `components/DialogueAudioButton.tsx`

### 💬 주요 Q&A 및 의사결정

**Q. Safari에서 오디오가 로딩되지 않고 멈추는(Deadlock) 현상이 왜 발생했나?**

- **A**: iOS Safari의 Web Audio API 구현에는 특이한 버그가 있습니다. `MediaElementSource`를 연결할 때 오디오 엘리먼트가 `readyState: 0`(정보 없음) 상태이면 로딩 프로세스 자체가 차단될 수 있습니다. 최근 적용한 "Lazy Loading" 최적화(`audio.load()` 제거) 때문에 이 조건에 걸려버린 것입니다.

**Q. 어떻게 해결했나?**

- **A**: **하이브리드 접근법**을 사용했습니다.
  1.  **Safari 해결**: `useEffect`에 `audio.load()`를 복구하여, 페이지 로드 시 메타데이터를 미리 확보하도록 했습니다. (Deadlock 방지)
  2.  **인앱 브라우저 유지**: Web Audio API 초기화(`AudioContext` 생성)는 여전히 **"사용자 클릭 시점"**으로 유지했습니다. (Autoplay 차단 방지)
  - 결과적으로 *"파일 준비는 미리 해두되, 엔진 시동은 클릭할 때 건다"*는 방식으로 두 환경 모두 호환되도록 했습니다.

## 2026-01-16: 오디오 재생 최적화 - Lazy Loading 및 iOS 대응 (Audio Optimization)

### ✅ 진행 사항

**Modified Files**:

- `components/DialogueAudioButton.tsx`

### 💬 주요 Q&A 및 의사결정

**Q. `audio.load()`를 `useEffect`에서 제거한 이유는?**

- **A**: `preload="metadata"`을 설정했더라도 `audio.load()`를 즉시 호출하면 브라우저가 리소스를 바로 다운로드하기 시작합니다. 이는 모바일 데이터 낭비이며, 특히 iOS Safari에서 "사용자 의도 없는 대량의 미디어 요청"으로 간주되어 차단(Pending)될 위험이 있어 제거했습니다.

**Q. Web Audio API 초기화 시점을 왜 변경했나?**

- **A**: 기존에는 데이터 로드 시점(`loadeddata`)에 초기화했으나, iOS 인앱 브라우저에서는 사용자 제스처 없이 `AudioContext`를 조작하는 것이 엄격히 제한됩니다. 따라서 사용자가 재생 버튼을 클릭하는 순간(`togglePlay`)으로 초기화 시점을 미루어(Lazy Init), 확실한 사용자 제스처 컨텍스트 안에서 실행되도록 변경했습니다.

**Q. `togglePlay`가 자주 재생성되는 문제를 어떻게 해결했나?**

- **A**: `useCallback`의 의존성 배열에 `isPlaying` 등 상태값이 포함되면 렌더링마다 함수가 새로 만들어집니다. 이를 해결하기 위해 `useRef`(`latestValues`)를 도입하여 최신 상태를 참조하도록 변경하고, 함수 자체는 불변(Stable)하게 유지하여 성능을 최적화했습니다.

## 2026-01-15: 인앱 브라우저 오디오 호환성 개선 (In-App Browser Audio Compatibility)

### ✅ 진행 사항

**Modified Files**:

- `components/DialogueAudioButton.tsx`

### 💬 주요 Q&A 및 의사결정

**Q. 카카오톡으로 공유한 링크에서 오디오가 무한 로딩 중으로 표시되는 이유는?**

- **A**: 인앱 브라우저에서 Web Audio API 초기화 실패 및 AudioContext suspended 상태 (Android vs iOS 차이)
  - **문제 1**: `createMediaElementSource()` 실패 시 오디오 객체가 제대로 초기화되지 않아 `canplaythrough` 이벤트 미발생
  - **문제 2 (Android)**: 첫 페이지 로드 시 AudioContext가 `suspended` 상태로 시작하여 사용자 인터랙션 전까지 작동 안 함
  - **문제 3 (iOS)**: iOS Safari는 더 엄격하여 오디오 로딩 전 `createMediaElementSource()` 호출 시 `loadeddata` 이벤트 자체가 발생하지 않음
  - **원인**: 카카오톡, 네이버 등 인앱 브라우저는 Web Audio API를 제한하거나 차단, autoplay 정책으로 AudioContext 자동 활성화 차단
  - **해결 1**: try-catch로 Web Audio API 실패 시 기본 HTML5 Audio로 자동 폴백
  - **해결 2 (Android)**: AudioContext 생성 시 즉시 `resume()` 호출 시도 (Android에서 작동)
  - **해결 3 (iOS)**: Web Audio API 초기화를 `loadeddata` 이벤트 후로 지연 + 사용자 클릭 시점(`togglePlay`)에서 `resume()` 호출
  - **효과**: 모든 인앱 브라우저(카카오톡, 네이버, 위챗, 왓츠앱 등)에서 Android/iOS 모두 첫 페이지 로드부터 오디오 정상 재생

**Q. 특정 인앱 브라우저를 일일이 선언해야 하나?**

- **A**: User Agent 감지 대신 try-catch 기반 폴백 방식 채택
  - **기존 방식**: `userAgent.includes("kakaotalk")` 등으로 일일이 선언
  - **문제점**: 새로운 앱(위챗, 왓츠앱 등) 대응 불가
  - **개선 방식**: Web Audio API 초기화 실패 시 자동으로 기본 오디오 사용
  - **장점**: 범용적 호환성, 유지보수성 향상, 모든 인앱 브라우저 자동 대응

**Q. 인앱 브라우저에서는 볼륨 증폭이 안 되나?**

- **A**: 네, 기본 HTML5 Audio는 최대 볼륨 1.0으로 제한됨
  - **일반 브라우저**: Web Audio API 사용 → 볼륨 2.0배 증폭 ✅
  - **인앱 브라우저**: 기본 HTML5 Audio → 볼륨 1.0 (최대) ✅
  - **Trade-off**: 볼륨은 낮지만 재생은 정상 작동 (무한 로딩 해결)

## 2026-01-15: 검색 기능 개선 (Icon Click, Multilingual, Duplicate Prevention)

### ✅ 진행 사항

**Modified Files**:

- `components/SearchBar.tsx`
- `lib/expressions.ts`
- `app/page.tsx`
- `components/ExpressionList.tsx`
- `docs/database/schema.md`

### 💬 주요 Q&A 및 의사결정

**Q. 검색 아이콘을 클릭해도 검색이 실행되지 않는 이유는?**

- **A**: 검색 아이콘이 장식용으로만 사용되고 있었음
  - **해결**: 아이콘을 `<button>`으로 변경하고 `onClick` 핸들러 추가
  - **효과**: 돋보기 아이콘 클릭으로 검색 실행 가능

**Q. 한국어 브라우저에서 영어 검색어를 입력하면 부정확한 결과가 나오는 이유는?**

- **A**: 모든 언어의 meaning 필드를 검색하고 있었음
  - **문제**: 한국어 사용자가 "oke"를 검색하면 영어 meaning에 "oke"가 있는 결과도 표시
  - **해결**: 현재 로케일의 meaning 필드만 검색하도록 수정
  - **쿼리 변경**:

    ```typescript
    // Before: 9개 언어 모두 검색
    query.or(`expression.ilike.%${term}%,meaning->>en.ilike.%${term}%,...`);

    // After: expression + 현재 로케일만 검색
    query.or(`expression.ilike.%${term}%,meaning->>${locale}.ilike.%${term}%`);
    ```

**Q. 동일한 검색어를 여러 번 입력하면 계속 fetch가 발생하는 이유는?**

- **A**: 중복 검색 방지 로직이 없었음
  - **해결**: `useRef`로 이전 검색어를 추적하고 동일하면 스킵
  - **효과**: 네트워크 요청 감소 및 성능 향상

**Q. 검색어를 지우고 돋보기 버튼을 누르면 아무 반응이 없는 이유는?**

- **A**: 돋보기 버튼에 `if (value.trim())` 조건이 있었음
  - **문제**: Enter 키는 빈 검색어 허용, 돋보기 버튼은 차단
  - **해결**: 돋보기 버튼도 빈 검색어 허용하도록 수정
  - **효과**: 일관된 UX (검색 초기화 가능)

**Q. 데이터베이스 검색 성능을 어떻게 최적화했나?**

- **A**: GIN 인덱스와 Trigram 인덱스 추가
  - **GIN 인덱스**: JSONB `meaning` 필드용 (다국어 검색)
  - **Trigram 인덱스**: TEXT `expression` 필드용 (부분 문자열 검색)
  - **효과**: ILIKE 쿼리 성능 대폭 향상

## 2026-01-15: SEO 개선 - JSON-LD 구조화된 데이터 추가 (Brand Recognition)

### ✅ 진행 사항

**Modified Files**:

- `app/layout.tsx`
- `app/page.tsx`
- `tsconfig.json`

### 💬 주요 Q&A 및 의사결정

**Q. Google 검색 결과에 "Speak Mango" 대신 "speakmango.com"이 표시되는 이유는?**

- **A.** Google이 브랜드명을 인식하려면 **구조화된 데이터(Structured Data)**가 필요합니다:
  - **문제**: Organization Schema 부재로 Google이 도메인 주소만 표시
  - **해결**: JSON-LD 형식의 Organization 및 WebSite 스키마 추가
  - **효과**: Google이 "Speak Mango"를 브랜드로 인식하여 검색 결과에 브랜드명 표시 가능

**Q. 구조화된 데이터를 어디에 배치해야 하나?**

- **A.** 스키마 타입에 따라 전역 vs 페이지별로 구분:
  - **전역 (`app/layout.tsx`)**: 모든 페이지에 공통으로 적용되는 스키마
    - `Organization` - 브랜드 정보 (이름, 로고, 소셜 미디어)
    - `WebSite` - 기본 웹사이트 정보 (이름, URL, 지원 언어)
  - **페이지별**: 해당 페이지에만 있는 기능/콘텐츠 스키마
    - `app/page.tsx`: `WebSite` + `SearchAction` (검색 기능)
    - `app/expressions/[id]/page.tsx`: `LearningResource` (학습 콘텐츠)

**Q. 왜 WebSite 스키마가 layout.tsx와 page.tsx 둘 다에 있나?**

- **A.** 서로 다른 목적으로 사용:
  - **layout.tsx**: 기본 웹사이트 정보 (`name`, `url`, `inLanguage`)
  - **page.tsx**: 검색 기능 추가 (`potentialAction` with `SearchAction`)
  - Google은 동일한 `@type`의 스키마를 병합하여 처리하므로 문제없음

**Q. inLanguage는 왜 전역에 설정했나?**

- **A.** 다국어 지원은 전체 웹사이트의 속성이므로 `layout.tsx`에 설정:
  - `inLanguage: SUPPORTED_LANGUAGES` (9개 언어)
  - Google이 사이트가 다국어를 지원함을 인식
  - 각 언어별 검색 결과에서 적절하게 표시

**Q. SearchAction은 왜 홈페이지에만 있나?**

- **A.** 검색 기능은 홈페이지에만 존재:
  - 상세 페이지에는 검색 바가 없음
  - 스키마는 실제 기능이 있는 페이지에만 배치하는 것이 원칙
  - Google이 사이트 내 검색 박스를 검색 결과에 표시할 수 있음

### 🎯 구현 내용

**1. Global Schemas (`app/layout.tsx`)**:

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

// WebSite Schema - 기본 정보
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Speak Mango",
  "url": BASE_URL,
  "inLanguage": SUPPORTED_LANGUAGES  // 9개 언어 지원
}
```

**2. Homepage Schema (`app/page.tsx`)**:

```tsx
// WebSite Schema with SearchAction - 검색 기능
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

**3. TypeScript Config (`tsconfig.json`)**:

```json
{
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

- 사용하지 않는 import 자동 감지 및 경고

### 📊 SEO 개선 효과

**Before**:

- Google 검색 결과: `speakmango.com` (도메인 주소)
- 브랜드 인식 없음

**After**:

- Google 검색 결과: `Speak Mango` (브랜드명) - 크롤링 후 반영
- 브랜드 신뢰도 향상
- Knowledge Graph 표시 가능성
- 검색 결과에 사이트 내 검색 박스 표시 가능

### 🔍 검증 방법

1. **Rich Results Test**: https://search.google.com/test/rich-results
   - URL 입력 후 Organization 및 WebSite 스키마 인식 확인
2. **Google Search Console**:
   - "URL 검사" → "색인 생성 요청"으로 빠른 크롤링 요청
3. **실제 검색 결과**:
   - 며칠 ~ 몇 주 후 Google 검색에서 브랜드명 표시 확인

## 2026-01-15: i18n 언어팩 일관성 검증 스크립트 추가

### ✅ 진행 사항

**New Files**:

- `verification/verify_i18n_locales.js`

### 💬 주요 Q&A 및 의사결정

**Q. 왜 i18n 언어팩 검증 스크립트가 필요한가요?**

- **A.** 각 언어 파일이 해당 언어만 포함하는지 자동으로 검증하기 위함:
  - **문제**: 수동으로 언어 파일을 작성하다 보면 다른 언어가 섞일 수 있음
  - **예시**: 한국어 파일에 일본어나 영어가 섞이는 경우
  - **해결**: 자동화된 검증 스크립트로 언어 일관성 보장

**Q. 어떤 검증 규칙이 적용되나요?**

- **A.** 언어별 스크립트 검증 + 영어 누출 검사:
  - **한국어(ko)**: 한글만 허용, 가나/한자/키릴/아랍 문자 금지
  - **일본어(ja)**: 히라가나/가타카나/한자 허용, 한글/키릴/아랍 문자 금지
  - **중국어(zh)**: 한자만 허용, 한글/가나/키릴/아랍 문자 금지
  - **러시아어(ru)**: 키릴 문자만 허용, 한글/가나/한자/아랍 문자 금지
  - **아랍어(ar)**: 아랍 문자만 허용, 한글/가나/한자/키릴 문자 금지
  - **라틴 계열(es, fr, de, en)**: 영어 알파벳 허용, 다른 스크립트 금지

**Q. 템플릿 변수는 어떻게 처리하나요?**

- **A.** 허용 목록으로 관리:
  - **템플릿 변수**: `serviceName`, `expression`, `meaning`, `tag` 등 동적으로 치환되는 변수명 허용
  - **고유명사**: Instagram, TikTok, YouTube 등 브랜드명 허용
  - **대문자 시작**: 대문자로 시작하는 고유명사 자동 허용
  - **소문자 영어**: 소문자 영어 단어는 누출로 간주하여 차단

**Q. TypeScript 파일 파싱은 어떻게 처리하나요?**

- **A.** JSON 파싱 + Fallback 메서드:
  - **1차 시도**: 템플릿 리터럴을 제거하고 JSON으로 파싱
  - **2차 시도**: 파싱 실패 시 정규표현식으로 문자열 값만 추출
  - **결과**: 템플릿 리터럴(`\`...\``)과 변수 삽입(`${SERVICE_NAME}`)이 있어도 정상 작동

## 2026-01-15: 대화 성별-이름 일관성 검증 강화 및 문서 리팩토링

### ✅ 진행 사항

**Modified Files**:

- `n8n/expressions/code/08_gemini_content_generator_prompt.txt`
- `n8n/expressions/code/10_validate_content.js`
- `n8n/expressions/code_v2/04_gemini_master_generator_prompt_v2.txt`
- `n8n/expressions/code_v2/06_validate_content_v2.js`
- `verification/verify_db_data.js`
- `docs/n8n/expressions/optimization_steps.md`

### 💬 주요 Q&A 및 의사결정

**Q. 왜 성별-이름 일관성 검증을 추가했나요?**

- **A.** `temp.json` 데이터에서 성별-이름 불일치 발견:
  - **문제**: Role A (여성)가 Role B를 "Emily"(여성 이름)로 호칭
  - **프롬프트 규칙**: Role A = Female (Sarah/Emily), Role B = Male (Mike/David)
  - **원인**: Gemini가 대화 생성 시 성별-이름 규칙을 무시
  - **해결**: 프롬프트 강화 + 검증 로직 추가

**Q. 어떤 검증 규칙이 추가되었나요?**

- **A.** 호격 패턴 기반 성별-이름 일관성 검증:
  - Role A (여성)가 여성 이름으로 상대를 부르는 경우 에러
  - Role B (남성)가 남성 이름으로 상대를 부르는 경우 에러
  - 자기 소개(`"Hi, I'm Emily"`)는 허용
  - 상대방 언급(`"You're Mike, right?"`)은 허용

**Q. 검증 패턴은 어떻게 구성되었나요?**

- **A.** 4가지 호격 패턴으로 상대방을 부르는 경우만 검증:
  1. `"Hey Mike"`, `"Hi Emily"`, `"Guess what, Emily"` - 문장 시작 패턴
  2. `"..., Mike."`, `"..., Emily?"` - 쉼표 뒤 패턴
  3. `"Mike, how are you?"` - 이름 + 쉼표 + 동사 패턴
  4. `"Emily, you..."`, `"Mike, your..."` - 이름 + 쉼표 + 대명사 패턴

**Q. 문서는 어떻게 개선되었나요?**

- **A.** `optimization_steps.md`를 `optimization_steps_v2.md` 패턴에 맞춰 리팩토링:
  - 인라인 코드 블록 → 파일 참조로 변경
  - 8개 단계의 코드 블록을 파일 경로로 대체
  - 문서 가독성 향상 및 유지보수 용이성 개선

## 2026-01-15: Quiz Validation 로직 강화 (DB 구조 검증)

### ✅ 진행 사항

**Modified Files**:

- `n8n/expressions/code/08_gemini_content_generator_prompt.txt`
- `n8n/expressions/code/10_validate_content.js`
- `n8n/expressions/code_v2/04_gemini_master_generator_prompt_v2.txt`
- `n8n/expressions/code_v2/06_validate_content_v2.js`
- `verification/verify_db_data.js`

### 💬 주요 Q&A 및 의사결정

**Q. 왜 quiz validation을 강화했나요?**

- **A.** DB에서 잘못된 quiz 구조 발견:
  - **문제**: `quiz.options` 배열이 추가된 데이터 발견
  - **DB 구조**: `quiz`는 `{ question: string, answer: string }` 만 허용
  - **원인**: Gemini가 `question` 필드에 선택지를 넣지 않고 `options` 배열을 별도로 생성
  - **해결**: Validation 로직 강화 + Gemini 프롬프트 명시

**Q. 어떤 검증 규칙이 추가되었나요?**

- **A.** 두 가지 검증 규칙 추가:
  1. **`quiz.options` 필드 금지**: DB 구조 위반 시 에러
  2. **`quiz.question` 내 선택지 필수**: A, B, C 선택지가 모두 포함되어야 함

**Q. Gemini 프롬프트는 어떻게 수정했나요?**

- **A.** Quiz 구조 규칙 명시 (Rule 10 - Strict Formatting & Validation Rules):
  - **Rule 2**: Database Structure (CRITICAL) - quiz는 `question`과 `answer` 필드만 포함
  - **Rule 3**: Options in Question Field - 선택지를 `question` 필드 안에 포함
  - **Rule 4**: Format 예시 제공
  ```
  "question": "Question text?\n\nA. option1\nB. option2\nC. option3"
  ```

### 🎯 구현 내용

**1. Validation 로직 (3개 파일 동일)**:

```javascript
// quiz.options 필드 금지
if (contentObj.quiz.options) {
  errors.push(
    `Content (${lang}).quiz must NOT have 'options' field. Options should be in 'question' field as "A. ...", "B. ...", "C. ...".`,
  );
}

// quiz.question 내 선택지 A, B, C 필수
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

**2. Gemini 프롬프트 (2개 파일 동일)**:

- Rule 2: **Database Structure (CRITICAL)** 추가
- Rule 3: **Options in Question Field** 명시
- Rule 4: **Format** 예시 제공

### 🔄 영향 범위

**Gemini 생성**:

- ✅ 올바른 quiz 구조로 생성하도록 명확히 지시
- ✅ `options` 필드 생성 방지

**Validation**:

- ✅ 잘못된 구조 즉시 차단
- ✅ 선택지 누락 감지

**기존 데이터**:

- ⚠️ 기존 DB에 잘못된 구조가 있다면 수동 수정 필요
- ✅ 향후 생성되는 모든 데이터는 올바른 구조 보장

## 2026-01-15: Google 검색 결과 로고 표시 (Schema.org Organization)

### ✅ 진행 사항

- **File**: `app/page.tsx`
  - Schema.org Organization 마크업 추가
  - 로고 URL 설정: `/assets/logo.png`

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Google 검색 결과에 로고 대신 지구본 아이콘이 나왔나요?**

- **A.** Google은 사이트 로고를 표시하기 위해 **Schema.org Organization** 구조화된 데이터를 찾습니다:
  - 기존: WebSite 스키마만 있음 (검색 기능 정의)
  - 추가: Organization 스키마 (로고, 조직 정보)
  - Google이 로고를 인식하려면 `@type: "Organization"`과 `logo` 속성 필요

**Q. 언제 로고가 표시되나요?**

- **A.** Google이 사이트를 다시 크롤링한 후:
  - 보통 며칠 ~ 몇 주 소요
  - Google Search Console에서 "URL 검사" → "색인 생성 요청"으로 빠르게 처리 가능
  - Rich Results Test로 즉시 확인 가능: https://search.google.com/test/rich-results

**Q. 로고 이미지 요구사항은?**

- **A.** Google 권장사항:
  - 형식: PNG, JPG, SVG
  - 크기: 최소 112x112px (권장: 512x512px)
  - 비율: 정사각형 또는 1:1에 가까운 비율
  - 현재 사용: `/assets/logo.png` (1024x1024px)

### 🎯 구현 내용

**Schema.org Organization 마크업**:

```tsx
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Speak Mango",
  "url": "https://speakmango.com",
  "logo": "https://speakmango.com/assets/logo.png"
}
```

### 📚 Schema.org 타입 차이

**1. `@type: "WebSite"` - 웹사이트 기능**

- **목적**: 사이트 검색 기능, 언어, URL 정의
- **Google 활용**: 사이트 내 검색 박스 표시 (Google 검색 결과)
- **효과**: 검색 결과에서 "사이트 내 검색" 기능 제공

**2. `@type: "Organization"` - 브랜드 정보**

- **목적**: 회사/브랜드의 로고, 이름, 소셜 미디어 정의
- **Google 활용**: 검색 결과에 로고 표시 (지구본 → 로고)
- **효과**: Knowledge Graph, 브랜드 신뢰도 향상

**왜 둘 다 필요한가?**

- WebSite: 사이트 기능 (검색)
- Organization: 브랜드 정보 (로고)
- 함께 사용: 완전한 SEO 최적화

### 🖼️ 로고 크기 최적화

**선택한 이미지**: `/assets/logo.png` (1024x1024)

**Google 요구사항**:

- 최소: 112x112px
- 권장: 512x512px
- **최적**: 더 큰 크기 (1024x1024 이상)

**1024x1024 선택 이유**:

- ✅ 고해상도 디스플레이에서도 선명
- ✅ Google이 다양한 크기로 리사이징
- ✅ 권장 크기(512x512)의 2배로 미래 대비
- ✅ 정사각형 1:1 비율로 완벽

### 🔗 sameAs 속성 (향후 추가 예정)

**정의**: "이 브랜드는 다른 웹사이트에서도 같은 존재"를 알려주는 속성

**효과**:

- Knowledge Graph (지식 패널) 표시 가능
- 브랜드 신뢰도 향상
- SEO 점수 개선
- 검색 결과에 소셜 미디어 링크 표시

**추가 가능한 URL**:

```json
"sameAs": [
  "https://twitter.com/speakmango",
  "https://facebook.com/speakmango",
  "https://instagram.com/speakmango",
  "https://linkedin.com/company/speakmango"
]
```

**현재 상태**: 빈 배열 (소셜 미디어 생성 후 추가 예정)

## 2026-01-15: SEO 개선 (Canonical URL 추가)

### ✅ 진행 사항

- **File**: `app/page.tsx`
  - 홈 페이지에 canonical URL 메타데이터 추가
  - `generateMetadata` 함수 구현

### 💬 주요 Q&A 및 의사결정

**Q. Canonical URL이란 무엇인가요?**

- **A.** Canonical URL은 "이 페이지의 정식 주소는 이것입니다"라고 검색 엔진에 알려주는 메타 태그입니다:
  - 같은 콘텐츠가 여러 URL로 접근 가능할 때 중복 방지
  - 예: `?lang=ko`, `?utm_source=facebook` 등 쿼리 파라미터가 있어도 같은 페이지
  - 검색 엔진이 어떤 URL을 색인할지 명확히 알려줌

**Q. 왜 홈 페이지에만 없었나요?**

- **A.** 상세 페이지(`/expressions/[id]`)에는 이미 설정되어 있었지만, 홈 페이지는 누락되어 있었습니다. 모든 주요 페이지에 canonical URL을 설정하는 것이 SEO 모범 사례입니다.

**Q. Google Search Console의 "리디렉션이 포함된 페이지" 경고는?**

- **A.** `http://speakmango.com/` → `https://speakmango.com/` 리디렉션은 정상이며 필수입니다:
  - 보안을 위한 HTTP → HTTPS 리디렉션
  - 배포 플랫폼(Vercel/Netlify)이 자동으로 처리
  - Google도 이를 인식하고 HTTPS 버전을 색인함
  - **걱정하지 않아도 됩니다!**

### 🎯 구현 내용

```tsx
export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: {
      canonical: BASE_URL,
    },
  };
}
```

## 2026-01-15: PWA Meta Tag 업데이트 (Deprecation 해결)

### ✅ 진행 사항

- **File**: `app/layout.tsx`
  - `apple-mobile-web-app-capable` → `mobile-web-app-capable`로 변경
  - Deprecated 경고 해결

### 💬 주요 Q&A 및 의사결정

**Q. 왜 변경했나요?**

- **A.** Chrome DevTools에서 deprecation 경고 발생:
  - `<meta name="apple-mobile-web-app-capable" content="yes"> is deprecated`
  - 권장사항: `<meta name="mobile-web-app-capable" content="yes">` 사용
  - 표준화된 메타 태그로 업데이트하여 향후 호환성 확보

**Q. 기능에 영향이 있나요?**

- **A.** 없습니다. 두 태그 모두 동일한 기능 (Standalone 모드 활성화)을 수행하며, 새로운 표준 태그로 교체한 것입니다.

## 2026-01-15: Open Graph 이미지 중앙 정렬 개선

### ✅ 진행 사항

- **File**: `app/opengraph-image.tsx`
  - 로고와 텍스트가 오른쪽으로 치우쳐 있던 문제 수정
  - `transform: translateX()` 사용하여 중앙 정렬 조정

### 🎨 수정 내용

- **Container**: `transform: translateX(-25px)` 추가
- **Text**: `transform: translateX(-15px)` 추가
- **Result**: 로고와 서비스명이 시각적으로 중앙에 배치

## 2026-01-15: Share 메시지 개선 (i18n)

### ✅ 진행 사항

- **i18n Update**: 9개 언어 파일의 `shareCopied` 메시지 개선
  - **Before**: "Link copied to clipboard!" / "링크가 클립보드에 복사되었습니다!"
  - **After**: "Shared successfully!" / "공유 완료!"
  - **Reason**: Web Share API 사용 시 클립보드가 아닌 네이티브 공유이므로 메시지를 더 일반적으로 변경

### 💬 주요 Q&A 및 의사결정

**Q. 왜 메시지를 변경했나요?**

- **A.** ShareButton은 두 가지 방식으로 작동합니다:
  1. **Web Share API** (모바일): 네이티브 공유 다이얼로그 → 클립보드 복사가 아님
  2. **Clipboard API** (데스크탑): 클립보드 복사

  기존 메시지 "Link copied to clipboard!"는 데스크탑에만 정확하고 모바일에서는 부정확했습니다. "Shared successfully!"로 변경하여 두 방식 모두에 적합한 일반적인 메시지로 통일했습니다.

**Q. 어떤 파일들이 수정되었나요?**

- **A.** 9개 언어 파일 모두 수정:
  - `i18n/locales/en.ts`, `ko.ts`, `ja.ts`, `es.ts`, `fr.ts`, `de.ts`, `ru.ts`, `zh.ts`, `ar.ts`
  - `detail.shareCopied` 및 `card.shareCopied` 키 모두 업데이트

## 2026-01-14: Google Tag Manager 향후 고려사항 문서화

### ✅ 진행 사항

- **Documentation**: `docs/product/future_todos.md`에 Marketing & Analytics 섹션 추가
  - Google Tag Manager (GTM) 도입을 선택적 개선사항으로 문서화
  - 도입 조건, 장단점, 현재 상황 분석 포함

### 💬 주요 Q&A 및 의사결정

**Q. Google Tag Manager(GTM)가 뭔가요?**

- **A.** GTM은 여러 마케팅/분석 도구의 태그를 코드 수정 없이 관리할 수 있는 Tag Management System입니다. 현재 우리는 GA4를 `gtag.js`로 직접 연동 중입니다.

**Q. 현재 프로젝트에 GTM이 필요한가요?**

- **A.** 아니요, 현재는 불필요합니다:
  - **이유 1**: GA4 단일 도구만 사용 중 (GTM의 "다중 도구 관리" 장점 없음)
  - **이유 2**: 개발자가 직접 관리하는 것이 더 명확하고 타입 안전
  - **이유 3**: GTM 추가 시 불필요한 복잡도 증가

**Q. 언제 GTM을 고려해야 하나요?**

- **A.** 다음 조건 중 하나 이상 충족 시:
  1. 마케팅 도구 2개 이상 사용 (Facebook Pixel, Google Ads, Hotjar 등)
  2. 마케팅 팀이 구성되어 비개발자가 태그를 관리해야 할 때
  3. A/B 테스트를 자주 실행할 때

**Q. GTM의 장단점은?**

- **A.**
  - **장점**: 코드 수정 없이 태그 관리, 여러 도구 중앙 관리, 버전 관리, 조건부 실행
  - **단점**: 학습 곡선, 오버엔지니어링, 디버깅 복잡도 증가

### 📝 문서화 내용

- **현재 상태**: GA4를 `gtag.js`로 직접 연동 중
- **도입 시점**: 마케팅 도구 확장 시 고려
- **결론**: 현재 방식(직접 연동)이 최적

## 2026-01-14: 표현 카드 공유 버튼 통합 (Card Share Integration)

### ✅ 진행 사항

- **Expression Card Layout Update**: `components/ExpressionCard.tsx`
  - ShareButton을 absolute 포지셔닝으로 우측 하단에 배치
  - Link 컴포넌트에 `relative` 추가 (포지셔닝 컨텍스트)
  - 태그와 독립적인 영역으로 분리
- **Event Propagation Enhancement**: 이벤트 전파 방지 강화
- **i18n Update**: 9개 언어에 card.share 관련 텍스트 추가 (이전 커밋에서 누락)

### 💬 주요 Q&A 및 의사결정

**Q. ShareButton을 왜 absolute 포지셔닝으로 배치했나?**

- **A.** 초기에는 태그와 함께 flex 레이아웃에 배치했으나, 태그 개수에 따라 공유 버튼 위치가 변동되는 문제 발생. absolute 포지셔닝으로 우측 하단(`bottom-5 right-5`)에 고정하여:
  1. **일관된 위치**: 태그 개수와 무관하게 항상 같은 위치
  2. **시각적 균형**: 우측 하단 고정으로 카드 레이아웃 안정성 확보
  3. **공간 효율**: 태그 영역을 침범하지 않고 독립적으로 배치

**Q. Link에 `relative`와 `block`을 함께 사용해도 괜찮은가?**

- **A.** 완전히 유효한 조합임:
  - `block`: display 속성 (레이아웃 타입) - Link가 카드 전체 높이(`h-full`) 차지
  - `relative`: position 속성 (포지셔닝 컨텍스트) - ShareButton의 absolute 기준점
  - 두 속성은 서로 다른 CSS 속성이므로 충돌 없이 함께 작동

**Q. 이벤트 전파 방지는 어떻게 강화했나?**

- **A.** 이중 방어 전략:
  1. **ShareButton 내부**: `handleShare`에서 `e.preventDefault()` + `e.stopPropagation()`
  2. **ExpressionCard**: ShareButton의 `onClick` prop에서 `e.stopPropagation()`
  - 두 레벨에서 이벤트 전파를 차단하여 카드 클릭 이벤트와 완전히 분리

**Q. 태그와 공유 버튼을 왜 분리했나?**

- **A.** 초기 grid 레이아웃(2:1 비율)도 시도했으나, absolute 포지셔닝이 더 나은 이유:
  - **유연성**: 태그가 많아져도 레이아웃 깨지지 않음
  - **명확성**: 공유 버튼이 항상 예측 가능한 위치에 있어 사용자 학습 비용 감소
  - **반응형**: 모바일/데스크탑 모두에서 일관된 경험 제공

### 🏗️ 구현 상세

**1. Absolute Positioning**

```tsx
// ExpressionCard.tsx
<Link
  href={ROUTES.EXPRESSION_DETAIL(item.id)}
  className="relative block h-full" // relative 추가
>
  {/* 카드 내용 */}

  {/* ShareButton - absolute 포지셔닝 */}
  <div className="absolute bottom-5 right-5">
    <ShareButton
      variant="compact"
      expressionId={item.id}
      expressionText={item.expression}
      meaning={meaning}
      shareLabel={dict.card.share}
      shareCopiedLabel={dict.card.shareCopied}
      shareFailedLabel={dict.card.shareFailed}
      onClick={(e) => e.stopPropagation()}
    />
  </div>
</Link>
```

**2. Event Propagation Prevention**

```tsx
// ShareButton.tsx - handleShare
const handleShare = async (e: React.MouseEvent) => {
  e.preventDefault(); // 기본 동작 방지
  e.stopPropagation(); // 이벤트 전파 차단

  if (onClick) onClick(e); // 추가 핸들러 실행
  // ... 공유 로직
};
```

### 🔍 검증 방법

**브라우저 테스트**:

1. **메인 페이지 카드**:
   - 공유 버튼이 우측 하단에 고정 위치로 표시
   - 공유 버튼 클릭 시 페이지 이동 없이 공유 기능만 실행 ✅
   - Toast 알림 정상 표시 ✅

2. **관련 표현 섹션**:
   - 데스크탑 Marquee 스크롤 중에도 공유 버튼 정상 작동
   - 모바일 세로 리스트에서도 동일하게 작동

### 🔄 다음 단계

- [ ] 사용자 피드백 수집 (공유 버튼 위치 및 크기)
- [ ] GA4에서 카드 공유 vs 상세 페이지 공유 비율 분석

## 2026-01-14: Share 기능 구현 (Web Share API + Toast System)

### ✅ 진행 사항

- **Share Button Component**: `components/ShareButton.tsx` 생성
  - Web Share API 활용 (모바일 네이티브 공유)
  - Clipboard Fallback (데스크탑 복사)
  - Variant 지원 (`default` / `compact`)
  - Analytics 자동 추적 통합
- **Toast Notification System**: 재사용 가능한 Toast 컴포넌트 및 타입 시스템 구축
  - `components/ui/Toast.tsx`: 독립 컴포넌트
  - `types/toast.ts`: 중앙 집중식 타입 관리
- **Share URL Generation**: `lib/utils.ts`에 `getShareUrl` 함수 추가
- **i18n 업데이트**: 9개 언어에 share 관련 텍스트 추가
- **UI Integration**: 상세 페이지 및 표현 카드에 ShareButton 통합
- **Documentation**: Analytics, Features, Task 문서 업데이트

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Toast를 별도 컴포넌트로 분리했나?**

- **A.** ShareButton 내부에 Toast 로직을 포함시키면 재사용성이 떨어짐. 향후 다른 기능(예: 북마크, 좋아요 등)에서도 Toast 알림이 필요할 수 있으므로, `components/ui/Toast.tsx`로 독립시켜 범용 컴포넌트로 만듦. 이를 통해 일관된 알림 UX 제공 가능.

**Q. Toast 타입을 왜 `types/toast.ts`로 분리했나?**

- **A.** `ToastType`과 `TOAST_TYPE` 상수를 ShareButton과 Toast 컴포넌트 모두에서 사용함. 두 컴포넌트가 서로 다른 파일에 있으므로, 타입을 중앙 집중식으로 관리하여 일관성 확보. 향후 Toast 타입이 확장될 때(예: `warning`, `info` 추가) 한 곳에서만 수정하면 됨.

**Q. Web Share API가 지원되지 않는 환경은 어떻게 처리하나?**

- **A.** `navigator.share` 존재 여부를 체크하여 분기 처리:
  - **지원**: Web Share API 사용 (`sharePlatform: "native"`)
  - **미지원**: Clipboard API로 URL 복사 (`sharePlatform: "clipboard"`)
  - 두 경우 모두 Toast로 사용자에게 피드백 제공.

**Q. Analytics 추적은 어떻게 구현했나?**

- **A.** ShareButton 내부에서 자동으로 추적:
  1. **Share Click**: 버튼 클릭 시 `trackShareClick` 호출
     - `shareMethod`: `"native"` (Web Share API) 또는 `"copy_link"` (클립보드)
     - `sharePlatform`: `"native"` 또는 `"clipboard"`
  2. **Share Complete**: 공유 성공 시 `trackShareComplete` 호출
     - Web Share API 완료 또는 클립보드 복사 성공 시
  - 컴포넌트 사용자는 Analytics 로직을 신경 쓸 필요 없이 자동으로 추적됨.

### 🏗️ 구현 상세

**1. ShareButton Component**

```typescript
// components/ShareButton.tsx
export default function ShareButton({
  expressionId,
  expressionText,
  meaning,
  shareLabel,
  shareCopiedLabel,
  shareFailedLabel,
  variant = "default",
  onClick,
}: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) onClick(e);

    const shareUrl = getShareUrl(expressionId, {
      utm_source: "share",
      utm_medium: "native",
    });

    if (navigator.share) {
      // Web Share API
      await navigator.share({ title, text, url: shareUrl });
      trackShareComplete({ expressionId, sharePlatform: "native" });
    } else {
      // Clipboard Fallback
      await navigator.clipboard.writeText(shareUrl);
      trackShareComplete({ expressionId, sharePlatform: "clipboard" });
    }
  };
}
```

**2. Toast Component**

```typescript
// components/ui/Toast.tsx
export default function Toast({ message, type, isVisible }: ToastProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
        type === TOAST_TYPE.SUCCESS ? "bg-green-500" : "bg-red-500"
      )}
    >
      {type === TOAST_TYPE.SUCCESS && <Check />}
      {type === TOAST_TYPE.ERROR && <X />}
      <span>{message}</span>
    </div>
  );
}
```

**3. Type System**

```typescript
// types/toast.ts
export type ToastType = "success" | "error";

export const TOAST_TYPE = {
  SUCCESS: "success" as const,
  ERROR: "error" as const,
} satisfies Record<string, ToastType>;
```

### 📊 현재 추적 가능한 이벤트 (Phase 5 완료)

**자동 추적:**

- ✅ `page_view`: 모든 페이지 뷰

**수동 추적 (Phase 3-5 완료):**

- ✅ `expression_click`: 표현 카드 클릭
- ✅ `expression_view`: 표현 상세 조회
- ✅ `audio_play`: 오디오 재생
- ✅ `audio_complete`: 오디오 재생 완료
- ✅ `learning_mode_toggle`: 학습 모드 전환
- ✅ `filter_apply`: 필터 적용
- ✅ `search`: 검색 실행
- ✅ `tag_click`: 태그 클릭
- ✅ `related_click`: 관련 표현 클릭
- ✅ `share_click`: 공유 버튼 클릭
- ✅ `share_complete`: 공유 완료

### 🔍 검증 방법

**개발 환경 콘솔 로그 확인:**

1. **모바일 (Web Share API)**:
   - Share 버튼 클릭 → 네이티브 공유 다이얼로그 표시
   - Instagram, Twitter, KakaoTalk 등 설치된 앱으로 공유 가능
   - `[Analytics] Event: share_click { expression_id: "...", share_method: "native", share_platform: "native" }`
   - `[Analytics] Event: share_complete { expression_id: "...", share_platform: "native" }`

2. **데스크탑 (Clipboard)**:
   - Share 버튼 클릭 → URL 클립보드 복사
   - Toast 알림: "Link copied!"
   - `[Analytics] Event: share_click { expression_id: "...", share_method: "copy_link", share_platform: "clipboard" }`
   - `[Analytics] Event: share_complete { expression_id: "...", share_platform: "clipboard" }`

## 2026-01-14: Analytics Phase 3 완료 (audio_complete, related_click 추적)

### ✅ 진행 사항

- **Phase 3: 나머지 이벤트 추적 구현 완료**
  - Audio Complete Tracking (`DialogueAudioButton.tsx`)
  - Related Expression Click Tracking (`RelatedExpressions.tsx`)
- **Props 확장**:
  - `DialogueSection`: `expressionId` prop 추가 및 하위 컴포넌트로 전달
  - `DialogueItem`: `isAutoPlaying`, `expressionId`, `audioIndex` props 추가
  - `DialogueAudioButton`: `isAutoPlaying` prop 추가 및 `play()` 함수 시그니처 확장
  - `RelatedExpressions`: `currentExpressionId` prop 추가
- **중복 추적 방지 로직 구현**:
  - 전체 듣기(Play All) 시 개별 `audio_play` 이벤트 중복 방지
  - 일시정지 후 재개(Resume) 시 `audio_play` 이벤트 스킵
- **문서 업데이트**:
  - `docs/product/features_list.md`: Phase 3 이벤트 상태를 ⏳에서 ✅로 변경
  - `docs/task.md`: Audio Complete, Related Click 작업 완료 표시

### 💬 주요 Q&A 및 의사결정

**Q. 전체 듣기 중에 개별 audio_play 이벤트가 중복 발생하는 문제를 어떻게 해결했나?**

- **A.** React의 state 업데이트는 비동기이므로, `setIsAutoPlaying(true)` 후 즉시 `play()`를 호출해도 컴포넌트는 아직 `isAutoPlaying: false` 상태임. 이를 해결하기 위해:
  1. `DialogueAudioButtonHandle.play()` 함수에 `isSequential` 파라미터 추가
  2. `DialogueSection`에서 전체 듣기 시 `play(true)` 호출하여 명시적으로 sequential 재생임을 전달
  3. `DialogueAudioButton`의 `togglePlay` 함수를 `useCallback`으로 감싸고 dependency에 `isAutoPlaying` 포함
  4. `useImperativeHandle`의 dependency에 `togglePlay` 추가하여 최신 클로저 참조

**Q. 일시정지 후 재개할 때 audio_play 이벤트가 발생하는 문제는?**

- **A.** 일시정지 상태(`isPaused`)를 체크하여 resume인지 새로운 재생인지 구분:
  ```typescript
  const isResume = isPaused;
  const shouldSkipTracking = (forcePlay && isSequential) || isResume;
  ```
  Resume인 경우 추적을 스킵하여 중복 방지.

**Q. 전체 듣기 중에 다른 오디오를 클릭하면 어떻게 되나?**

- **A.** 사용자가 직접 버튼을 클릭한 경우(`forcePlay: false`)는 항상 개별 듣기로 추적됨:
  ```typescript
  const shouldSkipTracking = (forcePlay && isSequential) || isResume;
  ```
  `forcePlay`가 `false`이면 `shouldSkipTracking`도 `false`가 되어 정상적으로 추적됨.

**Q. Related Expression 클릭 추적은 어떻게 구현했나?**

- **A.** `RelatedExpressions` 컴포넌트에 `currentExpressionId` prop을 추가하고, 카드 클릭 시 `trackRelatedClick` 호출:
  ```typescript
  trackRelatedClick({
    fromExpressionId: currentExpressionId,
    toExpressionId: item.id,
  });
  ```
  모바일(세로 리스트)과 데스크탑(Marquee 스크롤) 모두에서 동일하게 작동.

### 🏗️ 구현 상세

**1. Audio Complete Tracking**

```typescript
// DialogueAudioButton.tsx - handleEnded
const handleEnded = () => {
  setIsPlaying(false);
  setIsPaused(false);

  // Track audio complete event
  if (expressionId !== undefined && audioIndex !== undefined) {
    trackAudioComplete({
      expressionId,
      audioIndex,
    });
  }

  onEndedRef.current?.();
};
```

**2. Sequential Play with Explicit Parameter**

```typescript
// DialogueSection.tsx - handlePlayAll
const handlePlayAll = () => {
  // ...
  setIsAutoPlaying(true);
  setPlayingIndex(0);
  // Pass true to indicate this is sequential playback
  buttonRefs.current[0]?.play(true);

  trackAudioPlay({
    expressionId,
    audioIndex: 0,
    playType: "sequential",
  });
};
```

**3. Smart Tracking Logic**

```typescript
// DialogueAudioButton.tsx - togglePlay
const isResume = isPaused;

// Skip tracking if:
// 1. This is a forced play (from ref.play()) AND isSequential is true (auto-play sequence)
// 2. This is a resume from paused state (not a new play)
const shouldSkipTracking = (forcePlay && isSequential) || isResume;

if (
  !shouldSkipTracking &&
  expressionId !== undefined &&
  audioIndex !== undefined
) {
  trackAudioPlay({
    expressionId,
    audioIndex,
    playType,
  });
}
```

**4. Related Expression Click Tracking**

```typescript
// RelatedExpressions.tsx
const handleCardClick = (toExpressionId: string) => {
  trackRelatedClick({
    fromExpressionId: currentExpressionId,
    toExpressionId: toExpressionId,
  });
};
```

### 📊 현재 추적 가능한 이벤트 (Phase 3 완료)

**자동 추적:**

- ✅ `page_view`: 모든 페이지 뷰 (AnalyticsProvider)

**수동 추적 (Phase 3 - 완료):**

- ✅ `expression_click`: 표현 카드 클릭
- ✅ `expression_view`: 표현 상세 조회
- ✅ `audio_play`: 오디오 재생
- ✅ `audio_complete`: 오디오 재생 완료 (**신규**)
- ✅ `learning_mode_toggle`: 학습 모드 전환
- ✅ `filter_apply`: 필터 적용
- ✅ `search`: 검색 실행
- ✅ `tag_click`: 태그 클릭
- ✅ `related_click`: 관련 표현 클릭 (**신규**)

**향후 구현 예정:**

- ⏳ `share_click`: 공유 버튼 클릭
- ⏳ `share_complete`: 공유 완료

### 🔍 검증 방법

**개발 환경 콘솔 로그 확인:**

```bash
# 개발 서버 실행
yarn dev
```

브라우저 콘솔에서 다음 시나리오 테스트:

1. **전체 듣기**: 상세 페이지에서 "Play All" 버튼 클릭
   - `[Analytics] Event: audio_play { expression_id: "...", audio_index: 0, play_type: "sequential" }` (1회만)
   - `[Analytics] Event: audio_complete { expression_id: "...", audio_index: 0 }`
   - `[Analytics] Event: audio_complete { expression_id: "...", audio_index: 1 }`

2. **개별 듣기**: 대화 버블의 오디오 버튼 클릭
   - `[Analytics] Event: audio_play { expression_id: "...", audio_index: 0, play_type: "individual" }`
   - `[Analytics] Event: audio_complete { expression_id: "...", audio_index: 0 }`

3. **일시정지 후 재개**: 재생 중 버튼 클릭 → 다시 클릭
   - 재개 시 `audio_play` 이벤트 발생하지 않음 ✅

4. **관련 표현 클릭**: 상세 페이지 하단의 관련 표현 카드 클릭
   - `[Analytics] Event: related_click { from_expression_id: "...", to_expression_id: "..." }`

### 🔄 다음 단계

- [ ] GA4 대시보드에서 실제 데이터 수집 검증 (프로덕션 배포 후)
- [ ] 공유 기능 구현 시 `share_click`, `share_complete` 이벤트 추가

## 2026-01-14: Analytics Phase 3 완료 (학습 모드, 필터, 검색, 태그 추적)

### ✅ 진행 사항

- **Phase 3: 나머지 이벤트 추적 구현 완료**
  - Learning Mode Toggle Tracking (`DialogueSection.tsx`)
  - Category Filter Tracking (`FilterBar.tsx`)
  - Search Tracking (`SearchBar.tsx`)
  - Tag Click Tracking (`Tag.tsx`)
- **Props 확장**:
  - `Tag`: `source` prop 추가 (`"card" | "detail" | "filter"` 구분)
- **상위 컴포넌트 수정**:
  - `ExpressionCard`: Tag에 `source="card"` 전달
  - `app/expressions/[id]/page.tsx`: Tag에 `source="detail"` 전달
- **문서 업데이트**:
  - `docs/product/features_list.md`: Phase 3 이벤트 상태를 ⏳에서 ✅로 변경

### 💬 주요 Q&A 및 의사결정

**Q. 학습 모드 토글 추적은 어떻게 구현했나?**

- **A.** `DialogueSection` 컴포넌트의 두 가지 학습 모드를 각각 추적:
  1. **Blind Listening Mode**: Headphones 아이콘 클릭 시 `mode: "blind_listening"` 전송
  2. **Translation Blur**: Eye 아이콘 클릭 시 `mode: "translation_blur"` 전송
  - 각 모드의 활성화/비활성화를 `action: "enable" | "disable"`로 구분하여 사용자의 학습 패턴 파악 가능

**Q. 카테고리 필터 추적에서 중복 클릭은 어떻게 처리했나?**

- **A.** `FilterBar`에서 이미 선택된 카테고리를 다시 클릭하는 경우:
  - `"all"` 카테고리는 아무 동작도 하지 않음 (중복 페칭 방지)
  - 다른 카테고리는 선택 해제(`category: "all"`)하고 해당 이벤트 전송
  - 실제로 필터가 변경될 때만 이벤트를 전송하여 데이터 정확성 확보

**Q. Tag 컴포넌트의 source는 왜 필요한가?**

- **A.** 태그 클릭이 발생하는 위치에 따라 사용자 행동 패턴이 다름:
  - `"card"`: 홈 피드의 카드에서 태그 클릭 (탐색 초기 단계)
  - `"detail"`: 상세 페이지에서 태그 클릭 (콘텐츠 소비 후 관련 탐색)
  - `"filter"`: 필터 바에서 태그 클릭 (향후 구현 예정)
  - 이를 통해 어느 단계에서 태그 기반 탐색이 활발한지 분석 가능

**Q. 빈 검색어는 왜 추적하지 않나?**

- **A.** `SearchBar`의 `handleSubmit`에서 `value.trim()`이 비어있으면 이벤트를 전송하지 않음. 빈 검색어는 사용자가 실수로 Enter를 누르거나 검색을 취소하는 경우가 많아 의미 있는 데이터가 아니므로 제외.

### 🏗️ 구현 상세

**1. Learning Mode Toggle Tracking**

```typescript
// DialogueSection.tsx
import { trackLearningModeToggle } from "@/analytics";

// Blind Listening 활성화
trackLearningModeToggle({
  mode: "blind_listening",
  action: "enable",
});

// Translation Blur 비활성화 (모두 보기)
trackLearningModeToggle({
  mode: "translation_blur",
  action: "disable",
});
```

**2. Category Filter Tracking**

```typescript
// FilterBar.tsx
import { trackFilterApply } from "@/analytics";

// 카테고리 변경 시
trackFilterApply({
  filterType: "category",
  filterValue: cat, // "business", "travel", "all" 등
});
```

**3. Search Tracking**

```typescript
// SearchBar.tsx
import { trackSearch } from "@/analytics";

// 검색 제출 시 (빈 검색어 제외)
if (value.trim()) {
  trackSearch({
    searchTerm: value,
  });
}
```

**4. Tag Click Tracking**

```typescript
// Tag.tsx
import { trackTagClick } from "@/analytics";

// 태그 클릭 시
trackTagClick({
  tagName: label,
  source: source, // "card", "detail", "filter"
});
```

### 📊 현재 추적 가능한 이벤트 (Phase 3 완료)

**자동 추적 (Phase 1-2):**

- ✅ `page_view`: 모든 페이지 뷰 (AnalyticsProvider)

**수동 추적 (Phase 3 - 구현 완료):**

- ✅ `expression_click`: 표현 카드 클릭
- ✅ `expression_view`: 표현 상세 조회
- ✅ `audio_play`: 오디오 재생
- ✅ `learning_mode_toggle`: 학습 모드 전환 (**신규**)
- ✅ `filter_apply`: 필터 적용 (**신규**)
- ✅ `search`: 검색 실행 (**신규**)
- ✅ `tag_click`: 태그 클릭 (**신규**)

**수동 추적 (향후 구현 예정):**

- ⏳ `audio_complete`: 오디오 재생 완료
- ⏳ `related_click`: 관련 표현 클릭
- ⏳ `share_click`: 공유 버튼 클릭
- ⏳ `share_complete`: 공유 완료

### 🔍 검증 방법

**개발 환경 콘솔 로그 확인:**

```bash
# 개발 서버 실행
yarn dev
```

브라우저 콘솔에서 다음 이벤트 로그 확인:

1. **학습 모드 토글**: 상세 페이지에서 Headphones/Eye 아이콘 클릭
   - `[Analytics] Event: learning_mode_toggle { mode: "blind_listening", action: "enable" }`
2. **카테고리 필터**: 홈 페이지에서 카테고리 버튼 클릭
   - `[Analytics] Event: filter_apply { filter_type: "category", filter_value: "business" }`
3. **검색**: 검색창에 "hello" 입력 후 Enter
   - `[Analytics] Event: search { search_term: "hello" }`
4. **태그 클릭**: 카드 또는 상세 페이지의 태그 클릭
   - `[Analytics] Event: tag_click { tag_name: "daily", source: "card" }`

### 🔄 다음 단계

- [ ] `audio_complete` 이벤트 구현 (`DialogueAudioButton.tsx`)
- [ ] `related_click` 이벤트 구현 (`RelatedExpressions.tsx`)
- [ ] GA4 대시보드에서 실제 데이터 수집 검증 (프로덕션 배포 후)

## 2026-01-14: Analytics Phase 3 구현 (컴포넌트 이벤트 추적 및 모듈 재구성)

### ✅ 진행 사항

- **Analytics Module Reorganization**: `lib/analytics/` → `analytics/` (루트 레벨로 이동)
  - 독립된 모듈로 분리하여 발견 가능성 및 유지보수성 향상
  - Import 경로 단순화: `@/lib/analytics` → `@/analytics`
  - 7개 파일의 import 경로 업데이트 완료
- **Comment Localization**: 모든 영어 주석을 한국어로 변환
  - `analytics/index.ts`: 12개 이벤트 함수 주석 한국어화
  - `analytics/AnalyticsProvider.tsx`: Provider 주석 한국어화
  - `analytics/ExpressionViewTracker.tsx`: Tracker 주석 한국어화
- **Phase 3: Component-Level Event Tracking**
  - Expression Click Tracking (`ExpressionCard.tsx`)
  - Expression View Tracking (`ExpressionViewTracker.tsx` 신규 생성)
  - Audio Play Tracking Infrastructure (`DialogueAudioButton.tsx`)

### 💬 주요 Q&A 및 의사결정

**Q. Analytics 모듈을 왜 `lib/`에서 루트로 이동했나?**

- **A.** Analytics는 단순 유틸리티가 아니라 독립적인 기능 모듈임. `lib/`은 범용 유틸리티 함수를 위한 공간이고, Analytics는 GA4 통합, Provider, Tracker 등 여러 컴포넌트로 구성된 완전한 모듈이므로 루트 레벨에서 관리하는 것이 적절함. 이는 `components/`, `hooks/`, `context/`와 동일한 레벨의 독립 모듈로 취급.

**Q. ExpressionViewTracker를 왜 별도 컴포넌트로 분리했나?**

- **A.** 표현 상세 페이지(`app/expressions/[id]/page.tsx`)는 서버 컴포넌트인데, Analytics 추적은 클라이언트에서만 가능함(`useEffect` 필요). 따라서 클라이언트 컴포넌트인 `ExpressionViewTracker`를 별도로 만들어 서버 컴포넌트에서 import하여 사용. 이를 통해 서버/클라이언트 경계를 명확히 분리하고 코드 재사용성 향상.

**Q. DialogueAudioButton에 analytics props를 왜 선택적(optional)으로 만들었나?**

- **A.** `DialogueAudioButton`은 범용 컴포넌트로 다양한 곳에서 사용될 수 있음. Analytics가 필요 없는 경우(예: 미리보기, 테스트 환경)에도 동작해야 하므로 props를 선택적으로 설계. Props가 제공되면 추적하고, 없으면 추적하지 않는 조건부 로직 적용.

**Q. 주석을 왜 모두 한국어로 변경했나?**

- **A.** 프로젝트 전체가 한국어 주석을 사용하는 규칙을 따르고 있음. Analytics 모듈만 영어 주석을 사용하면 일관성이 깨지고, 향후 유지보수 시 혼란을 야기할 수 있음. 코드베이스 전체의 일관성 유지가 장기적으로 더 중요.

### 🏗️ 구현 상세

**1. Expression Click Tracking**

```typescript
// ExpressionCard.tsx
trackExpressionClick({
  expressionId: item.id,
  expressionText: item.expression,
  category: item.category,
  source: "home_feed",
});
```

**2. Expression View Tracking**

```typescript
// ExpressionViewTracker.tsx (새로운 클라이언트 컴포넌트)
useEffect(() => {
  trackExpressionView({
    expressionId,
    category,
    lang,
  });
}, [expressionId, category, lang]);
```

**3. Audio Play Tracking**

```typescript
// DialogueAudioButton.tsx
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

### 📊 현재 추적 가능한 이벤트

**자동 추적 (Phase 1-2):**

- ✅ `page_view`: 모든 페이지 뷰 (AnalyticsProvider)

**수동 추적 (Phase 3 - 구현 완료):**

- ✅ `expression_click`: 표현 카드 클릭
- ✅ `expression_view`: 표현 상세 조회
- ✅ `audio_play`: 오디오 재생 (인프라 구축, props 전달 필요)

**수동 추적 (Phase 3 - 구현 예정):**

- ⏳ `learning_mode_toggle`: 학습 모드 전환
- ⏳ `filter_apply`: 필터 적용
- ⏳ `search`: 검색 실행
- ⏳ `tag_click`: 태그 클릭
- ⏳ `related_click`: 관련 표현 클릭

### 🔄 다음 단계

- `DialogueSection.tsx`에 `expressionId` prop 추가 및 `DialogueItem`으로 전달
- 나머지 Phase 3 이벤트 추적 구현 (학습 모드, 필터, 검색, 태그, 관련 표현)
- 개발 환경에서 콘솔 로그 테스트
- GA4 대시보드에서 실제 데이터 수집 검증

## 2026-01-14: Analytics Implementation (Google Analytics 4 Integration)

### ✅ 진행 사항

- **GA4 Integration**: Google Analytics 4를 Next.js 16 App Router 프로젝트에 통합하여 사용자 행동 분석 인프라 구축.
- **Environment-Based Configuration**: 개발/프로덕션 환경별로 별도의 GA4 속성 사용하도록 환경 변수 기반 자동 전환 구현.
- **Analytics Module Structure**: `lib/analytics/` 폴더 생성 및 모듈화
  - `index.ts`: 타입 안전한 이벤트 추적 유틸리티 함수 (10개 핵심 이벤트 + 2개 공유 이벤트)
  - `AnalyticsProvider.tsx`: 페이지 뷰 자동 추적 Provider 컴포넌트
- **Automatic Page View Tracking**: `usePathname` + `useSearchParams` 훅을 활용한 라우트 변경 감지 및 자동 페이지 뷰 전송.
- **Title Duplication Fix**: i18n 파일의 `expressionTitle`에서 `| {serviceName}` 제거하여 `layout.tsx`의 `title.template`과 중복 방지.
- **Documentation**:
  - `analytics_guide.md`: 전체 Analytics 전략 및 이벤트 설계 문서
  - `implementation_guide.md`: 다른 프로젝트에서 재사용 가능한 실전 구현 가이드

### 🏗️ 아키텍처 설계

**디렉토리 구조:**

```
lib/analytics/
├── index.ts              # 유틸리티 함수 (이벤트 추적)
└── AnalyticsProvider.tsx # Provider 컴포넌트 (페이지 뷰 자동 추적)
```

**환경별 분리:**

- 개발 환경: `NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID` (Speak Mango EN (Dev) 속성)
- 프로덕션 환경: `NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID` (Speak Mango EN 속성)
- `process.env.NODE_ENV`에 따라 자동 선택

**Provider 계층:**

```tsx
<AnalyticsProvider>
  {" "}
  // 최상위 (독립적)
  <ExpressionProvider>{children}</ExpressionProvider>
</AnalyticsProvider>
```

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Analytics를 components가 아닌 lib 폴더에 두었나?**

- **A.** `AnalyticsProvider`는 UI 컴포넌트가 아니라 부수 효과(side effect)를 처리하는 유틸리티 Provider임. `ExpressionProvider`처럼 상태 관리를 하는 Context와 달리, 단순히 `useEffect`로 이벤트를 추적하는 역할만 수행. `lib/analytics.ts`와 함께 있는 것이 논리적이며, 향후 확장성을 고려하여 `lib/analytics/` 폴더로 모듈화.

**Q. 개발/프로덕션 환경을 왜 별도 GA4 속성으로 분리했나?**

- **A.** 개발 중 테스트 데이터가 실제 프로덕션 통계에 섞이는 것을 방지하기 위함. 두 개의 환경 변수(`NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID`)를 `.env.local`에 설정하고, `lib/analytics/index.ts`에서 `NODE_ENV`에 따라 자동 선택하도록 구현. 이 방식은 `.env.local`과 `.env.production` 파일을 분리하는 것보다 안전하고 관리가 용이함.

**Q. `document.title`이 빈 값으로 추적되는 문제를 어떻게 해결했나?**

- **A.** `AnalyticsProvider`가 클라이언트 컴포넌트로 렌더링될 때, Next.js가 아직 `document.title`을 설정하지 않은 상태임. `setTimeout` 100ms를 추가하여 Next.js Metadata API가 title을 설정할 시간을 확보. 이는 SSR 환경에서 클라이언트 컴포넌트가 hydration되는 타이밍 이슈를 해결하는 일반적인 패턴.

**Q. Title 중복 문제(`snap up | Speak Mango | Speak Mango`)는 어떻게 발생했나?**

- **A.** `layout.tsx`의 `title.template`이 `%s | Speak Mango` 형식이고, i18n 파일의 `expressionTitle`이 `{expression} | {serviceName}` 형식이어서 중복 발생. 9개 언어 파일 모두에서 `expressionTitle`을 `{expression}`으로 수정하여 해결. `layout.tsx`의 template이 자동으로 서비스명을 추가하므로 중복 불필요.

**Q. GA4 스크립트를 왜 `layout.tsx`에서 `GA_MEASUREMENT_ID`를 import해서 사용하나?**

- **A.** 환경별 측정 ID 선택 로직을 `lib/analytics/index.ts`에 집중시키기 위함. `layout.tsx`에서 환경 변수를 직접 참조하면 로직이 분산되고, 향후 환경 추가 시 여러 파일을 수정해야 함. `GA_MEASUREMENT_ID`를 export하여 단일 진실 공급원(Single Source of Truth) 유지.

**Q. 타입 에러(`Argument of type 'Date' is not assignable to parameter of type 'string'`)는 어떻게 해결했나?**

- **A.** `gtag` 함수의 타입 정의가 단일 시그니처로 되어 있어서, `gtag("js", new Date())`처럼 `Date` 객체를 전달할 때 타입 에러 발생. 함수 오버로드를 사용하여 각 명령어(`js`, `config`, `event`)별로 다른 타입의 파라미터를 받을 수 있도록 수정:
  ```typescript
  gtag?: {
    (command: "js", date: Date): void;
    (command: "config", targetId: string, config?: Record<string, any>): void;
    (command: "event", eventName: string, params?: Record<string, any>): void;
  };
  ```

### 📊 구현된 이벤트 함수

**핵심 이벤트 (10개):**

1. `trackPageView` - 페이지 뷰 (자동)
2. `trackExpressionView` - 표현 상세 조회
3. `trackExpressionClick` - 표현 카드 클릭
4. `trackAudioPlay` - 오디오 재생
5. `trackAudioComplete` - 오디오 재생 완료
6. `trackLearningModeToggle` - 학습 모드 전환
7. `trackFilterApply` - 필터 적용
8. `trackSearch` - 검색 실행
9. `trackTagClick` - 태그 클릭
10. `trackRelatedClick` - 관련 표현 클릭

**향후 구현 예정 (2개):** 11. `trackShareClick` - 공유 버튼 클릭 12. `trackShareComplete` - 공유 완료

### 🔄 다음 단계

- **Phase 3**: 컴포넌트별 이벤트 추적 구현
  - `ExpressionCard.tsx`: 표현 클릭 추적
  - `DialogueAudioButton.tsx`: 오디오 재생 추적
  - `DialogueSection.tsx`: 학습 모드 전환 추적
  - `FilterBar.tsx`: 필터/검색 추적
  - `Tag.tsx`: 태그 클릭 추적

## 2026-01-13: PWA iOS Splash Screen Fix (Troubleshooting & Resolution)

### ✅ 진행 사항

- **Explicit Head Injection**: Next.js `metadata.appleWebApp` 설정이 iOS에서 무시되는 현상을 해결하기 위해, `layout.tsx`에 수동으로 `<head>` 태그를 선언하고 `<link rel="apple-touch-startup-image">`를 직접 주입.
- **Standalone Mode Enforcement**: `apple-mobile-web-app-capable` 메타 태그를 명시적으로 추가하여 홈 화면 추가 시 Standalone 모드로 실행되도록 보장.

### 🚨 트러블슈팅 (Troubleshooting)

#### iOS Splash Screen White Screen Issue

- **문제**: 정해진 규격의 스플래시 이미지를 모두 생성했음에도 불구하고, iOS 기기에서 앱 실행 시 스플래시 스크린 대신 흰 화면이 잠시 뜨는 현상.
- **원인**: Next.js의 Metadata API가 생성하는 태그 구성 방식이 iOS의 PWA 인식 메커니즘과 충돌하거나 시점이 늦는 것으로 파악됨.
- **해결**: Metadata abstraction을 우회하고 원시 HTML `<link>` 태그를 `<head>` 최상단부에 직접 배치하여 해결.

## 2026-01-13: Service Essentials Update (PWA Splash & Theme Color)

### ✅ 진행 사항

- **Dynamic Theme Color**: `viewport` 설정에서 `themeColor`를 배열로 확장하여, 시스템 테마(Light/Dark)에 따라 브라우저 상단 바 색상이 `#ffffff` 또는 `#0a0a0a`로 자동 전환되도록 개선.
- **Splash Screen Data Generation**: `pwa-asset-generator`를 통해 30여 종의 iOS 해상도별 스플래시 이미지 생성 및 에셋 확보.
- **Manifest Connection**: `layout.tsx` 메타데이터에 `manifest: "/manifest.ts"`를 명시적으로 연결.

### 💬 주요 Q&A 및 의사결정

**Q. Theme Color를 왜 동적으로 바꿨나?**

- **A.** 단일 색상(`#ffffff`)으로 고정할 경우, 다크 모드 사용자에게 눈부심을 유발하고 앱의 통합성을 해침. 미디어 쿼리(`prefers-color-scheme`)를 지원하는 Next.js `viewport` 설정을 통해 사용자 시스템 설정에 맞는 UI 경험을 제공함.

## 2026-01-13: Dynamic OG Image Design & Metadata Polish

### ✅ 진행 사항

- **Dynamic OG Image Redesign (Expression Detail)**:
  - **Visual Upgrade**: 메인 OG 이미지의 디자인 언어(White BG, Gradient Text, Logo Header)를 상세 페이지(`app/expressions/[id]/opengraph-image.tsx`)에도 적용.
  - **Runtime Switch**: 고화질 로고(`logo.png`) 및 폰트 파일(`inter-*.ttf`) 직접 로딩을 위해 `edge`에서 `nodejs` 런타임으로 변경.
  - **Typography**: `Inter` 폰트(Bold 700, Black 900, Medium 500)를 사용하여 가독성 및 브랜드 일관성 강화.

- **i18n Metadata Optimization**:
  - **Expression Description Refinement**: 9개 국어 로케일 파일에서 `meaning`을 `expression`보다 먼저 노출하도록 포맷 수정.
  - **Reason**: 검색 결과 및 소셜 공유 시 핵심 정보인 '뜻'을 강조하여 클릭률(CTR) 유도.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Edge Runtime을 포기하고 Node.js로 전환했나?**

- **A.** `edge` 런타임은 파일 시스템(`fs`) 접근이 제한적이라 로컬에 저장된 고화질 로고와 폰트 파일을 효율적으로 읽어올 수 없었음. 디자인 완성도를 높이기 위해 Node.js 환경의 파일 시스템 API를 활용하기로 결정함.

## 2026-01-13: Dialogue Generation Rules Refinement (Gender & Names)

### ✅ 진행 사항

- **Dialogue Role & Name Standardization**:
  - **Gender Roles**: Role A(여성), Role B(남성)으로 성별을 고정하여 대화의 일관성 확보.
  - **Name Convention**: 미국식 이름(Sarah, Mike 등) 사용을 기본 원칙으로 하되, "이름을 사용할 경우(If using names)"에만 적용되도록 유연화.
  - **Anti-Pattern Prevention**: 한국어 이름(민지, 철수 등) 사용을 명시적으로 금지하여 영어 학습 콘텐츠로서의 몰입도 저해 방지.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 이름을 강제하지 않고 "사용할 경우"로 바꿨나?**

- **A.** 모든 대화에 이름을 부르는 것은 부자연스러울 수 있음. "Hey, Mike" 처럼 자연스러운 문맥에서만 이름을 사용하도록 하여 대화의 자연스러움을 높임.

## 2026-01-13: Validation Logic Synchronization & Data Fix (Strict Parity)

### ✅ 진행 사항

- **검증 로직 완전 동기화 (Strict Parity)**:
  - `verification/verify_db_data.js`를 최신 n8n 로직(`10_validate_content.js`)과 100% 동일하게 업데이트.
  - 대화 턴수(2~4), 퀴즈 선택지 언어 일관성, 문장 부호 검사 등의 엄격한 규칙이 로컬 스크립트에도 적용됨.

## 2026-01-13: n8n Workflow V2 Optimization (Single-Shot Generation)

### ✅ 진행 사항

- **Single-Shot AI 전환 (V2 Architecture)**:
  - 기존의 2-Step (표현 생성 -> 콘텐츠 생성) 방식을 **단일 Gemini 호출**로 통합하여 API 호출 횟수를 50% 절감하고 속도를 2배 향상시킴.
  - 관련 프롬프트 및 파싱 로직을 `n8n/expressions/code_v2/` 폴더에 분리하여 관리 (`04_gemini_master_generator_prompt.txt`, `05_parse_master_json.js`).
- **Fail-Fast 검증 로직 적용**:
  - 데이터 검증 단계(`Validate Content`)를 DB 중복 확인 및 ID 생성 이전으로 앞당겨, 잘못된 데이터가 후속 로직(DB 조회, TTS 등)에 영향을 주지 않도록 개선.
  - `06_validate_content.js`에서 불필요한 변수(`id`) 제거 및 로직 최적화.
- **문서 동기화 (Sync)**:
  - `docs/n8n/expressions/optimization_steps_v2.md`를 신규 작성하여, 워크플로우의 실제 노드 순서와 문서의 단계(1~15)를 1:1로 완벽하게 일치시킴.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 한 번에 생성(Single-Shot)하는 방식으로 바꿨나?**

- **A.**
  1. **속도 및 비용**: 두 번의 LLM 호출과 그 사이의 네트워크 오버헤드를 줄여 전체 처리 속도를 높임.
  2. **문맥 일관성**: 표현을 선정하는 AI와 예문을 만드는 AI가 동일한 컨텍스트(프롬프트) 내에서 동작하므로, 선정된 표현의 뉘앙스가 예문과 설명에 더 정확하게 반영됨.

**Q. 검증 로직을 왜 앞단으로 옮겼나?**

- **A.** 기존에는 DB 중복 체크 후에 검증을 수행했으나, 형식이 잘못된 데이터(예: JSON 파싱 실패)를 가지고 DB를 조회하는 것 자체가 비효율적임. 데이터 무결성을 먼저 확보한 후 비즈니스 로직(중복 체크, 저장)을 수행하는 것이 안정적임.

## 2026-01-12: Dialogue Turn Length Validation & Logic Refinement

### ✅ 진행 사항

- **대화 턴수 검증 로치 강화 (Dialogue Length Validation)**:
  - n8n Code Node 전용 `10_validate_content.js`에 대화 턴수 검증 규칙(2~4턴)을 추가하여 데이터 품질 균일화.
  - 관련 내용을 `docs/n8n/expressions/optimization_steps.md`에 반영하여 문서 현행화.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 대화 턴수를 2~4턴으로 제한했나?**

- **A.** Gemini 프롬프트에서는 2~3턴을 권장하고 있으나, 상황에 따라 A-B-A-B 구조가 자연스러울 때가 있음. 너무 짧으면 맥락 파악이 어렵고, 너무 길면 학습 피로도가 높으므로 2~4턴을 표준 범위로 설정함.

## 2026-01-12: V2 워크플로우 아키텍처 (개발 중)

### ✅ 진행 사항

- **V2 파일 격리 (Isolation)**:
  - V2 개발의 안정성을 위해 관련 모든 파일(`js`, `txt`, `json`)을 `n8n/expressions/v2/` 디렉토리로 이동하여 V1과의 의존성을 완전히 분리함.
- **Fan-out 아키텍처 도입**:
  - 다중 카테고리를 동시에 처리하기 위한 병렬 실행 구조를 설계하고 `01_pick_category_v2.js`에 구현함.
- **Rate Limiting (Groq TTS)**:
  - `15_groq_tts_v2.js`에 배치 처리(Batch Size: 10)와 대기 로직(Wait: 65s)을 구현하여 Groq API Rate Limit을 준수하도록 설계.
  - **Note**: 해당 로직에 대한 라이브 환경 검증(Verification)이 필수적으로 요구됨.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 V2 파일을 별도 폴더로 분리했나?**

- **A.** V2는 구조적 변경(Fan-out)이 커서 기존 워크플로우를 깨뜨릴 위험이 있음. 개발 중인 V2 파일들이 실수로 V1에 참조되지 않도록 물리적으로 격리함.

**Q. V2는 언제 배포 가능한가?**

- **A.** 현재 아키텍처 설계와 코딩은 완료되었으나, 실제 데이터 파이프라인에서의 전체 검증(특히 TTS 배치 처리의 안정성)이 완료될 때까지는 V1을 프로덕션으로 유지함.

## 2026-01-12: Verification Logic Refinement & Local Script Setup

### ✅ 진행 사항

- **엄격한 데이터 검증 로직 도입 (Strict Data Verification)**:
  - 기존의 `verify_gemini_response.js` 로직을 n8n Code Node용 `10_validate_content.js`로 이식 및 최적화.
  - **English Inclusion Rule**: 번역된 텍스트에 영어가 섞여 있는지 확인하는 로직을 강화(소문자 단어 검출, 고유명사 허용 등).
  - **Local Verification Script**: 로컬 환경에서도 `temp.json`을 검증할 수 있도록 `verification/verify_db_data.js` 스크립트 구축.
- **Bug Fix (Supabase Insert Error)**:
  - `_validation` 필드가 Supabase 테이블 스키마에 존재하지 않아 발생하던 `PGRST204` 에러 해결.
  - `15_aggregate_tts_results.js`에서 DB 저장 직전 `_validation` 필드를 명시적으로 삭제하도록 로직 수정.
- **문서 현행화**: `docs/n8n/expressions/optimization_steps.md`에 변경된 검증 및 정리 로직 반영.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 로컬 검증 스크립트(`verification/verify_db_data.js`)를 만들었나?**

- **A.** n8n 워크플로우를 매번 실행하지 않고도, 로컬에 저장된 데이터(`temp.json`)를 대상으로 검증 로직을 빠르게 테스트하고 수정하기 위함임. n8n의 코드와 로직을 100% 동일하게 유지하여 신뢰성을 확보함.

## 2026-01-11: Prompt Refinement (No Mixed Language)

### ✅ 진행 사항

- **프롬프트 강화 (혼합 언어 방지)**:
  - 대화 번역 프롬프트에 "Target Language ONLY" 및 "No Mixed Language" 제약 조건을 엄격하게 적용하여, 번역 결과에 영어(English)가 유출되는 현상을 방지함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 혼합 언어 방지 프롬프트를 추가했나?**

- **A.** LLM이 간헐적으로 번역 결과에 원문(영어)을 포함하거나, 타겟 언어 외의 다른 언어를 섞어 출력하는 경우가 발생함. 이는 번역 품질을 저해하고 후처리 과정을 복잡하게 만들 수 있어, 프롬프트 레벨에서 명확한 제약을 두어 모델의 일관된 출력을 유도함.

## 2026-01-11: n8n Batch Backfill & Prompt Optimization (Dialogue Translations)

### ✅ 진행 사항

- **Backfill Workflow 최적화 (Batch Processing)**:
  - 기존의 단건 처리 방식에서 벗어나, `Batch Size: 20`으로 묶어 처리하는 `batch_dialogue_translation_prompt.txt` 및 파싱 로직(`batch_dialogue_translation_parse_code.js`) 구현.
  - 이를 통해 대량의 데이터를 효율적으로 처리하고 API 호출 횟수를 획기적으로 절감함.
- **Prompt Strengthening (Critical Logic)**:
  - `08_gemini_content_generator_prompt.txt` 및 `optimization_steps.md`에 `**CRITICAL**` 경고 문구를 추가하여, 8개 언어(`ko, ja, es, fr, de, ru, zh, ar`) 번역이 절대 누락되지 않도록 제약 강화.
- **Legacy Code Removal**:
  - `optimization_steps.md`, `prepare_tts_requests.js`, `aggregate_tts_results.js`에서 구버전 데이터 경로(`data.content.ko.dialogue`)를 참조하던 레거시 코드를 최신 스키마(`data.dialogue`)로 일괄 업데이트.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Batch Processing을 도입했나?**

- **A.** 112개의 기존 데이터를 하나씩 처리하면 112번의 LLM 호출과 오버헤드가 발생함. 20개씩 묶어서 처리함으로써 호출 횟수를 약 1/20로 줄이고 처리 속도를 대폭 향상시킴.

**Q. 프롬프트에 `CRITICAL`을 추가한 이유는?**

- **A.** LLM이 간헐적으로 일부 언어(특히 아랍어 등)를 누락하는 현상이 발견됨. 이를 "절대 생략 불가" 영역으로 명시하여 모델이 모든 언어를 강제로 출력하도록 유도함.

## 2026-01-11: 하드코딩된 언어 문자열 제거 및 상수화 (Hardcoded String Refactoring)

### ✅ 진행 사항

- **하드코딩 제거 (Removal of Hardcoded Strings)**:
  - codebase 전반(components, i18n utilities, pages)에 걸쳐 `'en'`, `'ko'` 등으로 산재해 있던 하드코딩된 언어 문자열을 `SupportedLanguage` 상수로 대체.
  - 이를 통해 로케일 코드 변경 시 중앙(`i18n/index.ts`)에서 일괄 제어가 가능하도록 구조 개선.
- **컴포넌트 로직 정교화**:
  - `ExpressionCard`, `DialogueSection` 등에서 특정 언어에 의존적이던 로직을 제거하고 `SupportedLanguage.EN`을 명시적 Fallback으로 사용하도록 통일.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 하드코딩된 문자열을 상수로 바꿨나?**

- **A.** 9개 국어로 확장됨에 따라 `'en'`, `'ko'` 같은 문자열이 오타로 인해 버그를 유발할 가능성이 높아짐. `SupportedLanguage` enum/object를 사용하면 IDE의 자동 완성을 지원받을 수 있고, 휴먼 에러를 원천 차단할 수 있음.

## 2026-01-11: 5개국어 추가 및 i18n 타입 안정성 강화 (v0.9.5)

### ✅ 진행 사항

- **5개 신규 언어 지원 (Language Expansion)**:
  - 프랑스어(FR), 독일어(DE), 러시아어(RU), 중국어(ZH), 아랍어(AR) 로케일 추가.
  - 기존 4개국어(EN, KO, JA, ES) 포함 총 9개 국어 지원 체계 완성.
- **Strict i18n Type Safety (타입 안정성 강화)**:
  - `i18n/index.ts`에서 `en` 딕셔너리를 기준으로 `Dictionary` 타입을 추론.
  - 모든 언어 파일(`ko`, `fr` 등)이 `en`과 동일한 키 구조를 가지도록 강제.
  - 키 누락 시 빌드 타임에 에러가 발생하여 런타임 `undefined` 참조 방지.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `en`을 기준으로 타입을 추론하나?**

- **A.** 별도의 `interface`를 유지보수하는 것보다, 실제 가장 최신 상태인 영어 파일(`en.ts`)을 Source of Truth로 삼는 것이 관리 비용이 적고 직관적임.

**Q. 신규 언어의 번역 퀄리티는?**

- **A.** UI 표준 용어(Standard UI Terms)를 기준으로 생성하였으며, 추후 서비스 고도화 시 원어민 감수를 통해 톤 앤 매너를 다듬을 예정임.

## 2026-01-11: Universal Backfill System 구축 (Multi-Language Expansion)

### ✅ 진행 사항

- **Dual Backfill Strategy (이원화 전략) 구현**:
  - `universal_backfill_workflow.json`에 두 가지 병합 전략을 적용할 수 있도록 로직 분리.
  - **Universal Mode**: 영문(`en`)을 포함한 6개 국어(`fr`, `de`, `ru`, `zh`, `ar`) 동시 생성 및 덮어쓰기.
  - **Supplementary Mode**: 기존 영문 데이터는 유지하고 신규 5개 국어만 안전하게 병합.
- **코드 모듈화**: 병합 로직을 `universal_backfill_parse_code.js`와 `supplementary_backfill_parse_code.js`로 분리하여 유지보수성 향상.
- **프롬프트 표준화**: 모든 프롬프트의 언어 지원 범위를 9개 국어(EN, KO, JA, ES, FR, DE, RU, ZH, AR)로 통일하고 검증 규칙 강화.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Universal과 Supplementary 전략을 나눴나?**

- **A.** 데이터의 상태에 따라 필요한 작업이 다르기 때문임.
  1. **Universal**: 영문 콘텐츠 자체도 리뉴얼이 필요하거나, 초기 데이터가 부실할 때 전체를 새로 덮어써야 함.
  2. **Supplementary**: 이미 검증된 영문 콘텐츠가 있고, 단지 새로운 언어만 "끼워 넣고" 싶을 때 기존 데이터를 보호해야 함.

**Q. 병합 로직을 별도 JS 파일로 분리한 이유는?**

- **A.** n8n 노드 내에서 코드를 수정하는 실수를 방지하고, 운영자가 상황에 맞게 파일 내용을 복사-붙여넣기 하는 것만으로 전략을 전환할 수 있도록 하여 운영 안정성을 높임.

## 2026-01-11: 데이터베이스 스키마 리팩토링 (Database Schema Refactoring)

### ✅ 진행 사항

- **Dialogue 데이터 정규화**:
  - `expressions` 테이블에 `dialogue` JSONB 컬럼을 추가하고 GIN 인덱스를 적용하여 쿼리 성능을 최적화함.
  - 기존 `content` 컬럼 내부에 중첩되어 있던 대화문 데이터를 최상위 `dialogue` 컬럼으로 마이그레이션(`011_migrate_dialogue_data.sql`)하여 데이터 구조를 단순화함.
- **문서 동기화**: `docs/database/schema.md`에 변경된 스키마(Dialogue 컬럼 및 인덱스) 반영 완료.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Dialogue 데이터를 별도 컬럼으로 분리했나?**

- **A.**
  1. **데이터 중복 제거**: 기존에는 `content` JSON 내부의 각 언어(`ko`, `ja`, `es`)마다 영어 대화문(`en`)과 오디오 경로(`audio_url`)가 반복해서 저장되는 비효율이 있었음. 이를 최상위 `dialogue` 컬럼으로 빼내어 영어 원문과 오디오는 한 번만 저장하고, 각 언어는 번역본만 관리하도록 리팩토링함.
  2. **확장성**: `en` 필드가 공식적으로 추가됨에 따라, 영어 자체도 하나의 '언어'로서 동등하게 관리하고 TTS 생성 및 멀티턴 학습 등 독립적인 기능 확장의 기반을 마련함.
  3. **성능**: `content`라는 거대한 JSON 안에 숨겨두기보다 최상위 컬럼으로 꺼내어 인덱싱(GIN)과 쿼리 효율을 높임.

## 2026-01-10: n8n 콘텐츠 품질 고도화 (Content Quality Refinement)

### ✅ 진행 사항

- **Gemini 프롬프트 개선**:
  - **영어(en) 지원 추가**: JSON 스키마 및 예시에 영어 필드를 추가하여 4개 국어(EN, KO, JA, ES) 지원 완성.
  - **톤 매너 정교화**:
    - 영어 설명 톤을 "Standard English (Friendly, conversational, yet educational)"로 정의.
    - 문자 메시지체(Text-speak)나 과도한 슬랭 사용을 금지하여 교육 콘텐츠로서의 품질 확보.
  - **퀴즈 편향 해결**: 정답이 특정 번호(B)로 쏠리는 현상을 방지하기 위해 "정답 위치 랜덤화(Randomize answer position)" 규칙을 명시적으로 추가.
- **문서 동기화**: `n8n/expressions/expressions_workflow_template.json`, `docs/n8n/expressions/optimization_steps.md` 및 `n8n/expressions/code/08_gemini_content_generator_prompt.txt`에 변경된 프롬프트 내용을 동기화하여 코드-문서-템플릿 간의 정합성 유지.

## 2026-01-10: 서비스 필수 요소 완성 (Service Essentials: PWA, SEO, i18n)

### ✅ 진행 사항

- **PWA (Progressive Web App) 완성**:
  - **Manifest & Icons**: `manifest.ts`를 통해 안드로이드/데스크탑용 아이콘과 테마 색상을 설정함.
  - **iOS 스플래시 스크린**: `pwa-asset-generator`를 사용하여 iOS 기기 해상도별 스플래시 이미지 30여 장을 생성(`public/assets/splash`)하고 `layout.tsx`에 `startupImage` 및 `appleWebApp` 메타데이터를 연결함.
    - **디자인 최적화**: 세로 모드(Portrait)는 30% 여백, 가로 모드(Landscape)는 20% 여백을 적용하여 로고 시인성을 확보함.
  - **개발 환경 최적화**: `next-pwa` 플러그인의 Webpack 의존성 호환을 위해 `next dev --webpack` 및 `next build --webpack`으로 스크립트 강제 설정.
- **SEO (Search Engine Optimization) 고도화**:
  - **동적 메타데이터**: `generateMetadata` 함수를 통해 각 페이지별 타이틀, 설명, 키워드를 i18n 딕셔너리에 맞춰 동적으로 생성.
  - **Open Graph**: `opengraph-image.tsx`를 구현하여 상세 페이지의 표현(Expression) 텍스트가 포함된 동적 썸네일을 생성 및 제공.
  - **JSON-LD**: 구글 리치 스니펫(Rich Snippet)을 위한 구조화된 데이터(LearningResource, Organization) 추가.
  - **Sitemap & Robots**: `sitemap.ts`와 `robots.ts`를 구현하여 검색 엔진 크롤링 경로 최적화.
- **Internationalization (i18n) 리팩토링**:
  - **상수화**: `SupportedLanguage` 상수를 도입하여 언어 코드(`en`, `ko`, `ja`, `es`) 및 포맷(`locale`, `lang`, `og_locale`)을 중앙에서 일관되게 관리.
  - **Type Safety**: 미들웨어 및 서버 로직에서 문자열 하드코딩을 제거하고 상수 기반으로 리팩토링하여 안정성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Turbopack 대신 Webpack을 강제했나?**

- **A.** `next-pwa` 플러그인이 아직 Webpack 플러그인 시스템에 의존하고 있어 Turbopack 환경에서는 서비스 워커 생성이 불가능함. 기능 안정성을 위해 개발 및 빌드 환경 모두 Webpack으로 통일함. (프로덕션 성능에는 영향 없음)

**Q. iOS 스플래시 스크린을 왜 이미지로 각각 생성했나?**

- **A.** 안드로이드는 아이콘 하나로 OS가 자동 생성해주지만, iOS(Web Web App) 스펙상 아직 자동 생성을 지원하지 않음. 사용자가 앱을 켤 때 흰 화면(White screen)을 보지 않게 하려면 각 기기 해상도에 딱 맞는 이미지를 `link rel="apple-touch-startup-image"`로 일일이 지정해줘야 함.

**Q. 가로 모드에서 스플래시 여백을 줄인 이유는?**

- **A.** 가로 모드는 세로 높이가 낮아, 30% 여백 적용 시 로고가 너무 작아지거나 잘려 보일 수 있음. 가로 모드만 20%로 여백을 줄여 시각적 균형을 맞춤.

## 2026-01-09: 프로젝트 고도화 및 품질 개선 (Code Refactoring & Optimization)

### ✅ 진행 사항

- **커스텀 훅 추출 및 리팩토링**: `ExpressionList.tsx`의 비대한 로직을 기능별로 분리하여 코드 가독성과 유지보수성을 극대화함.
  - **`usePaginatedList`**: 페이지네이션 상태 관리, 더 보기 페칭 및 캐시 동기화 로직 담당.
  - **`useScrollRestoration`**: 정밀한 스크롤 위치 추적(200ms 디바운스) 및 재귀적 RAF 기반의 복원 로직 담당.
- **성능 최적화**: 브라우저 렌더링 프레임에 최적화된 스크롤 복원 시스템 구축 및 자원 효율 극대화.

## 2026-01-09: 스크롤 복원 동작 수정 (Scroll Restoration Fix)

### ✅ 진행 사항

- **스크롤 초기화 로직 추가**: `ExpressionList` 컴포넌트에서 새로운 필터(태그, 검색어 등)로 진입하여 저장된 스크롤 위치가 없을 경우(`targetPosition <= 0`), 명시적으로 `window.scrollTo(0, 0)`을 실행하도록 수정.
- **상세 페이지 스크롤 리셋 전략 (Session Storage)**: 상세 페이지(`[id]`) 진입 시, 새로운 페이지 이동(Push)과 뒤로가기(Back)를 구분하기 위해 `sessionStorage` 플래그(`SCROLL_RESET_KEY`)를 도입.
  - `ExpressionCard` 클릭 시 플래그를 심고, `template.tsx`에서 이를 확인하여 스켈레톤 로딩 전 최상단 스크롤을 보장함.
  - 뒤로가기 시에는 플래그가 없으므로 브라우저의 전역 `history.scrollRestoration = "auto"` 설정을 통해 자연스러운 위치 복원을 지원함.
- **원인 및 해결**: 브라우저의 자동 스크롤 복원(`scrollRestoration`)을 수동(`manual`)으로 설정해 두었기 때문에, 새로운 페이지 진입 시 스크롤이 자동으로 위로 가지 않는 현상을 해결함.

## 2026-01-09: 버그 수정 (Bug Fixes)

### ✅ 진행 사항

- **Audio URL Handling & DB Normalization**:
  - **DB Normalization**: Supabase DB의 `audio_url`을 기존 절대 경로(`https://...`)에서 스토리지 내부 상대 경로(`expressions/...`)로 일괄 정규화(SQL 사용). 이를 통해 도메인 변경이나 프로젝트 이전에 유연하게 대응 가능하도록 구조 개선.
  - **아키텍처 최적화**: URL 완성 로직을 Server Component(`page.tsx`)가 아닌 Client Component(`DialogueAudioButton.tsx`) 내부로 이동(Encapsulation). 서버는 가공되지 않은 원시 데이터를 전달하고, 클라이언트는 재생 직전에만 전체 URL로 변환하여 페이로드 크기 최적화 및 유지보수성 향상.
  - **에러 핸들링 강화**: `DialogueAudioButton`의 오디오 재생 에러 로그를 상세화하여 `error.code`, `error.message`, `src` 정보를 포함하도록 개선. 브라우저의 불투명한 미디어 에러 디버깅을 용이하게 함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 DB에 상대 경로로 저장하고 클라이언트에서 변환하나?**

- **A.**
  1. **유지보수**: Supabase 프로젝트 ID나 도메인이 바뀌어도 환경 변수 하나만 수정하면 되기 때문.
  2. **캡슐화**: "오디오 주소를 어떻게 구성하는가"에 대한 지식을 재생 컴포넌트 내부에 숨겨, 데이터 소유자(서버)는 인프라 정보에 신경 쓰지 않아도 됨.
  3. **최적화**: 서버에서 클라이언트로 넘어가는 JSON 데이터의 크기를 줄일 수 있음.

**Q. 상세한 에러 로그를 남겨두는 이유는?**

- **A.** 오디오 재생 에러는 네트워크, 코덱, 브라우저 정책 등 원인이 다양함. 단순 로그만으로는 원인 파악이 어렵기 때문에 구체적인 `MediaError` 코드를 남기는 것이 장기적인 유지보수에 훨씬 유리함.

## 2026-01-09: UI 비주얼 보정 및 리팩토링 (UI Visual Polish & Refactoring)

### ✅ 진행 사항

- **Dark Mode Visibility**: `DialogueItem`에서 Blue 테마(`variant="blue"`)가 블러 처리될 때, 텍스트가 회색(`text-disabled`)으로 변하여 어색한 문제 해결. `text-blue-200/70`을 적용하여 파란 배경 위에서도 자연스럽게 블러되도록 개선.
- **Code Refactoring**: 반복되는 비활성화 텍스트 스타일(`text-zinc-300 dark:text-zinc-600`)을 `@utility text-disabled`로 추상화하고 `DialogueSection` 및 `DialogueItem`에 적용.

## 2026-01-09: 학습 모드 상호작용 고도화 (Learning Mode Interaction Refinement)

### ✅ 진행 사항

- **Smart Toggle Interaction**: 'Blind Listening' 모드와 'Translation Blur' 모드 간의 상호작용 개선.
  - 기존: 'Blind Listening' 모드 중에는 'Translation Blur' 버튼 비활성화.
  - 개선: 'Translation Blur' 버튼 클릭 시 'Blind Listening' 모드가 자동으로 꺼지며 해석이 노출됨.
  - **Individual English Reveal (Partial Blind)**: 리스닝 모드에서 문장별 확인 기능 추가.
  - 리스닝 모드가 켜져 있어도, 사용자 클릭 시 해당 영어 문장만 블러가 해제됨.
  - **Auto-Exposed**: 모든 영어 문장을 하나씩 열어보다가 전체가 다 열리면, 자동으로 'Blind Mode'가 해제되고 'Exposed Mode'로 전환됨. 동시에 'Translation Blur' 버튼도 원래의 활성화 상태(눈 뜬 아이콘)로 자동 복귀.
  - **State Preservation**: 블라인드 모드 진입 전의 '해석 보기' 상태를 기억했다가, 모드 해제 시 그대로 복원하여 학습 흐름 유지.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 리스닝 모드에서 개별 문장 확인 기능을 넣었나?**

- **A.** 기존에는 문장이 안 들릴 때 무조건 전체 리스닝 모드를 꺼야 했음. 학습자가 "이 문장만 확인하고 싶다"는 니즈를 충족시키고, 학습의 흐름이 끊기지 않도록 하기 위해 개별 문장 클릭 기능을 추가함.

**Q. 개별 문장 클릭 시 영어만 보여주고 해석은 여전히 가리는 이유는?**

- **A.** 'Partial Blind'의 목적은 "안 들리는 단어/문장 확인"에 있음. 해석까지 바로 보여주면 학습자가 소리가 아닌 의미에 의존하게 되어 리스닝 훈련 효과가 감소함. 따라서 영어 텍스트만 먼저 확인하고, 해석은 필요시 별도로 확인하거나 모드를 해제해서 보도록 단계적으로 설계함.

**Q. 개별 문장 확인 대신 모드 해제로 변경한 이유는?**

- **A.** 초기 기획에서는 개별 확인 기능을 넣지 않으려 했으나, 사용자가 "잠깐 확인하고 싶은데 모드를 껐다 켜기 귀찮다"는 피드백을 수용함. 단, "문장을 클릭한다"는 행위가 누적되어 전체를 다 보게 되면 사실상 모드를 끈 것과 다름없으므로, 이때는 자동으로 모드를 해제(Auto-Exposed)하여 사용자 의도에 맞게 상태를 동기화함.

**Q. 호버 효과를 뺀 이유는?**

- **A.** 블라인드 모드는 텍스트를 가리는 것이 목적임. 마우스를 올릴 때마다 배경이 변하는 등의 효과는 시각적 노이즈가 될 수 있어, '클릭 가능함'을 알리는 커서 변경(`cursor-pointer`)만 남기고 나머지는 제거함.

**Q. 'Partial Blind' 상태(아이콘은 꺼졌지만 일부만 보임)를 둔 이유는?**

- **A.** "문장 클릭 -> 전체 해제"는 너무 급격한 변화임. 사용자가 클릭한 문장만 확인하고 싶을 때, 모드 아이콘이 꺼지는 시각적 피드백은 주되, 다른 문장은 계속 가려두어 학습 흐름을 유지함.

**Q. '눈 아이콘'이 떠 있는데 왜 비활성화 색상인가?**

- **A.** 사용자의 "해석 보기 설정"은 켜져 있지만, "Blind Mode"가 이를 덮어쓰고(Override) 있음을 나타냄. Blind Mode가 꺼지면 즉시 원래 설정(해석 보임)으로 복귀함을 암시하는 UI 패턴임.

**Q. 왜 모든 영어 문장이 열리면 자동으로 모드를 끄나?**

- **A.** 사용자가 모든 문장을 클릭해서 열었다는 건 더 이상 "Blind Listening" 상태가 아님을 의미함. 사용자가 굳이 아이콘을 눌러 모드를 끌 필요 없이, 자연스럽게 다음 단계(해석 확인 등)로 넘어갈 수 있도록 자동화함.

## 2026-01-08: 학습 모드 (Learning Mode) 기초 구현 및 오디오 안정성 강화

### ✅ 진행 사항

- **학습 모드 기반 구축**:
  - **Blind Listening Mode**: 대화문의 영어 텍스트를 숨기고(Blur) 소리에 집중하는 모드 구현. (Default: ON)
  - **Translation Blur**: 기본적으로 해석을 숨기고, 사용자가 클릭할 때만 해당 문장의 해석을 보여주는 기능 구현. (Default: Blur)
- **LearningToggle 컴포넌트**: '리스닝 모드'와 '해석 블러'를 제어하는 공통 버튼 컴포넌트를 추출하여 UI 일관성 확보.
- **상호작용 최적화**: 'Blind Listening' 모드 활성화 시 'Translation Blur' 버튼을 비활성화하여 논리적 충돌 방지.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 리스닝 모드에서 해석 블러 버튼을 비활성화했나?**

- **A.** 리스닝 모드는 소리에만 집중하는 단계이므로, 해석을 하나씩 열어보는 인터랙션까지 허용하면 학습 단계의 구분이 모호해짐. 우선은 영어 텍스트를 먼저 익히고, 나중에 리스닝 모드를 끄고 해석을 확인하는 흐름을 권장하기 위함임 (추후 피드백에 따라 상호작용 고도화 예정).

## 2026-01-08: 대화 전체 듣기(Play All) 로딩 동기화 및 안정화

### ✅ 진행 사항

- **로딩 동기화(Loading Sync)**: '전체 듣기' 버튼이 모든 개별 오디오 파일이 준비(`onReady`)될 때까지 로딩 상태를 유지하도록 개선하여, 재생 도중 끊기는 현상 방지.
- **깜빡임(Flickering) 해결**: `DialogueAudioButton`에서 `onReady` 콜백이 변경될 때마다 오디오가 재로딩되는 문제를 `useRef`로 의존성을 제거하여 해결.
- **i18n 적용**: 'Loading...' 텍스트를 `dict.common.loading`으로 교체하여 다국어 지원.
- **UI 폴리싱**: 로딩 중 커서 스타일(`not-allowed`)을 통일하여 사용자 경험 일관성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `useEffect` 의존성에서 `onReady`를 뺐나?**

- **A.** `useEffect`에 `onReady`가 포함되어 있으면, 부모가 리렌더링되어 새로운 `onReady` 함수를 내려줄 때마다 자식의 오디오 로딩 로직이 다시 실행되는 무한 루프 또는 깜빡임이 발생함. `useRef`를 사용하여 최신 함수를 참조하되, 이펙트의 트리거가 되지 않도록 함.

## 2026-01-08: 대화 전체 듣기(Play All) 기능 구현

### ✅ 진행 사항

- **순차 재생 시스템**: `DialogueSection` 컴포넌트를 통해 대화문을 처음부터 끝까지 자동으로 이어서 들려주는 '전체 듣기' 기능 도입.
- **스마트 인터럽트**: 자동 재생 중 개별 재생 시도 시 자동 모드를 해제하여 사용자 경험 충돌 방지.
- **시각적 동기화**: 현재 재생 중인 대화 버블에 하이라이트(`ring`) 처리를 하여 청각과 시각 정보를 일치시킴.
- **다국어 처리**: 재생/정지 버튼 텍스트를 i18n 딕셔너리로 처리.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `DialogueSection`을 별도로 만들었나?**

- **A.** 기존에는 `page.tsx`에서 대화 리스트를 맵핑했지만, '전체 듣기'와 같은 상태(`isAutoPlaying`, `playingIndex`)를 관리하려면 클라이언트 컴포넌트로 분리하는 것이 필수적이었음. 또한 코드 가독성과 재사용성을 높이기 위함.

## 2026-01-08: 오디오 재생 권한 제어 기반 마련 (Audio Feature Gating Infrastructure)

### ✅ 진행 사항

- **Feature Gating 기반 구현**: `DialogueAudioButton` 컴포넌트에 `onPlayAttempt` 콜백 프로퍼티 추가. 이를 통해 재생 전 사용자 티어(Free/Pro)나 권한을 체크할 수 있는 확장 가능한 구조 확보.
- **기술 부채 해결**: `future_todos.md`에 기록되었던 'Scalable Architecture' 항목을 구현하여 향후 수익화 모델(Freemium) 도입을 위한 기술적 준비 완료.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `DialogueAudioButton` 내부에 직접 권한 체크 로직을 넣지 않았나?**

- **A.** 컴포넌트는 UI와 재생 로직에만 집중하고, 권한 체크 로직은 외부(Container 또는 Context)에서 주입받도록 함으로써 컴포넌트의 재사용성을 높이고 비즈니스 로직과의 결합도를 낮추기 위함임.

## 2026-01-08: 원어민 대화 듣기 기능 구현 및 구조 개선 (Native Audio Playback & Structural Refactoring)

### ✅ 진행 사항

- **오디오 재생 기능 구현**: `DialogueAudioButton` 컴포넌트를 신설하여 대화 버블 내에서 원어민 음성을 즉시 재생할 수 있는 기능 추가.
- **오디오 동기화 로직 적용**: 한 번에 하나의 음성만 재생되도록 커스텀 이벤트를 활용한 전역 중지 메커니즘 구현.
- **상수 관리 구조 개편**: `lib/constants` 폴더를 루트의 `constants/`로 이동하여 접근성 및 명확성 향상.
- **이벤트 네이밍 표준화**: 브라우저 표준 관례를 따라 이벤트 값은 소문자 `snake_case`로, 변수명은 대문자 `UPPER_SNAKE_CASE`로 관리하도록 규칙 정립 및 `docs/project_context.md` 반영.
- **Lint 경고 해결**: n8n JavaScript 코드 내 사용하지 않는 변수 정리 등 전반적인 코드 품질 개선.

### 💬 주요 Q&A 및 의사결정

**Q. 오디오 재생 동기화는 어떻게 구현했나?**

- **A.** 각 오디오 버튼이 재생을 시작할 때 `AUDIO_PLAYBACK_START` 이벤트를 발생시키고, 다른 버튼들은 이 이벤트를 감지하여 자신의 재생을 중지하도록 설계함. 이를 통해 여러 음성이 겹쳐 들리는 현상을 방지함.

**Q. 왜 상수(Constants) 폴더를 루트 레벨로 이동했나?**

- **A.** 프로젝트 전반에서 참조되는 설정값들이 `lib` 하위에 숨겨져 있는 것보다 최상위에서 명시적으로 관리되는 것이 유지보수와 협업 측면에서 더 유리하다고 판단함.

**Q. 이벤트 값에 소문자를 사용하는 이유는?**

- **A.** `click`, `play` 등 브라우저의 기본 DOM 이벤트 네이밍 관례와 일관성을 유지하여 개발자 경험(DX)을 높이기 위함임.

## 2026-01-08: n8n 워크플로우 최적화 및 콘텐츠 품질 고도화 (n8n Workflow Optimization & Quality Improvements)

### ✅ 진행 사항

- **중복 체크 로직 최적화**: `Check Duplicate` 노드에 `Limit: 1` 및 `Always Output Data: On` 설정을 적용하여 성능을 높이고 데이터 부재 시에도 워크플로우가 중단되지 않도록 개선.
- **콘텐츠 생성 규칙 강화**:
  - **대화문 구조 표준화**: 모든 대화문이 2~3턴(A-B 또는 A-B-A)의 간결하고 자연스러운 구성을 갖추도록 프롬프트 수정.
  - **수치 및 통화 표기 통일**: 통화 기호는 항상 `$`(USD)를 사용하고, 1,000 이상의 숫자에는 쉼표(,)를 사용하도록 강제하여 데이터 일관성 확보.
- **운영 안정성 확보**: `Groq Orpheus TTS` 모델 사용 전 약관 동의(Terms of Use)가 필요함을 문서화하고, 미동의 시 발생하는 400 에러 해결 가이드 추가.
- **추후 과제 발굴**: '원어민 대화' 재생 시 볼륨 크기 제어 로직 구현을 `future_todos.md`에 추가.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `Always Output Data` 옵션을 켰나?**

- **A.** Supabase 노드에서 필터링 결과가 없을 경우 기본적으로 에러를 내거나 출력을 하지 않아 다음 노드(`If New`)가 실행되지 않는 문제가 있음. 이 옵션을 켜면 데이터가 없더라도 빈 객체를 반환하므로 워크플로우의 흐름을 안정적으로 제어할 수 있음.

**Q. 대화 턴수를 2~3턴으로 제한한 이유는?**

- **A.** 학습용 콘텐츠로서 너무 긴 대화는 사용자 집중도를 떨어뜨릴 수 있고, TTS 생성 비용 및 시간도 증가함. 핵심 표현을 명확한 맥락에서 보여주기에 가장 효율적인 2~3턴으로 표준화함.

**Q. 왜 달러($) 기호를 강제하나?**

- **A.** 글로벌 영어 학습 서비스로서 통화 단위가 섞여 있으면(원, 엔, 달러 등) 데이터의 통일성이 떨어짐. 가장 보편적인 달러를 기본으로 사용하되, 특정 국가의 문화를 다루는 예외적인 경우에만 다른 통화를 허용함.

## 2026-01-07: n8n 워크플로우 모듈화 및 확장성 강화 (n8n Workflow Modularization & Scalability)

### ✅ 진행 사항

- **문서 구조 재편 (Documentation Reorganization)**:
  - `docs/` 폴더 내의 문서들을 주제별 하위 폴더(`n8n/`, `monetization/`, `git/`, `database/`, `product/`)로 분류하여 관리 효율성 증대.
  - `docs/n8n/` 하위에 `expressions/` 폴더를 신설하여 워크플로우별 문서 격리 및 확장성 확보.
- **코드 노드 개별 파일화**: n8n 워크플로우 내의 복잡한 JavaScript 로직과 AI 프롬프트를 `n8n/expressions/code/` 폴더 내의 개별 파일(`*.js`, `*.txt`)로 분리하여 관리 효율성 증대.
- **워크플로우 구조 정교화**: 템플릿 파일명을 `expressions_workflow_template.json`으로 변경하고 전용 폴더로 이동하여 향후 `vocas` 등 다른 도메인 확장을 위한 구조적 기반 마련.
- **보안성 향상**: 워크플로우 템플릿 내의 특정 Credential ID를 플레이스홀더로 교체하여 공유 및 커밋 시 보안 위험 제거.
- **백업 체계 개선**: 로컬 백업 파일명을 `speak_mango_n8n_expressions_workflow.json`으로 변경하여 명확성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 문서 폴더 구조를 재편했나?**

- **A.** 프로젝트 문서가 많아짐에 따라 `docs/` 루트에 모든 파일이 나열되어 있어 가독성이 떨어짐. `n8n`, `database`, `product` 등 주제별로 폴더를 나누고, 특히 `n8n`은 워크플로우 종류(`expressions`, `vocas` 등)에 따라 하위 폴더를 두어 확장성을 고려함.

**Q. 왜 코드 노드를 별도 파일로 분리했나?**

- **A.** n8n GUI 내에서 직접 코드를 수정하는 것은 버전 관리와 가독성 측면에서 한계가 있음. 로컬 파일로 분리함으로써 에디터의 기능을 활용하고, 문서와 실제 구현 코드 간의 정합성을 더 쉽게 유지하기 위함임.

**Q. 폴더 구조를 `n8n/expressions/`로 세분화한 이유는?**

- **A.** 현재는 '표현(Expressions)' 생성 워크플로우만 존재하지만, 향후 '단어장(Vocas)', '이미지 생성' 등 성격이 다른 자동화 로직이 추가될 때 서로 섞이지 않고 독립적으로 관리하기 위함임.

## 2026-01-07: TTS 파이프라인 통합 및 문서화 (TTS Integration & Documentation)

### ✅ 진행 사항

- **TTS 파이프라인 구축**: n8n 워크플로우에 `Groq Orpheus TTS`를 연동하여 영어 대화문 생성 시 원어민 음성(WAV)을 자동 합성하고 Supabase Storage에 저장하는 로직 구현.
- **Storage 구조 최적화**:
  - 버킷명을 `speak-mango-en`으로 설정하여 프로젝트 단위 통합 저장소로 격상.
  - 하위 폴더 구조를 `expressions/{id}/{index}.wav`로 정규화하여 확장성 확보.
- **문서 현행화**:
  - `docs/n8n/expressions/optimization_steps.md`, `docs/n8n/expressions/user_guide.md`, `docs/n8n/expressions/workflow_guide.md`에 TTS 관련 상세 설정 및 트러블슈팅 가이드 추가.
  - `docs/database/supabase_strategy.md`에 Storage 폴더 격리 전략 및 향후 유료화(Feature Gating) 시 보안 전환 가이드 수립.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Storage 버킷 이름을 `speak-mango-en`으로 설정했나?**

- **A.** `expression-audio`는 오디오 전용이라는 느낌이 강했음. 향후 이미지(`images/`), 사용자 프로필(`users/`) 등 다양한 자산을 하나의 버킷에서 효율적으로 관리하기 위해 프로젝트명과 동일한 버킷을 생성하고 하위 폴더로 격리하는 전략(`Folder-based Isolation`)을 채택함.

**Q. TTS 음성 파일은 왜 Public 버킷에 저장하나?**

- **A.** 초기 개발 단계에서의 접근 편의성과 CDN 캐싱 효율을 위해 Public으로 설정함. 단, `docs/product/future_todos.md`에 기록한 대로 추후 유료 사용자 전용 기능(Feature Gating) 도입 시 Private 전환 및 RLS 설정을 적용할 예정임.

## 2026-01-06: 라우트 중앙 관리 및 필터 누적 시스템 (Centralized Routing & Additive Filtering)

### ✅ 진행 사항

- **중앙 관리형 라우트 시스템 도입**: `lib/routes.ts`를 생성하여 앱 내 모든 경로와 필터 조합 로직을 단일 지점에서 관리하도록 구조화. 하드코딩된 문자열을 제거하여 유지보수성 향상.
- **필터 누적(Additive Filtering) 구현**: `ExpressionCard` 내 카테고리/태그 클릭 시 기존 필터를 초기화하는 대신 현재 상태를 유지하며 새로운 필터를 더하는 방식으로 UX 고도화.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 필터 누적 방식을 택했나?**

- **A.** 사용자가 특정 카테고리 내에서 특정 태그가 붙은 항목만 골라보는 등 정교한 탐색을 원할 때, 필터가 초기화되면 다시 설정해야 하는 번거로움이 있음. 현대적인 서비스의 필터링 관례에 맞춰 사용자 경험을 상향 평준화함.

## 2026-01-06: 카테고리 필터링 최적화 (Toggle & Duplicate Prevention)

### ✅ 진행 사항

- **카테고리 토글(Toggle) 기능 구현**: 이미 선택된 카테고리를 다시 클릭할 경우 필터가 해제되어 '전체' 목록으로 돌아가도록 UX 개선.
- **중복 페칭 방지**: '전체' 카테고리가 선택된 상태에서 '전체'를 다시 누를 경우 아무 동작도 하지 않도록 차단하여 불필요한 네트워크 요청 제거.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 '전체' 클릭 시에는 아무 동작도 안 하게 했나?**

- **A.** 이미 모든 데이터를 보여주는 상태에서 다시 '전체'를 누르는 것은 의미 없는 중복 데이터 페칭만 유발함. 성능 최적화와 사용자 실수 방지를 위해 해당 동작을 무시하도록 처리함.

**Q. 토글 방식의 장점은?**

- **A.** 사용자가 필터를 해제하기 위해 매번 '전체' 버튼을 찾아서 누를 필요 없이, 보던 카테고리를 한 번 더 누르는 것만으로 초기 상태로 돌아갈 수 있어 탐색 속도가 향상됨.

## 2026-01-06: 네비게이션 상태 보존 고도화 (Multi-cache & Robust Scroll Restoration)

### ✅ 진행 사항

- **Multi-cache 시스템 구축**: 필터 조합(URL)별로 리스트 데이터와 스크롤 위치를 독립적으로 저장하는 `ExpressionContext` 고도화. 검색 결과, 카테고리별 목록 등 각기 다른 탐색 맥락을 완벽히 격리 보존.
- **실시간 스크롤 추적**: 디바운스가 적용된 실시간 리스너를 통해 페이지 이동 클릭 시점뿐만 아니라 브라우저 뒤로가기 등 모든 상황에서의 위치 저장을 자동화.
- **재귀적 RAF 복원 로직**: `requestAnimationFrame`을 사용하여 레이아웃이 확정될 때까지 최대 1초간 추적하며 정확한 위치로 스크롤을 이동시키는 강력한 복원 엔진 구현.
- **컴포넌트 생명주기 최적화**: 필터 변경 시 컴포넌트의 `key` prop을 교체하여 완전한 초기화 및 캐시 복원 프로세스 강제.
- **BackButton 컴포넌트**: 브라우저 히스토리 기반의 뒤로가기 기능 및 직접 진입 시를 위한 홈 이동 안전장치 구현.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `ResizeObserver` 대신 재귀적 `RAF` 방식을 택했나?**

- **A.** `ResizeObserver`는 요소의 크기 변화만 감지하지만, `Framer Motion` 애니메이션이나 폰트 로딩 등으로 인한 미세한 레이아웃 시프트는 브라우저의 페인팅 주기와 밀접하게 연관됨. 재귀적 `RAF`는 브라우저가 화면을 그리는 시점에 맞춰 여러 번 보정하므로 시각적 완성도와 복원 정확도가 훨씬 높음.

**Q. 왜 실시간으로 스크롤 위치를 저장하나?**

- **A.** 상세 페이지로 넘어가는 클릭 시점(`onClick`)에만 저장하면, 브라우저 자체의 뒤로가기 버튼을 눌러 나가는 상황이나 의도치 않은 언마운트 시 대응이 불가능함. 사용자 경험의 연속성을 위해 실시간 저장 방식을 채택함.

## 2026-01-06: 네비게이션 상태 보존 (Scroll Restoration & State Persistence)

### ✅ 진행 사항

- **전역 상태 관리 도입**: `ExpressionContext`를 생성하여 페이지 이동 간에도 리스트 데이터, 페이지 번호, 필터 상태를 유지하도록 구현.
- **스크롤 복원 구현**: 상세 페이지에서 뒤로가기 시, 이전 리스트의 스크롤 위치를 정확히 복원하는 로직(`useLayoutEffect`) 추가.
- **BackButton 컴포넌트**: `router.back()`을 사용하여 브라우저 히스토리를 활용하는 뒤로가기 버튼 구현 (안전장치 포함).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `Context API`를 사용했나?**

- **A.** Next.js App Router에서 페이지 이동 시 클라이언트 컴포넌트의 상태는 초기화됨. '더 보기'로 불러온 데이터가 사라지는 문제를 해결하기 위해, 상태를 최상위(`layout.tsx`)로 끌어올려 전역에서 관리해야 했음.

**Q. `BackButton`에서 `router.push('/')`는 왜 필요한가?**

- **A.** SNS 공유 등으로 상세 페이지에 바로 진입(Deep Link)했을 때는 브라우저 히스토리가 없음. 이때 `router.back()`은 작동하지 않으므로, 사용자가 갇히지 않고 메인으로 이동할 수 있도록 Fallback을 제공함.

## 2026-01-05: 리스트 애니메이션 최적화 및 UI/UX 폴리싱

### ✅ 진행 사항

- **리스트 레이아웃 안정화**: `AnimatedList` 컴포넌트에서 `layout` 속성을 제거하여 '더 보기' 버튼 클릭으로 새로운 아이템이 추가될 때 기존 아이템들이 의도치 않게 움직이거나 깜빡이는 현상 해결.
- **카드 진입 애니메이션 개선**: `ExpressionCard`의 등장 효과를 Slide-up(`y: 20`) 방식에서 Scale-up(`scale: 0.96 -> 1.0`) 방식으로 변경. 보다 세련되고 몰입감 있는 시각적 경험 제공.
- **트랜지션 성능 최적화**: 카드 애니메이션 지속 시간을 0.5초에서 0.4초로 단축하고 베지어 곡선(Ease)을 조정하여 더욱 경쾌한 반응성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `layout` 속성을 제거했나?**

- **A.** Framer Motion의 `layout` 속성은 요소의 크기나 위치가 바뀔 때 자동으로 애니메이션을 적용해주지만, 무한 스크롤이나 '더 보기'처럼 리스트가 아래로 계속 늘어나는 구조에서는 때때로 이전 아이템들이 불필요하게 재계산되어 덜컥거리는 느낌(Jitter)을 줄 수 있음. 성능과 시각적 안정성을 위해 이를 제거함.

**Q. 등장 애니메이션을 Scale로 바꾼 이유는?**

- **A.** Slide-up 방식은 아래에서 위로 올라오는 느낌이 강해 시선이 분산될 수 있음. 반면 Scale-up은 제자리에서 피어오르는 듯한 느낌을 주어 사용자가 새롭게 로드된 콘텐츠에 더 자연스럽게 집중할 수 있도록 도움.

## 2026-01-05: 리스트 탐색 경험 개선 ('더 보기' 구현 및 스크롤 리셋)

### ✅ 진행 사항

- **스크롤 자동 리셋**: 상세 페이지 진입 시 스크롤이 유지되는 문제를 해결하기 위해 Next.js 표준 방식인 `template.tsx` 도입.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 스크롤 리셋을 위해 `useEffect` 대신 `template.tsx`를 썼나?**

- **A.** `layout.tsx`는 페이지 이동 시 상태를 유지하지만, `template.tsx`는 매번 새롭게 마운트됨. 프레임워크 수준에서 페이지 전환 시 초기화 로직(스크롤 리셋 등)을 처리하기 위한 가장 깨끗하고 공식적인 방법임.

## 2026-01-05: 리스트 탐색 경험 개선 ('더 보기' 버튼 구현)

### ✅ 진행 사항

- **페이지네이션 도입**: `lib/expressions.ts`의 `getExpressions` 함수를 수정하여 `page`, `limit` 파라미터 기반의 범위 조회(`range`) 로직 구현.
- **서버 액션(Server Action) 생성**: 클라이언트 컴포넌트에서 안전하게 다음 페이지 데이터를 요청할 수 있도록 `lib/actions.ts`에 `fetchMoreExpressions` 액션 추가.
- **ExpressionList 컴포넌트 구현**: 초기 데이터와 추가 데이터를 통합 관리하고 '더 보기' 인터랙션을 처리하는 전용 클라이언트 컴포넌트 구축.
- **컴포넌트 모듈화**: '더 보기' 버튼을 독립 컴포넌트(`LoadMoreButton.tsx`)로 분리하고, 리스트 관리 로직을 `ExpressionList.tsx`로 캡슐화.
- **UI/UX 최적화**:
  - 추가 로딩 시 `SkeletonCard`를 사용하여 레이아웃 흔들림 방지.
  - 다크모드에서의 버튼 시인성 개선 및 모바일 터치 호버 방지(`useEnableHover`).
  - 버튼 호버 애니메이션 추가 및 데이터 소진 시 버튼 자동 숨김 처리.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 무한 스크롤(Infinite Scroll) 대신 '더 보기' 버튼을 선택했나?**

- **A.** 무한 스크롤은 사용자가 푸터(Footer)에 접근하는 것을 방해하고, 원치 않는 데이터 로딩으로 인해 피로감을 줄 수 있음. 사용자가 명시적으로 '더 보기'를 누르게 함으로써 탐색의 주도권을 제공하고 성능을 최적화함.

**Q. 왜 `actions.ts`를 별도로 분리했나?**

- **A.** Next.js App Router 규칙에 따라 서버 액션은 `"use server"` 지시어가 포함된 별도 파일에 관리하는 것이 클라이언트 컴포넌트와의 충돌을 방지하고 코드 구조를 명확히 하는 데 유리함.

**Q. '더 보기' 버튼을 왜 독립 컴포넌트로 만들었나?**

- **A.** 버튼의 스타일(다크모드 대응, 호버 애니메이션 등)이 복잡해짐에 따라 리스트 로직과 UI 관심사를 분리하여 유지보수성을 높이고, 향후 다른 리스트에서도 재사용하기 위함임.

## 2026-01-05: 스켈레톤 로딩 (Skeleton Loading) 구현 및 UX 최적화

### ✅ 진행 사항

- **스켈레톤 시스템 구축**: 데이터 페칭 중 레이아웃 흔들림(CLS)을 방지하고 체감 속도를 높이기 위해 `Skeleton` 컴포넌트 시리즈 구현.
- **맞춤형 스켈레톤 설계**:
  - `SkeletonNavbar`: 메인(로고+서브헤더)과 상세(뒤로가기) 페이지의 헤더 구조에 맞춘 변주 지원.
  - `SkeletonHomeHero`: 홈 페이지 상단 타이틀과 설명 영역 공간 확보.
  - `SkeletonDetail`: 상세 페이지의 메인 카드, 대화 블록, 퀴즈 카드 구조를 정교하게 모사.
- **전역 로딩 적용**: `app/loading.tsx`와 `app/expressions/[id]/loading.tsx`를 생성하여 Next.js App Router의 내장 스트리밍 로딩 기능 활용.
- **전략 문서화**: `docs/project_context.md`에 새로운 데이터 의존 컴포넌트 생성 시 스켈레톤 구현을 의무화하는 규칙 추가.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Client Component 내부에 로딩 상태를 두지 않고 `loading.tsx`를 썼나?**

- **A.** 서버 컴포넌트에서 데이터를 가져오는 동안 페이지 전체의 레이아웃 일관성을 유지하고, Next.js의 스트리밍 기능을 최대한 활용하여 첫 바이트 도달 시간(TTFB)을 최적화하기 위함임.

**Q. 스켈레톤 디자인 시 가장 고려한 점은?**

- **A.** 실제 콘텐츠가 로드되었을 때 요소의 위치가 바뀌지 않도록(Zero CLS), 실제 컴포넌트와 동일한 패딩, 여백, 최소 높이 값을 적용하는 데 집중함.

## 2026-01-05: Scroll To Top 기능 구현 및 모바일 최적화

### ✅ 진행 사항

- **ScrollToTop 컴포넌트 생성**: 스크롤이 일정 깊이(300px) 이상 내려가면 우측 하단에 나타나는 상단 이동 버튼 구현.
- **애니메이션 및 반응형**: `framer-motion`을 사용하여 부드러운 등장/퇴장 효과를 적용하고, 모바일과 데스크탑 환경에 맞춰 버튼 크기와 위치를 최적화함.
- **전역 적용**: `app/layout.tsx`에 배치하여 모든 페이지에서 일관되게 동작하도록 설정.
- **코드 리팩토링**: `useScroll` 훅을 재사용하여 스크롤 감지 로직을 간소화하고, `useEnableHover`를 통해 모바일 터치 호버 문제를 방지함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `layout.tsx`에 배치했나?**

- **A.** 스크롤이 길어지는 상황은 메인 리스트뿐만 아니라 상세 페이지 등 서비스 전반에서 발생할 수 있으므로, 페이지마다 중복 코드를 작성하는 대신 레이아웃 레벨에서 전역으로 관리하는 것이 효율적임.

## 2026-01-05: 모바일 UX 최적화 및 기술 구현 문서화 및 n8n 태그 생성 로직 고도화

### ✅ 진행 사항

- **태그 생성 규칙 명문화**: `docs/n8n/expressions/optimization_steps.md` 및 `n8n/n8n_workflow_template.json`에 태그 생성 필수 요건(Requirement 11)을 추가. AI가 3~5개의 소문자 키워드를 포함하도록 명시하여 데이터 품질 및 필터링 효율성을 높임.
- **모바일 호버 이슈 해결**: 모바일에서 스크롤 시 카드의 호버 효과(크기 변경, 테두리 색상)가 유지되거나 깜빡이는 문제를 해결하기 위해 `useIsMobile` 훅을 활용.
- **조건부 렌더링**: 모바일 환경(`isMobile === true`)에서는 `whileHover`, `whileTap` 애니메이션과 CSS `hover:` 클래스가 적용되지 않도록 `ExpressionCard` 컴포넌트 로직 수정.
- **안정성 확보**: 초기 렌더링 시(`undefined`) 데스크탑을 기본값으로 간주하여 하이드레이션 불일치 방지 및 점진적 적용.
- **필터 UX 개선**: `FilterBar`에서 카테고리 선택 시, 선택된 칩이 자동으로 화면 중앙으로 스크롤되도록 로직 구현(`data-category` 속성 활용).
- **기술 문서 작성**: 프로젝트의 핵심 기술 구현 상세(i18n, 데이터 아키텍처, UI 자동화 등)를 정리한 `docs/technical_implementation.md` 생성.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 모바일에서 호버를 껐나?**

- **A.** 터치 디바이스에서는 손가락이 닿는 순간을 `hover`로 인식하는 경우가 많아, 스크롤 중에 카드가 눌리거나 색이 변하는 등 의도치 않은 시각적 피드백이 발생함. 깔끔한 스크롤 경험을 위해 모바일에서는 호버 효과를 제거함.

**Q. 기술 문서를 왜 따로 만들었나?**

- **A.** 모바일 감지, 무한 스크롤 가속, 필터 자동 스크롤 등 UI/UX와 관련된 복잡한 기술 로직이 늘어남에 따라, 이를 코드 주석으로만 남기기보다 별도의 문서로 정리하여 유지보수성과 이해도를 높이기 위함임.

## 2026-01-05: 관련 표현 추천 드래그 가속 기능 구현 및 안정화

### ✅ 진행 사항

- **데스크탑 스크롤 인터랙션 고도화**: 상세 페이지 하단의 '관련 표현 추천' 섹션에서, 좌우 페이드 영역에 마우스를 올리면 해당 방향으로 스크롤이 빠르게 가속되는 기능을 추가함.
- **양방향 무한 루프 구현**: 기존의 단방향(오른쪽) 무한 루프를 보완하여, 가속 기능을 통해 왼쪽 끝에 도달했을 때도 끊김 없이 오른쪽 끝으로 연결되도록 로직을 개선함.
- **시각적 피드백 강화**: 페이드 영역 호버 시 전용 커서(`w-resize`, `e-resize`)를 제공하고 히트 영역을 `w-24`로 확장하여 사용성을 높임.
- **버그 수정 (Stacking Context & Events)**:
  - 페이드 영역이 카드 콘텐츠보다 아래(`z-index`)에 있어 호버 이벤트가 발생하지 않던 문제를 `z-index: 20` 상향 및 DOM 순서 변경으로 해결.
  - `fade-mask-base`의 `pointer-events-none` 속성으로 인해 이벤트가 차단되던 문제를, 페이드가 보일 때(`opacity-100`) `pointer-events-auto`를 명시적으로 추가하여 해결.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 페이드 영역에 가속 기능을 추가했나?**

- **A.** 자동 스크롤(Marquee)은 시선을 끄는 데 효과적이지만, 사용자가 특정 표현을 빨리 찾고 싶을 때 답답함을 느낄 수 있음. 페이드 영역을 "가속 버튼"처럼 활용하게 함으로써, 별도의 버튼 UI 없이도 직관적으로 스크롤 속도를 제어할 수 있는 UX를 제공함.

## 2026-01-04: 사용자 가이드 작성 및 퀴즈 UI 개선

### ✅ 진행 사항

- **사용자 가이드 작성**: 서비스 개요부터 n8n 워크플로우 설정 방법까지 상세히 안내하는 `docs/n8n/expressions/user_guide.md` 생성. 운영자가 워크플로우를 직접 설정하고 운영하는 데 필요한 모든 단계(Credentials, Node Logic, Troubleshooting)를 문서화함.
- **퀴즈 UI 가독성 개선**: 상세 페이지의 퀴즈 질문(`question`) 영역에 `whitespace-pre-wrap` 속성을 추가하여, n8n에서 생성된 줄바꿈(`\n`)이 UI에 그대로 반영되도록 수정. 이를 통해 질문과 선택지가 섞여 보이던 문제를 해결함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 퀴즈 질문에 `whitespace-pre-wrap`을 적용했나?**

- **A.** Gemini가 생성하는 퀴즈 데이터는 질문과 선택지 사이, 혹은 긴 문장 사이의 가독성을 위해 개행 문자(`\n`)를 포함함. 기존 CSS에서는 이를 무시하고 한 줄로 붙여서 보여주었기에 가독성이 매우 떨어졌음. CSS 속성 하나로 데이터가 의도한 레이아웃대로 출력되도록 개선함.

## 2026-01-04: n8n 퀴즈 생성 로직 고도화 및 데이터 무결성 확보

### ✅ 진행 사항

- **Quiz Logic 재정립**: `docs/n8n/expressions/optimization_steps.md`의 Gemini 프롬프트를 전면 개편.
  - 기존의 모호하거나 잘못된 패턴(Target Language -> Target Language)을 제거하고, 3가지 명확한 패턴(Situation->EN, Expression->Situation, Negative Logic)으로 정립.
  - 모든 언어(KO, JA, ES)에 대해 3지 선다(A/B/C)와 정답 포맷(단일 알파벳)을 강제하는 **Strict Formatting Rules** 추가.
- **데이터 보정**: 기존 DB에 쌓인 잘못된 형식의 퀴즈 데이터(`How's it going?`, `down in the dumps` 등)와 논리적으로 부적절한 데이터(`Is there a fitting room?` 등)를 올바른 패턴으로 수정하는 SQL 스크립트 작성 (`database/009_fix_invalid_quizzes.sql`).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 기존 퀴즈 패턴(Pattern 3)을 삭제했나?**

- **A.** 기존 Pattern 3은 "한국어 상황"을 주고 "한국어 대사"를 고르는 방식이었는데, 이는 영어 학습 목적에 부합하지 않음. 대신 '부적절한 상황 고르기(Negative Logic)'를 Pattern 3으로 새로 정의하여 학습 효과를 높임.

**Q. SQL에서 Dollar Quoting(`$$`)을 사용한 이유는?**

- **A.** JSONB 데이터 내부에 싱글 쿼테이션(`'`)이 포함된 텍스트(예: `How's it going?`)를 업데이트할 때, 일반적인 이스케이핑 방식으로는 구문 오류가 발생하기 쉬움. `$$`를 사용하여 쿼리의 가독성을 높이고 이스케이프 문제를 원천 차단함.

## 2026-01-03: n8n 프롬프트 최적화 및 문서 워크플로우 개선

### ✅ 진행 사항

- **Gemini 프롬프트 고도화**: `Gemini Content Generator` 프롬프트를 수정하여 영어 표현의 대소문자(문장 vs 구절), 의미의 톤(반말 vs 존댓말), 문장 부호(물음표 등) 규칙을 명확히 정의함.
- **컨텍스트 복원 강화**: `.agent/workflows/restore_context.md`가 로드하는 파일 목록에 `features_list.md`, `database/schema.md`를 추가하여 에이전트의 이해도 향상.
- **문서 동기화**: `n8n_optimization_steps.md`와 `n8n/n8n_workflow_template.json`을 최신 프롬프트 변경 사항에 맞춰 업데이트.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 "No worries"는 대문자, "spill the tea"는 소문자로 시작하게 했나?**

- **A.** 독립된 문장이나 감탄사는 대문자로 시작하는 것이 자연스럽고, 문장 속에 삽입되는 관용구는 소문자로 시작해야 활용하기 좋기 때문임.

**Q. 의미(Meaning) 필드에서 존댓말을 허용한 이유는?**

- **A.** 기존에는 무조건 반말을 강제했으나, "Could I...?" 같이 정중한 영어 표현을 "해 줄래?"로 번역하면 뉘앙스가 어긋남. 따라서 영어 표현 자체가 정중할 경우 한국어 뜻풀이도 존댓말을 사용하도록 예외 규칙을 추가함.

## 2026-01-03: UI 스타일 중앙 관리 및 모바일 최적화

### ✅ 진행 사항

- **공통 유틸리티 클래스 도입**: `globals.css`에 반복되는 UI 패턴(배경, 테두리, 텍스트 색상 등)을 `bg-surface`, `bg-subtle`, `text-body` 등 전역 유틸리티 클래스로 정의하여 통합 관리.
- **모바일 감지 훅 구현**: `useMediaQuery`와 `useIsMobile` 훅을 추가하여 클라이언트 사이드에서 정확한 모바일 환경 감지 로직 구축.
- **하이드레이션 이슈 해결**: 모바일 감지 시 SSR과 CSR 간의 불일치로 발생하는 Hydration Mismatch 문제를 초기값 `undefined` 처리 및 동적 렌더링을 통해 해결.
- **컴포넌트 리팩토링**: `ExpressionCard`, `SearchBar`, `FilterBar`, `RelatedExpressions` 등 주요 컴포넌트가 전역 유틸리티와 모바일 훅을 사용하도록 전면 리팩토링.
- **문서 체계 강화**: 에이전트 워크플로우(`update_docs`)에 `feature_ideas.md`를 포함시키고, 구현 완료된 아이템의 관리 규칙을 명시함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Tailwind 클래스를 직접 쓰지 않고 유틸리티 클래스를 따로 정의했나?**

- **A.** `bg-white dark:bg-zinc-900` 같은 조합이 수십 개의 컴포넌트에서 반복되면, 나중에 테마 색상을 변경할 때 모든 파일을 수정해야 함. `bg-surface`와 같이 시맨틱한 이름을 사용하면 `globals.css` 한 곳만 수정해도 전체 앱의 디자인을 일관되게 바꿀 수 있음.

**Q. 왜 `isMobile`의 초기값을 `false`가 아닌 `undefined`로 두었나?**

- **A.** 서버 사이드에서는 화면 크기를 알 수 없으므로 `false`로 가정하면, 실제 모바일 기기에서 접속했을 때 서버는 데스크탑 뷰를 보내고 클라이언트는 모바일 뷰로 그려 하이드레이션 에러가 발생함. `undefined`를 반환하고 클라이언트에서 값이 확정된 후 그리게 함으로써 이를 방지함.

## 2026-01-03: 아키텍처 정비 및 Sticky UI 고도화

### ✅ 진행 사항

- **폴더 구조 재편**: `lib/hooks`와 `lib/i18n`을 루트 레벨(`hooks/`, `i18n/`)로 이동하여 아키텍처 명확성 확보.
- **공통 훅 도입**: `useScroll` 훅을 생성하여 헤더와 필터 바의 스크롤 감지 로직을 통합.
- **Sticky UI 개선**: 헤더와 필터 바가 스크롤 시 자연스럽게 연결되도록 디자인 및 로직(Border 토글, 배경색 전환) 개선.
- **전역 스타일 체계 구축**: `globals.css`에 Tailwind v4 테마 변수와 유틸리티를 정의하여 레이아웃 폭, 헤더 높이 등을 중앙 관리.
- **에이전트 워크플로우 모듈화**: 문서 현행화를 자동화하는 `update_docs` 워크플로우를 구축하고 커밋 프로세스에 통합.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 hooks와 i18n 폴더를 루트로 옮겼나?**

- **A.** 프로젝트 규모가 커짐에 따라 `lib` 폴더가 비대해지는 것을 방지하고, 전역적으로 사용되는 핵심 모듈들을 더 직관적으로 찾을 수 있도록 루트 레벨로 승격시킴.

**Q. Sticky UI에서 Border를 왜 동적으로 토글하나?**

- **A.** 평소에는 헤더 하단에 선이 있지만, 필터 바가 헤더 아래에 붙을 때는 헤더의 선이 사라지고 필터 바 하단에 선이 생겨야 두 요소가 하나의 완성된 "상단 바"처럼 보이기 때문임.

## 2026-01-03: 기능 명세 문서화 (Features List)

### ✅ 진행 사항

- **문서화**: 프로젝트의 현재 구현된 기능들을 일목요연하게 정리한 `docs/product/features_list.md` 생성.
- **범위**: 사용자 인터페이스(메인, 상세)부터 백엔드 인프라(Supabase, n8n)까지 전체 시스템 기능 명세 포함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 기능 목록 문서를 별도로 만들었나?**

- **A.** 개발 히스토리(`project_history.md`)는 시간 순서대로 기록되어 현재 시점의 완성된 기능 스펙을 한눈에 파악하기 어려움. 따라서 신규 개발자나 이해관계자가 현재 서비스의 기능을 빠르게 파악할 수 있도록 Living Document 형태의 기능 명세서를 작성함.

## 2026-01-02: 관련 표현 추천 UI 고도화 (Auto-Marquee)

### ✅ 진행 사항

- **자동 스크롤 구현**: `requestAnimationFrame`을 사용하여 끊김 없이 흐르는 무한 루프 스크롤(Infinite Loop) 구현.
- **인터랙션 강화**: 마우스 호버 시 스크롤 일시정지, 마우스 이탈 시 재개 기능 추가.
- **성능 최적화**: `useCallback` 및 `useEffect` 의존성 최적화로 불필요한 리렌더링 방지.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 자동 스크롤(Auto-Marquee)을 적용했나?**

- **A.** 정적인 리스트보다 움직이는 리스트가 사용자의 시선을 더 잘 끌며, "더 많은 콘텐츠가 있다"는 것을 암시적으로 전달하기 위함임. 또한, 마우스 호버 시 멈추게 하여 사용자가 읽는 데 불편함이 없도록 배려함.

## 2026-01-02: n8n 중복 생성 방지 로직 강화 (Pre-fetch Check)

### ✅ 진행 사항

- **로직 개선**: 기존의 사후 중복 체크(Check Duplicate) 방식이 Gemini의 반복 생성을 막지 못하는 문제를 해결하기 위해, 생성 전 기존 데이터를 조회하여 제외 목록으로 전달하는 **사전 예방(Pre-fetch)** 단계를 추가함.
- **문서 업데이트**: `docs/n8n/expressions/optimization_steps.md` 및 `docs/n8n/expressions/workflow_guide.md`에 'Get Existing Expressions' 단계 추가.

### 💬 주요 Q&A 및 의사결정

**Q. 사후 체크만으로 충분하지 않았나?**

- **A.** 사후 체크(`If New`)는 중복 시 저장을 막을 뿐, 워크플로우를 재실행하거나 다른 표현을 다시 생성하지 않음. 따라서 Gemini가 계속 같은 표현("Touch base" 등)만 생성하면 데이터가 쌓이지 않는 문제가 발생함. 이를 해결하기 위해 **생성 단계에서부터** 이미 있는 표현을 배제하도록 개선함.

## 2026-01-02: n8n 중복 체크 로직 개선 (ILIKE 도입)

### ✅ 진행 사항

- **중복 검사 강화**: n8n 워크플로우의 'Check Duplicate' 노드 설정을 변경.
  - 기존: `Equal` 연산자 (정확히 일치해야 함).
  - 변경: **`ILIKE` (Case-insensitive Like)** 연산자 + 와일드카드(`*`).
  - 예: "touch base" 생성 시, DB에 "Let's touch base"가 있어도 중복으로 감지하여 생성 스킵.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `Equal` 대신 `ILIKE`를 사용했나?**

- **A.** AI가 매번 동일한 표현을 생성하더라도, 문장 부호나 대소문자, 관사 유무 등이 미세하게 다를 수 있음. 단순 `Equal`로는 이를 걸러내지 못해 데이터베이스에 유사 중복 데이터가 쌓이는 문제가 발생할 수 있어, 보다 유연한 `ILIKE` 검색으로 개선함.

## 2026-01-02: 서비스 명칭 변경 및 다국어 확장 아키텍처 수립

### ✅ 진행 사항

- **브랜드 리뉴얼**: 서비스 명칭을 `Daily English`에서 **`Speak Mango`**로 공식 변경.
- **상수화 및 코드 반영**:
  - `lib/constants.ts`에 `SERVICE_NAME` 상수를 추가하고 모든 UI와 메타데이터에서 참조하도록 수정.
  - 서비스 패키지명(`package.json`) 및 로컬 디렉토리 참조 구조 업데이트.
- **다국어 DB 전략 정립**:
  - **콘텐츠 스키마 분리**: 언어별 독립 스키마(`speak_mango_en`, `speak_mango_ko` 등) 사용 결정.
  - **공유 스키마 도입**: 사용자 프로필 및 통합 단어장 관리를 위한 `speak_mango_shared` 스키마 설계.
  - **서비스 격리**: `auth.users`를 공유하되 스키마별 `profiles` 테이블의 존재 여부로 서비스 가입자를 구분하는 보안 전략 수립.
- **클라이언트 유틸리티 고도화**: 스키마 이름을 인자로 받아 동적으로 Supabase 클라이언트를 생성할 수 있도록 `createBrowserSupabase` 및 `createServerSupabase` 함수 개선.
- **DB 마이그레이션**: 기존 `daily_english` 스키마를 `speak_mango_en`으로 변경하는 마이그레이션 스크립트 작성 (`database/008_rename_schema_to_speak_mango.sql`).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 단일 테이블 대신 스키마 분리 방식을 선택했나?**

- **A.** 언어별로 콘텐츠 구조(컬럼 등)가 달라질 수 있는 유연성을 확보하고, 특정 서비스의 데이터 장애가 다른 서비스로 전파되는 것을 막기 위함임. 또한, 향후 특정 언어 서비스만 별도로 분리하거나 매각해야 할 경우 관리가 훨씬 용이함.

**Q. 서로 다른 서비스 간 사용자 로그인을 어떻게 구분하나?**

- **A.** Supabase의 `auth.users`는 공유하되, 각 서비스의 스키마 내에 `auth.users.id`를 외래키로 갖는 `profiles` 테이블을 둠으로써, 해당 테이블에 레코드가 있는 사용자만 가입자로 간주하는 논리적 격리 방식을 채택함.

## 2026-01-02: 관련 표현 추천 구현 및 콘텐츠 탐색 전략 수립

### ✅ 진행 사항

- **관련 표현 추천 구현**:
  - 상세 페이지(`app/expressions/[id]/page.tsx`) 하단에 현재 표현과 동일한 카테고리의 다른 표현들을 추천하는 섹션 추가.
  - `lib/expressions.ts`에 `getRelatedExpressions` 함수를 추가하여 데이터 로직 분리.
- **콘텐츠 탐색 전략 수립**:
  - 향후 데이터 증가에 대비하여 **'더 보기(Load More)'** 방식의 페이지네이션 도입 결정.
  - 탐색 편의성을 극대화하기 위해 **A-Z 인덱스** 및 **업로드 순 인덱스**를 포함한 아카이브 페이지 기획 추가.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 무한 스크롤 대신 '더 보기' 버튼을 선택했나?**

- **A.** 무한 스크롤은 푸터(Footer) 접근성을 저해하고 사용자에게 통제 불가능한 피로감을 줄 수 있음. '더 보기' 버튼은 푸터 접근성을 보장하면서도 사용자가 명시적으로 다음 데이터를 요청하게 함으로써 더 나은 탐색 경험을 제공함.

**Q. 인덱스 페이지의 역할은?**

- **A.** 카테고리/태그 필터링 외에, 사용자가 전체 콘텐츠의 양을 가늠하고 알파벳 순서나 시간 순서로 빠르게 원하는 표현을 '색인(Indexing)' 할 수 있도록 돕는 도서관 카탈로그 같은 역할을 수행함.

## 2026-01-02: Framer Motion 애니메이션 적용 및 데이터 표준화

### ✅ 진행 사항

- **애니메이션 고도화**:
  - `framer-motion` 라이브러리를 도입하여 리스트 및 카드에 생동감 있는 인터랙션 적용.
  - `AnimatedList` 컴포넌트를 통해 검색/필터링 시 카드가 부드럽게 재배치되는 Layout Animation 구현.
  - `ExpressionCard`에 Staggered 진입 효과(순차적 등장) 및 Hover/Tap 피드백 추가.
- **데이터 품질 개선**:
  - `database/007_fix_meaning_style.sql` 스크립트를 통해 `meaning` 컬럼의 문장 끝 마침표(`.`)를 일괄 제거.
  - 기존 데이터 중 존댓말(`~요`, `~세요`)로 작성된 항목들을 프로젝트 규칙에 맞게 반말 스타일로 교정.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `AnimatedList`라는 별도 컴포넌트를 만들었나?**

- **A.** `AnimatePresence`와 `layout` 속성을 효과적으로 관리하기 위함임. 메인 페이지의 코드를 깔끔하게 유지하면서, 추후 다른 리스트(예: 북마크 목록)에서도 동일한 애니메이션 경험을 재사용할 수 있도록 설계함.

**Q. 왜 의미(Meaning) 필드에서 마침표를 제거하고 반말로 통일했나?**

- **A.** `docs/n8n/expressions/optimization_steps.md`에서 정의한 '간결한 뜻풀이'와 '캐주얼한 톤' 원칙을 지키기 위함임. 특히 모바일 카드 UI에서는 텍스트의 간결함이 가독성에 큰 영향을 미치므로 마침표 같은 불필요한 문장 부호를 최소화함.

## 2026-01-01: CategoryLabel 호버 애니메이션 고도화

### ✅ 진행 사항

- **인터랙션 개선**: `CategoryLabel` 컴포넌트 자체에 `group` 클래스를 추가하여, 상세 페이지와 같이 부모에 `group`이 없는 환경에서도 카테고리 아이콘의 호버 애니메이션(`rotate-12`)이 작동하도록 개선.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 컴포넌트에 `group`을 추가했나?**

- **A.** 메인 페이지의 카드는 카드 전체 호버 시 아이콘이 반응하지만, 상세 페이지에서는 카테고리 라벨 자체에 마우스를 올렸을 때 반응해야 함. 컴포넌트가 스스로 호버 상태를 감지할 수 있게 함으로써 범용성을 높임.

## 2026-01-01: CategoryLabel 컴포넌트 추가 및 인터랙션 강화

### ✅ 진행 사항

- **CategoryLabel 컴포넌트 생성**: `components/CategoryLabel.tsx`를 생성하여 카테고리 표시 UI를 캡슐화하고 링크/버튼 동작을 통합 지원.
- **필터링 연동**:
  - `ExpressionCard`: 카테고리 클릭 시 해당 카테고리로 필터링된 메인 페이지로 이동(`/?category=...`)하도록 `handleCategoryClick` 구현.
  - `ExpressionDetailPage`: 상세 페이지 상단의 카테고리를 클릭 가능한 `Link`로 변경하여 필터링 기능 연결.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Tag와 비슷하게 Category도 별도 컴포넌트로 만들었나?**

- **A.** 카테고리 역시 태그처럼 클릭 시 필터링 기능을 제공해야 하며, 메인(버튼)과 상세(링크) 페이지에서 일관된 스타일을 유지해야 하므로 별도 컴포넌트로 분리하여 재사용성을 높임.

## 2026-01-01: 스타일 충돌 방지를 위한 유틸리티 도입

### ✅ 진행 사항

- **패키지 설치**: `tailwind-merge`와 `clsx`를 설치하여 Tailwind 클래스 병합 로직 강화.
- **유틸리티 추가**: `lib/utils.ts`에 `cn` 함수를 추가하여 조건부 클래스 및 스타일 충돌 해결 기능 제공.
- **컴포넌트 리팩토링**: `Tag.tsx`에서 단순 문자열 연결 대신 `cn` 함수를 사용하도록 수정하여, 외부에서 주입된 클래스가 기본 스타일을 올바르게 덮어쓰도록 개선.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `cn` 유틸리티를 도입했나?**

- **A.** 단순 문자열 연결(`${base} ${custom}`)은 CSS 정의 순서에 따라 스타일 적용 우선순위가 결정되므로, 의도한 대로 스타일 오버라이딩이 되지 않는 문제(Cascading Issue)가 발생할 수 있음. 이를 방지하고 유지보수성을 높이기 위해 도입함.

## 2026-01-01: Tag 컴포넌트 독립 분리 및 재사용성 확보

### ✅ 진행 사항

- **Tag 컴포넌트 생성**: `components/Tag.tsx`를 생성하여 태그 UI 및 인터랙션 로직을 캡슐화. `Link` 모드와 `button` 모드를 모두 지원.
- **적용 및 리팩토링**:
  - `ExpressionCard`: 기존 버튼 기반 태그를 `Tag` 컴포넌트로 교체.
  - `ExpressionDetailPage`: 기존 `Link` 기반 태그를 `Tag` 컴포넌트로 교체하여 스타일 일관성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Tag를 별도 컴포넌트로 분리했나?**

- **A.** 메인 페이지의 카드 내부(버튼 역할)와 상세 페이지(링크 역할)에서 태그의 스타일은 동일해야 하지만 동작이 다름. 이를 `Tag` 컴포넌트 내부에서 `href` 유무에 따라 분기 처리함으로써 코드 중복을 제거하고 유지보수성을 높임.

## 2026-01-01: 표현 상세 페이지 태그 검색 연동

### ✅ 진행 사항

- **태그 인터랙션 구현**: `app/expressions/[id]/page.tsx` 하단의 태그를 클릭 가능한 `Link`로 변경하여, 클릭 시 메인 페이지의 해당 태그 검색 결과로 이동하도록 구현.
- **UI 일관성 유지**: `ExpressionCard`와 동일한 스타일(호버 효과, 색상 등)을 적용하여 시각적 일관성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 상세 페이지에서 왜 `Link`를 사용했나?**

- **A.** 상세 페이지는 서버 컴포넌트이므로, `useRouter`를 사용하는 클라이언트 로직 대신 표준 `Link` 태그를 사용하는 것이 성능과 SEO 측면에서 유리하다고 판단함.

## 2026-01-01: 검색/필터 기능 완성 및 UI 고도화

### ✅ 진행 사항

- **검색 시스템 구축**: `SearchBar` 컴포넌트를 분리하고, 일반 검색과 태그 검색(`#tag`)을 자동 식별하여 처리하는 로직 구현.
- **필터링 기능 구현**: `FilterBar`를 통해 카테고리별 데이터 필터링 기능 제공. 도메인 필터는 데이터 확충 시점까지 임시 비활성화.
- **UI/UX 폴리싱**:
  - `ExpressionCard`에 생동감 있는 호버 애니메이션(Lift & Glow) 적용.
  - 필터 바에 스크롤 페이드 효과를 추가하여 스크롤 가능 여부를 직관적으로 표시.
  - 클릭 가능한 요소에 `cursor-pointer` 적용 및 시각적 피드백 강화.
- **코드 구조 개선**:
  - UI 설정(`ui-config.ts`), 상수(`constants.ts`), 유틸리티(`utils.ts`) 분리.
  - 컴포넌트(`FilterBar`, `ExpressionCard`)를 클라이언트 컴포넌트로 전환하여 인터랙션 처리.

### 💬 주요 Q&A 및 의사결정

**Q. `#` 검색어 처리는 어떻게 하나?**

- **A.** 사용자가 검색창에 `#idiom`과 같이 입력하면, 이를 검색어가 아닌 '태그 필터'로 인식하여 자동으로 태그 쿼리(`?tag=idiom`)로 변환하도록 구현함.

## 2026-01-01: UI 인터랙션 강화 및 컴포넌트 리팩토링

### ✅ 진행 사항

- **스크롤 UI 개선**: `FilterBar`에 양옆 페이드(Fade) 효과를 추가하여 스크롤 가능 여부를 직관적으로 보여주도록 개선하고, 스크롤바는 숨김 처리함.
- **인터랙션 강화**: `ExpressionCard` 내 태그(`#tag`) 클릭 시 해당 태그로 즉시 필터링되는 기능 구현.
- **UX 디테일 보완**: 모든 클릭 가능한 요소(카테고리 칩, 태그, 닫기 버튼 등)에 `cursor-pointer`를 적용하여 사용성을 높임.
- **리팩토링**:
  - `ExpressionCard`와 `FilterBar`를 `export default`로 전환하고 `use client`를 적용하여 클라이언트 컴포넌트로 변경.
  - 중복되는 UI 설정 로직을 `lib/ui-config.ts`의 `getExpressionUIConfig` 헬퍼 함수로 통합.

### 💬 주요 Q&A 및 의사결정

**Q. 스크롤바를 숨긴 이유는?**

- **A.** 모바일 및 데스크탑에서 깔끔한 UI를 유지하기 위함임. 대신 양옆에 그라데이션 페이드를 동적으로 표시(`useRef`로 스크롤 위치 감지)하여 스크롤 가능함을 힌트로 제공함.

## 2026-01-01: 검색 및 필터링 기능 구현, UI 고도화

### ✅ 진행 사항

- **검색 및 필터 구현**: 메인 페이지 상단에 `FilterBar` 컴포넌트를 추가하여 검색어 입력 및 카테고리(`category`)별 필터링 기능 구현.
- **UI/UX 개선**: `ExpressionCard`에 세련된 호버 애니메이션(Lift & Glow) 적용 및 다크 모드 시인성 강화.
- **상호작용 강화**: `ExpressionCard`를 클라이언트 컴포넌트로 전환하고, 카드 내 태그 클릭 시 즉시 해당 태그로 검색되도록 기능 추가.
- **필터 간소화**: 초기에는 `domain` 필터도 고려했으나, 현재 데이터가 `conversation` 위주이므로 사용자 혼동을 줄이기 위해 우선 `category` 필터에 집중하고 `domain` 필터는 비활성화함 (추후 데이터 확충 시 재활성화 예정).
- **컴포넌트 리팩토링**: `FilterBar` 및 `ExpressionCard`를 `export default` 방식으로 통일하고, UI 설정을 `lib/ui-config.ts`로 중앙화하여 유지보수성 향상.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `FilterBar`에서 Domain 필터를 제거했나?**

- **A.** 현재 DB에 `conversation` 도메인 데이터만 존재하므로, 굳이 탭을 보여주는 것이 불필요하다고 판단함. 카테고리(`business`, `travel` 등) 필터가 사용자에게 더 유용한 탐색 경험을 제공함.

**Q. `ExpressionCard`를 왜 클라이언트 컴포넌트로 바꿨나?**

- **A.** 카드 전체는 상세 페이지 링크(`Link`)로 감싸져 있는데, 내부의 태그 버튼 클릭 시 상세 페이지 이동을 막고(`stopPropagation`) 검색 필터만 적용해야 했음. 이러한 이벤트 처리를 위해 클라이언트 컴포넌트 전환이 필요했음.

## 2026-01-01: 콘텐츠 분류 체계 고도화 및 다국어 확장 대응

### ✅ 진행 사항

- **2단계 분류 체계 도입**: `domain`(대분류: conversation, test 등)과 `category`(소분류: business, travel 등) 컬럼을 추가하여 콘텐츠 확장성 확보.
- **n8n 워크플로우 최적화**: 'Pick Category' 노드를 구조화된 데이터(JSON) 기반으로 리팩토링하고, 쇼핑 카테고리 추가 및 콩글리시 등 특정 문화권 한정 주제 제거.
- **다국어 생성 강화**: Gemini 프롬프트를 고도화하여 한국어, 일본어, 스페인어 콘텐츠를 한 번의 호출로 생성하도록 개선.
- **AI 페르소나 및 톤 교정**: AI가 반말과 존댓말을 혼용하는 문제를 해결하기 위해, 프롬프트에 '반말 사용 금지' 및 '일관된 경어체(Desu-Masu) 사용' 제약 조건을 명시적으로 추가함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 콩글리시 카테고리를 제거했나?**

- **A.** 서비스가 다국어(일본어, 스페인어 등)로 확장됨에 따라 한국인에게만 유효한 '콩글리시 교정'은 글로벌 사용성 측면에서 부적합하다고 판단함. 대신 모든 언어권에서 공통적으로 유용한 '쇼핑', '여행' 등의 주제로 확장함.

**Q. Domain과 Category를 왜 나누었나?**

- **A.** 추후 '시험 영어(TOEIC 등)', '테마별 단어장' 등으로 서비스를 확장할 때 DB 구조의 대대적인 변경 없이도 유연하게 대응하기 위함임.

## 2025-12-31: 다국어(i18n) 인프라 구축 및 중앙 관리 체계 도입

### ✅ 진행 사항

- **DB 스키마 확장**: `meaning` 및 `content` 컬럼을 JSONB 기반 다국어 구조로 전환 (기존 데이터 `ko` 키로 마이그레이션 전략 수립).
- **동적 언어 감지**: Next.js Middleware를 사용하여 브라우저 언어 설정을 서버 컴포넌트에 전달하는 메커니즘 구현.
- **문자열 중앙 관리**: `lib/i18n/locales/`에 언어별 파일을 분리하고, 하드코딩된 모든 UI 텍스트를 딕셔너리 기반으로 리팩토링.
- **서버 헬퍼 도입**: 서버 컴포넌트 전용 `getI18n()` 유틸리티를 통해 중복 코드를 제거하고 타입 안정성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 i18n 라이브러리 대신 직접 구현했나?**

- **A.** 현재 프로젝트 규모에서 외부 라이브러리(next-intl 등)는 다소 무거울 수 있음. 미들웨어 + 커스텀 헬퍼 조합으로도 SEO 친화적인 서버 사이드 다국어 처리가 충분히 가능하며, 추후 필요 시 라이브러리로의 전환이 용이하도록 구조화함.

**Q. `dialogue` 내부의 `kr` 키를 왜 `translation`으로 바꿨나?**

- **A.** 일본어(`ja`), 스페인어(`es`) 등 다른 언어 콘텐츠가 추가될 때, 매번 키 이름을 바꿀 필요 없이 동일한 인터페이스(`translation`)를 사용하기 위함임.

## 2025-12-31: AI 프롬프트 고도화 및 페르소나 일관성 확보

### ✅ 진행 사항

- **프롬프트 튜닝**: Gemini Content Generator에 3가지 고품질 예시(`under the weather`, `swamped`, `hang in there`)를 포함하여 생성 품질 상향 평준화.
- **페르소나 교정**: "얘들아", "우리 친구들" 등 특정 대상을 지칭하는 말투를 제거하고, 2030 타겟의 일반적이고 친근한 톤으로 통일.
- **로직 보완**: Gemini의 마크다운 응답을 순수 JSON으로 변환하는 `Parse JSON` 노드 추가 및 Supabase Insert 에러 해결.
- **n8n 백업 체계**: 워크플로우 JSON 내보내기/가져오기 가이드 문서화 및 로컬 백업 파일 생성 (`n8n_data/n8n_workflow_daily_english.json`).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 "얘들아" 같은 표현을 금지했나?**

- **A.** 서비스 타겟이 전 연령층(특히 2030 사회인)으로 확장될 가능성을 고려할 때, 너무 학생 대상인 말투는 브랜드 신뢰도를 떨어뜨릴 수 있음. 따라서 보편적인 친근함을 유지하되 특정 집단을 지칭하지 않도록 제약 조건을 추가함.

**Q. JSON Parsing 에러가 발생한 이유는?**

- **A.** Gemini가 응답 시 `json ... ` 마크다운 태그를 포함하여 문자열로 반환했기 때문임. 이를 정규식으로 제거하고 `JSON.parse`하는 단계를 추가하여 DB Insert가 가능하도록 수정함.

## 2025-12-31: n8n 아키텍처 변경 (Scraping -> AI Generation)

### ✅ 진행 사항

- **n8n 데이터 지속성 확보**: `docker-compose.yml` 수정 (Bind Mount 적용) 및 `.gitignore` 설정 추가 (`n8n_data/`).
- **자동화 전략 대전환**: 기존 외부 블로그 스크래핑 방식에서 **AI 기반 자체 생성 방식**으로 변경.
- **문서 업데이트**:
  - `docs/n8n/expressions/optimization_steps.md`: AI 기반 생성 및 중복 방지 가이드로 전면 수정.
  - `docs/n8n/expressions/workflow_guide.md`: 변경된 아키텍처(Category Selection -> Generator) 반영.
  - `docs/project_context.md`: 시스템 아키텍처 다이어그램 업데이트.

### 💬 주요 Q&A 및 의사결정

**Q. n8n 설정이 자꾸 초기화되는데?**

- **A.** 기존 Docker Volume 방식 대신 프로젝트 내 `./n8n_data` 폴더를 직접 마운트하는 방식(Bind Mount)으로 변경하여, 컨테이너 재시작 시에도 계정 및 워크플로우 데이터가 유지되도록 수정함.

**Q. 왜 스크래핑을 포기하고 AI 생성 방식을 택했나?**

- **A.**
  1.  **안정성**: 외부 블로그의 HTML 구조 변경이나 접속 불가 이슈로부터 완전히 자유로워짐.
  2.  **비용 절감**: 불필요한 HTML 파싱 및 데이터 전송 비용 제거.
  3.  **제어 가능성**: 우리가 원하는 카테고리(비즈니스, 여행 등)를 직접 설정하여 콘텐츠의 방향성을 주도할 수 있음.

**Q. "Gemini Extractor"는 어떻게 변했나?**

- **A.** 기존에는 텍스트에서 표현을 "추출(Extract)"하는 역할이었으나, 이제는 주제를 받아 표현을 "생성(Generate)"하는 역할로 변경됨에 따라 명칭을 `Gemini Expression Generator`로 변경함.

## 2025-12-30: n8n 자동화 파이프라인 완성 및 DB 스키마 분리

### ✅ 진행 사항

- n8n 자동화 워크플로우(스크래핑 -> Gemini -> Supabase) 테스트 성공.
- **다중 프로젝트 전략 적용**: `public` 스키마 대신 `daily_english` 스키마 도입.
- **코드 리팩토링**: DB 스키마명을 `lib/constants.ts`에서 상수로 중앙 관리하고, Supabase 클라이언트(`lib/supabase/*`)가 이를 자동으로 참조하도록 수정.
- **권한 문제 해결**: n8n(Supabase API) 접근 시 발생한 `permission denied` 및 `Invalid schema` 오류를 해결하기 위해 RLS 비활성화 및 명시적 권한 부여 SQL 스크립트 작성 (`database/002_fix_permissions.sql`).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 스키마 이름을 상수로 관리하는가?**

- **A.** 코드 내 `daily_english`라는 문자열이 하드코딩되면 추후 변경 시 누락 위험이 큼. `lib/constants.ts`에 정의하고 이를 `createBrowserSupabase`, `createServerSupabase`에서 참조함으로써 유지보수성을 높이고 실수를 방지함.

**Q. n8n에서 "Invalid schema" 에러가 발생한 이유는?**

- **A.** Supabase의 `public` 스키마 외에 커스텀 스키마를 사용할 경우, Data API 설정에서 해당 스키마를 **Expose** 해주지 않으면 외부에서 접근할 수 없음. 또한, DB 레벨에서도 `GRANT USAGE` 권한이 필요함.

## 2025-12-30: n8n 자동화 환경 구축

### ✅ 진행 사항

- `docker-compose.yml`을 통한 로컬 n8n 실행 환경 설정.
- `n8n/n8n_workflow_template.json` 생성 (가져오기용 워크플로우 템플릿).
- Gemini API 프롬프트 최적화 및 Supabase 연동 로직 설계.
- `feat/n8n-automation-setup` 브랜치 생성 및 작업 시작.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Docker Compose를 사용하나?**

- **A.** 로컬 환경에서 n8n을 빠르고 일관되게 실행하기 위함이며, 추후 서버 배포 시에도 그대로 활용할 수 있기 때문임.

**Q. n8n 워크플로우 템플릿의 역할은?**

- **A.** 사용자가 n8n GUI에서 하나하나 노드를 만들지 않고, JSON 파일을 `Import from File` 하여 즉시 구조를 잡을 수 있도록 돕기 위함.

## 2025-12-30: 상세 페이지 구현 및 데이터 로직 개선

### ✅ 진행 사항

- 상세 페이지 (`app/expressions/[id]/page.tsx`) 구현.
- 데이터 페칭 로직(`lib/expressions.ts`)을 리팩토링하여 환경 변수 미설정 시에도 우아하게 Mock 데이터로 Fallback 하도록 개선.
- Mock 데이터 분리 (`lib/mock-data.ts`).
- 메인 리스트 카드와 상세 페이지 연동.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `lib/expressions.ts`에서 환경 변수 체크를 제거했나?**

- **A.** 데이터 페칭 로직이 환경 설정에 의존하는 것은 관심사 분리에 위배됨. 대신 `try-catch` 패턴을 사용하여 Supabase 클라이언트 생성이나 요청 실패 시 자연스럽게 Mock 데이터로 대체하는 방식이 더 유연하고 코드 오염이 적다고 판단.

**Q. Mock 데이터는 왜 분리했나?**

- **A.** 메인 페이지와 상세 페이지, 그리고 Fallback 로직 등 여러 곳에서 Mock 데이터를 참조해야 하므로 `lib/mock-data.ts`로 중앙화하여 관리 효율성을 높임.

## 2025-12-30: Supabase 연동 및 메인 UI 구현

### ✅ 진행 사항

- Supabase 클라이언트 설정 (`@supabase/ssr`) 및 환경 변수 템플릿(`.env.local.example`) 생성.
- `createBrowserSupabase`, `createServerSupabase` 유틸리티 함수 구현 (명확한 명명 규칙 적용).
- `Expression` 타입 정의 및 `ExpressionCard` UI 컴포넌트 구현.
- 메인 페이지(`app/page.tsx`) 데이터 페칭 및 ISR(1시간) 적용.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `createClient` 대신 `createBrowserSupabase`, `createServerSupabase`를 사용하나?**

- **A.** Next.js 환경에서 브라우저와 서버용 클라이언트의 역할(쿠키 접근 등)이 명확히 다르며, 한 파일에서 두 클라이언트를 동시에 다룰 때의 이름 충돌 및 혼동을 방지하기 위함.

**Q. 데이터가 없을 때의 처리는?**

- **A.** 개발 초기 단계에서 UI 확인을 위해 Mock 데이터를 Fallback으로 사용하도록 구현하였으며, 실제 DB 데이터가 있을 경우 이를 우선적으로 보여줌.

## 2025-12-30: 프로젝트 초기 설정 (Project Initialization)

### ✅ 진행 사항

- Next.js 16 + Tailwind CSS + TypeScript 프로젝트 생성 (`speak-mango-en`).
- `src` 디렉토리 없는 구조 채택.
- 문서화 구조 수립 (`docs/` 폴더 내 컨텍스트, 히스토리, 워크스루).
- 데이터베이스 스키마 설계 (Supabase) 및 n8n 워크플로우 가이드 작성.

### 💬 주요 Q&A 및 의사결정

**Q. Next.js + n8n 아키텍처는 적합한가?**

- **A.** 매우 적합함. n8n이 백엔드/데이터 파이프라인 역할을 담당하고, Next.js는 뷰어 역할에 집중하여 효율적임.

**Q. LLM 비용 문제 (OpenAI vs Gemini)?**

- **A.** **Google Gemini 2.5 Flash**를 사용하기로 결정.
- 이유: OpenAI는 유료(종량제)인 반면, Gemini는 강력한 무료 티어(일 1,500회 요청 무료)를 제공하여 초기 운영 비용을 0원으로 만들 수 있음.

**Q. 프로젝트 폴더 구조는?**

- **A.** 최신 Next.js 트렌드에 맞춰 `src` 폴더 없이 루트에 `app`을 두는 구조로 진행.
