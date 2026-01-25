# 사용자 시스템 및 수익화 구현 계획 (User System & Monetization Implementation Plan)

## 1. 개요 (Executive Summary)

이 문서는 **Speak Mango**의 사용자 시스템과 수익화 모델을 위한 핵심 아키텍처 및 구현 계획을 정의합니다.
기존 Supabase Auth 중심 설계에서 비용 효율성과 유연성이 높은 **NextAuth (Auth.js) + JWT** 기반의 하이브리드 아키텍처로 전환되었습니다.

**"하이브리드 경험(Hybrid Experience)"** 전략을 통해 초기 비용을 최소화하면서도, 유료 사용자에게는 프리미엄 가치를 제공하는 것이 목표입니다.

---

## 2. 사용자 등급 및 전략 (User Tiers & Strategy)

사용자는 접근 권한과 데이터 저장 방식에 따라 크게 세 가지 등급으로 구분됩니다.

| 구분                    | 정의 (Definition)       | 데이터 저장소 (Storage) | 주요 특징 (Features)                                                                                                               |
| :---------------------- | :---------------------- | :---------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Anonymous**<br>(익명) | 로그인하지 않은 방문자  | `N/A` (메모리)          | - 콘텐츠 단순 열람만 가능<br>- 액션 시도 시 로그인 모달 노출                                                                       |
| **Free User**<br>(무료) | 로그인했으나 구독 안 함 | `Local Storage`         | - **비용 절감**: 서버 DB 쓰기 최소화<br>- 기기 간 데이터 연동 안 됨 (Single Device)<br>- 광고 노출, 기능 제한 (체험판)             |
| **Pro User**<br>(유료)  | **월 $9.99** 구독자     | **Supabase DB**         | - **멀티 디바이스 동기화** (Multi-Device)<br>- 학습 기록 영구 보존<br>- 고급 기능 (오디오/블러 무제한, 커스텀 카드)<br>- 광고 제거 |

> [!NOTE]
> **Admin 권한**: 관리자 기능이 필요한 경우, 별도의 `admins` 테이블을 생성하여 관리합니다. 일반 사용자 tier에는 포함하지 않습니다.

- **익명(비로그인) 사용자**: 콘텐츠 열람만 가능. 좋아요/저장 등 액션 시 **로그인 모달**을 띄워 가입 유도.
- **무료 사용자**: **로그인한 상태**이나 구독하지 않은 사용자. 비용 절감 및 유료 전환 유도를 위해 **로컬 스토리지(Local Storage)** 사용. (기기 연동 불가)
- **Pro 사용자**: **구독 중인 사용자**. **Supabase DB**를 사용하여 데이터 영구 보존, 멀티 디바이스 동기화, 고급 학습 기능 제공.

### 2.1 수익화 모델 (Monetization)

월 $9.99 PayPal 구독 모델. 고급 기능(오디오 블러, 무제한 히스토리) 및 '데이터 안전 보관'이라는 가치를 제공하여 유료 전환 유도.

- **가격**: 월 $9.99 (PayPal 정기 결제).
- **구독 관리**:
  - PayPal API를 통해 결제 처리.
  - DB의 `users` 테이블에 `subscription_end_date` 필드로 만료일 관리.
  - **JWT 최적화**: 매 API 요청마다 DB를 조회하지 않고, 로그인/세션 갱신 시 `subscription_end_date`를 JWT 토큰에 구워 클라이언트 및 미들웨어에서 즉시 권한을 검증합니다.

---

## 3. 기술 아키텍처 (Technical Architecture)

### 3.1 인증 시스템: NextAuth.js (Auth.js v5)

Supabase Auth 대신 NextAuth를 사용하여 인증 계층을 직접 제어합니다.

- **Provider**: Google Login (OAuth 2.0).
- **Session Strategy**: **Database Session (Refresh Token)**.
  - 세션 정보를 DB의 `sessions` 테이블에 저장하여 즉시 권한 제어 가능.
  - **Access Token 개념**: 세션 쿠키를 통해 짧은 수명의 액세스 토큰처럼 동작.
  - **Refresh Token**: DB의 `sessionToken`이 Refresh Token 역할 (최대 30일).
  - **보안 강화**: 토큰 탈취 시 DB에서 세션 삭제로 즉시 차단 가능.
  - **유연한 권한 관리**: 구독 취소 시 DB 업데이트로 다음 요청부터 즉시 반영.
