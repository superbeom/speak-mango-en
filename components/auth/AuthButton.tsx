"use client";

import { useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import LoginModal from "./LoginModal";
import UserMenu from "./UserMenu";

export default function AuthButton() {
  const { dict } = useI18n();
  const { user, status } = useAuthUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Loading skeleton
  if (status === "loading") {
    return <div className="skeleton-avatar" />;
  }

  // Logged In: User Menu
  if (user) {
    return <UserMenu user={user} />;
  }

  // Logged Out: Sign In Button
  return (
    <>
      <button onClick={() => setIsModalOpen(true)} className="btn-sign-in">
        {dict.auth.signIn}
      </button>

      <LoginModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
