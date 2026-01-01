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

- [x] **Automation**: AI 기반 생성 및 중복 방지 워크플로우 설계 완료 (`docs/n8n_optimization_steps.md`)
- [x] **i18n**: 다국어 지원 인프라 및 중앙 집중식 문자열 관리 구현
- [x] **Category**: 2단계 분류 체계(`domain`, `category`) 도입 및 DB 스키마 확장
- [ ] **UI/UX**: 태그 및 카테고리별 필터링 기능 구현
- [ ] **UI/UX**: 표현 검색(Search) 기능 구현
- [ ] **UI/UX**: Framer Motion을 활용한 리스트 애니메이션 적용
- [ ] **Security**: Supabase RLS 설정 및 보안 강화 (프로덕션 대비)

## Phase 5: Monetization (수익화)

- [ ] **MVP**: '북마크' 기능 구현 (Local Storage)
- [ ] **MVP**: 'My Voca' 페이지 구현
- [ ] **Auth**: Supabase Auth 연동 및 프로필 테이블 생성
- [ ] **Sync**: Local -> DB 데이터 동기화 로직 구현
- [ ] **Payment**: PayPal 정기 결제 연동 ($9.99/mo)
