# Task Management

> 현재 진행 중인 작업을 관리합니다. 완료된 작업은 체크 표시합니다.

## Phase 1: Foundation (초기 설정)

- [x] Next.js 16 + Tailwind CSS 프로젝트 생성
- [x] 문서화 체계 수립 (Context, History, Walkthrough, Git Docs)
- [x] Supabase 데이터베이스 스키마 설계
- [x] n8n 워크플로우 가이드 작성
- [x] Supabase 클라이언트 설정 (`@supabase/ssr`)
- [x] 환경 변수(`.env.local`) 템플릿 생성

## Phase 2: Core Feature (핵심 기능)

- [x] 메인 페이지 UI 구현 (Card List)
- [x] Supabase 데이터 Fetching 로직 구현 (ISR)
- [x] 상세 페이지 구현 (Modal or Page)

## Phase 3: Automation (자동화)

- [x] n8n 로컬/클라우드 세팅
- [x] Gemini API 연동 및 프롬프트 테스트
- [x] 실제 데이터 파이프라인 가동 테스트
- [x] AI 프롬프트 고도화 및 페르소나 일관성 확보
- [x] JSON 파싱 및 중복 체크 로직 안정화

## Phase 4: Optimization & Polish (최적화 및 고도화)

- [x] **Automation**: AI 기반 생성 및 중복 방지 워크플로우 설계 완료 (`docs/n8n/expressions/optimization_steps.md`)
- [x] **Automation**: V3 특정 표현 생성 및 자동 분류 워크플로우 설계 (`docs/n8n/expressions/optimization_steps_v3.md`)
- [x] **i18n**: 다국어 지원 인프라 및 중앙 집중식 문자열 관리 구현
- [x] **Category**: 2단계 분류 체계(`domain`, `category`) 도입 및 DB 스키마 확장
- [x] **UI/UX**: 태그 및 카테고리별 필터링 기능 구현
- [x] **UI/UX**: 표현 검색(Search) 기능 구현
- [x] **UI/UX**: Framer Motion을 활용한 리스트 애니메이션 및 Scale-up 진입 효과 적용
- [x] **UI/UX**: 관련 표현 추천 (Related Expressions) 및 드래그 가속 구현
- [x] **UI/UX**: Sticky Header 및 FilterBar 고도화
- [x] **UI/UX**: UI 스타일 중앙 관리 및 반응형 최적화 (CSS-based & offsetParent optimization)
- [x] **UI/UX**: 퀴즈 개행 문자(`\n`) 지원 및 가독성 개선
- [x] **Automation**: TTS 파이프라인 구축 (Groq API + Supabase Storage 연동)
- [x] **UI/UX**: 원어민 대화 듣기(Audio Playback) 기능 구현 및 동기화 로직 적용
- [x] **UI/UX**: 대화 전체 듣기(Sequential Playback) 및 하이라이트 기능 구현
- [x] **UI/UX**: 퀴즈 상태 유지(Session Storage) 및 모바일 네비게이션 최적화
- [x] **UI/UX**: 메인 페이지 헤더 스타일링 (Seamless Header with FilterBar)
- [x] **Automation**: n8n 코드 및 프롬프트 모듈화 (개별 파일 분리 및 구조 최적화)
- [x] **Documentation**: 에이전트 워크플로우(Commit/Doc Update) 및 스킬 가이드 최적화
- [x] **Documentation**: 운영자용 사용자 가이드(`docs/n8n/expressions/user_guide.md`) 작성
- [x] **Audit**: Vercel React Best Practices 기반 코드베이스 전체 감사 (`audit_report.html`)
- [x] **Performance**: Server-side Waterfall 제거 (`app/page.tsx` Promise.all 적용)
- [x] **Performance**: Client-side 렌더링 최적화 (`DialogueSection` React.memo & useCallback 적용)
- [x] **Performance**: DB 검색 쿼리 최적화 (`meaning_text` 생성 컬럼 & Trigram 인덱스 도입)
- [x] **Performance**: Data Fetching 전략 현대화 (`useSWRInfinite` 도입 및 `ExpressionContext` 최적화)
- [x] **Automation**: n8n 워크플로우 성능(중복 체크) 및 콘텐츠 품질(대화 턴수, 통화 표기) 고도화
- [x] **UI/UX**: 스켈레톤 로딩 (Skeleton Loading) 도입
- [x] **UI/UX**: 리스트 탐색 경험 개선 ('더 보기' 버튼 및 레이아웃 안정화)
- [x] **UI/UX**: 필터별 독립 캐싱 및 정밀 스크롤 복원 구현
- [x] **UI/UX**: 카테고리 필터 토글 및 중복 클릭 방지 최적화
- [x] **UI/UX**: 라우트 중앙 관리 및 필터 누적 시스템(Additive Filtering) 구현
- [x] **UI/UX**: 대화 섹션 UI 스타일링 수정 (모바일 호버 제거, 버튼 일관성, 다크모드 텍스트)
- [x] **UI/UX**: 학습 모드(Learning Mode) 기초 구현 (Blind Listening, Translation Blur)
- [x] **UI/UX**: 학습 모드 상호작용 고도화 (Partial Reveal, Auto-Exposed, State Preservation)
- [x] **Architecture**: Audio URL 정규화(Relative Path) 및 클라이언트 중심 해제 로직 리팩토링
- [x] **UI/UX**: 상세 페이지 스크롤 리셋 전략 (Session Storage & Template) 구현
- [x] **UI/UX**: `MainHeader` 통합 및 내비게이션 일원화 (Logo vs BackButton 스위칭)
- [x] **UI/UX**: 로딩 스켈레톤(`SkeletonNavbar`) 동기화 및 CLS 최적화
- [x] **UI/UX**: `InteractiveLink` 애니메이션 마운트 상태 검증(`safeStart`) 및 런타임 안정화
- [x] **PWA**: iOS Splash Screen 생성 및 `apple-touch-startup-image` 메타데이터 최적화
- [x] **PWA**: `manifest.ts` 설정 및 standalone 모드 구현
- [x] **SEO**: 동적 `opengraph-image` 생성 (Edge Runtime) 및 스타일링
- [x] **SEO**: JSON-LD 구조화된 데이터(Schema.org) 및 Sitemap 적용
- [x] **i18n**: `SupportedLanguage` 상수 도입 및 타입 안전성 리팩토링
- [x] **Automation**: n8n 프롬프트 고도화 (영어 톤 매너 정의 및 퀴즈 정답 랜덤화)
- [x] **Architecture**: Dialogue 데이터 정규화(Top-level Column) 및 GIN 인덱스 적용
- [x] **Automation**: Universal Backfill System 구축 (Dual Strategy: Universal & Supplementary)
- [x] **Automation**: Dialogue Translation Batch Backfill 및 Prompt Strictness 강화
- [x] **Automation**: Prompt Refinement (Forbid Mixed English in Dialogue Translations)
- [x] **i18n**: 하드코딩된 언어 문자열 제거 및 상수화 (Hardcoded String Refactoring)
- [x] **Automation**: 대화 턴수 검증(2~4 turns) 규칙 도입 및 `10_validate_content.js` 반영
- [x] **Automation**: 데이터 정제(Cleanup Meaning) 및 엄격한 문장 부호 검증 도입 (`n8n` & `verify_db_data.js`)
- [x] **Automation**: 대화 생성 규칙 정교화 (Role Gender & American Names)
- [x] **SEO**: JSON-LD 구조화된 데이터 추가 (Organization, WebSite, SearchAction)
- [x] **UI/UX**: 검색 기능 개선 (Icon Click, Multilingual, Duplicate Prevention)
  - [x] 검색 아이콘 클릭으로 검색 실행
  - [x] 다국어 검색 지원 (로케일별 meaning 필드 검색)
  - [x] 중복 검색 방지 (useRef로 이전 검색어 추적)
  - [x] 데이터베이스 인덱스 최적화 (GIN, Trigram)
