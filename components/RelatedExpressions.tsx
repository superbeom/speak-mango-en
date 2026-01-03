"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Expression } from "@/types/database";
import ExpressionCard from "@/components/ExpressionCard";

interface RelatedExpressionsProps {
  expressions: Expression[];
  locale: string;
  title: string;
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
  locale,
  title,
}: RelatedExpressionsProps) {
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // 무한 루프를 위해 데이터를 복제합니다.
  // 데이터가 너무 적으면 화면을 다 채우지 못할 수 있으므로 최소 2회 복제
  const displayExpressions = [...expressions, ...expressions];

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();

    const el = scrollContainerRef.current;
    if (!el) return;

    // 현재 스크롤 위치를 기준으로 정밀 누적값 초기화
    // 브라우저가 scrollLeft를 정수로 관리할 경우, 0.3 같은 작은 값을 더하면
    // 버림 처리되어 스크롤이 움직이지 않는 현상을 방지하기 위해 변수로 관리함.
    let accumulatedScroll = el.scrollLeft;

    const autoScroll = () => {
      // 스크롤 속도 조절 (0.3: 매우 느림, 0.5: 느림, 1.0: 보통)
      const speed = 0.3;
      accumulatedScroll += speed;
      el.scrollLeft = accumulatedScroll;

      // 절반 지점(원본의 끝)에 도달하면 처음으로 순간 이동 (무한 루프 트릭)
      // scrollWidth의 절반은 원본 아이템들의 총 너비입니다.
      if (accumulatedScroll >= el.scrollWidth / 2) {
        accumulatedScroll = 0;
        el.scrollLeft = 0;
      }

      checkScroll();
      animationRef.current = requestAnimationFrame(autoScroll);
    };

    if (!isHovered && expressions.length > 0) {
      animationRef.current = requestAnimationFrame(autoScroll);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isHovered, expressions, checkScroll]);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  return (
    <section className="mt-16 pt-16 border-t border-zinc-200 dark:border-zinc-800">
      <h2 className="mb-4 px-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>

      <div
        className="relative group/scroll"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left Fade */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-16 bg-linear-to-r from-zinc-50 to-transparent dark:from-black z-10 pointer-events-none transition-opacity duration-300 ${
            showLeftFade ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Right Fade */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-16 bg-linear-to-l from-zinc-50 to-transparent dark:from-black z-10 pointer-events-none transition-opacity duration-300 ${
            showRightFade ? "opacity-100" : "opacity-0"
          }`}
        />

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
              >
                <ExpressionCard item={item} locale={locale} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
