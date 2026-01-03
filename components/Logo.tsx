"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface LogoProps {
  name: string;
}

export default function Logo({ name }: LogoProps) {
  const pathname = usePathname();

  const handleClick = () => {
    // 만약 현재 페이지가 홈('/')이고 쿼리 파라미터가 없다면
    // Link의 기본 동작만으로는 스크롤이 안 올라갈 수 있으므로 강제 스크롤
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Link
      href="/"
      scroll={true}
      onClick={handleClick}
      className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 cursor-pointer hover:opacity-80 transition-opacity"
    >
      {name}
    </Link>
  );
}
