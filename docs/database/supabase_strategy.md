# Supabase 다중 프로젝트 관리 전략 (Multi-Project Strategy)

## 1. 전략 개요 (Overview)

다수의 소규모 프로젝트를 효율적이고 경제적으로 운영하기 위해 **"단일 Supabase 계정 + 단일 Pro Project + 스키마 분리"** 전략을 채택합니다.

### 핵심 개념

- **물리적 통합**: 하나의 Supabase Pro Project ($25/월)를 모든 서비스가 공유합니다.
- **논리적 분리**: 각 서비스는 고유한 **Schema** (예: `speak_mango`, `nix_chat`)를 사용하여 데이터와 권한을 격리합니다.

## 2. 장점 (Pros)

- **비용 절감**: 프로젝트마다 $25씩 낼 필요 없이, 하나의 요금제로 수십 개의 서비스를 운영 가능합니다.
- **관리 용이성**: API Key, Billing, Dashboard를 한 곳에서 중앙 관리할 수 있습니다.
- **유지보수**: Free Tier의 휴면(Pause) 문제를 방지할 수 있습니다.

## 3. Case Study: Speak Mango (Multi-Language Service)

Speak Mango와 같이 **서브 도메인으로 언어별 서비스를 분리**하고, 콘텐츠가 서로 독립적이면서도 사용자 데이터를 공유해야 하는 경우의 전략입니다.

### 3.1. 하이브리드 스키마 아키텍처 (Hybrid Schema Architecture)

**"Global User, Local Content"** 전략을 사용하여 콘텐츠의 독립성과 사용자 경험의 통합성을 동시에 확보합니다.

1.  **Content Schemas (Local)**: 각 언어별 학습 콘텐츠를 저장합니다.
    - `speak_mango_en`: 영어 학습 콘텐츠 (예: `expressions` 테이블)
    - `speak_mango_ko`: 한국어 학습 콘텐츠
    - `speak_mango_es`: 스페인어 학습 콘텐츠
    - **특징**: 서로 간섭하지 않으며, 독립적인 확장 및 수정이 가능합니다.

2.  **Shared Schema (Global)**: 모든 언어 서비스가 공유하는 사용자 및 공통 데이터입니다.
    - **Schema Name**: `speak_mango_shared`
    - **Tables**:
      - `profiles`: 사용자 프로필 (`auth.users`와 1:1 매핑)
      - `vocabularies`: 통합 단어장 메타데이터
      - `vocabulary_items`: 단어장 아이템 (`target_lang`으로 각 언어 스키마 참조)
    - **특징**: 모든 서브 도메인 서비스에서 공통으로 접근하여 로그인 유지 및 통합 단어장 기능을 제공합니다.

### 3.2. 통합 단어장 설계 예시

`speak_mango_shared` 스키마 내의 `vocabulary_items` 테이블 구조입니다.

```sql
CREATE TABLE speak_mango_shared.vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES speak_mango_shared.profiles(id),

  -- Reference Logic
  target_lang TEXT NOT NULL, -- 'en', 'ko', 'es' (어떤 스키마를 조회할지 결정)
  expression_id UUID NOT NULL, -- 해당 스키마 내의 expression UUID

  -- Caching (Optional, for list view performance)
  cached_expression TEXT,
  cached_meaning TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3. 장점

- **유연성**: 영어 서비스와 한국어 서비스의 콘텐츠 구조(컬럼 등)가 달라도 문제없습니다.
- **통합성**: 사용자는 하나의 계정으로 모든 언어의 학습 기록을 한곳에서 관리할 수 있습니다.
- **안정성**: 특정 언어 서비스의 데이터 문제가 전체 사용자 DB나 다른 언어 서비스로 전파되지 않습니다.

## 4. 서비스 간 회원 분리 전략 (Service Isolation)

`auth.users` 테이블은 Supabase 프로젝트(`Lumio Studio`) 전체에서 공유되므로, 서로 다른 서비스(예: `Speak Mango` vs `Style Studio`)의 회원을 구분하는 전략이 필요합니다.

### 4.1. 프로필 테이블을 통한 접근 제어 (Profile-Based Access)

각 서비스의 스키마 내에 `profiles` 테이블을 별도로 생성하고, `auth.users` 테이블의 `id`를 외래키(Foreign Key)로 참조하여 1:1 관계를 맺습니다.

**SQL 구현 예시:**

```sql
-- Speak Mango (Shared Schema)
CREATE TABLE speak_mango_shared.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  avatar_url TEXT
);