- **Adapter**: `@auth/supabase-adapter`를 사용하여 Supabase PostgreSQL과 통신.

### 3.2 하이브리드 데이터 리포지토리 패턴

프론트엔드 코드의 복잡성을 낮추기 위해 **Repository Pattern**을 사용합니다.

```typescript
// 인터페이스 정의
interface ActionRepository {
  likeEffect(id: string): Promise<void>;
  saveExpression(id: string): Promise<void>;
  markAsLearned(id: string): Promise<void>;
  getHistory(): Promise<UserHistory>;
}

// 1. LocalRepository (무료 유저용)
// - Zustand Persist 등을 사용하여 브라우저 LocalStorage에 저장
// - 서버 통신 없음 = 비용 $0 / 속도 매우 빠름

// 2. RemoteRepository (유료 유저용)
// - Supabase Client 사용
// - users, user_actions 테이블에 영구 저장
// - 기기 변경 시에도 데이터 유지
```

### 3.3 데이터 동기화 (Sync on Upgrade)

사용자가 **무료 -> 유료**로 전환(구독)하는 즉시 다음 프로세스가 실행됩니다:

1.  `LocalStorage`에 저장된 모든 액션 데이터(좋아요, 저장, 학습 등)를 읽어옵니다.
2.  Next.js Server Action을 통해 Supabase DB로 **Bulk Insert** 합니다.
3.  성공 시 로컬 스토리지를 비우고, 이후부터는 `RemoteRepository`를 사용합니다.

---

## 4. 데이터베이스 스키마 (Database Schema)

모든 테이블은 `speak_mango_en` 스키마 내에 생성됩니다.

### 4.1 인증 및 사용자 (User Management)

NextAuth의 표준 스키마를 따르되, 서비스에 필요한 커스텀 필드를 확장합니다.

- **제공자**: Google OAuth + NextAuth
- **트리거**: "저장하려면 로그인하세요" (익명 -> 무료), "데이터를 영구 보관하세요" (무료 -> Pro)
- **동기화 로직**: `onAuthStateChange` 감지 (특히 구독 활성화 시점) -> `localStorage` 확인 -> 데이터 존재 시 DB로 Bulk Insert -> `localStorage` 초기화

**1. `users` (사용자 원장)**

- **기본 필드**: `id` (UUID), `name`, `email`, `image`, `emailVerified`
- **커스텀 필드**:
  - `tier`: 'free' | 'pro' (Default: 'free')
  - `subscription_end_date`: TIMESTAMP (구독 만료일)
  - `trial_usage_count`: (INT, default 0): 무료 사용자의 유료 기능(오디오/블러) 체험 횟수 추적

**2. `accounts` (OAuth 연결)**

- 한 사용자가 여러 소셜 계정(Google, Apple 등)을 연동할 수 있도록 `users`와 1:N 관계를 가집니다.
- `provider`, `providerAccountId`, `access_token`, `refresh_token` 등을 저장.

**3. `sessions` (Refresh Token 저장)**

- **역할**: Refresh Token을 DB에 저장하여 서버에서 언제든 무효화 가능.
- **필드**:
  - `sessionToken`: 고유 세션 식별자 (Refresh Token 역할)
  - `userId`: 사용자 참조
  - `expires`: 만료 시간 (기본 30일)
- **보안**: 구독 취소 또는 계정 정지 시 해당 세션을 DB에서 삭제하면 즉시 접근 차단.

### 4.2 사용자 데이터 (User Data)

**4. `user_actions` (통합 상호작용)**
모든 콘텐츠(Expression)에 대한 사용자 반응을 하나의 테이블에서 관리하여 조회 효율을 높입니다.

- `user_id` (FK): 사용자 ID
- `expression_id` (FK): 콘텐츠 ID
- `action_type` (enum: 'like', 'save', 'learn'): 좋아요, 저장, 학습완료 구분
- `created_at` (timestamptz)
- **Unique Key**: `(user_id, expression_id, action_type)` - 중복 방지

**5. `user_custom_cards` (Pro 전용 기능)**

- 유료 사용자가 직접 생성한 단어장 데이터.
- `word`, `meaning`, `context`, `tags` 등을 저장.

### 4.3 분석 및 집계 (Analytics & Aggregation)

**6. `ranking_stats` (집계 테이블/View)**

