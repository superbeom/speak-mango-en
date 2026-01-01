import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["ko", "ja", "es"];
const DEFAULT_LOCALE = "ko";

export function middleware(request: NextRequest) {
  // 1. 브라우저 언어 설정 확인 (Accept-Language 헤더)
  const acceptLanguage = request.headers.get("accept-language");
  let detectedLocale = DEFAULT_LOCALE;

  if (acceptLanguage) {
    // 가장 선호도가 높은 언어를 추출 (예: ko-KR,ko;q=0.9 -> ko)
    const preferredLocale = acceptLanguage
      .split(",")[0]
      .split("-")[0]
      .toLowerCase();

    if (SUPPORTED_LOCALES.includes(preferredLocale)) {
      detectedLocale = preferredLocale;
    }
  }

  // 2. 서버 컴포넌트에서 읽을 수 있도록 커스텀 헤더 설정
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", detectedLocale);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 미들웨어가 적용될 경로 설정
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
