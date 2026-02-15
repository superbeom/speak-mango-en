# Features List

> 현재 'Speak Mango' 서비스에 구현된 기능들을 정리한 문서입니다.

## 1. 영어 표현 (Expressions)

### 메인 리스트 (Home Feed)

- **카드 뷰**: 최신순으로 영어 표현을 카드 형태로 제공.
- **인터랙션**:
  - **Hover**: 카드에 마우스를 올리면 살짝 떠오르는 애니메이션(Lift) 및 그림자 효과.
  - **Tap**: 클릭 시 눌리는 듯한 피드백 애니메이션.
  - **Staggered Fade-in**: 페이지 로드 시 카드가 순차적으로 나타나는 등장 효과.
- **Sticky UI**:
  - **Header & FilterBar**: 스크롤 시 검색창과 필터 바가 상단에 고정되어 언제든 접근 가능.
  - **Smart Transition**: 스크롤 상태에 따라 테두리(Border)와 배경색이 자연스럽게 변하며 시각적 일관성 유지.
- **검색 & 필터**:
  - **정렬 옵션**: 최신순(Latest) 및 랜덤순(Random) 지원.
    - **Random Feed**: 사용자가 매번 새로운 발견을 할 수 있도록 무작위로 표현을 노출.
    - **Seed-based Caching**: 사용자가 매번 새로운 발견을 할 수 있도록 무작위로 표현을 노출하되, **시간 단위 시드(`getHourlySeed`)** 값을 활용하여 무작위성을 유지하면서도 "더 보기"나 "필터링" 중에는 데이터의 일관성을 보장하고 중복 노출을 방지.
  - **카테고리 필터**: `Daily`, `Business`, `Travel` 등 주제별 필터링.
    - **Toggle 지원**: 이미 선택된 카테고리 클릭 시 필터가 해제되어 '전체' 목록으로 복귀.
    - **중복 방지**: 현재 필터와 동일한 버튼 클릭 시 불필요한 데이터 페칭 차단.
  - **필터 누적(Additive Filtering)**: 카드 내 카테고리/태그 클릭 시 기존에 적용된 다른 필터들이 초기화되지 않고 중첩되어 적용됨 (예: 비즈니스 카테고리 내에서 특정 태그 검색).
  - **검색**: 표현(Expression) 텍스트 검색 및 `#태그` 검색 지원.
  - **URL 동기화**: 모든 필터 상태가 URL 쿼리 파라미터와 실시간 동기화되어 페이지 새로고침 후에도 유지됨.
  - **Auto Scroll**: 필터 선택 시 해당 카테고리 칩이 화면 중앙에 오도록 자동으로 스크롤되어 선택 상태를 명확히 인지시킴.
- **중앙 라우트 관리**: `lib/routes.ts`를 통한 일관된 경로 생성 및 관리.
- **Scroll To Top**:
  - 스크롤이 일정 깊이 이상 내려가면 우측 하단에 상단 이동 버튼 표시.
  - 클릭 시 부드러운 애니메이션과 함께 최상단으로 이동.
- **Load More (더 보기)**:
  - 초기 로드 시 12개의 아이템만 표시하여 로딩 속도 최적화.
  - 리스트 하단의 'Load More' 버튼을 클릭하여 추가 데이터를 점진적으로 페칭.
  - 서버 액션(Server Actions)을 활용한 효율적인 데이터 보충 로직.
- **Scroll Reset Strategy (상세 페이지 리셋)**:
  - 상세 페이지(`/expressions/[id]`) 진입 시, 브라우저가 이전 스크롤 위치를 복원하려는 성질을 제어하기 위해 `sessionStorage` 리셋 플래그 시스템 구축.
  - 새로운 진입 시에만 `template.tsx`가 이를 감지하여 최상단으로 스크롤함으로써, 로딩 스켈레톤부터 본문까지 시각적 끊김 없는 최상단 뷰를 보장합니다.
  - 뒤로가기 시에는 플래그가 없으므로 브라우저 고유의 부드러운 위치 복원을 허용합니다.
