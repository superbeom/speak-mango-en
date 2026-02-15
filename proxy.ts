import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  defaultLocale as DEFAULT_LOCALE,
  isSupportedLocale,
  SUPPORTED_LANGUAGES,
} from "@/i18n";
import { ROUTES } from "@/lib/routes";

// ---------------------------------------------------------------------------
// Auth Rate Limiter (Inline — Edge Runtime 호환)
// ---------------------------------------------------------------------------

const AUTH_RATE_LIMIT = 20; // 분당 최대 요청 수
const AUTH_WINDOW_MS = 60_000; // 1분 윈도우
const AUTH_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5분마다 정리
const authStore = new Map<string, number[]>();
let lastAuthCleanup = Date.now();

function cleanupAuthStoreIfNeeded(): void {
  const now = Date.now();
  if (now - lastAuthCleanup < AUTH_CLEANUP_INTERVAL_MS) return;
  lastAuthCleanup = now;

  const cutoff = now - AUTH_WINDOW_MS;
  for (const [key, timestamps] of authStore) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      authStore.delete(key);
    } else {
      authStore.set(key, valid);
    }
  }
}

function isAuthRateLimited(ip: string): boolean {
  cleanupAuthStoreIfNeeded();

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

// ---------------------------------------------------------------------------
// Proxy
// ---------------------------------------------------------------------------

export function proxy(request: NextRequest) {
  const url = request.nextUrl;

  // 0. Auth Rate Limit: /api/auth 경로에 대한 IP 기반 요청 빈도 제한
  if (url.pathname.startsWith("/api/auth")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isAuthRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        },
      );
    }

    // Auth 라우트는 locale 등 후속 처리 불필요 — 바로 통과
    return NextResponse.next();
  }

  // 1. /studio 경로 보안 설정 (Basic Auth)
  if (url.pathname.startsWith(ROUTES.STUDIO)) {
    const basicAuth = request.headers.get("authorization");

    if (basicAuth) {
      try {
        const authValue = basicAuth.split(" ")[1];
        const [user, pwd] = atob(authValue).split(":");

        if (
          user === process.env.ADMIN_USER &&
          pwd === process.env.ADMIN_PASSWORD
        ) {
          // 인증 성공 시 다음 단계로 진행 (언어 감지 로직으로)
        } else {
          return new NextResponse("Invalid credentials", {
            status: 401,
            headers: {
              "WWW-Authenticate": 'Basic realm="Speak Mango Admin"',
            },
          });
        }
      } catch {
        return new NextResponse("Authentication failed", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="Speak Mango Admin"',
          },
        });
      }
    } else {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Speak Mango Admin"',
        },
      });
    }
  }

  // 2. URL 경로에서 언어 감지 및 리라이팅 (Path-based Localization)
  const pathname = url.pathname;
  let detectedLocale = DEFAULT_LOCALE;
  let isPathLocale = false;
  let newPathname = pathname;

  // 경로가 지원하는 언어로 시작하는지 확인 (예: /ko, /ja/about)
  // 단, 기본 언어(en)가 아닌 경우에만 처리 (en은 루트 / 사용)
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === DEFAULT_LOCALE) continue;

    if (pathname === `/${lang}` || pathname.startsWith(`/${lang}/`)) {
      detectedLocale = lang;
      isPathLocale = true;
      // 경로에서 언어 코드 제거 (리라이팅용)
      newPathname = pathname.replace(`/${lang}`, "") || "/";
      break;
    }
  }

  // 3. 경로에 언어가 없을 경우: 기존 방식(쿼리/헤더) 또는 기본 언어 유지
  // 루트 경로('/') 접근 시 브라우저 설정에 따른 리다이렉트는 선택 사항이지만,
  // SEO를 위해 명시적인 URL(/ko)로 리다이렉트하는 것이 좋을 수 있음.
  // 현재는 기존 로직(쿼리/헤더 감지)을 유지하되, 리라이트가 필요 없는 경우에만 적용.
  if (!isPathLocale) {
    // 쿼리 파라미터에서 언어 확인 (SEO/공유 링크용)
    const queryLang = request.nextUrl.searchParams.get("lang");
    if (isSupportedLocale(queryLang)) {
      detectedLocale = queryLang;
    } else {
      // 브라우저 언어 설정 확인 (Accept-Language 헤더)
      const acceptLanguage = request.headers.get("accept-language");

      if (acceptLanguage) {
        // 가장 선호도가 높은 언어를 추출 (예: ko-KR,ko;q=0.9 -> ko)
        const preferredLocale = acceptLanguage
          .split(",")[0]
          .split("-")[0]
          .toLowerCase();

        if (isSupportedLocale(preferredLocale)) {
          detectedLocale = preferredLocale;
        }
      }
    }
  }

  // 4. 서버 컴포넌트에서 읽을 수 있도록 커스텀 헤더 설정
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", detectedLocale);
  requestHeaders.set("x-url", request.url);

  // 5. 리라이팅 또는 통과
  if (isPathLocale) {
    // 내부적으로 언어가 제거된 경로로 처리하되, locale 헤더를 전달
    url.pathname = newPathname;
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 프록시가 적용될 경로 설정
export const config = {
  matcher: [
    // Auth 라우트: Rate Limit 적용
    "/api/auth/:path*",
    /*
     * 아래 경로를 제외한 모든 요청에 프록시 적용:
     * - api (API 라우트 — auth 제외는 위에서 처리)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - public 폴더 내 이미지들
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)",
  ],
};