- **목적**: 표현별 인기도 및 학습 통계 집계 (주간 베스트 등)
- **갱신 방식**: pg_cron 또는 Edge Function으로 일간/주간 재계산
- **필드**: `expression_id`, `like_count`, `save_count`, `learn_count` 등
- **참고**: 실제 구현 시 Materialized View 또는 별도 집계 테이블로 생성 (Phase 6 단계에서 구현 예정)

---

## 5. 핵심 기능 명세 (Feature Specifications)

### 5.1 인터랙션 액션

- **Like (좋아요)**: 디자인적 선호도 표현 / 인기 투표.
- **Save (저장)**: "나중에 다시 공부하고 싶어요". (북마크)
- **Learn (학습 완료)**: "이 표현은 완전히 익혔어요".
  - **UX 흐름**: 상세 페이지에서 "학습 완료" 클릭 -> 학습 목록에 추가됨 -> 자동으로 하단의 '추천 표현(Related Expressions)'으로 스크롤 이동.

### 5.2 기능별 접근 권한 매트릭스

| 기능                  | 익명 (Anonymous) |     무료 (Free)     |         유료 (Pro)         | 비고                                    |
| :-------------------- | :--------------: | :-----------------: | :------------------------: | :-------------------------------------- |
| **콘텐츠 탐색**       |        O         |          O          |             O              | 영어 표현 리스트 및 상세 보기           |
| **좋아요 (Like)**     |     X (모달)     |      O (Local)      |           O (DB)           | 마이페이지에서 모아보기 가능            |
| **저장 (Save)**       |     X (모달)     |      O (Local)      |           O (DB)           | '나중에 볼 단어' 저장                   |
| **학습 완료 (Learn)** |     X (모달)     |      O (Local)      |           O (DB)           | 학습한 카드는 리스트에서 숨김 처리 가능 |
| **오디오 듣기**       |        X         |     △ (체험판)      |         O (무제한)         | Dialogue 전체 듣기 기능                 |
| **블러 모드**         |        X         |     △ (체험판)      |         O (무제한)         | 해석 가리고 보기 (학습용)               |
| **플래시카드**        |       불가       | 기본 (앞/뒤 뒤집기) | 스마트 (SRS) + 커스텀 카드 | 단계별 학습 도구                        |
| **커스텀 단어장**     |        X         |          X          |             O              | 나만의 표현 추가 기능                   |
| **광고 제거**         |        X         |          X          |             O              | 쾌적한 학습 환경                        |

### 5.3 Pro 전용: 커스텀 플래시카드

- 유료 사용자는 기존 DB에 없는 단어도 직접 입력하여 나만의 단어장을 구성할 수 있음.
- 망각 곡선(SRS) 알고리즘을 적용하여 취약 단어 집중 학습 제공.

### 5.4 체험판 전략 (Trial Logic)

- 무료 사용자에게 **"맛보기"** 경험을 제공하여 유료 전환율을 높입니다.
- **대상 기능**: 오디오 전체 듣기, 블러 모드 토글.
- **제한**: 계정당 총 **20회**.
- **구현**: `users.trial_usage_count`를 증가시키며 체크. 20회 도달 시 "체험 종료" ("무제한으로 업그레이드하세요") 모달과 함께 결제 페이지로 유도.

- **비로그인 사용자**: 모든 유료 기능 액션 시 로그인 모달 표시 (체험 불가).

### 5.5 학습 완료 로직

- 표현 상세 페이지 하단에 **"I learned this!"** 버튼 배치.
- 클릭 시:
  1.  `user_actions` (또는 local)에 `learn` 타입으로 저장.
  2.  자동으로 다음 추천 콘텐츠 영역으로 스크롤 다운 (Natural Flow).
  3.  목록 페이지에서는 해당 카드가 UI 처리되거나 필터링됨.

### 5.6 대시보드 ("My Mango")

새로운 보호된 경로 `@/my` 생성:

- **탭 구성**: 좋아요(Liked) / 저장됨(Saved) / 학습완료(Learned)
- **통계**: "이번 주에 X개의 표현을 학습했어요!"
- **학습 진입**: "저장한 단어 복습하기" 버튼 (플래시카드 연결)

### 5.7 랭킹 시스템 ("Hall of Fame")

- **주간 베스트**: 좋아요/저장 수가 가장 많은 상위 5개 표현.
- **시각적 차별화**:
  - **좋아요**: 핑크 테두리 / 하트 아이콘
  - **저장**: 골드 테두리 / 북마크 아이콘
  - **학습됨**: 실버/그린 테마

