import { useMediaQuery } from "./useMediaQuery";

// Tailwind 'sm' breakpoint (640px)
// max-width: 639px까지를 모바일로 간주 (640px부터는 sm 이상)
const MOBILE_BREAKPOINT = "(max-width: 639px)";

export function useIsMobile() {
  return useMediaQuery(MOBILE_BREAKPOINT);
}

/**
 * 모바일이 아닐 때(데스크탑) 혹은 초기 로딩 시(SSR) 호버 효과를 활성화할지 여부를 반환합니다.
 * 모바일 환경에서는 호버 효과를 비활성화하여 터치 시 의도치 않은 스타일 적용을 방지합니다.
 */
export function useEnableHover() {
  const isMobile = useIsMobile();
  // isMobile이 undefined(초기값)일 때는 데스크탑으로 간주하여 호버를 활성화(Hydration Mismatch 방지)
  // isMobile이 false(데스크탑)일 때도 활성화
  return isMobile === false || isMobile === undefined;
}