- **Navigation State Persistence (상태 보존)**:
  - **Multi-cache 시스템**: '더 보기'로 로드된 리스트 상태와 스크롤 위치를 필터 조합별(URL 키)로 전역 컨텍스트(`Context API`)에 독립적으로 저장.
  - **복원 보장 시나리오**: 추가 데이터 페칭 여부와 상관없이 아래 모든 상황에서 이전 상태(데이터+스크롤)를 완벽히 복원.
    1. **페이지 간 이동**: 리스트 보다가 상세 페이지 진입 후 뒤로가기 시.
    2. **표현 검색**: 검색 결과 탐색 중 상세 페이지 진입 후 뒤로가기 시.
    3. **카테고리 선택**: 특정 카테고리 필터링 상태에서 탐색 후 뒤로가기 시.
    4. **태그 검색**: 태그 클릭을 통한 필터링 상태에서 탐색 후 뒤로가기 시.
  - **정밀 복원 로직 (Performance First)**:
    - **재귀적 `requestAnimationFrame`**: 브라우저의 렌더링 주기에 맞춰 레이아웃이 완전히 잡힐 때까지 추적하여 1px의 오차 없는 위치 복원 제공.
    - **스마트 안전장치**: 무한 루프를 방지하기 위해 최대 60회(약 1초)의 시도 제한 알고리즘 적용.
    - **최적화된 감시**: `Passive Listener`와 `200ms Debounce`를 통해 스크롤 추적 시 CPU 점유율을 극소화하여 부드러운 브라우징 보장.

### 표현 상세 (Detail Page)

- **다국어 지원**: 한국어(KO), 일본어(JA), 스페인어(ES)로 의미와 예문 제공.
- **구성 요소**:
  - **Expression**: 핵심 영어 표현.
  - **Meaning**: 간결한 뜻풀이 (반말 톤).
  - **Tags**: 관련 태그 목록 (클릭 시 메인 검색으로 이동).
  - **Situation**: 해당 표현이 쓰이는 구체적인 상황 설명 (Emoji 활용).
  - **Dialogue**: 실전 회화 예문 (A/B 대화).
    - **Audio Playback**: 원어민 발음으로 생성된 대화 오디오 재생 기능 제공. DB의 상대 경로를 클라이언트에서 실시간으로 해석(Resolution)하여 재생하는 효율적인 아키텍처 적용.
    - **Sequential Playback (Play All)**: '전체 듣기' 버튼을 통해 A/B 대화를 끊김 없이 이어서 듣는 기능. 재생 중인 버블 하이라이트 지원.
    - **Feature Gating Infrastructure**: 재생 전 권한 체크를 위한 `onPlayAttempt` 콜백 시스템 도입. 향후 유료 티어(Pro) 전용 기능으로 전환할 수 있는 확장 가능한 구조 확보.
  - **Quiz**: 간단한 퀴즈로 학습 내용 확인.
  - **Share**: Web Share API를 활용한 네이티브 공유 기능.
    - **모바일**: Instagram, Twitter, KakaoTalk 등 설치된 앱으로 직접 공유
    - **데스크탑**: 클립보드 복사 + 토스트 알림 (폴백)
    - **Card Integration**: 표현 카드 우측 하단에 compact 공유 버튼 배치 (absolute 포지셔닝)
    - **Analytics**: 공유 클릭 및 완료 이벤트 추적 (`trackShareClick`, `trackShareComplete`)
- **관련 표현 추천**:
  - 하단에 동일 카테고리의 다른 표현들을 추천.
  - **Adaptive Layout**: 모바일에서는 세로 리스트, 데스크탑에서는 Marquee 스크롤로 자동 전환 (마우스를 올리지 않아도 천천히 흐르는 무한 루프 애니메이션).
  - **Pause on Hover**: 마우스를 올리면 스크롤이 멈춰 내용을 자세히 볼 수 있음.
  - **Accelerated Drag**: 데스크탑에서 좌우 페이드(Fade) 영역에 마우스를 올리면 해당 방향으로 스크롤이 빠르게 가속되는 스마트 드래그 기능 제공.
