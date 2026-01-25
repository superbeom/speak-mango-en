import Link from "next/link";
import { SERVICE_NAME } from "@/constants";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import NavDivider from "@/components/NavDivider";
import AuthButton from "@/components/auth/AuthButton";

interface HomeHeaderProps {
  quizText: string;
  subHeaderText: string;
}

export default function HomeHeader({
  quizText,
  subHeaderText,
}: HomeHeaderProps) {
  return (
    <Header scrolledClassName="bg-layout-transparent border-none-layout">
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
          <NavDivider />
          <span className="hidden sm:inline text-sm text-zinc-500">
            {subHeaderText}
          </span>
          <NavDivider />
          <AuthButton />
        </nav>
      </div>
    </Header>
  );
}
