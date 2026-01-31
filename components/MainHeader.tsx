"use client";

import Link from "next/link";
import { useI18n } from "@/context/I18nContext";
import { ROUTES } from "@/lib/routes";
import Header from "@/components/Header";
import NavDivider from "@/components/NavDivider";
import Logo from "@/components/Logo";
import AuthButton from "@/components/auth/AuthButton";

interface MainHeaderProps {
  /** 홈페이지처럼 스크롤 시 배경이 사라지는 효과를 줄지 여부 */
  transparentOnScroll?: boolean;
  /** 홈 특유의 서브헤더(슬로건) 노출 여부 */
  showSubHeader?: boolean;
}

export default function MainHeader({
  transparentOnScroll = false,
  showSubHeader = false,
}: MainHeaderProps) {
  const { dict } = useI18n();

  return (
    <Header
      scrolledClassName={
        transparentOnScroll
          ? "bg-layout-transparent border-none-layout"
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-4">
          <Link
            href={ROUTES.QUIZ}
            className="text-sm font-bold text-zinc-500 hover:text-main transition-colors"
          >
            {dict.quiz.title}
          </Link>

          {showSubHeader && (
            <>
              <NavDivider />
              <span className="hidden sm:inline text-sm text-zinc-500">
                {dict.home.subHeader}
              </span>
            </>
          )}

          <NavDivider />
          <AuthButton />
        </nav>
      </div>
    </Header>
  );
}