-- Style Studio (Isolated Schema)
CREATE TABLE style_studio.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  style_preference TEXT,
  body_measurements JSONB
);
```

**핵심 원리:**

- **`auth.users`**: 모든 서비스의 계정 정보가 저장되는 통합 저장소 (SSO 역할).
- **`REFERENCES auth.users(id)`**: 프로필 테이블의 `id`가 실제 인증된 사용자의 `id`와 일치하도록 강제합니다.
- **분리 효과**: 사용자가 `Speak Mango`에 가입하면 `speak_mango_shared.profiles`에만 레코드가 생성됩니다. 이 사용자가 `Style Studio`에 로그인하려 하면 `style_studio.profiles`에는 레코드가 없으므로 "미가입 상태"로 처리할 수 있습니다.
- **`speak_mango_shared.profiles`**: Speak Mango 가입자만 레코드를 가짐.
- **`style_studio.profiles`**: Style Studio 가입자만 레코드를 가짐.

### 4.2. 동작 흐름 (Flow)

1.  **로그인 시도**: 사용자가 Speak Mango에서 로그인을 시도합니다.
2.  **Auth 체크**: `auth.users`에서 계정 인증 (성공).
3.  **서비스 권한 체크**: `speak_mango_shared.profiles` 테이블에서 해당 `user_id` 조회.
    - **데이터 있음**: 정상 로그인 처리.
    - **데이터 없음**: "서비스 가입이 필요합니다" 메시지 출력 및 약관 동의/프로필 생성 페이지로 이동.

> **💡 Naming Note: Why 'profiles' not 'users'?**
> Supabase는 내부적으로 `auth.users`라는 시스템 테이블을 사용합니다. 혼동을 방지하고 "인증 정보(User)"와 "사용자 정보(Profile)"를 명확히 구분하기 위해, 애플리케이션 레벨의 테이블은 관례적으로 `profiles`라고 명명합니다.

## 5. 인증 스키마 전략 (Authentication Schema Strategy)

NextAuth와 같이 자체적인 테이블 구조와 명명 규칙(CamelCase)을 강제하는 외부 라이브러리를 통합할 때 사용하는 **"View Proxy Pattern"**입니다.

### 5.1 View Proxy Architecture

데이터베이스의 표준(`snake_case`)을 해치지 않으면서 외부 라이브러리의 요구사항(`camelCase`)을 수용하기 위해, **전용 스키마와 Updatable View**를 활용합니다.

1.  **Data Schema (`speak_mango_en`)**:
    - **역할**: 실제 데이터 저장소 (Physical Storage).
    - **규칙**: PostgreSQL 표준인 **Snake Case** (`user_id`, `session_token`) 준수.
    - **테이블**: `users`, `accounts`, `sessions`.

2.  **Auth Schema (`speak_mango_en_next_auth`)**:
    - **역할**: 외부 라이브러리용 인터페이스 (Logical Interface).
    - **규칙**: 라이브러리가 요구하는 **Camel Case** (`userId`, `sessionToken`) 준수.
    - **구성**: 실제 테이블이 아닌, Data Schema를 가리키는 **View**로만 구성.

### 5.2 Implementation Example

```sql
-- 1. Create Data Schema (Snake Case)
CREATE TABLE speak_mango_en.users (
  id UUID PRIMARY KEY,
  email_verified TIMESTAMPTZ,
  ...
);

-- 2. Create Auth Schema
CREATE SCHEMA speak_mango_en_next_auth;

-- 3. Create View (Mapping)
CREATE VIEW speak_mango_en_next_auth.users AS
SELECT
  id,
  email_verified AS "emailVerified" -- CamelCase로 변환
FROM speak_mango_en.users;

