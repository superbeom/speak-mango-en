# Supabase 다중 프로젝트 관리 전략 (Multi-Project Strategy)

## 1. 전략 개요 (Overview)

다수의 소규모 프로젝트를 효율적이고 경제적으로 운영하기 위해 **"단일 Supabase 계정 + 단일 Pro Project + 스키마 분리"** 전략을 채택합니다.

### 핵심 개념

- **물리적 통합**: 하나의 Supabase Pro Project ($25/월)를 모든 서비스가 공유합니다.
- **논리적 분리**: 각 서비스는 고유한 **Schema** (예: `daily_english`, `nix_chat`)를 사용하여 데이터와 권한을 격리합니다.

## 2. 장점 (Pros)

- **비용 절감**: 프로젝트마다 $25씩 낼 필요 없이, 하나의 요금제로 수십 개의 서비스를 운영 가능합니다.
- **관리 용이성**: API Key, Billing, Dashboard를 한 곳에서 중앙 관리할 수 있습니다.
- **유지보수**: Free Tier의 휴면(Pause) 문제를 방지할 수 있습니다.

## 3. 구현 가이드 (Implementation Guide)

### 3.1. 스키마 생성 및 설정

각 프로젝트 시작 시, `public` 스키마 대신 전용 스키마를 생성합니다.

```sql
-- 1. 스키마 생성
CREATE SCHEMA daily_english;

-- 2. 권한 설정 (선택사항: 특정 역할에만 접근 허용 시)
GRANT USAGE ON SCHEMA daily_english TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA daily_english TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA daily_english TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA daily_english TO anon, authenticated, service_role;
```

### 3.2. API 노출 설정 (Exposing Schema)

Supabase 대시보드에서 해당 스키마를 API로 접근 가능하도록 설정해야 합니다.

1.  **Settings** -> **Data API** 로 이동
2.  **Exposed schemas** 섹션 찾기
3.  `public` 외에 추가한 스키마(예: `daily_english`)를 리스트에 추가
4.  저장 (Save)

### 3.3. 클라이언트 연결 (Client Setup)

클라이언트(Frontend/Backend)에서 Supabase 초기화 시 스키마를 명시하거나, 쿼리 시 스키마를 지정해야 합니다.
유지보수성을 위해 스키마 이름은 `lib/constants.ts`에서 상수로 중앙 관리합니다.

**`lib/constants.ts`**:
```typescript
export const DATABASE_SCHEMA = "daily_english";
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
    }
  );
}
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
```

## 4. 확장 및 졸업 (Migration & Graduation)

특정 서비스의 트래픽이 급증하여 다른 서비스에 영향을 줄 경우:

1.  **덤프 (Dump)**: 해당 스키마(`daily_english`)의 데이터만 백업합니다.
2.  **이관 (Migrate)**: 새로운 Supabase 프로젝트를 생성하여 데이터를 복원합니다.
3.  **연결 변경**: 해당 서비스의 환경 변수(`SUPABASE_URL` 등)만 새 프로젝트로 교체합니다.