- **학습 모드 (Learning Mode)**:
  - **Blind Listening Mode**: 대화문의 영어 텍스트를 숨기고(Blur) 소리에 집중하는 모드. (Default: ON)
    - **Partial Reveal**: 블라인드 모드 중에도 궁금한 영어 문장을 클릭하면 해당 문장만 블러가 해제되며, 나머지 문장은 여전히 가려진 상태를 유지.
    - **Auto-Exposed**: 모든 영어 문장을 확인하면 자동으로 블라인드 모드가 해제되고 'Exposed Mode'로 전환.
  - **Translation Blur**: 대화문의 해석을 기본적으로 숨기고, 클릭 시에만 해당 문장의 해석을 노출. (Default: Blur)
  - **State Preservation**: 블라인드 모드 진입/해제 시 이전의 해석 노출 상태(전체 보기 등)를 기억하고 복원.
  - **LearningToggle 유틸리티**: 학습 모드를 직관적으로 제어할 수 있는 공통 토글 UI 제공.

### 랜덤 퀴즈 (Random Quiz)

- **개요**: 전체 표현 중 무작위 10개를 선정하여 풀이하는 독립적인 게임 모드 (`/quiz`).
- **게임 로직**:
  - **Progress Bar**: 현재 진행 상황을 시각적으로 표시.
  - **Instant Feedback**: 정답 선택 시 팁(Tip)과 함께 피드백 노출.
  - **Result Summary**: 점수와 함께 전체 풀이 문제 복습(Review) 기능 제공.
- **상태 유지 (State Persistence)**:
  - **이어하기**: 퀴즈 도중 '공부하기' 버튼을 눌러 상세 페이지를 보고 돌아와도 풀던 위치와 점수를 그대로 유지.
  - **Selective 리셋**: 페이지 새로고침 시에는 기획 의도에 따라 처음부터 다시 시작 (Fresh Data).
- **모바일 최적화**:
  - **내부 이동**: 모바일에서는 '공부하기' 클릭 시 새 탭이 아닌 현재 창에서 이동하여 앱과 같은 부드러운 전환 제공.
- **Analytics**: 퀴즈 시작, 정답 여부, 최종 완료 이벤트를 추적하여 사용자 학습 패턴 분석.

## 2. 사용자 서비스 & 상호작용 (User System & Interactions)

- **인증 시스템 (NextAuth v5)**:
  - **Social Login**: Google 계정을 통한 간편 로그인 지원.
  - **Refresh Token Strategy**: 보안 강화를 위해 데이터베이스 세션 기반의 Refresh Token 전략 사용.
- **하이브리드 데이터 전략 (Hybrid Storage)**:
  - **무료 사용자**: 브라우저 `Local Storage`를 사용하여 서버 비용 없이 데이터 저장 (기기별 독립).
  - **Pro 사용자**: `Supabase DB`를 활용하여 모든 기기에서 데이터 실시간 동기화 및 영구 보존.
