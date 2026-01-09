"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useExpressionStore } from "@/context/ExpressionContext";

interface UseScrollRestorationProps {
    cacheKey: string;
}

/**
 * 리스트의 스크롤 위치를 추적하고 복원하는 로직을 담당하는 커스텀 훅입니다.
 * 필터별로 독립된 스크롤 위치를 전역 Context 캐시에 실시간으로 저장하고,
 * 컴포넌트 마운트 시 저장된 위치로 정밀하게(Recursive RAF) 복원합니다.
 */
export function useScrollRestoration({ cacheKey }: UseScrollRestorationProps) {
    const { cache, updateScrollPosition } = useExpressionStore();
    const cachedState = cache[cacheKey];

    // 스크롤 복원 작업이 활발히 진행 중인지 여부를 추적합니다.
    // 복원이 완료되기 전(isRestored = false)에는 현재의 스크롤 위치(보통 0)를 캐시에 저장하여
    // 이전의 유효한 위치 데이터를 덮어쓰지 않도록 보호합니다.
    const isRestored = useRef(false);

    // 1. 실시간 스크롤 위치 저장 (Throttled Tracking)
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleScroll = () => {
            // 복원이 완료된 후(isRestored = true)에만 현재 위치를 캐시에 기록합니다.
            if (!isRestored.current) return;

            // 잦은 상태 업데이트(리렌더링 유발)를 방지하기 위해 200ms 단위로 기록합니다.
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                updateScrollPosition(cacheKey, window.scrollY);
            }, 200);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
            clearTimeout(timeoutId);
        };
    }, [cacheKey, updateScrollPosition]);

    // 2. 스크롤 복원 로직 (재귀적 requestAnimationFrame 방식)
    // 데이터 로딩에 따라 DOM 높이가 변하는 상황에서도 목표 위치에 도달할 때까지 여러 프레임에 걸쳐 시도합니다.
    useLayoutEffect(() => {
        if (typeof window === "undefined") return;

        const targetPosition = cachedState?.scrollPosition || 0;

        // 브라우저의 전역적인 기본 스크롤 복원 기능과 충돌하지 않도록 수동(manual) 모드로 강제 설정합니다.
        // 이를 통해 Next.js/Browser가 맘대로 스크롤을 튀게 하는 현상을 방지합니다.
        if ("scrollRestoration" in history) {
            history.scrollRestoration = "manual";
        }

        // 저장된 위치가 없으면 즉시 상단으로 이동하고 복원 완료 처리
        if (targetPosition <= 0) {
            window.scrollTo(0, 0);
            isRestored.current = true;
            return;
        }

        // 복원 시작 시 플래그 초기화
        isRestored.current = false;

        let rafId: number;
        let attempts = 0;
        const maxAttempts = 60; // 약 1초(60fps 기준) 동안 복원을 끊임없이 시도합니다.

        const performScroll = () => {
            window.scrollTo(0, targetPosition);
            attempts++;

            // 목표 위치에 충분히 근접(5px 오차 범위)했거나 
            // 시도 횟수를 초과(데이터가 없어 높이가 안 잡힌 경우 등)하면 종료합니다.
            if (
                Math.abs(window.scrollY - targetPosition) < 5 ||
                attempts >= maxAttempts
            ) {
                // 복원 직후의 미세한 스크롤 이벤트를 무시하기 위해 약간의 유예 시간을 둡니다.
                setTimeout(() => {
                    isRestored.current = true;
                }, 100);
                return;
            }

            // 레이아웃이 유동적인 상황(이미지 로딩, 폰트 렌더링 등)에 대응하기 위해 RAF로 반복 호출합니다.
            rafId = requestAnimationFrame(performScroll);
        };

        rafId = requestAnimationFrame(performScroll);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);

            // 컴포넌트 언마운트 시(상세 페이지 진입 등) 전역 설정을 다시 'auto'로 복구합니다.
            // 이는 상세 페이지나 다른 페이지의 스크롤 동작에 사이드 이펙트를 주지 않기 위함입니다.
            if ("scrollRestoration" in history) {
                history.scrollRestoration = "auto";
            }
        };
    }, [cacheKey, cachedState?.scrollPosition]); // cacheKey가 바뀌면(필터 변경) 새로 복원 시도
}
