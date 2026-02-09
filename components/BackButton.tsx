"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

interface BackButtonProps {
  label: string;
  className?: string;
  /**
   * 뒤로가기 버튼 클릭 시 이동할 경로를 명시적으로 지정합니다.
   * 지정하지 않을 경우, 기본적으로 `router.back()` (또는 히스토리 상태에 따라 홈으로 이동)을 수행합니다.
   */
  href?: string;
}

export default function BackButton({
  label,
  className,
  href,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // 명시적으로 이동할 경로가 지정된 경우 우선 처리
    if (href) {
      router.push(href);
      return;
    }

    // 구글 로그인 후 돌아왔을 때 뒤로가기를 누르면 다시 구글 로그인 페이지로 가는 것을 방지
    // 히스토리: [이전페이지] -> [현재페이지(비로그인)] -> [구글로그인] -> [현재페이지(로그인)]
    // 따라서 3단계를 뒤로 가야 실제 이전 페이지로 갈 수 있음
    const isBackToLogin =
      document.referrer && document.referrer.includes("accounts.google.com");

    if (isBackToLogin) {
      if (window.history.length > 3) {
        window.history.go(-3);
      } else {
        router.push(ROUTES.HOME);
      }
      return;
    }

    // 브라우저 히스토리가 있으면 뒤로가기, 없으면(새 탭 등) 홈으로 이동
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(ROUTES.HOME);
    }
  };

  return (
    <button
      onClick={handleBack}
      type="button"
      className={cn(
        "group flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors cursor-pointer",
        className,
      )}
    >
      <span className="transition-transform group-hover:-translate-x-1">←</span>{" "}
      {label}
    </button>
  );
}