- **핵심 액션 (Interactions)**:
  - **Save (저장) & 단어장 시스템**: 나만의 테마별 폴더를 만들어 표현을 체계적으로 관리하는 고도화된 북마크 시스템.
    - **커스텀 단어장 (Vocabulary Lists)**: 'Daily English', 'Travel' 등 사용자가 직접 이름을 붙인 폴더를 생성. (Pro: 무제한 / Free: 최대 5개)
    - **스마트 저장 UX (Quick Save)**:
      - **One-tap Save**: 저장 버튼 클릭 시 미리 설정된 '기본 단어장(Default List)'으로 즉시 저장되어 탐색의 흐름을 방해하지 않습니다.
      - **Long Press (Save Button)**: 버튼을 길게 누르면 저장할 리스트를 멀티 셀렉트하거나, 즉석에서 새 리스트를 생성할 수 있는 관리 모달이 노출됩니다.
    - **기본 단어장 제어 (Default List Management)**:
      - **Auto-Set**: 첫 번째로 생성된 단어장은 자동으로 기본(⭐️)으로 설정됩니다.
      - **Easy Change**: 단어장 목록에서 다른 리스트를 길게 누르면 즉시 새로운 기본 단어장으로 전환할 수 있습니다.
      - **Auto-Reassignment (자동 승계)**: 기본 단어장을 삭제할 경우, 남은 리스트 중 가장 오래된 리스트를 자동으로 기본 단어장으로 승격시켜 '즉시 저장' 기능의 연속성을 보장합니다. (DB 트리거 및 로컬 스토어 동시 적용)
    - **Auto-Sync Integrity**: 단어장에서 표현을 모두 제거하면 메인 저장 상태(`save` action)도 자동으로 해제되어 데이터 무결성을 유지합니다.
    - **Save Architecture (Phase 3)**: 저장/해제 시 단일 RPC(`toggle_save_expression`)로 처리되어 서버 호출이 1개로 최소화됩니다. 저장 상태는 `vocabulary_items` 기반으로 판단 (데이터 단일 소스). 모달에서의 개별 리스트 토글은 `toggleInList`이 별도 처리합니다.
    - **Visual Feedback**: 기본 단어장 옆에 전용 아이콘(⭐️)을 배치하여 현재 설정을 명확히 인지하게 하며, 단어장별 포함된 아이템 개수를 실시간으로 표시합니다.
    - **페이지네이션 (Pagination)**:
      - 단어장 상세 페이지에서 서버 사이드 페이지네이션을 지원하여, 수백 개의 표현이 담긴 리스트도 끊김 없이 탐색할 수 있습니다.
      - **UX Optimization**: `useSWR` 캐싱과 `onPageChange` 콜백을 결합하여, 페이지 이동 시 전체 새로고침 없이 즉각적이고 부드러운 화면 전환을 제공합니다.
      - 일관된 내비게이션을 위한 표준 페이지네이션 UI 제공.
    - **탐색 편의성 (Navigation Polish)**:
      - 단어장 상세 페이지의 '뒤로가기' 버튼은 항상 마이페이지(`/me`)로 연결되어, 사용자가 어디서 진입했든 자신의 단어장 목록 대시보드로 쉽게 돌아올 수 있습니다.
    - **UI Optimization (Toolbar Refactoring)**:
      - **Desktop Strategy**: 가로폭이 넓은 데스크탑 환경에서는 모든 컨트롤을 한 줄에 배치하여 공간 효율성을 높였습니다.
      - **Mobile Strategy**: 모바일에서는 2단 구조를 적용하여 터치 타겟을 확보하고 조작성을 개선했습니다.
      - **Component Logic**: 일관된 동작을 위해 `SelectionCount`, `ToggleAllButton` 등 핵심 로직을 컴포넌트화하여 모든 환경에서 동일한 UX를 보장합니다.
      - **Numeric Readability**: 아이템 개수 및 선택된 개수 표시 시 `toLocaleString()`을 적용하여 천 단위 구분 기호(,)를 포함함으로써 가독성을 높였습니다.
  - **Learn (학습 완료)**: 마스터한 표현을 체크하여 학습 진행도 관리 및 목록 최적화.
    - **학습 완료 목록 (Learned History)**: `/me/learned` 페이지를 통해 과거 학습 완료 처리한 표현들을 최신순으로 확인할 수 있습니다.
    - **Visual Identity (Folder)**: 마이페이지의 '학습 완료' 폴더에 파란색 테마와 전용 호버 효과(Shadow/Border)를 적용하여 다른 일반 단어장과 차별화된 시각적 중요도를 부여했습니다.
    - **Global Management & Bulk Sync**: 단어장 관리 및 일괄 작업을 위한 시스템을 구축하여 앱 어디서든 일관된 조작 환경을 제공합니다.
      - **Global Modal**: `useVocabularyModalStore`를 통해 앱 루트에서 단어장 선택 모달을 싱글턴으로 관리합니다.
      - **Selection Mode (Bulk Actions)**: 여러 아이템을 선택하여 '이동', '복사', '삭제'할 수 있는 일괄 작업 모드를 지원합니다.
      - **Sync Logic Centralization**: `useVocabularyListSync` 훅을 통해 스토어(Zustand)와 서버 캐시(SWR) 간의 정합성을 보장합니다.
      - **Performance Optimization**: SWR의 `fallbackData` 설정을 통해 로딩 지연 없이 단어장 목록이 즉시 노출되며, 불필요한 스켈레톤을 제거하여 훨씬 민첩한 UX를 제공합니다.
      - **Stability**: 개별 액션의 원자성을 보장하는 `_pendingOps` 가드와 지연된 서버 응답을 무효화하는 `toggleGenRef` 로직을 통해 레이스 컨디션 없는 **Staged Area UX**를 완성했습니다.
      - **Real-time Item Counts**: 이동/복사 시 `adjustItemCounts`를 사용하여 연관된 모든 단어장의 카운트를 즉시 갱신하고, SWR 백그라운드 리페치가 최종적으로 정합성을 확인합니다.
    - **Pagination**: 저장된 학습 데이터가 많아질 경우를 대비해 페이지네이션을 지원하여 성능 저하 없이 탐색할 수 있습니다.
