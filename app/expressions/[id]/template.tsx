"use client";

import { useLayoutEffect } from "react";
import { SCROLL_RESET_KEY } from "@/constants";

export default function Template({ children }: { children: React.ReactNode }) {
    useLayoutEffect(() => {
        // 1. 상세 페이지는 항상 브라우저의 기본 스크롤 동작(auto)을 사용해야 합니다.
        if ("scrollRestoration" in history) {
            history.scrollRestoration = "auto";
        }

        // 2. 명시적인 스크롤 리셋 신호가 있는지 확인합니다.
        // ExpressionCard 클릭(새 페이지 진입) 시에만 이 로직이 실행됩니다.
        // 뒤로가기(Back) 시에는 이 플래그가 없으므로 브라우저가 스크롤을 복원합니다.
        // 또한, Template은 Page보다 상위에 있으므로 Loading 상태에서도 스크롤을 제어할 수 있습니다.
        const shouldReset = sessionStorage.getItem(SCROLL_RESET_KEY);

        if (shouldReset) {
            window.scrollTo(0, 0);
            sessionStorage.removeItem(SCROLL_RESET_KEY);
        }
    }, []);

    return <>{children}</>;
}
