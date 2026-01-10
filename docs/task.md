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
- [x] **i18n**: 다국어 지원 인프라 및 중앙 집중식 문자열 관리 구현
- [x] **Category**: 2단계 분류 체계(`domain`, `category`) 도입 및 DB 스키마 확장
- [x] **UI/UX**: 태그 및 카테고리별 필터링 기능 구현
- [x] **UI/UX**: 표현 검색(Search) 기능 구현
- [x] **UI/UX**: Framer Motion을 활용한 리스트 애니메이션 및 Scale-up 진입 효과 적용
- [x] **UI/UX**: 관련 표현 추천 (Related Expressions) 및 드래그 가속 구현
- [x] **UI/UX**: Sticky Header 및 FilterBar 고도화
- [x] **UI/UX**: UI 스타일 중앙 관리 및 모바일 최적화 (유틸리티 클래스 & useIsMobile)
- [x] **UI/UX**: 퀴즈 개행 문자(`\n`) 지원 및 가독성 개선
- [x] **Automation**: TTS 파이프라인 구축 (Groq API + Supabase Storage 연동)
- [x] **UI/UX**: 원어민 대화 듣기(Audio Playback) 기능 구현 및 동기화 로직 적용
- [x] **UI/UX**: 대화 전체 듣기(Sequential Playback) 및 하이라이트 기능 구현
- [x] **Automation**: n8n 코드 및 프롬프트 모듈화 (개별 파일 분리 및 구조 최적화)
- [x] **Documentation**: 에이전트 워크플로우(Commit/Doc Update) 최적화
- [x] **Documentation**: 운영자용 사용자 가이드(`docs/n8n/expressions/user_guide.md`) 작성
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
- [x] **PWA**: iOS Splash Screen 생성 및 `apple-touch-startup-image` 메타데이터 최적화
- [x] **PWA**: `manifest.ts` 설정 및 standalone 모드 구현
- [x] **SEO**: 동적 `opengraph-image` 생성 (Edge Runtime) 및 스타일링
- [x] **SEO**: JSON-LD 구조화된 데이터(Schema.org) 및 Sitemap 적용
- [x] **i18n**: `SupportedLanguage` 상수 도입 및 타입 안전성 리팩토링
- [x] **Automation**: n8n 프롬프트 고도화 (영어 톤 매너 정의 및 퀴즈 정답 랜덤화)
- [ ] **UI/UX**: 아카이브 / 인덱스 페이지 구현
- [ ] **Security**: Supabase RLS 설정 및 보안 강화 (프로덕션 대비)

## Phase 5: Monetization (수익화)

- [ ] **Feature Gating (Audio Support)**: 음성 지원(TTS) 기능을 사용자 티어(`free`/`pro`)에 따라 차별화하여 제공.
  - [x] **Scalable Architecture**: `DialogueAudioButton`에 `onPlayAttempt` 콜백을 추가하여 부동한 권한 체크 로직을 주입할 수 있는 구조로 개선.
  - [ ] **UI Logic**: 무료 사용자가 '원어민 대화 듣기' 버튼 클릭 시 유료 기능 안내 모달 팝업 및 결제 유도.
- [ ] **MVP**: '북마크' 기능 구현 (Local Storage)
- [ ] **MVP**: 'My Voca' 페이지 구현
- [ ] **Auth**: Supabase Auth 연동 및 프로필 테이블 생성
- [ ] **Sync**: Local -> DB 데이터 동기화 로직 구현
- [ ] **Payment**: PayPal 정기 결제 연동 ($9.99/mo)
