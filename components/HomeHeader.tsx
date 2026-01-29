"use client";

import Link from "next/link";
import { useI18n } from "@/context/I18nContext";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import NavDivider from "@/components/NavDivider";
import AuthButton from "@/components/auth/AuthButton";

export default function HomeHeader() {
  const { dict } = useI18n();

  return (
    <Header scrolledClassName="bg-layout-transparent border-none-layout">
      <div className="flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-4">
          <Link
            href="/quiz"
            className="text-sm font-bold text-zinc-500 hover:text-main transition-colors"
          >
            {dict.quiz.title}
          </Link>
          {/* 모바일이 아닐 때만 구분선과 서브헤더 표시 */}
          <NavDivider />
          <span className="hidden sm:inline text-sm text-zinc-500">
            {dict.home.subHeader}
          </span>
          <NavDivider />
          <AuthButton />
        </nav>
      </div>
    </Header>
  );
}
