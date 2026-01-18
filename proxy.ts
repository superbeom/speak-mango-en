import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale as DEFAULT_LOCALE, isSupportedLocale } from "@/i18n";
import { ROUTES } from "@/lib/routes";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;

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

  // 2. 쿼리 파라미터에서 언어 확인 (SEO/공유 링크용)
  const queryLang = request.nextUrl.searchParams.get("lang");
  let detectedLocale = DEFAULT_LOCALE;

  if (isSupportedLocale(queryLang)) {
    detectedLocale = queryLang;
  } else {
    // 2. 브라우저 언어 설정 확인 (Accept-Language 헤더)
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

  // 3. 서버 컴포넌트에서 읽을 수 있도록 커스텀 헤더 설정
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", detectedLocale);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 프록시(미들웨어)가 적용될 경로 설정
export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 미들웨어 적용:
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - public 폴더 내 이미지들
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*.svg|.*.png|.*.jpg).*)",
  ],
};
