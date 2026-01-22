"use client";

import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SERVICE_NAME } from "@/constants";
import Header from "@/components/Header";
import Logo from "@/components/Logo";

interface HomeHeaderProps {
  quizText: string;
  subHeaderText: string;
}

export default function HomeHeader({
  quizText,
  subHeaderText,
}: HomeHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <Header>
      <div className="flex items-center justify-between">
        <Logo name={SERVICE_NAME} />
        <nav className="flex items-center gap-4">
          <Link
            href="/quiz"
            className="text-sm font-bold text-zinc-500 hover:text-main transition-colors"
          >
            {quizText}
          </Link>
          {/* 모바일이 아닐 때만 구분선과 서브헤더 표시 */}
          {!isMobile && (
            <>
              <span className="text-sm text-disabled">|</span>
              <span className="text-sm text-zinc-500">{subHeaderText}</span>
            </>
          )}
        </nav>
      </div>
    </Header>
  );
}