-- 4. Grant Permissions
GRANT ALL ON ALL TABLES IN SCHEMA speak_mango_en_next_auth TO service_role;
```

이 전략을 통해 **"DB는 DB답게, 코드는 코드답게"** 유지할 수 있습니다.

### 5.3 Custom JWT Strategy (RLS Enforcement)

#### 5.3.1 왜 Custom JWT가 필요한가요? (Why?)

보통 Supabase를 사용하면 `Supabase Auth` (GoTrue)가 제공하는 `auth.users` 테이블과 로그인 기능을 사용합니다. 이 경우 RLS(`auth.uid()`)가 자동으로 작동합니다.

하지만 우리 프로젝트는 다음과 같은 구조적 이유로 **Supabase Auth를 사용하지 않습니다**:

1.  **자체 User Schema**: 모든 사용자 정보는 `speak_mango_en.users` 테이블에서 직접 관리합니다.
2.  **NextAuth 의존성**: 인증 흐름(로그인/세션)을 NextAuth.js가 전담합니다.

**문제점**: NextAuth로 로그인해도, Supabase DB 입장에서는 클라이언트가 보낸 요청이 "누구"인지 알 수 있는 수단이 없습니다 (익명 `anon` 취급). 따라서 `auth.uid()`를 사용하는 보안 정책(RLS)을 적용할 수 없게 됩니다.

**해결책**:
NextAuth 세션의 사용자 ID(`sub`)를 담은 **"Supabase 호환 신분증(JWT)"**을 서버에서 직접 발급하여 Supabase에 제출합니다. 이를 통해 Supabase는 비로소 "아, 이 요청은 ID가 `xyz`인 사용자가 보낸 것이군!" 하고 인식하게 됩니다.

#### 5.3.2 Implementation Steps

1.  **Secret 확보**: 서명을 위한 비밀키(`SUPABASE_JWT_SECRET`)를 확보합니다.
    - **위치**: Supabase Dashboard -> **Project Settings** (톱니바퀴 아이콘) -> **JWT Keys** -> **Legacy JWT Secret**
    - **주의**: 이 값은 절대 클라이언트에 노출되면 안 됩니다 (`.env` 관리 필수).

2.  **Server Signing**:
    - `createServerSupabase` 호출 시 `NextAuth` 세션에서 `userId`를 추출합니다.
    - `jsonwebtoken` 라이브러리를 사용해 `SUPABASE_JWT_SECRET`으로 서명된 토큰을 생성합니다.
    - Payload에는 Supabase가 요구하는 필수 클레임(`aud`, `exp`, `sub`, `role`)을 포함합니다.

3.  **Client Injection**: 생성된 토큰을 `global.headers.Authorization`에 `Bearer {token}` 형태로 주입하여 Supabase 클라이언트를 초기화합니다.

**Result**: 이제 Supabase는 요청을 보낸 주체가 누구인지(`auth.uid()`) 명확히 인식하며, 강력한 RLS 정책(`using (auth.uid() = user_id)`)을 적용할 수 있습니다.

## 6. 구현 가이드 (Implementation Guide)

### 6.1. 스키마 생성 및 설정

각 프로젝트 시작 시, `public` 스키마 대신 전용 스키마를 생성합니다.

```sql
-- 1. 스키마 생성
CREATE SCHEMA speak_mango_en;
CREATE SCHEMA speak_mango_shared;

-- 2. 권한 설정 (선택사항: 특정 역할에만 접근 허용 시)
GRANT USAGE ON SCHEMA speak_mango_en TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA speak_mango_en TO anon, authenticated, service_role;
-- (Shared 스키마도 동일하게 설정)
GRANT USAGE ON SCHEMA speak_mango_shared TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA speak_mango_shared TO anon, authenticated, service_role;
```

### 6.2. API 노출 설정 (Exposing Schema)

Supabase 대시보드에서 해당 스키마를 API로 접근 가능하도록 설정해야 합니다.

1.  **Settings** -> **Data API** 로 이동
2.  **Exposed schemas** 섹션 찾기
3.  `public` 외에 추가한 스키마(예: `speak_mango_en`, `speak_mango_shared`)를 리스트에 추가
4.  저장 (Save)

### 6.3. 클라이언트 연결 (Client Setup)

#### Scenario A: Single Schema (Basic)

대부분의 프로젝트처럼 하나의 서비스가 하나의 스키마만 사용하는 경우입니다. (예: `nix_chat`)
클라이언트(Frontend/Backend)에서 Supabase 초기화 시 스키마를 명시하거나, 쿼리 시 스키마를 지정해야 합니다.
유지보수성을 위해 스키마 이름은 `lib/constants.ts`에서 상수로 중앙 관리합니다.

**`lib/constants.ts`**:

```typescript
export const DATABASE_SCHEMA = "nix_chat";
```

**`lib/supabase/client.ts` (Browser Client)**:

```typescript
import { createBrowserClient } from "@supabase/ssr";
import { DATABASE_SCHEMA } from "@/lib/constants";

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: DATABASE_SCHEMA },
    },
  );
}