### 5.8 광고 (Ads)

- **위치**: 하단 배너, 인피드(카드 리스트 사이).
- **제어**: `if (user.tier === 'free') renderAd()` 조건부 렌더링.

---

## 6. 상세 구현 로드맵 (Micro-Roadmap)

이 섹션은 실제 개발을 위한 단계별 구현 상세를 포함합니다.

### Phase 1: 인증 및 데이터베이스 기초 (Current)

- [x] `database/migrations/016_init_user_system.sql` 실행 (Table 생성).
- [x] NextAuth 패키지 설치 (`next-auth@beta`).
- [x] `auth.ts` 설정 파일 작성 (Google Provider, Callbacks).
- [x] 환경 변수 설정 (`AUTH_SECRET`, `GOOGLE_CLIENT_ID` 등).
- [x] `hooks/user/useAuthUser.ts` 생성: 클라이언트 컴포넌트용 인증 래퍼.

### Phase 2: 리포지토리 및 기본 액션

- **리포지토리 인터페이스 정의**:
- [x] `services/repositories/UserActionRepository.ts`: 사용자 및 액션 관련 타입 정의.
- [x] `services/repositories/LocalUserActionRepository.ts`: Local Storage 기반 리포지토리 구현.
- [x] `services/repositories/RemoteUserActionRepository.ts`: Supabase Server Action 기반 리포지토리 구현.
- **통합 훅**:
- [x] `hooks/user/useUserActions.ts`: 로그인 상태에 따라 Local/Remote 자동 분기 처리.
- **UI 컴포넌트**:
  - [x] `components/actions/LikeButton.tsx`, `SaveButton.tsx`, `LearnButton.tsx` 구현.
  - [x] **UI 반응성(Reactivity)**: 현재 `useUserActions`는 비동기 리포지토리를 반환하므로, 버튼 UI는 `useLocalActionStore`를 직접 구독하거나 훅을 개선하여 상태 변경을 즉시 반영해야 함.
  - [x] **Anonymous 제어**: 각 버튼 컴포넌트 내부에서 로그인 여부 체크 후 `LoginModal` 호출 로직 추가.

### Phase 3: UI 통합

- [x] **Login Modal**: 액션 시도 시 뜨는 가입 유도 모달.
- [x] **Action Buttons**: Like/Save/Learn 버튼 컴포넌트화 및 훅 연결.
- [x] **Login Trigger**: 헤더의 로그인 버튼 구현.
- [ ] **Trial Counter**: 오디오 재생 시 카운트 차감 및 제한 팝업 구현.

### Phase 4: 마이 페이지 & 랭킹

- **마이 페이지**:
  - [ ] `app/my/page.tsx`: 탭 UI (좋아요/저장/학습) 및 리스트 뷰 구현.
- **필터링**:
  - [ ] 메인 페이지(`app/page.tsx`)에 "학습한 표현 숨기기/보기" 토글 필터 추가.
- **랭킹**:
  - [ ] 주간 베스트 표현을 계산하는 SQL View 생성 및 UI 컴포넌트(`WeeklyBest.tsx`) 구현.

### Phase 5: 수익화 (Pro 전환)

- **결제**:
  - [ ] PayPal 구독 연동.
- **체험 관리 (TrialManager)**:
  - [ ] 오디오/블러 기능 사용 시 `trial_usage_count` 체크 및 증가 로직 구현.
  - [ ] 제한 도달 시 업그레이드 모달(`UpgradeModal.tsx`) 띄우기.
- **광고**:
  - [ ] 광고 플레이스홀더 컴포넌트 구현 및 등급별 조건부 렌더링.

### Phase 6: 플래시카드 & 폴리싱

- **플래시카드**:
  - [ ] "저장한 표현"을 기반으로 한 플래시카드 UI 구현.
- **디자인**:
  - [ ] 상호작용(좋아요/저장)된 카드의 시각적 스타일링(골드/핑크 보더) 적용.
- **마이그레이션 테스트**:
  - [ ] 무료 -> 유료 전환 시 데이터 동기화 시나리오 최종 점검.

---

> **참고**: 이 문서는 프로젝트의 핵심 설계 문서(Source of Truth)로 관리되며, 변경 사항 발생 시 지속적으로 업데이트됩니다. Supabase 관련 설정은 `docs/database/` 디렉토리를 참조하세요.
