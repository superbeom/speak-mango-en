# Monetization & Growth Strategy: "From Blog to SaaS"

> 이 문서는 `@monetization_brainstorming.md`에서 논의된 수익화 아이디어를 구체적인 **기술적 구현 로드맵(Technical Roadmap)**으로 변환한 결과물입니다.
> 핵심 전략은 **"Hybrid Data Storage" (Free=Local / Paid=Cloud)**를 통한 자연스러운 유료 전환 유도입니다.

## 1. Core Philosophy

**"사용자의 학습 데이터가 쌓일수록 서비스의 가치가 올라가고, 이탈 비용이 높아진다 (Data Lock-in)."**

- **Business Model**: Monthly Subscription (e.g., $9.99/month) via **PayPal**.
- **Free User**: 브라우저 로컬 스토리지(Local Storage)에 데이터 저장. 기기 간 연동 불가, 데이터 소멸 위험 존재.
- **Pro User**: Supabase DB에 데이터 저장. 멀티 디바이스 연동, 영구 보존, 심화 AI 분석 기능 제공.
- **Conversion Trigger**: "데이터의 안전한 보관"과 "연속성"을 원하는 시점에 자연스럽게 전환.

## 2. Technical Architecture: Hybrid Storage Layer

프론트엔드에서 사용자의 상태(Free/Pro)에 따라 저장소를 투명하게 스위칭하는 **Adapter Pattern**을 적용합니다.

```typescript
// Conceptual Interface
interface StorageAdapter {
  getBookmarks(): Promise<string[]>; // Expression IDs
  saveBookmark(id: string): Promise<void>;
  removeBookmark(id: string): Promise<void>;
  isSynced(): boolean; // true if DB, false if Local
}

// Adapters
class LocalStorageAdapter implements StorageAdapter { ... }
class SupabaseStorageAdapter implements StorageAdapter { ... }
```

### Data Migration (The "Aha!" Moment)

사용자가 회원가입/로그인하는 순간, `LocalStorageAdapter`의 데이터를 읽어 `SupabaseStorageAdapter`를 통해 DB로 일괄 전송(Sync)하는 로직이 **핵심 전환 포인트**입니다.

## 3. Database Schema Extension (Supabase)

기존 `daily_english` 스키마에 사용자 데이터를 관리하기 위한 테이블을 추가합니다.

### 3.1. `profiles` (User Management)

Supabase Auth의 `users` 테이블과 1:1 매핑됩니다.

```sql
create table daily_english.profiles (
  id uuid references auth.users not null primary key,
  tier text default 'free' check (tier in ('free', 'pro', 'admin')),
  created_at timestamptz default now()
  -- 추후 PayPal Subscription ID 등 추가
);
```

### 3.2. `user_bookmarks` (Simple Save)

사용자가 저장한 표현 목록입니다.

```sql
create table daily_english.user_bookmarks (
  user_id uuid references daily_english.profiles(id) on delete cascade,
  expression_id uuid references daily_english.expressions(id) on delete cascade,
  created_at timestamptz default now(),
  folder_name text default 'default', -- 추후 단어장 폴더 기능 대응
  primary key (user_id, expression_id)
);
```

### 3.3. `user_flashcards` (SRS Learning Data)

망각 곡선(Spaced Repetition System) 알고리즘 적용을 위한 학습 데이터입니다.

```sql
create table daily_english.user_flashcards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references daily_english.profiles(id) on delete cascade,
  expression_id uuid references daily_english.expressions(id) on delete cascade,
  status text default 'learning' check (status in ('new', 'learning', 'review', 'graduated')),
  next_review_at timestamptz default now(), -- 다음 복습 시점
  interval integer default 0, -- 복습 간격 (일)
  ease_factor float default 2.5, -- 난이도 계수
  review_count integer default 0, -- 총 학습 횟수
  last_reviewed_at timestamptz -- 마지막 학습 일시
);
```

## 4. Implementation Roadmap

### Phase 1: MVP - The Hook (Local Storage)

> **Goal**: 로그인 없이도 "저장"의 효용을 느끼게 함.

- [ ] **UI**: 메인 카드 및 상세 페이지에 '북마크(Star)' 버튼 추가.
- [ ] **Logic**: `LocalStorageAdapter` 구현 (Zustand with persist middleware 추천).
- [ ] **Page**: 'My Voca(나만의 단어장)' 페이지 생성 (로컬 데이터 기반 렌더링).
- [ ] **Limit**: 저장 개수 30개 도달 시 "로그인하여 무제한 저장하세요" 모달 띄우기 (Soft Lock).

### Phase 2: The Migration (Auth & DB Sync)

> **Goal**: 데이터 보존 욕구를 자극하여 가입 유도.

- [ ] **Auth**: Supabase Auth (Google Login) 연동.
- [ ] **Schema**: `profiles`, `user_bookmarks` 테이블 생성.
- [ ] **Logic**: `SupabaseAdapter` 구현 및 `AuthContext` 연동.
- [ ] **Feature**: **"내 단어장 가져오기"** (Local -> DB 마이그레이션) 기능 구현.

### Phase 3: Retention (Flashcards & SRS)

> **Goal**: 방문 습관 형성 및 유료화 명분 강화.

- [ ] **Logic**: 간단한 SRS(SuperMemo-2 변형) 알고리즘 구현.
- [ ] **UI**: 플래시카드 학습 모드 (앞면: 영어 / 뒷면: 뜻+예문).
- [ ] **Schema**: `user_flashcards` 테이블 생성.

### Phase 4: Monetization (Pro Features)

> **Goal**: 실제 수익 창출.

- [ ] **UI**: Pro 전용 뱃지 및 기능 잠금(Feature Gating) UI 적용.
- [ ] **AI Feature**: "이 표현으로 나만의 예문 만들기" (n8n Webhook 연동).
- [ ] **AI Feature**: "왜 틀렸는지 분석해줘" (AI Tutor).

## 5. Next Action Items

1. **DB Schema Update**: `profiles`, `user_bookmarks` 테이블 추가 스크립트 작성.
2. **Store Setup**: Zustand를 이용한 Hybrid Store 설계.