/**
 * [Browser Client 사용 예시]
 * import { createBrowserSupabase } from "@/lib/supabase/client";
 *
 * const supabase = createBrowserSupabase(); // uses 'nix_chat' schema
 * const { data } = await supabase.from('messages').select('*');
 */
```

**`lib/supabase/server.ts` (Server Client)**:

```typescript
// ... imports ...
import { DATABASE_SCHEMA } from "@/lib/constants";

export async function createServerSupabase() {
  // ... cookie logic ...
  return createServerClient(..., {
    db: { schema: DATABASE_SCHEMA },
    // ...
  });
}

/**
 * [Server Client 사용 예시]
 * import { createServerSupabase } from "@/lib/supabase/server";
 *
 * const supabase = await createServerSupabase(); // uses 'nix_chat' schema
 * const { data } = await supabase.from('messages').select('*');
 */
```

#### Scenario B: Multi Schema (Advanced)

Speak Mango처럼 서비스 데이터(`speak_mango_en`)와 공유 데이터(`speak_mango_shared`)를 함께 다루는 경우입니다.
`createBrowserSupabase` 및 `createServerSupabase` 함수가 스키마 이름을 인자로 받아 동적으로 클라이언트를 생성합니다.

**`lib/constants.ts`**:

```typescript
export const DATABASE_SCHEMA = "speak_mango_en"; // 각 서비스에 맞게 설정 (Local)
export const SHARED_SCHEMA = "speak_mango_shared"; // 공유 스키마 (Global)
```

**`lib/supabase/client.ts` (Browser Client)**:

```typescript
import { createBrowserClient } from "@supabase/ssr";
import { DATABASE_SCHEMA } from "@/lib/constants";

// schema 인자를 추가하여 필요에 따라 공유 스키마에 접근 가능하게 합니다. (기본값: 로컬 콘텐츠 스키마)
export function createBrowserSupabase(schema: string = DATABASE_SCHEMA) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema },
    },
  );
}

/**
 * [Browser Client 사용 예시]
 *
 * 1. 로컬 콘텐츠 가져오기 (speak_mango_en)
 * const supabase = createBrowserSupabase();
 * const { data } = await supabase.from('expressions').select('*');
 *
 * 2. 공유 사용자 프로필 가져오기 (speak_mango_shared)
 * import { SHARED_SCHEMA } from "@/lib/constants";
 * const sharedSupabase = createBrowserSupabase(SHARED_SCHEMA);
 * const { data: profile } = await sharedSupabase.from('profiles').select('*').single();
 */
```

**`lib/supabase/server.ts` (Server Client)**:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DATABASE_SCHEMA } from "@/lib/constants";

export async function createServerSupabase(schema: string = DATABASE_SCHEMA) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* 서버 컴포넌트에서 호출 시 예외 처리 */
          }
        },
      },
    },
  );
}

/**
 * [Server Client 사용 예시]
 *
 * // app/page.tsx (Server Component)
 * import { createServerSupabase } from "@/lib/supabase/server";
 * import { SHARED_SCHEMA } from "@/lib/constants";
 *
 * export default async function Page() {
 *   // 1. 로컬 콘텐츠 (expressions)
 *   const supabase = await createServerSupabase();
 *   const { data: expressions } = await supabase.from('expressions').select('*');
 *
 *   // 2. 공유 데이터 (profiles) - 필요한 경우
 *   const sharedSupabase = await createServerSupabase(SHARED_SCHEMA);
 *   const { data: user } = await sharedSupabase.auth.getUser();
 *   const { data: profile } = await sharedSupabase
 *     .from('profiles')
 *     .select('*')
 *     .eq('id', user.user?.id)
 *     .single();
 *
 *   return <div>...</div>;
 * }
 */
```

