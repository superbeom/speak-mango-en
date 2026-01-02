"use client";

import { useState, useEffect, useRef } from "react";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [expressions]);

  return (
    <section className="mt-16 pt-16 border-t border-zinc-200 dark:border-zinc-800">
      <h2 className="mb-4 px-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>

      <div className="relative group/scroll">
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
            {expressions.map((item) => (
              <motion.div
                key={item.id}
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