- [x] **SEO**: 동적 카테고리 키워드 현지화 (Localized Dynamic Keywords)
  - [x] 언어별 `categories` 맵 정의 및 하드코딩 키워드 제거
  - [x] `lib/seo` 동적 룩업 로직 구현
- [x] **SEO**: JSON-LD 구조화된 데이터(Schema.org) 최적화
  - [x] `app/layout.tsx`: `keywords` 추가
  - [x] `app/expressions/[id]`: `LearningResource` 스키마에 `keywords` 주입
- [x] **UI/UX**: 마케팅 스튜디오 구현 및 이미지 자동화 (`/studio/[id]`, `generate_studio_images.py`)
- [x] **Feature**: 랜덤 퀴즈 게임 구현 (`/quiz`)
  - [x] **Architecture**: 랜덤 표현 추출 로직 (`getRandomExpressions`) 및 퀴즈 파싱 (`lib/quiz.ts`)
  - [x] **UI**: 퀴즈 게임 인터페이스 (`QuizGame.tsx`) 및 결과 화면
  - [x] **Analytics**: 퀴즈 정답/오답 및 완료 이벤트 추적
  - [x] **SEO**: 퀴즈 페이지 메타데이터(i18n) 및 sitemap 등록
- [x] **Refactoring**: 라우트 로직 중앙화 (`CANONICAL_URLS`) 및 SEO 메타데이터 정제 (OpenGraph)
- [x] **Refactoring**: 퀴즈 상태 관리 로직 개선 (`useReducer` 도입 및 Custom Hook 분리)
- [x] **Refactoring**: 다국어(i18n) Prop Drilling 제거 및 Context API(`I18nProvider`) 전환
- [x] **Refactoring**: 전역 타입 관리 스킴 구축 (`types/*.d.ts` 분리 및 Window 확장 타입 정리)
- [x] **Refactoring**: 공유 버튼 토스트 시스템 전환 (`ToastContext` 연동)
- [ ] **UI/UX**: 아카이브 / 인덱스 페이지 구현
- [x] **Security**: Supabase RLS 설정 및 보안 강화 (Full RLS Coverage 완료)