- **마이페이지 (My Page - `/me`)**:
  - **대시보드**: 개인별 학습 현황과 저장된 데이터를 통합 관리하는 개인화된 공간.
  - **탐색 최적화**: 마이페이지에 이미 접속 중인 경우, 유저 메뉴 내 '마이페이지' 링크를 비활성화하여 불필요한 페이지 리로드와 네트워크 부하를 차단합니다.
  - **사용자 프로필**: 사용자 정보 및 멤버십 등급(Free/Pro) 표시.
  - **학습 모드 센터 (Study Hub)**:
    - **Flashcards**: 저장한 표현들을 카드로 뒤집으며 암기하는 모드.
    - **Listening**: 원어민 발음에 집중하여 듣고 따라 하는 모드.
    - **Quiz**: 내가 저장한 표현들로만 구성된 맞춤형 퀴즈.
    - **Reinforce**: 오답률이 높거나 반복 학습이 필요한 표현 집중 관리.
  - **단어장 그리드 뷰**: 생성한 단어장들을 그리드 형태로 시각화하여 접근성 향상.

## 3. 시스템 & 인프라 (System & Infra)

### 프론트엔드 (Next.js & UI)

- **모바일 최적화 (Mobile First)**: `useIsMobile` 훅을 통한 기기별 맞춤형 레이아웃 및 인터랙션 제공.
  - **Touch Optimization**: 터치 디바이스에서는 카드의 호버 효과(크기 변경, 테두리 색상)를 비활성화하여 깔끔한 스크롤 경험 제공.
- **스켈레톤 로딩 (Skeleton Loading)**:
  - 데이터 페칭 중 레이아웃 흔들림(CLS)을 방지하기 위한 정교한 스켈레톤 UI 적용.
  - 네비바, 히어로 섹션, 카드 리스트, 상세 페이지(메인 카드, 퀴즈, 태그) 등 각 요소별 전용 스켈레톤 제공.
  - **Component Consolidation**: 단어장 상세 페이지의 복잡한 스켈레톤 구성을 `SkeletonVocabularyDetail`로 모듈화하여, 서버(`loading.tsx`)와 클라이언트 로딩 상태 모두에서 100% 일관된 로딩 경험을 보장합니다.
  - **SWR Integration**: `useSWR`의 캐싱 능력을 활용하여 캐시된 데이터가 있을 경우 로딩 스켈레톤을 생략하고 즉시 화면을 렌더링함으로써 체감 속도를 극대화합니다.
- **시맨틱 스타일 관리**: `bg-surface`, `text-body` 등 의미 기반의 유틸리티 클래스를 통한 전역 테마 관리.
- **ISR (Incremental Static Regeneration)**: 1시간마다 정적 페이지를 갱신하여 최신 데이터와 빠른 속도 동시 제공.
- **Framer Motion**: 리스트 정렬, 카드 등장, 호버 효과 등 부드러운 인터랙션 구현.
- **다크 모드**: 시스템 설정에 따른 다크/라이트 모드 완벽 지원.

### 데이터베이스 (Supabase)

- **독립 스키마**: `speak_mango_en` 등 언어별 전용 스키마 사용으로 확장성 확보.
- **최적화**: `domain`, `category` 인덱싱을 통한 조회 성능 보장.

### 자동화 (Agent & n8n & Gemini AI)

- **워크플로우 (Agent)**:
  - **문서 자동화**: 코드 변경 시 관련 문서들을 자동으로 점검하고 업데이트하는 지능형 워크플로우 내장.
- **콘텐츠 생성**: 매일 오전 9시, AI가 스스로 주제를 선정하여 새로운 표현 생성.
  - **표준화**:
    - **통화/수치**: USD($) 통화 기호, 천 단위 쉼표 사용 강제.
    - **대화 구조**: 2~3턴의 자연스러운 대화문 (A:여성, B:남성), 미국식 이름 기본 사용 규칙 적용.
- **중복 방지**: 생성 전 기존 데이터를 조회하여(Pre-fetch) 중복 생성을 원천 차단하는 스마트한 파이프라인.
- **다국어 생성**: 한 번의 실행으로 3개 국어(한/일/서) 콘텐츠 동시 생성.

