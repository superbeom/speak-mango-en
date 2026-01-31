"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import LoginModal from "@/components/auth/LoginModal";

export default function LoginRequiredView() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // If modal is closed without authentication, redirect to home
    if (!isOpen) {
      router.push(ROUTES.HOME);
    }
  }, [isOpen, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-layout px-4 text-center">
      <LoginModal isOpen={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}