## Phase 5: Analytics (데이터 분석)

- [x] **GA4 Integration**: Google Analytics 4 연동 및 환경별(dev/prod) 측정 ID 분리
- [x] **Module Organization**: Analytics 모듈 구조화 (`analytics/`) 및 루트 레벨 격상
- [x] **Tracking (Page View)**: 라우트 변경 시 자동 페이지 뷰 추적 (`AnalyticsProvider`)
- [x] **Tracking (Expression)**: 표현 카드 클릭(`expression_click`) 및 상세 조회(`expression_view`) 추적
- [x] **Tracking (Audio)**: 오디오 재생 추적 (`trackAudioPlay`)
- [x] **Tracking (Audio Complete)**: 오디오 재생 완료 추적 (`trackAudioComplete`)
- [x] **Tracking (Learning Mode)**: 학습 모드 전환 추적 (`trackLearningModeToggle` - Blind Listening, Translation Blur)
- [x] **Tracking (Filter)**: 카테고리 필터 적용 추적 (`trackFilterApply`)
- [x] **Tracking (Search)**: 검색 실행 추적 (`trackSearch`)
- [x] **Tracking (Tag)**: 태그 클릭 추적 (`trackTagClick` - source 구분: card/detail/filter)
- [x] **Tracking (Related)**: 관련 표현 클릭 추적 (`trackRelatedClick`)
- [x] **Tracking (Share)**: 공유 버튼 클릭 및 완료 추적

## Phase 6: User System & Monetization (사용자 및 수익화)

- [x] **Phase 1: Foundation & Auth**
  - [x] **Strategy**: NextAuth (Auth.js v5) 피벗 및 Refresh Token 전략 수립
  - [x] **DB**: 사용자 시스템용 테이블 및 트리거 구축 (`016_init_user_system.sql`)
  - [x] **Auth**: NextAuth 아키텍처 및 Google Provider 연동 설정
  - [x] **Hook**: 클라이언트 사이드 인증 훅 (`useAuthUser`) 구현
  - [x] **Setup**: 환경 변수(`.env.local`) 설정 및 로컬 테스트 (사용자 작업)
- [x] **Phase 2: Hybrid Repository Pattern**
  - [x] **Design**: Local/Remote 통합 리포지토리 인터페이스 정의
  - [x] **Local**: `localStorage` 기반 리포지토리 구현 (Zustand 도입: `store/useLocalActionStore.ts`)
  - [x] **Remote**: Supabase Server Action 기반 Remote 리포지토리 구현
  - [x] **Sync**: 무료 -> 유료 전환 시 데이터 마이그레이션 로직 구현