## 4. 시스템 필수 요소 (Service Essentials)

### PWA (Progressive Web App)

- **설치형 앱 경험**: 브라우저 주소창 없이 네이티브 앱처럼 설치하여 사용 가능.
- **Splash Screen**: 안드로이드 자동 생성 지원 및 iOS 전용 30여 종의 고화질 스플래시 이미지(기기별 해상도/방향 최적화) 주입 완료.
- **Dynamic Theme Color**: 시스템 설정(Light/Dark)에 맞춰 브라우저 상단 상태바 색상이 자동으로 전환되어 일관된 사용자 경험 제공.
- **Standalone**: 홈 화면 아이콘을 통해 실행 시 상단바 색상 및 전체화면 경험 최적화.

### SEO (검색 엔진 최적화)

- **동적 메타데이터 (Dynamic Metadata)**: 페이지별 콘텐츠에 맞는 Title, Description, Keyword 자동 생성.
- **동적 키워드 현지화 (Localized Dynamic Keywords)**: 사용자 언어(`i18n`)와 검색 의도(Intent)에 맞춰 카테고리 키워드를 동적으로 매핑(예: 'Travel' -> '여행 영어')하여 검색 유입 최적화.
- **Node.js-generated OG Image (OG)**: SNS 공유 시 표현(Expression) 텍스트와 의미가 포함된 고품질 미리보기 카드 제공. (Node.js Runtime)
- **JSON-LD**: 구글 검색 결과에 학습 자료(LearningResource) 및 조직(Organization) 정보를 리치 스니펫으로 노출.
- **검색 최적화**: `sitemap.xml` 및 `robots.txt`를 통한 검색 엔진 크롤링 경로 가이드.

### I18n (국제화 인프라)

- **확장성**: `SupportedLanguage` 상수를 통해 영어(EN), 한국어(KO), 일본어(JA), 스페인어(ES) 등 다국어 확장이 용이한 구조.
- **Type-safe Locale**: 언어 코드 및 로케일 포맷(ISO 639-1, BCP 47)을 엄격한 타입으로 관리하여 안정성 확보.

### Analytics (사용자 행동 분석)

- **Google Analytics 4 Integration**: 사용자 행동 분석을 위한 GA4 통합 완료.
- **Environment-Based Configuration**: 개발/프로덕션 환경별로 별도의 GA4 속성 사용하여 테스트 데이터와 실제 데이터 분리.
- **Automatic Page View Tracking**: 라우트 변경 시 자동으로 페이지 뷰 추적 (`AnalyticsProvider`).
- **Component-Level Event Tracking**:
  - **Expression Click** (`trackExpressionClick`): 표현 카드 클릭 추적 (`ExpressionCard.tsx`)
  - **Expression View** (`trackExpressionView`): 표현 상세 조회 추적 (`ExpressionViewTracker.tsx`)
  - **Audio Play** (`trackAudioPlay`): 오디오 재생 추적 (`DialogueAudioButton.tsx`)
  - **Audio Complete** (`trackAudioComplete`): 오디오 재생 완료 추적 (`DialogueAudioButton.tsx`)
  - **Learning Mode Toggle** (`trackLearningModeToggle`): 학습 모드 전환 추적 (`DialogueSection.tsx`)
  - **Filter Apply** (`trackFilterApply`): 필터 적용 추적 (`FilterBar.tsx`)
  - **Search** (`trackSearch`): 검색 실행 추적 (`SearchBar.tsx`)
  - **Tag Click** (`trackTagClick`): 태그 클릭 추적 (`Tag.tsx`)
  - **Related Click** (`trackRelatedClick`): 관련 표현 클릭 추적 (`RelatedExpressions.tsx`)
  - **Share Click** (`trackShareClick`): 공유 버튼 클릭 추적 (`ShareButton.tsx`)
  - **Share Complete** (`trackShareComplete`): 공유 완료 추적 (`ShareButton.tsx`)
- **Development Tools**: 개발 환경에서는 콘솔 로그로 이벤트 확인, 프로덕션에서만 GA4로 전송.
- **Module Organization**: 독립된 `analytics/` 모듈로 구성 (루트 레벨).
