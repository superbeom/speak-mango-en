"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackRelatedClick } from "@/analytics";
import { useI18n } from "@/context/I18nContext";
import { Expression } from "@/types/database";
import ExpressionCard from "@/components/ExpressionCard";

interface RelatedExpressionsProps {
  expressions: Expression[];
  currentExpressionId: string; // 현재 표현 ID (Analytics용)
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.21, 0.47, 0.32, 0.98] as const,
    },
  },
};

export default function RelatedExpressions({
  expressions,
  currentExpressionId,
}: RelatedExpressionsProps) {
  const { dict } = useI18n();

  const handleCardClick = (toExpressionId: string) => {
    // Track related expression click
    trackRelatedClick({
      fromExpressionId: currentExpressionId,
      toExpressionId: toExpressionId,
    });
  };

  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverDirection, setHoverDirection] = useState<"left" | "right" | null>(
    null,
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // 무한 루프를 위해 데이터를 복제합니다. (데스크탑 전용)
  // 데이터가 너무 적으면 화면을 다 채우지 못할 수 있으므로 최소 2회 복제
  const displayExpressions = [...expressions, ...expressions];

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    // 요소가 화면에 보이는지 확인 (데스크탑 모드인지 체크)
    // 요소가 없거나, CSS로 숨겨진 상태(모바일)라면 불필요한 연산 방지
    if (!el || el.offsetParent === null) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();

    const el = scrollContainerRef.current;
    if (!el) return;

    // 현재 스크롤 위치를 기준으로 정밀 누적값 초기화
    let accumulatedScroll = el.scrollLeft;

    const autoScroll = () => {
      // 모바일에서는 요소가 숨겨져 있으므로 애니메이션 연산을 일시 중지하여 성능 최적화
      if (!el.offsetParent) {
        animationRef.current = requestAnimationFrame(autoScroll);
        return;
      }

      // 기본 속도 0.3, 페이드 호버 시 속도 4.0 (약 13배 가속)
      let speed = 0.3;
      if (hoverDirection === "left") speed = -4.0;
      else if (hoverDirection === "right") speed = 4.0;

      accumulatedScroll += speed;
      el.scrollLeft = accumulatedScroll;

      // 무한 루프 트릭 (양방향 대응)
      const halfWidth = el.scrollWidth / 2;
      if (accumulatedScroll >= halfWidth) {
        accumulatedScroll -= halfWidth;
        el.scrollLeft = accumulatedScroll;
      } else if (accumulatedScroll < 0) {
        accumulatedScroll += halfWidth;
        el.scrollLeft = accumulatedScroll;
      }

      checkScroll();
      animationRef.current = requestAnimationFrame(autoScroll);
    };

    // 호버 중이 아니거나, 특정 방향(페이드)으로 호버 중일 때 애니메이션 실행
    if ((!isHovered || hoverDirection) && expressions.length > 0) {
      animationRef.current = requestAnimationFrame(autoScroll);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isHovered, hoverDirection, expressions, checkScroll]);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  return (
    <>
      {/* 모바일 뷰: 세로 리스트 */}
      <section className="mt-12 pt-12 block sm:hidden">
        <h2 className="mb-6 text-xl font-bold text-main">
          {dict.detail.relatedTitle}
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {expressions.map((item) => (
            <div key={item.id} onClick={() => handleCardClick(item.id)}>
              <ExpressionCard item={item} />
            </div>
          ))}
        </div>
      </section>

      {/* 데스크탑 뷰: 가로 자동 스크롤 (Marquee) */}
      <section className="mt-16 pt-16 hidden sm:block">
        <h2 className="mb-4 px-4 text-2xl font-bold text-main">
          {dict.detail.relatedTitle}
        </h2>

        <div
          className="relative group/scroll"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setHoverDirection(null);
          }}
        >
          <motion.div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 px-4 pt-4"
          >
            <AnimatePresence mode="popLayout">
              {displayExpressions.map((item, index) => (
                <motion.div
                  key={`${item.id}-${index}`} // 복제된 아이템이므로 고유 키 생성
                  variants={itemVariants}
                  className="min-w-72 sm:min-w-80 flex-1"
                  onClick={() => handleCardClick(item.id)}
                >
                  <ExpressionCard item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Left Fade */}
          <div
            onMouseEnter={() => setHoverDirection("left")}
            onMouseLeave={() => setHoverDirection(null)}
            className={`absolute left-0 top-0 bottom-0 w-24 z-20 bg-linear-to-r fade-mask-base cursor-w-resize ${
              showLeftFade ? "fade-mask-visible" : "fade-mask-hidden"
            }`}
          />

          {/* Right Fade */}
          <div
            onMouseEnter={() => setHoverDirection("right")}
            onMouseLeave={() => setHoverDirection(null)}
            className={`absolute right-0 top-0 bottom-0 w-24 z-20 bg-linear-to-l fade-mask-base cursor-e-resize ${
              showRightFade ? "fade-mask-visible" : "fade-mask-hidden"
            }`}
          />
        </div>
      </section>
    </>
  );
}