- [x] **Phase 3: Interactive Features**
  - [x] **Actions**: Save, Learn 버튼 UI 및 상태 연동
  - [x] **Refactoring**: 'Like' 액션 완전 제거 및 'Save/Learn' 체계로 단순화
  - [x] **Refactoring**: 공통 액션 바 컴포넌트(`ExpressionActions.tsx`) 추출 및 중복 제거
  - [x] **Refactoring**: `InteractiveLink` 및 `ActionButtonGroup` 독립 컴포넌트 추출
  - [x] **UI/UX**: `InteractiveLink`를 통한 수동 애니메이션 제어 및 액션 버튼 간섭 해결
  - [x] **Bug Fix**: 로그인 모달 클릭 전파(`stopPropagation`) 해결 및 UX 안정화
  - [x] **UI**: 비로그인 액션 시 브랜드 일관성을 갖춘 로그인 유도 모달(Login Modal) 구현 및 최적화
  - [x] **Refactoring**: AuthButton에서 UserMenu 컴포넌트 분리 (`UserMenu.tsx`) 및 로그아웃 UX 개선
  - [x] **Logic**: '학습 완료' 시 자동 추천 스크롤
  - [x] **Vocabulary**: 커스텀 단어장(Vocabulary List) 시스템 구현
    - [x] **DB**: `vocabulary_lists`, `vocabulary_items` 테이블 구축 및 트리거 설정
    - [x] **Zustand**: 로컬 단어장 관리 로직 통합 (`useLocalActionStore`)
    - [x] **Hook**: 하이브리드 리포지토리 패턴 (`useVocabularyLists`) 적용
    - [x] **UI**: 단어장 관리 모달(`VocabularyListModal`) 및 생성 폼(`CreateListForm`) 구현
    - [x] **Logic**: 마스터 저장(`Save`) 버튼과 개별 단어장 상태 동기화 캡슐화 (`useSaveAction`)
    - [x] **Stabilization**: `useLongPress` 추출 및 `LocalVocabularyDetail` Race Condition 해결
    - [x] **Architecture**: 단어장 상세 UI 리팩토링 및 통합 인프라 구축
      - [x] 독립형 `VocabularyToolbar` 및 `useVocabularyView` 훅 추출
      - [x] `VocabularyDetailLayout`을 통한 레이아웃 중복 제거 및 시맨틱 마크업 강화
      - [x] 원격(Pro) 및 로컬(Free) 단어장 상세 페이지 UI/UX 통일
      - [x] **UI/UX**: `VocabularyToolbar` 모바일 최적화 (2단 레이아웃) 및 리팩토링 (Sub-components)
      - [x] **Logic**: 단어장 이름 변경, 삭제 및 기본값 설정 기능 완료
      - [x] **Logic**: 기본 단어장 삭제 시 자동 권한 이양 구현 (Auto-reassignment)
      - [x] **UI/UX**: 단어장 목록 및 마이페이지 로딩 스켈레톤 도입
      - [x] **Logic**: 단어장 항목 페이지네이션 및 UI 컴포넌트(`Pagination`, `Button`) 구축
- [x] **Logic**: 단어장 항목 일괄 이동 및 복사 지원 (Bulk Move/Copy)
- [x] **UX/UI**: 일괄 작업용 `useBulkAction` 훅 및 타겟 선택 흐름 구현
- [x] **UI/UX**: 플랜 사용 현황 및 안내 컴포넌트(`VocabularyPlanStatus`) 도입
- [x] **Page**: 학습 완료 목록 페이지(`/me/learned`) 구현 및 페이지네이션 지원
  - [x] **UI**: 로딩 스켈레톤(`app/me/learned/loading.tsx`) 구현 및 레이아웃 최적화
  - [x] **Refactoring**: 통합 에러 핸들링 시스템 구축 (`useAppErrorHandler`, `ToastContext.tsx`)
  - [x] **Refactoring**: 공통 서버 액션 보안 HOF 도입 (`withPro`)
  - [x] **UI/UX**: 전역 확인 모달 시스템 구현 (`ConfirmDialog`)
  - [x] **Logic**: 단어장 동기화(`useVocabularySync`) 및 익명/로그인 데이터 병합 정책 안정화
  - [x] **Performance**: 액션(Save/Learn) 실행 시 SWR 낙관적 업데이트(Optimistic Update) 도입
- [x] **Refactoring**: 서비스 레이어 구조화 (Queries/Actions 분리) 및 `cache()` 기반 데이터 접근 최적화
- [x] **Refactoring**: 랜덤 피드 조회 로직 최적화 및 시드 기반 캐싱/중복 제거 구현
- [x] **Refactoring**: 단어장 상세 페이지 로직 고도화
  - [x] **UI**: 스켈레톤 통합(`SkeletonVocabularyDetail`) 및 일관된 로딩 경험 확보
  - [x] **Performance**: `useSWR` 도입을 통한 데이터 페칭 전략 최적화 및 캐싱 시스템 구축
  - [x] **UX**: 페이지네이션 콜백 지원 및 뒤로가기 경로 고정 (`/me` 리다이렉트)
  - [x] **UI/UX**: 서비스 전반의 숫자 표시 방식 표준화 (`toLocaleString`)

- [/] **Phase 4: Feature Gating & Trial**
  - [x] **Auth**: 사용자 티어 조회 SQL 함수 (`get_user_tier`) 도입
  - [x] **UI/UX**: 마이페이지 중복 접근 방지 및 유저 메뉴 최적화
  - [ ] **Audio/Blur**: 사용자 티어별 기능 접근 제어 로직 구현
  - [ ] **Trial**: 무료 사용자용 사용 횟수 제한(Trial Counter) 구현
  - [ ] **Upsell**: 체험 종료 시 결제 안내 및 업그레이드 모달 구현
- [ ] **Phase 5: Payments & Pro**
  - [ ] **Payment**: PayPal 정기 결제($9.99/mo) 연동
  - [ ] **Verification**: 결제 성공 시 DB `users.tier` 즉시 업데이트 및 세션 갱신
  - [x] **Dashboard**: 마이 페이지 (`/me`) 구현 (Saved, Study Modes)
  - [ ] **Ads**: 무료 사용자용 광고 배너/인피드 컴포넌트 추가