## 7. Storage 관리 전략 (Storage Management Strategy)

데이터베이스와 마찬가지로 스토리지 또한 단일 프로젝트 내에서 다수의 서비스를 효율적으로 관리하기 위한 구조를 채택합니다.

### 7.1. 버킷 명명 규칙 (Bucket Naming)

- **규칙**: 서비스 식별자(Project Name)를 버킷명으로 사용합니다.
- **예시**: `speak-mango-en`, `style-studio`
- **장점**: 특정 용도(예: `audio`)로 한정하지 않아 하나의 버킷을 해당 서비스의 통합 저장소로 활용 가능합니다.

### 7.2. 하위 폴더를 통한 자산 격리 (Folder-based Isolation)

버킷 루트에 파일을 직접 저장하지 않고, 데이터의 성격에 따라 하위 폴더를 생성하여 관리합니다. 특히 하나의 리소스(예: 단어장 아이템)가 여러 종류의 자산(음성, 이미지 등)을 가질 경우, 아래와 같이 자산 타입별로 하위 폴더를 나누어 관리하는 것이 확장성에 매우 유리합니다.

- **Expressions (Audio)**: `expressions/{expression_id}/{line_index}.wav` (DB에는 이 상대 경로를 저장하고 클라이언트에서 URL 완성)
- **Vocas (Audio)**: `vocas/audios/{voca_id}/{word}.wav`
- **Vocas (Image)**: `vocas/images/{voca_id}/{word}.png`
- **Users**: `users/{user_id}/avatar.png`
- **General Images**: `images/banners/hero.webp`

### 7.3. 확장성 및 이점 (Extensibility)

1.  **관리 효율**: 서비스와 관련된 모든 바이너리 자산(음성, 이미지, 문서 등)을 하나의 버킷 내에서 체계적으로 관리할 수 있습니다.
2.  **보안 정책(RLS)**: Supabase Storage 정책 설정 시 폴더 경로 패턴을 기반으로 권한을 세밀하게 제어할 수 있습니다. (예: `users/` 폴더는 본인만 접근 가능하도록 설정)
3.  **루트 혼잡 방지**: 파일 종류별로 폴더를 강제함으로써 루트 경로가 수많은 파일로 어지럽혀지는 것을 방지합니다.

> **⚠️ 보안 고도화 주의사항 (Audio Feature Gating)**
> 현재 음성 파일 버킷은 개발 편의 및 MVP 단계를 위해 **Public**으로 설정되어 있습니다. 향후 `docs/product/future_todos.md`에 정의된 **'유료 사용자에게만 음성 제공'** 기능을 구현할 때는 다음의 절차를 반드시 준수해야 합니다.

> - **버킷 전환**: 버킷 권한을 `Public`에서 **`Private`**으로 변경.
> - **RLS 적용**: `storage.objects` 테이블에 유료 사용자 여부(프로필 티어 등)를 확인하는 **Storage Policy(RLS)**를 추가하여 접근 제어.
> - **접근 방식**: 프론트엔드에서 직통 URL 대신 Supabase SDK의 `createSignedUrl`을 사용하거나 정책 기반의 인증 세션을 통해 파일에 접근.

## 8. 확장 및 졸업 (Migration & Graduation)

특정 서비스의 트래픽이 급증하여 다른 서비스에 영향을 줄 경우:

1.  **덤프 (Dump)**: 해당 스키마(`speak_mango_en`)의 데이터만 백업합니다.
2.  **이관 (Migrate)**: 새로운 Supabase 프로젝트를 생성하여 데이터를 복원합니다.
3.  **연결 변경**: 해당 서비스의 환경 변수(`SUPABASE_URL` 등)만 새 프로젝트로 교체합니다.
