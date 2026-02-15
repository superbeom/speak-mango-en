# Rate Limiting: 서버 액션 및 인증 라우트 보호

> **작성일**: 2026-02-15
> **상태**: Phase 1 완료 ✅ (Server Actions), Phase 2 완료 ✅ (Auth Route)
> **핵심 원칙**: "외부 의존성 없이, 기존 `withPro` 래퍼 구조를 활용한 최소 침습적 Rate Limit"

---

## 📋 목차

1. [무엇을 하는가 (What)](#1-무엇을-하는가-what)
2. [왜 하는가 (Why)](#2-왜-하는가-why)
3. [어떻게 하는가 (How)](#3-어떻게-하는가-how)
4. [Phase 1: Server Actions Rate Limit](#4-phase-1-server-actions-rate-limit)
5. [Phase 2: Auth Route Rate Limit](#5-phase-2-auth-route-rate-limit)
6. [설계 결정 사항 (Design Decisions)](#6-설계-결정-사항-design-decisions)
7. [알려진 제약 사항 및 모니터링 가이드](#7-알려진-제약-사항-및-모니터링-가이드)
8. [로컬 테스트 가이드](#8-로컬-테스트-가이드)

---

## 1. 무엇을 하는가 (What)

### 대상 엔드포인트

서비스에서 **쓰기 작업**을 수행하거나 **인증 플로우**를 처리하는 모든 서버 진입점에 Rate Limit을 적용합니다.

| 우선순위       | 대상                                | 식별자   | 제한    | 비고                    |
| :------------- | :---------------------------------- | :------- | :------ | :---------------------- |
| 🔴 **Phase 1** | `withPro` 래퍼 (모든 Server Action) | `userId` | 60회/분 | 인증된 사용자 기반      |
| 🟡 **Phase 2** | `/api/auth/[...nextauth]`           | `IP`     | 20회/분 | 무차별 로그인 시도 차단 |

### 적용 범위 (Phase 1)

`withPro` 래퍼를 통과하는 모든 서버 액션에 자동 적용됩니다:

```
services/actions/user.ts
├── toggleUserAction       (Learn 토글)
├── toggleSaveExpression   (Save 토글 + RPC)
└── syncUserActions        (Bulk Insert)

services/actions/vocabulary.ts
├── createVocabularyList
├── addToVocabularyList
├── removeFromVocabularyList
├── copyExpressionsToVocabularyList
├── moveExpressionsToVocabularyList
├── removeExpressionsFromVocabularyList
├── deleteVocabularyList
├── setDefaultVocabularyList
└── updateVocabularyListTitle
```

---

## 2. 왜 하는가 (Why)

### 위협 시나리오 1: 인증된 사용자의 API 남용

```
악의적 유저(Pro 구독 중) → DevTools에서 toggleSaveExpression 추출
→ for 루프로 1초에 100회 호출
→ DB에 100번의 RPC 실행 → Supabase Connection Pool 고갈
→ 다른 사용자의 정상적인 요청도 지연/실패
```

**현재 방어**: `withPro`가 인증/티어만 확인할 뿐, 요청 빈도는 제한하지 않음.

### 위협 시나리오 2: Auth 엔드포인트 남용

```
봇 → /api/auth/signin에 대량 POST 요청
→ NextAuth가 매 요청마다 CSRF 토큰 생성 + DB 세션 조회
→ Supabase 세션 테이블 부하 증가
→ 정상 사용자의 로그인 지연
```

**현재 방어**: Google OAuth로 비밀번호 brute force는 불가능하지만, 세션/CSRF 생성 부하는 방어되지 않음.

### 목표

- ✅ DB 과부하로 인한 서비스 장애 예방
- ✅ 인증된 사용자의 비정상적 사용 패턴 차단
- ✅ Auth 엔드포인트의 무차별 요청 방어
- ✅ 외부 서비스(Redis 등) 의존 없이 구현
- ✅ 기존 코드 최소 변경 (withPro 래퍼 활용)

---

## 3. 어떻게 하는가 (How)

### 기술 선택: In-Memory Sliding Window

| 방식              | 장점                               | 단점                                      | 선택             |
| :---------------- | :--------------------------------- | :---------------------------------------- | :--------------- |
| **In-Memory Map** | 외부 의존성 0, 구현 간단, 지연 0ms | 서버 재시작 시 리셋, 다중 인스턴스 미지원 | ✅ **채택**      |
| Upstash Redis     | 다중 인스턴스 지원, 영구 저장      | 외부 의존성 추가, 네트워크 지연           | 향후 스케일링 시 |
| Vercel KV         | Vercel 네이티브                    | 비용 발생, vendor lock-in                 | 향후 검토        |

> **판단 근거**: 현재 Vercel Hobby/Pro 플랜에서는 서버리스 함수가 단일 인스턴스로 실행되는 경우가 대부분이며, 트래픽이 초기 단계이므로 In-Memory 방식으로 충분합니다. 트래픽이 증가하여 다중 인스턴스가 필요해지면 Upstash Redis로 전환할 수 있습니다.

### 알고리즘: Sliding Window Counter

Fixed Window의 경계 문제(윈도우 교차 시점에 2배 요청 가능)를 줄이면서도 구현이 간단한 **Sliding Window Counter** 방식을 사용합니다.

```
[요청 타임스탬프 배열]

T=0s   T=30s   T=60s   T=90s
|------- Window 60s -------|
         |------- Window 60s -------|

- 새 요청 도착 시:
  1. 현재 시간 - windowMs 이전의 타임스탬프를 모두 제거
  2. 남은 타임스탬프 수가 limit 이상이면 → 차단
  3. 미만이면 → 현재 타임스탬프 추가 후 허용
```

### 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: Server Action Rate Limit                      │
│                                                         │
│  클라이언트 → Server Action 호출                            │
│       ↓                                                 │
│  withPro() 래퍼                                          │
│  ├── 1. getAuthSession() → userId 획득                   │
│  ├── 2. 인증 확인 (UNAUTHORIZED)                          │
│  ├── 3. Pro 확인 (PREMIUM_REQUIRED)                      │
│  ├── 4. ✨ checkRateLimit(userId) ← NEW                 │
│  │   ├── 통과 → action() 실행                             │
│  │   └── 초과 → RATE_LIMIT_EXCEEDED 에러 throw            │
│  └── 5. action(userId, isPro, ...args)                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Phase 2: Auth Route Rate Limit                         │
│                                                         │
│  클라이언트 → /api/auth/[...nextauth]                      │
│       ↓                                                 │
│  Next.js Proxy (proxy.ts)                               │
│  ├── 1. IP 추출 (x-forwarded-for / x-real-ip)            │
│  ├── 2. ✨ checkRateLimit(ip, authConfig)               │
│  │   ├── 통과 → NextResponse.next()                      │
│  │   └── 초과 → NextResponse(429, Retry-After)           │
│  └── 3. NextAuth 핸들러로 전달                             │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Phase 1: Server Actions Rate Limit

### 4.1 파일 구조

```
lib/server/
├── actionUtils.ts         (기존: withPro 래퍼 — 수정)
└── rateLimiter.ts         (신규: Rate Limiter 유틸리티)
```

### 4.2 `rateLimiter.ts` 설계

```typescript
// lib/server/rateLimiter.ts

interface RateLimitConfig {
  limit: number; // 윈도우 내 최대 요청 수
  windowMs: number; // 윈도우 크기 (ms)
}

// 기본 설정: 분당 60회
const DEFAULT_CONFIG: RateLimitConfig = { limit: 60, windowMs: 60_000 };

// In-Memory 저장소: key → 타임스탬프 배열
const store = new Map<string, number[]>();

// 주기적 메모리 정리 (5분마다)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

export function checkRateLimit(
  key: string,
  config?: Partial<RateLimitConfig>,
): void {
  // 1. 설정 병합
  // 2. 현재 윈도우 내 요청만 필터링
  // 3. limit 초과 시 에러 throw
  // 4. 통과 시 현재 타임스탬프 추가
}
```

### 4.3 `withPro` 래퍼 수정

```typescript
// lib/server/actionUtils.ts (변경 후)

import { checkRateLimit } from "./rateLimiter";

export function withPro<T extends unknown[], R>(action: AuthAction<T, R>) {
  return async (...args: T): Promise<R> => {
    const { userId, isPro } = await getAuthSession();
    if (!userId) throw createAppError(COMMON_ERROR.UNAUTHORIZED);
    if (!isPro) throw createAppError(COMMON_ERROR.PREMIUM_REQUIRED);

    // ✨ Rate Limit: userId 기반 (기본 60회/분)
    checkRateLimit(`action:${userId}`);

    return action(userId, isPro, ...args);
  };
}
```

> **핵심**: `withPro`에 한 줄만 추가하면 모든 Server Action에 자동 적용됩니다.

### 4.4 에러 처리

기존 `types/error.ts`의 에러 시스템을 확장합니다:

```typescript
export const COMMON_ERROR = {
  UNAUTHORIZED: { code: "UNAUTHORIZED", message: "인증이 필요합니다." },
  PREMIUM_REQUIRED: { code: "PREMIUM_REQUIRED", message: "유료 기능입니다." },
  RATE_LIMIT_EXCEEDED: {
    // ✨ NEW
    code: "RATE_LIMIT_EXCEEDED",
    message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  },
};
```

---

## 5. Phase 2: Auth Route Rate Limit

### 5.1 파일 구조

```
proxy.ts              (기존: locale/studio 처리 — Auth Rate Limit 추가)
```

### 5.2 Proxy 통합 설계

Next.js 16에서는 `middleware.ts` 대신 `proxy.ts`를 사용합니다. 기존 `proxy.ts`에는 locale 감지 및 Studio Basic Auth 로직이 있으므로, Auth Rate Limit을 **최상단에** 추가합니다.

```typescript
// proxy.ts (발췌 — Auth Rate Limit 부분)

const AUTH_RATE_LIMIT = 20;
const AUTH_WINDOW_MS = 60_000;
const authStore = new Map<string, number[]>();

function isAuthRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - AUTH_WINDOW_MS;
  const timestamps = authStore.get(ip) || [];
  const valid = timestamps.filter((t) => t > windowStart);

  if (valid.length >= AUTH_RATE_LIMIT) {
    authStore.set(ip, valid);
    return true;
  }
  valid.push(now);
  authStore.set(ip, valid);
  return false;
}

export function proxy(request: NextRequest) {
  // 0. Auth Rate Limit (최상단에서 /api/auth 경로 체크)
  if (url.pathname.startsWith("/api/auth")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isAuthRateLimited(ip)) {
      return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
    return NextResponse.next();
  }

  // 1. Studio Basic Auth ...
  // 2. Locale detection ...
}
```

### 5.3 설계 포인트

- **기존 proxy.ts 통합**: 별도 파일을 만들지 않고 기존 `proxy.ts`의 최상단에 Auth Rate Limit을 추가하여, 요청 처리 파이프라인의 일관성을 유지합니다.
- **Edge Runtime 인라인**: `proxy.ts`는 Edge Runtime에서 실행되므로 `@/lib/server/rateLimiter`를 import할 수 없습니다. 따라서 동일한 Sliding Window 알고리즘을 `proxy.ts` 내부에 경량으로 내장합니다.
- **IP 추출**: Vercel은 `x-forwarded-for` 헤더를 자동으로 주입하므로 이를 우선 사용합니다.
- **Early Return**: `/api/auth` 경로는 locale 처리가 불필요하므로 Rate Limit 확인 후 즉시 `NextResponse.next()`로 반환합니다.
- **429 응답**: HTTP 표준에 따라 `Retry-After` 헤더를 제공합니다.

---

## 6. 설계 결정 사항 (Design Decisions)

### Q1. 왜 외부 서비스(Redis)를 쓰지 않나요?

**답**: 현재 서비스 규모(사용자 수 ~수백명, Vercel Serverless)에서는 In-Memory로 충분합니다.

- Vercel Serverless 환경에서 함수 인스턴스는 "Warm" 상태에서 수 분간 유지됩니다.
- 이 기간 동안 In-Memory Map이 유효하여 Rate Limit이 작동합니다.
- Cold Start 시 리셋되더라도, 공격자는 새 인스턴스마다 다시 limit에 도달해야 합니다.
- 트래픽이 증가하면 `rateLimiter.ts`의 `store`만 Upstash Redis로 교체하면 됩니다.

### Q2. 왜 Sliding Window인가?

**답**: Fixed Window는 윈도우 경계까지 60회 + 경계 직후 60회 = 120회가 가능한 burst 문제가 있습니다.
Sliding Window는 이를 자연스럽게 방지하면서도 구현이 간단합니다.

### Q3. 메모리 누수는 괜찮은가?

**답**: 주기적 정리(Cleanup) 메커니즘을 내장합니다.

- 5분마다 만료된 윈도우 데이터를 자동 삭제합니다.
- Vercel Serverless는 함수 인스턴스 자체가 주기적으로 재생성되므로 장기 메모리 누수 위험이 매우 낮습니다.

### Q4. Free 유저의 Server Action은?

**답**: 현재 `withPro`는 Free 유저를 `PREMIUM_REQUIRED`로 거부합니다. 따라서 Free 유저의 서버 액션 자체가 실행되지 않아 Rate Limit 대상이 아닙니다. Free 유저의 데이터는 모두 localStorage에서 처리됩니다.

### Q5. 제한에 걸릴 때 클라이언트 UX는?

**답**: 기존 서버 액션 에러 처리 흐름(`catch → rollback`)이 그대로 작동합니다.

- `toggleAction`의 `catch` 블록에서 `resolveOperation` 롤백이 실행됩니다.
- 사용자에게는 "잠시 후 다시 시도해주세요" 메시지가 표시됩니다.
- 낙관적 업데이트가 즉시 되돌려지므로 UI 정합성이 유지됩니다.

---

## 7. 알려진 제약 사항 및 모니터링 가이드

In-Memory 방식의 한계를 인지하고, 트래픽 증가에 따른 대응 전략을 정리합니다.

### 7.1 다중 인스턴스 Rate Limit 분산

**제약**: Vercel Serverless/Edge는 트래픽에 따라 여러 인스턴스를 동시에 생성합니다. 각 인스턴스가 별도의 In-Memory Map을 유지하므로:

- 요청이 여러 인스턴스에 분산되면 **실제 요청 횟수가 설정된 limit의 N배(인스턴스 수)**가 될 수 있습니다.
- 공격자가 의도적으로 지연(slow requests)이나 동시 요청으로 인스턴스를 분산시키면 Rate Limit을 우회할 수 있습니다.

**현재 판단**: Vercel Hobby/Pro 플랜에서는 동시 인스턴스 수가 제한적이며, 현재 트래픽 규모에서는 실질적 위협이 낮습니다.

**대응 전략**:

- **단기**: 현재 방식 유지 (In-Memory)
- **중기**: 트래픽이 증가하여 동시 인스턴스 수가 늘어나면 Upstash Redis로 전환 (중앙화된 저장소로 인스턴스 간 공유)
- **장기**: Cloudflare/Vercel WAF 등 플랫폼 레벨 Rate Limit 활용

### 7.2 IP 추출 신뢰성 (Phase 2)

**현재 방식**: `x-forwarded-for` → `x-real-ip` → `"unknown"` 순서로 fallback.

**Vercel 환경에서의 신뢰성**: Vercel은 엣지 네트워크에서 `x-forwarded-for`를 자동으로 주입하고 기존 헤더를 덮어쓰므로, **Vercel 배포 환경에서는 위조 위험이 낮습니다.**

**알려진 취약점**:

- `"unknown"` IP가 별도 버킷으로 할당되므로, IP 헤더가 없는 비정상 요청이 이 버킷을 공유합니다. Vercel은 항상 `x-forwarded-for`를 주입하므로 `"unknown"`에 도달하는 요청 자체가 비정상일 가능성이 높습니다.
- 셀프 호스팅 전환 시, 리버스 프록시(Nginx 등)의 `set_real_ip_from` 설정이 없으면 클라이언트가 헤더를 위조할 수 있습니다.
- VPN/프록시 풀을 통한 IP 순환 공격은 IP 기반 Rate Limit의 구조적 한계이며, WAF 레이어에서 대응해야 합니다.

**향후 개선 고려**:

- `"unknown"` IP에 대해 더 낮은 limit(예: 5회/분)을 적용하거나 즉시 차단
- 셀프 호스팅 전환 시 리버스 프록시의 신뢰할 수 있는 IP 설정 확인 필수

### 7.3 Map 메모리 성능

**현재 방어**: `rateLimiter.ts`와 `proxy.ts` 모두 5분 주기 cleanup으로 만료된 엔트리를 자동 삭제합니다.

**대규모 트래픽 시 우려**:

- 수천 ~ 수만 개의 고유 키(userId/IP)가 동시에 Map에 존재하면 cleanup 시 `filter` 연산에 의한 CPU 사용량이 일시적으로 증가할 수 있습니다.
- Vercel Serverless 인스턴스가 주기적으로 재생성되므로 장기 누적 위험은 낮지만, 트래픽 스파이크 시 주의가 필요합니다.

**모니터링 권장 사항** (트래픽 증가 시):

- Map 크기가 특정 임계치(예: 10,000개)를 초과할 때 경고 로그 추가 고려
- Upstash Redis 전환 시점의 지표로 활용

---

## 8. 로컬 테스트 가이드

### 8.1 Phase 1 테스트: Server Actions Rate Limit

**목적**: Save/Learn 등 Server Action이 limit 초과 시 올바르게 차단되고, 사용자에게 에러 토스트가 표시되며, 낙관적 업데이트가 롤백되는지 검증합니다.

**절차**:

1. `lib/server/rateLimiter.ts`의 `DEFAULT_CONFIG.limit`을 일시적으로 낮춥니다:

   ```typescript
   const DEFAULT_CONFIG: RateLimitConfig = {
     // limit: 60,  // 원래 값
     limit: 5, // 테스트용
     windowMs: 60_000,
   };
   ```

2. Dev 서버를 재시작합니다 (`npm run dev`).

3. 브라우저에서 Pro 유저로 로그인 후, **Save** 또는 **Learn** 버튼을 빠르게 6번 이상 클릭합니다.

4. 다음 항목을 검증합니다:

   | #   | 검증 항목            | 기대 결과                                                         |
   | --- | -------------------- | ----------------------------------------------------------------- |
   | 1   | 1~5번째 클릭         | 정상 동작 (Save/Learn 토글)                                       |
   | 2   | 6번째 클릭           | 에러 토스트 표시 ("Too many requests. Please try again shortly.") |
   | 3   | 낙관적 업데이트 롤백 | 6번째 클릭의 UI 변경이 즉시 되돌려짐                              |
   | 4   | 1분 경과 후          | 다시 정상 동작                                                    |

5. ⚠️ **테스트 후 반드시 `limit: 60`으로 원복합니다.**

**디버그 방법** (에러가 발생하지 않는 경우):

`checkRateLimit` 함수에 디버그 로그를 추가하여 서버 터미널에서 상태를 확인합니다:

```typescript
// checkRateLimit 내부, windowTimestamps 필터링 후 추가:
console.log(
  `[RateLimit] key=${key} | count=${windowTimestamps.length}/${limit} | storeSize=${store.size}`,
);
```

정상 출력 예시:

```
[RateLimit] key=action:abc123 | count=0/5 | storeSize=0
[RateLimit] key=action:abc123 | count=1/5 | storeSize=1
[RateLimit] key=action:abc123 | count=2/5 | storeSize=1
[RateLimit] key=action:abc123 | count=3/5 | storeSize=1
[RateLimit] key=action:abc123 | count=4/5 | storeSize=1
→ 6번째 요청에서 RATE_LIMIT_EXCEEDED throw
```

매번 `count=0 | storeSize=0`으로 리셋되면, dev 모드에서 모듈이 재평가되어 In-Memory Map이 초기화되는 것입니다. 이 경우 `globalThis`에 store를 저장하는 패턴으로 우회할 수 있습니다.

### 8.2 Phase 2 테스트: Auth Route Rate Limit

**목적**: `/api/auth` 경로에 대한 IP 기반 Rate Limit이 올바르게 429 응답을 반환하는지 검증합니다.

**절차**:

1. `proxy.ts`의 `AUTH_RATE_LIMIT`을 일시적으로 낮춥니다:

   ```typescript
   // const AUTH_RATE_LIMIT = 20;  // 원래 값
   const AUTH_RATE_LIMIT = 5; // 테스트용
   ```

2. Dev 서버를 재시작합니다.

3. 터미널에서 cURL로 연속 요청합니다:

   ```bash
   for i in $(seq 1 8); do
     STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/session)
     echo "Request $i: HTTP $STATUS"
   done
   ```

4. 다음 항목을 검증합니다:

   | #   | 검증 항목    | 기대 결과                                                                                 |
   | --- | ------------ | ----------------------------------------------------------------------------------------- |
   | 1   | 1~5번째 요청 | HTTP 200 (또는 302 등 정상 응답)                                                          |
   | 2   | 6~8번째 요청 | HTTP 429 (Too Many Requests)                                                              |
   | 3   | 응답 헤더    | `Retry-After: 60` 포함                                                                    |
   | 4   | 응답 바디    | `{"error": "Too Many Requests", "message": "Too many requests. Please try again later."}` |

5. ⚠️ **테스트 후 반드시 `AUTH_RATE_LIMIT = 20`으로 원복합니다.**

### 8.3 주의사항

- **Dev 모드 한계**: Next.js dev 모드에서는 HMR(Hot Module Replacement)이 서버 모듈을 재평가할 수 있어 In-Memory Map이 리셋될 수 있습니다. **파일을 수정한 직후에는 Map이 초기화되므로**, 설정 변경 후 반드시 dev 서버를 재시작하거나 파일 수정 없이 테스트해야 합니다.
- **원복 필수**: 테스트용으로 낮춘 limit 값은 반드시 원래 값으로 되돌려야 합니다. 커밋 전 `git diff`로 확인을 권장합니다.
